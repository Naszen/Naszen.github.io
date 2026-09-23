# Rediseño del portfolio y CV — Diseño

Fecha: 2026-09-23 · Repo: `Naszen/Naszen.github.io` (GitHub Pages, despliegue desde la rama `master`)

## 1. Objetivo

El sitio cumple dos funciones:

1. **Portfolio** de David Tejedor Ayet, desarrollador iOS senior especializado en SwiftUI.
2. **Web de soporte legal de sus apps**: páginas de privacidad y soporte que exige App Store Connect.

Se rehace entero con un diseño moderno, visual, interactivo e impactante, con textos más atractivos y un CV nuevo.

**Criterios de éxito**

- Un reclutador entiende en 5 segundos quién es David y qué construye.
- Las apps lucen como productos reales.
- Las URLs legales de Plantiario siguen funcionando.
- El sitio se mantiene a mano, sin paso de build.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Dirección visual | **A · Oscuro cinematográfico** (keynote de Apple, degradados, bento de cristal) |
| Tecnología | HTML, CSS y JS **escritos a mano, sin build ni dependencias** (se eliminan Bootstrap, jQuery, AOS y now-ui-kit) |
| Idioma | ES y EN. **El selector cambia de verdad el idioma** en todas las páginas, incluidas las legales de Plantiario. Nunca se muestran los dos a la vez |
| CV | Página `/cv/` imprimible en A4 y PDF en ES y EN generados con un script de Chrome sin interfaz |
| Ciberseguridad | Valor añadido («privacidad por diseño»), sin sección propia |
| Contacto en la web | Portfolio y CV: `davidtejedorayet@gmail.com`. Legales y soporte de las apps: `naszen013@gmail.com`. Outlook desaparece. Además, LinkedIn y GitHub (Naszen). **Teléfono solo en el PDF del CV**. |
| Apps visibles | Schede, Keppi, Plantiario, CookTribe y Quick Sound Repository. **DropAlert queda oculta** |
| Legales | Páginas de privacidad y soporte **para las 5 apps desde ya**, con el formato de Plantiario |
| Estado de las apps | Todas «Próximamente en la App Store»; el sitio está preparado para cambiar a la insignia oficial |
| Analítica | GA4 (G-R2WHH3RXWM) con Consent Mode v2, eventos propios y exclusión del tráfico interno. Solo en la portada, el CV y las páginas de app |

## 3. Arquitectura de archivos

```
/index.html                       portada
/cv/index.html                    CV (web + impresión A4)
/files/cv-es.pdf, cv-en.pdf       generados con tools/cv-pdf.sh
/files/cv.pdf                     copia de cv-es.pdf (no rompe enlaces antiguos)
/assets/css/site.css              tokens, componentes, animaciones
/assets/css/legal.css             páginas de privacidad y soporte
/assets/css/cv.css                CV en pantalla e impresión
/assets/js/i18n.js                selector de idioma (en todas las páginas)
/assets/js/site.js                interacciones (portada y páginas de app)
/assets/js/analytics.js           GA4 + consentimiento + eventos
/assets/img/apps/<app>.png        iconos 512 px (+ @1x 256 px) copiados de cada proyecto
/assets/img/apps/cooktribe.svg    icono provisional
/assets/img/me.jpg                foto (se reutiliza images/me.png optimizada)
/assets/img/og.png                imagen para compartir (1200×630)
/<app>/index.html                 página de la app
/<app>/privacy/index.html         privacidad
/<app>/support/index.html         soporte
/404.html
/tools/cv-pdf.sh                  genera los PDF del CV
/.nojekyll
```

Slugs: `schede`, `keppi`, `plantiario` (se mantiene), `cooktribe`, `quicksound`.

**Se borra:** `css/`, `js/`, `styles/`, `scripts/`, `images/` (todo, incluida `images/me.png` tras moverla), `plantiario/plantiario.css` y las imágenes antiguas (juegos, PicPoint, logos de tecnologías y fondos).

### 3.1 i18n

- Cada texto aparece dos veces, `<span data-lang="es">…</span><span data-lang="en">…</span>`, o en bloques `<div data-lang="…">` para textos largos como los legales.
- CSS: `html[data-lang="es"] [data-lang="en"], html[data-lang="en"] [data-lang="es"] { display: none !important; }`. Así solo se ve un idioma y los lectores de pantalla ignoran el otro.
- Orden de resolución del idioma:
  1. `?lang=es|en` en la URL
  2. `localStorage` (con `try/catch`)
  3. `navigator.language` (si empieza por `en`, inglés; en cualquier otro caso, español)
  4. `es` por defecto
