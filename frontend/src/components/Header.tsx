import type { Language } from "../types";
import { t } from "../i18n";

type HeaderProps = {
  lang: Language;
  onLangChange: (lang: Language) => void;
  onSearchChange: (value: string) => void;
  userName: string | null;
  onLogin: () => void;
  onLogout: () => void;
};

const Header = ({
  lang,
  onLangChange,
  onSearchChange,
  userName,
  onLogin,
  onLogout,
}: HeaderProps) => {
  return (
    <header className="hero">
      <div className="hero__intro">
        <div className="hero__badge">Job Search Funnel Tracker</div>
        <h1>{t(lang, "appTitle")}</h1>
        <p>{t(lang, "subtitle")}</p>
      </div>
      <div className="hero__controls">
        <div className="control auth">
          <label>{t(lang, "signedInAs")}</label>
          <div className="auth__row">
            {userName ? (
              <div className="auth__signed">
                <span className="auth__user">{userName}</span>
              </div>
            ) : (
              <button type="button" className="auth__button" onClick={onLogin}>
                {t(lang, "loginGoogle")}
              </button>
            )}
            {userName ? (
              <button type="button" className="auth__button" onClick={onLogout}>
                {t(lang, "logout")}
              </button>
            ) : null}
          </div>
        </div>
        <div className="control">
          <label>{t(lang, "toggleLabel")}</label>
          <div className="segmented">
            <button
              type="button"
              className={lang === "ru" ? "is-active" : ""}
              onClick={() => onLangChange("ru")}
            >
              RU
            </button>
            <button
              type="button"
              className={lang === "en" ? "is-active" : ""}
              onClick={() => onLangChange("en")}
            >
              EN
            </button>
          </div>
        </div>
        <div className="control search">
          <label htmlFor="search">{t(lang, "searchLabel")}</label>
          <input
            id="search"
            type="search"
            placeholder={t(lang, "searchPlaceholder")}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
