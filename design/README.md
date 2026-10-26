# Sources des visuels

Fichiers sources et scripts de génération des images servies par le site.
Rien de ce dossier n'est déployé : seules les déclinaisons optimisées de
`src/assets/` le sont.

| Source                                                    | Déclinaisons                                                                                                                       | Script                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `portrait-source.png` (1024 × 1024)                       | `src/assets/images/portrait-{192,384,576,768}.{avif,webp}` + `portrait-768.jpg`                                                    | `scripts/make_portraits.py` |
| `favicon-source.png` (1900 × 1900, portrait rond détouré) | `src/favicon.ico` (16/32/48) + `src/assets/icons/*.png` (favicons, apple-touch-icon, icônes du manifeste dont la version maskable) | `scripts/make_icons.py`     |
| `og/og.html`                                              | `src/assets/og-image.jpg` (1200 × 630, carte de partage)                                                                           | `og/render.js`              |

## Regénérer

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install pillow numpy imagequant pyoxipng

# Portraits responsives (AVIF, WebP, JPEG de repli)
python -I design/scripts/make_portraits.py design/portrait-source.png src/assets/images

# Favicons et icônes du manifeste : candidats dans /tmp, puis installation dans src/
python -I design/scripts/make_icons.py design/favicon-source.png /tmp/icons --install src

# Carte Open Graph (Playwright), puis conversion JPEG q90
node design/og/render.js design/og/og.html /tmp/og.png
```

Les petites tailles de favicon (16 à 48 px) recadrent plus serré sur le
visage et sont légèrement accentuées, pour rester lisibles dans un onglet.
