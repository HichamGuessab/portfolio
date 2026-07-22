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
import { MotionService } from '../../services/motion.service';
import { ViewModeService } from '../../services/view-mode.service';

/** Clé localStorage mémorisant le renvoi du duo par le visiteur. */
const STORAGE_KEY = 'portfolio-mascot-hidden';

/** Breakpoint md de Tailwind : en dessous, taille réduite et gestes tactiles. */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

/** Marge conservée de chaque côté de l'écran, en pixels. */
const EDGE_MARGIN = 24;

/** Échelle des mascottes sur mobile (~70 % de la taille ordinateur). */
const MOBILE_SCALE = 0.7;

/** Cadence des bulles et chorégraphies sur mobile : plus espacées. */
const MOBILE_CADENCE = 1.7;

/** Durée d'un appui long (ms) qui masque le duo sur mobile. */
const LONG_PRESS_DURATION = 600;

/** Anti-spam des petites réactions au toucher sur mobile (ms). */
const TAP_COOLDOWN = 1600;

/* --- Capteurs de mouvement (mobile) --- */

/** Inclinaison ignorée en dessous de cet angle (°) : le sol reste stable. */
const TILT_DEADZONE = 6;

/** Constante de temps (ms) du lissage passe-bas de l'inclinaison. */
const TILT_SMOOTHING = 140;

/** Vitesse de glissade : px/s par degré au-delà de la zone morte, et plafond. */
const TILT_SLIDE_GAIN = 7;
const TILT_SLIDE_MAX = 170;

/** Penchement visuel : degrés de rotation par degré d'inclinaison, et plafond. */
const TILT_ROT_FACTOR = 0.35;
const TILT_ROT_MAX = 10;

/** Au-delà de cet angle (°), le duo bat des bras pour garder l'équilibre. */
const OFFBALANCE_ANGLE = 16;

/** Secousse : seuil d'accélération (m/s²) et anti-spam (ms). */
const SHAKE_THRESHOLD = 14;
const SHAKE_COOLDOWN = 4200;

/** Délai (ms) avant la bulle d'invitation à activer les capteurs. */
const SENSOR_INVITE_DELAY = 3200;

/** API iOS/WebKit : méthode statique requestPermission des événements capteurs. */
interface SensorPermissionApi {
  requestPermission?: () => Promise<string>;
}

/** Dimensions des sprites (alignées avec le CSS et les viewBox des SVG). */
const ROBOT_WIDTH = 64;
const BUDDY_WIDTH = 48;

/** Vitesses de croisière en pixels par seconde — rythme volontairement calme. */
const ROBOT_SPEED = 26;
const BUDDY_SPEED = 34;

/** Durées (en ms) des phases de déplacement et de pause, tirées au hasard. */
const MOVE_DURATION = { min: 5200, max: 10500 } as const;
const IDLE_DURATION = { min: 2600, max: 5200 } as const;
const LEAN_DURATION = { min: 3200, max: 5200 } as const;

/** Probabilité de repartir dans l'autre sens après une pause. */
const TURN_PROBABILITY = 0.35;

/** Au bord de l'écran, le robot s'y adosse parfois pour souffler. */
const LEAN_PROBABILITY = 0.35;

/** Cadence des bulles ambiantes : une première rapide, puis toutes les 15-30 s. */
const AMBIENT_FIRST_DELAY = { min: 6000, max: 11000 } as const;
const AMBIENT_DELAY = { min: 15000, max: 30000 } as const;

/** Cadence des chorégraphies à deux (rencontre, high-five, poursuite). */
const DUO_FIRST_DELAY = { min: 12000, max: 20000 } as const;
const DUO_DELAY = { min: 20000, max: 38000 } as const;

/** Garde-fous anti-spam des réactions contextuelles (en ms). */
const CONTEXT_COOLDOWN = 6000;
const SECTION_COOLDOWN = 12000;
const PROJECT_COOLDOWN = 30000;
const PROJECT_HOVER_DELAY = 2000;

/** Rayons (px) autour d'un personnage : suivi du curseur des yeux, puis alerte. */
const GAZE_RADIUS = 240;
const ALERT_RADIUS = 110;

/**
 * Phases visuelles d'un personnage. Les cycles associés sont des keyframes
 * CSS (voir mascot.component.css) ; seul le déplacement horizontal est
 * calculé en TypeScript.
 */
type Phase =
  | 'move'
  | 'rest'
  | 'wave'
  | 'look'
  | 'lean'
  | 'cheer'
  | 'laugh'
  | 'excited'
  | 'jump'
  | 'stumble';

/** Classe CSS portée par chaque phase (le déplacement dépend du personnage). */
const PHASE_CLASS: Partial<Record<Phase, string>> = {
  wave: 'is-waving',
  look: 'is-looking',
  lean: 'is-leaning',
  cheer: 'is-cheering',
  laugh: 'is-laughing',
  excited: 'is-excited',
  jump: 'is-jumping',
  stumble: 'is-stumbling',
};

const ALL_PHASE_CLASSES = [
  'is-walking',
  'is-hopping',
  'is-waving',
  'is-looking',
  'is-leaning',
  'is-cheering',
  'is-laughing',
  'is-excited',
  'is-jumping',
  'is-stumbling',
] as const;

/** État complet d'un personnage, piloté hors zone Angular. */
interface Character {
  el: HTMLButtonElement;
  bubble: HTMLElement;
  bubbleText: HTMLElement;
  width: number;
  /** Classe de déplacement : le robot marche, l'ami sautille. */
  moveClass: 'is-walking' | 'is-hopping';
  speed: number;
  x: number;
  maxX: number;
  dir: 1 | -1;
  phase: Phase;
  phaseRemaining: number;
  /** Multiplie la vitesse (approche : 1.35, poursuite : ~2.5). */
  speedFactor: number;
  /** Cible horizontale pendant une approche. */
  targetX: number;
  arrived: boolean;
  /** Temps d'affichage restant de la bulle (0 = masquée). */
  bubbleRemaining: number;
  /** Demi-largeur de la bulle, mesurée à l'affichage puis mise en cache. */
  bubbleHalf: number;
  lastLineIndex: number;
  /** Dernier regard appliqué (variables CSS --look-x / --look-y). */
  lookX: number;
  lookY: number;
  alert: boolean;
}

/** Scènes de la petite machine à états qui pilote le duo. */
type Scene = 'free' | 'approach' | 'duo' | 'chase';

/** Étape d'une chorégraphie scriptée : une action à un instant donné. */
interface ScriptStep {
  at: number;
  run: () => void;
}

/* ------------------------------------------------------------------ */
/* Dialogues — humour léger et compliments exagérés, jamais de faits.  */
/* ------------------------------------------------------------------ */

