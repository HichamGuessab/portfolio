# Design system — Portfolio Hicham Guessab

> Référence à jour de la refonte d'octobre 2026 (page défilante pré-rendue).
> L'audit de juillet 2026 qui l'a précédée reste consultable dans
> l'historique : `git show 276bbd6:DESIGN_SYSTEM.md`.

## 1. Principes

1. **Lisible en trente secondes.** Le premier écran dit qui, quoi, où en
   est la disponibilité et comment agir ; chaque section se parcourt sans
   clic (fini les carrousels qui cachaient 10 projets sur 11).
2. **Le contenu d'abord.** Le HTML est pré-rendu au build ; JavaScript ne
   fait qu'enrichir (apparitions, section active, mascottes).
3. **Une signature, utilisée avec parcimonie.** Le dégradé lightBlue →
   purple marque les points d'attention : le nom, l'action principale, la
   stack principale, le diplôme le plus élevé, les liserés au survol.
4. **Le circuit.** Tirets, nœuds, numéros HUD (`01` → `05`) et police mono
   relient la page au mode compact et à son cadre-circuit.
5. **Un mouvement qui ne coûte rien.** Seuls `opacity` et `transform` sont
   animés ; le décor s'arrête avec `prefers-reduced-motion`.

## 2. Couleurs

Tokens déclarés dans `@theme` (`src/styles.css`), miroirs en variables CSS
(`--light-blue`…) pour les styles hors Tailwind.

| Token       | Hex       | Rôle                                             |
| ----------- | --------- | ------------------------------------------------ |
| `darkBlue`  | `#040D39` | fond de page                                     |
| `nightBlue` | `#0D1953` | surface des cartes                               |
| `navyBlue`  | `#0F2C57` | survols (badges du mode compact)                 |
| `lightBlue` | `#53DCFD` | couleur d'accent, liens, focus, début du dégradé |
| `purple`    | `#A88CFF` | fin du dégradé                                   |
| `wildSand`  | `#F5F5F5` | titres et texte fort                             |

Texte sur fond sombre : blanc à opacité décroissante, jamais sous `/55` pour
un texte lisible (ratios WCAG mesurés sur `nightBlue`) :

| Classe              | Usage                     | Contraste |
| ------------------- | ------------------------- | --------- |
| `text-wildSand`     | titres                    | 15,0:1    |
| `text-white/75`     | corps de texte            | 9,6:1     |
| `text-white/65`     | texte secondaire          | 7,5:1     |
| `text-white/55`     | métadonnées (petit corps) | 5,7:1     |
| `text-lightBlue/80` | dates, durées (mono)      | 6,9:1     |

Boutons principaux : texte `darkBlue` sur le dégradé — 11,6:1 côté
lightBlue, 7,0:1 côté purple.

## 3. Typographie

| Rôle                                          | Police                         | Détails                                                                                                                                         |
| --------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Titres, chiffres, navigation (`font-display`) | Space Grotesk variable 300–700 | auto-hébergée (`src/assets/fonts`, sous-ensemble latin, 22 Ko), préchargée, `font-display: swap`, fallback Arial recalé (`size-adjust` 108,9 %) |
| Texte courant (`font-sans`)                   | police système                 | zéro octet, rendu natif                                                                                                                         |
| Sur-titres, dates, numéros HUD (`font-mono`)  | `ui-monospace`                 | majuscules espacées (`tracking-[0.2em]`)                                                                                                        |

Échelle : nom du héros `clamp(2.5rem, 11vw, 4.5rem)` puis `min(5rem, 6.6vw)`
dès `lg` (une seule ligne) · titres de section `text-4xl` → `md:text-5xl` ·
titres de carte `text-xl` à `text-2xl` · corps `text-base` / `text-lg` ·
métadonnées `text-xs` mono.

## 4. Mise en page

- Conteneur `max-w-6xl`, gouttières `px-5` / `sm:px-8`.
- Sections `py-20` / `md:py-28` ; `scroll-padding-top: 4rem` sur `html` :
  ancres et focus clavier s'arrêtent sous l'en-tête collant (64 px).
- Cartes `rounded-2xl`, `p-6` / `md:p-7`, liseré 1 px (`white/8`) ou cadre
  dégradé (`p-px` + fond `nightBlue`).