- Se aplica con un script en línea en `<head>` antes del primer render, para que no haya parpadeo. Sin JS, el HTML ya viene con `data-lang="es"`.
- El selector (ES | EN) va en la barra de navegación de todas las páginas. Actualiza `<html lang>`, `document.title` (a partir de `data-title-es` y `data-title-en` en `<html>`) y la `meta description`, y dispara el evento `language_change`.
- Para App Store Connect se puede usar `…/privacy/?lang=en` como URL en inglés.

## 4. Sistema visual (dirección A)

- **Colores:**
  - Fondo `#0A0A0F`, superficie `rgba(255,255,255,.06)` con `backdrop-filter: blur(16px)`, borde `rgba(255,255,255,.10)`.
  - Texto `#F4F2EE` / 65 %.
  - Acento de marca: degradado `#00C48C → #3D8BFF → #8567FF → #F2A516`.
- **Color de cada app:**
  - Schede `#00C48C`
  - Keppi `#F2A516`
  - Plantiario `#3F8F6A` (verde; la app no define acento, así que se deriva de su tinta `#14201F`)
  - CookTribe `#F0845C`
  - Quick Sound Repository `#FF5C1A`
- **Tipografía (Google Fonts):**
  - *Inter Tight* 600/800 para titulares (`letter-spacing: -0.03em`)
  - *Inter* 400/500 para texto
  - *JetBrains Mono* 500 para etiquetas y chips técnicos
- **Escala:** titular del hero con `clamp(2.6rem, 7vw, 6rem)`, secciones con un `max-width` de 1200 px y un margen lateral de 16 px en móvil.
- **Interacciones** (JS vanilla, `IntersectionObserver`, `transform`/`opacity`):
  1. Titular del hero que se revela palabra a palabra, con desplazamiento y desenfoque.
  2. Resplandor radial que sigue al cursor en el hero.
  3. Barra de navegación de cristal que se compacta al pasar 80 px de scroll.
  4. Aparición al hacer scroll (`.reveal`) con escalonado.
  5. Contadores que suben al entrar en pantalla.
  6. Marquesina infinita de clientes (CSS; se pausa con el cursor encima).
  7. Tarjetas bento con inclinación 3D (máx. 8°) y un brillo que sigue al ratón, solo con `pointer: fine`.
  8. Línea de tiempo que se dibuja con el scroll.
  9. Copiar el email al portapapeles con un aviso «Copiado».
- **Accesibilidad:**
  - `prefers-reduced-motion: reduce` desactiva las animaciones y el contenido se muestra directamente.
  - Contraste AA, foco visible, enlace «Saltar al contenido» y HTML semántico.
- **Responsive:** el bento pasa a una columna por debajo de 720 px, y en táctil no hay inclinación.
- **SEO:** `<title>`, meta description, Open Graph y Twitter Card con `og.png`, `hreflang` (mismo URL con `?lang=`), `canonical` y JSON-LD `Person` en la portada y `SoftwareApplication` en cada página de app.

## 5. Portada — contenido

Textos definitivos para revisar (ES / EN). Navegación: Apps · Cómo trabajo · Trayectoria · Contacto · [CV] · [ES|EN].

**Hero**
- ES: «Apps iOS que se **sienten** nativas.»
- EN: «iOS apps that truly **feel** native.»
- ES: «Soy David Tejedor, desarrollador iOS senior especializado en SwiftUI. Desde 2019 llevo apps a la App Store para marcas como Meliá, ONCE o el Athletic Club. Ahora también construyo las mías.»
- EN: «I'm David Tejedor, a senior iOS developer specialised in SwiftUI. Since 2019 I've shipped App Store apps for brands like Meliá, ONCE and Athletic Club — and now I'm building my own.»
- Botones: «Ver mis apps» / «See my apps» · «Descargar CV» / «Download CV» (enlaza al PDF del idioma activo).
- Etiqueta: «Madrid, España» / «Madrid, Spain». No se indica disponibilidad para ofertas.

**Cifras**

| Cifra | ES | EN |
|---|---|---|
| **7+** | años creando apps | years building apps |
| **5** | apps propias en camino | apps of my own on the way |
| **1.400+** | tests automatizados en mis proyectos | automated tests across my projects |
| **Swift 6** | concurrencia estricta en todo | strict concurrency everywhere |

