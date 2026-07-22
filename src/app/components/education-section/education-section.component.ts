import {
  Component,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { BlueImage, Degree } from '../../interfaces';
import { EducationService } from '../../services/education.service';
import { EducationItemComponent } from './education-item/education-item.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';

@Component({
    selector: 'education-section',
    templateUrl: './education-section.component.html',
    imports: [EducationItemComponent, SectionHeaderComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    host: { class: 'flex flex-col' },
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
    ]
})
export class EducationSectionComponent implements OnInit {
  degrees: Degree[] = [];
  educationService: EducationService = inject(EducationService);

  ngOnInit(): void {
    this.degrees = this.educationService.getDegrees();
  }

  protected readonly BlueImage = BlueImage;
}
