import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import "./styles.css";
import type {
  ApiJob,
  ApiMetrics,
  ApiStage,
  ApiUser,
  Application,
  Language,
  Stage,
  StageId,
} from "./types";
import { stagesByLanguage } from "./data";
import { t } from "./i18n";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Kanban from "./components/Kanban";
import Card from "./components/Card";
import { api, apiConfig, ApiError } from "./services/api";

const stageNameToId: Record<string, StageId> = {
  Applied: "applied",
  "HR Response": "hr_response",
  Screening: "screening",
  "Tech Interview": "tech",
  Homework: "homework",
  Final: "final",
  Offer: "offer",
  Rejected: "rejected",
};

const stageLabels: Record<StageId, { ru: string; en: string }> = {
  applied: { ru: "Отклик", en: "Applied" },
  hr_response: { ru: "Ответ HR", en: "HR Response" },
  screening: { ru: "Скрининг", en: "Screening" },
  tech: { ru: "Тех интервью", en: "Tech" },
  homework: { ru: "Тестовое", en: "Homework" },
  final: { ru: "Финал", en: "Final" },
  offer: { ru: "Оффер", en: "Offer" },
  rejected: { ru: "Отказ", en: "Rejected" },
};

const sourceOptions: Record<Language, string[]> = {
  ru: [
    "LinkedIn",
    "Telegram",
    "HH.ru",
    "Indeed",
    "Jooble",
    "Реферал",
    "Сайт компании",
    "Email",
    "Другое",
  ],
  en: [
    "LinkedIn",
    "Telegram",
    "Indeed",
    "Jooble",
    "Referral",
    "Company site",
    "Email",
    "Other",
  ],
};

const isActiveStage = (stage: StageId) => stage !== "rejected";

const formatDate = (value: string | null) => {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
};

const lastTouchFromJob = (job: ApiJob) => {
  const dates = [
    job.rejected_at,
    job.offer_at,
    job.final_at,
    job.homework_at,
    job.tech_interview_at,
    job.screening_at,
    job.hr_response_at,
    job.applied_at,
  ].filter(Boolean) as string[];
  if (!dates.length) {
    return "";
  }
  return formatDate(dates[0]);
};

const toApplication = (job: ApiJob, stages: ApiStage[]): Application => {
  const stage = stages.find((item) => item.id === job.stage_id);
  const stageId = stage ? stageNameToId[stage.name] : "applied";
  return {
    id: job.id,
    company: job.company,
    role: job.position,
    location: job.stack ?? "",
    salary: job.salary ?? "",
    notes: job.notes ?? "",
    stage: stageId,
    appliedAt: formatDate(job.applied_at),
    lastTouch: lastTouchFromJob(job),
    priority: (job.priority as Application["priority"]) ?? "medium",
    source: job.source ?? "",
  };
};

const toCreatePayload = (draft: Application, stageIdMap: Record<StageId, number>) => ({
  company: draft.company,
  position: draft.role,
  source: draft.source || null,
  salary: draft.salary || null,
  stack: draft.location || null,
  notes: draft.notes || null,
  priority: draft.priority,
  stage_id: stageIdMap[draft.stage],
  applied_at: draft.appliedAt || null,
});

const toUpdatePayload = (draft: Application) => ({
  company: draft.company,
  position: draft.role,
  source: draft.source || null,
  salary: draft.salary || null,
  stack: draft.location || null,
  notes: draft.notes || null,
  priority: draft.priority,
  applied_at: draft.appliedAt || null,
});

