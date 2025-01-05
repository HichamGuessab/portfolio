import { Component, Input } from '@angular/core';
import { BlueImage, Image } from '../../interfaces';

@Component({
  selector: 'badge',
  templateUrl: './badge.component.html',
  standalone: true,
  imports: [],
})
export class BadgeComponent {
  @Input({ required: true }) name: string = '';
  @Input({ required: true }) image: Image = BlueImage.About;
  @Input({ required: true }) redirection: string = '';

  redirectTo() {}
}
