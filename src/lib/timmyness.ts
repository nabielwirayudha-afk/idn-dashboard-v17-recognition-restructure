// Mandatory display order for all Recognition Values charts/tables, per the
// "Standardisasi Urutan Timmyness Values" spec. Any category not in this list
// (e.g. legacy long-form strings) sorts after these, alphabetically.
export const TIMMYNESS_ORDER = [
  'Integrity',
  'Inclusion',
  'Customer Obsessed',
  'Strong Work-Ethic',
  'Focus and Speed',
  'Long-Term Thinking',
  'Growth Mindset',
  'Cost Conscious',
  'Grit and Resilience',
  'One IDN',
];

// A fixed color per category so the same Timmyness always renders in the
// same color across both Recognition Values pie charts (Kudos and Timmy of
// the Month), making them easy to compare side by side.
export const TIMMYNESS_COLOR: Record<string, string> = {
  'Integrity': '#ED2127',
  'Inclusion': '#5B7FDE',
  'Customer Obsessed': '#8B7FE8',
  'Strong Work-Ethic': '#2B2D42',
  'Focus and Speed': '#F4A261',
  'Long-Term Thinking': '#4A7C8C',
  'Growth Mindset': '#16A34A',
  'Cost Conscious': '#C77D92',
  'Grit and Resilience': '#8C5A22',
  'One IDN': '#8D99AF',
};

const ORDER_INDEX = new Map(TIMMYNESS_ORDER.map((label, i) => [label.toLowerCase(), i]));

/** Timmyness fields often look like "Timmyness 9: Growth Mindset" — pull the
 * label out after the last colon so it can be matched against the canonical
 * list and against the Kudos value field (already a clean label). */
export function parseTimmynessLabel(raw: string): string {
  if (!raw) return '';
  const parts = raw.split(':');
  return (parts.length > 1 ? parts[parts.length - 1] : raw).trim();
}

/** Best-effort match of a free-text label to the canonical taxonomy (case-
 * insensitive, ignores legacy prefixes). Returns the canonical label if
 * found, otherwise the original (trimmed) text. */
export function canonicalizeTimmyness(raw: string): string {
  const label = parseTimmynessLabel(raw);
  const match = TIMMYNESS_ORDER.find((c) => c.toLowerCase() === label.toLowerCase());
  return match || label;
}

export function timmynessSortIndex(label: string): number {
  const idx = ORDER_INDEX.get(label.toLowerCase());
  return idx === undefined ? TIMMYNESS_ORDER.length + label.charCodeAt(0) : idx;
}

export function sortByTimmyness<T>(rows: T[], labelFn: (r: T) => string): T[] {
  return [...rows].sort((a, b) => timmynessSortIndex(labelFn(a)) - timmynessSortIndex(labelFn(b)));
}
