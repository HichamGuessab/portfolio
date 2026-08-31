# Portfolio — Hicham Guessab

Portfolio personnel de Hicham Guessab, développeur web et mobile spécialisé
Front-End. Application Angular en une page, en français, déployée sur GitHub
Pages.

**En ligne : [hichamguessab.com](https://hichamguessab.com/)**

> **Sur l'assistance IA :** les 48 premiers commits de ce dépôt (janvier →
> août 2025) sont écrits à la main, sans IA. Seuls les commits de juillet 2026
> et suivants ont été développés avec Claude Code. Le détail et la commande
> pour le vérifier : [Historique du projet](#historique-du-projet).

---

## Aperçu

Le site propose deux expériences de navigation :

- **Diaporama** (par défaut) — une section par écran, défilement vertical
  géré par Swiper : profil, projets, compétences, expériences, formation.
- **Compact « pont de commandement »** — une grille bento sur une seule page
  plein écran, sans défilement, ceinturée d'un cadre-circuit. Réservé aux
  écrans d'au moins 1024 × 620 px.

La bascule entre les deux n'a pas de bouton : c'est un secret gardé par les
mascottes. Un **triple-clic sur l'un des deux compagnons** fait basculer le
mode sur ordinateur.

Le duo de mascottes est permanent : les personnages se promènent en bas de
l'écran, discutent en bulles, réagissent à la page et escaladent par moments
l'interface — tuiles projets, console, badges, cadre — sans jamais bloquer un
clic. Sur mobile, ils sont réduits et réagissent aux capteurs du téléphone
(inclinaison, secousse) après un premier toucher.

## Stack

| Outil | Version |
|---|---|
| Angular (standalone, signals) | 22 |
| TypeScript | 6 |
| Tailwind CSS | 4 (tokens via `@theme` dans `src/styles.css`) |
| Swiper | 14 (`swiper-container`) |
| Prettier + `prettier-plugin-tailwindcss` | 3 |
| Déploiement | `angular-cli-ghpages` → branche `gh-pages` |

Node : `^22.22.3 || ^24.15.0 || >=26.0.0` (voir `.nvmrc`).

## Démarrage

```bash
npm ci
npm start          # serveur de développement sur http://localhost:4200
npm run build      # build de production dans dist/porte-folio
npm run format     # Prettier sur l'ensemble du dépôt
npx ng deploy      # publie dist/porte-folio sur la branche gh-pages
```

## Structure

```
src/app/
├── components/     profile, projects, skills, experience, education,
│                   compact-board, mascot, screen-frame, section-header, badge
├── services/       contenu (skill, project, experience, education) +
│                   view-mode (diaporama/compact) et motion (animations)
├── directives/
└── interfaces.ts   enums et interfaces partagées (Skill, Image, Link, Section)
```

Le contenu du site — compétences, projets, expériences, formation — est
déclaré dans les services, pas dans les templates.

`DESIGN_SYSTEM.md` documente la cartographie du design system (couleurs,
typographie, espacements) telle qu'auditée avant la passe d'amélioration de
juillet 2026.

## Historique du projet

Ce dépôt couvre deux périodes nettement séparées — près d'un an les sépare.
La distinction est explicite pour que le travail de la première période reste
lisible pour ce qu'il est.

| Période | Commits | Méthode |
|---|---|---|
| **Janvier → août 2025** | les 48 premiers, jusqu'à `3db0e8c` — tag [`v1.0-handcrafted`](https://github.com/HichamGuessab/portfolio/releases/tag/v1.0-handcrafted) | Écrits **à la main, sans assistance IA**. Architecture Angular, découpage en composants et services, design system, intégration, responsive, mise en ligne : l'intégralité du site tel qu'il existait alors. |
| **Juillet 2026 →** | tous les suivants, à partir de `3c43939` | Développés **avec Claude Code** en pair-programming : montée de version Angular 17 → 22 et Tailwind 3 → 4, mode compact, mascottes, passe design system / a11y / SEO. |

Chaque commit de la seconde période porte un trailer `Co-Authored-By: Claude`.
Aucun commit de la première n'en porte — la frontière est donc vérifiable
directement dans l'historique :

```bash
# Les commits assistés par IA
git log --grep='Co-Authored-By: Claude' --oneline

# Tout ce qui précède, écrit à la main — 48 commits, aucun assisté
git log v1.0-handcrafted --oneline
```
