import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  Signal,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';

/** Clé localStorage mémorisant le renvoi de la mascotte par le visiteur. */
const STORAGE_KEY = 'portfolio-mascot-hidden';

/** Breakpoint md de Tailwind : la mascotte n'existe que sur ordinateur. */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

/** Si le visiteur préfère réduire les animations, la mascotte ne s'affiche pas du tout. */
const REDUCED_MOTION_MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

/** Largeur du sprite en pixels (doit rester alignée avec .mascot-sprite du CSS). */
const SPRITE_WIDTH = 64;

/** Marge conservée de chaque côté de l'écran, en pixels. */
const EDGE_MARGIN = 24;

/** Vitesse de marche en pixels par seconde — rythme volontairement lent. */
const WALK_SPEED = 26;

/** Durées (en ms) des phases de marche et de pause, tirées au hasard. */
const WALK_DURATION = { min: 6000, max: 12000 } as const;
const IDLE_DURATION = { min: 2800, max: 5600 } as const;

/** Probabilité de repartir dans l'autre sens après une pause. */
const TURN_PROBABILITY = 0.35;

/**
 * Phases de la promenade : marche, simple pause (clignements), petit salut
 * de la main ou regard levé vers le contenu. Les cycles visuels associés
 * sont des keyframes CSS (voir mascot.component.css), seul le déplacement
 * horizontal est calculé ici.
 */
type MascotPhase = 'walking' | 'resting' | 'waving' | 'looking';

/**
 * Mascotte décorative du portfolio : un petit personnage SVG aux couleurs
 * de la charte qui se promène le long du bas de l'écran.
 *
 * Non intrusive par construction :
 * - l'hôte est en `pointer-events: none`, seul le personnage est cliquable ;
 * - un clic la fait disparaître et ce choix est persisté dans localStorage ;
 * - masquée sur mobile (< md) et quand `prefers-reduced-motion` est actif ;
 * - `position: fixed`, aucune incidence sur le layout de la page.
 *
 * Le déplacement tourne dans une boucle requestAnimationFrame hors zone
 * Angular : aucune détection de changement n'est déclenchée par la marche.
 */
