import { Component, Input } from '@angular/core';
import { Degree } from '../../../interfaces';

@Component({
  selector: 'education-item',
  templateUrl: './education-item.component.html',
  standalone: true,
  imports: [],
})
export class EducationItemComponent {
  @Input({ required: true }) education: Degree = {
    name: '',
    type: '',
    institution: '',
    date: '',
  };
}
