const pool = require("./poolconnect");

const createTable = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Tabla usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        contraseña VARCHAR(255) NOT NULL,
        foto_perfil TEXT,
        bio TEXT,
        rol VARCHAR(20) DEFAULT 'usuario',
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla seguidores
    await client.query(`
      CREATE TABLE IF NOT EXISTS seguidores (
        id SERIAL PRIMARY KEY,
        seguidor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        seguido_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(seguidor_id, seguido_id)
      );
    `);

    // Tabla publicaciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS publicaciones (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        nombre_archivo VARCHAR(255) NOT NULL,
        ruta_archivo VARCHAR(500) NOT NULL,
        tipo_archivo VARCHAR(50),
        tamaño_bytes BIGINT,
        etiquetas TEXT[],
        licencia VARCHAR(20) DEFAULT 'libre',
        marca_agua BOOLEAN DEFAULT false,
        texto_marca VARCHAR(100),
        estado VARCHAR(20) DEFAULT 'activa',
        comentarios_abiertos BOOLEAN DEFAULT true,
        create_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // Tabla valoraciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS valoraciones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
        puntaje SMALLINT NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, publicacion_id)
      );
    `);

    // Tabla comentarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id SERIAL PRIMARY KEY,
        contenido TEXT NOT NULL,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
        activo BOOLEAN DEFAULT true,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla denuncias_publicacion
    await client.query(`
      CREATE TABLE IF NOT EXISTS denuncias_publicacion (
        id SERIAL PRIMARY KEY,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        motivo VARCHAR(100) NOT NULL,
        descripcion TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, publicacion_id)
      );
    `);

    // Tabla denuncias_comentario
    await client.query(`
      CREATE TABLE IF NOT EXISTS denuncias_comentario (
        id SERIAL PRIMARY KEY,
        comentario_id INTEGER REFERENCES comentarios(id) ON DELETE CASCADE,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        motivo VARCHAR(100) NOT NULL,
        descripcion TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, comentario_id)
      );
    `);

    // Tabla notificaciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        actor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(30) NOT NULL,
        referencia_id INTEGER,
        leida BOOLEAN DEFAULT false,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla mensajes
    await client.query(`
      CREATE TABLE IF NOT EXISTS mensajes (
        id SERIAL PRIMARY KEY,
        de_usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        para_usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE SET NULL,
        contenido TEXT NOT NULL,
        leido BOOLEAN DEFAULT false,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla colecciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS colecciones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla coleccion_publicacion
    await client.query(`
      CREATE TABLE IF NOT EXISTS coleccion_publicacion (
        coleccion_id INTEGER REFERENCES colecciones(id) ON DELETE CASCADE,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (coleccion_id, publicacion_id)
      );
    `);

    // Tabla sesiones
    await client.query(`
      CREATE TABLE IF NOT EXISTS sesiones (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_expiracion TIMESTAMP,
        activa BOOLEAN DEFAULT true
      );
    `);

    // Tabla guardados
    await client.query(`
      CREATE TABLE IF NOT EXISTS guardados (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, publicacion_id)
      );
    `);

    // Migraciones: asegurar columnas nuevas
    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bio TEXT;
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'usuario';
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

        ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS etiquetas TEXT[];
        ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS licencia VARCHAR(20) DEFAULT 'libre';
        ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS marca_agua BOOLEAN DEFAULT false;
        ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS texto_marca VARCHAR(100);
        ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activa';
        ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS comentarios_abiertos BOOLEAN DEFAULT true;

        ALTER TABLE comentarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
      END $$;
    `);

    // Índices (ya con columnas aseguradas)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_id ON sesiones(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_usuario_id ON publicaciones(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_estado ON publicaciones(estado);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_etiquetas ON publicaciones USING GIN(etiquetas);
      CREATE INDEX IF NOT EXISTS idx_seguidores_seguidor ON seguidores(seguidor_id);
      CREATE INDEX IF NOT EXISTS idx_seguidores_seguido ON seguidores(seguido_id);
      CREATE INDEX IF NOT EXISTS idx_valoraciones_publicacion ON valoraciones(publicacion_id);
      CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion ON comentarios(publicacion_id);
      CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_mensajes_usuarios ON mensajes(de_usuario_id, para_usuario_id);
      CREATE INDEX IF NOT EXISTS idx_denuncias_publicacion ON denuncias_publicacion(publicacion_id);
    `);

    await client.query("COMMIT");
    console.log(" Tablas creadas correctamente");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear las tablas:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Exportamos como objeto con createTable (opción B)
module.exports = { createTable };
