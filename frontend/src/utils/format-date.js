// "2026-11-19T14:03:00.000Z" -> "11 - 19 - 2026 | 14:03" in the viewer's local time.
export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const two = (n) => String(n).padStart(2, '0');
  return `${two(d.getMonth() + 1)} - ${two(d.getDate())} - ${d.getFullYear()} | ${two(d.getHours())}:${two(d.getMinutes())}`;
}
