import {
  Component,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
} from '@angular/core';
import { BlueImage, Degree } from '../../interfaces';
import { EducationService } from '../../services/education.service';
import { EducationItemComponent } from './education-item/education-item.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'education-section',
  templateUrl: './education-section.component.html',
  imports: [EducationItemComponent, SectionHeaderComponent, RevealDirective],
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

      /* Place la pagination juste sous la carte (hauteur auto : 100% du
         conteneur = hauteur de la carte, + 12px d'écart), comme pour la
         section projets. */
      swiper-container::part(pagination) {
        top: calc(100% + 12px);
      }
    `,
  ],
})
export class EducationSectionComponent implements OnInit {
  degrees: Degree[] = [];
  educationService: EducationService = inject(EducationService);

  ngOnInit(): void {
    this.degrees = this.educationService.getDegrees();
  }

  protected readonly BlueImage = BlueImage;
}
