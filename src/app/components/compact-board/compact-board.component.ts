import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  NgZone,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  Degree,
  Link,
  Period,
  Project,
  SkillGroup,
  TechId,
} from '../../interfaces';
import { TECHNOLOGIES } from '../../data/technologies';
import { formatPeriod } from '../../data/period';
import { ProjectService } from '../../services/project.service';
import { ExperienceService } from '../../services/experience.service';
import { EducationService } from '../../services/education.service';
import { SkillService } from '../../services/skill.service';
import { ProfileSectionComponent } from '../profile-section/profile-section.component';
import { SectionHeaderComponent } from '../section-header/section-header.component';
import { BadgeComponent } from '../badge/badge.component';
import { ScreenFrameComponent } from '../screen-frame/screen-frame.component';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icons';
import { RevealDirective } from '../../directives/reveal.directive';

/** Rangée de l'accordéon-registre : un poste (les organisations à plusieurs
    postes donnent plusieurs rangées, du plus récent au plus ancien). */
interface ExperienceRow {
  id: string;
  date: string;
  title: string;
  organization: string;
  summary?: string;
  highlights: string[];
}

/** Libellé de date court du registre : « août 2025 – auj. ». */
const shortPeriod = (period: Period): string =>
  formatPeriod(period).replace('aujourd’hui', 'auj.');

/**
 * « Circuit fermé » — le pont de commandement du mode compact : un unique
 * écran sans aucun défilement de page, ceinturé par le cadre-circuit
 * (screen-frame). Grille bento asymétrique : identité + baie projets à
 * gauche, expérience / compétences / formation à droite, barre de statut
 * basse (contacts + promenade des mascottes).
 *
 * Tout ce qui est en tirets appartient au même circuit : le cadre écran, la
 * ligne de vie de la Formation, le slot libre de la baie Projets et le sol
 * des mascottes. Survoler un élément interactif accélère la course des
 * tirets du cadre (signal frameExcited, event delegation [data-circuit]).
 */
@Component({
  selector: 'compact-board',
  templateUrl: './compact-board.component.html',
  imports: [
    ProfileSectionComponent,
    SectionHeaderComponent,
    BadgeComponent,
    ScreenFrameComponent,
    IconComponent,
    RevealDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  styles: [
    `
      /* Caret de la console : la console « lit » le module actif. Il ne
         clignote qu'une fois le cadre dessiné (delay 1.1s, pas de fill-mode :
         visible en continu avant). */
      @keyframes console-caret-blink {
        0%,
        54% {
          opacity: 1;
        }
        55%,
        100% {
          opacity: 0;
        }
      }

      .console-caret {
        display: inline-block;
        animation: console-caret-blink 1.1s linear 1.1s infinite;
      }

      /* Micro-fondu du texte de la console au changement de module (le nœud
         est recréé via @for track : l'animation rejoue). Hauteur fixe, aucun
         reflow. */
      @keyframes console-line-in {
        from {
          opacity: 0;
        }
      }

      .console-line {
        animation: console-line-in 150ms ease-out;
      }

      /* Point du 12e slot « libre » : pulsation calme, clin d'œil
         « prochaine baie ». */
      @keyframes slot-pulse {
        0%,
        100% {
          opacity: 0.25;
        }
        50% {
          opacity: 0.9;
        }
      }

      .slot-dot {
        animation: slot-pulse 3s ease-in-out infinite;
      }

      /* Ligne de vie de la Formation : dérivation du circuit — mêmes tirets
         (~14px / 10px), même cadence (~26px/s) et même départ (1.1s) que le
         cadre écran. */
      @keyframes timeline-march {
        to {
          stroke-dashoffset: -24;
        }
      }

      .timeline-dashes {
        stroke: color-mix(in srgb, var(--light-blue) 30%, transparent);
        stroke-width: 2;
        stroke-dasharray: 14 10;
        stroke-linecap: round;
        animation: timeline-march 0.9s linear 1.1s infinite;
      }
    `,
  ],
})
export class CompactBoardComponent {
  private readonly _zone: NgZone = inject(NgZone);
  private readonly _skillService: SkillService = inject(SkillService);

  protected readonly projects: Project[] = inject(ProjectService).getProjects();

  /** Un poste par rangée, du plus récent au plus ancien. */
  protected readonly experienceRows: ExperienceRow[] = inject(ExperienceService)
    .getExperiences()
    .flatMap((experience) =>
      experience.roles.map((role) => ({
        id: `${experience.organization}-${role.period.start}`,
        date: shortPeriod(role.period),
        title: role.contract ? `${role.title} (${role.contract})` : role.title,
        organization: experience.organization,
        summary: role.summary,
        highlights: role.highlights ?? [],
      }))
    );

  /** Ordre chronologique gauche → droite (le service liste du plus récent). */
  protected readonly degrees: Degree[] = [
    ...inject(EducationService).getDegrees(),
  ].reverse();

  protected readonly skillBays: SkillGroup[] =
    this._skillService.getSkillGroups();

  /**
   * Projet « actif » lu par la console : Portfolio par défaut, puis le
   * dernier survolé/focus. Jamais vidé au mouseleave.
   */
  protected readonly activeProject: WritableSignal<Project> = signal(
    this.projects[0]
  );

  /** Rangée d'expérience déployée (défaut : la première, CBA). */
  protected readonly activeExperience: WritableSignal<number> = signal(0);

  /** Vrai quand l'attention du visiteur est sur un élément du circuit. */
  protected readonly frameExcited: WritableSignal<boolean> = signal(false);

  /* Mini-readout HUD : taille du viewport en direct. */
  protected readonly viewportWidth: WritableSignal<number> = signal(
    window.innerWidth
  );
  protected readonly viewportHeight: WritableSignal<number> = signal(
    window.innerHeight
  );

  protected readonly Link = Link;
  protected readonly formatPeriod = formatPeriod;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let raf = 0;

    const onResize = (): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        this._zone.run(() => {
          this.viewportWidth.set(window.innerWidth);
          this.viewportHeight.set(window.innerHeight);
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

  /**
   * Event delegation du circuit : le cadre s'excite quand le pointeur ou le
   * focus est sur un élément marqué [data-circuit] (tuile projet, rangée
   * expérience, chip compétence, badge de contact).
   */
  protected onCircuitOver(event: Event): void {
    const target = event.target as HTMLElement | null;
    this.frameExcited.set(!!target?.closest?.('[data-circuit]'));
  }

  protected onCircuitLeave(): void {
    this.frameExcited.set(false);
  }

  protected techIcon(tech: TechId): IconName {
    return TECHNOLOGIES[tech].icon;
  }

  protected techName(tech: TechId): string {
    return TECHNOLOGIES[tech].name;
  }

  /** Index HUD à deux chiffres (« 01 » … « 11 »). */
  protected padIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
