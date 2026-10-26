import {
  formatDuration,
  formatMonth,
  formatPeriod,
  periodMonths,
} from './period';

describe('period', () => {
  describe('formatMonth', () => {
    it('formate un mois ISO en français', () => {
      expect(formatMonth('2023-09')).toBe('sept. 2023');
      expect(formatMonth('2025-08')).toBe('août 2025');
    });

    it('laisse une année seule telle quelle', () => {
      expect(formatMonth('2022')).toBe('2022');
    });
  });

  describe('formatPeriod', () => {
    it('relie début et fin par un tiret demi-cadratin', () => {
      expect(formatPeriod({ start: '2023-09', end: '2025-08' })).toBe(
        'sept. 2023 – août 2025'
      );
    });

    it('termine une période ouverte par « aujourd’hui »', () => {
      expect(formatPeriod({ start: '2025-08' })).toBe(
        'août 2025 – aujourd’hui'
      );
    });

    it('accepte un libellé court pour une période ouverte', () => {
      expect(formatPeriod({ start: '2025-08' }, 'auj.')).toBe(
        'août 2025 – auj.'
      );
    });
  });

  describe('periodMonths', () => {
    const now = new Date(2026, 9, 26); // 26 octobre 2026

    it('compte les mois entiers d’une période close', () => {
      expect(periodMonths({ start: '2023-09', end: '2025-08' }, now)).toBe(23);
    });

    it('compte jusqu’à aujourd’hui pour une période ouverte', () => {
      expect(periodMonths({ start: '2023-09' }, now)).toBe(37);
    });

    it('renvoie null dès qu’une borne n’est connue qu’à l’année', () => {
      expect(periodMonths({ start: '2022', end: '2023' }, now)).toBeNull();
      expect(periodMonths({ start: '2020-09', end: '2023' }, now)).toBeNull();
    });
  });

  describe('formatDuration', () => {
    it('accorde années et mois', () => {
      expect(formatDuration(37)).toBe('3 ans et 1 mois');
      expect(formatDuration(23)).toBe('1 an et 11 mois');
      expect(formatDuration(24)).toBe('2 ans');
      expect(formatDuration(9)).toBe('9 mois');
    });

    it('gère une période de moins d’un mois', () => {
      expect(formatDuration(0)).toBe('moins d’un mois');
    });
  });
});
