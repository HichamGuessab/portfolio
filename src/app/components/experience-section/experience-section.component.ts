import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ExperienceItemComponent } from './experience-item/experience-item.component';
import { BlueImage, Experience } from '../../interfaces';
import { ExperienceService } from '../../services/experience.service';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'experience-section',
  templateUrl: './experience-section.component.html',
  imports: [ExperienceItemComponent, SectionHeaderComponent, RevealDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'flex flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      /* Bullets de pagination aux couleurs de la charte (lightBlue) */
      swiper-container {
        --swiper-pagination-color: var(--light-blue);
        --swiper-pagination-bullet-inactive-color: var(--light-blue);
      }

      /* Place la pagination juste sous la carte (min-h-[30rem] + 12px
         d'écart), comme pour la section projets. */
      swiper-container::part(pagination) {
        top: calc(30rem + 12px);
      }
    `,
  ],
})
export class ExperienceSectionComponent implements OnInit {
  experiences: Experience[] = [];
  experienceService: ExperienceService = inject(ExperienceService);

  ngOnInit(): void {
    this.experiences = this.experienceService.getExperiences();
  }
  protected readonly BlueImage = BlueImage;
}
