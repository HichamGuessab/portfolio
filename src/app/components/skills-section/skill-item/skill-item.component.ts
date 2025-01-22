import { Component, input, Input, InputSignal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { BlueImage, Skill, SkillType } from '../../../interfaces';

@Component({
  selector: 'skill-item',
  templateUrl: './skill-item.component.html',
  standalone: true,
  imports: [NgOptimizedImage],
})
export class SkillItemComponent {
  skill: InputSignal<Skill> = input.required<Skill>();

  protected readonly SkillType = SkillType;
}
