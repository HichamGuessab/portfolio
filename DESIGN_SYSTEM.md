> Audit réalisé le 2026-07-22 — état du design system AVANT la passe d'amélioration (les incohérences listées en fin de document ont été corrigées depuis).

# Cartographie du design system — Portfolio Hicham Guessab

Audit factuel du code présent dans `/Users/hicham/dev/portfolio` (Angular 17 standalone + Tailwind CSS 3.4 + Swiper 11, Prettier + prettier-plugin-tailwindcss).

---

## 1. Couleurs

### 1.1 Palette déclarée (`tailwind.config.js`)

| Token | Hex | Usages réels dans `src/` | Où |
|---|---|---|---|
| `wildSand` | `#F5F5F5` | **0 — jamais utilisée** | — |
| `lightBlue` | `#53DCFD` | 16 | titres, gradients, bordures de cartes, texte des badges |
| `nightBlue` | `#0D1953` | 2 | fond du badge (`bg-nightBlue`), fond de la carte projet |
| `navyBlue` | `#0F2C57` | 4 | `hover:bg-navyBlue` (badge, lien projet), fond cartes expérience et éducation |
| `darkBlue` | `#040D39` | 1 | `bg-darkBlue` sur `<body>` (`src/index.html`) |
| `purple` | `#A88CFF` | 12 | uniquement comme fin de gradient (`to-purple`) |

### 1.2 Couleurs hors palette réellement utilisées

