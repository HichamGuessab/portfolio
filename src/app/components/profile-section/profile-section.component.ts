import { Component } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { BlueImage } from '../../interfaces';

@Component({
  selector: 'profile-section',
  standalone: true,
  imports: [BadgeComponent],
  templateUrl: './profile-section.component.html',
})
export class ProfileSectionComponent {
  protected readonly BlueImage = BlueImage;
}
