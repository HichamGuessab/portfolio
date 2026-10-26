import { Injectable } from '@angular/core';
import { Link, SocialLink } from '../interfaces';
import { formatDuration, periodMonths } from '../data/period';

/**
 * Identité et présentation : textes du héros, liens de contact et
 * chiffres clés. Les chiffres sont dérivés des données (date d'entrée en
 * entreprise, nombre de projets) pour ne jamais devenir faux.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  readonly name = 'Hicham Guessab';
  readonly greeting = 'Hello ! Je suis';
  readonly role = 'Ingénieur logiciel';
  readonly specialty = 'Développeur web et mobile';
  readonly availability = 'Ouvert aux opportunités';
  readonly email = 'contact@hichamguessab.com';

  /** Début de l'alternance chez CBA : point de départ de l'expérience pro. */
  readonly careerStart = '2023-09';

  /** Expérience en entreprise, alternance comprise (« 3 ans »). */
  readonly experience: string = formatDuration(12 * this.yearsOfExperience());

  readonly github: SocialLink = {
    name: 'GitHub',
    url: Link.Github,
    icon: 'github',
  };

  readonly linkedin: SocialLink = {
    name: 'LinkedIn',
    url: Link.LinkedIn,
    icon: 'linkedin',
  };

  readonly mail: SocialLink = {
    name: 'E-mail',
    url: `mailto:${this.email}`,
    icon: 'mail',
  };

  /** Années pleines d'expérience en entreprise (alternance comprise). */
  yearsOfExperience(now: Date = new Date()): number {
    return Math.floor(
      (periodMonths({ start: this.careerStart }, now) ?? 0) / 12
    );
  }
}
