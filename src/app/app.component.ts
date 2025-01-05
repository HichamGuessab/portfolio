import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProfileSectionComponent } from './components/profile-section/profile-section.component';
import { SkillsSectionComponent } from './components/skills-section/skills-section.component';
import { NavMenuComponent } from './components/navigation/nav-menu/nav-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    RouterOutlet,
    ProfileSectionComponent,
    SkillsSectionComponent,
    NavMenuComponent,
  ],
})
export class AppComponent {}
