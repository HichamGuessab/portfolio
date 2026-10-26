/**
 * Registre des icônes du bundle initial, rendues en ligne par IconComponent :
 * uniquement des données de tracé, posées par liaisons [attr.d] (le
 * sanitizer d'Angular retire le SVG d'un innerHTML). Il réunit les icônes
 * d'interface et les seuls logos du premier écran ; les autres logos vivent
 * dans logos.ts, importés par les sections différées qui les affichent.
 *
 * Sources, réduites aux seuls tracés :
 * - interface : Lucide (lucide-static 1.61.0), licence ISC, © Lucide Icons
 *   and Contributors ; icônes issues de Feather © Cole Bemis (MIT). Cercles,
 *   rectangles et lignes sont convertis en tracés équivalents ;
 * - marques : Simple Icons 16.36.0 (CC0), sauf Angular (CC BY 4.0) et
 *   LinkedIn (dessiné à la main). Les logos restent des marques de leurs
 *   détenteurs.
 *
 * Grille 24 × 24. Chaque tracé commence par un M absolu : les tracés d'une
 * icône peuvent être concaténés sans changer le rendu.
 */

/** Définition d'une icône (registre ICONS ou logo de logos.ts). */
export interface IconDef {
  /**
   * 'stroke' : icône d'interface au trait (style Lucide) ;
   * 'fill' : logo de marque plein (Simple Icons).
   */
  readonly type: 'stroke' | 'fill';

  /** Un attribut d par élément <path> (formes Lucide converties en tracés). */
  readonly paths: readonly string[];
}

