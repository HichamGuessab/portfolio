import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  InputSignal,
  NgZone,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';

/** Retrait du cadre par rapport au bord du viewport, en pixels. */
const FRAME_INSET = 10;

/** Rayon des coins du cadre — écho du rounded-2xl (16px) des cellules. */
const FRAME_RADIUS = 18;

/** Retrait des équerres de coin : 4px vers l'extérieur du cadre. */
const CORNER_INSET = FRAME_INSET - 4;

/** Longueur d'un bras d'équerre depuis le coin (px). */
const CORNER_ARM = 24;

/** Début de la courbure de l'équerre (px depuis le bord). */
const CORNER_CURVE = 15;

/**
 * « Circuit fermé » : cadre en tirets qui ceinture le viewport en mode
 * compact. Un unique path rectangulaire à coins arrondis (inset 10px, rx 18)
 * est régénéré au resize à partir de innerWidth/innerHeight — un <rect> stylé
 * en CSS calc() rend le couple pathLength + dasharray capricieux sous Safari.
 *
 * pathLength="1000" normalise le motif : les tirets gardent la même densité
 * quelle que soit la résolution. Le dessin d'apparition réutilise le pattern
 * du mask « draw » (trait blanc plein dont le dashoffset se résorbe), puis
 * les tirets défilent en continu (marching ants). Le halo est un second path
 * statique — aucun filtre CSS sur le trait animé.
 *
 * z-30 : au-dessus des cartes du pont, sous les mascottes et leurs bulles
 * (z-40). pointer-events-none : ne bloque aucun clic.
 */
@Component({
  selector: 'screen-frame',
  templateUrl: './screen-frame.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      svg {
        --frame-speed: 0.9s;
      }

      .frame-stop-start {
        stop-color: var(--light-blue);
      }

      .frame-stop-end {
        stop-color: var(--purple);
      }

      /* Dessin d'apparition : sens horaire depuis le coin haut-gauche.
         Aucun fill-mode : l'état final (dashoffset 0) est l'état naturel,
         le cadre ne peut jamais rester masqué. */
      @keyframes frame-draw-in {
        from {
          stroke-dashoffset: 1000;
        }
      }

      .frame-draw {
        animation: frame-draw-in 1.1s cubic-bezier(0.22, 0.61, 0.36, 1);
      }

      /* Marching ants : une période du motif (3 + 2.2 = 5.2) par cycle,
         la boucle est invisible. Démarre à la fin du dessin (delay 1.1s). */
      @keyframes frame-march {
        to {
          stroke-dashoffset: -5.2;
        }
      }

      .frame-dashes {
        opacity: 0.55;
        transition: opacity 0.4s ease;
        animation: frame-march var(--frame-speed) linear 1.1s infinite;
      }

      /* Le circuit répond à l'attention : courant plus rapide, trait plus
         présent — ni changement de couleur ni de graisse. */
      .frame-excited {
        --frame-speed: 0.45s;
      }

      .frame-excited .frame-dashes {
        opacity: 0.8;
      }

      /* Respiration d'idle du halo : oscillation d'opacité très sobre. */
      @keyframes frame-breathe {
        0%,
        100% {
          opacity: 0.06;
        }
        30% {
          opacity: 0.04;
        }
        70% {
          opacity: 0.08;
        }
      }

      .frame-halo {
        opacity: 0.06;
        animation: frame-breathe 6s ease-in-out 1.1s infinite;
      }

      /* Les équerres POP une fois le cadre dessiné (~t=1.15s). Le retard est
         encodé dans les keyframes (79% de 1.45s ≈ 1.15s), sans fill-mode :
         l'état neutralisé reste visible en permanence. */
      @keyframes frame-corner-pop {
        0%,
        79% {
          opacity: 0;
          transform: scale(0.6);
        }
      }

      .frame-corner {
        opacity: 0.9;
        transform-box: fill-box;
        animation: frame-corner-pop 1.45s ease-out;
      }

      .frame-corner-tl {
        transform-origin: 0% 0%;
      }

      .frame-corner-tr {
        transform-origin: 100% 0%;
      }

      .frame-corner-br {
        transform-origin: 100% 100%;
      }

      .frame-corner-bl {
        transform-origin: 0% 100%;
      }
    `,
  ],
})
export class ScreenFrameComponent {
  /** Vrai quand un élément interactif du pont est survolé ou focus. */
  readonly excited: InputSignal<boolean> = input(false);

  private readonly _zone: NgZone = inject(NgZone);

  private readonly _width: WritableSignal<number> = signal(window.innerWidth);
  private readonly _height: WritableSignal<number> = signal(window.innerHeight);

  /**
   * Path du cadre : rectangle à coins arrondis, tracé dans le sens horaire
   * depuis le coin haut-gauche (départ du dessin d'apparition).
   */
  protected readonly framePath: Signal<string> = computed(() => {
    const w = this._width();
    const h = this._height();
    const i = FRAME_INSET;
    const r = FRAME_RADIUS;
    return [
      `M ${i + r} ${i}`,
      `H ${w - i - r}`,
      `A ${r} ${r} 0 0 1 ${w - i} ${i + r}`,
      `V ${h - i - r}`,
      `A ${r} ${r} 0 0 1 ${w - i - r} ${h - i}`,
      `H ${i + r}`,
      `A ${r} ${r} 0 0 1 ${i} ${h - i - r}`,
      `V ${i + r}`,
      `A ${r} ${r} 0 0 1 ${i + r} ${i}`,
      'Z',
    ].join(' ');
  });

  /** Équerres de coin (décalées 4px vers l'extérieur du cadre). */
  protected readonly corners: Signal<{
    tl: string;
    tr: string;
    br: string;
    bl: string;
  }> = computed(() => {
    const w = this._width();
    const h = this._height();
    const i = CORNER_INSET;
    const a = CORNER_ARM;
    const c = CORNER_CURVE;
    return {
      tl: `M ${a} ${i} H ${c} Q ${i} ${i} ${i} ${c} V ${a}`,
      tr: `M ${w - a} ${i} H ${w - c} Q ${w - i} ${i} ${w - i} ${c} V ${a}`,
      br: `M ${w - i} ${h - a} V ${h - c} Q ${w - i} ${h - i} ${w - c} ${h - i} H ${w - a}`,
      bl: `M ${a} ${h - i} H ${c} Q ${i} ${h - i} ${i} ${h - c} V ${h - a}`,
    };
  });

  /** Position des pips carrés 2×2px, un par coin. */
  protected readonly pips: Signal<{ right: number; bottom: number }> = computed(
    () => ({
      right: this._width() - 3.5,
      bottom: this._height() - 3.5,
    })
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    let raf = 0;

    /* Régénération du path au resize, débouncée par rAF. Seul le path
       change : l'animation de dessin (posée au premier rendu) ne rejoue
       jamais. */
    const onResize = (): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        this._zone.run(() => {
          this._width.set(window.innerWidth);
          this._height.set(window.innerHeight);
        });
      });
    };

    this._zone.runOutsideAngular(() =>
      window.addEventListener('resize', onResize)
    );
    destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    });
  }
}
