# Guía de Despliegue y Base de Datos en Hetzner Webhosting
**Sistema Cotizador - Grupo Castro**

Esta guía detalla los **3 pasos indispensables** para activar la base de datos remota MySQL y el backend PHP en tu servicio de Webhosting de Hetzner (konsoleH).

---

## Paso 1: Crear la Base de Datos en Hetzner konsoleH

1. Ingresa a tu panel de control de Hetzner: **[konsoleH](https://konsoleh.hetzner.com/)**.
2. En el menú de la izquierda, ve a **Manage Services** > Selecciona tu dominio.
3. Ve a **Database Management** > **MySQL**.
4. Haz clic en **Add Database**:
   - Asigna un nombre (por ejemplo: `castro_cotizador`).
   - El sistema generará o te pedirá una contraseña segura. **Guárdala bien**.
   - Toma nota del **Database Name**, **User**, **Password** y el **Host** (habitualmente `localhost` o `127.0.0.1` en Hetzner Webhosting).

---

## Paso 2: Importar `schema.sql` en phpMyAdmin

1. Desde la misma sección de MySQL en konsoleH, haz clic en el enlace **phpMyAdmin** junto a tu base de datos recién creada.
2. Ingresa con tu usuario y contraseña de la base de datos.
3. En la barra superior, haz clic en la pestaña **Importar** (o *Import*).
4. Haz clic en **Seleccionar archivo** (*Browse*) y elige el archivo `database/schema.sql` de este proyecto.
5. Haz clic en el botón **Continuar** (*Import*) al final de la página.
6. Verás el mensaje verde indicando que se crearon exitosamente:
   - Tabla `usuarios` (con el usuario inicial `admin` y contraseña `castro2026`).
   - Tabla `cotizaciones` (con soporte para guardar clientes, proformas e ítems serializados).

---

## Paso 3: Configurar las Credenciales en `api/config.php`

1. Abre el archivo `public/api/config.php` (o una vez subido a tu servidor en `cotizador/api/config.php`):
   ```php
   $DB_HOST    = 'localhost';              // En Hetzner normalmente es 'localhost' o '127.0.0.1'
   $DB_NAME    = 'tu_nombre_de_bd';        // Ejemplo: castro_cotizador
   $DB_USER    = 'tu_usuario_de_bd';       // Ejemplo: castro_usr
   $DB_PASS    = 'tu_contraseña_secreta';  // Contraseña asignada en konsoleH
   $JWT_SECRET = 'clave_secreta_grupo_castro_2026_xyz'; // Cualquier frase larga y secreta
   ```
2. Al ejecutar `pnpm build`, los archivos de `public/api/` se compilan automáticamente dentro de `dist/api/`.
3. Sube el contenido de `dist/` a la carpeta pública de tu servidor Hetzner (por ejemplo dentro de `public_html/cotizador/` o la raíz correspondiente).

---

## Credenciales de Acceso al Sistema

- **Usuario:** `admin`
- **Contraseña inicial:** `castro2026`

### ¿Cómo cambiar la contraseña?
- **Desde phpMyAdmin:** Puedes generar un nuevo hash bcrypt o escribir tu nueva contraseña en texto plano en el campo `password_hash` del usuario `admin` dentro de la tabla `usuarios`. La API de Grupo Castro valida ambos formatos automáticamente.
- **Modo Local:** Si estás probando la web en tu computadora (`localhost`) donde no hay PHP ni MySQL, el cotizador usará automáticamente el **Modo Local** con estas mismas credenciales para que puedas trabajar sin interrupciones.
