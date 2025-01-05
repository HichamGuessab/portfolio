import { Component, Input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { BlueImage, Skill, SkillType } from '../../../interfaces';

@Component({
  selector: 'skill-item',
  templateUrl: './skill-item.component.html',
  standalone: true,
  imports: [NgOptimizedImage],
})
export class SkillItemComponent {
  @Input({ required: true }) skill: Skill = {
    name: '',
    image: BlueImage.About,
    type: SkillType.Default,
  };
  protected readonly SkillType = SkillType;
}
