import { Component, Input } from '@angular/core';
import { SkillItemComponent } from '../skill-item/skill-item.component';
import { Skill } from '../../../interfaces';

@Component({
  selector: 'skill-category',
  templateUrl: './skill-category.component.html',
  standalone: true,
  imports: [SkillItemComponent],
})
export class SkillCategoryComponent {
  @Input({ required: true }) name: string = 'SkillSection';
  @Input({ required: true }) skills: Skill[] = [];
}
