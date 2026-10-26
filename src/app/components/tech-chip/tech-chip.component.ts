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
import { TechId, Technology } from '../../interfaces';
import { TECHNOLOGIES } from '../../data/technologies';
import { IconComponent } from '../icon/icon.component';

/**
 * Pastille technologie : logo + nom de marque. La variante `primary`
 * (stack principale) passe au liseré et au logo dégradés de la charte.
 */
@Component({
  selector: 'tech-chip',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    @if (primary()) {
      <span
        class="inline-flex rounded-full bg-linear-to-r from-lightBlue/70 to-purple/70 p-px"
      >
        <span
          class="inline-flex items-center gap-2 rounded-full bg-nightBlue px-3 py-1.5 text-sm font-medium text-wildSand"
        >
          <app-icon [name]="technology().icon" gradient class="size-4" />
          {{ technology().name }}
        </span>
      </span>
    } @else {
      <span
        class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/80"
      >
        <app-icon [name]="technology().icon" class="size-4 text-white/75" />
        {{ technology().name }}
      </span>
    }
  `,
})
export class TechChipComponent {
  readonly tech: InputSignal<TechId> = input.required<TechId>();

  /** Stack principale : liseré et logo dégradés. */
  readonly primary: InputSignalWithTransform<boolean, unknown> = input(false, {
    transform: booleanAttribute,
  });

  protected readonly technology: Signal<Technology> = computed(
    () => TECHNOLOGIES[this.tech()]
  );
}
