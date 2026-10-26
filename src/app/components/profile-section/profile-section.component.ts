import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  InputSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { ProjectService } from '../../services/project.service';
import { SpySectionDirective } from '../../directives/spy-section.directive';
import { IconComponent } from '../icon/icon.component';
import { PortraitComponent } from '../portrait/portrait.component';

/**
 * Mise en page de la section profil :
 * - « hero » : ouverture de la page (accroche, appels à l'action, chiffres
 *   clés, portrait en orbite) ;
 * - « compact » : cellule identité du pont de commandement — photo dans un
 *   liseré dégradé, titres à sa droite, accroche intégrale dessous (le cadre
 *   en tirets appartient à l'écran, voir ScreenFrameComponent).
 */
export type ProfileLayout = 'hero' | 'compact';

interface KeyFigure {
  value: string;
  label: string;
}

@Component({
  selector: 'profile-section',
  templateUrl: './profile-section.component.html',
  imports: [IconComponent, PortraitComponent, SpySectionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProfileSectionComponent {
  /** Mise en page : « hero » (page, défaut) ou « compact » (une page). */
  readonly layout: InputSignal<ProfileLayout> = input<ProfileLayout>('hero');

  protected readonly profile: ProfileService = inject(ProfileService);

  private readonly _years = this.profile.yearsOfExperience();

  /** Chiffres clés du héros, dérivés des données. */
  protected readonly figures: KeyFigure[] = [
    {
      value: `${this._years} an${this._years > 1 ? 's' : ''}`,
      label: 'd’expérience en entreprise',
    },
    {
      value: String(inject(ProjectService).getProjects().length),
      label: 'projets publiés sur GitHub',
    },
    { value: 'Bac+5', label: 'Master Ingénierie du logiciel' },
  ];

  /** Photo compacte chargée : retrait du flou d'attente. */
  protected readonly imageLoaded: WritableSignal<boolean> = signal(false);
}
