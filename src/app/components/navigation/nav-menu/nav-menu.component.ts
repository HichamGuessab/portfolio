import { Component } from '@angular/core';
import { NavItemComponent } from '../nav-item/nav-item.component';

@Component({
  selector: 'nav-menu',
  templateUrl: './nav-menu.component.html',
  standalone: true,
  imports: [NavItemComponent],
})
export class NavMenuComponent {}
