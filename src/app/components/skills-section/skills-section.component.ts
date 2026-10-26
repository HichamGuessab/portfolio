import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { SkillGroup } from '../../interfaces';
import { SkillService } from '../../services/skill.service';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { IconComponent } from '../icon/icon.component';
import { TechChipComponent } from '../tech-chip/tech-chip.component';
import { RevealDirective } from '../../directives/reveal.directive';
import { SpySectionDirective } from '../../directives/spy-section.directive';

/** Familles affichées en carte large dans la grille bento (lg). */
const WIDE_GROUPS = new Set([0, 3]);

@Component({
  selector: 'skills-section',
  templateUrl: './skills-section.component.html',
  imports: [
    SectionHeaderComponent,
    IconComponent,
    TechChipComponent,
    RevealDirective,
    SpySectionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SkillsSectionComponent {
  protected readonly groups: SkillGroup[] =
    inject(SkillService).getSkillGroups();

  protected isWide(index: number): boolean {
    return WIDE_GROUPS.has(index);
  }
}
