import {
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { Section } from '../../../interfaces';

@Component({
  selector: 'nav-item',
  templateUrl: './nav-item.component.html',
  standalone: true,
  imports: [NgOptimizedImage, NgClass],
})
export class NavItemComponent {
  name: InputSignal<string> = input.required<string>();
  image: InputSignal<string> = input.required<string>();
  section: InputSignal<Section> = input.required<Section>();
  isActive: InputSignal<boolean> = input.required<boolean>();

  onClickItem: OutputEmitterRef<Section> = output<Section>();

  redirectTo() {
    this.onClickItem.emit(this.section());
  }
}
