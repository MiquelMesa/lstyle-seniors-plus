# Desplegament a la VPS — Estructura de projectes

## Model (un projecte = una carpeta)

```
/var/www/michaelprojects/
├── index.html                 ← menú d’enllaços
├── MyCalendar/                ← estàtic
├── marcadores/                ← Node (PM2 :3000), URL pública /marcadores/
└── lstyle-seniors-plus/       ← SPA + api/ (PHP) — estructura PLANA
```

> ⚠️ **Estructura plana (no anidada).** La carpeta del projecte es `lstyle-seniors-plus/`
> i els fitxers hi són directament (`index.html`, `css/`, `js/`, `config/`, `utils/`,
> `VideoIntro/`, `Backend/`, `BaseDeDades/`). **No** hi ha `lstyle-seniors-plus/lstyle-seniors-plus/`
> (un anidament accidental fa que la URL curta `/lstyle-seniors-plus/` doni 403/404).

### Contingut de `lstyle-seniors-plus/`

| Fitxer / carpeta | Descripció |
|------------------|------------|
| `index.html` | Frontend SPA (5 pantalles + intro diapositives) |
| `css/` | Estils (estils, pantalles, formulari, pantalla-video, disclaimer) |
| `js/` | Lògica (app, formulari, resultats, motor-dieta, video-bienvenida) |
| `config/` | Configuració del frontend (`api-config.js`) |
| `utils/` | Seguretat + client d'API |
| `VideoIntro/` | **Imatges de la intro (6 PNG + PDF)** — necessària per al frontend |
| `img/` | Icons, estacions, imatges generals |
| `Backend/` | API PHP (config, middleware, endpoints) |
| `BaseDeDades/` | Scripts SQL (NO pujar al web) |

## Nginx

Fitxer de referència al PC: `Backend/nginx-michaelprojects.conf`  
Destí VPS: `/etc/nginx/sites-available/michaelprojects`

```bash
sudo nano /etc/nginx/sites-available/michaelprojects
# enganxar el contingut de nginx-michaelprojects.conf
sudo nginx -t
sudo systemctl reload nginx
pm2 list   # marcadors ha d’estar online al port 3000
```

## URLs

| App | URL |
|-----|-----|
| Portafoli | `https://michaelprojects.org/` |
| MyCalendar | `https://michaelprojects.org/MyCalendar/` |
| Marcadors | `https://michaelprojects.org/marcadores/` |
| LSTYLE | `https://michaelprojects.org/lstyle-seniors-plus/` |
| API LSTYLE | `https://michaelprojects.org/lstyle-seniors-plus/Backend/endpoints/` |

> **Nota API:** la ruta real de la API és `Backend/endpoints` (no `api/endpoints`).
> El `config/api-config.js` del frontend usa `BASE_URL: '.../Backend/endpoints'`.
> La ruta antiga `api/endpoints` ja no existeix (404) i s'ha d'evitar.

## Seguretat

- `location ~ /\.` denega `.env`, `.git`, etc.
- Carpeta física `/marcadors/` redirigeix a `/marcadores/` (proxy Node)
- PHP només via `location ~ \.php$` + API Key als endpoints
