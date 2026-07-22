import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SkillCategoryComponent } from './skill-category/skill-category.component';
import { SkillService } from '../../services/skill.service';
import { BlueImage, Skill } from '../../interfaces';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'skills-section',
  templateUrl: './skills-section.component.html',
  imports: [SkillCategoryComponent, SectionHeaderComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col' },
})
export class SkillsSectionComponent implements OnInit {
  designSkills: Skill[] = [];
  frontEndSkills: Skill[] = [];
  backEndSkills: Skill[] = [];
  toolsSkills: Skill[] = [];

  skillService: SkillService = inject(SkillService);

  ngOnInit() {
    this.designSkills = this.skillService.getDesignSkills();
    this.frontEndSkills = this.skillService.getFrontEndSkills();
    this.backEndSkills = this.skillService.getBackEndSkills();
    this.toolsSkills = this.skillService.getToolsSkills();
  }

  protected readonly BlueImage = BlueImage;
}
