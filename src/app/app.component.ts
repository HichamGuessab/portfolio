import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProfileSectionComponent } from './components/profile-section/profile-section.component';
import { SkillsSectionComponent } from './components/skills-section/skills-section.component';
import { ProjectsSectionComponent } from './components/projects-section/projects-section.component';
import { EducationSectionComponent } from './components/education-section/education-section.component';
import { Section } from './interfaces';
import { ExperienceSectionComponent } from './components/experience-section/experience-section.component';

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
    ExperienceSectionComponent,
  ],
  styles: [
    `
      swiper-container::part(button-prev),
      swiper-container::part(button-next) {
        display: none;
      }

      @media (min-width: 480px) {
        swiper-container::part(button-prev),
        swiper-container::part(button-next) {
          display: block;
        }
      }

      swiper-container::part(bullet) {
        width: 13px;
        height: 45px;
        background: linear-gradient(rgba(55, 150, 173, 0.56), #0f2c57);
        border-radius: 5px;
        transition: all 0.4s ease-in-out;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      swiper-container::part(bullet):hover {
        background: linear-gradient(rgba(83, 220, 253, 0.51), #a88cff, #0f2c57);
      }

      swiper-container::part(bullet-active) {
        width: 13px;
        height: 50px;
        background: linear-gradient(rgba(83, 220, 253, 0.51), #0f2c57);
        border-radius: 10px;
        transform: scale(1.2);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {
  protected readonly Section = Section;
}