- Marquesina «Han confiado en mi trabajo» / «Brands I've built for»: Meliá · Grandvalira · ONCE · Athletic Club · Sodexo · Renault · Perfumerías Júlia · OBS · Attends.
- El recuento de tests de la tercera cifra es 410 + 228 + 178 + 660 + 11 = 1.487.

**Apps (bento)**
- Título: «Lo que estoy construyendo» / «What I'm building».
- Cada tarjeta lleva: icono, nombre, frase, 3 chips técnicos, la etiqueta «Próximamente» y un enlace a `/<app>/`.
- Schede ocupa la tarjeta grande.

| App | Frase ES | Frase EN | Chips |
|---|---|---|---|
| Schede | Tarjetas de idiomas que se crean solas, con IA que no sale de tu iPhone. | Language flashcards that make themselves, with AI that never leaves your iPhone. | Foundation Models · Live Activities · Safari Extension |
| Keppi | Listas tan rápidas como una nota, con una mascota que crece contigo. | Lists as fast as a sticky note, with a pet that grows with you. | Offline-first sync · WidgetKit · macOS |
| Plantiario | Tus plantas, regadas a tiempo. Catálogo offline y diario de fotos. | Your plants, watered on time. Offline catalogue and photo diary. | SwiftData + CloudKit · 6 idiomas · App Intents |
| CookTribe | El recetario compartido de tu tribu: del plan semanal a la lista de la compra. | Your tribe's shared cookbook: from weekly plan to shopping list. | SwiftData · CloudKit Sharing · iPad |
| Quick Sound | Tu mesa de sonido de bolsillo: recorta, agrupa y lanza efectos al instante. | A pocket soundboard: trim, group and fire sounds instantly. | AVAudioEngine · SwiftData · macOS |

**Cómo trabajo**
- Introducción, que hace de «Sobre mí» e incluye la foto:
  - ES: «Me enganché a la informática de niño y no he parado de aprender. Hoy mi foco es SwiftUI: interfaces que se sienten de Apple, arquitectura limpia y tests que dan confianza para cambiar. Mi paso por la ciberseguridad me dejó una obsesión sana por la privacidad. Fuera del código: dibujo, música y videojuegos.»
  - EN: «I got hooked on computers as a kid and never stopped learning. Today my focus is SwiftUI: interfaces that feel like Apple made them, clean architecture and tests that make change safe. My time in cybersecurity left me with a healthy obsession with privacy. Away from code: drawing, music and video games.»
- Pilares:
  1. **SwiftUI de principio a fin** / *SwiftUI end to end*: Swift 6, concurrencia estricta, `@Observable`, animaciones con intención.
  2. **Arquitectura que aguanta** / *Architecture that lasts*: capas Domain/Data/Presentation, inyección de dependencias, Swift Testing.
  3. **Privacidad por diseño** / *Privacy by design*: formación en ciberseguridad (pentesting web con OWASP, bootcamp en The Bridge). Mis apps no rastrean y tus datos viven en tu iCloud.
  4. **Lo último de Apple** / *Apple's latest*: Apple Intelligence (Foundation Models), widgets, Live Activities, App Intents y Spotlight.

**Trayectoria** (línea de tiempo)
- **O2O · MO2O Digital Business & Transformation** — Desarrollador iOS · oct. 2021 – actualidad
  - Apps nativas en SwiftUI para Meliá, Grandvalira, ONCE, Athletic Club o Sodexo.
  - Del requisito a la App Store: análisis, UX con el cliente, betas en TestFlight, publicación y certificados.
  - Equipos Scrum reducidos, a veces coordinándolos. Firebase.
- **Proun** — Desarrollador iOS senior · sept. – oct. 2021
  - Desarrollo y mantenimiento de apps en Swift y Objective-C, betas y publicación.
- **Sidertia Solutions** — Técnico de ciberseguridad · abr. – ago. 2021
  - Auditorías web en caja negra y gris (OWASP), análisis de riesgos e informes.
- **Vanadis** — Desarrollador de apps móviles · ene. 2019 – nov. 2020
  - Apps nativas iOS y Android para Renault, Perfumerías Júlia, OBS o Attends.
  - Integración continua y trato directo con el cliente.
- **Formación:**
  - Bootcamp en Ciberseguridad, The Bridge (2020–2021)
  - CFGS Desarrollo de Aplicaciones Multiplataforma, CEV (2017–2019, nota media de sobresaliente)
  - HND in Computing and Systems Development, CEV (2017–2019)
