import { Injectable } from '@angular/core';
import { Experience } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ExperienceService {
  experiences: Experience[] = [];

  courses: Experience = this.buildExperience(
    'Professeur particulier',
    'Cours particuliers',
    '2020 - 2022',
    "En parallèle de mes études, j'ai donné ponctuellement des cours particuliers de mathématiques et d'informatique."
  );

  roboticsFrenchCup: Experience = this.buildExperience(
    'Opérateur Lidar',
    'Asso R2T2',
    '2022 - 2023',
    "Coupe de France de Robotique en tant qu'opérateur Lidar dans une équipe de 5 personnes au sein de l'association R2T2. <br> <br> Résultat : 27/90"
  );

  CBAInformatiqueLiberal: Experience = this.buildExperience(
    'Ingénieur logiciel',
    'CBA Informatique Libéral',
    '2023 - 2025',
    "En tant qu'ingénieur logiciel chez CBA Informatique Libéral, j'étais chargé du développement et de la maintenance des applications AgatheYou (Web et Mobile) avec Angular et Ionic. <br> <br> Consultez mon profil LinkedIn pour en savoir plus."
  );

  referentJeanZay: Experience = this.buildExperience(
    'Référent de résidence',
    'Résidence Jean Zay',
    'Septembre 2024 - Juin 2025',
    'Référent à la résidence Jean Zay, une résidence étudiante du Crous accueillant 170 personnes.<br> <br> ' +
      '- Accueil des résidents <br>' +
      "- Organisation d'événements <br>" +
      '- Gestion des problèmes <br>' +
      '- Rapport quotidien <br><br>' +
      'Contrat de 6 heures par semaine'
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
