import { Injectable } from '@angular/core';
import { Degree } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class EducationService {
  degrees: Degree[] = [];

  baccalaureate: Degree = this.buildEducation(
    'Baccalauréat',
    'Scientifique',
    'Villeneuve-Lez-Avignon',
    '2017 - 2020'
  );

  license: Degree = this.buildEducation(
    'Licence',
    'Ingénierie du logiciel',
    "Université d'Avignon - CERI",
    '2020 - 2023'
  );

  master: Degree = this.buildEducation(
    'Master',
    'Ingénierie du logiciel',
    "Université d'Avignon - CERI",
    '2023 - 2025'
  );

  constructor() {
    this.degrees = [this.master, this.license, this.baccalaureate];
  }

  buildEducation(
    name: string,
    type: string,
    institution: string,
    date: string
  ): Degree {
    return { name, type, institution, date };
  }

  getDegrees(): Degree[] {
    return this.degrees;
  }
}
