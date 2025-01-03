import { Component, Inject, Input } from '@angular/core';
import { NgOptimizedImage, ViewportScroller } from '@angular/common';

@Component({
  selector: 'nav-item',
  templateUrl: './nav-item.component.html',
  standalone: true,
  imports: [NgOptimizedImage],
})
export class NavItemComponent {
  private viewportScroller = Inject(ViewportScroller);

  @Input({ required: true }) anchor: string = '';
  @Input({ required: true }) name: string = '';
  @Input({ required: true }) image: string = '';

  redirectTo() {
    this.viewportScroller.scrollToAnchor(this.anchor);
  }
}
