import { Component, input, InputSignal } from '@angular/core';
import { Project, WhiteImage } from '../../../interfaces';

@Component({
  selector: 'project-item',
  templateUrl: './project-item.component.html',
  standalone: true,
  imports: [],
})
export class ProjectItemComponent {
  project: InputSignal<Project> = input.required<Project>();
  protected readonly WhiteImage = WhiteImage;

  openLink() {
    window.open(this.project().url, '_blank');
  }
}
