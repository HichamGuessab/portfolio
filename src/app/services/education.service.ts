import { Injectable } from '@angular/core';
import { Degree } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class EducationService {
  /** Ordre chronologique : du baccalauréat au diplôme le plus élevé. */
  private readonly _degrees: Degree[] = [
    {
      name: 'Baccalauréat',
      field: 'Scientifique',
      institution: 'Villeneuve-lès-Avignon',
      period: { start: '2017', end: '2020' },
    },
    {
      name: 'Licence',
      field: 'Ingénierie du logiciel',
      institution: 'Université d’Avignon · CERI',
      period: { start: '2020', end: '2023' },
      level: 'Bac+3',
    },
    {
      name: 'Master',
      field: 'Ingénierie du logiciel',
      institution: 'Université d’Avignon · CERI',
      period: { start: '2023', end: '2025' },
      level: 'Bac+5',
    },
  ];

  getDegrees(): Degree[] {
    return this._degrees;
  }

  /** Diplôme le plus élevé (le dernier obtenu). */
  getHighestDegree(): Degree {
    return this._degrees[this._degrees.length - 1];
  }
}
