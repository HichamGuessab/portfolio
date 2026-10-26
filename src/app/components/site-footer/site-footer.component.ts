import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { SectionSpyService } from '../../services/section-spy.service';
import { IconComponent } from '../icon/icon.component';

/**
 * Pied de page : signature, coulisses du site (Figma → Angular, code
 * source) et retour en haut. Sa visibilité signale au scroll-spy que le bas
 * de page est atteint.
 */
@Component({
  selector: 'site-footer',
  templateUrl: './site-footer.component.html',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SiteFooterComponent {
  protected readonly profile: ProfileService = inject(ProfileService);
  protected readonly year: number = new Date().getFullYear();

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    const spy = inject(SectionSpyService);
    let stop: () => void = () => undefined;

    afterNextRender(() => {
      stop = spy.observeBottom(element);
    });
    inject(DestroyRef).onDestroy(() => stop());
  }
}
