import { Component, Input } from '@angular/core';
import { BlueImage, Project, WhiteImage } from '../../../interfaces';

@Component({
  selector: 'project-item',
  templateUrl: './project-item.component.html',
  standalone: true,
  imports: [],
})
export class ProjectItemComponent {
  @Input({ required: true }) project: Project = {
    name: '',
    description: '',
    technologies: [BlueImage.About],
    url: '',
  };
  protected readonly WhiteImage = WhiteImage;
}
