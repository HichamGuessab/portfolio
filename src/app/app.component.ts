import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ProfileSectionComponent } from './components/profile-section/profile-section.component';
import { SkillsSectionComponent } from './components/skills-section/skills-section.component';
import { ProjectsSectionComponent } from './components/projects-section/projects-section.component';
import { EducationSectionComponent } from './components/education-section/education-section.component';
import { ExperienceSectionComponent } from './components/experience-section/experience-section.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    ProfileSectionComponent,
    SkillsSectionComponent,
    ProjectsSectionComponent,
    EducationSectionComponent,
    ExperienceSectionComponent,
  ],
  styles: [
    `
      swiper-container::part(bullet) {
        width: 13px;
        height: 45px;
        background: linear-gradient(rgba(55, 150, 173, 0.56), var(--navy-blue));
        border-radius: 5px;
        transition: all 0.4s ease-in-out;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      swiper-container::part(bullet):hover {
        background: linear-gradient(
          color-mix(in srgb, var(--light-blue) 51%, transparent),
          var(--purple),
          var(--navy-blue)
        );
      }

      swiper-container::part(bullet-active) {
        width: 13px;
        height: 50px;
        background: linear-gradient(
          color-mix(in srgb, var(--light-blue) 51%, transparent),
          var(--navy-blue)
        );
        border-radius: 10px;
        transform: scale(1.2);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {}
