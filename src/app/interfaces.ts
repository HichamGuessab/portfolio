import { IconName } from './components/icon/icons';

/**
 * Identifiants des technologies citées sur le site (compétences, projets,
 * expériences). Le libellé et le logo de chacune sont déclarés une seule
 * fois dans TECHNOLOGIES (src/app/data/technologies.ts).
 */
export type TechId =
  | 'android'
  | 'angular'
  | 'arduino'
  | 'bash'
  | 'capacitor'
  | 'cpp'
  | 'docker'
  | 'express'
  | 'figma'
  | 'flutter'
  | 'git'
  | 'gitlab'
  | 'ice'
  | 'ionic'
  | 'ios'
  | 'java'
  | 'mongodb'
  | 'nodejs'
  | 'npm'
  | 'postgresql'
  | 'python'
  | 'raspberry-pi'
  | 'react-native'
  | 'redux'
  | 'tailwind'
  | 'typescript'
  | 'xml';

export interface Technology {
  name: string;
  icon: IconName;
}

/**
 * Période d'activité. Mois au format ISO « AAAA-MM » ou année seule
 * « AAAA » ; sans fin, la période court jusqu'à aujourd'hui.
 */
export interface Period {
  start: string;
  end?: string;
}

export interface Skill {
  tech: TechId;
  /** Stack principale : mise en avant au dégradé signature. */
  primary?: boolean;
}

export interface SkillGroup {
  name: string;
  /** Une phrase de contexte sous le titre de la famille. */
  description: string;
  icon: IconName;
  skills: Skill[];
}

export type ProjectCategory = 'web' | 'mobile' | 'software';

export interface Project {
  name: string;
  description: string;
  category: ProjectCategory;
  /** Pictogramme d'illustration de la carte. */
  icon: IconName;
  technologies: TechId[];
  /** Dépôt GitHub du code source. */
  repository: string;
  /** Maquette Figma, quand elle est publique. */
  design?: string;
  /** Projet mis en avant (grande carte en tête de section). */
  featured?: boolean;
}

export interface ExperienceRole {
  title: string;
  /** Nature du contrat (« CDI », « Alternance »…). */
  contract?: string;
  period: Period;
  summary?: string;
  highlights?: string[];
  technologies?: TechId[];
}

export interface Experience {
  organization: string;
  /** Précision affichée sous l'organisation (secteur, cadre…). */
  context?: string;
  /** Postes occupés, du plus récent au plus ancien. */
  roles: ExperienceRole[];
}

export interface Degree {
  name: string;
  field: string;
  institution: string;
  period: Period;
  /** Niveau (« Bac+5 »…), affiché en étiquette. */
  level?: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: IconName;
  /** Texte visible quand il diffère du nom (adresse e-mail…). */
  display?: string;
}

/** Ancres des sections de la page, dans l'ordre de lecture. */
export type SectionId =
  'profil' | 'experience' | 'projets' | 'competences' | 'formation' | 'contact';

export enum Link {
  Email = 'mailto:contact@hichamguessab.com',
  LinkedIn = 'https://www.linkedin.com/in/hicham-g-811573222/',
  Github = 'https://github.com/HichamGuessab',
}
