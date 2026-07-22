import {
  Component,
  ChangeDetectionStrategy,
  input,
  InputSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { BlueImage, Link } from '../../interfaces';
import { RevealDirective } from '../../directives/reveal.directive';

/**
 * Mise en page de la section profil :
 * - « hero » : présentation du diaporama (photo ronde à droite du titre) ;
 * - « compact » : cellule identité du pont de commandement — photo dans un
 *   liseré dégradé, titres à sa droite, accroche intégrale dessous (le cadre
 *   en tirets appartient désormais à l'écran, voir ScreenFrameComponent).
 */
export type ProfileLayout = 'hero' | 'compact';

@Component({
  selector: 'profile-section',
  templateUrl: './profile-section.component.html',
  imports: [BadgeComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-7 text-left' },
})
export class ProfileSectionComponent {
  /** Mise en page : « hero » (diaporama, défaut) ou « compact » (une page). */
  readonly layout: InputSignal<ProfileLayout> = input<ProfileLayout>('hero');

  protected readonly imageLoaded: WritableSignal<boolean> = signal(false);

  protected readonly BlueImage = BlueImage;
  protected readonly Link = Link;
}
