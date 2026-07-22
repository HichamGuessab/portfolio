import {
  Component,
  computed,
  input,
  InputSignal,
  Signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Image, Link } from '../../interfaces';

@Component({
  selector: 'badge',
  templateUrl: './badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class BadgeComponent {
  name: InputSignal<string> = input.required<string>();
  image: InputSignal<Image> = input.required<Image>();
  url: InputSignal<Link> = input.required<Link>();

  /* Un lien mailto ne doit pas s'ouvrir dans un nouvel onglet
     (onglet vide dans certains navigateurs). */
  isExternal: Signal<boolean> = computed(
    () => !this.url().startsWith('mailto:')
  );
}
