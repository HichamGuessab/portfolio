import { Injectable } from '@angular/core';
import { Experience } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ExperienceService {
  /** Du plus récent au plus ancien ; les postes d'une même organisation
      sont regroupés pour rendre la progression lisible. */
  private readonly _experiences: Experience[] = [
    {
      organization: 'CBA Informatique Libéral',
      context: 'Alternance puis CDI',
      roles: [
        {
          title: 'Ingénieur logiciel',
          contract: 'CDI',
          period: { start: '2025-08' },
          summary:
            'Développement et maintenance des applications AgatheYou, sur le web comme sur le mobile.',
          highlights: [
            'Spécialisé mobile : Angular et Capacitor, sur iOS et Android.',
            'Côté web : Angular, Docker et hybridation avec Struts, entre autres.',
          ],
          technologies: [
            'angular',
            'typescript',
            'capacitor',
            'ios',
            'android',
            'docker',
          ],
        },
        {
          title: 'Ingénieur logiciel',
          contract: 'Alternance',
          period: { start: '2023-09', end: '2025-08' },
          summary:
            'En alternance pendant mon Master Ingénierie du logiciel : développement et maintenance des applications AgatheYou (web et mobile).',
          technologies: ['angular', 'typescript', 'ionic'],
        },
      ],
    },
    {
      organization: 'Résidence Jean Zay',
      context: 'Résidence étudiante du Crous · 170 résidents',
      roles: [
        {
          title: 'Référent de résidence',
          contract: '6 h / semaine',
          period: { start: '2024-09', end: '2025-06' },
          highlights: [
            'Accueil des résidents',
            'Organisation d’événements',
            'Gestion des problèmes',
            'Rapport quotidien',
          ],
        },
      ],
    },
    {
      organization: 'Association R2T2',
      context: 'Coupe de France de Robotique',
      roles: [
        {
          title: 'Opérateur Lidar',
          period: { start: '2022', end: '2023' },
          summary: 'Au sein d’une équipe de 5 personnes.',
          highlights: ['Résultat : 27ᵉ sur 90'],
        },
      ],
    },
    {
      organization: 'Cours particuliers',
      context: 'Mathématiques et informatique',
      roles: [
        {
          title: 'Professeur particulier',
          period: { start: '2020', end: '2022' },
          summary: 'Des cours ponctuels, donnés en parallèle de mes études.',
        },
      ],
    },
  ];

  getExperiences(): Experience[] {
    return this._experiences;
  }
}
