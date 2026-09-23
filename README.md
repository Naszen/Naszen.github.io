# naszen.github.io

Portfolio de David Tejedor Ayet y web de privacidad y soporte de sus apps. HTML, CSS y JS escritos a mano: no hay
paso de build, lo que está en el repo es lo que publica GitHub Pages desde `master`.

## Estructura

```
index.html                 portada
cv/                        CV (web + impresión A4)
files/cv-es.pdf, cv-en.pdf PDF del CV (cv.pdf = copia de cv-es.pdf)
<app>/                     página de la app (schede, keppi, plantiario, cooktribe, quicksound)
<app>/privacy/             política de privacidad (URL para App Store Connect)
<app>/support/             soporte (URL para App Store Connect)
404.html
assets/css/site.css        sistema de diseño y componentes
assets/css/legal.css       páginas de privacidad y soporte
assets/css/cv.css          CV en pantalla e impresión
assets/js/i18n.js          selector de idioma
assets/js/site.js          animaciones e interacciones
assets/js/analytics.js     Google Analytics 4 + consentimiento
assets/img/                iconos de las apps, foto e imagen para compartir (og.png)
tools/                     verificación y utilidades (no se enlaza desde el sitio)
```

## Probar en local

```sh
tools/serve.sh                 # http://localhost:8000
node tools/check.mjs           # enlaces, pares de idioma, reglas de analítica, textos legales de Plantiario
node tools/test-i18n.mjs       # lógica de selección de idioma
```

Ejecuta `node tools/check.mjs` antes de cada commit.

## Idiomas

Cada texto existe dos veces, una por idioma:

```html
<span data-lang="es">Hola</span><span data-lang="en">Hello</span>
```

El atributo `data-lang` de `<html>` decide cuál se ve. El título y la descripción de cada página están en
`data-title-es`, `data-title-en`, `data-desc-es` y `data-desc-en`, en `<html>`. Si cambias un texto, cambia los dos
idiomas; `check.mjs` avisa si falta la pareja de algún texto.

El idioma se elige así: `?lang=es|en` en la URL, luego la elección guardada del visitante y luego el idioma del
navegador (inglés si empieza por `en`; español en cualquier otro caso).

## Añadir una app

1. Copia las carpetas de una app existente (`schede/`, `schede/privacy/`, `schede/support/`) con el nuevo slug.
2. Cambia el color (`--app` en `<body>`), el icono (`assets/img/apps/<slug>.png` a 512 px, más `<slug>-256.png`),
   los títulos, los textos y los enlaces.
3. En las páginas de la app, cambia `data-app="<slug>"` en `<body>`.
4. Añade su tarjeta al bento de `index.html` y una línea al CV.
5. Ejecuta `node tools/check.mjs`.

### Cuando una app se publique

Sustituye la etiqueta «Próximamente» por el enlace a la App Store con la insignia oficial, y añade
`data-ga="store_click" data-ga-app="<slug>"` al enlace para medir los clics.

URLs para App Store Connect:

- Privacidad: `https://naszen.github.io/<slug>/privacy/` (versión en inglés: añade `?lang=en`)
- Soporte: `https://naszen.github.io/<slug>/support/`

## CV

Edita `cv/index.html`: la experiencia está duplicada respecto a la portada a propósito, porque el sitio no tiene
build. Después regenera los PDF:

```sh
tools/cv-pdf.sh   # necesita Google Chrome; comprueba que cada PDF ocupa una página
```

## Google Analytics 4

La analítica solo se carga en la portada, el CV y las páginas de las apps (nunca en privacidad, soporte ni 404).
Usa Consent Mode v2: sin permiso no se guardan cookies, y Google modela esas visitas.

### Configuración en GA (una sola vez)

1. **Excluir tu propio tráfico:** abre `https://naszen.github.io/?internal=1` una vez en cada navegador que uses.
   Desde entonces esas visitas llevan `traffic_type=internal`. En GA ve a Administrar › Recogida y modificación de
   datos › Filtros de datos › «Internal Traffic» y ponlo en **Activo**. Para desmarcar un navegador, usa
   `?internal=0`.
2. **Dimensiones personalizadas:** en Administrar › Definiciones personalizadas crea dimensiones de ámbito
   *evento* para `site_language`, `app_name`, `section`, `method`, `location`, `language`, `from` y `to`.
3. **Informes útiles:** Interacción › Páginas y pantallas, agrupado por *Grupo de contenido* (`home`, `cv`, `app`),
   y Eventos para `cv_download`, `app_open`, `contact_click`, `email_copy`, `language_change` y `section_view`.
4. **Depurar:** añade `?gadebug=1` a la URL y usa DebugView. En `localhost` no se envía nada; para probar en local,
   usa `?gatest=1`. Con `?noga=1` no se carga GA.

### Eventos

| Evento | Parámetros | Cuándo |
|---|---|---|
| `page_view` | `content_group`, `site_language` | Al cargar la página |
| `cv_view` | `language` | Al abrir `/cv/` |
| `app_page_view` | `app_name` | Al abrir la página de una app |
| `cv_download` | `language` | Descarga del PDF |
| `app_open` | `app_name`, `location` | Clic en una app |
| `contact_click` | `method` (`email`, `linkedin`, `github`) | Clic en un contacto |
| `email_copy` | — | Copiar el email |
| `language_change` | `from`, `to` | Cambio de idioma |
| `section_view` | `section` | Se ve el 40 % de una sección (una vez por visita) |
| `store_click` | `app_name` | Clic en el enlace de la App Store (cuando exista) |
