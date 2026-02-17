import { t } from "../i18n";
import type { PointerEvent } from "react";
import type { Application, Language, Stage } from "../types";

const priorityLabels: Record<
  Language,
  Record<Application["priority"], { label: string; className: string }>
> = {
  ru: {
    high: { label: "Высокий", className: "priority priority--high" },
    medium: { label: "Средний", className: "priority priority--medium" },
    low: { label: "Низкий", className: "priority priority--low" },
  },
  en: {
    high: { label: "High", className: "priority priority--high" },
    medium: { label: "Medium", className: "priority priority--medium" },
    low: { label: "Low", className: "priority priority--low" },
  },
};

type CardProps = {
  lang: Language;
  application: Application;
  isDragging: boolean;
  isDisabled: boolean;
  stages: Stage[];
  onMoveToStage: (id: number, stageId: Stage["id"]) => void;
  onPointerDown: (id: number, event: PointerEvent<HTMLElement>) => void;
  onOpen: (id: number) => void;
};

const Card = ({
  lang,
  application,
  isDragging,
  isDisabled,
  stages,
  onMoveToStage,
  onPointerDown,
  onOpen,
}: CardProps) => {
  const priorityKey =
    application.priority in priorityLabels[lang]
      ? application.priority
      : ("medium" as Application["priority"]);
  const priority = priorityLabels[lang][priorityKey];

  return (
    <article
      className={`card${isDragging ? " card--ghost" : ""}`}
      onPointerDown={(event) => {
        if (isDisabled) {
          return;
        }
        const target = event.target as HTMLElement;
        if (target.closest("button, input, textarea, select")) {
          return;
        }
        onPointerDown(application.id, event);
      }}
      onClick={() => onOpen(application.id)}
    >
      <header className="card__header">
        <h4 className="card__company">{application.company}</h4>
        <p className="card__role">{application.role}</p>
        <span className={priority.className}>{priority.label}</span>
      </header>
      <div className="card__meta">
        <span>{application.location}</span>
        <span>{application.salary}</span>
      </div>
      <p className="card__notes">{application.notes}</p>
      <div className="card__tags">
        <span>{t(lang, "source")}: {application.source}</span>
        <span>{t(lang, "applied")}: {application.appliedAt}</span>
        <span>{t(lang, "lastTouch")}: {application.lastTouch}</span>
      </div>
      <div className="card__actions">
        <span className="card__select-label">{t(lang, "moveTo")}</span>
        <select
          className="card__select"
          value={application.stage}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation();
            onMoveToStage(application.id, event.target.value as Stage["id"]);
          }}
          disabled={isDisabled}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.title}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
};

export default Card;

