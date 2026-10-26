import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { SectionId } from '../../interfaces';
import { ProfileService } from '../../services/profile.service';
import { SectionSpyService } from '../../services/section-spy.service';
import { IconComponent } from '../icon/icon.component';

interface NavItem {
  id: SectionId;
  label: string;
}

/** Au-delà de ce défilement (px), l'en-tête prend son fond opaque. */
const SCROLLED_THRESHOLD = 8;

/**
 * En-tête collant : monogramme, navigation par ancres avec la section en
 * cours mise en évidence (scroll-spy), appel à l'action « Me contacter ».
 * Sous lg, la navigation passe dans un menu déroulant (bouton de
 * divulgation, fermeture au choix d'un lien, à Échap ou au clic extérieur).
 */
@Component({
  selector: 'site-header',
  templateUrl: './site-header.component.html',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sticky top-0 z-40 block',
    '(document:keydown.escape)': 'closeMenu(true)',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SiteHeaderComponent {
  protected readonly profile: ProfileService = inject(ProfileService);
  protected readonly spy: SectionSpyService = inject(SectionSpyService);

  protected readonly items: NavItem[] = [
    { id: 'experience', label: 'Expérience' },
    { id: 'projets', label: 'Projets' },
    { id: 'competences', label: 'Compétences' },
    { id: 'formation', label: 'Formation' },
    { id: 'contact', label: 'Contact' },
  ];

  /** Vrai dès que la page a défilé : fond et liseré de l'en-tête. */
  protected readonly scrolled: WritableSignal<boolean> = signal(false);

  /** Menu mobile ouvert. */
  protected readonly menuOpen: WritableSignal<boolean> = signal(false);

  private readonly _host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly _toggle =
    viewChild<ElementRef<HTMLButtonElement>>('menuToggle');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      let frame = 0;
      const update = (): void => {
        frame = 0;
        this.scrolled.set(window.scrollY > SCROLLED_THRESHOLD);
      };
      const onScroll = (): void => {
        frame ||= requestAnimationFrame(update);
      };
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        cancelAnimationFrame(frame);
      });
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Ferme le menu ; `restoreFocus` rend le focus au bouton (touche Échap). */
  protected closeMenu(restoreFocus = false): void {
    if (!this.menuOpen()) {
      return;
    }
    this.menuOpen.set(false);
    if (restoreFocus) {
      this._toggle()?.nativeElement.focus();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this._host.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
