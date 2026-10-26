import {
  Component,
  computed,
  input,
  InputSignal,
  Signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icons';

/**
 * Pastille de contact de la barre de statut du mode compact (icône + texte).
 */
@Component({
  selector: 'badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <a
      [href]="url()"
      [attr.target]="isExternal() ? '_blank' : null"
      [attr.rel]="isExternal() ? 'noopener noreferrer' : null"
      class="inline-flex place-items-center justify-center gap-2 rounded-2xl bg-nightBlue px-3 py-1.5 text-xs text-lightBlue transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-navyBlue focus-visible:bg-navyBlue"
    >
      <app-icon [name]="icon()" class="size-4" />
      <span>{{ name() }}</span>
    </a>
  `,
})
export class BadgeComponent {
  name: InputSignal<string> = input.required<string>();
  icon: InputSignal<IconName> = input.required<IconName>();
  url: InputSignal<string> = input.required<string>();

  /* Un lien mailto ne doit pas s'ouvrir dans un nouvel onglet
     (onglet vide dans certains navigateurs). */
  isExternal: Signal<boolean> = computed(
    () => !this.url().startsWith('mailto:')
  );
}
