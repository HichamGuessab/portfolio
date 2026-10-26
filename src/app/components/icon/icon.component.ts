import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  InputSignalWithTransform,
  Signal,
} from '@angular/core';
import { IconDef, IconName, ICONS } from './icons';

/**
 * Peinture du mode dégradé : le dégradé partagé d'IconDefsComponent, avec
 * currentColor en repli si ses définitions manquent à la page (sans repli,
 * une référence cassée ne peint rien).
 */
const GRADIENT_PAINT = 'url(#icon-gradient) currentColor';

/**
 * Icône SVG en ligne : une icône d'interface du registre ICONS, par son nom,
 * ou un logo de logos.ts, par sa définition. Nette à toute taille, colorable
 * par currentColor, sans requête réseau et présente dans le HTML prérendu.
 * Les tracés passent par des liaisons [attr.d] : le sanitizer d'Angular
 * viderait un innerHTML de son SVG.
 *
 * Le SVG remplit l'hôte, que le consommateur dimensionne
 * (`<app-icon name="mail" class="size-5" />`). Toujours décorative
 * (aria-hidden) : le texte voisin porte le sens.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block shrink-0 align-middle', 'aria-hidden': 'true' },
  template: `
    <svg
      class="block size-full"
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 24 24"
      [attr.fill]="fill()"
      [attr.stroke]="stroke()"
      [attr.stroke-width]="stroke() ? 1.75 : null"
      [attr.stroke-linecap]="stroke() ? 'round' : null"
      [attr.stroke-linejoin]="stroke() ? 'round' : null"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class IconComponent {
  /** Nom d'une icône d'interface (voir ICONS) ou logo importé de logos.ts. */
  readonly name: InputSignal<IconName | IconDef> = input.required<
    IconName | IconDef
  >();

  /**
   * Peint l'icône avec le dégradé signature lightBlue → purple (attribut
   * seul accepté : `<app-icon [name]="angular" gradient />`).
   */
  readonly gradient: InputSignalWithTransform<boolean, unknown> = input(false, {
    transform: booleanAttribute,
  });

  protected readonly def: Signal<IconDef> = computed(() => {
    const name = this.name();
    return typeof name === 'string' ? ICONS[name] : name;
  });

  private readonly _paint: Signal<string> = computed(() =>
    this.gradient() ? GRADIENT_PAINT : 'currentColor'
  );

  protected readonly fill: Signal<string> = computed(() =>
    this.def().type === 'fill' ? this._paint() : 'none'
  );

  protected readonly stroke: Signal<string | null> = computed(() =>
    this.def().type === 'stroke' ? this._paint() : null
  );

  /**
   * Tracés rendus. Le dégradé (objectBoundingBox) se cale sur la boîte de
   * chaque <path> : en mode dégradé, les tracés d'une icône au trait sont
   * fusionnés en un seul (chacun commence par un M absolu), sinon chaque
   * morceau porterait son propre dégradé et les traits horizontaux ou
   * verticaux, de boîte plate, ne seraient pas peints du tout.
   */
  protected readonly paths: Signal<readonly string[]> = computed(() => {
    const { type, paths } = this.def();
    return this.gradient() && type === 'stroke' && paths.length > 1
      ? [paths.join('')]
      : paths;
  });
}

/**
 * Définitions partagées des icônes, à poser une seule fois par page (racine
 * de l'application) : le dégradé signature lightBlue → purple appelé par
 * url(#icon-gradient). SVG de taille nulle et hors flux, jamais en
 * display:none : Chromium et Firefox ne peignent pas un dégradé défini dans
 * un SVG non rendu.
 */
@Component({
  selector: 'app-icon-defs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style="position:absolute;width:0;height:0;overflow:hidden"
    >
      <defs>
        <linearGradient id="icon-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style="stop-color: var(--light-blue)" />
          <stop offset="1" style="stop-color: var(--purple)" />
        </linearGradient>
      </defs>
    </svg>
  `,
})
export class IconDefsComponent {}
