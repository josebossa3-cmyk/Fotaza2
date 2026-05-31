# Fotaza 2

Trabajo Práctico Integrador — Programación Web II  
Desarrollador de Software — Universidad de La Punta  
Alumno: Jose Bossa

---

## ¿De qué se trata?

Fotaza 2 es una aplicación web para almacenar, ordenar, buscar, vender y compartir fotografías en línea a través de Internet. La idea es generar una comunidad de usuarios que puedan compartir fotografías creadas por ellos mismos, con normas de comportamiento y condiciones de uso que favorezcan la buena gestión de los contenidos.

Los usuarios pueden registrarse, subir sus fotos, comentar y valorar publicaciones de otros, seguir a fotógrafos que les gusten y recibir notificaciones cuando alguien interactúa con su contenido. Las imágenes pueden tener licencia libre o copyright, y en ese caso el autor puede protegerlas con una marca de agua personalizada.

---

## Tecnologías

- Node.js + Express
- Pug (vistas del lado del servidor)
- Sequelize + PostgreSQL
- express-session + bcryptjs
- Multer (subida de imágenes)
- Sharp (marca de agua)
- Bootstrap 5

---

## Cómo correr el proyecto

Necesitás tener instalado Node.js y PostgreSQL antes de empezar.

**1. Clonar el repositorio**
```bash
git clone https://github.com/josebossa3-cmyk/Fotaza2.git
cd Fotaza2
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar el archivo .env**

Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

Completar el `.env` con los datos de tu base de datos PostgreSQL local.

**4. Inicializar la base de datos**
```bash
npm run db:init
```

Esto crea todas las tablas y carga los usuarios de prueba automáticamente.

**5. Arrancar la app**
```bash
npm start
```

Abrí el navegador en: http://localhost:3001

---

## Variables de entorno (.env)

```
PORT=3001
DB_NAME=Fotaza2
DB_USER=postgres
DB_PASS=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
SESSION_SECRET=cualquier_clave_larga
```

---

## Usuarios de prueba

Una vez ejecutado `npm run db:init` estos usuarios van a estar disponibles:

| Rol | Email | Contraseña |
|---|---|---|
| Usuario | prueba123@gmail.com | admin1234 |
| Validador de contenidos | prueba1234@gmail.com | admin1234 |

El validador es el encargado de revisar publicaciones denunciadas y decidir si darlas de baja o desestimar las denuncias.

---

## Funcionalidades

- Registro e inicio de sesión con contraseñas encriptadas
- Subida de fotos con título, descripción, etiquetas y licencia (libre o copyright)
- Marca de agua automática con texto personalizado en imágenes con copyright
- Explorador con buscador y filtros combinables por texto, licencia y orden
- Comentarios en publicaciones con opción de cierre por el autor
- Valoraciones del 1 al 5 con promedio en tiempo real
- Sistema de denuncias para imágenes y comentarios
- Panel del validador para gestionar contenido denunciado
- Seguir y dejar de seguir usuarios
- Feed de publicaciones de usuarios seguidos
- Notificaciones con contador en el navbar
- Buscador de usuarios por nombre
- Perfil editable con foto y bio
- Mensajería privada para contactar al autor de una imagen

---

## Estructura de carpetas

```
Fotaza2/
├── config/        — configuración de la base de datos
├── controllers/   — lógica de cada funcionalidad
├── db/            — script de inicialización
├── middlewares/   — autenticación y subida de archivos
├── models/        — modelos Sequelize
├── public/        — css, js e imágenes subidas
├── routes/        — rutas de la app
├── views/         — plantillas Pug
└── package.json
```

---

## Problemas que me encontré

**Relaciones de seguidores con Sequelize**
La tabla seguidores referencia a la misma tabla usuarios dos veces. Tuve que definir los alias `siguiendo` y `seguidores` en los modelos para que Sequelize no se confundiera con los nombres.

**Arrays de etiquetas**
Sequelize no maneja los arrays de PostgreSQL de forma directa. Tuve que definir el tipo como `ARRAY(DataTypes.TEXT)` y verificar el formato antes de insertar.

**Queries con GROUP BY y promedios**
Calcular promedios y conteos con Sequelize no es tan directo como en SQL. Lo resolví usando `sequelize.fn('AVG')` y `sequelize.fn('COUNT')` con `subQuery: false` para que el LIMIT funcionara bien.

**Sesión desactualizada al editar perfil**
Cuando el usuario editaba su perfil, los datos en pantalla no se actualizaban hasta que cerraba sesión. Lo resolví actualizando `req.session.user` manualmente después de guardar los cambios.

**Marca de agua con Sharp**
Integrar Sharp para procesar las imágenes antes de guardarlas , asegurarse de borrar el archivo original después de generar la versión con marca de agua.

---

