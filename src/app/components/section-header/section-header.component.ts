import {
  Component,
  input,
  InputSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icons';
import { RevealDirective } from '../../directives/reveal.directive';

/**
 * Sur-titre de section : numéro HUD, tiret dégradé et libellé projeté
 * (`<p sectionEyebrow="02">Réalisations</p>`). Partagé par l'en-tête de
 * section et la carte Contact, qui a sa propre mise en page.
 */
@Component({
  selector: 'p[sectionEyebrow]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-lightBlue uppercase',
  },
  template: `
    <span class="text-lightBlue/75 tabular-nums">{{ sectionEyebrow() }}</span>
    <span
      aria-hidden="true"
      class="h-px w-8 bg-linear-to-r from-lightBlue to-purple"
    ></span>
    <ng-content />
  `,
})
export class SectionEyebrowComponent {
  /** Numéro HUD de la section (« 02 »…). */
  readonly sectionEyebrow: InputSignal<string> = input.required<string>();
}

/**
 * Variantes de l'en-tête de section :
 * - « default » : en-tête éditorial de la page (numéro HUD + sur-titre,
 *   grand titre, chapô projeté via ng-content) ;
 * - « mini » : en-tête de cellule du pont de commandement (mode compact) —
 *   icône + libellé espacé + numéro HUD à droite.
 */
export type SectionHeaderSize = 'default' | 'mini';

@Component({
  selector: 'section-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, RevealDirective, SectionEyebrowComponent],
  template: `
    @if (size() === 'mini') {
      <div class="mb-2 flex items-center gap-2 2xl:mb-3">
        @if (icon(); as icon) {
          <app-icon [name]="icon" class="size-4 text-lightBlue/80" />
        }
        <h2
          class="text-[11px] font-medium tracking-[0.22em] text-white/55 uppercase"
        >
          {{ title() }}
        </h2>
        @if (count() !== null) {
          <span class="text-[10px] text-lightBlue/60 tabular-nums">
            {{ count() }}
          </span>
        }
        @if (index()) {
          <span class="ml-auto text-[10px] text-lightBlue/60 tabular-nums">
            {{ index() }}
          </span>
        }
      </div>
    } @else {
      <div reveal data-perch="title" class="mb-10 max-w-2xl md:mb-14">
        <p [sectionEyebrow]="index()" class="mb-4">{{ eyebrow() }}</p>
        <h2
          [id]="titleId()"
          class="font-display text-4xl font-semibold tracking-tight text-balance text-wildSand md:text-5xl"
        >
          {{ title() }}
        </h2>
        <div class="mt-5 text-lg leading-relaxed text-pretty text-white/70">
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class SectionHeaderComponent {
  title = input.required<string>();

  /** Variante d'affichage (voir SectionHeaderSize). */
  size = input<SectionHeaderSize>('default');

  /** Numéro HUD (« 02 »…) : sur-titre (default) ou coin droit (mini). */
  index = input<string>('');

  /** Sur-titre de la variante default (« Parcours »…). */
  eyebrow = input<string>('');

  /** Id du titre, cible de l'aria-labelledby de la section. */
  titleId = input<string | null>(null);

  /** Icône de la variante mini. */
  icon = input<IconName | null>(null);

  /** Compteur optionnel (nombre d'éléments) — variante mini uniquement. */
  count = input<number | null>(null);
}
