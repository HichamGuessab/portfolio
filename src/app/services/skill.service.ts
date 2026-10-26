import { Injectable } from '@angular/core';
import { SkillGroup } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class SkillService {
  /** Familles de compétences ; `primary` = stack principale. */
  private readonly _groups: SkillGroup[] = [
    {
      name: 'Front-end & mobile',
      description:
        'Interfaces web et applications mobiles hybrides, sur iOS comme sur Android.',
      icon: 'layers',
      skills: [
        { tech: 'typescript', primary: true },
        { tech: 'angular', primary: true },
        { tech: 'tailwind', primary: true },
        { tech: 'ionic' },
        { tech: 'capacitor' },
        { tech: 'redux' },
      ],
    },
    {
      name: 'Design',
      description:
        'Maquettage d’interfaces : ce portfolio est d’abord né sur Figma.',
      icon: 'palette',
      skills: [{ tech: 'figma', primary: true }],
    },
    {
      name: 'Back-end',
      description: 'API, serveurs et bases de données relationnelles.',
      icon: 'server',
      skills: [
        { tech: 'java' },
        { tech: 'nodejs' },
        { tech: 'express' },
        { tech: 'postgresql' },
      ],
    },
    {
      name: 'Outils',
      description: 'Versionnement, conteneurs et automatisation du quotidien.',
      icon: 'wrench',
      skills: [
        { tech: 'git' },
        { tech: 'gitlab' },
        { tech: 'docker' },
        { tech: 'bash' },
        { tech: 'npm' },
      ],
    },
  ];

  getSkillGroups(): SkillGroup[] {
    return this._groups;
  }
}
