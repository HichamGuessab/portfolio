import { Component, input, Input, InputSignal } from '@angular/core';
import { SkillItemComponent } from '../skill-item/skill-item.component';
import { Skill } from '../../../interfaces';

@Component({
  selector: 'skill-category',
  templateUrl: './skill-category.component.html',
  standalone: true,
  imports: [SkillItemComponent],
})
export class SkillCategoryComponent {
  name: InputSignal<string> = input.required<string>();
  skills: InputSignal<Skill[]> = input.required<Skill[]>();
}