- Breakpoints Tailwind uniquement (`sm` 640, `md` 768, `lg` 1024).
- Expérience : colonne d'intro collante + frise (`lg`). Projets : grille
  2 × 2 puis liste d'archive. Compétences : bento 3 colonnes. Formation :
  frise horizontale (`md`) ou verticale.

## 5. Composants

| Composant / classe                                                          | Rôle                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `site-header`                                                               | en-tête collant, monogramme, navigation par ancres avec `aria-current`, menu mobile en surimpression, barre de progression de lecture |
| `section-header`                                                            | sur-titre numéroté + titre + chapô (`default`), ou en-tête de cellule du mode compact (`mini`)                                        |
| `profile-section`                                                           | héros (`hero`) ou cellule identité du mode compact (`compact`)                                                                        |
| `experience-item`                                                           | carte d'organisation, postes en mini-frise                                                                                            |
| `project-item`                                                              | grande carte (`featured`) ou ligne d'archive (`compact`), lien étiré vers le dépôt                                                    |
| `education-item`                                                            | carte de diplôme, liseré dégradé pour le plus élevé                                                                                   |
| `tech-chip`                                                                 | pastille logo + nom de marque, variante `primary` dégradée                                                                            |
| `contact-section`, `site-footer`                                            | appel à l'action final, copie d'e-mail, version imprimable                                                                            |
| `app-icon`, `app-icon-defs`                                                 | icônes SVG en ligne (registre `icons.ts`, logos différés dans `logos.ts`), dégradé partagé                                            |
| `app-portrait`                                                              | portrait responsive AVIF / WebP / JPEG                                                                                                |
| `compact-board`, `screen-frame`, `badge`                                    | mode compact secret                                                                                                                   |
| `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-lg`, `.icon-btn`, `.link-arrow` | actions                                                                                                                               |
| `.stretched-link`                                                           | une carte entière cliquable, un seul arrêt de tabulation                                                                              |

## 6. Mouvement

| Effet                    | Mécanique                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Entrée du héros          | CSS pur (`hero-rise`, décalages de 60 à 380 ms), joue dès l'affichage du HTML pré-rendu                                 |
| Apparition au défilement | directive `[reveal]` : n'arme que les éléments encore hors écran après le premier rendu                                 |
| Décor du portrait        | orbite en tirets (60 s), pastilles flottantes (7 s), onde de disponibilité                                              |
| Halo au pointeur         | `[data-spotlight]` + directive `spotlightZone` : deux variables CSS par frame, ordinateur uniquement                    |
| Progression de lecture   | `animation-timeline: scroll()`, sans JavaScript                                                                         |
| Mouvement réduit         | apparitions en fondu seul, boucles décoratives coupées ; les mascottes gardent leur comportement (voir `MotionService`) |

## 7. Accessibilité

- Lien d'évitement vers `main#contenu`, landmarks `header` / `nav` / `main` /
  `footer`, chaque section étiquetée par son titre (`aria-labelledby`).
- Hiérarchie `h1` (nom) → `h2` (sections) → `h3` (cartes) → `h4` (postes,
  autres projets).
- Focus visible (anneau lightBlue), menu mobile `aria-expanded` /
  `aria-controls`, fermeture à Échap avec retour du focus.
- Liens externes annoncés « (nouvel onglet) », icônes décoratives
  `aria-hidden`, confirmation de copie dans une région `aria-live`.
- Impression : document clair, liens utiles suivis de leur adresse.

## 8. Accroches des mascottes

Les mascottes lisent la page sans jamais la modifier ; les composants
exposent des attributs stables :

| Attribut              | Éléments                                                      |
| --------------------- | ------------------------------------------------------------- |
| `data-perch="photo"`  | cadre du portrait du héros                                    |
| `data-perch="title"`  | en-têtes de section                                           |
| `data-perch="card"`   | cartes (expérience, projets, compétences, formation, contact) |
| `data-perch="chip"`   | pastilles de compétences                                      |
| `data-perch="social"` | liens GitHub, LinkedIn, e-mail                                |

La section lue est fournie par `SectionSpyService` ; le mode compact garde
ses propres accroches (`data-circuit`, `#project-console`…).