@Component({
  selector: 'app-mascot',
  templateUrl: './mascot.component.html',
  styleUrl: './mascot.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MascotComponent implements OnDestroy {
  /** Mascotte renvoyée d'un clic par le visiteur (persisté dans localStorage). */
  private readonly _dismissed: WritableSignal<boolean> = signal(false);

  /** Vrai à partir du breakpoint md (768px). */
  private readonly _isDesktop: WritableSignal<boolean> = signal(false);

  /** Vrai quand le visiteur préfère réduire les animations. */
  private readonly _prefersReducedMotion: WritableSignal<boolean> =
    signal(false);

  /** Animation de disparition en cours, juste avant le retrait du DOM. */
  protected readonly leaving: WritableSignal<boolean> = signal(false);

  /** La mascotte n'est rendue que si rien ne s'y oppose. */
  protected readonly visible: Signal<boolean> = computed(
    () =>
      !this._dismissed() && this._isDesktop() && !this._prefersReducedMotion()
  );

  private readonly _sprite: Signal<ElementRef<HTMLButtonElement> | undefined> =
    viewChild<ElementRef<HTMLButtonElement>>('sprite');

  private readonly _zone: NgZone = inject(NgZone);
  private readonly _mediaListeners: AbortController = new AbortController();

  /* --- État de la promenade, piloté hors zone Angular --- */
  private _spriteElement?: HTMLButtonElement;
  private _strollListeners?: AbortController;
  private _rafId = 0;
  private _x = EDGE_MARGIN;
  private _maxX = EDGE_MARGIN;
  private _direction: 1 | -1 = 1;
  private _phase: MascotPhase = 'resting';
  private _phaseRemaining = 0;
  private _lastTimestamp = 0;

  constructor() {
    this.restoreDismissal();
    this.observeMediaQuery(DESKTOP_MEDIA_QUERY, this._isDesktop);
    this.observeMediaQuery(
      REDUCED_MOTION_MEDIA_QUERY,
      this._prefersReducedMotion
    );

    /* La promenade démarre quand le sprite apparaît dans le DOM et s'arrête
       dès qu'il en sort (passage sous md, reduced-motion, clic de renvoi).
       Pendant l'animation de départ (leaving), la position reste figée. */
    effect((onCleanup) => {
      const sprite = this._sprite()?.nativeElement;
      if (sprite && !this.leaving()) {
        this._zone.runOutsideAngular(() => this.startStroll(sprite));
        onCleanup(() => this.stopStroll());
      }
    });
  }

  ngOnDestroy(): void {
    this.stopStroll();
    this._mediaListeners.abort();
  }

  /** Fait disparaître la mascotte et mémorise ce choix pour les visites suivantes. */
  protected dismiss(): void {
    if (this.leaving()) {
      return;
    }
    this.leaving.set(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Stockage indisponible : la mascotte reviendra à la prochaine visite.
    }
    /* Laisse la petite animation de disparition se jouer avant le retrait du DOM. */
    setTimeout(() => this._dismissed.set(true), 400);
  }

  private restoreDismissal(): void {
    try {
      this._dismissed.set(localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      // Stockage indisponible : la mascotte s'affiche par défaut.
    }
  }

  private observeMediaQuery(
    query: string,
    target: WritableSignal<boolean>
  ): void {
    const mediaQuery = window.matchMedia(query);
    target.set(mediaQuery.matches);
    mediaQuery.addEventListener(
      'change',
      (event) => target.set(event.matches),
      {
        signal: this._mediaListeners.signal,
      }
    );
  }

  /* ------------------------------------------------------------------ */
  /* Boucle de promenade (hors zone Angular)                            */
  /* ------------------------------------------------------------------ */

  private startStroll(sprite: HTMLButtonElement): void {
    this._spriteElement = sprite;
    this._strollListeners = new AbortController();
    window.addEventListener('resize', () => this.updateBounds(), {
      signal: this._strollListeners.signal,
      passive: true,
    });

    this.updateBounds();
    this.applyDirection();
    this.applyPosition();

    /* Entrée en scène : la mascotte apparaît, salue, puis se met en route. */
    this.enterPhase('waving', 2600);
    this._lastTimestamp = performance.now();
    this._rafId = requestAnimationFrame(this._onFrame);
  }

  private stopStroll(): void {
    cancelAnimationFrame(this._rafId);
    this._rafId = 0;
    this._strollListeners?.abort();
    this._strollListeners = undefined;
    this._spriteElement = undefined;
  }

  private readonly _onFrame = (timestamp: number): void => {
    if (!this._spriteElement) {
      return;
    }

    /* Delta borné : au retour d'un onglet inactif, pas de téléportation. */
    const delta = Math.min(timestamp - this._lastTimestamp, 64);
    this._lastTimestamp = timestamp;
    this._phaseRemaining -= delta;

    if (this._phase === 'walking') {
      this._x += (this._direction * WALK_SPEED * delta) / 1000;
      if (this._x <= EDGE_MARGIN || this._x >= this._maxX) {
        this._x = Math.min(Math.max(this._x, EDGE_MARGIN), this._maxX);
        this.turnAround();
      }
      this.applyPosition();
    }

    if (this._phaseRemaining <= 0) {
      if (this._phase === 'walking') {
        this.enterIdlePhase();
      } else {
        this.enterWalkingPhase();
      }
    }

    this._rafId = requestAnimationFrame(this._onFrame);
  };

  /** Choisit une pause : simple arrêt, salut de la main ou regard vers le contenu. */
  private enterIdlePhase(): void {
    const roll = Math.random();
    const phase: MascotPhase =
      roll < 0.45 ? 'resting' : roll < 0.8 ? 'looking' : 'waving';
    this.enterPhase(phase, this.randomDuration(IDLE_DURATION));
  }

  private enterWalkingPhase(): void {
    if (Math.random() < TURN_PROBABILITY) {
      this.turnAround();
    }
    this.enterPhase('walking', this.randomDuration(WALK_DURATION));
  }

  private enterPhase(phase: MascotPhase, duration: number): void {
    this._phase = phase;
    this._phaseRemaining = duration;
    const sprite = this._spriteElement;
    if (!sprite) {
      return;
    }
    /* Les cycles visuels (marche, salut, regard) sont des keyframes CSS
       déclenchées par ces classes ; le clignement, lui, tourne en continu. */
    sprite.classList.toggle('is-walking', phase === 'walking');
    sprite.classList.toggle('is-waving', phase === 'waving');
    sprite.classList.toggle('is-looking', phase === 'looking');
  }

  private turnAround(): void {
    this._direction = this._direction === 1 ? -1 : 1;
    this.applyDirection();
  }

  /** Le retournement est un scaleX animé en CSS sur .mascot-flip. */
  private applyDirection(): void {
    this._spriteElement?.classList.toggle(
      'is-facing-left',
      this._direction === -1
    );
  }

  private applyPosition(): void {
    if (this._spriteElement) {
      this._spriteElement.style.transform = `translate3d(${this._x}px, 0, 0)`;
    }
  }

  /** Garde la mascotte dans l'écran, notamment quand la fenêtre rétrécit. */
  private updateBounds(): void {
    this._maxX = Math.max(
      EDGE_MARGIN,
      window.innerWidth - SPRITE_WIDTH - EDGE_MARGIN
    );
    if (this._x > this._maxX) {
      this._x = this._maxX;
      this.applyPosition();
    }
  }

  private randomDuration(range: { min: number; max: number }): number {
    return range.min + Math.random() * (range.max - range.min);
  }
}
