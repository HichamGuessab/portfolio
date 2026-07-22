import { Injectable } from '@angular/core';
import { Project, WhiteImage } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  projects: Project[] = [];

  portfolio: Project = this.buildProject(
    'Portfolio',
    'Mon portfolio personnel, maquetté sur Figma. <br> <a class="hover:text-lightBlue" href="https://www.figma.com/design/5EQNpkJoka4iXvDkSkv1Rs/Portfolio---Hicham-Guessab?node-id=0-1&t=MQ0xp0VIZ6Lf1iZu-1"> <u><i>Voir la maquette</i></u> </a>',
    [WhiteImage.Figma, WhiteImage.Angular, WhiteImage.Tailwind],
    'https://github.com/HichamGuessab/portfolio'
  );

  macMahon: Project = this.buildProject(
    'MacMahon',
    'Un jeu de MacMahon.',
    [WhiteImage.Cpp],
    'https://github.com/HichamGuessab/MacMahon'
  );

  ceriSoNetProject: Project = this.buildProject(
    'CERISoNet',
    'Un réseau social pour le CERI.',
    [
      WhiteImage.Angular,
      WhiteImage.Nodejs,
      WhiteImage.Express,
      WhiteImage.Mongodb,
    ],
    'https://github.com/HichamGuessab/CERISoNet'
  );

  pokedexNative: Project = this.buildProject(
    'Pokedex Native',
    'Un pokédex simple utilisant PokéAPI.',
    [WhiteImage.ReactNative],
    'https://github.com/HichamGuessab/pokedex-native'
  );

  poorMansSpotifyProject: Project = this.buildProject(
    "Poor man's Spotify",
    'Un lecteur de musique.',
    [WhiteImage.Ionic, WhiteImage.Ice],
    'https://github.com/HichamGuessab/SpotifyDuPauvre'
  );

  rsaImplementation: Project = this.buildProject(
    'RSA Algorithm',
    'Implémentation de RSA pour la sécurité.',
    [WhiteImage.Python],
    'https://github.com/HichamGuessab/RSA_Implementation'
  );

  testingTechniques: Project = this.buildProject(
    'Testing techniques',
    'Introduction aux techniques de test.',
    [WhiteImage.Java],
    'https://github.com/HichamGuessab/ceri-m1-techniques-de-test'
  );

  wineShazamProject: Project = this.buildProject(
    'WineShazam',
    'Shazam, mais pour le vin.',
    [WhiteImage.Flutter],
    'https://github.com/HichamGuessab/WineShazam'
  );

  MQTTRasberryPiToArduinoEthernet: Project = this.buildProject(
    'MQTT',
    'Communication entre un Raspberry Pi 4 et un Arduino Ethernet.',
    [WhiteImage.Raspberry, WhiteImage.Arduino],
    'https://github.com/HichamGuessab/MQTT_RaspberryPi_To_ArduinoEthernet'
  );

  pdfToTxt: Project = this.buildProject(
    'Pdf to Txt',
    'Convertir un fichier PDF en fichier TXT.',
    [WhiteImage.Python],
    'https://github.com/HichamGuessab/PdfToTxt'
  );

  xmlManipulationLab: Project = this.buildProject(
    'XML Lab',
    'Un TP de manipulation XML.',
    [WhiteImage.XML],
    'https://github.com/HichamGuessab/XMLManipulationLab'
  );

  constructor() {
    this.projects = [
      this.portfolio,
      this.pokedexNative,
      this.macMahon,
      this.ceriSoNetProject,
      this.poorMansSpotifyProject,
      this.wineShazamProject,
      this.MQTTRasberryPiToArduinoEthernet,
      this.testingTechniques,
      this.rsaImplementation,
      this.pdfToTxt,
      this.xmlManipulationLab,
    ];
  }

  buildProject(
    name: string,
    description: string,
    technologies: WhiteImage[],
    url: string
  ): Project {
    return { name, description, technologies, url };
  }

  getProjects(): Project[] {
    return this.projects;
  }
}
