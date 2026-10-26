import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  InputSignal,
  InputSignalWithTransform,
  output,
} from '@angular/core';

/** Largeurs générées pour src/assets/images/portrait-{w}.{avif,webp}. */
const WIDTHS = [192, 384, 576, 768] as const;

const srcset = (format: 'avif' | 'webp'): string =>
  WIDTHS.map((w) => `assets/images/portrait-${w}.${format} ${w}w`).join(', ');

/**
 * Portrait responsive : AVIF puis WebP selon le navigateur, JPEG en dernier
 * recours, la bonne largeur choisie via `sizes`. Le texte alternatif est
 * fixe — les mascottes repèrent la photo par lui.
 */
@Component({
  selector: 'app-portrait',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <picture>
      <source type="image/avif" [attr.srcset]="avif" [attr.sizes]="sizes()" />
      <source type="image/webp" [attr.srcset]="webp" [attr.sizes]="sizes()" />
      <img
        src="assets/images/portrait-768.jpg"
        alt="Portrait de Hicham Guessab"
        width="768"
        height="768"
        decoding="async"
        [attr.loading]="priority() ? 'eager' : 'lazy'"
        [attr.fetchpriority]="priority() ? 'high' : null"
        [class]="imgClass()"
        (load)="loaded.emit()"
      />
    </picture>
  `,
})
export class PortraitComponent {
  /** Largeur d'affichage, pour le choix de la source (attribut sizes). */
  readonly sizes: InputSignal<string> = input('100vw');

  /** Image de premier écran : chargement immédiat et prioritaire. */
  readonly priority: InputSignalWithTransform<boolean, unknown> = input(false, {
    transform: booleanAttribute,
  });

  /** Classes de l'élément img (forme, recadrage, transition). */
  readonly imgClass: InputSignal<string> = input('');

  readonly loaded = output<void>();

  protected readonly avif = srcset('avif');
  protected readonly webp = srcset('webp');
}
