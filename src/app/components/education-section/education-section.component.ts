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
})
export class EducationSectionComponent implements OnInit {
  degrees: Degree[] = [];
  educationService: EducationService = inject(EducationService);

  ngOnInit(): void {
    this.degrees = this.educationService.getProjects();
  }

  protected readonly BlueImage = BlueImage;
}
