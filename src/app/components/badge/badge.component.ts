import { Component, Input } from '@angular/core';

@Component({
  selector: 'badge',
  templateUrl: './badge.component.html',
  standalone: true,
  imports: [],
})
export class BadgeComponent {
  @Input({ required: true }) name: string = '';
  @Input({ required: true }) image: string = '';
  @Input({ required: true }) redirection: string = '';

  redirectTo() {}
}
