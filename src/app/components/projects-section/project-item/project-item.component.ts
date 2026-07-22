import { Component, input, InputSignal } from '@angular/core';
import { Project, WhiteImage } from '../../../interfaces';

/* Noms de marque qui ne peuvent pas être dérivés du nom de fichier
   par simple capitalisation. */
const TECH_NAME_OVERRIDES: Record<string, string> = {
  reactNative: 'React Native',
  cpp: 'C++',
  nodejs: 'Node.js',
  pgsql: 'PostgreSQL',
  mongodb: 'MongoDB',
  xml: 'XML',
};

@Component({
  selector: 'project-item',
  templateUrl: './project-item.component.html',
  standalone: true,
})
export class ProjectItemComponent {
  project: InputSignal<Project> = input.required<Project>();
  protected readonly WhiteImage = WhiteImage;

  techName(path: string): string {
    const key = (path.split('/').pop() ?? '')
      .replace(/^white-/, '')
      .replace(/\.(png|svg)$/, '');
    const name =
      TECH_NAME_OVERRIDES[key] ??
      key
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    return `Logo ${name}`;
  }
}
