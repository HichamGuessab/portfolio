import { Injectable } from '@angular/core';
import { Project, ProjectCategory } from '../interfaces';

/** Libellés des catégories de projets. */
export const PROJECT_CATEGORIES: Record<ProjectCategory, string> = {
  web: 'Web',
  mobile: 'Mobile',
  software: 'Logiciel & IoT',
};

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  /** Ordre d'affichage : projets mis en avant d'abord. */
  private readonly _projects: Project[] = [
    {
      name: 'Portfolio',
      description:
        'Ce site : maquetté sur Figma, puis développé avec Angular et Tailwind CSS. Mascottes animées et mode compact secret inclus.',
      category: 'web',
      icon: 'sparkles',
      technologies: ['figma', 'angular', 'tailwind'],
      repository: 'https://github.com/HichamGuessab/portfolio',
      design:
        'https://www.figma.com/design/5EQNpkJoka4iXvDkSkv1Rs/Portfolio---Hicham-Guessab?node-id=0-1&t=MQ0xp0VIZ6Lf1iZu-1',
      featured: true,
    },
    {
      name: 'CERISoNet',
      description:
        'Un réseau social pour le CERI : front-end Angular, API Node.js / Express et base de données MongoDB.',
      category: 'web',
      icon: 'messages-square',
      technologies: ['angular', 'nodejs', 'express', 'mongodb'],
      repository: 'https://github.com/HichamGuessab/CERISoNet',
      featured: true,
    },
    {
      name: 'WineShazam',
      description: 'Shazam, mais pour le vin : une application mobile Flutter.',
      category: 'mobile',
      icon: 'wine',
      technologies: ['flutter'],
      repository: 'https://github.com/HichamGuessab/WineShazam',
      featured: true,
    },
    {
      name: 'Pokédex Native',
      description: 'Un Pokédex simple en React Native, alimenté par PokéAPI.',
      category: 'mobile',
      icon: 'smartphone',
      technologies: ['react-native'],
      repository: 'https://github.com/HichamGuessab/pokedex-native',
      featured: true,
    },
    {
      name: "Poor man's Spotify",
      description:
        'Un lecteur de musique développé avec Ionic et le middleware ZeroC Ice.',
      category: 'mobile',
      icon: 'music',
      technologies: ['ionic', 'ice'],
      repository: 'https://github.com/HichamGuessab/SpotifyDuPauvre',
    },
    {
      name: 'MacMahon',
      description: 'Un jeu de MacMahon développé en C++.',
      category: 'software',
      icon: 'gamepad-2',
      technologies: ['cpp'],
      repository: 'https://github.com/HichamGuessab/MacMahon',
    },
    {
      name: 'MQTT',
      description:
        'Communication entre un Raspberry Pi 4 et un Arduino Ethernet via le protocole MQTT.',
      category: 'software',
      icon: 'radio',
      technologies: ['raspberry-pi', 'arduino'],
      repository:
        'https://github.com/HichamGuessab/MQTT_RaspberryPi_To_ArduinoEthernet',
    },
    {
      name: 'Testing techniques',
      description: 'Introduction aux techniques de test logiciel, en Java.',
      category: 'software',
      icon: 'flask-conical',
      technologies: ['java'],
      repository: 'https://github.com/HichamGuessab/ceri-m1-techniques-de-test',
    },
    {
      name: 'RSA Algorithm',
      description:
        "Implémentation de l'algorithme de chiffrement RSA en Python.",
      category: 'software',
      icon: 'shield-check',
      technologies: ['python'],
      repository: 'https://github.com/HichamGuessab/RSA_Implementation',
    },
    {
      name: 'Pdf to Txt',
      description:
        'Un utilitaire Python pour convertir un fichier PDF en texte.',
      category: 'software',
      icon: 'file-text',
      technologies: ['python'],
      repository: 'https://github.com/HichamGuessab/PdfToTxt',
    },
    {
      name: 'XML Lab',
      description: 'Un TP de manipulation de documents XML.',
      category: 'software',
      icon: 'file-code',
      technologies: ['xml'],
      repository: 'https://github.com/HichamGuessab/XMLManipulationLab',
    },
  ];

  getProjects(): Project[] {
    return this._projects;
  }

  getFeaturedProjects(): Project[] {
    return this._projects.filter((project) => project.featured);
  }

  getOtherProjects(): Project[] {
    return this._projects.filter((project) => !project.featured);
  }
}
