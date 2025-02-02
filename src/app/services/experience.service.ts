import { Injectable } from '@angular/core';
import { Experience } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ExperienceService {
  experiences: Experience[] = [];

  courses: Experience = this.buildExperience(
    'Teacher',
    'Private lessons',
    '2020 - 2022',
    'Alongside my studies, I have given occasional private lessons in mathematics and computer science.'
  );

  roboticsFrenchCup: Experience = this.buildExperience(
    'Lidar Operator',
    'Asso R2T2',
    '2022 - 2023',
    'Coupe de France de Robotique as Lidar operator in a team of 5 people within the R2T2 association. <br> <br> Grading : 27/90'
  );

  CBAInformatiqueLiberal: Experience = this.buildExperience(
    'Software Engineer',
    'CBA Informatique Libéral',
    '2023 - 2025',
    'As a software engineer at CBA Informatique Libéral, I am responsible for developing and maintaining AgatheYou software applications (Web and Mobile) with Angular and Ionic. <br> <br> Check my LinkedIn profile to know more.'
  );

  referentJeanZay: Experience = this.buildExperience(
    'Residence referent',
    'Jean Zay residence',
    'September 2024 - June 2025',
  'Referent at the Jean Zay residence, a Crous student residence for 170 people.<br> <br> ' +
    '- Welcoming residents <br>' +
    '- Event organization <br>' +
    '- Problem management <br>' +
    '- Daily report <br><br>' +
    '6-hour a week contract'
  );

  constructor() {
    this.experiences = [
      this.CBAInformatiqueLiberal,
      this.referentJeanZay,
      this.roboticsFrenchCup,
      this.courses,
    ];
  }

  buildExperience(
    name: string,
    company: string,
    date: string,
    description: string
  ): Experience {
    return { name, company, date, description };
  }

  getExperiences(): Experience[] {
    return this.experiences;
  }
}
