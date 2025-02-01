import { Injectable } from '@angular/core';
import { Project, WhiteImage } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  projects: Project[] = [];

  portfolio: Project = this.buildProject(
    'Portfolio',
    'My personal portfolio.',
    [WhiteImage.Angular, WhiteImage.Tailwind],
    'https://github.com/HichamGuessab/portfolio'
  );

  macMahon: Project = this.buildProject(
    'MacMahon',
    'A MacMahon game.',
    [WhiteImage.Cpp],
    'https://github.com/HichamGuessab/MacMahon'
  );

  ceriSoNetProject: Project = this.buildProject(
    'CERISoNet',
    'A social network for CERI.',
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
    'A simple pokedex using pokeapi.',
    [WhiteImage.ReactNative],
    'https://github.com/HichamGuessab/pokedex-native'
  );

  poorMansSpotifyProject: Project = this.buildProject(
    "Poor man's Spotify",
    'A music player.',
    [WhiteImage.Ionic, WhiteImage.Ice],
    'https://github.com/HichamGuessab/SpotifyDuPauvre'
  );

  rsaImplementation: Project = this.buildProject(
    'RSA Algorithm',
    'RSA implementation for security.',
    [WhiteImage.Python],
    'https://github.com/HichamGuessab/RSA_Implementation'
  );

  testingTechniques: Project = this.buildProject(
    'Testing techniques',
    'Introduction to Testing techniques.',
    [WhiteImage.Java],
    'https://github.com/HichamGuessab/ceri-m1-techniques-de-test'
  );

  wineShazamProject: Project = this.buildProject(
    'WineShazam',
    'Shazam, but for wine.',
    [WhiteImage.Flutter],
    'https://github.com/HichamGuessab/WineShazam'
  );

  MQTTRasberryPiToArduinoEthernet: Project = this.buildProject(
    'MQTT',
    'Communicating a Raspberry Pi 4 with an Arduino Ethernet.',
    [WhiteImage.Raspberry, WhiteImage.Arduino],
    'https://github.com/HichamGuessab/MQTT_RaspberryPi_To_ArduinoEthernet'
  );

  pdfToTxt: Project = this.buildProject(
    'Pdf to Txt',
    'Convert a PDF file to a TXT one.',
    [WhiteImage.Python],
    'https://github.com/HichamGuessab/PdfToTxt'
  );

  xmlManipulationLab: Project = this.buildProject(
    'XML Lab',
    'A lab for XML manipulation.',
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
