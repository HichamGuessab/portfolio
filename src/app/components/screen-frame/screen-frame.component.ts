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
 * Période d'orbite de la comète horaire, en secondes.
 * SENTINELLE : doit rester égale à --comet-period (styles ci-dessous).
 */
const COMET_PERIOD = 7;

/**
 * Départ de la croisière après l'activation, en secondes.
 * SENTINELLE : doit rester égal au delay des animations comet-orbit-*.
 */
const COMET_LAUNCH = 1.25;

/**
 * « Comète de lumière » : le cadre du mode compact devient un conduit
 * d'énergie. Un unique path rectangulaire à coins arrondis (inset 10px,
 * rx 18, pathLength 1000) est régénéré au resize depuis innerWidth/Height,
 * et porte cinq couches empilées bas→haut :
 *
 *  L0  halo d'assise (statique, respiration 6s) + renfort excited ;
 *  L1  rail continu — la piste gravée, lisible en permanence ;
 *  L2  tirets de flux — texture calme, accélérée sous attention ;
 *  L3  comète horaire — 4 paths superposés (queues, halo, tête blanche)
 *      animés en stroke-dashoffset, un tour en 7s ;
 *  L3b contre-comète violette anti-horaire (5,6s), paused hors excited —
 *      son play-state préserve sa phase entre deux survols.
 *
 * À l'activation, une comète d'entrée chevauche exactement le front du mask
 * révélateur (même durée, même easing), une étincelle marque l'allumage,
 * puis la croisière démarre à t=1,25s. Les équerres de coin « s'enflamment »
 * au passage exact de la comète : leurs animation-delay sont dérivés en TS
 * de l'abscisse curviligne des milieux d'arc (voir cornerFlareDelays).
 *
 * Budget animation : stroke-dashoffset, opacity, transform uniquement —
 * aucun filtre ni box-shadow animé, le bloom de tête est fait par
 * superposition de largeurs de trait.
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
        --frame-speed: 1.4s;
        --comet-period: 7s; /* SENTINELLE : = COMET_PERIOD (TS). */
        --comet-ccw-period: 5.6s;
      }

      .frame-stop-start {
        stop-color: var(--light-blue);
      }

      .frame-stop-end {
        stop-color: var(--purple);
      }

      /* ---- Entrée : dessin du circuit -------------------------------- */

      /* Dessin d'apparition : sens horaire depuis le coin haut-gauche.
         Aucun fill-mode : l'état final (dashoffset 0) est l'état naturel,
         le cadre ne peut jamais rester masqué.
         SENTINELLE : durée + easing STRICTEMENT identiques à
         frame-entrance-run (la comète d'entrée EST le front du mask). */
      @keyframes frame-draw-in {
        from {
          stroke-dashoffset: 1000;
        }
      }

      .frame-draw {
        animation: frame-draw-in 1.1s cubic-bezier(0.22, 0.61, 0.36, 1);
      }

      /* Comète d'entrée : tête au front de révélation (front = 1000 − o_mask,
         tête = 24 − o_comet, mêmes courbes ⇒ coïncidence exacte), puis
         extinction 96→100%. État naturel opacity 0, sans fill-mode :
         auto-nettoyage garanti. Le fondu 0→2% masque le tout premier frame :
         à progression 0 le dash est encore enroulé à la couture (positions
         [976, 1000]) et s'afficherait sur le bord gauche ; à x = 0,02 il est
         entièrement déroulé, et 22 ms de fade-in sont imperceptibles. */
      @keyframes frame-entrance-run {
        from {
          stroke-dashoffset: 24;
        }
        to {
          stroke-dashoffset: -976;
        }
      }

      @keyframes frame-entrance-fade {
        0% {
          opacity: 0;
        }
        2%,
        96% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }

      .frame-entrance {
        opacity: 0;
        animation: frame-entrance-fade 1.1s linear;
      }

      .frame-entrance path {
        /* SENTINELLE : mêmes durée + easing que .frame-draw. */
        animation: frame-entrance-run 1.1s cubic-bezier(0.22, 0.61, 0.36, 1);
      }

      .frame-entrance-halo {
        stroke: var(--light-blue);
      }

      /* Étincelle d'allumage au point de départ de l'orbite (t = 1,2s) :
         elle couvre la naissance de la comète de croisière. */
      @keyframes frame-spark-pop {
        from {
          opacity: 1;
          transform: scale(0.5);
        }
        to {
          opacity: 0;
          transform: scale(1.8);
        }
      }

      .frame-spark {
        opacity: 0;
        transform-box: fill-box;
        transform-origin: center;
        animation: frame-spark-pop 0.35s ease-out 1.2s;
      }

      /* ---- L0 : halo d'assise ---------------------------------------- */

      /* Respiration d'idle du halo : oscillation d'opacité très sobre. */
      @keyframes frame-breathe {
        0%,
        100% {
          opacity: 0.05;
        }
        30% {
          opacity: 0.03;
        }
        70% {
          opacity: 0.07;
        }
      }

      .frame-halo {
        opacity: 0.05;
        animation: frame-breathe 6s ease-in-out 1.1s infinite;
      }

      /* Renfort excited du halo : path jumeau statique en fondu additif
         (~0,05 + 0,04 ≈ 0,09) — évite tout var() dans les keyframes de
         respiration. */
      .frame-halo-boost {
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .frame-excited .frame-halo-boost {
        opacity: 0.04;
      }

      /* ---- L1 : rail continu ----------------------------------------- */

      .frame-rail {
        opacity: 0.22;
        transition: opacity 0.3s ease;
      }

      .frame-excited .frame-rail {
        opacity: 0.4;
      }

      /* ---- L2 : tirets de flux --------------------------------------- */

      /* Marching ants : une période du motif (3 + 2.2 = 5.2) par cycle,
         la boucle est invisible. Démarre à la fin du dessin (delay 1.1s). */
      @keyframes frame-march {
        to {
          stroke-dashoffset: -5.2;
        }
      }

      .frame-dashes {
        opacity: 0.35;
        transition: opacity 0.4s ease;
        animation: frame-march var(--frame-speed) linear 1.1s infinite;
      }

      /* Le circuit répond à l'attention : courant plus rapide, trait plus
         présent. Le saut de phase du changement de durée est invisible sur
         un motif de 5,2‰. */
      .frame-excited {
        --frame-speed: 0.5s;
      }

      .frame-excited .frame-dashes {
        opacity: 0.8;
      }

      /* ---- L3 : comète horaire (la star) ----------------------------- */

      /* Un @keyframes par longueur de dash, valeurs LITTÉRALES (pas de
         var(), fiabilité Safari). Règle : from L, to L−1000 ⇒ toutes les
         têtes coïncident (position 1000·t/T), les queues traînent. */
      @keyframes comet-orbit-head {
        from {
          stroke-dashoffset: 10;
        }
        to {
          stroke-dashoffset: -990;
        }
      }

      @keyframes comet-orbit-mid {
        from {
          stroke-dashoffset: 32;
        }
        to {
          stroke-dashoffset: -968;
        }
      }

      @keyframes comet-orbit-long {
        from {
          stroke-dashoffset: 64;
        }
        to {
          stroke-dashoffset: -936;
        }
      }

      /* Masquée pendant l'entrée (le fondu 92→100% s'achève pile au départ
         de l'orbite, sous l'étincelle), puis état naturel 0,85. */
      @keyframes frame-comet-wake {
        0%,
        92% {
          opacity: 0;
        }
        100% {
          opacity: 0.85;
        }
      }

      .frame-comet {
        opacity: 0.85;
        transition: opacity 0.3s ease;
        animation: frame-comet-wake 1.25s linear;
      }

      .frame-excited .frame-comet {
        opacity: 1;
      }

      /* RÈGLE D'OR : la période (--comet-period) ne change JAMAIS en
         excited — modifier animation-duration en vol ferait sauter la
         position de la comète. L'excitation passe par l'intensité et la
         contre-comète.
         SENTINELLE : delay 1.25s = COMET_LAUNCH (TS). */
      .frame-comet path {
        animation-duration: var(--comet-period);
        animation-timing-function: linear;
        animation-delay: 1.25s;
        animation-iteration-count: infinite;
      }

      /* Dashoffsets naturels = L : pendant le réveil, tête posée sur la
         couture du path fermé, queue déjà déployée derrière. */
      .frame-comet-tail-long {
        stroke-dashoffset: 64;
        animation-name: comet-orbit-long;
      }

      .frame-comet-tail-mid {
        stroke: var(--light-blue);
        stroke-dashoffset: 32;
        animation-name: comet-orbit-mid;
      }

      .frame-comet-halo {
        stroke: var(--light-blue);
        stroke-dashoffset: 10;
        animation-name: comet-orbit-head;
      }

      .frame-comet-head {
        stroke: #ffffff;
        stroke-dashoffset: 10;
        animation-name: comet-orbit-head;
      }

      /* ---- L3bis : contre-comète anti-horaire (excited) -------------- */

      /* UN seul keyframes pour les 4 couches : en anti-horaire le bord
         d'attaque est le début du dash, offsets identiques ⇒ têtes alignées
         automatiquement. paused par défaut : la phase est préservée entre
         deux survols, et 5,6s ≠ 7s fait dériver les croisements. */
      @keyframes comet-orbit-ccw {
        from {
          stroke-dashoffset: 0;
        }
        to {
          stroke-dashoffset: 1000;
        }
      }

      /* Garde d'entrée : le groupe vit hors du mask révélateur, il doit
         rester invisible tant que le cadre se dessine, même si excited
         passe à vrai. L'animation prime sur la règle excited et sur la
         transition ; sans fill-mode, l'état naturel opacity 0 reprend
         ensuite. animation-play-state étant une propriété séparée (sur les
         paths), la préservation de phase n'est pas affectée.
         SENTINELLE : durée 1.25s = COMET_LAUNCH (TS). */
      @keyframes ccw-entrance-guard {
        from,
        to {
          opacity: 0;
        }
      }

      .frame-comet-ccw {
        opacity: 0;
        transition: opacity 0.25s ease;
        animation: ccw-entrance-guard 1.25s linear;
      }

      .frame-comet-ccw path {
        stroke: var(--purple);
        animation: comet-orbit-ccw var(--comet-ccw-period) linear infinite;
        animation-play-state: paused;
      }

      .frame-comet-ccw .frame-ccw-head {
        stroke: #ffffff;
      }

      .frame-excited .frame-comet-ccw {
        opacity: 1;
      }

      .frame-excited .frame-comet-ccw path {
        animation-play-state: running;
      }

      /* ---- L4 : équerres de coin ------------------------------------- */

      /* Pop d'apparition avec overshoot ; le stagger horaire TL→TR→BR→BL
         est encodé dans les DURÉES (fenêtre à partir de 79%), pas dans un
         delay : l'état naturel reste l'état visible final. */
      @keyframes frame-corner-pop {
        0%,
        79% {
          opacity: 0;
          transform: scale(0.6);
        }
        89% {
          opacity: 1;
          transform: scale(1.06);
        }
        100% {
          opacity: 0.9;
          transform: scale(1);
        }
      }

      /* Ignition au passage exact de la comète : delay = 1,25s + f·7s posé
         en inline par cornerFlareDelays (fraction curviligne du milieu
         d'arc). Synchro mathématiquement exacte : orbite linéaire sur
         pathLength normalisé. */
      @keyframes frame-corner-flare {
        0% {
          opacity: 0.9;
          transform: scale(1);
        }
        1.5% {
          opacity: 1;
          transform: scale(1.12);
        }
        6%,
        100% {
          opacity: 0.9;
          transform: scale(1);
        }
      }

      .frame-corner {
        opacity: 0.9;
        transform-box: fill-box;
        animation-name: frame-corner-pop, frame-corner-flare;
        animation-timing-function: ease-out, linear;
        animation-iteration-count: 1, infinite;
      }

      .frame-corner-tl {
        transform-origin: 0% 0%;
        animation-duration: 1.39s, var(--comet-period);
      }

      .frame-corner-tr {
        transform-origin: 100% 0%;
        animation-duration: 1.48s, var(--comet-period);
      }

      .frame-corner-br {
        transform-origin: 100% 100%;
        animation-duration: 1.57s, var(--comet-period);
      }

      .frame-corner-bl {
        transform-origin: 0% 100%;
        animation-duration: 1.66s, var(--comet-period);
      }

      /* ---- L5 : ports mi-bord ---------------------------------------- */

      .frame-port {
        opacity: 0.5;
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

  /** Point de départ de l'orbite — (i + r, i), l'ancre de l'étincelle. */
  protected readonly sparkX: number = FRAME_INSET + FRAME_RADIUS;
  protected readonly sparkY: number = FRAME_INSET;

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

  /**
   * Delays des ignitions de coin, au format « pop, flare » (le pop garde son
   * delay nul). f = abscisse curviligne du milieu d'arc / périmètre ; la
   * comète étant linéaire sur pathLength normalisé, delay = 1,25 + f·7 la
   * fait coïncider exactement avec l'équerre. Recalculé au resize : le
   * changement de delay re-phase les boucles depuis leur start time
   * d'origine (css-animations-1), la synchro avec la comète reste donc
   * exacte ; seul un flare en cours (fenêtre de 6% ≈ 0,42s) peut être
   * coupé par le saut de phase pendant le drag, acceptable.
   */
  protected readonly cornerFlareDelays: Signal<{
    tl: string;
    tr: string;
    br: string;
    bl: string;
  }> = computed(() => {
    const w = this._width();
    const h = this._height();
    const i = FRAME_INSET;
    const r = FRAME_RADIUS;
    const top = w - 2 * i - 2 * r;
    const side = h - 2 * i - 2 * r;
    const quarter = (Math.PI * r) / 2;
    const perimeter = 2 * top + 2 * side + 4 * quarter;
    const delay = (arc: number): string =>
      `0s, ${(COMET_LAUNCH + (arc / perimeter) * COMET_PERIOD).toFixed(3)}s`;
    return {
      tr: delay(top + quarter / 2),
      br: delay(top + quarter + side + quarter / 2),
      bl: delay(2 * top + 2 * quarter + side + quarter / 2),
      tl: delay(perimeter - quarter / 2),
    };
  });

  /** Position des pips carrés 2×2px, un par coin. */
  protected readonly pips: Signal<{ right: number; bottom: number }> = computed(
    () => ({
      right: this._width() - 3.5,
      bottom: this._height() - 3.5,
    })
  );

  /**
   * Ports mi-bord : un rect 6×2 (ou 2×6) arrondi par bord, centré sur la
   * ligne des équerres (CORNER_INSET) — finition usinée, statique.
   */
  protected readonly ports: Signal<{
    top: { x: number; y: number };
    bottom: { x: number; y: number };
    left: { x: number; y: number };
    right: { x: number; y: number };
  }> = computed(() => {
    const w = this._width();
    const h = this._height();
    const line = CORNER_INSET;
    return {
      top: { x: w / 2 - 3, y: line - 1 },
      bottom: { x: w / 2 - 3, y: h - line - 1 },
      left: { x: line - 1, y: h / 2 - 3 },
      right: { x: w - line - 1, y: h / 2 - 3 },
    };
  });

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
