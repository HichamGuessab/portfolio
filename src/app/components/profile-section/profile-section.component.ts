import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { BlueImage, Link } from '../../interfaces';

@Component({
  selector: 'profile-section',
  templateUrl: './profile-section.component.html',
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'flex flex-col gap-7 text-left' },
})
export class ProfileSectionComponent {
  imageLoaded = false;

  protected readonly BlueImage = BlueImage;
  protected readonly Link = Link;
}
