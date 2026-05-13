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
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // tabla seguidores

    await client.query(`
      CREATE TABLE IF NOT EXISTS seguidores (
        id SERIAL PRIMARY KEY,
        seguidor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        seguido_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(seguidor_id, seguido_id)
      );
    `);

    // tabla guardados

    await client.query(`
      CREATE TABLE IF NOT EXISTS guardados (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, publicacion_id)
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
        licencia VARCHAR(100),
        marca_agua BOOLEAN DEFAULT false,
        create_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);

    // tabla likes

    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, publicacion_id)
      );  
    `);

    // tabla comentarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id SERIAL PRIMARY KEY,
        contenido TEXT NOT NULL,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // migracion
    // para agregar columnas nuevas a usuarios si no existen

    await client.query(`
     DO $$
     BEGIN
      BEGIN
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
      
      BEGIN
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bio TEXT;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
    END $$;
    `);

    //agregar columnas nuevas a publicaciones

    await client.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS etiquetas TEXT[];
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS licencia VARCHAR(100);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;

        BEGIN
          ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS marca_agua BOOLEAN DEFAULT false;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_id ON sesiones(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_usuario_id ON publicaciones(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_publicaciones_etiquetas ON publicaciones USING GIN(etiquetas);
      CREATE INDEX IF NOT EXISTS idx_seguidores_seguidor ON seguidores(seguidor_id);
      CREATE INDEX IF NOT EXISTS idx_seguidores_seguido ON seguidores(seguido_id);
      CREATE INDEX IF NOT EXISTS idx_likes_publicacion ON likes(publicacion_id);
      CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion ON comentarios(publicacion_id);
    `);

    await client.query("COMMIT");
    console.log("Tablas creadas");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear las tablas:", error);
    throw error;
  } finally {
    client.release(); 
  }
};

module.exports = createTable;
