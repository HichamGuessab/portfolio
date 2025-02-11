import {
  Component,
  OnInit,
  inject,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { BlueImage, Degree, Experience } from '../../interfaces';
import { EducationService } from '../../services/education.service';
import { EducationItemComponent } from './education-item/education-item.component';

@Component({
  selector: 'education-section',
  templateUrl: './education-section.component.html',
  standalone: true,
  imports: [EducationItemComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'flex flex-col' },
  styles: [
    `
      swiper-container::part(button-prev),
      swiper-container::part(button-next) {
        display: none;
      }

      @media (min-width: 540px) {
        swiper-container::part(button-prev),
        swiper-container::part(button-next) {
          display: block;
        }
      }
    `,
  ],
})
export class EducationSectionComponent implements OnInit {
  degrees: Degree[] = [];
  educationService: EducationService = inject(EducationService);

  ngOnInit(): void {
    this.degrees = this.educationService.getProjects();
  }

  protected readonly BlueImage = BlueImage;
}
