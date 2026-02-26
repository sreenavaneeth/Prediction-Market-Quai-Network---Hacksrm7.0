export function SystemBanner({ text, tone = 'info' }) {
  if (!text) return null;
  return <div className={`system-banner ${tone}`}>{text}</div>;
}
