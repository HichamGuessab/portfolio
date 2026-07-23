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

/**
 * Ancienne clé (session + localStorage) du masquage du duo, retiré : les
 * mascottes sont désormais permanentes (elles portent le seul accès à la
 * bascule diaporama / compact). La clé est nettoyée au démarrage pour que
 * les visiteurs de la session en cours retrouvent le duo immédiatement.
 */
const LEGACY_DISMISS_KEY = 'portfolio-mascot-hidden';

/** Clé localStorage : le visiteur a déjà découvert la surprise du triple-clic. */
const SURPRISE_KEY = 'portfolio-surprise-found';

/**
 * Clé localStorage du mode QA (testabilité) :
 * - 'fast' : cadence frénétique (perchoirs en quelques secondes, cooldowns
 *   de réaction /5, seuils de survol → 300 ms, sieste → 5 s, tourbillon →
 *   3 inversions) ;
 * - 'perch-only' : tirage exclusif et séquentiel des comportements perchés.
 * Usage : localStorage.setItem('portfolio-mascot-qa','fast'); location.reload()
 * Retrait : localStorage.removeItem('portfolio-mascot-qa')
 * Quand la clé est présente, window.__mascotQa = { trigger(name),
 * react(name, x?), state() } permet de déclencher un comportement nommé
 * ('sieste' compris) ou une réaction visiteur (déclencheur DOM
 * court-circuité) à la demande. Sans la clé : aucune surface.
 */
const QA_KEY = 'portfolio-mascot-qa';

/** Breakpoint md de Tailwind : en dessous, taille réduite et gestes tactiles. */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

/** Marge conservée de chaque côté de l'écran, en pixels. */
const EDGE_MARGIN = 24;

/** Échelle des mascottes sur mobile (~70 % de la taille ordinateur). */
const MOBILE_SCALE = 0.7;

/** Cadence des bulles et chorégraphies sur mobile : un peu plus espacées
    (allégée mais vivante). */
const MOBILE_CADENCE = 1.5;

/** Anti-spam des petites réactions au toucher sur mobile (ms). */
const TAP_COOLDOWN = 1600;

/* --- Surprise du triple-clic (bascule diaporama / compact) --- */

/** Fenêtre (ms) pendant laquelle 3 clics sur un personnage font la surprise. */
const TRIPLE_CLICK_WINDOW = 1200;

/**
 * Probabilité qu'une bulle ambiante soit un indice vers la surprise :
 * insistante tant qu'elle n'a jamais été découverte, discrète ensuite.
 */
const HINT_CHANCE_UNDISCOVERED = 0.45;
const HINT_CHANCE_DISCOVERED = 0.1;

/* --- Curseur-guide (ordinateur uniquement) --- */

/** Clé sessionStorage : le guide ne se joue qu'une fois par session. */
const GUIDE_SESSION_KEY = 'portfolio-cursor-guide-shown';

/** Apparition ~12-18 s après le chargement (2 s en mode QA 'fast'). */
const GUIDE_DELAY = { min: 12000, max: 18000 } as const;
const GUIDE_QA_DELAY = 2000;

/** Glissé en courbe douce depuis le bord de l'écran jusqu'au robot. */
const GUIDE_GLIDE_MS = 2000;

/** Amplitude (px) de l'arc vertical du glissé (courbe organique). */
const GUIDE_ARC = 70;

/** Trois clics mimés, espacés de ~450 ms (le robot sursaute à chacun). */
const GUIDE_CLICKS = 3;
const GUIDE_CLICK_INTERVAL = 450;

/** Pause de lecture de la bulle après le dernier clic, avant le fondu. */
const GUIDE_READ_MS = 2100;

/** Durée du fondu de sortie (alignée sur la transition CSS de .cursor-guide). */
const GUIDE_FADE_MS = 500;

/** Boîte du guide (36×36, flèche 1,5×) et pointe de la flèche (hotspot). */
const GUIDE_SIZE = 36;
const GUIDE_TIP_X = 4.5;
const GUIDE_TIP_Y = 3;

/** Décalage du sol des sprites (`bottom: 2px` dans le CSS). */
const SPRITE_GROUND = 2;

/** Le guide ne vise que les vrais pointeurs : jamais d'écran tactile. */
const POINTER_FINE_QUERY = '(pointer: fine)';

/* --- Perchoirs : le duo escalade l'interface (voir « moteur perchoir ») --- */

/** Cadence des comportements perchés : très soutenue — un moment perché
    toutes les ~15 s en moyenne, le duo vit VISIBLEMENT dans le décor
    (premier perchage sous ~8 s, puis régulier). */
const PERCH_FIRST_DELAY = { min: 4000, max: 8000 } as const;
const PERCH_DELAY = { min: 10000, max: 20000 } as const;

/** Facteur de cadence supplémentaire sur mobile (en plus du ×1.5 global) :
    un perchoir mobile toutes les ~22-45 s. */
const PERCH_MOBILE_FACTOR = 1.5;

/** Délais de grâce avant tout scan DOM : les rects mentent pendant les
    transitions (view-fade-in + reveals + dessin du cadre / effet cards). */
const PERCH_GRACE_MODE = 1400;
const PERCH_GRACE_SLIDE = 450;

/** Après une bascule de mode, premier tirage forcé à ≥ 5 s : le visiteur
    découvre le nouveau décor avant que le duo ne l'escalade. */
const PERCH_AFTER_MODE_MIN = 5000;

/** Re-mesure de l'ancre active pendant une assise (couvre l'accordéon 300 ms). */
const PERCH_REMEASURE = 300;

/** Pas de bulle quand la tête du perché est trop près du haut de l'écran. */
const BUBBLE_MIN_TOP = 120;

/** Dérive tolérée (px) de l'ancre avant glissement doux vers sa position. */
const PERCH_DRIFT_TOLERANCE = 4;

/** Vitesse du funambule : la moitié de la vitesse de croisière du robot. */
const TIGHTROPE_SPEED = 12;

/** Fenêtre (ms) pendant laquelle un changement de console autorise le
    « Coucou console ». */
const CONSOLE_PEEK_WINDOW = 8000;

/** Plafond des sauts sur mobile : 40 % du viewport. */
const MOBILE_JUMP_CAP = 0.4;

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

/** Écart vertical tête → bas de bulle (CSS : bottom: calc(100% + 12px)). */
const BUBBLE_GAP = 12;

/** Marge (px) gardée entre une bulle et les bords de l'écran. */
const BUBBLE_MARGIN = 8;

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

/** Cadence des bulles ambiantes : une première rapide, puis toutes les 12-24 s. */
const AMBIENT_FIRST_DELAY = { min: 4000, max: 8000 } as const;
const AMBIENT_DELAY = { min: 12000, max: 24000 } as const;

/** Cadence des chorégraphies à deux (rencontre, high-five, poursuite) :
    fréquentes — le duo doit interagir souvent, c'est le cœur du charme. */
const DUO_FIRST_DELAY = { min: 7000, max: 12000 } as const;
const DUO_DELAY = { min: 10000, max: 20000 } as const;

/**
 * Couloir GLOBAL des réactions visiteur « jouées » : au plus une toutes les
 * 5 s (le surf de transition, quasi silencieux, a son propre couloir à
 * 1500 ms). Le compte à rebours associé (_reactCooldown) est décrémenté dans
 * la boucle rAF ; tickReactions (l'arbitre unique des réactions) le consomme
 * et le réarme — divisé par 5 en mode QA 'fast' via qaCooldown.
 */
const REACT_GLOBAL_COOLDOWN = 5000;

/* --- Réactions aux actions du visiteur : couloirs et seuils ---
   Règle absolue : les handlers MÉMORISENT (horodatages, refs, x), la rAF
   CONSOMME. Un événement trop vieux est simplement perdu — une réaction en
   retard est pire qu'une réaction manquée. */

/** Fraîcheur maximale (ms) d'un événement mémorisé par un handler. */
const REACT_FRESH_MS = 600;

/** Tolérance de retard d'un franchissement de seuil de survol bloqué par un
    couloir : au-delà, le survol est consommé sans réaction. */
const REACT_LATE_MS = 900;

/** « Le surf de transition » : couloir dédié très court — il joue à chaque
    coup de molette ou presque (retour haptique visuel du scroll), avec un
    léger décalage robot/blob pour l'effet de vague. */
const SURF_COOLDOWN = 1500;
const SURF_STAGGER = 120;

/** « J'accours pour voir » : survol prolongé d'une tuile / carte projet —
    couloir propre 8 s + cooldown par élément (WeakMap, remplace l'ancien
    PROJECT_COOLDOWN de 30 s, assoupli à 25 s). */
const ACCOURSE_HOVER_MS = 1200;
const ACCOURSE_OWN_COOLDOWN = 8000;
const ACCOURSE_ELEMENT_COOLDOWN = 25000;

/** « La dégringolade de l'accordéon » : fraîcheur du drapeau posé par
    l'observateur d'aria-expanded, et cooldown long (la 2e sollicitation
    dans la fenêtre est absorbée par le suivi d'ancre — il s'accroche,
    c'est aussi un gag). */
const ACCORDION_POKE_FRESH = 400;
const ACCORDION_FALL_COOLDOWN = 30000;

/** « Bon voyage ! » : clic sur un lien sortant. */
const VOYAGE_COOLDOWN = 15000;

/** « L'ovation de l'attaché de presse » : survol d'un badge de contact. */
const OVATION_COOLDOWN = 12000;

/** « Le tourbillon de souris » : inversions de direction horizontale dans
    la fenêtre, au voisinage d'un sprite (pointeur fin uniquement). */
const SWIRL_WINDOW = 700;
const SWIRL_INVERSIONS = 5;
const SWIRL_QA_INVERSIONS = 3;
const SWIRL_RADIUS = 200;
const SWIRL_COOLDOWN = 10000;

/** « L'expert des compétences » : survol prolongé d'une chip. */
const SKILL_HOVER_MS = 1500;
const SKILL_COOLDOWN = 18000;
const SKILL_ELEMENT_COOLDOWN = 60000;

/** « La sieste interrompue » : seuils d'inactivité (desktop / mobile /
    après réveil / QA 'fast'), cycle de ronflement et calme post-réveil. */
const NAP_IDLE_MS = 45000;
const NAP_IDLE_MOBILE_MS = 60000;
const NAP_AFTER_WAKE_MS = 90000;
const NAP_QA_IDLE_MS = 5000;
const NAP_QA_AFTER_WAKE_MS = 10000;
const NAP_CYCLE_MS = 30000;
const NAP_CYCLES = 8;
const WAKE_CALM_MS = 3000;

/** « La visite guidée » est un numéro rare : au plus une par 2 minutes. */
const GUIDED_TOUR_COOLDOWN = 120000;

/** Fenêtre (ms) pendant laquelle un resize récent change la bulle de
    « L'inspecteur du HUD ». */
const HUD_RESIZE_WINDOW = 10000;

/** Garde-fous anti-spam des réactions contextuelles (en ms). */
const CONTEXT_COOLDOWN = 6000;
const SECTION_COOLDOWN = 12000;

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
  | 'stumble'
  | 'crouch'
  | 'sit'
  | 'tightrope'
  | 'wobble'
  | 'point'
  | 'push'
  | 'slide'
  | 'brace'
  | 'nest'
  | 'twirl';

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
  crouch: 'is-crouching',
  sit: 'is-sitting',
  tightrope: 'is-tightrope',
  wobble: 'is-wobbling',
  point: 'is-pointing',
  push: 'is-pushing',
  slide: 'is-sliding',
  brace: 'is-bracing',
  nest: 'is-nesting',
  twirl: 'is-twirling',
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
  'is-crouching',
  'is-sitting',
  'is-tightrope',
  'is-wobbling',
  'is-pointing',
  'is-pushing',
  'is-sliding',
  'is-bracing',
  'is-nesting',
  'is-twirling',
] as const;

/**
 * Vol balistique d'un personnage (saut parabolique ou glissade), interpolé
 * dans la boucle rAF : x suit un ease-in-out, y un lerp + arche 4h·t(1-t).
 * `ease: 'inQuad'` remplace l'arche par une accélération douce (glissade
 * de mât, chute contrôlée).
 */
interface Flight {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  height: number;
  duration: number;
  t: number;
  ease?: 'inQuad';
  onLand?: () => void;
}

/** État complet d'un personnage, piloté hors zone Angular. */
interface Character {
  el: HTMLButtonElement;
  bubble: HTMLElement;
  bubbleText: HTMLElement;
  width: number;
  height: number;
  /** Classe de déplacement : le robot marche, l'ami sautille. */
  moveClass: 'is-walking' | 'is-hopping';
  speed: number;
  x: number;
  /** Élévation (px) au-dessus du sol de promenade — 0 = au sol. */
  y: number;
  /** Vol en cours (saut parabolique, glissade, chute contrôlée). */
  flight?: Flight;
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
  /** Demi-hauteur de la bulle (clamp sous penchement capteurs). */
  bubbleHalfH: number;
  lastLineIndex: number;
  /** Dernier regard appliqué (variables CSS --look-x / --look-y). */
  lookX: number;
  lookY: number;
  alert: boolean;
}

/** Scènes de la petite machine à états qui pilote le duo. */
type Scene = 'free' | 'approach' | 'duo' | 'chase' | 'perch';

/** Étape d'une chorégraphie scriptée : une action à un instant donné. */
interface ScriptStep {
  at: number;
  run: () => void;
}

/* ------------------------------------------------------------------ */
/* Moteur perchoir — types                                             */
/* ------------------------------------------------------------------ */

/**
 * Étape séquentielle d'un comportement perché. Contrairement aux scripts
 * duo (temps absolus), chaque étape se termine avant que la suivante ne
 * démarre : les trajets à durée variable (marches, vols) s'enchaînent sans
 * calcul de timing manuel. Les cibles sont des fonctions : elles lisent le
 * rect frais de l'ancre au moment où l'étape démarre (jamais en avance).
 */
type PerchStep =
  | { kind: 'walk'; to: () => number | null; speedFactor?: number }
  | { kind: 'pose'; phase: Phase; ms: number }
  | {
      kind: 'jump';
      to: () => { x: number; y: number } | null;
      height: number;
      ms?: number;
      /** Pose portée pendant le vol (vrille, glissade) — 'rest' par défaut. */
      phase?: Phase;
    }
  | { kind: 'sit'; phase: Phase; ms: number; follow?: boolean }
  | {
      kind: 'traverse';
      to: () => number | null;
      speed: number;
      /** Pose portée pendant la traversée — 'tightrope' par défaut (le
          toboggan des marches du diplôme glisse en 'slide'). */
      phase?: Phase;
    }
  | { kind: 'slide'; ms: number }
  | { kind: 'orbit'; ms: number }
  | { kind: 'do'; run: () => void };

/** Ancre d'un perchoir : élément + fonction qui déduit le point d'assise
    d'un rect frais (re-mesure pendant l'assise, suivi doux). */
interface PerchAnchor {
  el: Element;
  point: (rect: DOMRect) => { x: number; y: number };
}

/** Noms des comportements perchés (tirage pondéré + hook QA). */
type PerchName =
  | 'vigie'
  | 'funambule'
  | 'trampoline'
  | 'attache'
  | 'coucou'
  | 'tuile'
  | 'baie'
  | 'sommet'
  | 'marches'
  | 'cachette'
  | 'picoreur'
  | 'chip'
  | 'visite'
  | 'repare'
  | 'rodeo'
  | 'hud';

/**
 * Table de sélecteurs des perchoirs — centralisée ici (lecture seule :
 * querySelectorAll + getBoundingClientRect, jamais de mutation des hôtes).
 * Alternative au marquage data-perch : aucun autre composant n'est touché.
 */
const PERCH_SELECTORS = {
  /** Tuiles projets de la grille 4×3 du mode compact. */
  tile: "a[data-circuit][aria-describedby='project-console']",
  /** Console de lecture (bord supérieur net : fil de funambule). */
  console: '#project-console',
  /** Rangées d'accordéon Expérience (conteneur en overflow-y-auto !). */
  row: "button[aria-controls^='experience-panel-']",
  /** Rangée d'expérience actuellement dépliée. */
  activeRow: "button[aria-controls^='experience-panel-'][aria-expanded='true']",
  /** Chips de compétences (coussins de rebond uniquement). */
  chip: 'li[data-circuit]',
  /** Badges de contact de la barre de statut du pont. */
  badgeCompact: '.compact-contacts badge a',
  /** Bords supérieurs des 5 cellules bento (marches d'escalade). */
  cell: 'section.rounded-2xl',
  /** Point pulsant du 12e slot « libre » (gag « Ma baie à moi »). */
  slotDot: '.slot-dot',
  /** Fil pointillé de la timeline Formation (cellule E). Les nœuds se
      résolvent depuis son closest('section') puis
      '.group > span.rounded-full' — lecture seule, comme partout. */
  timeline: '.timeline-dashes',
  /** Caret clignotant ▍ de la console (recréé à chaque changement de projet). */
  caret: '#project-console .console-caret',
  /** Readout de viewport de la barre de statut (« 1920 × 1080 »), unique
      dans le pont — au ras du sol. */
  hud: 'p.shrink-0.tabular-nums',
  /** Conteneur des badges de contact (dernier arrêt de la visite guidée). */
  contacts: '.compact-contacts',
  /** Photo de profil ronde (diaporama : « sommet du monde »). */
  photo: "img[alt='Portrait de Hicham Guessab']",
  /** Badges de la slide profil (diaporama). */
  badgeSlideshow: 'profile-section badge a',
  /** Carte active de l'effet cards, par index de slide du diaporama.
      Combinateur enfant obligatoire : la slide VERTICALE active porte aussi
      `swiper-slide-active` et contient TOUT le deck — en descendant,
      querySelector renverrait toujours la carte n°1 du DOM. La slide
      verticale a pour enfant direct la section (jamais un item) : seul le
      swiper imbriqué peut matcher. */
  activeCard: {
    1: 'swiper-slide.swiper-slide-active > project-item > div',
    3: 'swiper-slide.swiper-slide-active > experience-item > div',
    4: 'swiper-slide.swiper-slide-active > education-item > div',
  } as Record<number, string>,
} as const;

/* --- Sélecteurs des réactions au survol, dérivés du registre ---
   La délégation mouseover reste UNIQUE : un seul closest sur l'union,
   classification par matches (aucune lecture layout dans le handler). */

/** Badges de contact (ovation) : pont compact et slide profil. */
const BADGE_HOVER_SELECTOR = `${PERCH_SELECTORS.badgeCompact}, ${PERCH_SELECTORS.badgeSlideshow}`;

/** Chips de compétences (l'expert) : compact et diaporama. */
const CHIP_HOVER_SELECTOR = `${PERCH_SELECTORS.chip}, skill-item`;

/** Union complète surveillée par la délégation mouseover. La dégringolade
    n'en fait PAS partie : le dépli d'une rangée est détecté sur le flip
    d'aria-expanded (MutationObserver), jamais depuis un événement d'entrée
    — l'accordéon se déplie aussi sur mouseenter/focus, un survol ou un
    clic n'est donc pas un signal fiable de dépli. */
const REACT_HOVER_SELECTOR = `${BADGE_HOVER_SELECTOR}, ${CHIP_HOVER_SELECTOR}, project-item, ${PERCH_SELECTORS.tile}`;

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
  'Vous cherchez un développeur ? Vous êtes au bon endroit.',
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
  { robot: 'Vous avez vu ces projets ?', buddy: 'Incroyables !' },
  { robot: 'Qui nous a dessinés, déjà ?', buddy: 'Hicham, évidemment !' },
  { robot: 'Un mot pour nos visiteurs ?', buddy: 'Vous avez bon goût !' },
  { robot: 'Ce portfolio est magnifique, non ?', buddy: 'Comme son auteur !' },
] as const;

/** Réaction à la bascule diaporama / compact. */
const MODE_LINES: readonly string[] = [
  'Oh, changement de décor !',
  'Joli, ce nouveau mode !',
  'Même moi, ça me surprend encore.',
] as const;

/* --- Surprise du triple-clic --- */

/** Indices glissés dans les bulles ambiantes (desktop, viewport compatible). */
const ROBOT_HINT_LINES: readonly string[] = [
  'Psst… cliquez 3 fois sur moi, vous verrez !',
  'Petit secret : cliquez 3 fois sur mon ami !',
  'Il paraît que 3 clics sur moi, ça fait des miracles…',
] as const;

const BUDDY_HINT_LINES: readonly string[] = [
  'Cliquez 3 fois sur moi… effet garanti !',
  'Chut… 3 clics sur moi, et magie !',
] as const;

/** Deuxième clic : le personnage sent que quelque chose se prépare. */
const ALMOST_LINES: readonly string[] = [
  'Encore un clic…',
  'Oh, vous chauffez !',
] as const;

/** Célébration de la surprise, selon le mode d'arrivée. */
const SURPRISE_COMPACT_LINES: readonly string[] = [
  'Tadaaa ! Bienvenue dans mon monde compact !',
  'Surprise ! Tout le portfolio sur un seul écran !',
] as const;

const SURPRISE_SLIDESHOW_LINES: readonly string[] = [
  'Tadaaa ! Retour au grand diaporama !',
  'Et hop, chaque section reprend sa scène !',
] as const;

/** Cri de joie de l'autre personnage pendant la célébration. */
const SURPRISE_ECHO_LINE = 'Tadaaa !';

/** Triple-clic sur une fenêtre trop petite pour le mode compact. */
const SURPRISE_LOCKED_LINE =
  'Agrandissez la fenêtre pour découvrir la surprise !';

/** Triple-tap sur mobile : la surprise reste une affaire de grand écran. */
const SURPRISE_MOBILE_LINE = 'La surprise, c’est sur grand écran !';

/* --- Bulles des comportements perchés --- */

/** Chute contrôlée quand le décor disparaît sous les pieds (bascule de mode). */
const PERCH_FALL_LINE = 'Oh, le décor bouge !';

/** La vigie des modules (1 fois sur 2, variantes). */
const VIGIE_LINES: readonly string[] = [
  'D’ici, on voit tous ses projets. Impressionnant.',
  'Module {index} : aucun bug détecté.',
] as const;

/** Le funambule, au faux pas scripté de mi-parcours. */
const FUNAMBULE_LINE = 'Oups… tout va bien, tout va bien.';

/** Trampoline de chips, au 3e rebond. */
const TRAMPOLINE_LINE = 'Pouf ! Pouf ! Pouf ! C’est moelleux, les compétences.';

/** L'attaché de presse, selon le badge vanté. */
const PRESS_GITHUB_LINE = 'Tout son code est là-dessous !';
const PRESS_EMAIL_LINE = 'Un message et il répond dans la journée !';
const PRESS_DEFAULT_LINE = 'Cliquez là, il répond vite !';

/** Coucou console (petite bulle, 1 fois sur 3). */
const CONSOLE_PEEK_LINE = 'Ooooh. J’adore celui-là.';

/** La tuile récalcitrante, après l'échec théâtral. */
const TILE_PUSH_LINE = 'Elle est bien fixée. C’est du solide, ce portfolio.';

/** La glissade du cadre (1 fois sur 2). */
const FRAME_SLIDE_LINE = 'Wiiiii !';

/** Le sommet du monde (jamais si la photo touche le haut de l'écran). */
const SUMMIT_LINE = 'La meilleure vue du portfolio !';

