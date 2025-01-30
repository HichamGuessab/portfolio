import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
} from '@angular/core';
import { BlueImage, Project } from '../../interfaces';
import { ProjectService } from '../../services/project.service';
import { ProjectItemComponent } from './project-item/project-item.component';

@Component({
  selector: 'projects-section',
  templateUrl: './projects-section.component.html',
  standalone: true,
  imports: [ProjectItemComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'flex flex-col' },
  styles: [
    `
      swiper-container::part(button-prev),
      swiper-container::part(button-next) {
        display: none;
      }

      @media (min-width: 640px) {
        swiper-container::part(button-prev),
        swiper-container::part(button-next) {
          display: block;
        }
      }

      swiper-container::part(bullet-active) {
        background-color: #53dcfd;
        transform: scale(1.5);
      }

      swiper-container::part(bullet) {
        background-color: #53dcfd;
      }

      swiper-container::part(pagination) {
        top: 200px;
      }
    `,
  ],
})
export class ProjectsSectionComponent implements OnInit {
  private _projectService: ProjectService = inject(ProjectService);

  projects: Project[] = [];

  ngOnInit() {
    this.projects = this._projectService.getProjects();
  }

  protected readonly BlueImage = BlueImage;
}
