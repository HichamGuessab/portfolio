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
 * - « compact » : photo en haut à gauche dans un cadre en tirets animé,
 *   titre à sa droite (mode une page).
 */
export type ProfileLayout = 'hero' | 'compact';

@Component({
  selector: 'profile-section',
  templateUrl: './profile-section.component.html',
  imports: [BadgeComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-7 text-left' },
  styles: [
    `
      /* ---- Cadre « synthétique » de la photo (layout compact) ----
         Un rect SVG en tirets (dégradé lightBlue → purple) qui se dessine
         progressivement à l'apparition (mask animé façon « draw »), puis dont
         les tirets défilent lentement en continu (marching ants sur
         stroke-dashoffset). Aucun fill-mode : l'état final de chaque animation
         est l'état naturel de l'élément. Quand les animations sont neutralisées
         (règle globale prefers-reduced-motion de styles.css, pilotée par
         MotionService), photo et cadre restent donc affichés, statiques. */

      .frame-stop-start {
        stop-color: var(--light-blue);
      }

      .frame-stop-end {
        stop-color: var(--purple);
      }

      @keyframes profile-frame-draw {
        from {
          stroke-dashoffset: 100;
        }
      }

      .frame-draw {
        animation: profile-frame-draw 1.4s cubic-bezier(0.33, 1, 0.68, 1);
      }

      /* Un cycle = une période du motif de tirets (pathLength 100,
         motif 2.5 + 1.5 = 4) : la boucle est invisible, la rotation continue. */
      @keyframes profile-frame-march {
        to {
          stroke-dashoffset: -4;
        }
      }

      .frame-dashes {
        animation: profile-frame-march 1.8s linear 1.4s infinite;
      }

      /* Les coins n'apparaissent qu'une fois le cadre presque dessiné. Le
         retard est encodé dans les keyframes (ni animation-delay ni fill-mode)
         pour que l'état neutralisé reste visible en permanence. */
      @keyframes profile-frame-corners-in {
        0%,
        55% {
          opacity: 0;
        }
      }

      .frame-corners {
        animation: profile-frame-corners-in 2.4s ease-out;
      }
    `,
  ],
})
export class ProfileSectionComponent {
  /** Mise en page : « hero » (diaporama, défaut) ou « compact » (une page). */
  readonly layout: InputSignal<ProfileLayout> = input<ProfileLayout>('hero');

  protected readonly imageLoaded: WritableSignal<boolean> = signal(false);

  protected readonly BlueImage = BlueImage;
  protected readonly Link = Link;
}