/** La courte échelle (chorégraphie duo, mode compact). */
const LADDER_ROBOT_LINE = 'Alors, qu’est-ce que ça dit ?';
const LADDER_BUDDY_LINE = 'Que des missions réussies !';

/** Ma baie à moi : le blob squatte le 12e slot libre. */
const NEST_LINE = 'En attendant le prochain projet… c’est chez moi ici.';

/* --- Bulles de la nouvelle troupe autonome (vouvoiement ou 3e personne
   élogieuse uniquement — jamais de tutoiement). --- */

/** Les marches du diplôme : sur le nœud Master, puis au départ du toboggan. */
const MARCHES_LINE =
  'Chaque diplôme est une marche… et Hicham les a toutes gravies !';
const MARCHES_SLIDE_LINE = 'Tout schuss !';

/** Cache-cache sur le pont. */
const CACHETTE_ROBOT_LINE = 'Vous l’avez vu passer, vous ?';
const CACHETTE_BUDDY_LINE = 'Coucou ! Vous m’aviez repéré, avouez !';

/** Le picoreur de caret (1 fois sur 3). */
const PICOREUR_LINE = 'Il clignote… c’est vivant !';

/** L'emprunt de chip : décollage, éloge du robot, restitution. */
const CHIP_TAKE_LINE = 'Je l’emprunte… promis, je la rends !';
const CHIP_ROBOT_LINE =
  'Toutes ces compétences sont à Hicham. Impressionnant, non ?';
const CHIP_RETURN_LINE = 'Et voilà, rendue !';

/** La visite guidée — les trois arrêts du mode compact. */
const TOUR_COMPACT_LINES: readonly string[] = [
  'Ici, le commandant de bord : Hicham lui-même.',
  'Là, ses projets. Tous faits maison, comme moi.',
  'Et ici, de quoi lui écrire. Faites-lui signe !',
] as const;

/** La visite guidée — diaporama, slide profil puis slides à cartes. */
const TOUR_PHOTO_LINE = 'Le voici ! Élégant, non ?';
const TOUR_BADGES_LINE = 'Un clic ici, et vous êtes en contact.';
const TOUR_CARD_LINE = 'Regardez-moi cette carte. Du travail soigné.';
const TOUR_PILE_LINE = 'Et il y en a toute une pile !';

/** Le réparateur du cadre-comète. */
const REPARE_LINE = 'Maintenance terminée. Ce cadre brille comme son auteur.';

/** Le rodéo du deck (1 fois sur 2). */
const RODEO_LINE = 'La plus belle carte du paquet !';

/** L'inspecteur du HUD (variante quand un resize vient d'avoir lieu). */
const HUD_LINE =
  'Il a même pensé à afficher la taille de l’écran. Quel souci du détail !';
const HUD_RESIZE_LINE =
  'Recalibrage détecté… tout est encore parfaitement aligné.';

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

/* --- Bulles des réactions aux actions du visiteur (vouvoiement ou 3e
   personne élogieuse uniquement — jamais de tutoiement). --- */

/** « J'accours pour voir » : pool projets enrichi d'une ligne dédiée. */
const ACCOURSE_LINES: readonly string[] = [
  ...PROJECT_LINES,
  'Vous avez l’œil : celui-ci est une pépite.',
] as const;

/** « La dégringolade de l'accordéon » : le gag assume. */
const ACCORDION_FALL_LINES: readonly string[] = [
  'Ouf ! Plus de peur que de mal.',
  'Le sol bouge, ici ! Passionnant, non ?',
] as const;

/** « Bon voyage ! » : selon le type de lien sortant cliqué. */
const VOYAGE_PROJECT_LINE = 'Bonne visite ! Ce projet vaut le détour.';
const VOYAGE_EMAIL_LINE = 'Excellente idée : il répond dans la journée !';
const VOYAGE_SOCIAL_LINE = 'Dites-lui bonjour de notre part !';

/** « Le surf de transition » (bulle rare : 1 fois sur 4, le blob). */
const SURF_LINE = 'Et hop !';

/** « Le tourbillon de souris ». */
const SWIRL_LINE = 'Wooo ! Quel tourbillon !';
const SWIRL_ECHO_LINE = 'Encore ! Encore !';

/** « L'expert des compétences » : éloge sans JAMAIS citer la techno (le
    sprite ne lit pas le texte — zéro risque d'erreur factuelle). */
const SKILL_LINES: readonly string[] = [
  'Celle-ci ? Il la pratique les yeux fermés.',
  'Bien repéré : c’est l’une de ses préférées.',
  'Des années de pratique derrière cette petite pastille.',
] as const;

/** « La sieste interrompue » : ronflement, puis sursaut en cascade. */
const NAP_ZZZ_LINE = 'Zzz…';
const WAKE_ROBOT_LINE = 'Oh ! Vous revoilà !';
const WAKE_BUDDY_LINE = 'Je ne dormais pas, je surveillais.';

