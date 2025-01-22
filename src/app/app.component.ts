import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProfileSectionComponent } from './components/profile-section/profile-section.component';
import { SkillsSectionComponent } from './components/skills-section/skills-section.component';
import { NavMenuComponent } from './components/navigation/nav-menu/nav-menu.component';
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
    NavMenuComponent,
    ProjectsSectionComponent,
    EducationSectionComponent,
  ],
  host: { class: 'md:flex md:flex-row' },
})
export class AppComponent {
  protected readonly Section = Section;
}