const App = () => {
  const [lang, setLang] = useState<Language>("ru");
  const [query, setQuery] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragSize, setDragSize] = useState<{ width: number; height: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Application | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [apiStages, setApiStages] = useState<ApiStage[]>([]);
  const [metrics, setMetrics] = useState<ApiMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<ApiUser | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  const stageIdMap = useMemo(() => {
    const map: Record<StageId, number> = {
      applied: 0,
      hr_response: 0,
      screening: 0,
      tech: 0,
      homework: 0,
      final: 0,
      offer: 0,
      rejected: 0,
    };
    apiStages.forEach((stage) => {
      const id = stageNameToId[stage.name];
      if (id) {
        map[id] = stage.id;
      }
    });
    return map;
  }, [apiStages]);

  const stages = useMemo<Stage[]>(() => {
    if (!apiStages.length) {
      return stagesByLanguage[lang];
    }
    const sorted = [...apiStages].sort((a, b) => a.order_index - b.order_index);
    return sorted
      .map((stage) => {
        const id = stageNameToId[stage.name];
        if (!id) {
          return null;
        }
        return { id, title: stageLabels[id][lang] };
      })
      .filter(Boolean) as Stage[];
  }, [apiStages, lang]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setAuthRequired(false);
      try {
        const me = await api.getMe();
        if (!active) {
          return;
        }
        setAuthUser(me);
        const [stagesResult, jobsResult, metricsResult] = await Promise.all([
          api.getStages(),
          api.getJobs(),
          api.getMetrics(),
        ]);
        if (!active) {
          return;
        }
        setApiStages(stagesResult);
        setApplications(jobsResult.map((job) => toApplication(job, stagesResult)));
        setMetrics(metricsResult);
      } catch (err) {
        if (!active) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          setAuthRequired(true);
          setAuthUser(null);
          setLoading(false);
          return;
        }
        setError(String(err));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return applications;
    }
    const normalized = query.trim().toLowerCase();
    return applications.filter((app) => {
      return (
        app.company.toLowerCase().includes(normalized) ||
        app.role.toLowerCase().includes(normalized) ||
        app.source.toLowerCase().includes(normalized)
      );
    });
  }, [applications, query]);

  const counts = useMemo(() => {
    const stageCounts: Record<StageId, number> = {
      applied: 0,
      hr_response: 0,
      screening: 0,
      tech: 0,
      homework: 0,
      final: 0,
      offer: 0,
      rejected: 0,
    };
    if (metrics?.stage_counts?.length) {
      metrics.stage_counts.forEach((item) => {
        const stageId = stageNameToId[item.stage_name];
        if (stageId) {
          stageCounts[stageId] = item.count;
        }
      });
      return stageCounts;
    }
    applications.forEach((app) => {
      stageCounts[app.stage] += 1;
    });
    return stageCounts;
  }, [applications, metrics]);

  const metricsCards = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((app) => isActiveStage(app.stage)).length;
    const offers = counts.offer;
    const rejections = counts.rejected;

    return [
      {
        label: t(lang, "total"),
        value: total.toString(),
        delta: lang === "ru" ? "Подтягиваем из API" : "Synced from API",
        tone: "neutral" as const,
      },
      {
        label: t(lang, "active"),
        value: active.toString(),
        delta: lang === "ru" ? "В работе сейчас" : "In flight",
        tone: "positive" as const,
      },
      {
        label: t(lang, "offers"),
        value: offers.toString(),
        delta: lang === "ru" ? "Финальные решения" : "Decision stage",
        tone: "positive" as const,
      },
      {
        label: t(lang, "rejections"),
        value: rejections.toString(),
        delta: lang === "ru" ? "Анализировать причины" : "Review reasons",
        tone: "negative" as const,
      },
    ];
  }, [applications, counts, lang]);

  const averageResponse = useMemo(() => {
    if (metrics?.avg_hr_response_days == null) {
      return 0;
    }
    return Math.max(1, Math.round(metrics.avg_hr_response_days));
  }, [metrics]);

  const conversion = useMemo(() => {
    if (!metrics?.conversions?.length) {
      return [] as { label: string; value: string }[];
    }
    return metrics.conversions.slice(0, 3).map((item) => {
      const fromId = stageNameToId[item.from_stage_name];
      const toId = stageNameToId[item.to_stage_name];
      const label =
        fromId && toId
          ? `${stageLabels[fromId][lang]} → ${stageLabels[toId][lang]}`
          : `${item.from_stage_name} → ${item.to_stage_name}`;
      const rate = item.conversion_rate == null ? 0 : Math.round(item.conversion_rate * 100);
      return { label, value: `${rate}%` };
    });
  }, [metrics, lang]);

  const funnel = useMemo(() => {
    if (!metrics?.stage_progress?.length) {
      return [] as { label: string; count: number; width: number; tone?: "rejected" }[];
    }
    const progressByName = new Map(
      metrics.stage_progress.map((item) => [item.stage_name, item.count])
    );
    const ordered = apiStages.length
      ? [...apiStages].sort((a, b) => a.order_index - b.order_index)
      : [];
    const items = ordered.map((stage) => {
      const stageId = stageNameToId[stage.name];
      const label = stageId ? stageLabels[stageId][lang] : stage.name;
      const count = progressByName.get(stage.name) ?? 0;
      return { label, count, tone: stage.name === "Rejected" ? "rejected" : undefined };
    });
    const max = Math.max(1, ...items.map((item) => item.count));
    return items.map((item) => ({
      ...item,
      width: Math.max(12, Math.round((item.count / max) * 100)),
    }));
  }, [metrics, apiStages, lang]);

  const moveToStage = async (id: number, stageId: StageId) => {
    if (authRequired) {
      return;
    }
    if (!stageIdMap[stageId]) {
      setError("Stage map is not ready. Reload the page.");
      return;
    }
    try {
      const updated = await api.updateJob(id, {
        stage_id: stageIdMap[stageId],
      });
      const mapped = toApplication(updated, apiStages);
      setApplications((prev) => prev.map((item) => (item.id === id ? mapped : item)));
      const metricsResult = await api.getMetrics();
      setMetrics(metricsResult);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthRequired(true);
        setAuthUser(null);
        setError(null);
        return;
      }
      setError(String(err));
    }
  };

  const handleDrop = useCallback(async (stageId: StageId) => {
    if (!draggingId) {
      return;
    }
    if (authRequired) {
      setDraggingId(null);
      return;
    }
    if (!stageIdMap[stageId]) {
      setError("Stage map is not ready. Reload the page.");
      setDraggingId(null);
      return;
    }
    try {
      const updated = await api.updateJob(draggingId, {
        stage_id: stageIdMap[stageId],
      });
      const mapped = toApplication(updated, apiStages);
      setApplications((prev) =>
        prev.map((item) => (item.id === draggingId ? mapped : item))
      );
      const metricsResult = await api.getMetrics();
      setMetrics(metricsResult);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthRequired(true);
        setAuthUser(null);
        setError(null);
        return;
      }
      setError(String(err));
    } finally {
      setDraggingId(null);
    }
  }, [apiStages, authRequired, draggingId, stageIdMap]);

  const handlePointerDown = (id: number, event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    setDraggingId(id);
    setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    setDragPosition({ x: rect.left, y: rect.top });
    setDragSize({ width: rect.width, height: rect.height });
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    suppressClickRef.current = false;
  };

  useEffect(() => {
    if (draggingId == null || !dragOffset) {
      return;
    }
    const handleMove = (event: PointerEvent) => {
      setDragPosition({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y,
      });
      if (dragStartRef.current && !suppressClickRef.current) {
        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;
        if (Math.hypot(dx, dy) > 4) {
          suppressClickRef.current = true;
        }
      }
    };
    const handleUp = (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY) as
        | HTMLElement
        | null;
      const column = element?.closest("[data-stage-id]") as HTMLElement | null;
      const stageId = column?.dataset.stageId as StageId | undefined;
      setDragOffset(null);
      setDragPosition(null);
      setDragSize(null);
      if (!suppressClickRef.current) {
        setDraggingId(null);
      } else if (stageId) {
        handleDrop(stageId);
      } else {
        setDraggingId(null);
      }
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [draggingId, dragOffset, handleDrop]);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    if (selectedId != null) {
      const selected = applications.find((application) => application.id === selectedId);
      if (selected) {
        setDraft({ ...selected });
      }
    }
  }, [modalOpen, selectedId, applications]);

  const handleDraftChange = <K extends keyof Application>(key: K, value: Application[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) {
      return;
    }
    if (authRequired) {
      setError("Auth required.");
      return;
    }
    try {
      if (isCreating) {
        if (!stageIdMap.applied) {
          setError("Stages are not loaded yet.");
          return;
        }
        const created = await api.createJob(toCreatePayload(draft, stageIdMap));
        const mapped = toApplication(created, apiStages);
        setApplications((prev) => [mapped, ...prev]);
      } else {
        const updated = await api.updateJob(draft.id, toUpdatePayload(draft));
        const mapped = toApplication(updated, apiStages);
        setApplications((prev) => prev.map((item) => (item.id === draft.id ? mapped : item)));
      }
      const metricsResult = await api.getMetrics();
      setMetrics(metricsResult);
      setModalOpen(false);
      setSelectedId(null);
      setIsEditing(false);
      setIsCreating(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthRequired(true);
        setAuthUser(null);
        setError(null);
        return;
      }
      setError(String(err));
    }
  };

  const openModalForCard = (id: number) => {
    if (draggingId || suppressClickRef.current || authRequired) {
      return;
    }
    setSelectedId(id);
    setIsEditing(false);
    setIsCreating(false);
    setModalOpen(true);
  };

  const openModalForNew = () => {
    if (authRequired) {
      setError("Auth required.");
      return;
    }
    const id = Math.floor(Math.random() * 1000000) * -1;
    setSelectedId(null);
    setDraft({
      id,
      company: t(lang, "newCard"),
      role: "",
      location: "",
      salary: "",
      notes: "",
      stage: "applied",
      appliedAt: "",
      lastTouch: "",
      priority: "medium",
      source: "",
    });
    setIsCreating(true);
    setIsEditing(true);
    setModalOpen(true);
  };

  return (
    <div className="app">
      <Header
        lang={lang}
        onLangChange={(next) => {
          document.documentElement.lang = next;
          setLang(next);
        }}
        onSearchChange={setQuery}
        userName={authUser?.name || authUser?.email || null}
        onLogin={() => {
          window.location.href = `${apiConfig.apiUrl}/auth/google/login`;
        }}
        onLogout={async () => {
          await api.logout();
          setAuthUser(null);
          setAuthRequired(true);
          setApplications([]);
          setMetrics(null);
        }}
      />
      <main>
        <Dashboard
          lang={lang}
          metrics={metricsCards}
          conversion={conversion}
          responseDays={averageResponse}
          funnel={funnel}
        />
        <section className="pipeline">
          <div className="pipeline__header">
            <div>
              <h2>{t(lang, "stageHeader")}</h2>
              {!authRequired ? <p>{t(lang, "dragHint")}</p> : null}
            </div>
            <button
              type="button"
              className="ghost"
              onClick={openModalForNew}
              disabled={authRequired}
            >
              {t(lang, "addCard")}
            </button>
          </div>
          {authRequired ? (
            <div className="notice">
              {lang === "ru"
                ? "Нужен вход через Google."
                : "Please sign in with Google."}
            </div>
          ) : null}
          {error && !authRequired ? (
            <div className="notice">
              API error: {error}
              <div className="notice__sub">
                Base URL: {apiConfig.apiUrl}
              </div>
            </div>
          ) : null}
          {loading ? <div className="notice">Loading...</div> : null}
          <Kanban
            lang={lang}
            stages={stages}
            applications={filtered}
            draggingId={draggingId}
            onPointerDown={handlePointerDown}
            canInteract={!authRequired}
            onMoveToStage={moveToStage}
            onOpen={openModalForCard}
          />
        </section>
      </main>
      {draggingId && dragPosition && dragSize ? (
        <div
          className="drag-overlay"
          style={{
            transform: `translate3d(${dragPosition.x}px, ${dragPosition.y}px, 0)`,
            width: `${dragSize.width}px`,
            height: `${dragSize.height}px`,
          }}
        >
          {(() => {
            const card = applications.find((item) => item.id === draggingId);
            if (!card) {
              return null;
            }
            return (
              <Card
                lang={lang}
                application={card}
                isDragging={false}
                isDisabled={true}
                stages={stages}
                onMoveToStage={() => {}}
                onPointerDown={(id, event) => {}}
                onOpen={() => {}}
              />
            );
          })()}
        </div>
      ) : null}
      {modalOpen && draft ? (
        <div
          className="modal"
          onClick={() => {
            setModalOpen(false);
            setSelectedId(null);
            setIsEditing(false);
            setIsCreating(false);
          }}
        >
          <div className="modal__card" onClick={(event) => event.stopPropagation()}>
            <header className="modal__header">
              <div>
                <div className="modal__company">{draft.company}</div>
                <div className="modal__role">{draft.role || "-"}</div>
              </div>
              <div className="modal__actions">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="modal__ghost"
                      onClick={() => {
                        if (selectedId != null) {
                          const selected = applications.find(
                            (application) => application.id === selectedId
                          );
                          if (selected) {
                            setDraft({ ...selected });
                          }
                        } else {
                          setModalOpen(false);
                          setIsCreating(false);
                        }
                        setIsEditing(false);
                      }}
                    >
                      {t(lang, "cancel")}
                    </button>
                    <button type="button" className="modal__primary" onClick={handleSave}>
                      {t(lang, "save")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="modal__primary"
                    onClick={() => setIsEditing(true)}
                  >
                    {t(lang, "edit")}
                  </button>
                )}
              </div>
            </header>
            <div className="modal__grid">
              <div className="field">
                <span className="field__label">{t(lang, "company")}</span>
                {isEditing ? (
                  <input
                    className="field__input"
                    type="text"
                    value={draft.company}
                    onChange={(event) => handleDraftChange("company", event.target.value)}
                  />
                ) : (
                  <div className="field__value">{draft.company}</div>
                )}
              </div>
              <div className="field">
                <span className="field__label">{t(lang, "role")}</span>
                {isEditing ? (
                  <input
                    className="field__input"
                    type="text"
                    value={draft.role}
                    onChange={(event) => handleDraftChange("role", event.target.value)}
                  />
                ) : (
                  <div className="field__value">{draft.role || "-"}</div>
                )}
              </div>
              <div className="field">
                <span className="field__label">{t(lang, "location")}</span>
                {isEditing ? (
                  <input
                    className="field__input"
                    type="text"
                    value={draft.location}
                    onChange={(event) => handleDraftChange("location", event.target.value)}
                  />
                ) : (
                  <div className="field__value">{draft.location || "-"}</div>
                )}
              </div>
              <div className="field">
                <span className="field__label">{t(lang, "salary")}</span>
                {isEditing ? (
                  <input
                    className="field__input"
                    type="text"
                    value={draft.salary}
                    onChange={(event) => handleDraftChange("salary", event.target.value)}
                  />
                ) : (
                  <div className="field__value">{draft.salary || "-"}</div>
                )}
              </div>
              <div className="field">
                <span className="field__label">{t(lang, "sourceLabel")}</span>
                {isEditing ? (
                  <>
                    <input
                      className="field__input"
                      type="text"
                      list="source-options"
                      value={draft.source}
                      onChange={(event) => handleDraftChange("source", event.target.value)}
                    />
                    <datalist id="source-options">
                      {sourceOptions[lang].map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <div className="field__value">{draft.source || "-"}</div>
                )}
              </div>
              <div className="field">
                <span className="field__label">{t(lang, "priority")}</span>
                {isEditing ? (
                  <select
                    className="field__input"
                    value={draft.priority}
                    onChange={(event) =>
                      handleDraftChange("priority", event.target.value as Application["priority"])
                    }
                  >
                    <option value="low">{t(lang, "low")}</option>
                    <option value="medium">{t(lang, "medium")}</option>
                    <option value="high">{t(lang, "high")}</option>
                  </select>
                ) : (
                  <div className="field__value">{t(lang, draft.priority)}</div>
                )}
              </div>
              <div className="field">
                <span className="field__label">{t(lang, "appliedAt")}</span>
                {isEditing ? (
                  <input
                    className="field__input"
                    type="date"
                    value={draft.appliedAt}
                    onChange={(event) => handleDraftChange("appliedAt", event.target.value)}
                  />
                ) : (
                  <div className="field__value">{draft.appliedAt || "-"}</div>
                )}
              </div>
              <div className="field">
                <span className="field__label">{t(lang, "lastTouchAt")}</span>
                <div className="field__value">{draft.lastTouch || "-"}</div>
              </div>
              <div className="field field--full">
                <span className="field__label">{t(lang, "notes")}</span>
                {isEditing ? (
                  <textarea
                    className="field__input"
                    rows={5}
                    value={draft.notes}
                    onChange={(event) => handleDraftChange("notes", event.target.value)}
                  />
                ) : (
                  <div className="field__value field__value--multiline">
                    {draft.notes || "-"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default App;






