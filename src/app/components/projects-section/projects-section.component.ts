import { Component, inject, OnInit } from '@angular/core';
import { BlueImage, Project } from '../../interfaces';
import { ProjectService } from '../../services/project.service';
import { ProjectItemComponent } from './project-item/project-item.component';

@Component({
  selector: 'projects-section',
  templateUrl: './projects-section.component.html',
  standalone: true,
  imports: [ProjectItemComponent],
})
export class ProjectsSectionComponent implements OnInit {
  private _projectService: ProjectService = inject(ProjectService);

  projects: Project[] = [];

  ngOnInit() {
    this.projects = this._projectService.getProjects();
  }

  protected readonly BlueImage = BlueImage;
}
