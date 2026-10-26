import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProfileSectionComponent } from './components/profile-section/profile-section.component';
import { SkillsSectionComponent } from './components/skills-section/skills-section.component';
import { ProjectsSectionComponent } from './components/projects-section/projects-section.component';
import { EducationSectionComponent } from './components/education-section/education-section.component';
import { ExperienceSectionComponent } from './components/experience-section/experience-section.component';
import { ContactSectionComponent } from './components/contact-section/contact-section.component';
import { SiteHeaderComponent } from './components/site-header/site-header.component';
import { SiteFooterComponent } from './components/site-footer/site-footer.component';
import { MascotComponent } from './components/mascot/mascot.component';
import { CompactBoardComponent } from './components/compact-board/compact-board.component';
import { IconDefsComponent } from './components/icon/icon.component';
import { ViewModeService } from './services/view-mode.service';
import { SpotlightDirective } from './directives/spotlight.directive';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    SiteHeaderComponent,
    ProfileSectionComponent,
    ExperienceSectionComponent,
    ProjectsSectionComponent,
    SkillsSectionComponent,
    EducationSectionComponent,
    ContactSectionComponent,
    SiteFooterComponent,
    MascotComponent,
    CompactBoardComponent,
    IconDefsComponent,
    SpotlightDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class AppComponent {
  protected readonly viewMode: ViewModeService = inject(ViewModeService);
}
