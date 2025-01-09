import { Injectable } from '@angular/core';
import { Project, WhiteImage } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  projects: Project[] = [];

  cerisonetProject: Project = this.buildProject(
    'CERISoNet',
    'A social network for CERI',
    [WhiteImage.Angular],
    ''
  );

  portefolioProject: Project = this.buildProject(
    'Portfolio',
    'My personal portfolio',
    [WhiteImage.Angular, WhiteImage.Tailwind],
    ''
  );

  poorMansSpotifyProject: Project = this.buildProject(
    "Poor man's Spotify",
    'A music player',
    [WhiteImage.Ionic, WhiteImage.Ice],
    ''
  );

  wineShazamProject: Project = this.buildProject(
    'WineShazam',
    'Shazam but for wine',
    [WhiteImage.Flutter],
    ''
  );

  constructor() {
    this.projects = [
      this.cerisonetProject,
      this.portefolioProject,
      this.poorMansSpotifyProject,
      this.wineShazamProject,
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