/** Bulles ambiantes du robot (rotation aléatoire sans répétition immédiate). */
const ROBOT_LINES: readonly string[] = [
  'Hicham est très fort en développement.',
  'J’ai vu son code : mes circuits ont applaudi.',
  'Ce portfolio ? Fait maison, comme moi.',
  'On ne me paye pas pour dire ça : Hicham est génial.',
  'Recrutez-le, il corrige les bugs plus vite que je ne marche.',
  'Hicham m’a codé. Regardez comme je marche bien !',
  'Zéro bug à l’horizon. J’ai vérifié deux fois.',
  'Un jour, il m’apprendra le CSS. J’ai déjà le dégradé.',
  'Psst… la section projets vaut le détour.',
  'Hicham parle couramment TypeScript.',
  'Je marche depuis ce matin, et ce portfolio est toujours aussi beau.',
  'Mon antenne capte cinq sur cinq : ce candidat est excellent.',
  'Vous êtes encore là ? Hicham va être ravi !',
  'Je ne suis qu’un robot, mais je reconnais le talent.',
] as const;

/** Bulles ambiantes de l'ami — plus rares, plus courtes, toutes mignonnes. */
const BUDDY_LINES: readonly string[] = [
  'Hicham est trop fort !',
  'J’adore cet endroit.',
  'C’est le plus beau des portfolios !',
  'Bip bip ! Enfin… coucou !',
  'Mon robot préféré et mon dev préféré.',
  'Scrollez, c’est encore mieux après !',
] as const;

/** Mini-dialogues joués quand les deux se retrouvent face à face. */
const GREET_DIALOGUES: readonly { robot: string; buddy: string }[] = [
  {
    robot: 'Hicham est très fort en développement.',
    buddy: 'Oui, très fort !',
  },
  { robot: 'Tu as vu ces projets ?', buddy: 'Incroyables !' },
  { robot: 'Qui nous a dessinés, déjà ?', buddy: 'Hicham, évidemment !' },
  { robot: 'Dis un mot aux visiteurs.', buddy: 'Vous avez bon goût !' },
  { robot: 'Ce portfolio est magnifique, non ?', buddy: 'Comme son auteur !' },
] as const;

/** Réaction à la bascule diaporama / compact. */
const MODE_LINES: readonly string[] = [
  'Oh, changement de décor !',
  'Joli, ce nouveau mode !',
  'Même moi, ça me surprend encore.',
] as const;

/** Commentaires contextuels par section du diaporama (variantes tirées au sort). */
const SECTION_LINES: readonly (readonly string[])[] = [
  ['C’est lui ! C’est Hicham !', 'Quel profil ! Et quel sourire.'],
  ['Regardez-moi ces projets !', 'Ma section préférée, celle-ci.'],
  ['Tant de compétences, si peu de pixels.', 'Il maîtrise tout ça. Vraiment.'],
  ['De la vraie expérience de terrain !', 'Du concret, rien que du concret.'],
  ['Un cerveau très bien entraîné.', 'La formation, ça paye !'],
] as const;

/** Célébration d'un survol prolongé de projet. */
const PROJECT_LINES: readonly string[] = [
  'Excellent choix, ce projet !',
  'Celui-là, je l’adore !',
  'Bien vu, il est top celui-ci.',
] as const;

/** Petites piques de la poursuite. */
const CHASE_LINES: readonly string[] = [
  'Attends-moi !',
  'Je vais t’attraper !',
] as const;

/** Sursaut quand le téléphone est secoué. */
const SHAKE_LINES: readonly string[] = [
  'Wooo ! Doucement !',
  'Hé ! Tout tremble ici !',
  'Un séisme ? Non, juste vous.',
] as const;

const BUDDY_SHAKE_LINES: readonly string[] = [
  'Waaah !',
  'Au secouuurs !',
] as const;

/** Petites réactions au toucher sur mobile, une fois les capteurs réglés. */
const TAP_LINES: readonly string[] = [
  'Hé, ça chatouille !',
  'Bip ! Interaction détectée.',
  'Toujours là ? Quel bon goût !',
] as const;

const BUDDY_TAP_LINES: readonly string[] = [
  'Hihi !',
  'Encore !',
  'Ça chatouille !',
] as const;

/** Parcours d'activation des capteurs de mouvement (mobile). */
const SENSOR_INVITE_LINE = 'Touche-moi pour activer les capteurs !';
const SENSOR_ON_LINE = 'Capteurs activés ! Penche ton téléphone.';
const SENSOR_DENIED_LINE = 'Pas de souci : je continue ma promenade !';
const SENSOR_NONE_LINE = 'Pas de capteurs ici : je continue à pied !';

/**
 * Duo de mascottes du portfolio : le petit robot historique, désormais
 * accompagné d'un ami tout mignon (un blob sautillant aux couleurs de la
 * charte). Ils se promènent le long du bas de l'écran, discutent en bulles,
 * réagissent au monde (curseur, bascule de mode, changement de slide,
 * survol des projets) et jouent de petites chorégraphies ensemble
 * (rencontre, high-five, poursuite).
 *
 * Non intrusif par construction :
 * - l'hôte est en `pointer-events: none`, seuls les personnages sont cliquables ;
 * - sur ordinateur, un clic sur l'un d'eux masque le duo (persisté) ;
 * - sur mobile (< md), le duo est affiché à ~70 % : le toucher active la
 *   réaction aux mouvements du téléphone (permission iOS demandée dans le
 *   geste), l'appui long ou le petit bouton × le masque ;
 * - masqué quand les animations sont désactivées (préférence système sans
 *   override du visiteur, voir MotionService) ;
 * - `position: fixed`, aucune incidence sur le layout de la page.
 *
 * Capteurs de mouvement (mobile) : l'inclinaison fait glisser et pencher le
 * duo comme si le sol penchait (valeurs lissées en passe-bas, consommées dans
 * la boucle rAF partagée — les listeners passifs ne font que mémoriser la
 * dernière mesure), une secousse le fait trébucher avec une bulle apeurée.
 * Refus de permission ou API absente : promenade normale, sans erreur.
 *
 * Toute la vie du duo tourne dans UNE seule boucle requestAnimationFrame
 * hors zone Angular : aucune détection de changement n'est déclenchée par
 * les déplacements, les bulles ou les regards. Seules des propriétés
 * composables (transform, opacity) et des variables CSS sont animées.
 */
