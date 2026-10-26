import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Project } from '../../interfaces';
import { ProjectService } from '../../services/project.service';
import { ProfileService } from '../../services/profile.service';
import { ProjectItemComponent } from './project-item/project-item.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { IconComponent } from '../icon/icon.component';
import { RevealDirective } from '../../directives/reveal.directive';
import { SpySectionDirective } from '../../directives/spy-section.directive';

@Component({
  selector: 'projects-section',
  templateUrl: './projects-section.component.html',
  imports: [
    ProjectItemComponent,
    SectionHeaderComponent,
    IconComponent,
    RevealDirective,
    SpySectionDirective,
  ],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSectionComponent {
  private readonly _projectService: ProjectService = inject(ProjectService);

  protected readonly profile: ProfileService = inject(ProfileService);
  protected readonly featured: Project[] =
    this._projectService.getFeaturedProjects();
  protected readonly others: Project[] =
    this._projectService.getOtherProjects();
}
