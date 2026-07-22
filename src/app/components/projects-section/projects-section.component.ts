import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { BlueImage, Project } from '../../interfaces';
import { ProjectService } from '../../services/project.service';
import { ProjectItemComponent } from './project-item/project-item.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'projects-section',
  templateUrl: './projects-section.component.html',
  imports: [ProjectItemComponent, SectionHeaderComponent, RevealDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'flex flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      swiper-container::part(bullet) {
        background-color: var(--light-blue);
      }

      swiper-container::part(bullet-active) {
        background-color: var(--light-blue);
        transform: scale(1.5);
      }

      /* Place la pagination juste sous la carte projet (h-52 = 208px + 12px
         d'écart) au lieu du bas du conteneur Swiper. */
      swiper-container::part(pagination) {
        top: 220px;
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
