# Desplegament a la VPS — Estructura de projectes

## Model (un projecte = una carpeta)

```
/var/www/michaelprojects/
├── index.html                 ← menú d’enllaços
├── MyCalendar/                ← estàtic
├── marcadors/                 ← Node (PM2 :3000), URL pública /marcadores/
└── lstyle-seniors-plus/       ← SPA + api/ (PHP)
```

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
| API LSTYLE | `https://michaelprojects.org/lstyle-seniors-plus/api/endpoints/` |

## Seguretat

- `location ~ /\.` denega `.env`, `.git`, etc.
- Carpeta física `/marcadors/` redirigeix a `/marcadores/` (proxy Node)
- PHP només via `location ~ \.php$` + API Key als endpoints