- Todo lo anterior va también en inglés. Los cursos complementarios (Photoshop, Unity, ZBrush) se retiran.

**Stack** (chips)
- iOS: Swift, SwiftUI, Swift Concurrency, SwiftData, Core Data, CloudKit, WidgetKit, ActivityKit, App Intents, Foundation Models, Vision, AVFoundation, UIKit, Objective-C, Combine.
- Calidad y entrega: Swift Testing, XCTest, fastlane, TestFlight, Git.
- Backend y otros: Firebase, Supabase, GRDB/SQLite, Kotlin/Android, Scrum.

**Contacto**
- ES: «¿Hablamos?» / EN: «Let's talk.»
- Email grande con botón de copiar, y botones de LinkedIn, GitHub y CV.
- Pie: «© 2026 David Tejedor Ayet · Hecho a mano, sin frameworks.» / «Handmade, no frameworks.» · enlace «Preferencias de cookies».

## 6. Páginas de app (`/<app>/`)

Plantilla común con el color de la app como protagonista:

1. Barra de navegación (← David Tejedor · ES|EN).
2. Hero: icono de 160 px con reflejo, nombre, eslogan, etiqueta «Próximamente en la App Store», plataformas e idiomas. Detrás, un degradado con el color de la app.
3. 4-6 funciones en una rejilla con iconos SVG en línea.
4. «Hecho con» / *Built with*: chips técnicos.
5. Bloque de privacidad: un resumen en una frase y enlaces a Privacidad y Soporte.
6. Pie común.

**Contenido de cada app** (se redactan ES/EN a partir de estos puntos):

- **Schede.** Solo iPhone, en español.
  - Eslogan: «Aprende idiomas con tarjetas que se crean solas.»
  - Funciones: cursos por pareja de idiomas; traducción automática; ejemplos, clasificación y vocabulario por tema con Apple Intelligence; iconos con Image Playground; repaso FSRS con modos de estudio, lectura y examen; captura desde la cámara, Live Text, fotos y Safari; pronunciación; widgets «Palabra del día» y «Repaso rápido»; Live Activity.
- **Keppi.** iPhone, iPad y Mac; ES y EN.
  - Eslogan: «Tus listas, con alma.»
  - Funciones: listas y notas rápidas estilo Keep; notas efímeras, compra y rutinas; recordatorios y subtareas; XP, rachas y logros sin castigos; mascota que crece y nunca muere; widgets para tachar desde la pantalla de inicio; app nativa de Mac; «Nido» para parejas (próximamente).
- **Plantiario.** iPhone y iPad; 6 idiomas.
  - Eslogan: «Cuida tus plantas de interior.»
  - Funciones: vista «Hoy»; recordatorios de riego y abonado con intervalos de invierno; catálogo offline de especies; diario de fotos con resumen hecho por Apple Intelligence; identificación opcional con Pl@ntNet; widget, Atajos y Spotlight.
  - Se sustituye el `plantiario/index.html` actual.
- **CookTribe.** iPhone y iPad; ES y EN.
  - Eslogan: «El recetario de tu tribu.»
  - Funciones: recetarios con ingredientes por secciones y pasos con foto y temporizador; escalado de raciones y conversión de unidades; plan semanal; lista de la compra por pasillos; exportación a Bring!, Recordatorios y otras apps (próximamente); tribus compartidas por iCloud (próximamente).
- **Quick Sound Repository.** iPhone, iPad y Mac.
  - Eslogan: «Tu mesa de sonido de bolsillo.»
  - Funciones: grupos con estilos; reproducción simultánea o de uno en uno con la barra «On Air»; recorte en línea de tiempo; efectos de voz, tono y velocidad; importación desde archivos, vídeos y URLs; portadas desde Wikimedia Commons; sincronización con iCloud.

## 7. Páginas legales (`/<app>/privacy/`, `/<app>/support/`)

- Mismo formato que Plantiario, pero con el sistema visual nuevo (`legal.css`):
  - Oscuro, columna de lectura de 720 px, cuerpo de 16-17 px.
  - Índice lateral fijo en escritorio.
  - «Última actualización».
  - El idioma se elige con el selector: se ven los bloques ES o los EN, nunca los dos.
- **Plantiario:** el contenido de privacidad y soporte se conserva literal (texto y enlaces), salvo el email de contacto. Cambian el marcado y el estilo.
- **Email de contacto en los legales y el soporte de todas las apps:** `naszen013@gmail.com`. En Plantiario sustituye al de outlook, que es el único cambio en su contenido. El email de outlook no aparece en ningún sitio.

