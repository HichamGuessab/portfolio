import { RenderMode, ServerRoute } from '@angular/ssr';

/* Site statique (GitHub Pages) : l'unique page est pré-rendue au build. */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
