import type { Language } from "../types";

export type FunnelItem = {
  label: string;
  count: number;
  width: number;
};

type FunnelProps = {
  lang: Language;
  items: FunnelItem[];
};

const Funnel = ({ lang, items }: FunnelProps) => {
  if (!items.length) {
    return null;
  }

  return (
    <section className="funnel">
      <div className="funnel__title">{lang === "ru" ? "Воронка" : "Funnel"}</div>
      <div className="funnel__stack">
        {items.map((item) => (
          <div key={item.label} className="funnel__row">
            <div className="funnel__bar" style={{ width: `${item.width}%` }}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Funnel;
