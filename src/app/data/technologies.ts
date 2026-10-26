import { Technology } from '../interfaces';
import { ICONS } from '../components/icon/icons';
import {
  android,
  apple,
  arduino,
  bash,
  cpp,
  docker,
  express,
  figma,
  flutter,
  git,
  gitlab,
  ionic,
  java,
  mongodb,
  nodejs,
  npm,
  postgresql,
  python,
  raspberryPi,
  react,
  redux,
  tailwindcss,
} from '../components/icon/logos';

/**
 * Registre unique des technologies : nom de marque correctement orthographié
 * et logo SVG (voir IconComponent). Toute technologie citée sur le site
 * (compétence, projet, expérience) passe par ici, et son identifiant
 * (TechId) découle des clés du registre. Importé par les seules sections
 * différées : les logos de logos.ts restent hors du bundle initial.
 */
export const TECHNOLOGIES = {
  android: { name: 'Android', icon: android },
  angular: { name: 'Angular', icon: ICONS.angular },
  arduino: { name: 'Arduino', icon: arduino },
  bash: { name: 'Bash', icon: bash },
  capacitor: { name: 'Capacitor', icon: ICONS.capacitor },
  cpp: { name: 'C++', icon: cpp },
  docker: { name: 'Docker', icon: docker },
  express: { name: 'Express', icon: express },
  figma: { name: 'Figma', icon: figma },
  flutter: { name: 'Flutter', icon: flutter },
  git: { name: 'Git', icon: git },
  gitlab: { name: 'GitLab', icon: gitlab },
  ice: { name: 'ZeroC Ice', icon: ICONS.snowflake },
  ionic: { name: 'Ionic', icon: ionic },
  ios: { name: 'iOS', icon: apple },
  java: { name: 'Java', icon: java },
  mongodb: { name: 'MongoDB', icon: mongodb },
  nodejs: { name: 'Node.js', icon: nodejs },
  npm: { name: 'npm', icon: npm },
  postgresql: { name: 'PostgreSQL', icon: postgresql },
  python: { name: 'Python', icon: python },
  'raspberry-pi': { name: 'Raspberry Pi', icon: raspberryPi },
  'react-native': { name: 'React Native', icon: react },
  redux: { name: 'Redux', icon: redux },
  tailwind: { name: 'Tailwind CSS', icon: tailwindcss },
  typescript: { name: 'TypeScript', icon: ICONS.typescript },
  xml: { name: 'XML', icon: ICONS['file-code'] },
} satisfies Record<string, Technology>;

/** Identifiant d'une technologie du registre. */
export type TechId = keyof typeof TECHNOLOGIES;
