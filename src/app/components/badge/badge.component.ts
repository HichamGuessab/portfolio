import { Component, input, InputSignal } from '@angular/core';
import { Image, Link } from '../../interfaces';

@Component({
  selector: 'badge',
  templateUrl: './badge.component.html',
  standalone: true,
  imports: [],
})
export class BadgeComponent {
  name: InputSignal<string> = input.required<string>();
  image: InputSignal<Image> = input.required<Image>();
  url: InputSignal<Link> = input.required<Link>();
}
