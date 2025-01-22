import { Component } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { BlueImage, Link } from '../../interfaces';

@Component({
  selector: 'profile-section',
  templateUrl: './profile-section.component.html',
  standalone: true,
  imports: [BadgeComponent],
  host: { class: 'flex flex-col gap-7 text-left' },
})
export class ProfileSectionComponent {
  protected readonly BlueImage = BlueImage;
  protected readonly Link = Link;
}
