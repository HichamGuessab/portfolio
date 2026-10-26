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
 * Icône SVG en ligne tirée du registre ICONS : nette à toute taille,
 * colorable par currentColor, sans requête réseau et présente dans le HTML
 * prérendu. Les tracés passent par des liaisons [attr.d] : le sanitizer
 * d'Angular viderait un innerHTML de son SVG.
 *
 * Le SVG remplit l'hôte, que le consommateur dimensionne
 * (`<app-icon name="mail" class="size-5" />`). Décorative par défaut
 * (aria-hidden) ; avec un `label`, l'hôte devient role="img" + aria-label.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block shrink-0 align-middle',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
  },
  template: `
    <svg
      class="block size-full"
      focusable="false"
      aria-hidden="true"
      [attr.viewBox]="def().viewBox ?? '0 0 24 24'"
      [attr.fill]="fill()"
      [attr.stroke]="stroke()"
      [attr.stroke-width]="stroke() ? strokeWidth() : null"
      [attr.stroke-linecap]="stroke() ? 'round' : null"
      [attr.stroke-linejoin]="stroke() ? 'round' : null"
      [attr.fill-rule]="def().evenOdd ? 'evenodd' : null"
      [attr.clip-rule]="def().evenOdd ? 'evenodd' : null"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class IconComponent {
  /** Nom de l'icône dans le registre (voir ICONS). */
  readonly name: InputSignal<IconName> = input.required<IconName>();

  /**
   * Peint l'icône avec le dégradé signature lightBlue → purple (attribut
   * seul accepté : `<app-icon name="angular" gradient />`).
   */
  readonly gradient: InputSignalWithTransform<boolean, unknown> = input(false, {
    transform: booleanAttribute,
  });

  /** Libellé accessible ; sans libellé, l'icône est décorative. */
  readonly label: InputSignal<string | undefined> = input<string | undefined>(
    undefined
  );

  /** Épaisseur du trait des icônes 'stroke', en unités du viewBox (24). */
  readonly strokeWidth: InputSignal<number> = input(1.75);

  protected readonly def: Signal<IconDef> = computed(() => ICONS[this.name()]);

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
          <stop offset="0" stop-color="#53DCFD" />
          <stop offset="1" stop-color="#A88CFF" />
        </linearGradient>
      </defs>
    </svg>
  `,
})
export class IconDefsComponent {}
