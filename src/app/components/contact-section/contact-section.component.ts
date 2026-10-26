import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { IconComponent } from '../icon/icon.component';
import { RevealDirective } from '../../directives/reveal.directive';
import { SpySectionDirective } from '../../directives/spy-section.directive';

/** Durée d'affichage de la confirmation « Adresse copiée » (ms). */
const COPIED_FEEDBACK_MS = 2500;

/**
 * Appel à l'action final : écrire un e-mail (lien mailto), copier l'adresse
 * en un clic (confirmation annoncée aux lecteurs d'écran), ou rejoindre
 * LinkedIn / GitHub.
 */
@Component({
  selector: 'contact-section',
  templateUrl: './contact-section.component.html',
  imports: [IconComponent, RevealDirective, SpySectionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ContactSectionComponent {
  protected readonly profile: ProfileService = inject(ProfileService);

  /** Vrai juste après une copie réussie de l'adresse. */
  protected readonly copied: WritableSignal<boolean> = signal(false);

  private _feedbackTimer = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this._feedbackTimer));
  }

  /** Version imprimable : la feuille @media print fait le reste. */
  protected print(): void {
    window.print();
  }

  protected async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.profile.email);
    } catch {
      // Presse-papiers indisponible : le lien mailto reste l'action principale.
      return;
    }
    this.copied.set(true);
    clearTimeout(this._feedbackTimer);
    this._feedbackTimer = window.setTimeout(
      () => this.copied.set(false),
      COPIED_FEEDBACK_MS
    );
  }
}
