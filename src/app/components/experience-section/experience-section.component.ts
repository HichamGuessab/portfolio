import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
} from '@angular/core';
import { ExperienceItemComponent } from './experience-item/experience-item.component';
import { BlueImage, Experience } from '../../interfaces';
import { ExperienceService } from '../../services/experience.service';

@Component({
  selector: 'experience-section',
  templateUrl: './experience-section.component.html',
  standalone: true,
  imports: [ExperienceItemComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'flex flex-col' },
})
export class ExperienceSectionComponent implements OnInit {
  experiences: Experience[] = [];
  experienceService: ExperienceService = inject(ExperienceService);

  ngOnInit(): void {
    this.experiences = this.experienceService.getExperiences();
  }
  protected readonly BlueImage = BlueImage;
}
