import { useEffect, useRef, useState } from "react";

// Small pieces copied from the main FOCAS site (bigin/formKit.jsx, fs/shared.jsx)
// so this project stands on its own.

export const DIAL_CODES = ["+91", "+1", "+44", "+61", "+971", "+65", "+60", "+64"];

// Read utm_* params from the current URL, persisting first-touch values so a
// parent who lands from an ad and registers on a later visit is still attributed.
export function captureUtms() {
  const qs = new URLSearchParams(window.location.search);
  const fromUrl = {
    utmSource: qs.get("utm_source") || "",
    utmMedium: qs.get("utm_medium") || "",
    utmCampaign: qs.get("utm_campaign") || "",
    utmContent: qs.get("utm_content") || "",
    utmTerm: qs.get("utm_term") || "",
    landingUrl: window.location.href,
    referrer: document.referrer || "",
  };
  try {
    if (fromUrl.utmSource) {
      localStorage.setItem("focas_utms", JSON.stringify(fromUrl));
      return fromUrl;
    }
    const saved = localStorage.getItem("focas_utms");
    if (saved) return JSON.parse(saved);
  } catch {
    /* localStorage blocked — fall through */
  }
  return fromUrl;
}

// Defined at module scope so its identity is stable across renders — otherwise
// React remounts the inputs on every keystroke and they lose focus.
export const Row = ({ label, name, error, children }) => (
  <div className="bwf-row" data-field={name}>
    <div className="bwf-label">{label}</div>
    <div className={"bwf-field bwf-field-mandatory" + (error ? " bwf-field-error-active" : "")}>
      <div className="bwf-field-inner">{children}</div>
      {error && <span className="bwf-field-error">{error}</span>}
    </div>
  </div>
);

// Offscreen honeypot input — real users never see it; bots fill it and the
// server silently drops the submission.
export const Honeypot = ({ value, onChange }) => (
  <input
    type="text"
    name="company"
    tabIndex={-1}
    autoComplete="off"
    aria-hidden="true"
    value={value}
    onChange={onChange}
    style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
  />
);

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
