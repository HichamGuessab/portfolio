import {
  Component,
  computed,
  input,
  InputSignal,
  ChangeDetectionStrategy,
  Signal,
} from '@angular/core';
import { Project, Technology } from '../../../interfaces';
import { TECHNOLOGIES } from '../../../data/technologies';
import { PROJECT_CATEGORIES } from '../../../services/project.service';
import { IconComponent } from '../../icon/icon.component';
import { figma } from '../../icon/logos';
import { TechChipComponent } from '../../tech-chip/tech-chip.component';

/**
 * Carte projet. Toute la carte mène au dépôt GitHub (lien étiré depuis le
 * titre, un seul arrêt de tabulation) ; un lien secondaire — la maquette
 * Figma — reste cliquable au-dessus.
 * - « featured » : grande carte des projets mis en avant ;
 * - « compact » : ligne de la liste d'archive « Autres projets ».
 */
export type ProjectItemVariant = 'featured' | 'compact';

@Component({
  selector: 'project-item',
  templateUrl: './project-item.component.html',
  imports: [IconComponent, TechChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class ProjectItemComponent {
  project: InputSignal<Project> = input.required<Project>();
  variant: InputSignal<ProjectItemVariant> =
    input<ProjectItemVariant>('featured');

  /** Numéro HUD affiché sur la carte (« 01 »…). */
  index: InputSignal<number> = input(0);

  protected readonly category: Signal<string> = computed(
    () => PROJECT_CATEGORIES[this.project().category]
  );

  protected readonly technologies: Signal<Technology[]> = computed(() =>
    this.project().technologies.map((tech) => TECHNOLOGIES[tech])
  );

  protected readonly number: Signal<string> = computed(() =>
    String(this.index() + 1).padStart(2, '0')
  );

  protected readonly figma = figma;
}
