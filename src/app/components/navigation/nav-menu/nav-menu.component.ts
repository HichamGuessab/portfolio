import { Component, inject } from '@angular/core';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { ViewportScroller } from '@angular/common';
import { Section } from '../../../interfaces';

@Component({
  selector: 'nav-menu',
  templateUrl: './nav-menu.component.html',
  standalone: true,
  imports: [NavItemComponent],
})
export class NavMenuComponent {
  protected _viewportScroller: ViewportScroller = inject(ViewportScroller);

  activeSection: Section = Section.Profile;

  redirectTo($event: Section) {
    this.activeSection = $event;
    this._viewportScroller.scrollToAnchor($event);
  }

  protected readonly Section = Section;
}
