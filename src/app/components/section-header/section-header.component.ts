import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Image } from '../../interfaces';
import { RevealDirective } from '../../directives/reveal.directive';

/**
 * Variantes de l'en-tête de section :
 * - « default » : grand en-tête centré du diaporama (inchangé) ;
 * - « mini » : en-tête de cellule du pont de commandement (mode compact) —
 *   icône + libellé espacé + numéro HUD à droite.
 */
export type SectionHeaderSize = 'default' | 'mini';

@Component({
  selector: 'section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective],
  template: `
    @if (size() === 'mini') {
      <div class="mb-2 flex items-center gap-2 2xl:mb-3">
        <img [src]="icon()" alt="" class="h-4 w-4 opacity-80" />
        <h2
          class="text-[11px] font-medium tracking-[0.22em] text-white/50 uppercase"
        >
          {{ title() }}
        </h2>
        @if (count() !== null) {
          <span class="text-[10px] text-lightBlue/60 tabular-nums">
            {{ count() }}
          </span>
        }
        @if (index()) {
          <span class="ml-auto text-[10px] text-lightBlue/40 tabular-nums">
            {{ index() }}
          </span>
        }
      </div>
    } @else {
      <!-- Tailles réduites < md : l'en-tête doit tenir dans le conteneur
           w-3/4 des petits écrans (« Compétences » débordait à droite). -->
      <div
        reveal
        class="mb-8 flex max-w-full gap-3 place-self-center md:mb-12 md:gap-5"
      >
        <img
          [src]="icon()"
          alt=""
          class="h-10 w-10 place-self-center md:h-14 md:w-14"
        />
        <h2
          class="content-center bg-linear-to-r from-lightBlue to-purple bg-clip-text font-analogue text-4xl font-regular text-transparent md:text-5xl"
        >
          {{ title() }}
        </h2>
      </div>
    }
  `,
})
export class SectionHeaderComponent {
  icon = input.required<Image>();
  title = input.required<string>();

  /** Variante d'affichage (voir SectionHeaderSize). */
  size = input<SectionHeaderSize>('default');

  /** Numéro HUD (« 02 »…) affiché à droite — variante mini uniquement. */
  index = input<string>('');

  /** Compteur optionnel (nombre d'éléments) — variante mini uniquement. */
  count = input<number | null>(null);
}
