import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Experience } from '../../interfaces';
import { ExperienceService } from '../../services/experience.service';
import { ProfileService } from '../../services/profile.service';
import { ExperienceItemComponent } from './experience-item/experience-item.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { IconComponent } from '../icon/icon.component';
import { RevealDirective } from '../../directives/reveal.directive';
import { SpySectionDirective } from '../../directives/spy-section.directive';

@Component({
  selector: 'experience-section',
  templateUrl: './experience-section.component.html',
  imports: [
    ExperienceItemComponent,
    SectionHeaderComponent,
    IconComponent,
    RevealDirective,
    SpySectionDirective,
  ],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceSectionComponent {
  protected readonly profile: ProfileService = inject(ProfileService);
  protected readonly experiences: Experience[] =
    inject(ExperienceService).getExperiences();
  protected readonly years: number = this.profile.yearsOfExperience();
}
