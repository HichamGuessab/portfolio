import { Component } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'profile',
  standalone: true,
  imports: [BadgeComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {}
