import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProfileSectionComponent } from './components/profile-section/profile-section.component';
import { SkillsSectionComponent } from './components/skills-section/skills-section.component';
import { ProjectsSectionComponent } from './components/projects-section/projects-section.component';
import { EducationSectionComponent } from './components/education-section/education-section.component';
import { Section } from './interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    RouterOutlet,
    ProfileSectionComponent,
    SkillsSectionComponent,
    ProjectsSectionComponent,
    EducationSectionComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {
  protected readonly Section = Section;
}
