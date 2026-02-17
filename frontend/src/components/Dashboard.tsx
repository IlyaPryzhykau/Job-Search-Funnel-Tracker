import { t } from "../i18n";
import type { Language } from "../types";

type Metric = {
  label: string;
  value: string;
  delta?: string;
  tone?: "positive" | "negative" | "neutral";
};

type DashboardProps = {
  lang: Language;
  metrics: Metric[];
  conversion: { label: string; value: string }[];
  responseDays: number;
  funnel: { label: string; count: number; width: number; tone?: "rejected" }[];
};

const Dashboard = ({ lang, metrics, conversion, responseDays, funnel }: DashboardProps) => {
  return (
    <section className="dashboard">
      <div className="dashboard__header">
        <div>
          <h2>{t(lang, "dashboard")}</h2>
          <p>{t(lang, "insights")}</p>
        </div>
        <div className="badge">
          {t(lang, "avgResponse")} <strong>{responseDays}</strong> {t(lang, "days")}
        </div>
      </div>
      <div className="dashboard__grid">
        {metrics.map((metric) => (
          <article key={metric.label} className={`metric metric--${metric.tone ?? "neutral"}`}>
            <span>{metric.label}</span>
            <h3>{metric.value}</h3>
            {metric.delta ? <em>{metric.delta}</em> : null}
          </article>
        ))}
      </div>
      <div className="conversion">
        <div className="conversion__title">{t(lang, "conversion")}</div>
        <div className="conversion__grid">
          {conversion.map((item) => (
            <div key={item.label} className="conversion__card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
      {funnel.length ? (
        <div className="dashboard__funnel">
          <div className="conversion__title">{lang === "ru" ? "Воронка" : "Funnel"}</div>
          <div className="funnel__stack">
            {funnel.map((item) => (
              <div key={item.label} className="funnel__row">
                <div
                  className={`funnel__bar${item.tone === "rejected" ? " funnel__bar--rejected" : ""}`}
                  style={{ width: `${item.width}%` }}
                >
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Dashboard;