/** Petites piques de la poursuite. */
const CHASE_LINES: readonly string[] = [
  'Pas si vite !',
  'Je vais le rattraper !',
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
const SENSOR_INVITE_LINE = 'Touchez-moi pour activer les capteurs !';
const SENSOR_ON_LINE = 'Capteurs activés ! Penchez votre téléphone.';
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
 * Le duo garde aussi un secret : sur ordinateur, un TRIPLE-CLIC sur l'un des
 * deux personnages bascule le portfolio entre diaporama et mode compact
 * (mini-célébration à l'appui). Les mascottes glissent des indices dans
 * leurs bulles ambiantes — avec insistance tant que la surprise n'a jamais
 * été découverte (localStorage), plus rarement ensuite.
 *
 * L'interface est aussi leur TERRAIN DE JEU : à cadence soutenue (un moment
 * perché toutes les ~15 s en moyenne), un comportement se joue — le robot
 * escalade la baie projets, marche en funambule, vante les badges, répare le
 * cadre-comète, inspecte le readout du HUD ou mène la visite guidée ; le
 * blob rebondit sur les chips, gravit les marches du diplôme, picore le
 * caret de la console, emprunte une chip, joue à cache-cache, chevauche la
 * carte active en rodéo, squatte le 12e slot libre ou conquiert le sommet
 * de la photo.
 * Deux règles d'or : le monde est INTOUCHABLE (lecture seule des rects,
 * toutes les illusions physiques vivent sur les sprites — zéro layout
 * shift) et les perchoirs restent des MOMENTS (la promenade au sol est
 * l'état de base).
 *
 * Le duo RÉAGIT aussi aux actions du visiteur (arbitre unique, couloir
 * global de 5 s, cooldowns propres) : il accourt sous une carte projet
 * survolée, dégringole quand l'accordéon bouge sous ses pieds, salue les
 * départs vers les liens sortants, surfe chaque changement de slide,
 * ovationne les badges de contact, titube sous un tourbillon de souris,
 * vante les chips de compétences et s'endort après 45 s d'inactivité
 * (réveil en cascade au premier input). Règle absolue : les handlers
 * (tous passifs et délégués) MÉMORISENT, la boucle rAF CONSOMME.
 *
 * Non intrusif par construction :
 * - l'hôte est en `pointer-events: none`, seuls les personnages sont cliquables ;
 * - sur ordinateur, chaque clic déclenche une petite réaction (et compte pour
 *   le triple-clic), même sur un personnage perché ;
 * - sur mobile (< md), le duo est affiché à ~70 % : le toucher active la
 *   réaction aux mouvements du téléphone (permission iOS demandée dans le
 *   geste) ;
 * - le duo est permanent : aucun masquage — il porte le seul accès au mode
 *   compact ;
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
  /** Vrai à partir du breakpoint md (768px). */
  private readonly _isDesktop: WritableSignal<boolean> = signal(false);

  /** Source de vérité sur les animations (actives par défaut pour tous). */
  private readonly _motion: MotionService = inject(MotionService);

  /** Mode d'affichage courant — le duo commente la bascule. */
  private readonly _viewMode: ViewModeService = inject(ViewModeService);

  /** Le duo est permanent : MotionService (signal readonly toujours vrai)
      reste l'unique point d'extension documenté — aucune voie de masquage. */
  protected readonly visible: Signal<boolean> = computed(() =>
    this._motion.motionEnabled()
  );

  /** Vrai quand la réaction aux mouvements du téléphone est active. */
  protected readonly sensorsActive: WritableSignal<boolean> = signal(false);

  /** Libellé accessible des personnages : le geste principal change de sens
      entre ordinateur (triple-clic = surprise) et mobile (toucher = capteurs). */
  protected readonly spriteLabel: Signal<string> = computed(() => {
    if (this._isDesktop()) {
      return 'Mascotte : cliquer 3 fois pour une surprise';
    }
    return this.sensorsActive()
      ? 'Mascotte'
      : 'Mascotte : toucher pour activer la réaction aux mouvements du téléphone';
  });

  private readonly _robotRef: Signal<
    ElementRef<HTMLButtonElement> | undefined
  > = viewChild<ElementRef<HTMLButtonElement>>('robotSprite');
  private readonly _buddyRef: Signal<
    ElementRef<HTMLButtonElement> | undefined
  > = viewChild<ElementRef<HTMLButtonElement>>('buddySprite');
  private readonly _guideRef: Signal<ElementRef<HTMLElement> | undefined> =
    viewChild<ElementRef<HTMLElement>>('cursorGuide');

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
  private _lastGreetIndex = -1;

  /* --- Moteur perchoir --- */
  /** Compte à rebours du prochain tirage perchoir (gelé hors scène 'free'). */
  private _nextPerchIn = 0;
  /** Délai de grâce anti-rects-mensongers (bascule de mode, slide). */
  private _perchGrace = 0;
  /** Personnage perché (l'autre continue sa vie libre au sol). */
  private _perchWho?: Character;
  private _perchSteps: PerchStep[] = [];
  private _perchIndex = -1;
  /** Temps restant de l'étape posée/assise en cours. */
  private _perchWait = 0;
  /** Ancre active, re-mesurée toutes les PERCH_REMEASURE ms pendant l'assise. */
  private _perchAnchor?: PerchAnchor;
  private _perchFollow = false;
  private _perchTargetX = 0;
  private _perchTargetY = 0;
  private _perchRemeasureIn = 0;
  /** Traversée funambule en cours (cible x, pilotée au sol par tickPerch). */
  private _perchTraverse?: { toX: number; speed: number };
  /** Glissade circulaire (descente signature du sommet du monde). */
  private _perchOrbit?: {
    cx: number;
    cy: number;
    r: number;
    from: number;
    to: number;
    ms: number;
    t: number;
  };
  /** Courte échelle : le robot est escorté (il ne vit pas en tickFree). */
  private _perchEscort = false;
  /** Index de la slide active du diaporama (écouteur swiperslidechange). */
  private _activeSlide = 0;
  /** Horodatage de la dernière visite guidée (numéro bridé à ~1 / 2 min). */
  private _lastGuidedTourAt = Number.NEGATIVE_INFINITY;
  /** Horodatage du dernier resize (variante de « L'inspecteur du HUD »). */
  private _lastResizeAt = Number.NEGATIVE_INFINITY;
  /** Couloir global des réactions visiteur : décrémenté dans la rAF,
      consommé/réarmé par tickReactions (l'arbitre unique). */
  private _reactCooldown = 0;

  /* --- Réactions aux actions du visiteur (les handlers MÉMORISENT :
     horodatages, refs, x — la boucle rAF CONSOMME) --- */
  /** Dernier input du visiteur (mousemove/click/keydown/wheel/touchstart). */
  private _lastInputAt = 0;
  /** Badge de contact survolé (ovation) et rangée d'accordéon dépliée. */
  private _badgePokedEl?: Element;
  private _badgePokedAt = 0;
  private _accordionPokedEl?: Element;
  private _accordionPokedAt = 0;
  /** Observateur du dépli (flip aria-expanded false→true d'une rangée) :
      seule source fiable — l'accordéon se déplie aussi sur mouseenter et
      focus, un clic ou une activation clavier arrive donc toujours APRÈS
      la mise à jour de l'attribut (déduire le dépli des événements
      d'entrée est impossible). Poseur de drapeau uniquement. */
  private _accordionObserver?: MutationObserver;
  /** Lien sortant cliqué (« Bon voyage ! ») : type + x de départ. */
  private _voyageType?: 'project' | 'email' | 'social';
  private _voyageX = 0;
  private _voyagePokedAt = 0;
  /** Changement de slide vertical à surfer (horodatage seul). */
  private _surfPokedAt = 0;
  /** Détecteur de tourbillon : 3 nombres (signe, compteur, fenêtre). */
  private _swirlSign = 0;
  private _swirlCount = 0;
  private _swirlStart = 0;
  /* Couloirs propres (horodatages « until », comparés au timestamp rAF). */
  private _accourseUntil = 0;
  private _ovationUntil = 0;
  private _voyageUntil = 0;
  private _surfUntil = 0;
  private _swirlUntil = 0;
  private _skillUntil = 0;
  private _accordionFallUntil = 0;
  /** Cooldown par élément (tuiles 25 s, chips 60 s) — WeakMap partagée. */
  private readonly _elementCooldown = new WeakMap<Element, number>();
  /* Sieste : drapeau du plan perchoir, départ, seuil d'inactivité courant. */
  private _napping = false;
  private _napStartedAt = 0;
  private _napIdleMs = NAP_IDLE_MS;
  /** Plan RÉACTIF en cours sur le moteur perchoir (accourse, sieste) —
      le gel des compteurs autonomes est conservé, c'est le but. */
  private _reactivePlan = false;
  /** Micro-ordonnanceur : actions décalées consommées par la rAF (vague du
      surf, fou rire post-chute, cascade du réveil, re-poses du perché). */
  private _delayed: { in: number; run: () => void }[] = [];
  /** Regard forcé vers le haut (« J'accours pour voir »). */
  private _lookUp?: { char: Character; remaining: number };
  /** Gel du recalcul is-alert du robot (clignement du tourbillon). */
  private _alertHold = 0;
  /** Pointeur fin détecté au démarrage de la scène (tourbillon desktop). */
  private _finePointer = false;
  /** Horodatage du dernier changement de projet dans la console (compact). */
  private _consoleChangedAt = Number.NEGATIVE_INFINITY;
  private _consoleObserver?: MutationObserver;
  private _consoleObserverTimer = 0;

  /* --- Hook QA (clé localStorage 'portfolio-mascot-qa') --- */
  private _qaMode: '' | 'fast' | 'perch-only' = '';
  /** Rotation séquentielle déterministe du mode 'perch-only'. */
  private _qaRotation = 0;

  /** Position du curseur, consommée dans la boucle rAF (regards, alerte). */
  private _mouseX = Number.NEGATIVE_INFINITY;
  private _mouseY = Number.NEGATIVE_INFINITY;

  /** Suivi du survol prolongé (cartes/tuiles projets et chips). */
  private _hoveredEl?: Element;
  private _hoveredKind: 'project' | 'chip' = 'project';
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
  /** Compte à rebours de la bulle « Touchez-moi pour activer les capteurs ! ». */
  private _inviteIn = 0;
  private _inviteShown = false;

  /* --- Curseur-guide --- */
  /** Élément du guide et sa bulle (résolus au démarrage de la scène). */
  private _guideEl?: HTMLElement;
  private _guideBubble?: HTMLElement;
  /** 'off' recouvre : inéligible, déjà joué cette session, ou terminé. */
  private _guideState: 'off' | 'waiting' | 'gliding' | 'clicking' | 'leaving' =
    'off';
  /** Compte à rebours polyvalent : apparition, report, fondu de sortie. */
  private _guideIn = 0;
  /** Avancement (ms) du glissé vers le robot. */
  private _guideT = 0;
  private _guideStartX = 0;
  private _guideStartY = 0;
  /** Clics mimés déjà joués et compte à rebours de la prochaine pulsation. */
  private _guideClicks = 0;
  private _guideClickIn = 0;
  /** Glissement horizontal de la bulle pour rester dans l'écran. */
  private _guideShift = 0;
  private _guideBubbleHalf = 120;

  /* --- Surprise du triple-clic --- */
  /** Personnage visé par la rafale de clics en cours (changer = repartir à 1). */
  private _clickTarget?: 'robot' | 'buddy';
  private _clickCount = 0;
  private _firstClickAt = 0;
  /** Vrai dès que le visiteur a découvert la surprise (persisté). */
  private _surpriseFound = false;

  /** Multiplie les délais des bulles/chorégraphies (cadence allégée sur mobile). */
  private _cadence = 1;

  constructor() {
    this.cleanupLegacyDismissal();
    this.restoreSurpriseState();
    this.observeMediaQuery(DESKTOP_MEDIA_QUERY, this._isDesktop);

    /* La scène démarre quand les deux sprites apparaissent dans le DOM et
       s'arrête dès qu'ils en sortent. Elle redémarre au passage du
       breakpoint md : tailles, cadence et gestes sont recalculés. */
    effect((onCleanup) => {
      const robotEl = this._robotRef()?.nativeElement;
      const buddyEl = this._buddyRef()?.nativeElement;
      this._isDesktop();
      if (robotEl && buddyEl) {
        this._zone.runOutsideAngular(() => this.startScene(robotEl, buddyEl));
        onCleanup(() => this.stopScene());
      }
    });

    /* Réaction à la bascule diaporama / compact : petit saut + commentaire.
       Les perchoirs disparaissent avec le décor : chute contrôlée du perché,
       purge du registre et délai de grâce avant tout nouveau scan (les rects
       mentent pendant view-fade-in + reveals + dessin du cadre). */
    effect(() => {
      const compact = this._viewMode.isCompact();
      const known = this._knownCompact;
      this._knownCompact = compact;
      if (known !== undefined && known !== compact) {
        this._zone.runOutsideAngular(() => this.onModeSwitched());
      }
      this._zone.runOutsideAngular(() => this.syncConsoleObserver(compact));
    });
  }

  ngOnDestroy(): void {
    this.stopScene();
    this.stopSensors();
    this._mediaListeners.abort();
  }

  /**
   * Point d'entrée du clic/tap sur un personnage.
   * Ordinateur : chaque clic compte pour la surprise du triple-clic (petite
   * réaction à chaque fois, bascule diaporama / compact au troisième) — un
   * personnage perché reste cliquable, le compteur fonctionne en l'air.
   * Mobile : premier toucher = activation des capteurs de mouvement (la
   * permission iOS exige ce geste), ensuite petite réaction amusée.
   */
  protected onSpriteTap(which: 'robot' | 'buddy'): void {
    if (this._isDesktop()) {
      this.handleDesktopClick(which);
      return;
    }
    this._zone.runOutsideAngular(() => this.handleMobileTap(which));
  }

  /**
   * Nettoyage one-shot de l'ancien masquage (bouton × / appui long, retiré) :
   * les visiteurs de la session en cours qui avaient masqué le duo le
   * retrouvent immédiatement — il est désormais permanent.
   */
  private cleanupLegacyDismissal(): void {
    try {
      sessionStorage.removeItem(LEGACY_DISMISS_KEY);
      localStorage.removeItem(LEGACY_DISMISS_KEY);
    } catch {
      // Stockage indisponible : rien à nettoyer.
    }
  }

  private restoreSurpriseState(): void {
    try {
      this._surpriseFound = localStorage.getItem(SURPRISE_KEY) === 'true';
    } catch {
      // Stockage indisponible : les indices resteront insistants.
    }
  }

  /* ------------------------------------------------------------------ */
  /* Surprise du triple-clic (ordinateur)                                */
  /* ------------------------------------------------------------------ */

  /**
   * Compte les clics sur un personnage : trois clics sur le même en moins de
   * TRIPLE_CLICK_WINDOW déclenchent la surprise (bascule diaporama /
   * compact). Chaque clic intermédiaire vaut une petite réaction complice.
   */
  private handleDesktopClick(which: 'robot' | 'buddy'): void {
    const now = performance.now();
    if (
      this._clickTarget !== which ||
      now - this._firstClickAt > TRIPLE_CLICK_WINDOW
    ) {
      this._clickTarget = which;
      this._clickCount = 0;
      this._firstClickAt = now;
    }
    this._clickCount += 1;

    if (this._clickCount >= 3) {
      this._clickCount = 0;
      this._clickTarget = undefined;
      this.triggerSurprise(which);
      return;
    }

    /* Sursaut complice, puis « Encore un clic… » au deuxième. */
    this._zone.runOutsideAngular(() => {
      const char = which === 'robot' ? this._robot : this._buddy;
      if (!char || this._scene !== 'free') {
        return;
      }
      this.setPhase(char, which === 'robot' ? 'jump' : 'excited', 700);
      if (this._clickCount === 2) {
        this.say(char, this.pickLine(ALMOST_LINES, char), 1300);
      }
    });
  }

  /**
   * Troisième clic : bascule diaporama / compact (persistée par
   * ViewModeService) avec mini-célébration du duo — saut synchronisé,
   * étincelles et bulles « Tadaaa ! ». Fenêtre trop petite pour le mode
   * compact : une bulle l'explique, rien ne bascule.
   */
  private triggerSurprise(which: 'robot' | 'buddy'): void {
    if (!this._viewMode.compactCapable()) {
      this._zone.runOutsideAngular(() => {
        const char = which === 'robot' ? this._robot : this._buddy;
        if (char) {
          this.say(char, SURPRISE_LOCKED_LINE);
        }
      });
      return;
    }

    this.markSurpriseFound();
    const goingCompact = !this._viewMode.isCompact();
    /* La réaction générique au changement de mode (reactToModeChange) est
       neutralisée : la célébration ci-dessous la remplace. */
    this._contextCooldown = CONTEXT_COOLDOWN;
    this._viewMode.toggle();

    this._zone.runOutsideAngular(() => {
      const robot = this._robot;
      const buddy = this._buddy;
      if (!robot || !buddy) {
        return;
      }
      if (this._scene === 'perch') {
        /* Descente express, sans cérémonie : la célébration se joue au sol
           pendant que le perché redescend en 300 ms. */
        this.abortPerch(300);
      } else if (this._scene !== 'free') {
        this.backToFree();
      }
      /* Grand saut à deux : .is-cheering porte aussi les étincelles. */
      this.setPhase(robot, 'cheer', 1100);
      this.setPhase(buddy, 'cheer', 1100);
      const clicked = which === 'robot' ? robot : buddy;
      const other = which === 'robot' ? buddy : robot;
      this.say(
        clicked,
        this.pickLine(
          goingCompact ? SURPRISE_COMPACT_LINES : SURPRISE_SLIDESHOW_LINES,
          clicked
        )
      );
      this.say(other, SURPRISE_ECHO_LINE, 1600);
    });
  }

  /** Mémorise la découverte : les indices se feront ensuite discrets. */
  private markSurpriseFound(): void {
    this._surpriseFound = true;
    try {
      localStorage.setItem(SURPRISE_KEY, 'true');
    } catch {
      // Stockage indisponible : les indices resteront simplement insistants.
    }
  }

  /* ------------------------------------------------------------------ */
  /* Curseur-guide : double du curseur custom qui souffle le secret      */
  /* ------------------------------------------------------------------ */

  /**
   * Arme le curseur-guide au démarrage de la scène. Il ne se joue que sur
   * ordinateur (breakpoint md ET pointeur précis — jamais de curseur sur un
   * écran tactile), une seule fois par session, et uniquement tant que la
   * surprise du triple-clic n'a jamais été découverte. Inéligible : l'état
   * reste 'off', l'élément (inerte, aria-hidden) ne se montre jamais.
   */
  private initGuide(): void {
    const el = this._guideRef()?.nativeElement;
    this._guideEl = el ?? undefined;
    this._guideBubble =
      el?.querySelector<HTMLElement>('.guide-bubble') ?? undefined;
    this._guideState = 'off';
    if (!el) {
      return;
    }
    el.classList.remove('is-visible', 'is-click');
    this._guideBubble?.classList.remove('is-visible');
    if (
      !this._isDesktop() ||
      this._surpriseFound ||
      !window.matchMedia(POINTER_FINE_QUERY).matches
    ) {
      return;
    }
    try {
      if (sessionStorage.getItem(GUIDE_SESSION_KEY) === 'true') {
        return;
      }
    } catch {
      // Stockage indisponible : le guide se joue quand même (une fois par chargement).
    }
    this._guideState = 'waiting';
    this._guideIn =
      this._qaMode === 'fast'
        ? GUIDE_QA_DELAY
        : this.randomDuration(GUIDE_DELAY);
  }

  /** Vrai pendant le numéro du guide : la scène libre reste alors calme. */
  private guideBusy(): boolean {
    return (
      this._guideState === 'gliding' ||
      this._guideState === 'clicking' ||
      this._guideState === 'leaving'
    );
  }

  /**
   * Vie du curseur-guide, au rythme de la boucle rAF partagée : attente,
   * glissé en courbe vers le robot (il suit sa position réelle), trois
   * clics mimés avec bulle indice, fondu de sortie. Le vrai curseur du
   * visiteur n'est évidemment jamais déplacé.
   */
  private tickGuide(delta: number): void {
    const state = this._guideState;
    if (state === 'off') {
      return;
    }
    const el = this._guideEl;
    const robot = this._robot;
    if (!el || !robot) {
      this._guideState = 'off';
      return;
    }

    /* La surprise vient d'être découverte : le guide n'a plus rien à dire. */
    if (this._surpriseFound && state !== 'leaving') {
      if (state === 'waiting') {
        this._guideState = 'off';
      } else {
        this.startGuideLeave();
      }
      return;
    }

    switch (state) {
      case 'waiting': {
        this._guideIn -= delta;
        if (this._guideIn > 0) {
          return;
        }
        /* Jamais pendant une chorégraphie, un perchoir, une célébration ou
           juste après une bascule de mode : le délai écoulé, on guette à
           chaque frame la première accalmie (simple lecture d'état). Même
           attente si la fenêtre ne permet pas la surprise. */
        if (
          this._scene !== 'free' ||
          this._perchGrace > 0 ||
          robot.flight !== undefined ||
          robot.y > 0.5 ||
          !this._viewMode.compactCapable()
        ) {
          return;
        }
        this.startGuideGlide(robot);
        return;
      }
      case 'gliding': {
        this._guideT += delta;
        const t = Math.min(1, this._guideT / GUIDE_GLIDE_MS);
        /* Ease-in-out cubique + arc vertical : courbe douce et organique,
           recalée chaque frame sur la position réelle du robot (il bouge). */
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const target = this.guideTarget(robot);
        const x = this._guideStartX + (target.x - this._guideStartX) * eased;
        const y =
          this._guideStartY +
          (target.y - this._guideStartY) * eased +
          Math.sin(Math.PI * t) * GUIDE_ARC;
        el.style.transform = `translate3d(${x}px, ${-y}px, 0)`;
        if (t >= 1) {
          this._guideState = 'clicking';
          this._guideClicks = 0;
          this._guideClickIn = 260;
          this.showGuideBubble(robot);
        }
        return;
      }
      case 'clicking': {
        /* Collé au robot (il continue sa promenade, sursaute à chaque clic). */
        const target = this.guideTarget(robot);
        el.style.transform = `translate3d(${target.x}px, ${-target.y}px, 0)`;
        this.updateGuideBubbleShift(robot);
        this._guideClickIn -= delta;
        if (this._guideClickIn > 0) {
          return;
        }
        if (this._guideClicks < GUIDE_CLICKS) {
          this._guideClicks += 1;
          this.playGuideClick(el, robot);
          /* Après le dernier clic : pause de lecture, puis sortie. */
          this._guideClickIn =
            this._guideClicks === GUIDE_CLICKS
              ? GUIDE_READ_MS
              : GUIDE_CLICK_INTERVAL;
        } else {
          this.startGuideLeave();
        }
        return;
      }
      case 'leaving': {
        this._guideIn -= delta;
        if (this._guideIn <= 0) {
          this._guideState = 'off';
          el.classList.remove('is-click');
        }
        return;
      }
    }
  }

  /** Départ du glissé : fondu depuis le bord opposé au robot, mi-écran. */
  private startGuideGlide(robot: Character): void {
    try {
      sessionStorage.setItem(GUIDE_SESSION_KEY, 'true');
    } catch {
      // Stockage indisponible : le numéro se jouera au plus une fois par chargement.
    }
    const fromRight = this.centerOf(robot) < window.innerWidth / 2;
    this._guideStartX = fromRight ? window.innerWidth + 24 : -GUIDE_SIZE - 24;
    this._guideStartY = Math.min(window.innerHeight * 0.42, 340);
    this._guideT = 0;
    const el = this._guideEl!;
    const startX = this._guideStartX;
    const startY = this._guideStartY;
    el.style.transform = `translate3d(${startX}px, ${-startY}px, 0)`;
    el.classList.add('is-visible');
    this._guideState = 'gliding';
  }

  /**
   * Position du guide (coin bas-gauche de sa boîte, dans le repère des
   * sprites : x depuis la gauche, y = élévation au-dessus du bas d'écran)
   * pour que la POINTE de la flèche plane sur le haut du corps du robot.
   */
  private guideTarget(robot: Character): { x: number; y: number } {
    return {
      x: robot.x + robot.width * 0.58 - GUIDE_TIP_X,
      y:
        SPRITE_GROUND +
        robot.y +
        robot.height * 0.66 -
        (GUIDE_SIZE - GUIDE_TIP_Y),
    };
  }

  /** Une pulsation : onde + appui de la flèche, sursaut complice du robot. */
  private playGuideClick(el: HTMLElement, robot: Character): void {
    /* L'animation CSS est rejouée en re-posant la classe (le reflow forcé
       ne mesure que cette boîte fixe de 36 px). */
    el.classList.remove('is-click');
    void el.offsetWidth;
    el.classList.add('is-click');
    if (this._scene === 'free' && !robot.flight && robot.y <= 0.5) {
      this.setPhase(robot, 'jump', GUIDE_CLICK_INTERVAL - 40);
    }
  }

  /** Bulle indice du guide (même style que celles du duo, glissée à l'écran). */
  private showGuideBubble(robot: Character): void {
    const bubble = this._guideBubble;
    if (!bubble) {
      return;
    }
    bubble.classList.add('is-visible');
    this._guideBubbleHalf = (bubble.offsetWidth || 240) / 2;
    this._guideShift = Number.NaN;
    this.updateGuideBubbleShift(robot);
  }

  /** Comme updateBubbleShift : la boîte glisse, la flèche reste sur le guide. */
  private updateGuideBubbleShift(robot: Character): void {
    const el = this._guideEl;
    if (!el) {
      return;
    }
    const center = this.guideTarget(robot).x + GUIDE_SIZE / 2;
    const min = 8 + this._guideBubbleHalf;
    const max = Math.max(min, window.innerWidth - 8 - this._guideBubbleHalf);
    const shift = Math.min(Math.max(center, min), max) - center;
    if (Math.abs(shift - this._guideShift) < 0.5) {
      return;
    }
    this._guideShift = shift;
    el.style.setProperty('--guide-bubble-shift', `${shift.toFixed(0)}px`);
  }

  /** Fondu de sortie du guide (la bulle part avec lui). */
  private startGuideLeave(): void {
    this._guideBubble?.classList.remove('is-visible');
    this._guideEl?.classList.remove('is-visible');
    this._guideState = 'leaving';
    this._guideIn = GUIDE_FADE_MS;
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
      height: Math.round(78 * scale),
      moveClass: 'is-walking',
      speed: ROBOT_SPEED,
      x: EDGE_MARGIN + 12,
    });
    this._buddy = this.createCharacter(buddyEl, {
      width: Math.round(BUDDY_WIDTH * scale),
      height: Math.round(56 * scale),
      moveClass: 'is-hopping',
      speed: BUDDY_SPEED,
      x: EDGE_MARGIN + Math.round(ROBOT_WIDTH * scale) + 72,
    });

    this._sceneListeners = new AbortController();
    const signal = this._sceneListeners.signal;

    window.addEventListener(
      'resize',
      () => {
        this.updateBounds();
        /* Horodatage seul (aucun travail) : « L'inspecteur du HUD » vante
           le recalibrage si un resize date de moins de 10 s. */
        this._lastResizeAt = performance.now();
        /* Un perché re-mesure son ancre immédiatement : glissement doux si
           elle a bougé, descente si elle a disparu. */
        if (this._scene === 'perch') {
          this._perchRemeasureIn = 0;
        }
      },
      {
        signal,
        passive: true,
      }
    );

    /* Pas de menu contextuel sur les personnages : il gênerait les taps
       rapides sur mobile (menu d'appui long système). */
    for (const el of [robotEl, buddyEl]) {
      el.addEventListener('contextmenu', (event) => event.preventDefault(), {
        signal,
      });
    }

    /* Regards : la position du curseur est simplement mémorisée ici,
       le travail (variables CSS) se fait au rythme de la boucle rAF.
       Le même listener accumule le détecteur de tourbillon (3 nombres :
       dernier signe, compteur d'inversions, début de fenêtre) et horodate
       l'activité du visiteur — l'évaluation vit dans la rAF. */
    window.addEventListener(
      'mousemove',
      (event) => {
        const now = performance.now();
        this._lastInputAt = now;
        const dx = event.clientX - this._mouseX;
        if (dx !== 0 && Number.isFinite(dx)) {
          const sign = dx > 0 ? 1 : -1;
          if (now - this._swirlStart > SWIRL_WINDOW) {
            this._swirlStart = now;
            this._swirlCount = 0;
          }
          if (this._swirlSign !== 0 && sign !== this._swirlSign) {
            this._swirlCount += 1;
          }
          this._swirlSign = sign;
        }
        this._mouseX = event.clientX;
        this._mouseY = event.clientY;
      },
      { signal, passive: true }
    );

    /* Compteur d'inactivité de « La sieste » : trois écouteurs passifs
       d'une ligne (mousemove et le clic délégué horodatent déjà). */
    for (const type of ['keydown', 'wheel', 'touchstart'] as const) {
      window.addEventListener(
        type,
        () => {
          this._lastInputAt = performance.now();
        },
        { signal, passive: true }
      );
    }

    /* Clics délégués (JAMAIS de preventDefault — navigation intacte) :
       « Bon voyage ! » (lien sortant : _blank ou mailto). Le handler ne
       fait que mémoriser type/x/horodatage — aucune lecture layout. La
       dégringolade n'écoute PAS le clic : l'accordéon se déplie aussi sur
       mouseenter/focus, aria-expanded vaut donc déjà 'true' quand le clic
       (souris OU clavier) arrive ici — le dépli est détecté sur le flip
       d'attribut par le MutationObserver ci-dessous. */
    document.addEventListener(
      'click',
      (event) => {
        this._lastInputAt = performance.now();
        const target = event.target as Element | null;
        if (!target?.closest) {
          return;
        }
        const link = target.closest<HTMLAnchorElement>('a[href]');
        if (!link) {
          return;
        }
        const href = link.getAttribute('href') ?? '';
        const mail = href.startsWith('mailto:');
        if (!mail && link.target !== '_blank') {
          return;
        }
        /* GitHub/LinkedIn ne valent « social » que depuis un badge de
           contact : une tuile projet hébergée sur GitHub reste un projet. */
        this._voyageType = mail
          ? 'email'
          : link.closest('badge') !== null
            ? 'social'
            : 'project';
        this._voyageX = event.clientX || window.innerWidth / 2;
        this._voyagePokedAt = performance.now();
      },
      { signal, passive: true }
    );

    /* « La dégringolade » : le dépli d'une rangée d'Expérience est observé
       à la source — flip aria-expanded 'false' → 'true' du bouton — et
       couvre ainsi souris, clavier (Tab/Entrée/Espace) et dépli
       programmatique à l'identique. oldValue filtre la pose initiale de
       l'attribut (null → 'true' de la rangée active au rendu) et les
       replis. Poseur de drapeau uniquement (ref + horodatage), aucune
       lecture layout ni mutation — consommé par la boucle rAF. Le seul
       aria-expanded de l'app est celui des rangées : l'observation du
       body ne se déclenche que pour elles. */
    this._accordionObserver?.disconnect();
    this._accordionObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const el = mutation.target as Element;
        if (
          mutation.oldValue === 'false' &&
          el.getAttribute('aria-expanded') === 'true' &&
          el.matches(PERCH_SELECTORS.row)
        ) {
          this._accordionPokedEl = el;
          this._accordionPokedAt = performance.now();
        }
      }
    });
    this._accordionObserver.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded'],
      attributeOldValue: true,
    });

    /* Changement de slide du diaporama principal : écoute en phase de capture
       au niveau du document (le swiper est recréé à chaque bascule de mode).
       Le swiper des cartes projets est filtré par son absence de direction
       verticale. */
    document.addEventListener(
      'swiperslidechange',
      (event) => {
        /* Diaporama : TOUT changement de slide (sections verticales comme
           cartes de l'effet cards) invalide les perchoirs — saut au sol
           immédiat, le sprite touche terre avant la fin de la transition
           (~400 ms), puis délai de grâce avant tout re-scan. */
        if (this._scene === 'perch' && !this._viewMode.isCompact()) {
          this.abortPerch(350);
        }
        if (!this._viewMode.isCompact()) {
          this._perchGrace = Math.max(this._perchGrace, PERCH_GRACE_SLIDE);
        }
        const target = event.target as HTMLElement | null;
        if (target?.getAttribute?.('direction') !== 'vertical') {
          return;
        }
        const index = (event as CustomEvent).detail?.[0]?.activeIndex;
        if (typeof index === 'number') {
          this._activeSlide = index;
          /* « Le surf de transition » : le handler ne fait qu'horodater,
             la rAF joue la vague (couloir dédié SURF_COOLDOWN). */
          this._surfPokedAt = performance.now();
          this.reactToSectionChange(index);
        }
      },
      { signal, capture: true }
    );

    /* Survols délégués (document, UN seul closest sur l'union) : cartes
       projets et tuiles compactes (accourse), chips (l'expert), badges de
       contact (ovation). Le handler ne fait que mémoriser refs et
       horodatages. La dégringolade n'est pas ici : le survol précède le
       dépli (mouseenter) — c'est le flip d'aria-expanded qui fait foi
       (MutationObserver ci-dessus). */
    document.addEventListener(
      'mouseover',
      (event) => {
        const el = (event.target as Element | null)?.closest?.(
          REACT_HOVER_SELECTOR
        );
        if (!el) {
          return;
        }
        if (el.matches(BADGE_HOVER_SELECTOR)) {
          this._badgePokedEl = el;
          this._badgePokedAt = performance.now();
          return;
        }
        if (el !== this._hoveredEl) {
          this._hoveredEl = el;
          this._hoveredKind = el.matches(CHIP_HOVER_SELECTOR)
            ? 'chip'
            : 'project';
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
          this._hoveredEl &&
          (!related || !this._hoveredEl.contains(related))
        ) {
          this._hoveredEl = undefined;
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

    /* Hook QA : la clé est lue UNE fois par démarrage de scène (redémarrage
       de scène = re-lecture). Sans la clé : cadence normale, aucune surface
       exposée. */
    this.readQaMode();

    /* Curseur-guide : armé une fois par session si la surprise du
       triple-clic n'a jamais été découverte (ordinateur, pointeur précis). */
    this.initGuide();

    /* Entrée en scène : le robot salue, l'ami trépigne, puis chacun sa vie. */
    this._scene = 'free';
    this._script = undefined;
    this.setPhase(this._robot, 'wave', 2600);
    this.setPhase(this._buddy, 'excited', 2200);
    this._nextTalkIn =
      this.randomDuration(this.qaAmbient(AMBIENT_FIRST_DELAY)) * this._cadence;
    this._nextDuoIn =
      this.randomDuration(this.qaAmbient(DUO_FIRST_DELAY)) * this._cadence;
    this._nextPerchIn = this.nextPerchDelay(true);
    this._perchGrace = 0;
    /* L'index de slide est relu depuis le swiper réel : le franchissement du
       breakpoint md redémarre la scène SANS toucher au diaporama, un reset
       aveugle à 0 désynchroniserait les perchoirs (cibles hors viewport). */
    this.syncActiveSlide();
    this._contextCooldown = 0;
    this._sectionCooldown = 0;
    this._tapCooldown = 0;
    this._clickCount = 0;
    this._clickTarget = undefined;

    /* Réactions visiteur : état neuf (pendings purgés, couloirs ouverts,
       compteur d'inactivité et capacité du pointeur recalculés). */
    this._lastInputAt = performance.now();
    this._napIdleMs =
      this._qaMode === 'fast'
        ? NAP_QA_IDLE_MS
        : mobile
          ? NAP_IDLE_MOBILE_MS
          : NAP_IDLE_MS;
    this._napping = false;
    this._reactivePlan = false;
    this._delayed = [];
    this._lookUp = undefined;
    this._alertHold = 0;
    this._badgePokedEl = undefined;
    this._accordionPokedEl = undefined;
    this._voyageType = undefined;
    this._surfPokedAt = 0;
    this._swirlSign = 0;
    this._swirlCount = 0;
    this._reactCooldown = 0;
    this._accourseUntil = 0;
    this._ovationUntil = 0;
    this._voyageUntil = 0;
    this._surfUntil = 0;
    this._swirlUntil = 0;
    this._skillUntil = 0;
    this._accordionFallUntil = 0;
    this._finePointer = window.matchMedia(POINTER_FINE_QUERY).matches;

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

  private stopScene(): void {
    cancelAnimationFrame(this._rafId);
    this._rafId = 0;
    this._sceneListeners?.abort();
    this._sceneListeners = undefined;
    this._accordionObserver?.disconnect();
    this._accordionObserver = undefined;
    /* Les éléments DOM survivent au redémarrage de la scène (bascule du
       breakpoint md) : l'état posé impérativement est retiré ici, sinon
       bulle figée, bouche animée, alerte ou déséquilibre resteraient
       collés alors que les nouveaux Character repartent de zéro. */
    for (const char of [this._robot, this._buddy]) {
      if (!char) {
        continue;
      }
      char.bubble.classList.remove('is-visible');
      char.el.classList.remove(
        'is-talking',
        'is-alert',
        'is-offbalance',
        'is-hiding',
        'is-carrying',
        'is-sparking'
      );
      char.el.style.removeProperty('--duo-tilt');
    }
    /* Curseur-guide : tout état visuel posé impérativement est retiré (les
       éléments survivent au redémarrage de la scène). */
    this._guideEl?.classList.remove('is-visible', 'is-click');
    this._guideBubble?.classList.remove('is-visible');
    this._guideEl = undefined;
    this._guideBubble = undefined;
    this._guideState = 'off';

    this._robot = undefined;
    this._buddy = undefined;
    this._script = undefined;
    this._hoveredEl = undefined;
    this._hoverSince = 0;
    this._delayed = [];
    this._lookUp = undefined;
    this.resetPerchState();
    this.disconnectConsoleObserver();
    if (this._qaMode) {
      delete (window as unknown as Record<string, unknown>)['__mascotQa'];
    }
  }

  private createCharacter(
    el: HTMLButtonElement,
    init: {
      width: number;
      height: number;
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
      height: init.height,
      moveClass: init.moveClass,
      speed: init.speed,
      x: init.x,
      y: 0,
      maxX: init.x,
      dir: 1,
      phase: 'rest',
      phaseRemaining: 0,
      speedFactor: 1,
      targetX: init.x,
      arrived: true,
      bubbleRemaining: 0,
      bubbleHalf: 60,
      bubbleHalfH: 16,
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
    this._tapCooldown -= delta;
    this._perchGrace -= delta;
    this._reactCooldown -= delta;
    this._alertHold -= delta;
    if (this._lookUp && (this._lookUp.remaining -= delta) <= 0) {
      this._lookUp = undefined;
    }

    /* Micro-ordonnanceur des actions décalées (vague du surf, cascade du
       réveil, re-poses) : chaque run se re-vérifie avant d'agir. */
    if (this._delayed.length > 0) {
      for (let i = this._delayed.length - 1; i >= 0; i -= 1) {
        const item = this._delayed[i];
        item.in -= delta;
        if (item.in <= 0) {
          this._delayed.splice(i, 1);
          item.run();
        }
      }
    }

    this.updateBubble(robot, delta);
    this.updateBubble(buddy, delta);
    this.updateGazes(robot, buddy);
    this.tickSensors(robot, buddy, delta);
    this.tickSensorInvite(robot, delta);

    /* Vols balistiques (sauts paraboliques, glissades, chutes) : interpolés
       ici quelle que soit la scène — un personnage en vol n'est jamais
       piloté par tickFree en parallèle. */
    this.tickFlight(robot, delta);
    this.tickFlight(buddy, delta);

    this.tickGuide(delta);

    /* Réactions aux actions du visiteur : arbitre unique (sieste/réveil,
       surf, puis couloir global — voir tickReactions). */
    this.tickReactions(robot, buddy, timestamp);

    switch (this._scene) {
      case 'free':
        this.tickFree(robot, delta);
        this.tickFree(buddy, delta);
        /* Pendant le numéro du curseur-guide, la scène reste calme : ni
           bavardage ambiant, ni chorégraphie, ni perchoir ne démarrent. */
        if (!this.guideBusy()) {
          this.tickAmbientTalk(delta);
          this.tickDuoCountdown(delta);
          this.tickPerchCountdown(delta);
        }
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
      case 'perch':
        /* Le perché est piloté par ses étapes ; l'autre continue sa vie
           libre au sol (sauf escorte de la courte échelle). _nextDuoIn et
           _nextPerchIn sont GELÉS pendant ce temps. */
        this.tickPerch(delta);
        break;
    }

    this._rafId = requestAnimationFrame(this._onFrame);
  };

  /* --- Vie libre : chacun se promène, s'arrête, repart --- */

  private tickFree(char: Character, delta: number): void {
    if (char.flight) {
      /* En vol (retombée de perchoir, célébration en l'air) : la boucle de
         vol pilote seule la position jusqu'à l'atterrissage. */
      return;
    }
    if (char.y > 0.5) {
      /* Filet de sécurité : jamais suspendu sans vol — retombée douce. */
      this.launchFlight(char, char.x, 0, 0, 400, 'inQuad');
      return;
    }
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

  /** `only` : pendant un perchoir, seul le personnage au sol bavarde
      (le perché a ses bulles scriptées). */
  private tickAmbientTalk(delta: number, only?: Character): void {
    this._nextTalkIn -= delta;
    if (this._nextTalkIn > 0) {
      return;
    }
    this._nextTalkIn =
      this.randomDuration(this.qaAmbient(AMBIENT_DELAY)) * this._cadence;
    const robot = this._robot!;
    const buddy = this._buddy!;
    /* Le robot parle le plus souvent, l'ami place son petit mot parfois. */
    const speaker = only ?? (Math.random() < 0.7 ? robot : buddy);
    if (speaker.bubbleRemaining > 0) {
      return;
    }

    /* Indice vers la surprise du triple-clic — seulement là où elle existe
       (ordinateur, viewport compatible) : tirage insistant tant qu'elle n'a
       jamais été découverte, discret ensuite. */
    const hintChance = this._surpriseFound
      ? HINT_CHANCE_DISCOVERED
      : HINT_CHANCE_UNDISCOVERED;
    if (
      this._isDesktop() &&
      this._viewMode.compactCapable() &&
      Math.random() < hintChance
    ) {
      const hints = speaker === robot ? ROBOT_HINT_LINES : BUDDY_HINT_LINES;
      this.say(speaker, this.pickLine(hints, speaker));
      return;
    }

    const pool = speaker === robot ? ROBOT_LINES : BUDDY_LINES;
    this.say(speaker, this.pickLine(pool, speaker));
  }

  /* --- Chorégraphies à deux --- */

  private tickDuoCountdown(delta: number): void {
    this._nextDuoIn -= delta;
    if (this._nextDuoIn > 0) {
      return;
    }
    this._nextDuoIn =
      this.randomDuration(this.qaAmbient(DUO_DELAY)) * this._cadence;
    this.startDuoEvent();
  }

  /** Tire au sort la prochaine chorégraphie : rencontre, high-five ou poursuite.
      En mode compact, 1 chorégraphie sur 4 devient « la courte échelle ». */
  private startDuoEvent(): void {
    const robot = this._robot!;
    const buddy = this._buddy!;

    if (
      this._viewMode.isCompact() &&
      this._perchGrace <= 0 &&
      Math.random() < 0.25 &&
      this.startCourteEchelle()
    ) {
      return;
    }
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
  /* Moteur perchoir — vols, assises, registre d'ancres                  */
  /*                                                                     */
  /* Le monde est INTOUCHABLE : lecture seule (querySelectorAll +        */
  /* getBoundingClientRect) au déclenchement d'un comportement, puis     */
  /* re-mesure de LA seule ancre active toutes les 300 ms pendant        */
  /* l'assise. Aucune classe, aucun style, aucun transform sur les       */
  /* éléments de la page : toutes les illusions physiques (poussée,      */
  /* rebond, glissade) vivent sur les sprites.                           */
  /* ------------------------------------------------------------------ */

  /** Borne un x de sprite dans l'écran (les perchoirs vont jusqu'aux bords). */
  private clampX(char: Character, x: number): number {
    return Math.min(Math.max(x, 4), window.innerWidth - char.width - 4);
  }

  /** Élévation (y) qui pose le BAS du sprite à `screenY` px du haut du viewport. */
  private elevationTo(screenY: number): number {
    return Math.max(0, window.innerHeight - 2 - screenY);
  }

  /** Vrai si le rect est entièrement visible dans le viewport — les slides
      verticales hors écran restent rendues (css-mode), leurs rects mentent. */
  private rectInViewport(rect: DOMRect): boolean {
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }

  /** Resynchronise `_activeSlide` sur l'instance réelle du swiper vertical
      (absente en compact ou juste après recréation : slide 0 dans les deux cas). */
  private syncActiveSlide(): void {
    const host = document.querySelector(
      'swiper-container[direction="vertical"]'
    ) as { swiper?: { activeIndex?: number } } | null;
    this._activeSlide = host?.swiper?.activeIndex ?? 0;
  }

  /** Position écran du haut du sprite (règle « pas de bulle trop haut »). */
  private spriteTop(char: Character): number {
    return window.innerHeight - 2 - char.y - char.height;
  }

  /** Bulle d'un perché : jamais quand elle sortirait par le haut de l'écran. */
  private sayPerched(char: Character, text: string, duration?: number): void {
    if (this.spriteTop(char) < BUBBLE_MIN_TOP) {
      return;
    }
    this.say(char, text, duration);
  }

  /** Scan ponctuel d'un sélecteur : 1 querySelectorAll + N getBoundingClientRect. */
  private rectsOf(selector: string): { el: Element; rect: DOMRect }[] {
    const found: { el: Element; rect: DOMRect }[] = [];
    document.querySelectorAll(selector).forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        found.push({ el, rect });
      }
    });
    return found;
  }

  private firstRect(selector: string): { el: Element; rect: DOMRect } | null {
    const el = document.querySelector(selector);
    if (!el) {
      return null;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? { el, rect } : null;
  }

  /**
   * Lance un vol balistique. La durée par défaut est plafonnée par la
   * distance (durée = clamp(dist / 0.9 px·ms⁻¹, 350, 900 ms)).
   */
  private launchFlight(
    char: Character,
    toX: number,
    toY: number,
    height: number,
    duration?: number,
    ease?: 'inQuad',
    onLand?: () => void
  ): void {
    const clampedX = this.clampX(char, toX);
    const dist = Math.hypot(clampedX - char.x, toY - char.y);
    const ms = duration ?? Math.min(900, Math.max(350, dist / 0.9));
    if (Math.abs(clampedX - char.x) > 2) {
      char.dir = clampedX >= char.x ? 1 : -1;
      this.applyDirection(char);
    }
    char.flight = {
      fromX: char.x,
      fromY: char.y,
      toX: clampedX,
      toY,
      height,
      duration: ms,
      t: 0,
      ease,
      onLand,
    };
  }

  /** Interpole le vol en cours : x en ease-in-out, y en arche parabolique. */
  private tickFlight(char: Character, delta: number): void {
    const flight = char.flight;
    if (!flight) {
      return;
    }
    flight.t = Math.min(1, flight.t + delta / flight.duration);
    const t = flight.t;
    const eased = t * t * (3 - 2 * t);
    char.x = flight.fromX + (flight.toX - flight.fromX) * eased;
    const vertical = flight.ease === 'inQuad' ? t * t : t;
    char.y =
      flight.fromY +
      (flight.toY - flight.fromY) * vertical +
      flight.height * 4 * t * (1 - t);
    this.applyPosition(char);
    if (t >= 1) {
      char.flight = undefined;
      char.x = flight.toX;
      char.y = flight.toY;
      this.applyPosition(char);
      flight.onLand?.();
    }
  }

  /* --- Cadence et tirage --- */

  private nextPerchDelay(first = false): number {
    const range = this._qaMode
      ? first
        ? { min: 1500, max: 3000 }
        : { min: 4000, max: 7000 }
      : first
        ? PERCH_FIRST_DELAY
        : PERCH_DELAY;
    /* Mobile : ×1.5 en plus de la cadence globale ×1.5 (~1 perchoir / 22-45 s). */
    const mobileFactor = this._isDesktop() ? 1 : PERCH_MOBILE_FACTOR;
    return this.randomDuration(range) * this._cadence * mobileFactor;
  }

  /** Divise les cadences ambiantes/duo par 5 en mode QA. */
  private qaAmbient(range: { min: number; max: number }): {
    min: number;
    max: number;
  } {
    return this._qaMode ? { min: range.min / 5, max: range.max / 5 } : range;
  }

  /** Divise les durées d'assise par 2 en mode QA 'fast'. */
  private qaSit(ms: number): number {
    return this._qaMode === 'fast' ? ms / 2 : ms;
  }

  /** Divise les cooldowns (visite guidée, réactions visiteur) par 5 en mode
      QA 'fast' — REACT_GLOBAL_COOLDOWN et consorts passent par ici. */
  private qaCooldown(ms: number): number {
    return this._qaMode === 'fast' ? ms / 5 : ms;
  }

  /** Seuils de survol prolongé (accourse 1200 / chips 1500) → 300 ms en
      mode QA 'fast'. */
  private qaHover(ms: number): number {
    return this._qaMode === 'fast' ? 300 : ms;
  }

  /** Compte à rebours du prochain perchoir — décrémenté en scène 'free'
      uniquement (gelé pendant approach / duo / chase / perch). */
  private tickPerchCountdown(delta: number): void {
    this._nextPerchIn -= delta;
    if (this._nextPerchIn > 0) {
      return;
    }
    this._nextPerchIn = this.nextPerchDelay();
    if (this._perchGrace > 0) {
      return;
    }
    /* Mobile : jamais de perchoir quand le sol penche (zone morte du tilt). */
    if (!this._isDesktop() && Math.abs(this._tilt) > TILT_DEADZONE) {
      return;
    }
    this.drawPerchBehavior();
  }

  /**
   * Sélection pondérée par mode. Un comportement indisponible (ancre
   * absente, condition non remplie) est retiré du tirage et un autre est
   * tenté — le tour est simplement sauté si rien n'est possible.
   */
  private drawPerchBehavior(): void {
    const compact = this._viewMode.isCompact();
    const table: { name: PerchName; weight: number }[] = compact
      ? [
          { name: 'vigie', weight: 12 },
          { name: 'funambule', weight: 10 },
          { name: 'trampoline', weight: 10 },
          { name: 'attache', weight: 12 },
          { name: 'coucou', weight: 8 },
          { name: 'tuile', weight: 7 },
          { name: 'baie', weight: 7 },
          { name: 'marches', weight: 12 },
          { name: 'cachette', weight: 8 },
          { name: 'picoreur', weight: 10 },
          { name: 'chip', weight: 8 },
          /* La visite est en plus bridée à ~1 / 2 min (builder). */
          { name: 'visite', weight: 10 },
          /* Zéro lecture DOM : poids fort pour nourrir la cadence resserrée. */
          { name: 'repare', weight: 15 },
          { name: 'hud', weight: 12 },
        ]
      : this._isDesktop()
        ? [
            { name: 'funambule', weight: 25 },
            { name: 'attache', weight: 20 },
            { name: 'sommet', weight: 20 },
            { name: 'rodeo', weight: 20 },
            { name: 'visite', weight: 15 },
          ]
        : [
            /* Mobile : seuls le funambule (carte active) et l'attaché de
               presse (slide profil) sont retenus. */
            { name: 'funambule', weight: 45 },
            { name: 'attache', weight: 30 },
          ];

    if (this._qaMode === 'perch-only') {
      /* Rotation séquentielle déterministe : tout observer sans hasard. */
      for (let i = 0; i < table.length; i += 1) {
        const pick = table[(this._qaRotation + i) % table.length].name;
        if (this.startPerchBehavior(pick)) {
          this._qaRotation = (this._qaRotation + i + 1) % table.length;
          return;
        }
      }
      return;
    }

    const pool = [...table];
    while (pool.length > 0) {
      const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
      let roll = Math.random() * total;
      let index = 0;
      for (; index < pool.length - 1; index += 1) {
        roll -= pool[index].weight;
        if (roll <= 0) {
          break;
        }
      }
      if (this.startPerchBehavior(pool[index].name)) {
        return;
      }
      pool.splice(index, 1);
    }
  }

  /** Construit et lance un comportement nommé. Faux si indisponible. */
  private startPerchBehavior(name: PerchName): boolean {
    const robot = this._robot;
    const buddy = this._buddy;
    if (!robot || !buddy || this._scene !== 'free') {
      return false;
    }
    let plan: { who: Character; steps: PerchStep[] } | null = null;
    switch (name) {
      case 'vigie':
        plan = this.buildVigie(robot);
        break;
      case 'funambule':
        plan = this.buildFunambule(robot);
        break;
      case 'trampoline':
        plan = this.buildTrampoline(buddy);
        break;
      case 'attache':
        plan = this.buildAttache(robot);
        break;
      case 'coucou':
        plan = this.buildCoucou(buddy);
        break;
      case 'tuile':
        plan = this.buildTuile(robot);
        break;
      case 'baie':
        plan = this.buildBaie(buddy);
        break;
      case 'sommet':
        plan = this.buildSommet(buddy);
        break;
      case 'marches':
        plan = this.buildMarches(buddy);
        break;
      case 'cachette':
        plan = this.buildCachette(robot, buddy);
        break;
      case 'picoreur':
        plan = this.buildPicoreur(buddy);
        break;
      case 'chip':
        plan = this.buildChip(robot, buddy);
        break;
      case 'visite':
        plan = this.buildVisite(robot, buddy);
        break;
      case 'repare':
        plan = this.buildRepare(robot);
        break;
      case 'rodeo':
        plan = this.buildRodeo(buddy);
        break;
      case 'hud':
        plan = this.buildHud(robot);
        break;
    }
    if (!plan) {
      return false;
    }
    this._scene = 'perch';
    this._perchWho = plan.who;
    this._perchSteps = plan.steps;
    this._perchIndex = -1;
    this._perchWait = 0;
    this._perchEscort = false;
    this._perchAnchor = undefined;
    this._perchFollow = false;
    plan.who.speedFactor = 1;
    this.advancePerch();
    return true;
  }

  /**
   * Exécute un plan RÉACTIF (accourse, sieste) sur le MÊME exécuteur que
   * les perchoirs : scene='perch' + drapeau _reactivePlan. Les compteurs
   * de vie autonome restent naturellement gelés hors 'free' — c'est le
   * but. Tous les chemins d'abort existants (triple-clic, secousse,
   * bascule, slide) s'appliquent tels quels.
   */
  private startReactionPlan(who: Character, steps: PerchStep[]): void {
    this._scene = 'perch';
    this._perchWho = who;
    this._perchSteps = steps;
    this._perchIndex = -1;
    this._perchWait = 0;
    this._perchEscort = false;
    this._perchAnchor = undefined;
    this._perchFollow = false;
    this._reactivePlan = true;
    who.speedFactor = 1;
    this.advancePerch();
  }

  /* --- Exécution séquentielle des étapes --- */

  private advancePerch(): void {
    const who = this._perchWho;
    if (!who) {
      return;
    }
    this._perchIndex += 1;
    this._perchTraverse = undefined;
    this._perchOrbit = undefined;
    this._perchFollow = false;
    if (this._perchIndex >= this._perchSteps.length) {
      this.endPerch(who.flight ? who : undefined);
      return;
    }
    const step = this._perchSteps[this._perchIndex];
    switch (step.kind) {
      case 'do':
        step.run();
        this.advancePerch();
        return;
      case 'walk': {
        const to = step.to();
        if (to === null) {
          this.controlledFall();
          return;
        }
        /* Trajet borné à ~6 s : un perchoir à l'autre bout de l'écran se
           rejoint au petit trot, pas en 30 s de marche contemplative. */
        const distance = Math.abs(
          Math.min(Math.max(to, EDGE_MARGIN), who.maxX) - who.x
        );
        who.speedFactor = Math.min(
          4,
          Math.max(step.speedFactor ?? 1.2, distance / (who.speed * 6))
        );
        who.targetX = Math.min(Math.max(to, EDGE_MARGIN), who.maxX);
        who.arrived = Math.abs(who.x - who.targetX) < 2;
        who.dir = who.targetX >= who.x ? 1 : -1;
        this.applyDirection(who);
        this.setPhase(who, who.arrived ? 'rest' : 'move', 60000);
        if (who.arrived) {
          this.advancePerch();
        }
        return;
      }
      case 'pose':
        this.setPhase(who, step.phase, step.ms + 500);
        this._perchWait = step.ms;
        return;
      case 'jump': {
        const to = step.to();
        if (to === null) {
          this.controlledFall();
          return;
        }
        this.setPhase(who, step.phase ?? 'rest', (step.ms ?? 900) + 300);
        this.launchFlight(
          who,
          to.x,
          to.y,
          step.height,
          step.ms,
          undefined,
          () => this.advancePerch()
        );
        return;
      }
      case 'sit':
        this.setPhase(who, step.phase, step.ms + 1000);
        this._perchWait = step.ms;
        this._perchFollow = step.follow === true;
        this._perchTargetX = who.x;
        this._perchTargetY = who.y;
        this._perchRemeasureIn = 0;
        return;
      case 'traverse': {
        const to = step.to();
        if (to === null) {
          this.controlledFall();
          return;
        }
        this._perchTraverse = { toX: this.clampX(who, to), speed: step.speed };
        who.dir = this._perchTraverse.toX >= who.x ? 1 : -1;
        this.applyDirection(who);
        this.setPhase(who, step.phase ?? 'tightrope', 60000);
        this._perchFollow = true;
        this._perchTargetX = who.x;
        this._perchTargetY = who.y;
        this._perchRemeasureIn = 0;
        return;
      }
      case 'slide': {
        const ms = step.ms || Math.min(900, Math.max(500, who.y * 1.2));
        this.setPhase(who, 'slide', ms + 300);
        this.launchFlight(who, who.x, 0, 0, ms, 'inQuad', () =>
          this.advancePerch()
        );
        return;
      }
      case 'orbit': {
        const anchor = this._perchAnchor;
        const rect =
          anchor && anchor.el.isConnected
            ? anchor.el.getBoundingClientRect()
            : undefined;
        if (!rect || rect.width === 0) {
          this.controlledFall();
          return;
        }
        const radius = rect.width / 2;
        const side = who.x + who.width / 2 >= rect.left + radius ? 1 : -1;
        this._perchOrbit = {
          cx: rect.left + radius,
          cy: rect.top + radius,
          r: radius,
          from: -Math.PI / 2,
          to: side === 1 ? 0 : -Math.PI,
          ms: step.ms,
          t: 0,
        };
        this.setPhase(who, 'slide', step.ms + 300);
        return;
      }
    }
  }

  /** Boucle de la scène 'perch' : le perché suit ses étapes, l'autre vit. */
  private tickPerch(delta: number): void {
    const robot = this._robot!;
    const buddy = this._buddy!;
    const who = this._perchWho;
    if (!who) {
      this.endPerch();
      return;
    }
    const grounded = who === robot ? buddy : robot;

    /* « La dégringolade de l'accordéon » : le visiteur déplie une rangée
       SOUS le perché — la dignité vole en éclats. L'observateur
       d'aria-expanded n'a posé qu'un drapeau ; consommé ici si l'ancre
       active est une rangée ou un descendant de la cellule Expérience.
       Pendant le cooldown de 30 s, la sollicitation est absorbée par le
       suivi d'ancre normal (il s'accroche — c'est aussi un gag). */
    if (
      this._accordionPokedAt > 0 &&
      this._lastTimestamp - this._accordionPokedAt < ACCORDION_POKE_FRESH &&
      !this._napping &&
      !who.flight
    ) {
      const anchorEl = this._perchAnchor?.el;
      const poked = this._accordionPokedEl;
      if (anchorEl && poked) {
        const onRow = anchorEl.matches?.(PERCH_SELECTORS.row) === true;
        const sameCell =
          anchorEl.closest?.('section') === poked.closest('section');
        if (
          (onRow || sameCell) &&
          this._lastTimestamp >= this._accordionFallUntil
        ) {
          this._accordionPokedAt = 0;
          this._accordionFallUntil =
            this._lastTimestamp + this.qaCooldown(ACCORDION_FALL_COOLDOWN);
          this._reactCooldown = Math.max(
            this._reactCooldown,
            this.qaCooldown(REACT_GLOBAL_COOLDOWN)
          );
          const faller = who;
          /* Le fou rire arrive après la chute (450 ms) + le trébuchement —
             un court répit des tirages autonomes lui garantit sa scène. */
          this._nextPerchIn = Math.max(this._nextPerchIn, 3200);
          this._nextDuoIn = Math.max(this._nextDuoIn, 3200);
          this._delayed.push({
            in: 1450,
            run: () => {
              if (this._scene === 'free' && !faller.flight && faller.y <= 0.5) {
                this.setPhase(faller, 'laugh', 1400);
              }
            },
          });
          this.controlledFall(this.pickLine(ACCORDION_FALL_LINES, who));
          return;
        }
      }
    }

    /* Le personnage au sol continue sa vie libre (bulles ambiantes
       comprises) — sauf pendant la courte échelle où il est acteur. */
    if (!this._perchEscort) {
      this.tickFree(grounded, delta);
      this.tickAmbientTalk(delta, grounded);
    } else if (!grounded.arrived) {
      this.tickApproach(grounded, delta);
    }

    const step = this._perchSteps[this._perchIndex];
    if (!step) {
      /* Chute contrôlée en cours : le vol vers le sol termine la scène. */
      return;
    }

    /* Re-mesure de LA seule ancre active (~1 lecture layout / 300 ms —
       couvre la transition 300 ms de l'accordéon et le scroll interne). */
    if (this._perchFollow && this._perchAnchor) {
      this._perchRemeasureIn -= delta;
      if (this._perchRemeasureIn <= 0) {
        this._perchRemeasureIn = PERCH_REMEASURE;
        if (!this.remeasureAnchor(who)) {
          return;
        }
      }
    }

    switch (step.kind) {
      case 'walk':
        if (who.flight) {
          /* Encore en l'air (retombée express) : la marche attend le sol. */
          return;
        }
        if (!who.arrived) {
          this.tickApproach(who, delta);
        }
        if (who.arrived) {
          this.advancePerch();
        }
        return;
      case 'pose':
      case 'sit': {
        this._perchWait -= delta;
        if (step.kind === 'sit' && this._perchFollow) {
          /* Glissement doux vers l'ancre (hover -translate-y, accordéon,
             scroll interne) : lerp temporel, jamais de saut sec. */
          const k = Math.min(1, delta / 140);
          who.x += (this._perchTargetX - who.x) * k;
          who.y += (this._perchTargetY - who.y) * k;
          this.applyPosition(who);
        }
        if (this._perchWait <= 0) {
          this.advancePerch();
        }
        return;
      }
      case 'traverse': {
        const traverse = this._perchTraverse;
        if (!traverse) {
          this.advancePerch();
          return;
        }
        const stride = (traverse.speed * delta) / 1000;
        const remaining = traverse.toX - who.x;
        const k = Math.min(1, delta / 140);
        who.y += (this._perchTargetY - who.y) * k;
        if (Math.abs(remaining) <= stride) {
          who.x = traverse.toX;
          this.applyPosition(who);
          this.advancePerch();
          return;
        }
        who.x += Math.sign(remaining) * stride;
        this.applyPosition(who);
        return;
      }
      case 'orbit': {
        const orbit = this._perchOrbit;
        if (!orbit) {
          this.advancePerch();
          return;
        }
        orbit.t = Math.min(1, orbit.t + delta / orbit.ms);
        const angle = orbit.from + (orbit.to - orbit.from) * orbit.t;
        const px = orbit.cx + Math.cos(angle) * orbit.r;
        const py = orbit.cy + Math.sin(angle) * orbit.r;
        who.x = this.clampX(who, px - who.width / 2);
        who.y = this.elevationTo(py);
        this.applyPosition(who);
        if (orbit.t >= 1) {
          this.advancePerch();
        }
        return;
      }
      default:
        /* jump / slide : le vol appelle advancePerch à l'atterrissage. */
        return;
    }
  }

  /** Mémorise l'ancre re-mesurée pendant les assises suivies. */
  private setPerchAnchor(
    el: Element,
    point: (rect: DOMRect) => { x: number; y: number }
  ): void {
    this._perchAnchor = { el, point };
    this._perchRemeasureIn = 0;
  }

  /** Re-mesure l'ancre active. Faux si elle a disparu (chute déclenchée). */
  private remeasureAnchor(who: Character): boolean {
    const anchor = this._perchAnchor;
    if (!anchor) {
      return true;
    }
    if (!anchor.el.isConnected) {
      this.controlledFall();
      return false;
    }
    const rect = anchor.el.getBoundingClientRect();
    if (
      rect.width === 0 ||
      rect.height === 0 ||
      rect.bottom < 0 ||
      rect.top > window.innerHeight
    ) {
      this.controlledFall();
      return false;
    }
    const point = anchor.point(rect);
    const x = this.clampX(who, point.x);
    if (
      Math.abs(x - this._perchTargetX) > PERCH_DRIFT_TOLERANCE ||
      Math.abs(point.y - this._perchTargetY) > PERCH_DRIFT_TOLERANCE
    ) {
      this._perchTargetX = x;
      this._perchTargetY = point.y;
    }
    return true;
  }

  /**
   * Chute contrôlée : l'ancre a disparu ou le décor a changé. Elle ne
   * dépend que de x/y du sprite (aucune lecture du DOM cible) : gravité
   * douce, réception trébuchante, bulle optionnelle, retour à la vie libre.
   */
  private controlledFall(line?: string): void {
    const who = this._perchWho;
    if (!who) {
      return;
    }
    /* Les effets posés par les numéros (cachette, chip, soudure) tombent
       avec le perché — jamais de pilule fantôme pendant la chute. */
    this.clearPerchEffects();
    this._perchSteps = [];
    this._perchIndex = 0;
    this._perchFollow = false;
    this._perchAnchor = undefined;
    this._perchTraverse = undefined;
    this._perchOrbit = undefined;
    if (who.y < 1 && !who.flight) {
      this.setPhase(who, 'stumble', 1000);
      if (line) {
        this.say(who, line);
      }
      this.endPerch(who);
      return;
    }
    this.launchFlight(who, who.x, 0, 0, 450, 'inQuad', () => {
      this.setPhase(who, 'stumble', 1000);
      if (line) {
        this.say(who, line);
      }
      this.endPerch(who);
    });
  }

  /**
   * Descente express (triple-clic, changement de slide) : saut direct au
   * sol, sans cérémonie — la scène redevient 'free' immédiatement, le
   * compteur de clics et la célébration ne sont pas retardés.
   */
  private abortPerch(ms: number): void {
    const who = this._perchWho;
    const escort = this._perchEscort;
    this.resetPerchState();
    this._scene = 'free';
    if (!who) {
      return;
    }
    who.speedFactor = 1;
    if (who.y > 0.5 || who.flight) {
      this.launchFlight(who, who.x, 0, 0, ms, 'inQuad');
    }
    this.setPhase(who, 'rest', this.randomDuration(IDLE_DURATION));
    /* Plans escortés (cachette, visite guidée, courte échelle) : le
       personnage au sol porte une phase posée par le plan (jusqu'à 60 s) —
       sans remise à zéro il resterait statufié en 'free'. Même retour à la
       vie libre que dans endPerch. */
    if (escort) {
      const other = who === this._robot ? this._buddy : this._robot;
      if (other) {
        other.speedFactor = 1;
        if (!other.flight) {
          this.setPhase(other, 'rest', this.randomDuration(IDLE_DURATION));
        }
      }
    }
  }

  /** Fin de scène perchée : retour à la vie libre (le personnage `preserve`
      garde sa phase — réception trébuchante, fou rire…). */
  private endPerch(preserve?: Character): void {
    const robot = this._robot;
    const buddy = this._buddy;
    this.resetPerchState();
    this._scene = 'free';
    for (const char of [robot, buddy]) {
      if (!char) {
        continue;
      }
      char.speedFactor = 1;
      if (char !== preserve && !char.flight) {
        this.setPhase(char, 'rest', this.randomDuration(IDLE_DURATION));
      }
    }
  }

  private resetPerchState(): void {
    this.clearPerchEffects();
    this._perchWho = undefined;
    this._perchSteps = [];
    this._perchIndex = -1;
    this._perchWait = 0;
    this._perchAnchor = undefined;
    this._perchFollow = false;
    this._perchTraverse = undefined;
    this._perchOrbit = undefined;
    this._perchEscort = false;
    this._reactivePlan = false;
    this._napping = false;
  }

  /** Retire les effets visuels posés par les numéros (tassement du
      cache-cache, chip simulée, étincelles de soudure) : appelé sur TOUS
      les chemins de sortie — endPerch et abortPerch via resetPerchState,
      chute contrôlée, démontage de la scène. */
  private clearPerchEffects(): void {
    for (const char of [this._robot, this._buddy]) {
      char?.el.classList.remove('is-hiding', 'is-carrying', 'is-sparking');
    }
  }

  /* --- Comportements — mode compact --- */

  /**
   * « La vigie des modules » : le robot escalade la baie Projets et s'assoit
   * au coin d'une tuile de la RANGÉE DU HAUT (rien au-dessus à recouvrir),
   * jambes pendantes, avant de redescendre d'un saut.
   */
  private buildVigie(
    robot: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    const tiles = this.rectsOf(PERCH_SELECTORS.tile);
    if (tiles.length === 0) {
      return null;
    }
    const minTop = Math.min(...tiles.map((tile) => tile.rect.top));
    const topRow = tiles.filter((tile) => tile.rect.top - minTop < 8);
    const pick = topRow[Math.floor(Math.random() * topRow.length)];
    const moduleIndex = tiles.indexOf(pick) + 1;
    const bay = pick.el.closest('section');
    if (!bay) {
      return null;
    }
    const tileEl = pick.el;
    /* Assise au COIN de la tuile : elle reste lisible. */
    const corner = Math.random() < 0.5 ? 0.16 : 0.84;
    const point = (rect: DOMRect) => ({
      x: rect.left + rect.width * corner - robot.width / 2,
      y: this.elevationTo(rect.top + 6),
    });
    const underX = this.clampX(
      robot,
      pick.rect.left + pick.rect.width * corner - robot.width / 2
    );
    const line = this.pickLine(VIGIE_LINES, robot).replace(
      '{index}',
      String(moduleIndex).padStart(2, '0')
    );
    return {
      who: robot,
      steps: [
        { kind: 'walk', to: () => underX },
        { kind: 'pose', phase: 'crouch', ms: 250 },
        {
          kind: 'jump',
          to: () => {
            const rect = bay.getBoundingClientRect();
            return rect.height > 0
              ? { x: underX, y: this.elevationTo(rect.bottom) }
              : null;
          },
          height: 70,
          ms: 580,
        },
        {
          kind: 'jump',
          to: () => {
            if (!tileEl.isConnected) {
              return null;
            }
            const rect = tileEl.getBoundingClientRect();
            return rect.height > 0 ? point(rect) : null;
          },
          height: 90,
          ms: 660,
        },
        { kind: 'do', run: () => this.setPerchAnchor(tileEl, point) },
        {
          kind: 'do',
          run: () => {
            if (Math.random() < 0.5) {
              this.sayPerched(robot, line);
            }
          },
        },
        {
          kind: 'sit',
          phase: 'sit',
          ms: this.qaSit(6000 + Math.random() * 3000),
          follow: true,
        },
        {
          kind: 'jump',
          to: () => ({
            x: robot.x + (Math.random() < 0.5 ? -80 : 80),
            y: 0,
          }),
          height: 50,
          ms: 650,
        },
        { kind: 'pose', phase: 'crouch', ms: 140 },
      ],
    };
  }

  /**
   * « Le funambule » : traversée lente (12 px/s) d'un bord supérieur — la
   * console de lecture en compact, la carte active de l'effet cards en
   * diaporama — avec un faux pas scripté à mi-parcours pour le suspense.
   */
  private buildFunambule(
    robot: Character
  ): { who: Character; steps: PerchStep[] } | null {
    let info: { el: Element; rect: DOMRect } | null;
    if (this._viewMode.isCompact()) {
      info = this.firstRect(PERCH_SELECTORS.console);
    } else {
      const selector = PERCH_SELECTORS.activeCard[this._activeSlide];
      if (!selector) {
        return null;
      }
      info = this.firstRect(selector);
    }
    if (!info || info.rect.top < 60 || !this.rectInViewport(info.rect)) {
      return null;
    }
    const el = info.el;
    const topY = this.elevationTo(info.rect.top + 2);
    if (!this._isDesktop() && topY > window.innerHeight * MOBILE_JUMP_CAP) {
      return null;
    }
    /* Traversée limitée à ~110 px (12 px/s pendant 8-10 s au total). */
    const span = Math.min(info.rect.width - robot.width - 16, 110);
    if (span < 40) {
      return null;
    }
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft
      ? info.rect.left + 8
      : info.rect.right - robot.width - 8;
    const dir = fromLeft ? 1 : -1;
    const point = (rect: DOMRect) => ({
      x: this._perchWho?.x ?? startX,
      y: this.elevationTo(rect.top + 2),
    });
    return {
      who: robot,
      steps: [
        { kind: 'walk', to: () => this.clampX(robot, startX) },
        { kind: 'pose', phase: 'crouch', ms: 220 },
        {
          kind: 'jump',
          to: () => {
            if (!el.isConnected) {
              return null;
            }
            const rect = el.getBoundingClientRect();
            return rect.height > 0
              ? { x: startX, y: this.elevationTo(rect.top + 2) }
              : null;
          },
          height: 70,
          ms: 600,
        },
        { kind: 'do', run: () => this.setPerchAnchor(el, point) },
        {
          kind: 'traverse',
          to: () => startX + (dir * span) / 2,
          speed: TIGHTROPE_SPEED,
        },
        /* Faux pas scripté : rotation, bras qui battent, suspense. */
        { kind: 'do', run: () => this.sayPerched(robot, FUNAMBULE_LINE, 1700) },
        { kind: 'pose', phase: 'wobble', ms: 380 },
        {
          kind: 'traverse',
          to: () => startX + dir * span,
          speed: TIGHTROPE_SPEED,
        },
        {
          kind: 'jump',
          to: () => ({ x: robot.x + dir * 60, y: 0 }),
          height: 55,
          ms: 620,
        },
        { kind: 'pose', phase: 'crouch', ms: 130 },
      ],
    };
  }

  /**
   * « Trampoline de chips » : le blob escalade la colonne droite (toit E →
   * toit D) puis rebondit sur 3 chips voisines — les chips ne bougent
   * JAMAIS, l'illusion vient du squash du sprite. Descente : grande vrille
   * joyeuse, ou glissade du montant du cadre comète (1 fois sur 2).
   */
  private buildTrampoline(
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    const cells = this.rectsOf(PERCH_SELECTORS.cell)
      .filter((cell) => cell.rect.left > window.innerWidth / 2)
      .sort((a, b) => a.rect.top - b.rect.top);
    if (cells.length < 3) {
      return null;
    }
    const cellD = cells[1];
    const cellE = cells[2];
    const chips = this.rectsOf(PERCH_SELECTORS.chip)
      .filter((chip) => chip.el.closest('section') === cellD.el)
      .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);
    if (chips.length < 3) {
      return null;
    }
    const start = Math.floor(Math.random() * (chips.length - 2));
    const trio = chips.slice(start, start + 3);
    const steps: PerchStep[] = [
      {
        kind: 'walk',
        to: () => this.clampX(buddy, cellE.rect.left + 40),
        speedFactor: 1.3,
      },
      { kind: 'pose', phase: 'crouch', ms: 200 },
      {
        kind: 'jump',
        to: () => {
          const rect = cellE.el.getBoundingClientRect();
          return rect.height > 0
            ? {
                x: rect.left + 36 - buddy.width / 2,
                y: this.elevationTo(rect.top),
              }
            : null;
        },
        height: 95,
        ms: 600,
      },
      {
        kind: 'jump',
        to: () => {
          const rect = cellD.el.getBoundingClientRect();
          return rect.height > 0
            ? {
                x: rect.left + 30 - buddy.width / 2,
                y: this.elevationTo(rect.top),
              }
            : null;
        },
        height: 85,
        ms: 600,
      },
    ];
    trio.forEach((chip, index) => {
      steps.push(
        {
          kind: 'jump',
          to: () => {
            if (!chip.el.isConnected) {
              return null;
            }
            const rect = chip.el.getBoundingClientRect();
            return rect.height > 0
              ? {
                  x: rect.left + rect.width / 2 - buddy.width / 2,
                  y: this.elevationTo(rect.top + 2),
                }
              : null;
          },
          height: 55,
          ms: 420,
        },
        { kind: 'pose', phase: 'crouch', ms: 90 }
      );
      if (index === 2) {
        steps.push({
          kind: 'do',
          run: () => this.sayPerched(buddy, TRAMPOLINE_LINE),
        });
      }
    });
    if (Math.random() < 0.5) {
      /* Glissade du cadre : saut latéral vers le montant droit du cadre
         comète (x dérivé du viewport — le SVG du cadre n'est jamais lu),
         puis glissade de mât de pompier, étincelles du propre SVG du blob. */
      const framePad = Math.min(Math.max(24, window.innerWidth * 0.022), 44);
      steps.push(
        {
          kind: 'jump',
          to: () => ({
            x: window.innerWidth - framePad - buddy.width / 2,
            y: Math.max(buddy.y, 80),
          }),
          height: 45,
          ms: 480,
          phase: 'slide',
        },
        { kind: 'slide', ms: 0 },
        { kind: 'pose', phase: 'crouch', ms: 150 },
        {
          kind: 'do',
          run: () => {
            if (Math.random() < 0.5) {
              this.say(buddy, FRAME_SLIDE_LINE, 1500);
            }
          },
        },
        {
          kind: 'jump',
          to: () => ({ x: buddy.x - 60, y: 0 }),
          height: 35,
          ms: 400,
        }
      );
    } else {
      steps.push(
        {
          kind: 'jump',
          to: () => ({ x: buddy.x - 90, y: 0 }),
          height: 100,
          ms: 700,
          phase: 'twirl',
        },
        { kind: 'pose', phase: 'crouch', ms: 150 }
      );
    }
    return { who: buddy, steps };
  }

  /**
   * « L'attaché de presse » : le robot se pose sur le bord supérieur d'un
   * badge de contact et le vante, bras tendu, antenne clignotante. Le badge
   * reste cliquable autour du sprite.
   */
  private buildAttache(
    robot: Character
  ): { who: Character; steps: PerchStep[] } | null {
    const compact = this._viewMode.isCompact();
    if (!compact && this._activeSlide !== 0) {
      return null;
    }
    const badges = this.rectsOf(
      compact ? PERCH_SELECTORS.badgeCompact : PERCH_SELECTORS.badgeSlideshow
    );
    if (badges.length === 0) {
      return null;
    }
    const pick = badges[Math.floor(Math.random() * badges.length)];
    if (!this.rectInViewport(pick.rect)) {
      return null;
    }
    const el = pick.el;
    const href = (el as HTMLAnchorElement).href ?? '';
    const line = href.includes('github')
      ? PRESS_GITHUB_LINE
      : href.startsWith('mailto') || href.includes('contact@')
        ? PRESS_EMAIL_LINE
        : PRESS_DEFAULT_LINE;
    const topY = this.elevationTo(pick.rect.top + 2);
    if (!this._isDesktop() && topY > window.innerHeight * MOBILE_JUMP_CAP) {
      return null;
    }
    /* Pose au-dessus du bord supérieur : chevauchement de 2 px seulement. */
    const point = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2 - robot.width / 2,
      y: this.elevationTo(rect.top + 2),
    });
    return {
      who: robot,
      steps: [
        {
          kind: 'walk',
          to: () =>
            this.clampX(
              robot,
              pick.rect.left + pick.rect.width / 2 - robot.width / 2
            ),
        },
        { kind: 'pose', phase: 'crouch', ms: 180 },
        {
          kind: 'jump',
          to: () => {
            if (!el.isConnected) {
              return null;
            }
            const rect = el.getBoundingClientRect();
            return rect.height > 0 ? point(rect) : null;
          },
          height: 45,
          ms: 300,
        },
        { kind: 'do', run: () => this.setPerchAnchor(el, point) },
        { kind: 'do', run: () => this.sayPerched(robot, line) },
        {
          kind: 'sit',
          phase: 'point',
          ms: this.qaSit(4200 + Math.random() * 800),
          follow: true,
        },
        {
          kind: 'jump',
          to: () => ({ x: robot.x - 60, y: 0 }),
          height: 40,
          ms: 350,
        },
      ],
    };
  }

  /**
   * « Coucou console » : la console vient de changer de projet (fenêtre de
   * 8 s, MutationObserver passif) — le blob accourt, s'agrippe au bord et
   * seuls son crâne, ses oreilles et ses grands yeux dépassent pendant
   * qu'il « lit » la description.
   */
  private buildCoucou(
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (
      !this._viewMode.isCompact() ||
      performance.now() - this._consoleChangedAt > CONSOLE_PEEK_WINDOW
    ) {
      return null;
    }
    const info = this.firstRect(PERCH_SELECTORS.console);
    if (!info) {
      return null;
    }
    const el = info.el;
    /* Agrippé au bord : le bord supérieur coupe le dessin à hauteur du nez
       (le sprite z-40 passe devant la console, c'est voulu). */
    const point = (rect: DOMRect) => ({
      x: rect.left + rect.width * 0.28 - buddy.width / 2,
      y: this.elevationTo(rect.top + buddy.height * 0.55),
    });
    return {
      who: buddy,
      steps: [
        {
          kind: 'walk',
          to: () => this.clampX(buddy, info.rect.left + info.rect.width * 0.28),
          speedFactor: 1.6,
        },
        {
          kind: 'jump',
          to: () => {
            if (!el.isConnected) {
              return null;
            }
            const rect = el.getBoundingClientRect();
            return rect.height > 0 ? point(rect) : null;
          },
          height: 50,
          ms: 400,
        },
        { kind: 'do', run: () => this.setPerchAnchor(el, point) },
        {
          kind: 'do',
          run: () => {
            if (Math.random() < 1 / 3) {
              this.sayPerched(buddy, CONSOLE_PEEK_LINE, 2200);
            }
          },
        },
        {
          kind: 'sit',
          phase: 'sit',
          ms: this.qaSit(5000 + Math.random() * 2000),
          follow: true,
        },
        { kind: 'slide', ms: 350 },
        { kind: 'pose', phase: 'crouch', ms: 180 },
      ],
    };
  }

  /**
   * « La tuile récalcitrante » : le robot pousse une tuile de la rangée du
   * bas — inclinaison et effort simulés à 100 % sur le SPRITE, la tuile ne
   * reçoit NI classe NI transform. Échec théâtral garanti.
   */
  private buildTuile(
    robot: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    const tiles = this.rectsOf(PERCH_SELECTORS.tile);
    if (tiles.length === 0) {
      return null;
    }
    const maxTop = Math.max(...tiles.map((tile) => tile.rect.top));
    const bottomRow = tiles.filter((tile) => maxTop - tile.rect.top < 8);
    const pick = bottomRow[Math.floor(Math.random() * bottomRow.length)];
    const el = pick.el;
    const point = (rect: DOMRect) => ({
      x: rect.left - robot.width + 14,
      y: this.elevationTo(rect.bottom),
    });
    return {
      who: robot,
      steps: [
        {
          kind: 'walk',
          to: () => this.clampX(robot, pick.rect.left - robot.width + 14),
        },
        { kind: 'pose', phase: 'crouch', ms: 220 },
        {
          kind: 'jump',
          to: () => {
            if (!el.isConnected) {
              return null;
            }
            const rect = el.getBoundingClientRect();
            return rect.height > 0 ? point(rect) : null;
          },
          height: 80,
          ms: 620,
        },
        {
          kind: 'do',
          run: () => {
            /* Dos à la tuile : il regarde ailleurs pendant l'effort. */
            robot.dir = -1;
            this.applyDirection(robot);
          },
        },
        { kind: 'pose', phase: 'push', ms: 900 },
        { kind: 'pose', phase: 'crouch', ms: 160 },
        { kind: 'pose', phase: 'push', ms: 900 },
        { kind: 'pose', phase: 'crouch', ms: 160 },
        { kind: 'pose', phase: 'push', ms: 900 },
        { kind: 'pose', phase: 'stumble', ms: 800 },
        { kind: 'do', run: () => this.sayPerched(robot, TILE_PUSH_LINE) },
        { kind: 'pose', phase: 'rest', ms: 700 },
        {
          kind: 'jump',
          to: () => ({ x: robot.x - 70, y: 0 }),
          height: 45,
          ms: 600,
        },
        { kind: 'pose', phase: 'crouch', ms: 140 },
      ],
    };
  }

  /**
   * « Ma baie à moi » : le blob se love dans le 12e slot « libre » de la
   * grille projets (aria-hidden, non interactif : aucun conflit de clic)
   * pour une longue sieste.
   */
  private buildBaie(
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    const dot = document.querySelector(PERCH_SELECTORS.slotDot);
    const slot = dot?.closest('div') ?? null;
    if (!slot) {
      return null;
    }
    const slotRect = slot.getBoundingClientRect();
    if (slotRect.width === 0 || slotRect.height === 0) {
      return null;
    }
    const consoleInfo = this.firstRect(PERCH_SELECTORS.console);
    const point = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2 - buddy.width / 2,
      y: this.elevationTo(rect.bottom - 6),
    });
    const steps: PerchStep[] = [
      {
        kind: 'walk',
        to: () =>
          this.clampX(
            buddy,
            slotRect.left + slotRect.width / 2 - buddy.width / 2
          ),
      },
      { kind: 'pose', phase: 'crouch', ms: 200 },
    ];
    if (consoleInfo) {
      /* Marchepied : le bord de la console, puis le slot. */
      steps.push({
        kind: 'jump',
        to: () => {
          const rect = consoleInfo.el.getBoundingClientRect();
          return rect.height > 0
            ? { x: buddy.x, y: this.elevationTo(rect.top) }
            : null;
        },
        height: 60,
        ms: 500,
      });
    }
    steps.push(
      {
        kind: 'jump',
        to: () => {
          if (!slot.isConnected) {
            return null;
          }
          const rect = slot.getBoundingClientRect();
          return rect.height > 0 ? point(rect) : null;
        },
        height: 70,
        ms: 550,
      },
      { kind: 'do', run: () => this.setPerchAnchor(slot, point) },
      { kind: 'do', run: () => this.sayPerched(buddy, NEST_LINE) },
      {
        kind: 'sit',
        phase: 'nest',
        ms: this.qaSit(10000 + Math.random() * 4000),
        follow: true,
      },
      /* Réveil : étirement, puis saut au sol. */
      { kind: 'pose', phase: 'excited', ms: 600 },
      {
        kind: 'jump',
        to: () => ({ x: buddy.x + 80, y: 0 }),
        height: 60,
        ms: 600,
      },
      { kind: 'pose', phase: 'crouch', ms: 140 }
    );
    return { who: buddy, steps };
  }

  /* --- Comportements — mode diaporama --- */

  /**
   * « Le sommet du monde » : slide profil uniquement — le blob conquiert le
   * sommet de la photo ronde, puis glisse le long de la COURBE du cercle
   * avant d'être éjecté en parabole (réception stumble, puis fou rire).
   */
  private buildSommet(
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (
      this._viewMode.isCompact() ||
      this._activeSlide !== 0 ||
      !this._isDesktop()
    ) {
      return null;
    }
    const info = this.firstRect(PERCH_SELECTORS.photo);
    if (!info || info.rect.top < 40 || !this.rectInViewport(info.rect)) {
      return null;
    }
    const el = info.el;
    const point = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2 - buddy.width / 2,
      y: this.elevationTo(rect.top + 4),
    });
    return {
      who: buddy,
      steps: [
        {
          kind: 'walk',
          to: () =>
            this.clampX(
              buddy,
              info.rect.left + info.rect.width / 2 - buddy.width / 2
            ),
        },
        { kind: 'pose', phase: 'crouch', ms: 250 },
        {
          kind: 'jump',
          to: () => {
            if (!el.isConnected) {
              return null;
            }
            const rect = el.getBoundingClientRect();
            return rect.height > 0
              ? { x: buddy.x, y: this.elevationTo(rect.bottom) }
              : null;
          },
          height: 80,
          ms: 600,
        },
        {
          kind: 'jump',
          to: () => {
            if (!el.isConnected) {
              return null;
            }
            const rect = el.getBoundingClientRect();
            return rect.height > 0 ? point(rect) : null;
          },
          height: 110,
          ms: 700,
        },
        { kind: 'do', run: () => this.setPerchAnchor(el, point) },
        { kind: 'do', run: () => this.sayPerched(buddy, SUMMIT_LINE) },
        {
          kind: 'sit',
          phase: 'sit',
          ms: this.qaSit(5000 + Math.random() * 2000),
          follow: true,
        },
        /* Descente signature : glissade le long de la courbe du cercle… */
        { kind: 'orbit', ms: 600 },
        /* …puis éjection en parabole. */
        {
          kind: 'jump',
          to: () => ({
            x: buddy.x + (buddy.dir === 1 ? 110 : -110),
            y: 0,
          }),
          height: 70,
          ms: 550,
        },
        { kind: 'pose', phase: 'stumble', ms: 700 },
        { kind: 'pose', phase: 'laugh', ms: 1300 },
      ],
    };
  }

  /* ------------------------------------------------------------------ */
  /* Comportements — nouvelle troupe autonome (8 numéros)                */
  /* Mêmes règles d'or : monde INTOUCHABLE (lecture seule des rects au    */
  /* déclenchement, re-mesure ponctuelle de la seule ancre active),       */
  /* toutes les illusions physiques vivent sur les sprites.               */
  /* ------------------------------------------------------------------ */

  /**
   * « Les marches du diplôme » : le blob saute sur le bord supérieur de la
   * cellule Formation, redescend sur le PREMIER nœud de la timeline et
   * gravit les nœuds comme des marches (réutilisation exacte du motif trio
   * du trampoline). Sur le nœud Master (halo), pose fière + bulle, puis
   * 50/50 : toboggan le long du fil pointillé (traverse en phase 'slide',
   * 90 px/s) éjecté en parabole, ou grande vrille directe au sol. ~9-11 s.
   */
  private buildMarches(
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    /* Le rect d'une <line> SVG est de hauteur nulle : la géométrie du fil
       est portée par son wrapper <svg> (h-0.5, pleine largeur), le
       sélecteur du registre reste l'unique point d'entrée. */
    const lineEl = document.querySelector(PERCH_SELECTORS.timeline);
    const railEl = lineEl?.closest('svg') ?? null;
    const cellE = railEl?.closest('section') ?? null;
    if (!railEl || !cellE) {
      return null;
    }
    const railRect = railEl.getBoundingClientRect();
    const cellRect = cellE.getBoundingClientRect();
    if (
      railRect.width === 0 ||
      cellRect.height === 0 ||
      !this.rectInViewport(cellRect)
    ) {
      return null;
    }
    /* Les nœuds ronds (h-4) posés sur le fil, triés de gauche à droite —
       le dernier est le Master au halo violet. */
    const nodes: { el: Element; rect: DOMRect }[] = [];
    cellE.querySelectorAll('.group > span.rounded-full').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        nodes.push({ el, rect });
      }
    });
    nodes.sort((a, b) => a.rect.left - b.rect.left);
    if (nodes.length < 2) {
      return null;
    }
    const nodePoint = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2 - buddy.width / 2,
      y: this.elevationTo(rect.top + 2),
    });
    const underX = this.clampX(
      buddy,
      nodes[0].rect.left + nodes[0].rect.width / 2 - buddy.width / 2
    );
    const steps: PerchStep[] = [
      { kind: 'walk', to: () => underX, speedFactor: 1.3 },
      { kind: 'pose', phase: 'crouch', ms: 200 },
      /* Sur le bord supérieur de la cellule Formation… */
      {
        kind: 'jump',
        to: () => {
          const rect = cellE.getBoundingClientRect();
          return rect.height > 0
            ? { x: underX, y: this.elevationTo(rect.top) }
            : null;
        },
        height: 90,
        ms: 620,
      },
      { kind: 'pose', phase: 'crouch', ms: 120 },
    ];
    /* …puis redescente sur le premier nœud et ascension marche à marche,
       un petit saut par nœud (rects frais à chaque étape, comme partout). */
    nodes.forEach((node, index) => {
      steps.push({
        kind: 'jump',
        to: () => {
          if (!node.el.isConnected) {
            return null;
          }
          const rect = node.el.getBoundingClientRect();
          return rect.height > 0 ? nodePoint(rect) : null;
        },
        height: 40,
        ms: 380,
      });
      if (index < nodes.length - 1) {
        steps.push({ kind: 'pose', phase: 'crouch', ms: 120 });
      }
    });
    /* Sur le nœud Master : pose fière et bulle dédiée. */
    steps.push(
      { kind: 'do', run: () => this.sayPerched(buddy, MARCHES_LINE) },
      { kind: 'pose', phase: 'cheer', ms: 900 }
    );
    if (Math.random() < 0.5) {
      /* Toboggan de la ligne de vie : le suivi d'ancre pose le blob sur le
         fil pointillé, glissade jusqu'à son départ, éjection en parabole. */
      const tlPoint = (rect: DOMRect) => ({
        x: this._perchWho?.x ?? buddy.x,
        y: this.elevationTo(rect.top),
      });
      steps.push(
        { kind: 'do', run: () => this.setPerchAnchor(railEl, tlPoint) },
        {
          kind: 'do',
          run: () => {
            if (Math.random() < 0.5) {
              this.sayPerched(buddy, MARCHES_SLIDE_LINE, 1600);
            }
          },
        },
        {
          kind: 'traverse',
          to: () => {
            if (!railEl.isConnected) {
              return null;
            }
            const rect = railEl.getBoundingClientRect();
            return rect.width > 0 ? rect.left + 8 : null;
          },
          speed: 90,
          phase: 'slide',
        },
        {
          kind: 'jump',
          to: () => ({ x: buddy.x - 70, y: 0 }),
          height: 60,
          ms: 550,
        },
        { kind: 'pose', phase: 'crouch', ms: 150 }
      );
    } else {
      steps.push(
        {
          kind: 'jump',
          to: () => ({ x: buddy.x - 90, y: 0 }),
          height: 110,
          ms: 700,
          phase: 'twirl',
        },
        { kind: 'pose', phase: 'crouch', ms: 150 }
      );
    }
    return { who: buddy, steps };
  }

  /**
   * « Cache-cache sur le pont » : le blob file (speedFactor 1.8) se tasser
   * (classe is-hiding : recroquevillé CONTRE l'élément, jamais masqué par
   * lui — les sprites sont z-40) dans l'une de trois cachettes tirées au
   * sort, pendant que le robot escorté le cherche en marchant, avec deux
   * arrêts scriptés. Toutes les positions sont mémorisées au déclenchement
   * — aucune lecture DOM pendant la recherche, seule la cachette est
   * re-mesurée via l'ancre. ~10-12 s, numéro rare et précieux.
   */
  private buildCachette(
    robot: Character,
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    /* Les trois cachettes candidates (une seule lecture, au déclenchement) :
       pied du 12e slot libre, angle bas de la console, pied de la cellule E. */
    const spots: {
      el: Element;
      rect: DOMRect;
      point: (rect: DOMRect) => { x: number; y: number };
    }[] = [];
    const slot =
      document.querySelector(PERCH_SELECTORS.slotDot)?.closest('div') ?? null;
    if (slot) {
      const rect = slot.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        spots.push({
          el: slot,
          rect,
          point: (r) => ({
            x: r.left + r.width / 2 - buddy.width / 2,
            y: this.elevationTo(r.bottom - 4),
          }),
        });
      }
    }
    const consoleInfo = this.firstRect(PERCH_SELECTORS.console);
    if (consoleInfo) {
      spots.push({
        el: consoleInfo.el,
        rect: consoleInfo.rect,
        point: (r) => ({ x: r.left + 8, y: this.elevationTo(r.bottom - 4) }),
      });
    }
    const cellE =
      document.querySelector(PERCH_SELECTORS.timeline)?.closest('section') ??
      null;
    if (cellE) {
      const rect = cellE.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        spots.push({
          el: cellE,
          rect,
          point: (r) => ({ x: r.left + 12, y: this.elevationTo(r.bottom - 4) }),
        });
      }
    }
    if (spots.length === 0) {
      return null;
    }
    const spot = spots[Math.floor(Math.random() * spots.length)];
    const point = spot.point;
    const hideX = this.clampX(buddy, point(spot.rect).x);
    const hideCenter = hideX + buddy.width / 2;
    /* Parcours du robot, mémorisé : il approche par son côté du pont et
       s'arrête à ~90 px de la cachette (deux haltes intermédiaires). */
    const robotCenter = this.centerOf(robot);
    const fromLeft = robotCenter <= hideCenter;
    const endCenter = hideCenter + (fromLeft ? -90 : 90);
    const stop1 = robotCenter + (endCenter - robotCenter) * 0.45;
    const stop2 = robotCenter + (endCenter - robotCenter) * 0.8;
    /* Cadence des jambes : chaque tronçon doit tenir dans sa fenêtre —
       un léger retard fait partie du jeu (il cherche, il ne course pas). */
    const legFactor = (dist: number, windowMs: number): number =>
      Math.min(
        4,
        Math.max(0.6, Math.abs(dist) / ((ROBOT_SPEED * windowMs) / 1000))
      );
    const w1 = this.qaSit(2200);
    const w2 = this.qaSit(2000);
    const w3 = this.qaSit(2000);
    const steps: PerchStep[] = [
      {
        kind: 'do',
        run: () => {
          this._perchEscort = true;
          this.setPhase(robot, 'look', 1400);
        },
      },
      { kind: 'walk', to: () => hideX, speedFactor: 1.8 },
      {
        kind: 'jump',
        to: () => {
          if (!spot.el.isConnected) {
            return null;
          }
          const rect = spot.el.getBoundingClientRect();
          return rect.height > 0 ? point(rect) : null;
        },
        height: 40,
        ms: 420,
      },
      {
        kind: 'do',
        run: () => {
          this.setPerchAnchor(spot.el, point);
          buddy.el.classList.add('is-hiding');
        },
      },
      /* Le robot part en recherche : marche lente, deux arrêts scriptés. */
      {
        kind: 'do',
        run: () => {
          this.walkTowards(robot, stop1);
          robot.speedFactor = legFactor(stop1 - robotCenter, w1);
        },
      },
      { kind: 'sit', phase: 'rest', ms: w1, follow: true },
      {
        kind: 'do',
        run: () => {
          this.setPhase(robot, 'look', 1100);
          this.say(robot, CACHETTE_ROBOT_LINE);
        },
      },
      { kind: 'sit', phase: 'rest', ms: this.qaSit(1200), follow: true },
      {
        kind: 'do',
        run: () => {
          this.walkTowards(robot, stop2);
          robot.speedFactor = legFactor(stop2 - stop1, w2);
        },
      },
      { kind: 'sit', phase: 'rest', ms: w2, follow: true },
      { kind: 'do', run: () => this.setPhase(robot, 'look', 1100) },
      { kind: 'sit', phase: 'rest', ms: this.qaSit(1100), follow: true },
      {
        kind: 'do',
        run: () => {
          this.walkTowards(robot, endCenter);
          robot.speedFactor = legFactor(endCenter - stop2, w3);
        },
      },
      { kind: 'sit', phase: 'rest', ms: w3, follow: true },
      /* Découvert ! Le blob bondit de sa cachette vers le chercheur. */
      { kind: 'do', run: () => buddy.el.classList.remove('is-hiding') },
      {
        kind: 'jump',
        to: () => ({ x: buddy.x + (fromLeft ? -40 : 40), y: 0 }),
        height: 60,
        ms: 450,
        phase: 'excited',
      },
      {
        kind: 'do',
        run: () => {
          this.faceEachOther(robot, buddy);
          this.say(buddy, CACHETTE_BUDDY_LINE);
          this.setPhase(robot, 'laugh', 1500);
        },
      },
      { kind: 'pose', phase: 'laugh', ms: 1500 },
    ];
    return { who: buddy, steps };
  }

  /**
   * « Le picoreur de caret » : le blob accourt sous la console, s'agrippe
   * au bord comme dans « Coucou console » mais décalé sous le caret
   * clignotant ▍, puis picore comme un oiseau — le squash du sprite simule
   * le coup de bec, le caret n'est évidemment jamais touché. Toujours
   * disponible en compact (aucune fenêtre de changement récent). ~6 s.
   */
  private buildPicoreur(
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    const caretInfo = this.firstRect(PERCH_SELECTORS.caret);
    const consoleEl = caretInfo?.el.closest('#project-console') ?? null;
    if (!caretInfo || !consoleEl) {
      return null;
    }
    const caretEl = caretInfo.el;
    /* Assise : x suit le caret, y le bord supérieur de la console (deux
       lectures par re-mesure de 300 ms — jamais dans la boucle chaude). */
    const point = (rect: DOMRect) => ({
      x: rect.left - buddy.width / 2,
      y: this.elevationTo(
        consoleEl.getBoundingClientRect().top + buddy.height * 0.55
      ),
    });
    const steps: PerchStep[] = [
      {
        kind: 'walk',
        to: () => this.clampX(buddy, caretInfo.rect.left - buddy.width / 2),
        speedFactor: 1.6,
      },
      {
        kind: 'jump',
        to: () => {
          if (!caretEl.isConnected) {
            return null;
          }
          const rect = caretEl.getBoundingClientRect();
          return rect.width > 0 ? point(rect) : null;
        },
        height: 50,
        ms: 400,
      },
      { kind: 'do', run: () => this.setPerchAnchor(caretEl, point) },
      {
        kind: 'do',
        run: () => {
          if (Math.random() < 1 / 3) {
            this.sayPerched(buddy, PICOREUR_LINE, 2200);
          }
        },
      },
      { kind: 'sit', phase: 'rest', ms: this.qaSit(700), follow: true },
    ];
    /* Trois coups de bec : squash 140 ms, redressement 260 ms. */
    for (let i = 0; i < 3; i += 1) {
      steps.push(
        { kind: 'pose', phase: 'crouch', ms: 140 },
        { kind: 'pose', phase: 'rest', ms: 260 }
      );
    }
    steps.push(
      { kind: 'slide', ms: 350 },
      { kind: 'pose', phase: 'crouch', ms: 160 }
    );
    return { who: buddy, steps };
  }

  /**
   * « L'emprunt de chip » : le blob « décolle » une chip de compétences —
   * la vraie chip ne bouge JAMAIS et reste visible : une pilule SIMULÉE
   * (.carried-chip, classe is-carrying) s'allume au-dessus de sa tête —
   * l'apporte au robot spectateur, puis la rapporte scrupuleusement à sa
   * place (chip re-mesurée ; disparue : chute contrôlée, la classe est
   * retirée sur tous les chemins de sortie). ~13-15 s, le plus long des
   * nouveaux numéros.
   */
  private buildChip(
    robot: Character,
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    const cells = this.rectsOf(PERCH_SELECTORS.cell)
      .filter((cell) => cell.rect.left > window.innerWidth / 2)
      .sort((a, b) => a.rect.top - b.rect.top);
    if (cells.length < 3) {
      return null;
    }
    const cellD = cells[1];
    const cellE = cells[2];
    const chips = this.rectsOf(PERCH_SELECTORS.chip).filter(
      (chip) => chip.el.closest('section') === cellD.el
    );
    if (chips.length === 0) {
      return null;
    }
    const chip = chips[Math.floor(Math.random() * chips.length)];
    const chipEl = chip.el;
    const chipPoint = (rect: DOMRect) => ({
      x: rect.left + rect.width / 2 - buddy.width / 2,
      y: this.elevationTo(rect.top + 2),
    });
    const climbX = this.clampX(buddy, cellE.rect.left + 40);
    /* Montée par la colonne droite (toit E → toit D → chip), même échelle
       que le trampoline — réutilisée telle quelle pour le trajet retour. */
    const climb = (): PerchStep[] => [
      { kind: 'walk', to: () => climbX, speedFactor: 1.4 },
      { kind: 'pose', phase: 'crouch', ms: 200 },
      {
        kind: 'jump',
        to: () => {
          const rect = cellE.el.getBoundingClientRect();
          return rect.height > 0
            ? {
                x: rect.left + 36 - buddy.width / 2,
                y: this.elevationTo(rect.top),
              }
            : null;
        },
        height: 95,
        ms: 600,
      },
      {
        kind: 'jump',
        to: () => {
          const rect = cellD.el.getBoundingClientRect();
          return rect.height > 0
            ? {
                x: rect.left + 30 - buddy.width / 2,
                y: this.elevationTo(rect.top),
              }
            : null;
        },
        height: 85,
        ms: 600,
      },
      {
        kind: 'jump',
        to: () => {
          if (!chipEl.isConnected) {
            return null;
          }
          const rect = chipEl.getBoundingClientRect();
          return rect.height > 0 ? chipPoint(rect) : null;
        },
        height: 55,
        ms: 420,
      },
      { kind: 'pose', phase: 'crouch', ms: 200 },
    ];
    const steps: PerchStep[] = [
      ...climb(),
      /* « Décollage » : la pilule simulée s'allume au-dessus de la tête. */
      {
        kind: 'do',
        run: () => {
          buddy.el.classList.add('is-carrying');
          this.sayPerched(buddy, CHIP_TAKE_LINE);
        },
      },
      { kind: 'pose', phase: 'excited', ms: 500 },
      {
        kind: 'jump',
        to: () => ({ x: buddy.x - 80, y: 0 }),
        height: 100,
        ms: 700,
        phase: 'twirl',
      },
      { kind: 'pose', phase: 'crouch', ms: 150 },
      /* Trottine jusqu'au robot pour montrer son butin. */
      {
        kind: 'walk',
        to: () =>
          robot.x +
          (robot.x >= buddy.x ? -(buddy.width + 14) : robot.width + 14),
        speedFactor: 1.5,
      },
      { kind: 'do', run: () => this.faceEachOther(robot, buddy) },
      { kind: 'pose', phase: 'excited', ms: 1200 },
      {
        kind: 'do',
        run: () => {
          this.setPhase(robot, 'look', 2600);
          this.say(robot, CHIP_ROBOT_LINE);
        },
      },
      { kind: 'pose', phase: 'rest', ms: 1500 },
      /* …et la rapporte à sa place, comme promis. */
      ...climb(),
      {
        kind: 'do',
        run: () => {
          buddy.el.classList.remove('is-carrying');
          if (Math.random() < 0.5) {
            this.sayPerched(buddy, CHIP_RETURN_LINE, 1800);
          }
        },
      },
      {
        kind: 'jump',
        to: () => ({ x: buddy.x - 90, y: 0 }),
        height: 90,
        ms: 650,
        phase: 'twirl',
      },
      { kind: 'pose', phase: 'crouch', ms: 140 },
    ];
    return { who: buddy, steps };
  }

  /**
   * « La visite guidée » : le grand numéro « attaché de presse itinérant »,
   * entièrement AU SOL (walk + 'point' + bulles — aucun vol : disponible
   * partout, très robuste). Le robot guide, le blob escorté suit et
   * s'émerveille à ~70 px derrière. Trois arrêts en compact (identité,
   * baie projets, badges), deux en diaporama selon la slide active. Les x
   * d'arrêt sont lus au DÉMARRAGE (un seul scan), pas re-suivis : au sol,
   * une dérive de quelques px est invisible. Bridée à ~1 visite / 2 min.
   */
  private buildVisite(
    robot: Character,
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    const now = performance.now();
    if (now - this._lastGuidedTourAt < this.qaCooldown(GUIDED_TOUR_COOLDOWN)) {
      return null;
    }
    /* Un seul scan : centres d'arrêt + répliques, selon le décor. */
    const stops: { center: number; line: string }[] = [];
    if (this._viewMode.isCompact()) {
      const cellsLeft = this.rectsOf(PERCH_SELECTORS.cell)
        .filter((cell) => cell.rect.left < window.innerWidth / 2)
        .sort((a, b) => a.rect.top - b.rect.top);
      const contacts = this.firstRect(PERCH_SELECTORS.contacts);
      if (cellsLeft.length < 2 || !contacts) {
        return null;
      }
      stops.push(
        {
          center: cellsLeft[0].rect.left + cellsLeft[0].rect.width / 2,
          line: TOUR_COMPACT_LINES[0],
        },
        {
          center: cellsLeft[1].rect.left + cellsLeft[1].rect.width / 2,
          line: TOUR_COMPACT_LINES[1],
        },
        {
          center: contacts.rect.left + contacts.rect.width / 2,
          line: TOUR_COMPACT_LINES[2],
        }
      );
    } else if (this._activeSlide === 0) {
      const photo = this.firstRect(PERCH_SELECTORS.photo);
      const badges = this.rectsOf(PERCH_SELECTORS.badgeSlideshow);
      if (!photo || badges.length === 0) {
        return null;
      }
      const badgesCenter =
        badges.reduce(
          (sum, badge) => sum + badge.rect.left + badge.rect.width / 2,
          0
        ) / badges.length;
      stops.push(
        {
          center: photo.rect.left + photo.rect.width / 2,
          line: TOUR_PHOTO_LINE,
        },
        { center: badgesCenter, line: TOUR_BADGES_LINE }
      );
    } else {
      const selector = PERCH_SELECTORS.activeCard[this._activeSlide];
      const card = selector ? this.firstRect(selector) : null;
      if (!card) {
        return null;
      }
      const center = card.rect.left + card.rect.width / 2;
      /* Deuxième arrêt : un pas de côté, vers le centre de l'écran. */
      const aside = center + (center < window.innerWidth / 2 ? 120 : -120);
      stops.push(
        { center, line: TOUR_CARD_LINE },
        { center: aside, line: TOUR_PILE_LINE }
      );
    }
    this._lastGuidedTourAt = now;
    const steps: PerchStep[] = [
      {
        kind: 'do',
        run: () => {
          this._perchEscort = true;
        },
      },
    ];
    let previous = this.centerOf(robot);
    for (const stop of stops) {
      const travelDir: 1 | -1 = stop.center >= previous ? 1 : -1;
      const followCenter = stop.center - travelDir * 70;
      steps.push(
        { kind: 'do', run: () => this.walkTowards(buddy, followCenter) },
        {
          kind: 'walk',
          to: () => this.clampX(robot, stop.center - robot.width / 2),
          speedFactor: 1.3,
        },
        {
          kind: 'do',
          run: () => {
            /* Le guide se tourne vers son public avant de pointer. */
            robot.dir = this.centerOf(buddy) >= this.centerOf(robot) ? 1 : -1;
            this.applyDirection(robot);
            this.sayPerched(robot, stop.line);
          },
        },
        { kind: 'pose', phase: 'point', ms: 2600 },
        { kind: 'do', run: () => this.setPhase(buddy, 'excited', 900) },
        { kind: 'pose', phase: 'rest', ms: 500 }
      );
      previous = stop.center;
    }
    return { who: robot, steps };
  }

  /**
   * « Le réparateur du cadre-comète » : ZÉRO lecture DOM — le x du montant
   * est DÉRIVÉ du viewport, comme la glissade existante du trampoline
   * (framePad = clamp(24, 2.2vw, 44)). Le robot soude le coin bas du cadre
   * (ses propres étincelles, classe is-sparking, découplée de is-cheering),
   * recule, inspecte, savoure. Variante 1/4 : côté gauche. ~7 s — le
   * comportement le plus robuste du lot.
   */
  private buildRepare(
    robot: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    const framePad = Math.min(Math.max(24, window.innerWidth * 0.022), 44);
    const leftSide = Math.random() < 0.25;
    const dir: 1 | -1 = leftSide ? -1 : 1;
    const spotX = this.clampX(
      robot,
      leftSide ? framePad : window.innerWidth - framePad - robot.width
    );
    const faceFrame = () => {
      robot.dir = dir;
      this.applyDirection(robot);
    };
    return {
      who: robot,
      steps: [
        { kind: 'walk', to: () => spotX, speedFactor: 1.3 },
        {
          kind: 'do',
          run: () => {
            /* Face au montant, étincelles de soudure sur son propre SVG. */
            faceFrame();
            robot.el.classList.add('is-sparking');
          },
        },
        { kind: 'pose', phase: 'push', ms: 800 },
        { kind: 'pose', phase: 'crouch', ms: 150 },
        { kind: 'pose', phase: 'push', ms: 800 },
        { kind: 'pose', phase: 'crouch', ms: 150 },
        { kind: 'do', run: () => robot.el.classList.remove('is-sparking') },
        /* Petit pas de recul, puis inspection satisfaite du travail. */
        {
          kind: 'jump',
          to: () => ({ x: robot.x - dir * 34, y: 0 }),
          height: 14,
          ms: 300,
        },
        { kind: 'do', run: faceFrame },
        { kind: 'pose', phase: 'look', ms: 900 },
        { kind: 'do', run: () => this.say(robot, REPARE_LINE) },
        { kind: 'pose', phase: 'rest', ms: 1300 },
      ],
    };
  }

  /**
   * « Le rodéo du deck » : slides à effet cards (1, 3, 4), ordinateur
   * uniquement. Le blob s'assoit au COIN de la carte active (15 % ou 85 %
   * de la largeur : le contenu reste lisible, même règle que la vigie,
   * follow:true absorbe le hover:-translate-y-1) et la « chevauche » —
   * deux ruades scriptées en 'wobble'. Si le visiteur change de carte,
   * l'invalidation EXISTANTE du swiperslidechange fait tomber le perché :
   * la chute devient le clou du spectacle. Sortie en vrille. ~8 s.
   */
  private buildRodeo(
    buddy: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (this._viewMode.isCompact() || !this._isDesktop()) {
      return null;
    }
    const selector = PERCH_SELECTORS.activeCard[this._activeSlide];
    if (!selector) {
      return null;
    }
    const info = this.firstRect(selector);
    if (!info || info.rect.top < 60 || !this.rectInViewport(info.rect)) {
      return null;
    }
    const el = info.el;
    const corner = Math.random() < 0.5 ? 0.15 : 0.85;
    const point = (rect: DOMRect) => ({
      x: rect.left + rect.width * corner - buddy.width / 2,
      y: this.elevationTo(rect.top + 4),
    });
    return {
      who: buddy,
      steps: [
        {
          kind: 'walk',
          to: () =>
            this.clampX(
              buddy,
              info.rect.left + info.rect.width * corner - buddy.width / 2
            ),
        },
        { kind: 'pose', phase: 'crouch', ms: 220 },
        {
          kind: 'jump',
          to: () => {
            if (!el.isConnected) {
              return null;
            }
            const rect = el.getBoundingClientRect();
            return rect.height > 0 ? point(rect) : null;
          },
          height: 80,
          ms: 620,
        },
        { kind: 'do', run: () => this.setPerchAnchor(el, point) },
        {
          kind: 'do',
          run: () => {
            if (Math.random() < 0.5) {
              this.sayPerched(buddy, RODEO_LINE);
            }
          },
        },
        { kind: 'sit', phase: 'sit', ms: this.qaSit(1800), follow: true },
        /* La carte « rue » : deux ruades scriptées, espacées de ~2 s. */
        { kind: 'pose', phase: 'wobble', ms: 400 },
        { kind: 'sit', phase: 'sit', ms: this.qaSit(1900), follow: true },
        { kind: 'pose', phase: 'wobble', ms: 400 },
        { kind: 'sit', phase: 'sit', ms: this.qaSit(1300), follow: true },
        {
          kind: 'jump',
          to: () => ({ x: buddy.x + (corner < 0.5 ? -90 : 90), y: 0 }),
          height: 90,
          ms: 650,
          phase: 'twirl',
        },
        { kind: 'pose', phase: 'crouch', ms: 150 },
      ],
    };
  }

  /**
   * « L'inspecteur du HUD » : le readout de viewport de la barre de statut
   * est au ras du sol — AUCUN saut. Le robot vient se pencher dessous,
   * tapote (squash du sprite, le HUD n'est jamais touché), pointe et
   * s'émerveille — variante si un resize date de moins de 10 s. ~5 s, le
   * plus court des nouveaux : parfait bouche-trou de la cadence rapide.
   */
  private buildHud(
    robot: Character
  ): { who: Character; steps: PerchStep[] } | null {
    if (!this._viewMode.isCompact()) {
      return null;
    }
    const info = this.firstRect(PERCH_SELECTORS.hud);
    if (!info) {
      return null;
    }
    const line =
      performance.now() - this._lastResizeAt < HUD_RESIZE_WINDOW
        ? HUD_RESIZE_LINE
        : HUD_LINE;
    const underX = this.clampX(
      robot,
      info.rect.left + info.rect.width / 2 - robot.width / 2
    );
    return {
      who: robot,
      steps: [
        { kind: 'walk', to: () => underX, speedFactor: 1.2 },
        { kind: 'pose', phase: 'look', ms: 1400 },
        /* Deux petites tapes sur le readout. */
        { kind: 'pose', phase: 'crouch', ms: 150 },
        { kind: 'pose', phase: 'rest', ms: 120 },
        { kind: 'pose', phase: 'crouch', ms: 150 },
        { kind: 'do', run: () => this.say(robot, line) },
        { kind: 'pose', phase: 'point', ms: 2200 },
      ],
    };
  }

  /* --- Chorégraphie duo « La courte échelle » (mode compact) --- */

  /**
   * Le robot se campe sous la colonne droite, le blob rebondit sur sa tête
   * puis grimpe toit E → toit D → la rangée d'expérience ACTIVE (déjà
   * dépliée — on ne déclenche JAMAIS de mouseenter synthétique sur l'UI).
   * Branchée sur le compteur duo (1 chorégraphie sur 4 en compact).
   */
  private startCourteEchelle(): boolean {
    const robot = this._robot;
    const buddy = this._buddy;
    if (
      !robot ||
      !buddy ||
      this._scene !== 'free' ||
      !this._viewMode.isCompact()
    ) {
      return false;
    }
    const cells = this.rectsOf(PERCH_SELECTORS.cell)
      .filter((cell) => cell.rect.left > window.innerWidth / 2)
      .sort((a, b) => a.rect.top - b.rect.top);
    if (cells.length < 3) {
      return false;
    }
    const cellD = cells[1];
    const cellE = cells[2];
    const rowInfo = this.firstRect(PERCH_SELECTORS.activeRow);
    if (!rowInfo) {
      return false;
    }
    const rowEl = rowInfo.el;
    const baseX = Math.min(cellE.rect.left + 70, window.innerWidth - 170);
    const rowPoint = (rect: DOMRect) => ({
      x: rect.left + Math.min(56, rect.width * 0.2) - buddy.width / 2,
      y: this.elevationTo(rect.top + 2),
    });
    const steps: PerchStep[] = [
      {
        kind: 'do',
        run: () => {
          this._perchEscort = true;
          this.walkTowards(robot, baseX + 20);
        },
      },
      { kind: 'walk', to: () => baseX - 40, speedFactor: 1.25 },
      /* Le robot finit de se camper, bras en étrier. */
      { kind: 'pose', phase: 'rest', ms: 700 },
      { kind: 'do', run: () => this.setPhase(robot, 'brace', 9000) },
      { kind: 'pose', phase: 'crouch', ms: 250 },
      {
        kind: 'jump',
        to: () => ({
          x: robot.x + robot.width / 2 - buddy.width / 2,
          y: robot.height - 8,
        }),
        height: 40,
        ms: 360,
      },
      {
        kind: 'do',
        run: () => this.setPhase(robot, 'crouch', 140),
      },
      {
        kind: 'jump',
        to: () => {
          const rect = cellE.el.getBoundingClientRect();
          return rect.height > 0
            ? {
                x: rect.left + 44 - buddy.width / 2,
                y: this.elevationTo(rect.top),
              }
            : null;
        },
        height: 95,
        ms: 600,
      },
      { kind: 'do', run: () => this.setPhase(robot, 'brace', 8000) },
      {
        kind: 'jump',
        to: () => {
          const rect = cellD.el.getBoundingClientRect();
          return rect.height > 0
            ? {
                x: rect.left + 34 - buddy.width / 2,
                y: this.elevationTo(rect.top),
              }
            : null;
        },
        height: 85,
        ms: 600,
      },
      {
        kind: 'jump',
        to: () => {
          if (!rowEl.isConnected) {
            return null;
          }
          const rect = rowEl.getBoundingClientRect();
          return rect.height > 0 ? rowPoint(rect) : null;
        },
        height: 80,
        ms: 620,
      },
      { kind: 'do', run: () => this.setPerchAnchor(rowEl, rowPoint) },
      { kind: 'do', run: () => this.say(robot, LADDER_ROBOT_LINE) },
      { kind: 'sit', phase: 'sit', ms: this.qaSit(1900), follow: true },
      { kind: 'do', run: () => this.sayPerched(buddy, LADDER_BUDDY_LINE) },
      { kind: 'sit', phase: 'sit', ms: this.qaSit(2600), follow: true },
      { kind: 'do', run: () => this.setPhase(robot, 'look', 2400) },
      {
        kind: 'jump',
        to: () => ({ x: robot.x + 100, y: 0 }),
        height: 90,
        ms: 680,
      },
      { kind: 'pose', phase: 'crouch', ms: 140 },
    ];
    this._scene = 'perch';
    this._perchWho = buddy;
    this._perchSteps = steps;
    this._perchIndex = -1;
    this._perchWait = 0;
    this._perchAnchor = undefined;
    this._perchFollow = false;
    buddy.speedFactor = 1;
    this.advancePerch();
    return true;
  }

  /* --- Observateur passif de la console (condition du Coucou console) --- */

  /**
   * MutationObserver léger sur #project-console, branché uniquement en mode
   * compact (le nœud .console-line est recréé au changement de projet) :
   * il ne fait qu'horodater le dernier changement. Seule « écoute » tolérée
   * du monde — jamais aucune mutation.
   */
  private syncConsoleObserver(compact: boolean): void {
    clearTimeout(this._consoleObserverTimer);
    if (!compact) {
      this.disconnectConsoleObserver();
      return;
    }
    /* Branché après le délai de grâce : le pont doit être rendu. */
    this._consoleObserverTimer = window.setTimeout(() => {
      const consoleEl = document.querySelector(PERCH_SELECTORS.console);
      if (!consoleEl) {
        return;
      }
      this._consoleObserver?.disconnect();
      this._consoleObserver = new MutationObserver(() => {
        this._consoleChangedAt = performance.now();
      });
      this._consoleObserver.observe(consoleEl, {
        childList: true,
        subtree: true,
      });
    }, PERCH_GRACE_MODE + 200);
  }

  private disconnectConsoleObserver(): void {
    clearTimeout(this._consoleObserverTimer);
    this._consoleObserver?.disconnect();
    this._consoleObserver = undefined;
    this._consoleChangedAt = Number.NEGATIVE_INFINITY;
  }

  /* --- Hook QA --- */

  /** Lit la clé QA une fois par démarrage de scène et expose window.__mascotQa
      (uniquement quand la clé est présente : aucune surface en usage normal). */
  private readQaMode(): void {
    let value = '';
    try {
      value = localStorage.getItem(QA_KEY) ?? '';
    } catch {
      // Stockage indisponible : mode normal.
    }
    this._qaMode = value === 'fast' || value === 'perch-only' ? value : '';
    const host = window as unknown as Record<string, unknown>;
    if (this._qaMode) {
      console.info(
        `[mascot] mode QA rapide actif ('${this._qaMode}') — localStorage.removeItem('${QA_KEY}') pour revenir au rythme normal`
      );
      host['__mascotQa'] = {
        trigger: (name: PerchName | 'echelle' | 'sieste') =>
          this._zone.runOutsideAngular(() => this.qaTrigger(name)),
        /* Court-circuite le déclencheur DOM d'une réaction visiteur. */
        react: (name: string, x?: number) =>
          this._zone.runOutsideAngular(() => this.qaReact(name, x)),
        /* Lecture d'état pour vérification (QA uniquement). */
        state: () => ({
          scene: this._scene,
          napping: this._napping,
          reactive: this._reactivePlan,
        }),
      };
    } else {
      delete host['__mascotQa'];
    }
  }

  /** Déclenche un comportement nommé à la demande (QA uniquement) : la
      scène en cours est interrompue pour observer sans attendre. */
  private qaTrigger(name: PerchName | 'echelle' | 'sieste'): void {
    if (!this._robot || !this._buddy) {
      return;
    }
    if (this._scene === 'perch') {
      this.abortPerch(200);
    } else if (this._scene !== 'free') {
      this.backToFree();
    }
    const started =
      name === 'echelle'
        ? this.startCourteEchelle()
        : name === 'sieste'
          ? this.startNap(this._robot, this._buddy)
          : this.startPerchBehavior(name);
    if (!started) {
      console.info(`[mascot] '${name}' indisponible ici (mode ou ancres)`);
    }
  }

  /**
   * Court-circuite le déclencheur DOM d'une réaction visiteur (QA
   * uniquement) : simule l'état mémorisé par le handler correspondant et
   * remet ses cooldowns à zéro — la rAF consomme au battement suivant.
   */
  private qaReact(name: string, x?: number): void {
    const robot = this._robot;
    const buddy = this._buddy;
    if (!robot || !buddy) {
      return;
    }
    const now = performance.now();
    this._reactCooldown = 0;
    switch (name) {
      case 'accourse': {
        const el =
          document.querySelector(PERCH_SELECTORS.tile) ??
          document.querySelector('project-item');
        if (!el) {
          console.info('[mascot] accourse : aucune tuile/carte visible');
          return;
        }
        this._hoveredEl = el;
        this._hoveredKind = 'project';
        this._hoverSince = now - this.qaHover(ACCOURSE_HOVER_MS) - 1;
        this._hoverCelebrated = false;
        this._accourseUntil = 0;
        this._elementCooldown.delete(el);
        return;
      }
      case 'chips': {
        const el =
          document.querySelector(PERCH_SELECTORS.chip) ??
          document.querySelector('skill-item');
        if (!el) {
          console.info('[mascot] chips : aucune chip visible');
          return;
        }
        this._hoveredEl = el;
        this._hoveredKind = 'chip';
        this._hoverSince = now - this.qaHover(SKILL_HOVER_MS) - 1;
        this._hoverCelebrated = false;
        this._skillUntil = 0;
        this._elementCooldown.delete(el);
        return;
      }
      case 'voyage': {
        this._voyageType = 'project';
        this._voyageX = x ?? window.innerWidth / 2;
        this._voyagePokedAt = now;
        this._voyageUntil = 0;
        return;
      }
      case 'surf': {
        this._surfPokedAt = now;
        this._surfUntil = 0;
        return;
      }
      case 'ovation': {
        const el =
          document.querySelector(PERCH_SELECTORS.badgeCompact) ??
          document.querySelector(PERCH_SELECTORS.badgeSlideshow);
        if (!el) {
          console.info('[mascot] ovation : aucun badge visible');
          return;
        }
        this._badgePokedEl = el;
        this._badgePokedAt = now;
        this._ovationUntil = 0;
        return;
      }
      case 'tourbillon': {
        this._swirlCount = 99;
        this._swirlStart = now;
        this._swirlSign = 1;
        this._swirlUntil = 0;
        this._mouseX = x ?? this.centerOf(robot);
        this._mouseY = window.innerHeight - 40;
        return;
      }
      case 'degringolade': {
        const el = document.querySelector(PERCH_SELECTORS.row);
        if (!el) {
          console.info('[mascot] degringolade : aucune rangée visible');
          return;
        }
        this._accordionPokedEl = el;
        this._accordionPokedAt = now;
        this._accordionFallUntil = 0;
        return;
      }
      case 'sieste':
        this.qaTrigger('sieste');
        return;
      default:
        console.info(`[mascot] réaction inconnue : '${name}'`);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Réactions au monde                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Bascule diaporama / compact : le décor entier change, les perchoirs
   * disparaissent. Chute contrôlée du perché (elle ne dépend que de x/y du
   * sprite, pas du DOM disparu), purge du registre, délai de grâce de 1,4 s
   * avant tout scan (view-fade-in + reveals 250-750 ms + dessin du cadre
   * 1,1 s) et premier tirage repoussé à ≥ 8 s pour laisser le visiteur
   * découvrir le nouveau décor.
   */
  private onModeSwitched(): void {
    if (this._scene === 'perch') {
      /* Bascule venue du triple-clic : la célébration (déjà jouée) remplace
         la bulle de chute — _contextCooldown posé par triggerSurprise. */
      this.controlledFall(
        this._contextCooldown > 0 ? undefined : PERCH_FALL_LINE
      );
    }
    this._perchGrace = PERCH_GRACE_MODE;
    this._nextPerchIn = Math.max(this._nextPerchIn, PERCH_AFTER_MODE_MIN);
    /* Retour en diaporama : le swiper est recréé à la slide 0 sans émettre
       swiperslidechange (l'index ne change pas) — resynchronisation ici,
       sinon _activeSlide garderait sa valeur d'avant le mode compact. */
    this.syncActiveSlide();
    this.reactToModeChange();
  }

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

  /* ------------------------------------------------------------------ */
  /* Réactions aux actions du visiteur — arbitre unique                  */
  /*                                                                     */
  /* Ordre de priorité (décroissant) : 1. capteurs mobile (secousse/tilt, */
  /* reactToShake inchangé) ; 2. triple-clic et célébration surprise     */
  /* (_contextCooldown bloque tout) ; 3. réactions visiteur (elles       */
  /* interrompent un perchoir via abortPerch(250) SAUF dégringolade et   */
  /* ovation-perchée qui UTILISENT le perché ; jamais approach/duo/chase */
  /* — l'événement est perdu, pas mis en file) ; 4. curseur-guide (gèle  */
  /* tout, seule exception : le réveil de sieste) ; 5. vie autonome.     */
  /* Les handlers ont MÉMORISÉ ; tout est consommé ici, dans la rAF —    */
  /* les rects sont lus au déclenchement d'une scène uniquement.         */
  /* ------------------------------------------------------------------ */

  private tickReactions(
    robot: Character,
    buddy: Character,
    timestamp: number
  ): void {
    /* Sieste : démarrage sur inactivité et RÉVEIL — le réveil prime sur
       tout (le visiteur vient de bouger), guide compris (le guide ne
       démarre jamais pendant une sieste : la scène n'est pas 'free'). */
    this.tickNap(robot, buddy, timestamp);

    /* Capteurs souverains : quand le sol penche, aucune réaction. */
    if (!this._isDesktop() && Math.abs(this._tilt) > TILT_DEADZONE) {
      return;
    }
    /* Triple-clic / célébration surprise : au-dessus de toute réaction. */
    if (this._contextCooldown > 0) {
      return;
    }
    /* Le curseur-guide gèle bavardage, duos, perchoirs ET réactions. */
    if (this.guideBusy()) {
      return;
    }

    /* Le surf a son couloir dédié (quasi silencieux, très fréquent). */
    this.checkSurf(robot, buddy, timestamp);

    /* Couloir global : au plus une réaction « jouée » toutes les 5 s. */
    if (this._reactCooldown > 0) {
      return;
    }
    if (this.checkVoyage(robot, buddy, timestamp)) {
      return;
    }
    if (this.checkAccourse(robot, buddy, timestamp)) {
      return;
    }
    if (this.checkOvation(robot, timestamp)) {
      return;
    }
    if (this.checkSwirl(robot, buddy, timestamp)) {
      return;
    }
    /* Priorité basse : l'expert des compétences s'efface derrière tout. */
    this.checkSkillHover(robot, timestamp);
  }

  /**
   * « Le surf de transition » : le sol « bouge » à chaque coup de molette —
   * pose 'brace' + micro-rebond sur place, blob décalé de 120 ms (vague).
   * Se cumule avec reactToSectionChange (qui garde ses bulles et son
   * SECTION_COOLDOWN) ; jamais pendant un vol ni un perchoir
   * (l'invalidation existante abortPerch(350) prime, elle a déjà remis la
   * scène en 'free' — un perché encore en vol est filtré par char.flight).
   */
  private checkSurf(
    robot: Character,
    buddy: Character,
    timestamp: number
  ): void {
    if (
      this._surfPokedAt <= 0 ||
      timestamp - this._surfPokedAt > REACT_FRESH_MS
    ) {
      return;
    }
    if (timestamp < this._surfUntil || this._scene !== 'free') {
      this._surfPokedAt = 0;
      return;
    }
    this._surfPokedAt = 0;
    this._surfUntil = timestamp + this.qaCooldown(SURF_COOLDOWN);
    const brace = (char: Character): void => {
      if (char.flight || char.y > 0.5) {
        return;
      }
      this.setPhase(char, 'brace', 450);
      this.launchFlight(char, char.x, 0, 14, 300);
    };
    brace(robot);
    this._delayed.push({
      in: SURF_STAGGER,
      run: () => {
        if (this._scene === 'free') {
          brace(buddy);
        }
      },
    });
    if (Math.random() < 0.25 && buddy.bubbleRemaining <= 0) {
      this.say(buddy, SURF_LINE, 1300);
    }
  }

  /**
   * « Bon voyage ! » : un lien sortant vient d'être cliqué — le duo se
   * tourne vers le point de départ et salue pendant que l'onglet s'ouvre
   * ailleurs (le clamp delta 64 ms garantit une reprise propre au retour).
   * Un perché ne bouge pas : il salue sur place puis reprend sa pose.
   */
  private checkVoyage(
    robot: Character,
    buddy: Character,
    timestamp: number
  ): boolean {
    const type = this._voyageType;
    if (!type || timestamp - this._voyagePokedAt > REACT_FRESH_MS) {
      this._voyageType = undefined;
      return false;
    }
    if (timestamp < this._voyageUntil) {
      this._voyageType = undefined;
      return false;
    }
    const perched =
      this._scene === 'perch' &&
      !this._perchEscort &&
      !this._reactivePlan &&
      !this._napping
        ? this._perchWho
        : undefined;
    if (this._scene !== 'free' && !perched) {
      this._voyageType = undefined;
      return false;
    }
    this._voyageType = undefined;
    this._voyageUntil = timestamp + this.qaCooldown(VOYAGE_COOLDOWN);
    this._reactCooldown = this.qaCooldown(REACT_GLOBAL_COOLDOWN);
    const x = this._voyageX;
    const line =
      type === 'email'
        ? VOYAGE_EMAIL_LINE
        : type === 'social'
          ? VOYAGE_SOCIAL_LINE
          : VOYAGE_PROJECT_LINE;
    for (const char of [robot, buddy]) {
      if (char === perched) {
        /* Salut sur place (setPhase est sans risque pendant une assise),
           puis re-pose de la phase pour le reste de l'étape en cours. */
        const prev = char.phase;
        this.setPhase(char, char === robot ? 'wave' : 'excited', 1400);
        this._delayed.push({
          in: 1450,
          run: () => {
            if (
              this._scene === 'perch' &&
              this._perchWho === char &&
              prev !== 'move'
            ) {
              this.setPhase(char, prev, Math.max(this._perchWait, 600) + 500);
            }
          },
        });
        continue;
      }
      if (char.flight || char.y > 0.5) {
        continue;
      }
      char.dir = x >= this.centerOf(char) ? 1 : -1;
      this.applyDirection(char);
      this.setPhase(
        char,
        char === robot ? 'wave' : 'excited',
        char === robot ? 2200 : 1800
      );
    }
    if (robot.bubbleRemaining <= 0) {
      if (perched === robot) {
        this.sayPerched(robot, line);
      } else {
        this.say(robot, line);
      }
    }
    return true;
  }

  /**
   * « J'accours pour voir » : survol prolongé (≥ 1,2 s) d'une tuile projet
   * compacte ou d'une carte du diaporama — le personnage le plus proche
   * accourt sous la carte, lève les yeux (--look-y forcé 1,8 s), petit
   * saut sur place, bulle 1 fois sur 2. Part depuis 'free' ou en
   * interrompant un perchoir SANS vol en cours (abortPerch 250 ms).
   */
  private checkAccourse(
    robot: Character,
    buddy: Character,
    timestamp: number
  ): boolean {
    const el = this._hoveredEl;
    if (
      !el ||
      this._hoveredKind !== 'project' ||
      this._hoverCelebrated ||
      !this._isDesktop()
    ) {
      return false;
    }
    const threshold = this.qaHover(ACCOURSE_HOVER_MS);
    if (timestamp - this._hoverSince < threshold) {
      return false;
    }
    /* Une seule tentative par survol — et jamais en retard : un
       franchissement resté bloqué plus de ~0,9 s est simplement perdu. */
    this._hoverCelebrated = true;
    if (timestamp - this._hoverSince > threshold + REACT_LATE_MS) {
      return false;
    }
    if (
      timestamp < this._accourseUntil ||
      (this._elementCooldown.get(el) ?? 0) > timestamp ||
      this._perchGrace > 0
    ) {
      return false;
    }
    if (this._scene === 'perch') {
      if (this._napping || this._reactivePlan || this._perchWho?.flight) {
        return false;
      }
      this.abortPerch(250);
    } else if (this._scene !== 'free') {
      return false;
    }
    if (!el.isConnected) {
      return false;
    }
    /* UNE lecture du rect de la cible, au déclenchement seulement. */
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight) {
      return false;
    }
    const center = rect.left + rect.width / 2;
    const who =
      Math.abs(this.centerOf(robot) - center) <=
      Math.abs(this.centerOf(buddy) - center)
        ? robot
        : buddy;
    this._accourseUntil = timestamp + this.qaCooldown(ACCOURSE_OWN_COOLDOWN);
    this._elementCooldown.set(
      el,
      timestamp + this.qaCooldown(ACCOURSE_ELEMENT_COOLDOWN)
    );
    this._reactCooldown = this.qaCooldown(REACT_GLOBAL_COOLDOWN);
    this.startReactionPlan(who, [
      {
        kind: 'walk',
        to: () => this.clampX(who, center - who.width / 2),
        speedFactor: 2,
      },
      {
        kind: 'do',
        run: () => {
          this._lookUp = { char: who, remaining: 1800 };
          if (Math.random() < 0.5 && who.bubbleRemaining <= 0) {
            this.say(who, this.pickLine(ACCOURSE_LINES, who));
          }
        },
      },
      { kind: 'pose', phase: 'look', ms: 1800 },
      { kind: 'jump', to: () => ({ x: who.x, y: 0 }), height: 35, ms: 480 },
      { kind: 'pose', phase: 'crouch', ms: 130 },
    ]);
    return true;
  }

  /**
   * « L'ovation de l'attaché de presse » : survol d'un badge de contact.
   * (a) un personnage est PERCHÉ sur ce badge précis : il applaudit
   * ('cheer', les étincelles partent toutes seules) sans bulle, puis
   * reprend sa pose 'point' ; (b) sinon, depuis 'free' : le robot se
   * tourne vers le badge, pointe et vante (PRESS_*_LINES) — jamais si sa
   * bulle est déjà visible (anti-cacophonie).
   */
  private checkOvation(robot: Character, timestamp: number): boolean {
    const badge = this._badgePokedEl;
    if (!badge || timestamp - this._badgePokedAt > REACT_FRESH_MS) {
      return false;
    }
    if (!this._isDesktop()) {
      this._badgePokedEl = undefined;
      return false;
    }
    /* Saveur (a) : le perché applaudit son propre badge. */
    if (
      this._scene === 'perch' &&
      this._perchWho &&
      this._perchAnchor?.el === badge
    ) {
      this._badgePokedEl = undefined;
      if (timestamp < this._ovationUntil) {
        return false;
      }
      this._ovationUntil = timestamp + this.qaCooldown(OVATION_COOLDOWN);
      this._reactCooldown = this.qaCooldown(REACT_GLOBAL_COOLDOWN);
      const who = this._perchWho;
      this.setPhase(who, 'cheer', 1100);
      this._delayed.push({
        in: 1100,
        run: () => {
          if (
            this._scene === 'perch' &&
            this._perchWho === who &&
            this._perchAnchor?.el === badge
          ) {
            this.setPhase(who, 'point', Math.max(this._perchWait, 600) + 500);
          }
        },
      });
      return true;
    }
    /* Saveur (b) : depuis 'free' uniquement. */
    if (this._scene !== 'free') {
      return false;
    }
    this._badgePokedEl = undefined;
    if (
      timestamp < this._ovationUntil ||
      robot.bubbleRemaining > 0 ||
      this._perchGrace > 0 ||
      robot.flight ||
      robot.y > 0.5 ||
      !badge.isConnected
    ) {
      return false;
    }
    const rect = badge.getBoundingClientRect();
    if (rect.width === 0) {
      return false;
    }
    const href = (badge as HTMLAnchorElement).href ?? '';
    const line = href.includes('github')
      ? PRESS_GITHUB_LINE
      : href.startsWith('mailto') || href.includes('contact@')
        ? PRESS_EMAIL_LINE
        : PRESS_DEFAULT_LINE;
    this._ovationUntil = timestamp + this.qaCooldown(OVATION_COOLDOWN);
    this._reactCooldown = this.qaCooldown(REACT_GLOBAL_COOLDOWN);
    robot.dir = rect.left + rect.width / 2 >= this.centerOf(robot) ? 1 : -1;
    this.applyDirection(robot);
    this.setPhase(robot, 'point', 2000);
    this.say(robot, line);
    return true;
  }

  /**
   * « Le tourbillon de souris » : l'équivalent desktop de la secousse —
   * le personnage tout proche titube, l'autre rit. Ne s'applique JAMAIS à
   * un perché (il cligne seulement en alerte : pas question de le
   * décrocher injustement).
   */
  private checkSwirl(
    robot: Character,
    buddy: Character,
    timestamp: number
  ): boolean {
    const needed =
      this._qaMode === 'fast' ? SWIRL_QA_INVERSIONS : SWIRL_INVERSIONS;
    if (
      this._swirlCount < needed ||
      timestamp - this._swirlStart > SWIRL_WINDOW
    ) {
      return false;
    }
    this._swirlCount = 0;
    this._swirlSign = 0;
    if (
      !this._isDesktop() ||
      !this._finePointer ||
      timestamp < this._swirlUntil
    ) {
      return false;
    }
    /* Distance au tourbillon : x/y des sprites, AUCUNE lecture layout. */
    const distanceTo = (char: Character): number => {
      const cx = this.centerOf(char);
      const cy = window.innerHeight - SPRITE_GROUND - char.y - char.height / 2;
      return Math.hypot(this._mouseX - cx, this._mouseY - cy);
    };
    const dRobot = distanceTo(robot);
    const dBuddy = distanceTo(buddy);
    if (Math.min(dRobot, dBuddy) > SWIRL_RADIUS) {
      return false;
    }
    const who = dRobot <= dBuddy ? robot : buddy;
    const other = who === robot ? buddy : robot;
    this._swirlUntil = timestamp + this.qaCooldown(SWIRL_COOLDOWN);
    if (this._scene === 'perch' && this._perchWho === who) {
      /* Clignement d'alerte du perché, sans le décrocher (réaction muette,
         hors couloir global). */
      who.el.classList.add('is-alert');
      if (who === robot) {
        robot.alert = true;
        this._alertHold = 1000;
      }
      this._delayed.push({
        in: 1000,
        run: () => {
          who.el.classList.remove('is-alert');
          if (who === robot) {
            robot.alert = false;
          }
        },
      });
      return true;
    }
    const whoFree =
      this._scene === 'free' ||
      (this._scene === 'perch' &&
        this._perchWho !== who &&
        !this._perchEscort &&
        !this._reactivePlan &&
        !this._napping);
    if (!whoFree || who.flight || who.y > 0.5) {
      return false;
    }
    this._reactCooldown = this.qaCooldown(REACT_GLOBAL_COOLDOWN);
    this.setPhase(who, 'stumble', 1100);
    if (who.bubbleRemaining <= 0) {
      this.say(who, SWIRL_LINE);
    }
    if (
      !other.flight &&
      other.y <= 0.5 &&
      (this._scene !== 'perch' || this._perchWho !== other)
    ) {
      this.setPhase(other, 'laugh', 1300);
      if (Math.random() < 0.5 && other.bubbleRemaining <= 0) {
        this.say(other, SWIRL_ECHO_LINE, 1800);
      }
    }
    return true;
  }

  /**
   * « L'expert des compétences » : survol prolongé (≥ 1,5 s) d'une chip —
   * le robot ne se déplace pas (la zone est en hauteur en compact) : il se
   * tourne, pointe et vante en 3e personne SANS jamais citer la techno.
   * Priorité basse : évaluée en dernier dans l'arbitre.
   */
  private checkSkillHover(robot: Character, timestamp: number): boolean {
    const el = this._hoveredEl;
    if (
      !el ||
      this._hoveredKind !== 'chip' ||
      this._hoverCelebrated ||
      !this._isDesktop()
    ) {
      return false;
    }
    const threshold = this.qaHover(SKILL_HOVER_MS);
    if (timestamp - this._hoverSince < threshold) {
      return false;
    }
    this._hoverCelebrated = true;
    if (timestamp - this._hoverSince > threshold + REACT_LATE_MS) {
      return false;
    }
    if (
      timestamp < this._skillUntil ||
      (this._elementCooldown.get(el) ?? 0) > timestamp ||
      this._perchGrace > 0 ||
      robot.bubbleRemaining > 0
    ) {
      return false;
    }
    const robotFree =
      this._scene === 'free' ||
      (this._scene === 'perch' &&
        this._perchWho !== robot &&
        !this._perchEscort &&
        !this._reactivePlan &&
        !this._napping);
    if (!robotFree || robot.flight || robot.y > 0.5 || !el.isConnected) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) {
      return false;
    }
    this._skillUntil = timestamp + this.qaCooldown(SKILL_COOLDOWN);
    this._elementCooldown.set(
      el,
      timestamp + this.qaCooldown(SKILL_ELEMENT_COOLDOWN)
    );
    this._reactCooldown = this.qaCooldown(REACT_GLOBAL_COOLDOWN);
    robot.dir = rect.left + rect.width / 2 >= this.centerOf(robot) ? 1 : -1;
    this.applyDirection(robot);
    this.setPhase(robot, 'point', 2200);
    this.say(robot, this.pickLine(SKILL_LINES, robot));
    return true;
  }

  /* --- « La sieste interrompue » --- */

  /** Compteur d'inactivité et réveil (le réveil prime sur tout). */
  private tickNap(robot: Character, buddy: Character, timestamp: number): void {
    if (this._napping) {
      if (this._lastInputAt > this._napStartedAt && this._scene === 'perch') {
        this.wakeFromNap(robot, buddy);
      }
      return;
    }
    if (timestamp - this._lastInputAt < this._napIdleMs) {
      return;
    }
    if (
      this._scene !== 'free' ||
      this.guideBusy() ||
      this._contextCooldown > 0 ||
      this._perchGrace > 0
    ) {
      return;
    }
    if (!this._isDesktop() && Math.abs(this._tilt) > TILT_DEADZONE) {
      return;
    }
    if (robot.flight || buddy.flight || robot.y > 0.5 || buddy.y > 0.5) {
      return;
    }
    this.startNap(robot, buddy);
  }

  /**
   * Plan perchoir de la sieste (drapeau _napping) : le blob marche vers le
   * pied de la cellule la plus proche (compact) ou le bord d'écran
   * (diaporama) et s'y adosse en 'nest' avec un « Zzz… » renouvelé à
   * chaque cycle ; le robot escorté s'adosse au bord ('lean') puis pique
   * du nez ('rest'). Les tirages autonomes sont gelés par construction
   * (scène 'perch'). La sieste cède TOUJOURS : réveil au premier input,
   * triple-clic, secousse et bascule passent par les aborts existants.
   */
  private startNap(robot: Character, buddy: Character): boolean {
    if (this._scene !== 'free') {
      return false;
    }
    let footX: number;
    if (this._viewMode.isCompact()) {
      const cells = this.rectsOf(PERCH_SELECTORS.cell);
      if (cells.length === 0) {
        return false;
      }
      const buddyCenter = this.centerOf(buddy);
      let best = cells[0];
      for (const cell of cells) {
        const center = cell.rect.left + cell.rect.width / 2;
        const bestCenter = best.rect.left + best.rect.width / 2;
        if (
          Math.abs(center - buddyCenter) < Math.abs(bestCenter - buddyCenter)
        ) {
          best = cell;
        }
      }
      footX = this.clampX(
        buddy,
        best.rect.left + best.rect.width / 2 - buddy.width / 2
      );
    } else {
      footX = buddy.x < window.innerWidth / 2 ? EDGE_MARGIN : buddy.maxX;
    }
    const robotEdge =
      this.centerOf(robot) < window.innerWidth / 2
        ? EDGE_MARGIN + robot.width / 2
        : window.innerWidth - EDGE_MARGIN - robot.width / 2;
    const cycle = this.qaSit(NAP_CYCLE_MS);
    const steps: PerchStep[] = [
      {
        kind: 'do',
        run: () => {
          this._napping = true;
          this._napStartedAt = performance.now();
          this._perchEscort = true;
          this.walkTowards(robot, robotEdge);
        },
      },
      { kind: 'walk', to: () => footX, speedFactor: 1.15 },
      { kind: 'pose', phase: 'crouch', ms: 260 },
    ];
    for (let i = 0; i < NAP_CYCLES; i += 1) {
      steps.push(
        {
          kind: 'do',
          run: () => {
            this.say(buddy, NAP_ZZZ_LINE, cycle + 900);
            if (robot.arrived) {
              this.setPhase(robot, i === 0 ? 'lean' : 'rest', cycle + 900);
            }
          },
        },
        { kind: 'sit', phase: 'nest', ms: cycle }
      );
    }
    /* Fin naturelle (visiteur toujours absent) : étirement, et le compteur
       d'inactivité toujours plein relancera une sieste au tour suivant. */
    steps.push({ kind: 'pose', phase: 'excited', ms: 700 });
    this.startReactionPlan(buddy, steps);
    return true;
  }

  /**
   * RÉVEIL : sursaut en cascade — blob 'stumble' puis 'excited', robot
   * 'jump', bulles décalées — puis 3 s de calme forcé avant tout tirage.
   * Pas de nouvelle sieste avant 90 s d'inactivité.
   */
  private wakeFromNap(robot: Character, buddy: Character): void {
    this.resetPerchState();
    this._scene = 'free';
    this._napIdleMs =
      this._qaMode === 'fast' ? NAP_QA_AFTER_WAKE_MS : NAP_AFTER_WAKE_MS;
    robot.speedFactor = 1;
    buddy.speedFactor = 1;
    /* Le « Zzz… » persistant s'éteint au prochain battement. */
    if (buddy.bubbleRemaining > 1) {
      buddy.bubbleRemaining = 1;
    }
    if (!buddy.flight && buddy.y > 0.5) {
      this.launchFlight(buddy, buddy.x, 0, 0, 300, 'inQuad');
    }
    this.setPhase(buddy, 'stumble', 900);
    this.setPhase(robot, 'jump', 700);
    this.say(robot, WAKE_ROBOT_LINE);
    this._delayed.push({
      in: 900,
      run: () => {
        if (this._scene === 'free' && !buddy.flight) {
          this.setPhase(buddy, 'excited', 1200);
        }
      },
    });
    this._delayed.push({
      in: 1200,
      run: () => this.say(buddy, WAKE_BUDDY_LINE),
    });
    this._nextPerchIn = Math.max(this._nextPerchIn, WAKE_CALM_MS);
    this._nextDuoIn = Math.max(this._nextDuoIn, WAKE_CALM_MS);
    this._nextTalkIn = Math.max(this._nextTalkIn, WAKE_CALM_MS);
    this._reactCooldown = Math.max(this._reactCooldown, WAKE_CALM_MS);
  }

  /* ------------------------------------------------------------------ */
  /* Capteurs de mouvement (mobile)                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Toucher d'un personnage sur mobile (hors zone Angular).
   * Premier toucher : activation des capteurs (permission iOS demandée dans
   * ce geste). Ensuite : petite réaction amusée du personnage touché.
   * Trois taps rapides : la surprise du triple-clic n'existe pas ici (le
   * diaporama est forcé sous md), une bulle amusée le dit — rien ne bascule.
   */
  private handleMobileTap(which: 'robot' | 'buddy'): void {
    const now = performance.now();
    if (
      this._clickTarget !== which ||
      now - this._firstClickAt > TRIPLE_CLICK_WINDOW
    ) {
      this._clickTarget = which;
      this._clickCount = 0;
      this._firstClickAt = now;
    }
    this._clickCount += 1;
    if (this._clickCount >= 3) {
      this._clickCount = 0;
      this._clickTarget = undefined;
      const char = which === 'robot' ? this._robot : this._buddy;
      if (char) {
        this.say(char, SURPRISE_MOBILE_LINE);
      }
      return;
    }

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
      /* Le penchement déporte les bulles : re-clamp immédiat des visibles
         (sinon un personnage immobile qui parle déborderait en penchant). */
      for (const char of [robot, buddy]) {
        if (char.bubbleRemaining > 0) {
          this.updateBubbleShift(char);
        }
      }
    }

    /* Forte inclinaison : petite animation de déséquilibre (bras écartés). */
    const offBalance = Math.abs(tilt) > OFFBALANCE_ANGLE;
    if (offBalance !== this._offBalance) {
      this._offBalance = offBalance;
      robot.el.classList.toggle('is-offbalance', offBalance);
      buddy.el.classList.toggle('is-offbalance', offBalance);
    }

    /* Glissade : au-delà de la zone morte, le duo glisse du côté incliné.
       Seuls les personnages AU SOL glissent (un perché ou un sprite en vol
       dériverait hors de son perchoir) ; le penchement --duo-tilt, lui,
       s'applique partout — le perché penche aussi, c'est mignon. */
    const beyond = Math.abs(tilt) - TILT_DEADZONE;
    if (beyond > 0) {
      const speed = Math.min(beyond * TILT_SLIDE_GAIN, TILT_SLIDE_MAX);
      const shift = (Math.sign(tilt) * speed * delta) / 1000;
      for (const char of [robot, buddy]) {
        if (char.y > 0 || char.flight) {
          continue;
        }
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

  /** Secousse détectée : le duo trébuche et proteste gentiment. La secousse
      gagne toujours : un perché TOMBE (chute contrôlée + stumble). */
  private reactToShake(robot: Character, buddy: Character): void {
    if (this._scene === 'perch') {
      this.controlledFall();
    } else if (this._scene !== 'free') {
      this.backToFree();
    }
    for (const char of [robot, buddy]) {
      if (!char.flight) {
        this.setPhase(char, 'stumble', 1100);
      }
    }
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
    /* « J'accours pour voir » : regard forcé vers le haut de la carte. */
    if (this._lookUp?.char === robot) {
      lookX = 0;
      lookY = -2.6;
    }
    this.applyGaze(robot, lookX, lookY);
    /* _alertHold (clignement du tourbillon) gèle le recalcul d'alerte. */
    if (this._alertHold <= 0) {
      const alert = robotDist < ALERT_RADIUS;
      if (alert !== robot.alert) {
        robot.alert = alert;
        robot.el.classList.toggle('is-alert', alert);
      }
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
    if (this._lookUp?.char === buddy) {
      buddyLookX = 0;
      buddyLookY = -2;
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
    /* Mesures faites une fois par phrase (même layout forcé), puis
       réutilisées pendant les déplacements. */
    char.bubbleHalf = (char.bubble.offsetWidth || 120) / 2;
    char.bubbleHalfH = (char.bubble.offsetHeight || 32) / 2;
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

  /**
   * Garde la bulle dans l'écran : la boîte glisse, la flèche reste sur la
   * tête. Tient compte du penchement capteurs (--duo-tilt) : la bulle pivote
   * avec le sprite autour de ses pieds, son centre se déporte donc de
   * bras × sin θ et sa boîte englobante s'élargit — le clamp corrige les
   * deux pour que la bulle penchée reste elle aussi dans l'écran.
   */
  private updateBubbleShift(char: Character): void {
    const theta = (this._appliedTiltRot * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    /* Bras de levier pieds (pivot de rotation) → centre de la bulle. */
    const arm = char.height + BUBBLE_GAP + char.bubbleHalfH;
    /* Demi-largeur de la boîte englobante de la bulle penchée. */
    const half = char.bubbleHalf * cos + char.bubbleHalfH * Math.abs(sin);
    /* Centre de bulle à glissement nul, une fois le penchement appliqué. */
    const center = this.centerOf(char) + arm * sin;
    /* Le glissement est appliqué avant rotation : l'écran le voit × cos θ. */
    const min = (BUBBLE_MARGIN + half - center) / cos;
    const max = Math.max(
      min,
      (window.innerWidth - BUBBLE_MARGIN - half - center) / cos
    );
    const shift = Math.min(Math.max(0, min), max);
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
       la translation peut être réécrite sans toucher à la rotation.
       L'axe vertical (y = élévation au-dessus du sol, 0 = promenade) porte
       les perchoirs ; le pivot 50% 100% et la bulle (enfant du bouton, elle
       suit gratuitement) restent inchangés. */
    char.el.style.transform = `translate3d(${char.x}px, ${-char.y}px, 0) rotate(var(--duo-tilt, 0deg))`;
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
