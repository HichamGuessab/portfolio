import { TechId, Technology } from '../interfaces';

/**
 * Registre unique des technologies : nom de marque correctement orthographié
 * et logo SVG (voir IconComponent). Toute technologie citée sur le site
 * (compétence, projet, expérience) passe par ici.
 */
export const TECHNOLOGIES: Record<TechId, Technology> = {
  android: { name: 'Android', icon: 'android' },
  angular: { name: 'Angular', icon: 'angular' },
  arduino: { name: 'Arduino', icon: 'arduino' },
  bash: { name: 'Bash', icon: 'bash' },
  capacitor: { name: 'Capacitor', icon: 'capacitor' },
  cpp: { name: 'C++', icon: 'cpp' },
  docker: { name: 'Docker', icon: 'docker' },
  express: { name: 'Express', icon: 'express' },
  figma: { name: 'Figma', icon: 'figma' },
  flutter: { name: 'Flutter', icon: 'flutter' },
  git: { name: 'Git', icon: 'git' },
  gitlab: { name: 'GitLab', icon: 'gitlab' },
  ice: { name: 'ZeroC Ice', icon: 'snowflake' },
  ionic: { name: 'Ionic', icon: 'ionic' },
  ios: { name: 'iOS', icon: 'apple' },
  java: { name: 'Java', icon: 'java' },
  mongodb: { name: 'MongoDB', icon: 'mongodb' },
  nodejs: { name: 'Node.js', icon: 'nodejs' },
  npm: { name: 'npm', icon: 'npm' },
  postgresql: { name: 'PostgreSQL', icon: 'postgresql' },
  python: { name: 'Python', icon: 'python' },
  'raspberry-pi': { name: 'Raspberry Pi', icon: 'raspberry-pi' },
  'react-native': { name: 'React Native', icon: 'react' },
  redux: { name: 'Redux', icon: 'redux' },
  tailwind: { name: 'Tailwind CSS', icon: 'tailwindcss' },
  typescript: { name: 'TypeScript', icon: 'typescript' },
  xml: { name: 'XML', icon: 'file-code' },
};
