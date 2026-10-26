import { Injectable } from '@angular/core';
import { Degree } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class EducationService {
  /** Du diplôme le plus élevé au plus ancien. */
  private readonly _degrees: Degree[] = [
    {
      name: 'Master',
      field: 'Ingénierie du logiciel',
      institution: 'Université d’Avignon · CERI',
      period: { start: '2023', end: '2025' },
      level: 'Bac+5',
    },
    {
      name: 'Licence',
      field: 'Ingénierie du logiciel',
      institution: 'Université d’Avignon · CERI',
      period: { start: '2020', end: '2023' },
      level: 'Bac+3',
    },
    {
      name: 'Baccalauréat',
      field: 'Scientifique',
      institution: 'Villeneuve-lès-Avignon',
      period: { start: '2017', end: '2020' },
    },
  ];

  getDegrees(): Degree[] {
    return this._degrees;
  }
}
