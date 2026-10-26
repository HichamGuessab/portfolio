# Portfolio — Hicham Guessab

Portfolio personnel de Hicham Guessab, ingénieur logiciel et développeur web
et mobile spécialisé Front-End. Application Angular d'une seule page, en
français, pré-rendue en HTML statique et déployée sur GitHub Pages.

**En ligne : [hichamguessab.com](https://hichamguessab.com/)**

> **Sur l'assistance IA :** les 48 premiers commits de ce dépôt (janvier →
> août 2025) sont écrits à la main, sans IA. Seuls les commits de juillet 2026
> et suivants ont été développés avec Claude Code. Le détail et la commande
> pour le vérifier : [Historique du projet](#historique-du-projet).

---

## Aperçu

Une page qui défile, pensée pour être lue en trente secondes par un
recruteur :

1. **Profil** — disponibilité, identité, accroche, appels à l'action
   (projets, contact) et chiffres clés calculés depuis les données.
2. **Expérience** — frise chronologique ; l'alternance puis le CDI chez CBA
   forment une seule carte pour rendre la progression lisible.
3. **Projets** — quatre projets mis en avant, puis une liste d'archive.
4. **Compétences** — grille bento par famille, stack principale au liseré
   dégradé.
5. **Formation** — frise du baccalauréat au Master.
6. **Contact** — e-mail (avec copie en un clic), LinkedIn, GitHub et une
   version imprimable propre (export PDF).

L'en-tête collant suit la section lue (scroll-spy) et affiche la progression
de lecture. Le mode **compact « pont de commandement »** existe toujours :
une grille bento sur un seul écran, sans défilement, ceinturée d'un
cadre-circuit (écrans d'au moins 1024 × 620 px). La bascule n'a pas de
bouton : c'est un secret gardé par les mascottes — **un triple-clic sur l'un
des deux compagnons**.

Le duo de mascottes est permanent : les personnages se promènent en bas de
l'écran, discutent en bulles, commentent la section lue et escaladent par
moments l'interface (cartes, badges, cadre) sans jamais bloquer un clic. Sur
mobile, ils sont réduits et réagissent aux capteurs du téléphone (inclinaison,
secousse) après un premier toucher.

## Stack

| Outil                                                                   | Version                                       |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| Angular (standalone, signals, zoneless)                                 | 22                                            |
| Pré-rendu statique + hydratation (`@angular/ssr`, `outputMode: static`) | 22                                            |
| TypeScript                                                              | 6                                             |
| Tailwind CSS                                                            | 4 (tokens via `@theme` dans `src/styles.css`) |
| Prettier + `prettier-plugin-tailwindcss`                                | 3                                             |
| Déploiement                                                             | `angular-cli-ghpages` → branche `gh-pages`    |

Node : `^22.22.3 || ^24.15.0 || >=26.0.0` (voir `.nvmrc`).

## Démarrage

```bash
npm ci
npm start          # serveur de développement sur http://localhost:4200
npm run build      # build de production pré-rendu dans dist/porte-folio/browser
npm test           # tests unitaires (Karma + Chrome)
npm run format     # Prettier sur l'ensemble du dépôt
npx ng deploy      # publie dist/porte-folio/browser sur gh-pages (CNAME inclus)
```

## Performance

Lighthouse (mesure locale, octobre 2026) : **99** en performance, **100** en
accessibilité, bonnes pratiques et SEO, sur mobile comme sur ordinateur —
contre 60 en performance mobile avant la refonte (LCP 17,1 s → 1,6 s, poids
de page 3,8 Mo → moins de 200 Ko, CLS 0).

- **HTML pré-rendu** au build : le contenu s'affiche avant le JavaScript. CSS
  critique en ligne.
- **Hydratation incrémentale** : seuls l'en-tête et le héros s'hydratent au
  chargement ; chaque section suivante charge son code et s'hydrate en
  entrant à l'écran (les clics précoces sont rejoués).
- **Zoneless**, sans routeur ni bibliothèque de carrousel : ~87 Ko compressés
  de JS + CSS au premier chargement.
- **Chargement différé** (`@defer`) : les mascottes arrivent quand le
  navigateur est inoccupé, le mode compact seulement quand il est activé.
- **Images** : portrait en AVIF / WebP responsive (≈ 4 à 31 Ko au lieu de
  1,4 Mo), icônes en SVG en ligne, favicons dédiés.
- **Une seule police web** (Space Grotesk, 22 Ko, préchargée) avec un
  fallback aux métriques recalées : pas de saut de mise en page.

## Accessibilité et SEO

Lien d'évitement, landmarks, hiérarchie de titres, navigation clavier
complète, focus visible, contrastes ≥ 4,5:1 (WCAG AA), libellés des liens
externes, confirmation vocale de la copie d'e-mail, `prefers-reduced-motion`
respecté pour le décor. Balises Open Graph avec carte de partage 1200 × 630,
données structurées `Person` / `WebSite`, `sitemap.xml`, `robots.txt`,
manifeste web.

## Structure

```
src/app/
├── components/     profile, experience, projects, skills, education, contact,
│                   site-header, site-footer, section-header, tech-chip,
│                   portrait, icon (registre SVG), compact-board, screen-frame,
│                   badge, mascot
├── services/       contenu (profile, project, experience, skill, education),
│                   section-spy (section lue), view-mode (page / compact),
│                   motion (animations)
├── directives/     reveal (apparition), spy-section, spotlight (halo)
├── data/           technologies (nom + logo), period (dates françaises)
└── interfaces.ts   types partagés
design/             sources des visuels et scripts de génération
```

Le contenu du site — profil, expériences, projets, compétences, formation —
est déclaré dans les services, pas dans les templates : modifier un texte ou
ajouter un projet ne touche aucun composant.

`DESIGN_SYSTEM.md` documente le design system : couleurs, typographie,
composants, mouvement, accessibilité.

## Crédits

Icônes d'interface : [Lucide](https://lucide.dev) (ISC). Logos :
[Simple Icons](https://simpleicons.org) (CC0 ; Angular CC BY 4.0, Git et
Android CC BY 3.0, GNU Bash MIT) — les marques restent la propriété de leurs
détenteurs. Police : [Space Grotesk](https://github.com/floriankarsten/space-grotesk)
(SIL OFL 1.1, voir `src/assets/fonts/OFL.txt`).

## Historique du projet

Ce dépôt couvre deux périodes nettement séparées — près d'un an les sépare.
La distinction est explicite pour que le travail de la première période reste
lisible pour ce qu'il est.

| Période                 | Commits                                                                                                                                 | Méthode                                                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Janvier → août 2025** | les 48 premiers, jusqu'à `3db0e8c` — tag [`v1.0-handcrafted`](https://github.com/HichamGuessab/portfolio/releases/tag/v1.0-handcrafted) | Écrits **à la main, sans assistance IA**. Architecture Angular, découpage en composants et services, design system, intégration, responsive, mise en ligne : l'intégralité du site tel qu'il existait alors.                    |
| **Juillet 2026 →**      | tous les suivants, à partir de `3c43939`                                                                                                | Développés **avec Claude Code** en pair-programming : montée de version Angular 17 → 22 et Tailwind 3 → 4, mode compact, mascottes, passe design system / a11y / SEO, puis refonte en page défilante pré-rendue (octobre 2026). |

Chaque commit de la seconde période porte un trailer `Co-Authored-By: Claude`.
Aucun commit de la première n'en porte — la frontière est donc vérifiable
directement dans l'historique :

```bash
# Les commits assistés par IA
git log --grep='Co-Authored-By: Claude' --oneline

# Tout ce qui précède, écrit à la main — 48 commits, aucun assisté
git log v1.0-handcrafted --oneline
```
