import { Injectable } from '@angular/core';
import { Degree } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class EducationService {
  degrees: Degree[] = [];

  baccalaureate: Degree = this.buildEducation(
    'Baccalaureate',
    'Scientific',
    'Villeneuve-Lez-Avignon',
    '2017 - 2020'
  );

  license: Degree = this.buildEducation(
    "Bachelor's degree",
    'Software engineering',
    'Avignon University - CERI',
    '2020 - 2023'
  );

  master: Degree = this.buildEducation(
    "Master's degree",
    'Software engineering',
    'Avignon University - CERI',
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

  getProjects(): Degree[] {
    return this.degrees;
  }
}