export const ICONS = {
  'arrow-up-right': { type: 'stroke', paths: ['M7 7h10v10', 'M7 17 17 7'] },
  'arrow-down': { type: 'stroke', paths: ['M12 5v14', 'M19 12l-7 7-7-7'] },
  'arrow-up': { type: 'stroke', paths: ['M5 12l7-7 7 7', 'M12 19V5'] },
  mail: {
    type: 'stroke',
    paths: [
      'M22 7l-8.991 5.727a2 2 0 0 1-2.009 0L2 7',
      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    ],
  },
  'at-sign': {
    type: 'stroke',
    paths: [
      'M16 12a4 4 0 0 1-8 0 4 4 0 0 1 8 0z',
      'M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8',
    ],
  },
  copy: {
    type: 'stroke',
    paths: [
      'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z',
      'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
    ],
  },
  check: { type: 'stroke', paths: ['M20 6 9 17l-5-5'] },
  printer: {
    type: 'stroke',
    paths: [
      'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2',
      'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6',
      'M7 14h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z',
    ],
  },
  menu: { type: 'stroke', paths: ['M4 5h16', 'M4 12h16', 'M4 19h16'] },
  x: { type: 'stroke', paths: ['M18 6 6 18', 'M6 6l12 12'] },
  briefcase: {
    type: 'stroke',
    paths: [
      'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
      'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
    ],
  },
  layers: {
    type: 'stroke',
    paths: [
      'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z',
      'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12',
      'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
    ],
  },
  'graduation-cap': {
    type: 'stroke',
    paths: [
      'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z',
      'M22 10v6',
      'M6 12.5V16a6 3 0 0 0 12 0v-3.5',
    ],
  },
  sparkles: {
    type: 'stroke',
    paths: [
      'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
      'M20 2v4',
      'M22 4h-4',
      'M6 20a2 2 0 0 1-4 0 2 2 0 0 1 4 0z',
    ],
  },
  cpu: {
    type: 'stroke',
    paths: [
      'M12 20v2',
      'M12 2v2',
      'M17 20v2',
      'M17 2v2',
      'M2 12h2',
      'M2 17h2',
      'M2 7h2',
      'M20 12h2',
      'M20 17h2',
      'M20 7h2',
      'M7 20v2',
      'M7 2v2',
      'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
      'M9 8h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z',
    ],
  },
  'map-pin': {
    type: 'stroke',
    paths: [
      'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0',
      'M15 10a3 3 0 0 1-6 0 3 3 0 0 1 6 0z',
    ],
  },
  // Pastilles : segment nul central (h.01) au lieu du fill des cercles
  // Lucide, sans quoi Chromium les évide.
  palette: {
    type: 'stroke',
    paths: [
      'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
      'M14 6.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0zm-.5 0h.01',
      'M18 10.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0zm-.5 0h.01',
      'M7 12.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0zm-.5 0h.01',
      'M9 7.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0zm-.5 0h.01',
    ],
  },
  smartphone: {
    type: 'stroke',
    paths: [
      'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
      'M12 18h.01',
    ],
  },
  server: {
    type: 'stroke',
    paths: [
      'M4 2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
      'M4 14h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z',
      'M6 6h.01',
      'M6 18h.01',
    ],
  },
  wrench: {
    type: 'stroke',
    paths: [
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z',
    ],
  },
  snowflake: {
    type: 'stroke',
    paths: [
      'M10 20l-1.25-2.5L6 18',
      'M10 4 8.75 6.5 6 6',
      'M14 20l1.25-2.5L18 18',
      'M14 4l1.25 2.5L18 6',
      'M17 21l-3-6h-4',
      'M17 3l-3 6 1.5 3',
      'M2 12h6.5L10 9',
      'M20 10l-1.5 2 1.5 2',
      'M22 12h-6.5L14 15',
      'M4 10l1.5 2L4 14',
      'M7 21l3-6-1.5-3',
      'M7 3l3 6h4',
    ],
  },
  'file-text': {
    type: 'stroke',
    paths: [
      'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z',
      'M14 2v5a1 1 0 0 0 1 1h5',
      'M10 9H8',
      'M16 13H8',
      'M16 17H8',
    ],
  },
  'file-code': {
    type: 'stroke',
    paths: [
      'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z',
      'M14 2v5a1 1 0 0 0 1 1h5',
      'M10 12.5 8 15l2 2.5',
      'M14 12.5l2 2.5-2 2.5',
    ],
  },
  'shield-check': {
    type: 'stroke',
    paths: [
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      'M9 12l2 2 4-4',
    ],
  },
  'flask-conical': {
    type: 'stroke',
    paths: [
      'M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2',
      'M6.453 15h11.094',
      'M8.5 2h7',
    ],
  },
  'gamepad-2': {
    type: 'stroke',
    paths: [
      'M6 11h4',
      'M8 9v4',
      'M15 12h.01',
      'M18 10h.01',
      'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z',
    ],
  },
  // Lucide « eighth-notes » : « music » n'en est plus qu'un alias.
  music: {
    type: 'stroke',
    paths: [
      'M21 16V3a1 1 0 0 0-1.28-.96l-10 2.917a1 1 0 0 0-.72.96V19',
      'M21 16a3 3 0 0 1-6 0 3 3 0 0 1 6 0z',
      'M9 19a3 3 0 0 1-6 0 3 3 0 0 1 6 0z',
    ],
  },
  wine: {
    type: 'stroke',
    paths: [
      'M8 22h8',
      'M7 10h10',
      'M12 15v7',
      'M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5z',
    ],
  },
  radio: {
    type: 'stroke',
    paths: [
      'M16.247 7.761a6 6 0 0 1 0 8.478',
      'M19.075 4.933a10 10 0 0 1 0 14.134',
      'M4.925 19.067a10 10 0 0 1 0-14.134',
      'M7.753 16.239a6 6 0 0 1 0-8.478',
      'M14 12a2 2 0 0 1-4 0 2 2 0 0 1 4 0z',
    ],
  },
  'messages-square': {
    type: 'stroke',
    paths: [
      'M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
      'M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1',
    ],
  },

  /* --- Marques du premier écran (Simple Icons, pleines) : les autres
         logos sont dans logos.ts, hors du bundle initial. --- */
  angular: {
    type: 'fill',
    paths: [
      'M16.71 17.71H7.29l-1.21 2.92L12 24l5.92-3.37-1.21-2.92zM14.69 0l7.83 16.86L23.34 4l-8.65-4zM9.31 0 .66 4l.82 12.86L9.31 0zM8.9 13.93h6.2L12 6.4l-3.1 7.53z',
    ],
  },
  typescript: {
    type: 'fill',
    paths: [
      'M1.13 0C.5 0 0 .5 0 1.13v21.75C0 23.5.5 24 1.13 24h21.75c.62 0 1.12-.5 1.12-1.12V1.13C24 .5 23.5 0 22.88 0zm17.36 9.75c.61 0 1.15.04 1.62.11a6.38 6.38 0 0 1 1.31.34v2.46a3.95 3.95 0 0 0-.64-.36 5.09 5.09 0 0 0-.72-.26 5.45 5.45 0 0 0-1.42-.2c-.3 0-.58.03-.82.08a2.1 2.1 0 0 0-.63.25c-.17.1-.3.23-.39.37a.89.89 0 0 0-.14.49c0 .2.05.37.16.53.1.16.25.3.44.44s.42.28.7.41c.27.14.58.28.92.42.47.2.89.41 1.27.63.37.22.69.47.96.75.27.28.47.6.61.96.15.36.22.77.22 1.25 0 .66-.13 1.21-.37 1.66a3.03 3.03 0 0 1-1.02 1.08 4.38 4.38 0 0 1-1.48.6c-.57.12-1.17.18-1.79.18a9.92 9.92 0 0 1-1.84-.17 5.54 5.54 0 0 1-1.52-.49v-2.63a5.03 5.03 0 0 0 3.24 1.2c.33 0 .62-.03.87-.09.25-.06.46-.14.63-.25.16-.11.29-.23.37-.38a1.02 1.02 0 0 0-.08-1.09 2.12 2.12 0 0 0-.53-.5 5.6 5.6 0 0 0-.81-.44 27.72 27.72 0 0 0-1.01-.44c-.91-.38-1.6-.85-2.05-1.4-.45-.56-.68-1.23-.68-2.01 0-.61.13-1.14.37-1.58.25-.44.58-.8 1.01-1.09a4.49 4.49 0 0 1 1.47-.63 7.54 7.54 0 0 1 1.77-.2zm-15.11.19h9.56v2.16H9.51v9.65H6.79V12.1H3.38z',
    ],
  },
  capacitor: {
    type: 'fill',
    paths: [
      'M24 3.7l-5.77 5.77 5.73 5.73-3.71 3.71L5.07 3.74 8.79.03l5.73 5.73L20.28 0 24 3.7zM.03 8.79l3.71-3.72 15.18 15.18-3.72 3.71-5.73-5.73L3.7 24 0 20.29l5.75-5.77L.03 8.79z',
    ],
  },
  github: {
    type: 'fill',
    paths: [
      'M12 .3C5.37.3 0 5.67 0 12.3c0 5.3 3.44 9.8 8.21 11.38.6.12.82-.26.82-.57 0-.29-.01-1.04-.02-2.04-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23.96-.26 1.98-.39 3-.4 1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.76.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.42.36.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .31.21.69.82.57C20.57 22.09 24 17.59 24 12.3c0-6.63-5.37-12-12-12',
    ],
  },
  // Absent de Simple Icons : dessiné à la main, « in » évidé.
  linkedin: {
    type: 'fill',
    paths: [
      'M2 0h20a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5.3 5.25a2.05 2.05 0 0 0-4.1 0 2.05 2.05 0 0 0 4.1 0zM3.5 9v11.5H7V9zm5.75 0v11.5h3.5v-5.9c0-1.65.7-2.85 2.3-2.85C16.6 11.75 17 13 17 14.5v6h3.5v-6.65c0-3-.95-5.1-4.15-5.1-1.75 0-3 .8-3.6 1.85V9z',
    ],
  },
} as const satisfies Record<string, IconDef>;

/** Nom d'une icône du registre. */
export type IconName = keyof typeof ICONS;
