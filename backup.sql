
-- Backup SQL 

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET default_transaction_isolation = 'read committed';
SET timezone = 'UTC';

BEGIN;

-- TABLAS
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  "contraseña" VARCHAR(255) NOT NULL,
  foto_perfil TEXT,
  bio TEXT,
  rol VARCHAR(20) DEFAULT 'usuario',
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publicaciones (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo TEXT NOT NULL,
  tipo_archivo VARCHAR(50),
  "tamaño_bytes" BIGINT,
  etiquetas TEXT[],
  licencia VARCHAR(20) DEFAULT 'libre',
  marca_agua BOOLEAN DEFAULT false,
  texto_marca VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'activa',
  comentarios_abiertos BOOLEAN DEFAULT true,
  create_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comentarios (
  id SERIAL PRIMARY KEY,
  contenido TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS valoraciones (
  id SERIAL PRIMARY KEY,
  puntaje SMALLINT NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, publicacion_id)
);

CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, publicacion_id)
);

CREATE TABLE IF NOT EXISTS seguidores (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  seguidor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  seguido_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE(seguidor_id, seguido_id)
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(30) NOT NULL,
  referencia_id INTEGER,
  leida BOOLEAN DEFAULT false,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guardados (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, publicacion_id)
);

CREATE TABLE IF NOT EXISTS sesiones (
  id SERIAL PRIMARY KEY,
  token VARCHAR(500) NOT NULL,
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP WITH TIME ZONE,
  activa BOOLEAN DEFAULT true,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS colecciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coleccion_publicacion (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  coleccion_id INTEGER REFERENCES colecciones(id) ON DELETE CASCADE,
  publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
  UNIQUE(coleccion_id, publicacion_id)
);

CREATE TABLE IF NOT EXISTS mensajes (
  id SERIAL PRIMARY KEY,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  de_usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  para_usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS denuncias_publicacion (
  id SERIAL PRIMARY KEY,
  motivo VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, publicacion_id)
);

CREATE TABLE IF NOT EXISTS denuncias_comentario (
  id SERIAL PRIMARY KEY,
  motivo VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  comentario_id INTEGER REFERENCES comentarios(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, comentario_id)
);


CREATE INDEX IF NOT EXISTS idx_publicaciones_usuario ON publicaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_estado ON publicaciones(estado);
CREATE INDEX IF NOT EXISTS idx_publicaciones_etiquetas ON publicaciones USING GIN(etiquetas);
CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion ON comentarios(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_seguidores_seguidor ON seguidores(seguidor_id);
CREATE INDEX IF NOT EXISTS idx_seguidores_seguido ON seguidores(seguido_id);
CREATE INDEX IF NOT EXISTS idx_valoraciones_publicacion ON valoraciones(publicacion_id);


SELECT pg_catalog.setval(pg_get_serial_sequence('usuarios','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('publicaciones','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('comentarios','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('valoraciones','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('likes','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('seguidores','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('notificaciones','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('guardados','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('sesiones','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('colecciones','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('coleccion_publicacion','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('mensajes','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('denuncias_publicacion','id'), 1, false);
SELECT pg_catalog.setval(pg_get_serial_sequence('denuncias_comentario','id'), 1, false);

COMMIT;