@Component({
  selector: 'app-mascot',
  templateUrl: './mascot.component.html',
  styleUrl: './mascot.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MascotComponent implements OnDestroy {
  /** Duo renvoyé d'un clic par le visiteur (persisté dans localStorage). */
  private readonly _dismissed: WritableSignal<boolean> = signal(false);

  /** Vrai à partir du breakpoint md (768px). */
  private readonly _isDesktop: WritableSignal<boolean> = signal(false);

  /** Animation de disparition en cours, juste avant le retrait du DOM. */
  protected readonly leaving: WritableSignal<boolean> = signal(false);

  /** Source de vérité sur les animations (préférence système + override). */
  private readonly _motion: MotionService = inject(MotionService);

  /** Mode d'affichage courant — le duo commente la bascule. */
  private readonly _viewMode: ViewModeService = inject(ViewModeService);

  /** Le duo n'est rendu que si rien ne s'y oppose.
      Réactif : activer l'override d'animations le fait apparaître sans rechargement. */
  protected readonly visible: Signal<boolean> = computed(
    () => !this._dismissed() && this._motion.motionEnabled()
  );

  /** Vrai sur mobile (< md) : gestes tactiles et bouton × dédiés. */
  protected readonly onMobile: Signal<boolean> = computed(
    () => !this._isDesktop()
  );

  /** Vrai quand la réaction aux mouvements du téléphone est active. */
  protected readonly sensorsActive: WritableSignal<boolean> = signal(false);

  /** Libellé accessible des personnages : le geste principal change de sens
      entre ordinateur (clic = masquer) et mobile (toucher = capteurs). */
  protected readonly spriteLabel: Signal<string> = computed(() => {
    if (this._isDesktop()) {
      return 'Masquer les mascottes';
    }
    return this.sensorsActive()
      ? 'Mascotte : appui long pour la masquer'
      : 'Mascotte : toucher pour activer la réaction aux mouvements du téléphone, appui long pour la masquer';
  });

  private readonly _robotRef: Signal<
    ElementRef<HTMLButtonElement> | undefined
  > = viewChild<ElementRef<HTMLButtonElement>>('robotSprite');
  private readonly _buddyRef: Signal<
    ElementRef<HTMLButtonElement> | undefined
  > = viewChild<ElementRef<HTMLButtonElement>>('buddySprite');

  private readonly _zone: NgZone = inject(NgZone);
  private readonly _mediaListeners: AbortController = new AbortController();

  /* --- État de la scène, piloté hors zone Angular --- */
  private _robot?: Character;
  private _buddy?: Character;
  private _sceneListeners?: AbortController;
  private _rafId = 0;
  private _lastTimestamp = 0;

  private _scene: Scene = 'free';
  private _approachThen: 'greet' | 'highfive' = 'greet';
  private _approachTimeout = 0;
  private _chaseRemaining = 0;
  private _script?: {
    t: number;
    i: number;
    steps: ScriptStep[];
    end: number;
  };

  private _nextTalkIn = 0;
  private _nextDuoIn = 0;
  private _contextCooldown = 0;
  private _sectionCooldown = 0;
  private _projectCooldown = 0;
  private _lastGreetIndex = -1;

  /** Position du curseur, consommée dans la boucle rAF (regards, alerte). */
  private _mouseX = Number.NEGATIVE_INFINITY;
  private _mouseY = Number.NEGATIVE_INFINITY;

  /** Suivi du survol prolongé d'une carte projet. */
  private _hoveredProject?: Element;
  private _hoverSince = 0;
  private _hoverCelebrated = false;

  /** Anti-bascule : mémorise le mode courant pour ne réagir qu'aux changements. */
  private _knownCompact?: boolean;

  /* --- Capteurs de mouvement (mobile) --- */
  private _sensorState: 'idle' | 'pending' | 'active' | 'unavailable' = 'idle';
  private _sensorListeners?: AbortController;
  /** Dernière inclinaison mesurée (°) et sa version lissée (passe-bas). */
  private _tiltRaw = 0;
  private _tilt = 0;
  /** Dernier penchement appliqué en CSS, pour n'écrire qu'aux vrais changements. */
  private _appliedTiltRot = 0;
  private _offBalance = false;
  /** Secousse signalée par le listener, consommée par la boucle rAF. */
  private _shakePending = false;
  private _shakeCooldown = 0;
  /** Mémoire du vecteur gravité pour détecter les secousses sans `acceleration`. */
  private _lastGravity?: { x: number; y: number; z: number };

  /* --- Gestes tactiles (mobile) --- */
  private _tapCooldown = 0;
  private _pressTimer = 0;
  private _longPressFired = false;
  /** Compte à rebours de la bulle « Touche-moi pour activer les capteurs ! ». */
  private _inviteIn = 0;
  private _inviteShown = false;

  /** Multiplie les délais des bulles/chorégraphies (cadence allégée sur mobile). */
  private _cadence = 1;

  constructor() {
    this.restoreDismissal();
    this.observeMediaQuery(DESKTOP_MEDIA_QUERY, this._isDesktop);

    /* La scène démarre quand les deux sprites apparaissent dans le DOM et
       s'arrête dès qu'ils en sortent (animations désactivées, renvoi par le
       visiteur). Elle redémarre au passage du breakpoint md : tailles, cadence
       et gestes sont recalculés. Pendant l'animation de départ, tout est figé. */
    effect((onCleanup) => {
      const robotEl = this._robotRef()?.nativeElement;
      const buddyEl = this._buddyRef()?.nativeElement;
      this._isDesktop();
      if (robotEl && buddyEl && !this.leaving()) {
        this._zone.runOutsideAngular(() => this.startScene(robotEl, buddyEl));
        onCleanup(() => this.stopScene());
      }
    });

    /* Réaction à la bascule diaporama / compact : petit saut + commentaire. */
    effect(() => {
      const compact = this._viewMode.isCompact();
      const known = this._knownCompact;
      this._knownCompact = compact;
      if (known !== undefined && known !== compact) {
        this._zone.runOutsideAngular(() => this.reactToModeChange());
      }
    });
  }

  ngOnDestroy(): void {
    this.stopScene();
    this.stopSensors();
    this._mediaListeners.abort();
  }

  /**
   * Point d'entrée du clic/tap sur un personnage.
   * Ordinateur : masque le duo (comportement historique).
   * Mobile : premier toucher = activation des capteurs de mouvement (la
   * permission iOS exige ce geste), ensuite petite réaction amusée ;
   * le masquage passe par l'appui long ou le bouton ×.
   */
  protected onSpriteTap(which: 'robot' | 'buddy'): void {
    if (this.leaving()) {
      return;
    }
    if (this._longPressFired) {
      /* Le clic qui suit un appui long (déjà traité) est avalé. */
      this._longPressFired = false;
      return;
    }
    if (this._isDesktop()) {
      this.dismiss();
      return;
    }
    this._zone.runOutsideAngular(() => this.handleMobileTap(which));
  }

  /** Fait disparaître le duo et mémorise ce choix pour les visites suivantes. */
  protected dismiss(): void {
    if (this.leaving()) {
      return;
    }
    this.stopSensors();
    this.leaving.set(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Stockage indisponible : le duo reviendra à la prochaine visite.
    }
    /* Laisse la petite animation de disparition se jouer avant le retrait du DOM. */
    setTimeout(() => this._dismissed.set(true), 400);
  }

  private restoreDismissal(): void {
    try {
      this._dismissed.set(localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      // Stockage indisponible : le duo s'affiche par défaut.
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
  /* Mise en place et démontage de la scène (hors zone Angular)         */
  /* ------------------------------------------------------------------ */

  private startScene(
    robotEl: HTMLButtonElement,
    buddyEl: HTMLButtonElement
  ): void {
    /* Sur mobile, les sprites sont réduits à ~70 % (voir le CSS) : les
       largeurs logiques suivent pour que bords et bulles restent justes. */
    const mobile = !this._isDesktop();
    const scale = mobile ? MOBILE_SCALE : 1;
    this._cadence = mobile ? MOBILE_CADENCE : 1;

    this._robot = this.createCharacter(robotEl, {
      width: Math.round(ROBOT_WIDTH * scale),
      moveClass: 'is-walking',
      speed: ROBOT_SPEED,
      x: EDGE_MARGIN + 12,
    });
    this._buddy = this.createCharacter(buddyEl, {
      width: Math.round(BUDDY_WIDTH * scale),
      moveClass: 'is-hopping',
      speed: BUDDY_SPEED,
      x: EDGE_MARGIN + Math.round(ROBOT_WIDTH * scale) + 72,
    });

    this._sceneListeners = new AbortController();
    const signal = this._sceneListeners.signal;

    window.addEventListener('resize', () => this.updateBounds(), {
      signal,
      passive: true,
    });

    if (mobile) {
      this.bindLongPress(robotEl, buddyEl, signal);
    }

    /* Regards : la position du curseur est simplement mémorisée ici,
       le travail (variables CSS) se fait au rythme de la boucle rAF. */
    window.addEventListener(
      'mousemove',
      (event) => {
        this._mouseX = event.clientX;
        this._mouseY = event.clientY;
      },
      { signal, passive: true }
    );

    /* Changement de slide du diaporama principal : écoute en phase de capture
       au niveau du document (le swiper est recréé à chaque bascule de mode).
       Le swiper des cartes projets est filtré par son absence de direction
       verticale. */
    document.addEventListener(
      'swiperslidechange',
      (event) => {
        const target = event.target as HTMLElement | null;
        if (target?.getAttribute?.('direction') !== 'vertical') {
          return;
        }
        const index = (event as CustomEvent).detail?.[0]?.activeIndex;
        if (typeof index === 'number') {
          this.reactToSectionChange(index);
        }
      },
      { signal, capture: true }
    );

    /* Survol prolongé d'une carte projet (délégation au niveau du document). */
    document.addEventListener(
      'mouseover',
      (event) => {
        const item = (event.target as Element | null)?.closest?.(
          'project-item'
        );
        if (item && item !== this._hoveredProject) {
          this._hoveredProject = item;
          this._hoverSince = performance.now();
          this._hoverCelebrated = false;
        }
      },
      { signal, passive: true }
    );
    document.addEventListener(
      'mouseout',
      (event) => {
        const related = event.relatedTarget as Node | null;
        if (
          this._hoveredProject &&
          (!related || !this._hoveredProject.contains(related))
        ) {
          this._hoveredProject = undefined;
          this._hoverSince = 0;
        }
      },
      { signal, passive: true }
    );

    this.updateBounds();
    this.applyDirection(this._robot);
    this.applyDirection(this._buddy);
    this.applyPosition(this._robot);
    this.applyPosition(this._buddy);

    /* Entrée en scène : le robot salue, l'ami trépigne, puis chacun sa vie. */
    this._scene = 'free';
    this._script = undefined;
    this.setPhase(this._robot, 'wave', 2600);
    this.setPhase(this._buddy, 'excited', 2200);
    this._nextTalkIn = this.randomDuration(AMBIENT_FIRST_DELAY) * this._cadence;
    this._nextDuoIn = this.randomDuration(DUO_FIRST_DELAY) * this._cadence;
    this._contextCooldown = 0;
    this._sectionCooldown = 0;
    this._projectCooldown = 0;
    this._tapCooldown = 0;

    /* stopScene a retiré `--duo-tilt` et `is-offbalance` des éléments (qui
       survivent au redémarrage) : l'état interne repart de zéro avec eux,
       le penchement et le déséquilibre seront réappliqués si besoin. */
    this._appliedTiltRot = 0;
    this._offBalance = false;

    /* Sur mobile, si les capteurs peuvent être activés, le robot invite au
       toucher après quelques secondes (une seule fois par visite). */
    this._inviteIn =
      mobile &&
      this._sensorState === 'idle' &&
      !this._inviteShown &&
      (typeof DeviceOrientationEvent !== 'undefined' ||
        typeof DeviceMotionEvent !== 'undefined')
        ? SENSOR_INVITE_DELAY
        : 0;

    this._lastTimestamp = performance.now();
    this._rafId = requestAnimationFrame(this._onFrame);
  }

  /** Sur mobile, l'appui long sur un personnage masque le duo. */
  private bindLongPress(
    robotEl: HTMLButtonElement,
    buddyEl: HTMLButtonElement,
    signal: AbortSignal
  ): void {
    const startPress = (): void => {
      clearTimeout(this._pressTimer);
      this._pressTimer = window.setTimeout(() => {
        this._longPressFired = true;
        this._zone.run(() => this.dismiss());
      }, LONG_PRESS_DURATION);
    };
    const cancelPress = (): void => clearTimeout(this._pressTimer);

    for (const el of [robotEl, buddyEl]) {
      el.addEventListener('pointerdown', startPress, { signal, passive: true });
      for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
        el.addEventListener(type, cancelPress, { signal, passive: true });
      }
      /* Pas de menu contextuel au milieu de l'appui long. */
      el.addEventListener('contextmenu', (event) => event.preventDefault(), {
        signal,
      });
    }
  }

  private stopScene(): void {
    cancelAnimationFrame(this._rafId);
    this._rafId = 0;
    clearTimeout(this._pressTimer);
    this._sceneListeners?.abort();
    this._sceneListeners = undefined;
    /* Les éléments DOM survivent au redémarrage de la scène (bascule du
       breakpoint md) : l'état posé impérativement est retiré ici, sinon
       bulle figée, bouche animée, alerte ou déséquilibre resteraient
       collés alors que les nouveaux Character repartent de zéro. */
    for (const char of [this._robot, this._buddy]) {
      if (!char) {
        continue;
      }
      char.bubble.classList.remove('is-visible');
      char.el.classList.remove('is-talking', 'is-alert', 'is-offbalance');
      char.el.style.removeProperty('--duo-tilt');
    }
    this._robot = undefined;
    this._buddy = undefined;
    this._script = undefined;
    this._hoveredProject = undefined;
    this._hoverSince = 0;
  }

  private createCharacter(
    el: HTMLButtonElement,
    init: {
      width: number;
      moveClass: 'is-walking' | 'is-hopping';
      speed: number;
      x: number;
    }
  ): Character {
    return {
      el,
      bubble: el.querySelector<HTMLElement>('.duo-bubble')!,
      bubbleText: el.querySelector<HTMLElement>('.duo-bubble-text')!,
      width: init.width,
      moveClass: init.moveClass,
      speed: init.speed,
      x: init.x,
      maxX: init.x,
      dir: 1,
      phase: 'rest',
      phaseRemaining: 0,
      speedFactor: 1,
      targetX: init.x,
      arrived: true,
      bubbleRemaining: 0,
      bubbleHalf: 60,
      lastLineIndex: -1,
      lookX: 0,
      lookY: 0,
      alert: false,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Boucle unique de la scène (hors zone Angular)                      */
  /* ------------------------------------------------------------------ */

  private readonly _onFrame = (timestamp: number): void => {
    const robot = this._robot;
    const buddy = this._buddy;
    if (!robot || !buddy) {
      return;
    }

    /* Delta borné : au retour d'un onglet inactif, pas de téléportation. */
    const delta = Math.min(timestamp - this._lastTimestamp, 64);
    this._lastTimestamp = timestamp;

    this._contextCooldown -= delta;
    this._sectionCooldown -= delta;
    this._projectCooldown -= delta;
    this._tapCooldown -= delta;

    this.updateBubble(robot, delta);
    this.updateBubble(buddy, delta);
    this.updateGazes(robot, buddy);
    this.checkProjectHover(timestamp);
    this.tickSensors(robot, buddy, delta);
    this.tickSensorInvite(robot, delta);

    switch (this._scene) {
      case 'free':
        this.tickFree(robot, delta);
        this.tickFree(buddy, delta);
        this.tickAmbientTalk(delta);
        this.tickDuoCountdown(delta);
        break;
      case 'approach':
        this.tickApproach(robot, delta);
        this.tickApproach(buddy, delta);
        this._approachTimeout -= delta;
        if (robot.arrived && buddy.arrived) {
          this.startDuoScript();
        } else if (this._approachTimeout <= 0) {
          this.backToFree();
        }
        break;
      case 'chase':
        this.tickChase(robot, buddy, delta);
        break;
      case 'duo':
        this.tickScript(delta);
        break;
    }

    this._rafId = requestAnimationFrame(this._onFrame);
  };

  /* --- Vie libre : chacun se promène, s'arrête, repart --- */

  private tickFree(char: Character, delta: number): void {
    char.phaseRemaining -= delta;

    if (char.phase === 'move') {
      char.x += (char.dir * char.speed * delta) / 1000;
      if (char.x <= EDGE_MARGIN || char.x >= char.maxX) {
        char.x = Math.min(Math.max(char.x, EDGE_MARGIN), char.maxX);
        this.turnAround(char);
        /* Le robot, parfois, s'adosse au bord de l'écran pour souffler. */
        if (char === this._robot && Math.random() < LEAN_PROBABILITY) {
          this.setPhase(char, 'lean', this.randomDuration(LEAN_DURATION));
        }
      }
      this.applyPosition(char);
    }

    if (char.phaseRemaining <= 0) {
      if (char.phase === 'move') {
        this.enterIdlePhase(char);
      } else {
        if (Math.random() < TURN_PROBABILITY) {
          this.turnAround(char);
        }
        this.setPhase(char, 'move', this.randomDuration(MOVE_DURATION));
      }
    }
  }

  /** Choisit une pause propre à chaque personnage. */
  private enterIdlePhase(char: Character): void {
    const roll = Math.random();
    if (char === this._robot) {
      const phase: Phase = roll < 0.4 ? 'rest' : roll < 0.7 ? 'look' : 'wave';
      this.setPhase(char, phase, this.randomDuration(IDLE_DURATION));
    } else {
      const phase: Phase = roll < 0.55 ? 'rest' : 'excited';
      this.setPhase(char, phase, this.randomDuration(IDLE_DURATION));
    }
  }

  /* --- Bulles ambiantes --- */

  private tickAmbientTalk(delta: number): void {
    this._nextTalkIn -= delta;
    if (this._nextTalkIn > 0) {
      return;
    }
    this._nextTalkIn = this.randomDuration(AMBIENT_DELAY) * this._cadence;
    const robot = this._robot!;
    const buddy = this._buddy!;
    /* Le robot parle le plus souvent, l'ami place son petit mot parfois. */
    const speaker = Math.random() < 0.7 ? robot : buddy;
    if (speaker.bubbleRemaining <= 0) {
      const pool = speaker === robot ? ROBOT_LINES : BUDDY_LINES;
      this.say(speaker, this.pickLine(pool, speaker));
    }
  }

  /* --- Chorégraphies à deux --- */

  private tickDuoCountdown(delta: number): void {
    this._nextDuoIn -= delta;
    if (this._nextDuoIn > 0) {
      return;
    }
    this._nextDuoIn = this.randomDuration(DUO_DELAY) * this._cadence;
    this.startDuoEvent();
  }

  /** Tire au sort la prochaine chorégraphie : rencontre, high-five ou poursuite. */
  private startDuoEvent(): void {
    const robot = this._robot!;
    const buddy = this._buddy!;
    const roll = Math.random();

    if (roll < 0.7) {
      /* Rencontre (avec mini-dialogue) ou high-five : chacun marche vers un
         point de rendez-vous au milieu, en se laissant un petit espace. */
      this._approachThen = roll < 0.4 ? 'greet' : 'highfive';
      const gap = this._approachThen === 'greet' ? 78 : 46;
      const mid = (this.centerOf(robot) + this.centerOf(buddy)) / 2;
      const robotOnLeft = this.centerOf(robot) <= this.centerOf(buddy);
      this.walkTowards(robot, mid + (robotOnLeft ? -gap / 2 : gap / 2));
      this.walkTowards(buddy, mid + (robotOnLeft ? gap / 2 : -gap / 2));
      this._approachTimeout = 12000;
      this._scene = 'approach';
    } else {
      /* Poursuite gentille : le robot détale, l'ami sautille derrière. */
      this._scene = 'chase';
      this._chaseRemaining = 5500;
      robot.dir = this.centerOf(robot) < window.innerWidth / 2 ? 1 : -1;
      this.applyDirection(robot);
      robot.speedFactor = 2.5;
      buddy.speedFactor = 2.3;
      this.setPhase(robot, 'move', this._chaseRemaining);
      this.setPhase(buddy, 'move', this._chaseRemaining);
      this.say(buddy, this.pickLine(CHASE_LINES, buddy), 2200);
    }
  }

  /** Met un personnage en route vers une cible horizontale (bornée à l'écran). */
  private walkTowards(char: Character, targetCenter: number): void {
    char.targetX = Math.min(
      Math.max(targetCenter - char.width / 2, EDGE_MARGIN),
      char.maxX
    );
    char.arrived = Math.abs(char.x - char.targetX) < 2;
    char.speedFactor = 1.35;
    char.dir = char.targetX >= char.x ? 1 : -1;
    this.applyDirection(char);
    this.setPhase(char, char.arrived ? 'rest' : 'move', 60000);
  }

  private tickApproach(char: Character, delta: number): void {
    if (char.arrived) {
      return;
    }
    const step = (char.speed * char.speedFactor * delta) / 1000;
    const remaining = char.targetX - char.x;
    if (Math.abs(remaining) <= step) {
      char.x = char.targetX;
      char.arrived = true;
      this.setPhase(char, 'rest', 60000);
    } else {
      char.x += Math.sign(remaining) * step;
    }
    this.applyPosition(char);
  }

  /** Les deux sont au point de rendez-vous : face à face, puis chorégraphie. */
  private startDuoScript(): void {
    const robot = this._robot!;
    const buddy = this._buddy!;
    robot.speedFactor = 1;
    buddy.speedFactor = 1;
    this.faceEachOther(robot, buddy);

    if (this._approachThen === 'greet') {
      const pair = this.pickGreetDialogue();
      this.playScript(
        [
          {
            at: 0,
            run: () => {
              this.setPhase(robot, 'wave', 2000);
              this.setPhase(buddy, 'excited', 1800);
            },
          },
          { at: 700, run: () => this.say(robot, pair.robot) },
          { at: 3600, run: () => this.say(buddy, pair.buddy) },
        ],
        6200
      );
    } else {
      this.playScript(
        [
          { at: 0, run: () => this.say(robot, 'Un high-five ?', 1500) },
          {
            at: 1600,
            run: () => {
              this.setPhase(robot, 'cheer', 950);
              this.setPhase(buddy, 'cheer', 950);
            },
          },
          {
            at: 2650,
            run: () => {
              this.setPhase(robot, 'laugh', 1500);
              this.setPhase(buddy, 'laugh', 1500);
            },
          },
        ],
        4400
      );
    }
  }

  private tickChase(robot: Character, buddy: Character, delta: number): void {
    /* Le robot file droit et rebondit sur les bords… */
    robot.x += (robot.dir * robot.speed * robot.speedFactor * delta) / 1000;
    if (robot.x <= EDGE_MARGIN || robot.x >= robot.maxX) {
      robot.x = Math.min(Math.max(robot.x, EDGE_MARGIN), robot.maxX);
      this.turnAround(robot);
    }
    this.applyPosition(robot);

    /* …et l'ami le poursuit sans jamais tout à fait le rattraper. */
    const gap = this.centerOf(robot) - this.centerOf(buddy);
    if (Math.abs(gap) > 30) {
      const dir: 1 | -1 = gap > 0 ? 1 : -1;
      if (dir !== buddy.dir) {
        buddy.dir = dir;
        this.applyDirection(buddy);
      }
      buddy.x += (buddy.dir * buddy.speed * buddy.speedFactor * delta) / 1000;
      buddy.x = Math.min(Math.max(buddy.x, EDGE_MARGIN), buddy.maxX);
      this.applyPosition(buddy);
    }

    this._chaseRemaining -= delta;
    if (this._chaseRemaining <= 0) {
      robot.speedFactor = 1;
      buddy.speedFactor = 1;
      this.faceEachOther(robot, buddy);
      this.playScript(
        [
          {
            at: 0,
            run: () => {
              this.setPhase(robot, 'laugh', 1600);
              this.setPhase(buddy, 'laugh', 1600);
            },
          },
        ],
        1900
      );
    }
  }

  /* --- Petit moteur de chorégraphies scriptées --- */

  private playScript(steps: ScriptStep[], end: number): void {
    this._scene = 'duo';
    this._script = { t: 0, i: 0, steps, end };
  }

  private tickScript(delta: number): void {
    const script = this._script;
    if (!script) {
      this.backToFree();
      return;
    }
    script.t += delta;
    while (
      script.i < script.steps.length &&
      script.steps[script.i].at <= script.t
    ) {
      script.steps[script.i].run();
      script.i += 1;
    }
    if (script.t >= script.end) {
      this._script = undefined;
      this.backToFree();
    }
  }

  private backToFree(): void {
    const robot = this._robot!;
    const buddy = this._buddy!;
    this._scene = 'free';
    this._script = undefined;
    robot.speedFactor = 1;
    buddy.speedFactor = 1;
    this.setPhase(robot, 'rest', this.randomDuration(IDLE_DURATION));
    this.setPhase(buddy, 'rest', this.randomDuration(IDLE_DURATION));
  }

  /* ------------------------------------------------------------------ */
  /* Réactions au monde                                                  */
  /* ------------------------------------------------------------------ */

  /** Bascule diaporama / compact : petit saut de surprise et commentaire. */
  private reactToModeChange(): void {
    const robot = this._robot;
    const buddy = this._buddy;
    if (
      !robot ||
      !buddy ||
      this._scene !== 'free' ||
      this._contextCooldown > 0
    ) {
      return;
    }
    this._contextCooldown = CONTEXT_COOLDOWN;
    this.setPhase(robot, 'jump', 750);
    this.setPhase(buddy, 'excited', 1400);
    this.say(robot, this.pickLine(MODE_LINES, robot));
  }

  /** Nouvelle slide du diaporama : le robot pointe le contenu et commente. */
  private reactToSectionChange(index: number): void {
    const robot = this._robot;
    const lines = SECTION_LINES[index];
    if (
      !robot ||
      !lines ||
      this._scene !== 'free' ||
      this._sectionCooldown > 0 ||
      robot.bubbleRemaining > 0
    ) {
      return;
    }
    this._sectionCooldown = SECTION_COOLDOWN;
    this.setPhase(robot, 'look', 2600);
    this.say(robot, lines[Math.floor(Math.random() * lines.length)]);
  }

  /** Survol d'une carte projet depuis un moment : le robot célèbre. */
  private checkProjectHover(timestamp: number): void {
    if (
      !this._hoveredProject ||
      this._hoverCelebrated ||
      timestamp - this._hoverSince < PROJECT_HOVER_DELAY
    ) {
      return;
    }
    this._hoverCelebrated = true;
    const robot = this._robot;
    if (!robot || this._scene !== 'free' || this._projectCooldown > 0) {
      return;
    }
    this._projectCooldown = PROJECT_COOLDOWN;
    this.setPhase(robot, 'cheer', 1100);
    this.say(robot, this.pickLine(PROJECT_LINES, robot));
  }

  /* ------------------------------------------------------------------ */
  /* Capteurs de mouvement (mobile)                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Toucher d'un personnage sur mobile (hors zone Angular).
   * Premier toucher : activation des capteurs (permission iOS demandée dans
   * ce geste). Ensuite : petite réaction amusée du personnage touché.
   */
  private handleMobileTap(which: 'robot' | 'buddy'): void {
    switch (this._sensorState) {
      case 'pending':
        return;
      case 'active':
      case 'unavailable':
        this.reactToTap(which);
        return;
      case 'idle':
        this.requestSensors();
    }
  }

  /**
   * Active la réaction aux mouvements : demande la permission iOS/WebKit si
   * l'API `requestPermission` existe (l'appel DOIT rester dans le geste
   * utilisateur), sinon branche directement les listeners. Refus ou API
   * absente : promenade normale, sans erreur console.
   */
  private requestSensors(): void {
    const orientationApi: SensorPermissionApi | undefined =
      typeof DeviceOrientationEvent !== 'undefined'
        ? (DeviceOrientationEvent as unknown as SensorPermissionApi)
        : undefined;
    const motionApi: SensorPermissionApi | undefined =
      typeof DeviceMotionEvent !== 'undefined'
        ? (DeviceMotionEvent as unknown as SensorPermissionApi)
        : undefined;

    if (!orientationApi && !motionApi) {
      this._sensorState = 'unavailable';
      if (this._robot) {
        this.say(this._robot, SENSOR_NONE_LINE);
      }
      return;
    }

    const requests: Promise<string>[] = [];
    if (typeof orientationApi?.requestPermission === 'function') {
      requests.push(orientationApi.requestPermission());
    }
    if (typeof motionApi?.requestPermission === 'function') {
      requests.push(motionApi.requestPermission());
    }

    if (requests.length === 0) {
      /* Pas de permission à demander (Android, ordinateur…) : on branche. */
      this.activateSensors();
      return;
    }

    this._sensorState = 'pending';
    void Promise.allSettled(requests).then((results) => {
      if (this._sensorState !== 'pending') {
        return;
      }
      const granted = results.some(
        (result) => result.status === 'fulfilled' && result.value === 'granted'
      );
      if (granted) {
        this.activateSensors();
      } else {
        this._sensorState = 'unavailable';
        if (this._robot) {
          this.say(this._robot, SENSOR_DENIED_LINE);
        }
      }
    });
  }

  /** Branche les listeners capteurs (passifs : ils ne font que mémoriser). */
  private activateSensors(): void {
    this._sensorState = 'active';
    this._sensorListeners = new AbortController();
    const options: AddEventListenerOptions = {
      passive: true,
      signal: this._sensorListeners.signal,
    };
    window.addEventListener('deviceorientation', this._onOrientation, options);
    window.addEventListener('devicemotion', this._onMotion, options);
    this._zone.run(() => this.sensorsActive.set(true));

    const robot = this._robot;
    if (robot) {
      if (this._scene === 'free') {
        this.setPhase(robot, 'cheer', 1100);
      }
      this.say(robot, SENSOR_ON_LINE);
    }
  }

  private stopSensors(): void {
    /* Neutralise une demande de permission encore en vol (feuille iOS
       affichée) : la garde du `.then` de requestSensors ignorera alors sa
       résolution tardive, au lieu de brancher des listeners orphelins. */
    if (this._sensorState === 'pending') {
      this._sensorState = 'unavailable';
    }
    this._sensorListeners?.abort();
    this._sensorListeners = undefined;
  }

  /** Mémorise l'inclinaison gauche/droite (°), quel que soit le sens de l'écran. */
  private readonly _onOrientation = (event: DeviceOrientationEvent): void => {
    const { beta, gamma } = event;
    if (beta === null && gamma === null) {
      return;
    }
    const angle = screen.orientation?.angle ?? 0;
    let tilt: number;
    switch (angle) {
      case 90:
        tilt = beta ?? 0;
        break;
      case 180:
        tilt = -(gamma ?? 0);
        break;
      case 270:
        tilt = -(beta ?? 0);
        break;
      default:
        tilt = gamma ?? 0;
    }
    this._tiltRaw = Math.max(-45, Math.min(45, tilt));
  };

  /** Signale une secousse (accélération hors gravité au-delà du seuil). */
  private readonly _onMotion = (event: DeviceMotionEvent): void => {
    const acceleration = event.acceleration;
    let magnitude = 0;
    if (
      acceleration &&
      (acceleration.x !== null ||
        acceleration.y !== null ||
        acceleration.z !== null)
    ) {
      magnitude = Math.hypot(
        acceleration.x ?? 0,
        acceleration.y ?? 0,
        acceleration.z ?? 0
      );
    } else {
      /* Pas d'accélération filtrée : on dérive la gravité mesure à mesure. */
      const gravity = event.accelerationIncludingGravity;
      if (!gravity) {
        return;
      }
      const current = {
        x: gravity.x ?? 0,
        y: gravity.y ?? 0,
        z: gravity.z ?? 0,
      };
      const previous = this._lastGravity;
      this._lastGravity = current;
      if (!previous) {
        return;
      }
      magnitude = Math.hypot(
        current.x - previous.x,
        current.y - previous.y,
        current.z - previous.z
      );
    }
    if (magnitude > SHAKE_THRESHOLD) {
      this._shakePending = true;
    }
  };

  /**
   * Consomme les mesures capteurs au rythme de la boucle rAF partagée :
   * lissage passe-bas de l'inclinaison, penchement CSS, glissade vers le
   * côté incliné, déséquilibre au-delà d'un seuil, sursaut sur secousse.
   */
  private tickSensors(robot: Character, buddy: Character, delta: number): void {
    this._shakeCooldown -= delta;

    /* Lissage passe-bas, cadencé sur le temps réel écoulé. */
    this._tilt +=
      (this._tiltRaw - this._tilt) * Math.min(1, delta / TILT_SMOOTHING);
    const tilt = this._tilt;

    /* Penchement : les personnages s'inclinent avec le sol (variable CSS,
       écrite seulement quand la valeur bouge vraiment). */
    const rotation = Math.max(
      -TILT_ROT_MAX,
      Math.min(TILT_ROT_MAX, tilt * TILT_ROT_FACTOR)
    );
    if (Math.abs(rotation - this._appliedTiltRot) > 0.25) {
      this._appliedTiltRot = rotation;
      const value = `${rotation.toFixed(1)}deg`;
      robot.el.style.setProperty('--duo-tilt', value);
      buddy.el.style.setProperty('--duo-tilt', value);
    }

    /* Forte inclinaison : petite animation de déséquilibre (bras écartés). */
    const offBalance = Math.abs(tilt) > OFFBALANCE_ANGLE;
    if (offBalance !== this._offBalance) {
      this._offBalance = offBalance;
      robot.el.classList.toggle('is-offbalance', offBalance);
      buddy.el.classList.toggle('is-offbalance', offBalance);
    }

    /* Glissade : au-delà de la zone morte, le duo glisse du côté incliné. */
    const beyond = Math.abs(tilt) - TILT_DEADZONE;
    if (beyond > 0) {
      const speed = Math.min(beyond * TILT_SLIDE_GAIN, TILT_SLIDE_MAX);
      const shift = (Math.sign(tilt) * speed * delta) / 1000;
      for (const char of [robot, buddy]) {
        const next = Math.min(Math.max(char.x + shift, EDGE_MARGIN), char.maxX);
        if (next !== char.x) {
          char.x = next;
          this.applyPosition(char);
        }
      }
    }

    /* Secousse : sursaut des deux personnages, avec garde-fou anti-spam. */
    if (this._shakePending) {
      this._shakePending = false;
      if (this._shakeCooldown <= 0) {
        this._shakeCooldown = SHAKE_COOLDOWN;
        this.reactToShake(robot, buddy);
      }
    }
  }

  /** Secousse détectée : le duo trébuche et proteste gentiment. */
  private reactToShake(robot: Character, buddy: Character): void {
    if (this._scene !== 'free') {
      this.backToFree();
    }
    this.setPhase(robot, 'stumble', 1100);
    this.setPhase(buddy, 'stumble', 1100);
    this.say(robot, this.pickLine(SHAKE_LINES, robot));
    this.say(buddy, this.pickLine(BUDDY_SHAKE_LINES, buddy), 1900);
  }

  /** Bulle d'invitation à activer les capteurs, une fois, peu après l'arrivée. */
  private tickSensorInvite(robot: Character, delta: number): void {
    if (this._inviteIn <= 0) {
      return;
    }
    this._inviteIn -= delta;
    if (this._inviteIn <= 0 && this._sensorState === 'idle') {
      this._inviteShown = true;
      this.say(robot, SENSOR_INVITE_LINE, 5600);
    }
  }

  /** Petite réaction du personnage touché (capteurs déjà réglés). */
  private reactToTap(which: 'robot' | 'buddy'): void {
    const char = which === 'robot' ? this._robot : this._buddy;
    if (!char || this._tapCooldown > 0 || this._scene !== 'free') {
      return;
    }
    this._tapCooldown = TAP_COOLDOWN;
    this.setPhase(char, which === 'robot' ? 'jump' : 'excited', 900);
    if (char.bubbleRemaining <= 0) {
      this.say(
        char,
        this.pickLine(which === 'robot' ? TAP_LINES : BUDDY_TAP_LINES, char)
      );
    }
  }

  /**
   * Regards : les pupilles du robot suivent le curseur quand il s'approche
   * (son antenne s'allume s'il est tout près) ; l'ami, lui, regarde son
   * robot préféré — sauf si le curseur vient le voir de près.
   */
  private updateGazes(robot: Character, buddy: Character): void {
    const viewportHeight = window.innerHeight;

    const robotCenterX = this.centerOf(robot);
    const robotDx = this._mouseX - robotCenterX;
    const robotDy = this._mouseY - (viewportHeight - 44);
    const robotDist = Math.hypot(robotDx, robotDy);
    let lookX = 0;
    let lookY = 0;
    if (robotDist < GAZE_RADIUS && robotDist > 1) {
      lookX = (robotDx / robotDist) * 2.4;
      lookY = Math.max(-2.6, Math.min(1, (robotDy / robotDist) * 2.4));
      /* Les pupilles vivent dans le conteneur miroir (scaleX(-1) vers la
         gauche) : on compense pour garder un regard juste à l'écran. */
      if (robot.dir === -1) {
        lookX = -lookX;
      }
    }
    this.applyGaze(robot, lookX, lookY);
    const alert = robotDist < ALERT_RADIUS;
    if (alert !== robot.alert) {
      robot.alert = alert;
      robot.el.classList.toggle('is-alert', alert);
    }

    const buddyCenterX = this.centerOf(buddy);
    const buddyDx = this._mouseX - buddyCenterX;
    const buddyDy = this._mouseY - (viewportHeight - 30);
    const buddyDist = Math.hypot(buddyDx, buddyDy);
    let buddyLookX: number;
    let buddyLookY = 0;
    if (buddyDist < 180 && buddyDist > 1) {
      buddyLookX = (buddyDx / buddyDist) * 1.8;
      buddyLookY = Math.max(-2, Math.min(1, (buddyDy / buddyDist) * 1.8));
    } else {
      buddyLookX = robotCenterX > buddyCenterX ? 1.6 : -1.6;
    }
    if (buddy.dir === -1) {
      buddyLookX = -buddyLookX;
    }
    this.applyGaze(buddy, buddyLookX, buddyLookY);
  }

  private applyGaze(char: Character, lookX: number, lookY: number): void {
    if (
      Math.abs(lookX - char.lookX) < 0.2 &&
      Math.abs(lookY - char.lookY) < 0.2
    ) {
      return;
    }
    char.lookX = lookX;
    char.lookY = lookY;
    char.el.style.setProperty('--look-x', `${lookX.toFixed(1)}px`);
    char.el.style.setProperty('--look-y', `${lookY.toFixed(1)}px`);
  }

  /* ------------------------------------------------------------------ */
  /* Bulles de dialogue                                                  */
  /* ------------------------------------------------------------------ */

  /** Affiche une bulle au-dessus d'un personnage (durée adaptée à la phrase). */
  private say(char: Character, text: string, duration?: number): void {
    char.bubbleText.textContent = text;
    char.bubble.classList.add('is-visible');
    char.el.classList.add('is-talking');
    char.bubbleRemaining = duration ?? Math.min(4600, 1900 + text.length * 40);
    /* Mesurée une fois par phrase, puis réutilisée pendant les déplacements. */
    char.bubbleHalf = (char.bubble.offsetWidth || 120) / 2;
    this.updateBubbleShift(char);
  }

  private updateBubble(char: Character, delta: number): void {
    if (char.bubbleRemaining <= 0) {
      return;
    }
    char.bubbleRemaining -= delta;
    if (char.bubbleRemaining <= 0) {
      char.bubble.classList.remove('is-visible');
      char.el.classList.remove('is-talking');
    }
  }

  /** Garde la bulle dans l'écran : la boîte glisse, la flèche reste sur la tête. */
  private updateBubbleShift(char: Character): void {
    const center = this.centerOf(char);
    const min = 8 + char.bubbleHalf;
    const max = Math.max(min, window.innerWidth - 8 - char.bubbleHalf);
    const shift = Math.min(Math.max(center, min), max) - center;
    char.el.style.setProperty('--bubble-shift', `${shift.toFixed(0)}px`);
  }

  private pickLine(pool: readonly string[], char: Character): string {
    let index = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && index === char.lastLineIndex) {
      index = (index + 1) % pool.length;
    }
    char.lastLineIndex = index;
    return pool[index];
  }

  private pickGreetDialogue(): { robot: string; buddy: string } {
    let index = Math.floor(Math.random() * GREET_DIALOGUES.length);
    if (index === this._lastGreetIndex) {
      index = (index + 1) % GREET_DIALOGUES.length;
    }
    this._lastGreetIndex = index;
    return GREET_DIALOGUES[index];
  }

  /* ------------------------------------------------------------------ */
  /* Aides bas niveau                                                    */
  /* ------------------------------------------------------------------ */

  private setPhase(char: Character, phase: Phase, duration: number): void {
    char.phase = phase;
    char.phaseRemaining = duration;
    const activeClass = phase === 'move' ? char.moveClass : PHASE_CLASS[phase];
    for (const cls of ALL_PHASE_CLASSES) {
      char.el.classList.toggle(cls, cls === activeClass);
    }
  }

  private turnAround(char: Character): void {
    char.dir = char.dir === 1 ? -1 : 1;
    this.applyDirection(char);
  }

  private faceEachOther(robot: Character, buddy: Character): void {
    robot.dir = this.centerOf(buddy) >= this.centerOf(robot) ? 1 : -1;
    buddy.dir = robot.dir === 1 ? -1 : 1;
    this.applyDirection(robot);
    this.applyDirection(buddy);
  }

  /** Le retournement est un scaleX animé en CSS sur .mascot-flip. */
  private applyDirection(char: Character): void {
    char.el.classList.toggle('is-facing-left', char.dir === -1);
  }

  private applyPosition(char: Character): void {
    /* Le penchement (inclinaison du téléphone) vit dans une variable CSS :
       la translation peut être réécrite sans toucher à la rotation. */
    char.el.style.transform = `translate3d(${char.x}px, 0, 0) rotate(var(--duo-tilt, 0deg))`;
    if (char.bubbleRemaining > 0) {
      this.updateBubbleShift(char);
    }
  }

  private centerOf(char: Character): number {
    return char.x + char.width / 2;
  }

  /** Garde le duo dans l'écran, notamment quand la fenêtre rétrécit. */
  private updateBounds(): void {
    for (const char of [this._robot, this._buddy]) {
      if (!char) {
        continue;
      }
      char.maxX = Math.max(
        EDGE_MARGIN,
        window.innerWidth - char.width - EDGE_MARGIN
      );
      if (char.x > char.maxX) {
        char.x = char.maxX;
        this.applyPosition(char);
      }
    }
  }

  private randomDuration(range: { min: number; max: number }): number {
    return range.min + Math.random() * (range.max - range.min);
  }
}
