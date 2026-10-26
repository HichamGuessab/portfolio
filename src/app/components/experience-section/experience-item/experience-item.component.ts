import {
  booleanAttribute,
  Component,
  computed,
  input,
  InputSignal,
  InputSignalWithTransform,
  ChangeDetectionStrategy,
  Signal,
} from '@angular/core';
import { Experience, ExperienceRole } from '../../../interfaces';
import {
  formatDuration,
  formatPeriod,
  periodMonths,
} from '../../../data/period';
import { TechChipComponent } from '../../tech-chip/tech-chip.component';

/** Poste prêt à l'affichage : libellés de période et de durée calculés. */
interface RoleView extends ExperienceRole {
  periodLabel: string;
  duration: string | null;
  current: boolean;
}

/**
 * Carte d'une organisation de la frise Expérience. Plusieurs postes dans la
 * même organisation (alternance puis CDI) forment une mini-frise interne :
 * la progression se lit d'un coup d'œil.
 */
@Component({
  selector: 'experience-item',
  templateUrl: './experience-item.component.html',
  imports: [TechChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ExperienceItemComponent {
  experience: InputSignal<Experience> = input.required<Experience>();

  /** Organisation actuelle (en tête de frise) : liseré dégradé. */
  current: InputSignalWithTransform<boolean, unknown> = input(false, {
    transform: booleanAttribute,
  });

  protected readonly roles: Signal<RoleView[]> = computed(() =>
    this.experience().roles.map((role) => {
      const months = periodMonths(role.period);
      return {
        ...role,
        periodLabel: formatPeriod(role.period),
        duration: months === null ? null : formatDuration(months),
        current: !role.period.end,
      };
    })
  );

  /** Ancienneté cumulée dans l'organisation (plusieurs postes uniquement). */
  protected readonly tenure: Signal<string | null> = computed(() => {
    const roles = this.experience().roles;
    if (roles.length < 2) {
      return null;
    }
    const months = periodMonths({
      start: roles[roles.length - 1].period.start,
      end: roles[0].period.end,
    });
    return months === null ? null : formatDuration(months);
  });
}
