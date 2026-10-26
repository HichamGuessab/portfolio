import { Period } from '../interfaces';

/* Mois abrégés à la française — table fixe plutôt qu'Intl, pour un rendu
   identique au pré-rendu (Node) et dans tous les navigateurs. */
const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

/** « 2023-09 » → « sept. 2023 », « 2022 » → « 2022 ». */
export function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

/** « sept. 2023 – août 2025 », « août 2025 – aujourd’hui ». */
export function formatPeriod(period: Period): string {
  const end = period.end ? formatMonth(period.end) : 'aujourd’hui';
  return `${formatMonth(period.start)} – ${end}`;
}

/**
 * Nombre de mois entiers d'une période datée au mois (null si une borne
 * n'est connue qu'à l'année : la durée serait approximative).
 */
export function periodMonths(
  period: Period,
  now: Date = new Date()
): number | null {
  const [startYear, startMonth] = period.start.split('-').map(Number);
  if (!startMonth) {
    return null;
  }
  let endYear = now.getFullYear();
  let endMonth = now.getMonth() + 1;
  if (period.end) {
    [endYear, endMonth] = period.end.split('-').map(Number);
    if (!endMonth) {
      return null;
    }
  }
  return Math.max(0, (endYear - startYear) * 12 + (endMonth - startMonth));
}

/** 26 → « 2 ans et 2 mois », 11 → « 11 mois », 24 → « 2 ans ». */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearLabel = years > 0 ? `${years} an${years > 1 ? 's' : ''}` : '';
  const monthLabel = rest > 0 ? `${rest} mois` : '';
  if (yearLabel && monthLabel) {
    return `${yearLabel} et ${monthLabel}`;
  }
  return yearLabel || monthLabel || 'moins d’un mois';
}
