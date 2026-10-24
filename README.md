# 📑 Cotizador Grupo Castro - Sistema de Gestión de Proformas

[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?style=flat-square&logo=astro&logoColor=white)](https://astro.build/)
[![Preact](https://img.shields.io/badge/Preact-10.x-673AB8?style=flat-square&logo=preact&logoColor=white)](https://preactjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PHP](https://img.shields.io/badge/PHP-8.x_%7C_PDO-777BB4?style=flat-square&logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x_%7C_MariaDB-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Hetzner](https://img.shields.io/badge/Hosting-Hetzner-D50C2D?style=flat-square&logo=hetzner&logoColor=white)](https://www.hetzner.com/)

Sistema web corporativo de alto rendimiento diseñado para la elaboración, cálculo, emisión y almacenamiento de proformas técnicas y presupuestos comerciales de equipos de seguridad electrónica, videovigilancia y telecomunicaciones de **Grupo Castro** (Huancayo, Junín, Perú).

---

## 🌟 Características Principales

- **🔐 Autenticación Privada con Modo Dual (Nube & Local):**
  - Autenticación segura mediante tokens JWT en servidores Hetzner.
  - Detección inteligente de conectividad: si la API remota no está configurada o se trabaja en entorno local (`localhost`), el sistema conmuta automáticamente a **Modo Local** para garantizar operatividad sin interrupciones.
- **💰 Cálculo Dinámico & Descuento al Total:**
  - Cálculo instantáneo de subtotales por ítem y monto global.
  - Módulo de descuento aplicable al total de la cotización (por porcentaje `%` o monto fijo en soles `S/`).
  - Desglose opcional de IGV (18%) o precios netos configurables.
- **📄 Exportación de PDF Ultra-Optimizada:**
  - Generación client-side de PDFs vectoriales de alta fidelidad con `jsPDF` y `jspdf-autotable`.
  - Compresión interna `FAST` para minimizar el tamaño del archivo resultante.
  - **Sanitización automática Unicode:** remoción de caracteres no estándar y emojis para prevenir corrupción de fuentes Helvetica nativas.
  - Distribución inteligente de saltos de página con soporte para descripciones técnicas y fichas extensas.
- **💾 Autoguardado Directo en Carpeta Local (File System Access API):**
  - Vinculación directa con una carpeta del sistema de archivos local de la PC del asesor comercial.
  - Almacena automáticamente copias de respaldo en formato `.json` sin mostrar ventanas emergentes reiteradas en cada guardado.
  - Reemplazo limpio: al editar una proforma existente, sobreescribe el archivo anterior conservando un historial ordenado sin saturar el almacenamiento.
- **📱 Historial Sincronizado Multi-dispositivo:**
  - Panel de consulta de proformas emitidas con búsqueda en tiempo real por número de documento, cliente o fecha.
  - Capacidad de recargar cualquier proforma anterior en el formulario con un solo clic para modificaciones o reemisiones.
- **🏷️ Generación Offline de Códigos QR:**
  - Generación local de códigos QR corporativos integrados en el pie de página del documento PDF mediante la librería `qrcode` (sin llamadas a servicios web externos).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework Base** | [Astro 5](https://astro.build/) | Generador estático de alto rendimiento y arquitectura de islas. |
| **Librería UI** | [Preact](https://preactjs.com/) | Reactividad ligera y componentes de interfaz con huella mínima de JavaScript. |
| **Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) | Utilidades CSS modernas compiladas con `@tailwindcss/vite`. |
| **Motor PDF** | [jsPDF](https://github.com/parallax/jsPDF) + [AutoTable](https://github.com/simonbengtsson/jspdf-autotable) | Generación client-side de documentos PDF institucionales. |
| **Códigos QR** | [qrcode](https://github.com/soldair/node-qrcode) | Generador de códigos QR vectoriales / Data-URI offline. |
| **Persistencia Local** | File System Access API + IndexedDB | Guardado transparente en disco duro local y persistencia de permisos. |
| **Backend API** | PHP 8+ (PDO) | API RESTful liviana con soporte de transacciones seguras y JWT. |
| **Base de Datos** | MySQL / MariaDB | Almacenamiento centralizado en Webhosting de Hetzner. |

---

## 📂 Estructura del Proyecto

```text
Cotizador_Web/
├── database/
│   ├── schema.sql                   # Esquema DDL de MySQL (tablas usuarios y cotizaciones)
│   └── INSTRUCCIONES_HETZNER.md     # Manual paso a paso para despliegue en Hetzner konsoleH
├── public/
│   ├── api/
│   │   ├── config.php               # Parámetros de conexión PDO y secreto JWT (plantilla segura)
│   │   └── index.php                # Endpoint central RESTful (Login, Cotizaciones CRUD)
│   ├── favicon.svg                  # Isotipo del cotizador
│   └── logo-grupo-castro.png        # Logotipo institucional corporativo
├── src/
│   ├── components/
│   │   ├── Cotizador.jsx            # Formulario principal, tabla dinámica, descuentos y guardado
│   │   ├── Historial.jsx            # Panel lateral/modal de búsqueda y recarga de proformas
│   │   └── pdf.jsx                  # Motor de renderizado de proforma oficial en PDF
│   ├── layouts/
│   │   └── Layout.astro             # Layout base HTML5 con SEO, tipografía Inter y metadatos
│   ├── pages/
│   │   └── index.astro              # Página principal que orquesta la aplicación
│   ├── styles/
│   │   └── global.css               # Importaciones de Tailwind CSS v4 y variables CSS
│   └── utils/
│       ├── apiService.js            # Cliente HTTP con JWT y fallback transparente a Modo Local
│       └── fileSystem.js            # Conector con File System Access API e IndexedDB
├── astro.config.mjs                 # Configuración de Astro con integración Preact y Vite
├── package.json                     # Scripts y dependencias del proyecto
└── tsconfig.json                    # Configuración de TypeScript/JavaScript
```

---

## 🚀 Comandos de Desarrollo y Producción

Este proyecto utiliza [pnpm](https://pnpm.io/) como gestor de paquetes recomendado.

### 1. Instalación de dependencias
```bash
pnpm install
```

### 2. Iniciar servidor de desarrollo local
```bash
pnpm dev
```
La aplicación estará disponible de inmediato en `http://localhost:4321`. En este entorno, el sistema activa automáticamente el **Modo Local** si no detecta una API PHP disponible.

### 3. Compilación para producción
```bash
pnpm build
```
Genera la carpeta `dist/` optimizada, lista para ser desplegada en cualquier servidor web estático o hosting con soporte PHP (como Hetzner).

### 4. Previsualización del build local
```bash
pnpm preview
```

---

## 🌐 Despliegue en Hetzner Webhosting

El backend y la base de datos están optimizados para operar dentro de un plan de Webhosting estándar en **Hetzner** mediante su panel **konsoleH**:

1. **Creación de Base de Datos:**
   - Crear una base de datos MySQL en *konsoleH* > *Database Management* > *MySQL*.
2. **Importación de Tablas:**
   - Acceder a **phpMyAdmin** en Hetzner e importar el script [`database/schema.sql`](database/schema.sql).
   - Se crearán las tablas `usuarios` y `cotizaciones` junto con sus índices optimizados y el usuario administrador inicial.
3. **Configuración de Conexión (`public/api/config.php`):**
   - Configurar las variables con las credenciales asignadas por konsoleH:
     ```php
     $DB_HOST    = 'localhost';         // Servidor local de MySQL en Hetzner
     $DB_NAME    = 'tu_nombre_de_bd';   // Nombre asignado a la BD
     $DB_USER    = 'tu_usuario_de_bd';  // Usuario de la BD
     $DB_PASS    = 'tu_contraseña';     // Contraseña de la BD
     $JWT_SECRET = 'frase_secreta_jwt'; // Clave privada de cifrado de tokens
     ```
   > ⚠️ **Nota de Seguridad:** Nunca subas credenciales reales o contraseñas de producción al control de versiones de Git. Mantén `config.php` protegido.
4. **Subida de Archivos al Servidor:**
   - Ejecuta `pnpm build`.
   - Transfiere el contenido de la carpeta `dist/` (incluyendo la carpeta `dist/api/`) al directorio web público de tu dominio en Hetzner (ej. `public_html/` o `cotizador/`).

Para conocer los detalles paso a paso, consulta el archivo [INSTRUCCIONES_HETZNER.md](database/INSTRUCCIONES_HETZNER.md).

---

## 👥 Credenciales de Acceso por Defecto

- **Usuario:** `admin`
- **Contraseña inicial:** `castro2026`

*La contraseña puede ser actualizada directamente desde phpMyAdmin en la tabla `usuarios` (admite hashes `bcrypt` o texto plano, cifrándose automáticamente al primer acceso).*

---

## 📄 Licencia y Derechos

Desarrollado para uso exclusivo y corporativo de **Grupo Castro** - Huancayo, Perú. Todos los derechos reservados.
