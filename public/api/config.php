<?php
/**
 * ==============================================================================
 * CONFIGURACIÓN DE BASE DE DATOS Y SEGURIDAD - GRUPO CASTRO
 * Servidor Webhosting Hetzner (MySQL / MariaDB + PHP)
 * ==============================================================================
 * 
 * INSTRUCCIONES:
 * Rellena estas 5 variables con los datos de tu base de datos creada en konsoleH.
 */

// 1. Host del servidor MySQL (en Hetzner usualmente es 'localhost' o '127.0.0.1')
$DB_HOST = 'localhost';

// 2. Nombre de la base de datos creada en konsoleH
$DB_NAME = 'grupocastro_cotizador';

// 3. Usuario de la base de datos
$DB_USER = 'root';

// 4. Contraseña del usuario de la base de datos
$DB_PASS = '';

// 5. Clave secreta para firmar los tokens JWT de sesión (escribe una frase larga y aleatoria)
$JWT_SECRET = 'GrupoCastro_SecretKey_2026_HikvisionPeruHuancayo_AuthSecureToken!';

// Retornar configuración en arreglo asociativo para uso seguro
return [
    'host'       => $DB_HOST,
    'dbname'     => $DB_NAME,
    'user'       => $DB_USER,
    'pass'       => $DB_PASS,
    'jwt_secret' => $JWT_SECRET,
];