**Secciones de privacidad:**
1. Resumen
2. Dónde están tus datos
3. Servicios de terceros
4. Permisos
5. Etiqueta de privacidad del App Store
6. Cómo borrar tus datos
7. Menores
8. Cambios y contacto

**Contenido por app:**
- **Schede:**
  - Sin cuentas ni servidores; nada sale del dispositivo salvo la sincronización con el iCloud privado (CloudKit) y el almacén clave-valor de iCloud para las horas de los recordatorios.
  - Traducción, Foundation Models, Image Playground, Speech y Vision funcionan en el dispositivo. Los paquetes de idioma se descargan de Apple.
  - Permisos de cámara, micrófono, reconocimiento de voz, movimiento y notificaciones, con el motivo de cada uno.
  - La extensión de Safari se ejecuta en las páginas y recuerda solo el texto que seleccionas: máximo 120 caracteres, en memoria de la página durante 60 s, nunca en campos de contraseña. Solo lo envía a la app, junto con el dominio de origen, cuando pulsas «Crear tarjeta». No lee el resto de la página.
  - Etiqueta: «Sin datos recopilados».
  - Borrado: tarjetas o cursos en la app, o todo desde Ajustes › iCloud › Gestionar almacenamiento.
- **Keppi:**
  - Cuenta obligatoria con Apple o Google.
  - Datos en Supabase (UE, Frankfurt, confirmado por el usuario): email, ID de usuario, listas, elementos, mascota, XP y fotos de fondo de lista (bucket privado).
  - Sesión en el Llavero; base de datos local en el dispositivo.
  - Notificaciones locales.
  - Borrar la cuenta desde Perfil elimina los datos del servidor (fotos incluidas) y revoca el acceso de Apple.
  - Encargado del tratamiento: Supabase, Inc.
  - Etiqueta: email, ID de usuario, otro contenido del usuario y fotos, todos vinculados, sin rastreo.
  - Sin analítica de terceros.
- **CookTribe:**
  - Hoy todo es local: recetas y fotos en el dispositivo, fotos sin EXIF ni ubicación, cámara solo si la usas, ninguna conexión a internet.
  - Sección «Funciones futuras» con compromiso de actualizar la política antes de activar iCloud compartido o la exportación a Bring!.
  - Etiqueta: «Sin datos recopilados».
- **Quick Sound Repository:**
  - Sonidos, portadas y grupos en el dispositivo y en tu iCloud privado (CloudKit).
  - Terceros, solo cuando lo pides: la búsqueda de portadas envía el término a Wikimedia Commons; descargar audio o imágenes desde una URL contacta con ese servidor, que ve tu IP.
  - Sin permisos especiales.
  - Etiqueta: «Sin datos recopilados».

**Soporte:** contacto (email y datos a incluir en un informe de error) y preguntas frecuentes:
- Schede: descarga de idiomas; requisito de Apple Intelligence; activar la extensión de Safari; sincronización de iCloud y cambio de cuenta; importar y exportar; recordatorios; voces de pronunciación.
- Keppi: por qué hace falta cuenta; vincular Apple y Google; sincronización sin conexión; borrar la cuenta; widgets; Mac; mascota y XP.
- CookTribe: escalado de raciones; lista de la compra; fotos; tribus (próximamente).
- Quick Sound Repository: importar audio; por qué no se admiten TikTok ni YouTube; portadas; iCloud; efectos; app de Mac.

## 8. CV (`/cv/`)

- **Diseño:** claro para impresión (fondo blanco, tinta `#12141A`) con el degradado de marca como franja fina y acentos. Una página A4 por idioma, con `@page { size: A4; margin: 0 }` y estilos `@media print`. En pantalla se ve como una hoja sobre el fondo oscuro, con botones «Descargar PDF» y ES|EN.
- **Contenido:**
  - Nombre, «Desarrollador iOS Senior · SwiftUI», contacto (con teléfono solo aquí) y un perfil de 3 líneas.
  - Experiencia, que son los mismos textos de §5 condensados.
  - Apps propias (5, en una línea cada una).
  - Competencias clave, formación e idiomas (español nativo, inglés B2).
