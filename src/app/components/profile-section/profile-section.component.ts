import { Component } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { BlueImage, Link } from '../../interfaces';

@Component({
  selector: 'profile-section',
  templateUrl: './profile-section.component.html',
  standalone: true,
  imports: [BadgeComponent],
})
export class ProfileSectionComponent {
  protected readonly BlueImage = BlueImage;
  protected readonly Link = Link;
}
