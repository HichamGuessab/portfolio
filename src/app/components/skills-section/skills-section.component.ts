import { Component, inject, OnInit } from '@angular/core';
import { SkillCategoryComponent } from './skill-category/skill-category.component';
import { SkillService } from '../../services/skill.service';
import { Skill } from '../../interfaces';

@Component({
  selector: 'skills-section',
  templateUrl: './skills-section.component.html',
  standalone: true,
  imports: [SkillCategoryComponent],
  host: { class: 'flex flex-col text-nowrap' },
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
}
