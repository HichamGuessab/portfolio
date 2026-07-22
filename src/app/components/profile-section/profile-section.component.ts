import {
  Component,
  ChangeDetectionStrategy,
  signal,
  WritableSignal,
} from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { BlueImage, Link } from '../../interfaces';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'profile-section',
  templateUrl: './profile-section.component.html',
  imports: [BadgeComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-7 text-left' },
})
export class ProfileSectionComponent {
  protected readonly imageLoaded: WritableSignal<boolean> = signal(false);

  protected readonly BlueImage = BlueImage;
  protected readonly Link = Link;
}
