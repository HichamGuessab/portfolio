import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Degree } from '../../interfaces';
import { EducationService } from '../../services/education.service';
import { EducationItemComponent } from './education-item/education-item.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { RevealDirective } from '../../directives/reveal.directive';
import { SpySectionDirective } from '../../directives/spy-section.directive';

@Component({
  selector: 'education-section',
  templateUrl: './education-section.component.html',
  imports: [
    EducationItemComponent,
    SectionHeaderComponent,
    RevealDirective,
    SpySectionDirective,
  ],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationSectionComponent {
  /** Ordre chronologique, de gauche à droite (le service liste du plus
      élevé au plus ancien) : la frise culmine sur le Master. */
  protected readonly degrees: Degree[] = [
    ...inject(EducationService).getDegrees(),
  ].reverse();
}