- **Palette Tailwind par défaut** : `text-white`, `border-white` (project-item, experience-item, app.component), `text-transparent` (technique bg-clip-text), et surtout `hover:text-blue-400` injecté via une chaîne HTML dans `src/app/services/project.service.ts` (ligne 12, description du projet Portfolio) — un bleu (#60A5FA) étranger à la charte.
- **CSS en dur dans `src/app/app.component.ts`** (styles inline des bullets Swiper) : `rgba(55, 150, 173, 0.56)`, `#0f2c57` (= navyBlue recopié), `rgba(83, 220, 253, 0.51)` (= lightBlue à 51 %), `#a88cff` (= purple recopié), `rgba(0, 0, 0, 0.2)`, `rgba(0, 0, 0, 0.3)`.
- **CSS en dur dans `src/app/components/projects-section/projects-section.component.scss`** : `#53dcfd` deux fois (bullet et bullet-active) au lieu du token `lightBlue`.
- **Valeurs arbitraires Tailwind** : aucune couleur du type `text-[#...]` dans les templates. Une seule valeur arbitraire trouvée, dimensionnelle : `h-[30rem]` (`experience-item.component.html`).

### 1.3 Motif de gradient signature

`bg-gradient-to-r from-lightBlue to-purple bg-clip-text text-transparent` : répété **~10 fois** à la main (h1 du profil, 4 `<strong>` du texte de profil, h2 de Projects/Experience/Education, skill « shiny »). Variante `bg-gradient-to-b` pour le h3 des cartes projet et pour la bordure-gradient (avatar profil, cadre carte projet via `p-px`).

---

## 2. Typographie

### 2.1 Polices déclarées vs chargées

`tailwind.config.js` déclare :
- `font-vremena` → `"Vremena Grotesk", sans-serif`
- `font-analogue` → `"Analogue Reduced", serif`

**Constat : aucun `@font-face` n'existe nulle part** (ni dans `src/styles.css`, ni dans `src/index.html`, ni ailleurs), et **aucun fichier de police** n'est présent (`src/assets/` ne contient que `images/`). Aucun `<link>` Google Fonts non plus.

Conséquences :
- `font-vremena` n'est de toute façon **jamais utilisé** dans aucun template.
- `font-analogue` est utilisé 4 fois (paragraphe « Ingenieur Logiciel » du profil + h2 de Projects/Experience/Education) mais **rend en réalité la police serif système** du navigateur.
- Le reste du site rend dans la pile sans-serif par défaut de Tailwind (aucune `fontFamily.sans` n'est surchargée).

### 2.2 Échelle de tailles utilisée (comptage réel dans les templates)

`text-sm` (1, badge) · `text-md` (1 — **classe inexistante en Tailwind**, badge) · `text-lg` (6) · `text-xl` (3) · `text-2xl` (6) · `text-3xl` (3) · `text-4xl` (2) · `text-5xl` (4, titres de sections) · `text-6xl` (1, h1 en md).

### 2.3 Graisses

`tailwind.config.js` redéclare `light: 300`, `regular: 400` (nom non standard, Tailwind dit `font-normal`), `medium`, `semibold`, `bold`. Utilisés : `font-light` (corps de texte, titres Skills), `font-regular` (h2 de sections), `font-medium` (h1, h2 profil, h3 cartes), `font-semibold` (skills shiny), `font-bold` (h3 projet). L'italique (`italic`) est systématique sur les descriptions et métadonnées de cartes.

### 2.4 Incohérences typographiques

- Le h2 « Skills » (`skills-section.component.html`) : `text-5xl font-light`, sans gradient, sans icône, sans `font-analogue` — alors que les trois autres sections utilisent `font-analogue text-5xl font-regular` + gradient + icône 14×14.
- Le h3 de carte projet est en gradient `to-b` `font-bold`, les h3 des cartes expérience/éducation sont en `text-white font-medium` — trois traitements de titre de carte.

---

## 3. Espacements et layout

### 3.1 Structure globale

- `src/index.html` : `<body class="bg-darkBlue">`.
- `src/app/app.component.html` : un `<swiper-container>` vertical plein écran (`h-screen w-full overflow-x-hidden text-white`, `mousewheel`, `css-mode`), 5 `<swiper-slide>` en `flex items-center justify-center overflow-x-hidden`, chaque section reçoit **`w-3/4`** (largeur de conteneur unique du site — pas de `max-w-*`, pas de `.container` racine).
- Les sections posent leur layout via `host: { class: ... }` dans le `@Component` (pattern répété : `flex flex-col` partout, + `gap-7 text-left` pour profile, `text-nowrap` pour skills).

### 3.2 Patterns de spacing relevés

- Titre de section : `mb-12` (4 occurrences, constant).
- Gaps : `gap-1, gap-2 (×4), gap-3 (×4), gap-4, gap-5 (×3), gap-6, gap-7, gap-14`, grille skills `gap-x-10 gap-y-16`.
- Indentations texte profil : `pl-5 md:pl-8` (h1, paragraphes) et `pl-3` (×4, cartes) — deux conventions de retrait cohabitent.
- Paddings de cartes disparates : projet `py-4` + `px-4`/`px-7` interne ; expérience `p-6` ; éducation `px-8 py-3` ; badge `px-4 py-2` ; lien projet `px-3 py-1`.

### 3.3 Dimensions de cartes (trois gabarits différents)

| Carte | Classes | Fichier |
|---|---|---|
| Projet | `h-52 w-72 md:w-96`, cadre gradient `p-px`, `bg-nightBlue` | `project-item.component.html` |
| Expérience | `h-[30rem] w-80`, `border border-lightBlue bg-navyBlue p-6` | `experience-item.component.html` |
| Éducation | `h-auto w-72`, `border border-lightBlue bg-navyBlue px-8 py-3` | `education-item.component.html` |

### 3.4 Grilles et breakpoints

- Seule grille : skills `grid grid-cols-2 gap-x-10 gap-y-16 md:flex md:flex-nowrap md:justify-center md:gap-14`.
- Breakpoints Tailwind utilisés : **`md:` (26 occurrences), `sm:` (4)** ; `lg:`, `xl:`, `2xl:` jamais utilisés.
- Breakpoints en CSS brut (media queries à la main pour masquer les flèches Swiper) : **480px** (`app.component.ts`), **540px** (`education-section.component.ts`), **640px** (`experience-section.component.ts` et `projects-section.component.scss`) — trois seuils différents pour le même besoin, dont deux (480/540) ne correspondent à aucun breakpoint Tailwind.
- La classe `.container` (Tailwind core) est appliquée aux 3 `<swiper-container>` internes (projects, experience, education).

---

## 4. Composants

### 4.1 Inventaire

| Composant | Sélecteur | Rôle | Réutilisation |
|---|---|---|---|
| `AppComponent` | `app-root` | shell Swiper vertical 5 slides | — |
| `ProfileSectionComponent` | `profile-section` | héro (h1, texte, avatar, badges) | 1× |
| `SkillsSectionComponent` | `skills-section` | grille de 4 catégories | 1× |
| `SkillCategoryComponent` | `skill-category` | colonne titrée de skills | **4×** (Design/Front/Back/Tools) |
| `SkillItemComponent` | `skill-item` | icône + nom (variante `shiny` gradient) | n× via `@for` |
| `ProjectsSectionComponent` | `projects-section` | Swiper cards de projets | 1× |
| `ProjectItemComponent` | `project-item` | carte projet (cadre gradient) | 11× via `@for` |
| `ExperienceSectionComponent` | `experience-section` | Swiper cards d'expériences | 1× |
| `ExperienceItemComponent` | `experience-item` | carte expérience | 4× via `@for` |
| `EducationSectionComponent` | `education-section` | Swiper cards de diplômes | 3× via `@for` |
| `EducationItemComponent` | `education-item` | carte diplôme | 3× |
| `BadgeComponent` | `badge` | pilule lien icône+texte | **3×** (Github/LinkedIn/Email) |

Données : `SkillService`, `ProjectService`, `ExperienceService`, `EducationService` (tableaux en dur, `providedIn: 'root'`). Types et enums d'assets dans `src/app/interfaces.ts` (`BlueImage`, `ShinyImage`, `WhiteImage`, `Link`, `SkillType`).

### 4.2 Réutilisé vs dupliqué

**Réutilisé** : `badge`, `skill-category`/`skill-item`, les trois `*-item` de cartes.

**Dupliqué (copier-coller, aucun composant partagé)** :
1. **En-tête de section** `<div class="mb-12 flex gap-5 place-self-center"><img class="h-14 w-14 …"/><h2 class="content-center bg-gradient-to-r from-lightBlue to-purple bg-clip-text font-analogue text-5xl font-regular text-transparent">…` — identique dans `projects-section.component.html`, `experience-section.component.html`, `education-section.component.html` (et divergent dans skills).
2. **CSS de masquage des flèches Swiper** — recopié 4 fois : styles inline de `app.component.ts`, `experience-section.component.ts`, `education-section.component.ts`, et `projects-section.component.scss` (seul fichier SCSS du projet, les autres utilisent `styles: []` inline — deux conventions de style co-existantes).
3. **Gradient texte** `from-lightBlue to-purple bg-clip-text text-transparent` — ~10 copies, dont 4 `<strong>` identiques dans `profile-section.component.html`.
4. **Config Swiper cards** (`effect="cards" cards-effect='{"slideShadows":false}' grab-cursor="true" navigation="true" class="container"`) — recopiée 3 fois, avec `pagination="true"` uniquement sur projects.
5. **Pattern service** `buildXxx()` + tableau en dur — recopié 4 fois (dont `EducationService.getProjects()` mal nommé).

---

## 5. Interactions et animations

- **Hover** : `hover:bg-navyBlue` (badge et bouton « Link » projet — cohérents entre eux), `hover:text-blue-400` (lien Figma injecté par `innerHTML` depuis `project.service.ts`), hover des bullets Swiper (gradient custom dans `app.component.ts`).
- **Transitions** : une seule dans les templates — la photo de profil : `blur-md transition-all duration-500` déflouté par un handler inline `onload="this.classList.remove('blur-md')"` (`profile-section.component.html`). Côté CSS : `transition: all 0.4s ease-in-out` sur les bullets.
- **Swiper** :
  - Niveau app : défilement **vertical**, `mousewheel="true"`, `css-mode="true"`, pagination custom (bullets 13×45px, gradient, `scale(1.2)` actif, ombres portées) via `::part(bullet)` / `::part(bullet-active)` dans `app.component.ts` ; flèches masquées < 480px.
  - Sections projects/experience/education : `effect="cards"` sans ombres, `grab-cursor`, `navigation` ; **pagination seulement sur projects**, positionnée par un nombre magique `top: 220px` (`projects-section.component.scss`), bullets `#53dcfd` avec `scale(1.5)` actif.
  - Aucun `keyboard="true"` sur aucun Swiper : la navigation entre slides n'est pas accessible au clavier.
- **Curseurs** : `cursor-pointer` explicite sur le bouton « Link », `grab-cursor` Swiper.

---

## 6. Accessibilité de base

- **Langue** : `<html lang="en">` (`src/index.html`) alors que le contenu visible est en français (« Hello ! Je suis », « Développeur web et mobile ») — les lecteurs d'écran prononceront le français avec une voix anglaise. À noter aussi : « Ingenieur Logiciel » sans accent, et un mélange FR (profil) / EN (titres de sections, toutes les données des services).
- **Landmarks** : aucun `<main>`, `<header>`, `<nav>`, `<footer>`, aucun `<section>` — uniquement des éléments custom (`profile-section`, etc.) sans rôle ARIA.
- **Hiérarchie de titres** : correcte dans l'ensemble (1 seul `<h1>` dans le profil, `<h2>` par section, `<h3>` dans les items/catégories).
- **Alt** : présents partout, mais de qualité inégale :
  - `project-item.component.html` : `[alt]="technology"` et `[alt]="WhiteImage.GithubMascot"` rendent des **chemins de fichiers** (`assets/images/white-….png`) comme texte alternatif.
  - `profile-section.component.html` : `alt="Profil photo"` (franglais, peu descriptif).
  - Icônes décoratives de sections avec `alt="Projects"/"Experiences"/"Education"` : redondantes avec le h2 adjacent (devraient être `alt=""`).
- **Sémantique interactive** :
  - `badge.component.html` : un `<a target="_blank">` (sans `rel="noopener noreferrer"`) contenant un `<div role="button">` — double sémantique lien/bouton incorrecte.
  - `project-item.component.html` : le bouton « Link » est un `<div (click)="openLink()">` — non focusable, sans rôle, inutilisable au clavier ; `window.open` au lieu d'un vrai `<a href>`.
- **Focus** : aucun style `focus:`/`focus-visible:` dans tout le projet ; combiné à l'absence de `keyboard` sur Swiper, le site est essentiellement souris/molette.
- **Contrastes (calculés, WCAG)** : globalement très bons — `lightBlue`/`nightBlue` 10.2:1, `lightBlue`/`darkBlue` 11.6:1, blanc/`navyBlue` 13.8:1, `purple`/`darkBlue` 7.0:1. Point le plus faible : `purple`/`nightBlue` 6.1:1 (AA ok, AAA raté de peu) — attention aux fins de gradient en `font-light` italique sur petits corps. `blue-400`/`nightBlue` 6.5:1 (ok mais hors charte).
- **Divers** : handler JS inline `onload` sur l'`<img>` de profil (bloquant sous CSP stricte) ; descriptions injectées par `[innerHTML]` depuis les services (contenu maîtrisé mais liens non focus-stylés).

---

## 7. Classes mortes et outillage

- `.text-gradient` utilisée sur le h1 (`profile-section.component.html`) mais **définie nulle part**.
- `.no-scrollbar` définie dans `src/styles.css` mais **utilisée nulle part**.
- `no-wrap` (host de `skill-category.component.ts`) et `sm:text-md` (`badge.component.html`) : classes **inexistantes en Tailwind** (les bonnes seraient `flex-nowrap`/`text-nowrap` et `sm:text-base`).
- `angular.json` inclut à la fois `src/styles.css` **et** `node_modules/tailwindcss/tailwind.css` dans `styles` : le CSS Tailwind (base/utilities) est généré et embarqué **deux fois**.
- Imports morts : `NgOptimizedImage` importé mais non utilisé (`skill-item.component.ts`), `Input` importé à côté de `input` (skill-item, skill-category, education-item), `RouterOutlet` importé sans `<router-outlet>` (`app.component.ts`, routes vides).
- 18 images `default-*.png` présentes dans `src/assets/images/` (non commitées) mais **référencées nulle part** dans le code (les enums d'`interfaces.ts` ne connaissent que `blue-`, `shiny-`, `white-`).
- Prettier + `prettier-plugin-tailwindcss` configurés (`.prettierrc`) : l'ordre des classes dans les templates est effectivement trié.

## Incohérences relevées lors de l'audit

- **tailwind.config.js + src/styles.css** — Polices "Vremena Grotesk" et "Analogue Reduced" déclarées dans fontFamily mais aucun @font-face ni fichier de police dans le projet (src/assets ne contient que images/) : font-analogue rend en serif système, font-vremena n'est de toute façon jamais utilisé.
- **angular.json** — Double inclusion de Tailwind dans build.options.styles : ['src/styles.css', 'node_modules/tailwindcss/tailwind.css'] — le CSS base/utilities est généré et livré deux fois.
- **src/app/components/profile-section/profile-section.component.html** — Classe text-gradient sur le h1 (ligne 7) jamais définie dans styles.css ni tailwind.config.js — classe morte.
- **src/app/components/badge/badge.component.html** — sm:text-md (ligne 4) n'existe pas en Tailwind (c'est text-base) — la taille responsive du badge est sans effet ; de plus <a target="_blank"> sans rel="noopener noreferrer" contenant un <div role="button"> (sémantique lien/bouton contradictoire).
- **src/app/components/skills-section/skill-category/skill-category.component.ts** — host class 'no-wrap' (ligne 10) n'existe pas en Tailwind (flex-nowrap / text-nowrap attendu) — classe sans effet.
- **src/styles.css** — Utilitaire .no-scrollbar défini mais utilisé nulle part dans les templates.
- **tailwind.config.js** — Couleur wildSand (#F5F5F5) déclarée mais jamais utilisée dans le code.
- **src/app/app.component.ts** — Styles inline des bullets Swiper avec couleurs en dur dupliquant la palette : #0f2c57 (navyBlue), #a88cff (purple), rgba(83,220,253,…) (lightBlue), plus rgba(55,150,173,0.56) hors palette ; media query à 480px qui ne correspond à aucun breakpoint Tailwind.
- **src/app/components/projects-section/projects-section.component.scss** — #53dcfd en dur (deux fois) au lieu du token lightBlue ; nombre magique top: 220px pour la pagination ; seul fichier .scss du projet alors que les autres composants utilisent styles inline — deux conventions de style.
- **src/app/services/project.service.ts** — Classe hover:text-blue-400 (palette Tailwind par défaut, hors charte) injectée via une chaîne HTML [innerHTML] dans la description du projet Portfolio (ligne 12).
- **src/app/components/experience-section/experience-item/experience-item.component.html** — Hauteur arbitraire h-[30rem] (ligne 2) alors que les cartes projet (h-52) et éducation (h-auto) suivent d'autres logiques — trois gabarits de carte non harmonisés (w-72/w-80, bordure gradient p-px + bg-nightBlue vs border-lightBlue + bg-navyBlue).
- **src/app/components/skills-section/skills-section.component.html** — Titre de section « Skills » stylé différemment des trois autres : text-5xl font-light sans gradient, sans icône et sans font-analogue, alors que Projects/Experience/Education utilisent font-analogue text-5xl font-regular + gradient lightBlue→purple + icône h-14 w-14.
- **src/app/components/projects-section/projects-section.component.html (+ experience-section, education-section)** — En-tête de section (div mb-12 + img + h2 gradient) copié-collé à l'identique dans trois templates au lieu d'un composant partagé ; config Swiper cards également dupliquée, avec pagination="true" uniquement sur projects (absente d'experience et education).
- **src/app/components/education-section/education-section.component.ts + experience-section.component.ts + app.component.ts + projects-section.component.scss** — CSS de masquage des flèches Swiper dupliqué quatre fois avec trois breakpoints différents pour le même besoin : 480px (app), 540px (education), 640px (experience et projects) — aucun n'est factorisé ni aligné sur les breakpoints Tailwind (sm=640).
- **src/app/components/projects-section/project-item/project-item.component.html** — Bouton « Link » implémenté en <div (click)> non focusable (pas de <a>/<button>, pas de gestion clavier) avec window.open ; alt des icônes = chemins de fichiers ([alt]="technology" et [alt]="WhiteImage.GithubMascot" rendent 'assets/images/white-….png') ; h3 en bg-gradient-to-b alors que tous les autres gradients texte sont to-r.
- **src/index.html** — lang="en" alors que le contenu du site est en français ; par ailleurs les titres de sections et toutes les données des services sont en anglais alors que le profil est en français (mélange de langues), et « Ingenieur Logiciel » est sans accent dans profile-section.component.html.
- **src/app/app.component.html** — Aucun landmark HTML (main/header/nav/section) — uniquement des éléments custom dans des swiper-slide ; aucun style focus:/focus-visible: dans tout le projet et pas de keyboard="true" sur les Swipers : navigation clavier impossible.
- **src/app/components/profile-section/profile-section.component.html** — Handler JS inline onload="this.classList.remove('blur-md')" sur l'image de profil (fragile sous CSP) ; alt="Profil photo" peu descriptif ; le motif gradient from-lightBlue to-purple bg-clip-text text-transparent y est copié 5 fois (h1 + 4 strong) sans factorisation.
- **src/app/components/skills-section/skill-item/skill-item.component.ts** — NgOptimizedImage importé mais jamais utilisé (le template utilise [src] classique) ; import { Input } inutilisé également présent ici, dans skill-category.component.ts et education-item.component.ts.
- **src/app/services/education.service.ts** — Méthode publique nommée getProjects() alors qu'elle retourne des diplômes (Degree[]) — nommage copié-collé depuis ProjectService.
- **src/assets/images/ (default-*.png)** — 18 images default-*.png présentes (non commitées, visibles au git status) mais référencées nulle part : les enums d'interfaces.ts ne déclarent que les préfixes blue-, shiny- et white-.
- **src/app/app.component.ts** — RouterOutlet importé dans le composant alors que le template ne contient pas de <router-outlet> et que app.routes.ts est vide.