- **Una sola fuente:** el CV es su propio HTML. Los textos de experiencia se duplican a mano respecto a la portada, que es la consecuencia aceptada de no tener build.
- **`tools/cv-pdf.sh`:**
  1. Levanta `python3 -m http.server`.
  2. Ejecuta Chrome sin interfaz: `--headless --print-to-pdf --no-pdf-header-footer` sobre `/cv/?lang=es` y `?lang=en`.
  3. Guarda `files/cv-es.pdf` y `files/cv-en.pdf`, y copia `cv-es.pdf` a `cv.pdf`.
  4. La generación se hace sin analítica (`?internal=1&noga=1`).

## 9. Analítica

`assets/js/analytics.js` solo se incluye en la portada, el CV y las 5 páginas de app.

- **Consent Mode v2:**
  - Por defecto se deniegan `analytics_storage`, `ad_storage`, `ad_user_data` y `ad_personalization`. Se envían pings sin cookies, que Google modela.
  - Aviso inferior discreto, con «Aceptar» y «Rechazar» del mismo peso visual.
  - Aceptar concede solo `analytics_storage`; la publicidad siempre queda denegada.
  - La elección se guarda en `localStorage` y se puede cambiar desde el pie («Preferencias de cookies»).
- **Sin datos en pruebas:** no se carga GA en `localhost`, en `127.0.0.1` ni con `?noga=1`.
- **Tráfico interno:** `?internal=1` guarda una marca y desde ese momento se envía `traffic_type: 'internal'`. `?internal=0` la quita. Hay que activar el filtro «Internal traffic» en GA (Admin › Recogida de datos › Filtros de datos) y se documenta en el README.
- **Parámetros globales:**
  - `content_group`: `home`, `cv` o `app`
  - `site_language`: `es` o `en`
  - `app_name` en las páginas de app
- **Eventos:**
  - `cv_download {language}`
  - `contact_click {method: email|linkedin|github}`
  - `email_copy`
  - `app_open {app_name, location: bento|nav|footer}`
  - `language_change {from, to}`
  - `section_view {section}` (una vez por sección y visita, cuando se ve al menos el 40 %)
  - `store_click {app_name}` (para cuando haya enlaces a la App Store)
- Se desactiva el `page_view` automático para enviarlo tras aplicar el idioma, así ya lleva `site_language`.
- Se documenta en el README qué dimensiones personalizadas hay que registrar en GA: `site_language`, `app_name`, `section` y `method`.

## 10. Preguntas resueltas

1. Email: portfolio y CV usan `davidtejedorayet@gmail.com`; legales y soporte de las apps usan `naszen013@gmail.com`; el de outlook no aparece en ningún sitio.
2. Inglés en el CV: B2.
3. Sin «abierto a nuevos retos».
4. Keppi usa Supabase en la UE (Frankfurt): confirmado.
5. `docs/superpowers/` se borra al terminar la implementación, para que no se publique.

## 11. Fuera de alcance

- Cambios en las apps. Pendientes detectados que conviene corregir antes de publicarlas:
  - Keppi no declara «Fotos» en su manifiesto de privacidad y quizá tampoco «Nombre», por el scope `profile` de Google.
  - CookTribe no tiene `PrivacyInfo.xcprivacy`.
  - Las URLs de privacidad y soporte de fastlane de Keppi, Schede y QSR apuntan a GitHub y deben pasar a `naszen.github.io/<app>/privacy/` y `/support/`.
- Capturas de pantalla reales: cuando existan, se añaden a la página de cada app.
- Blog, formulario de contacto y modo claro del sitio.

## 12. Verificación

- Servir en local con `python3 -m http.server` y revisar en Chrome, escritorio y 390 px de ancho, todas las páginas en ES y EN:
  - no hay texto duplicado visible
  - la consola no muestra errores
  - no hay scroll horizontal
- Enlaces internos: un script con `curl` recorre todos los `href` y `src` locales y verifica que devuelven 200.
- Las URLs `/plantiario/privacy/` y `/plantiario/support/` existen y conservan el contenido literal: se comparan los textos antes y después.
- Lighthouse de la portada: rendimiento ≥ 90 y accesibilidad ≥ 95.
- Con `prefers-reduced-motion` emulado, el contenido es visible sin animación.
- Los PDF del CV caben en 1 página A4 cada uno (`pdfinfo` → `Pages: 1`).
- GA: con DebugView o `?noga` comprobar que en local no se envía nada, que el consentimiento funciona y que los eventos llevan sus parámetros. Esta prueba la hace el usuario en producción, porque GA no funciona en `localhost` por diseño.
