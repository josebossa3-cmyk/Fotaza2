const express = require("express");
const pool = require("../db/poolconnect");
const router = express.Router();

/** Tarjetas de ejemplo cuando aún no hay publicaciones (misma forma que las reales). */
const EXPLORAR_DEMOS = [
  {
    id: "demo-1",
    titulo: "Estudio en luz natural",
    descripcion: "Luz suave y sombras limpias.",
    url: "https://picsum.photos/seed/fotazaexp1/480/640",
    autor: "Lucía M.",
    etiquetaKey: "fotografía",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "fotografía",
  },
  {
    id: "demo-2",
    titulo: "Identidad visual",
    descripcion: "Paleta y tipografía para marca.",
    url: "https://picsum.photos/seed/fotazaexp2/480/520",
    autor: "Marco D.",
    etiquetaKey: "diseño",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "diseño",
  },
  {
    id: "demo-3",
    titulo: "Fachada contemporánea",
    descripcion: "Líneas y cristal en fachada urbana.",
    url: "https://picsum.photos/seed/fotazaexp3/480/720",
    autor: "Elena V.",
    etiquetaKey: "arquitectura",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "arquitectura",
  },
  {
    id: "demo-4",
    titulo: "Tipografía y color",
    descripcion: "Estudio de contraste cromático.",
    url: "https://picsum.photos/seed/fotazaexp4/480/560",
    autor: "Marco D.",
    etiquetaKey: "diseño",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "diseño,tipografía",
  },
  {
    id: "demo-5",
    titulo: "Atardecer urbano",
    descripcion: "Horizonte y reflejos al anochecer.",
    url: "https://picsum.photos/seed/fotazaexp5/480/600",
    autor: "Lucía M.",
    etiquetaKey: "fotografía",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "fotografía,urbano",
  },
  {
    id: "demo-6",
    titulo: "Espacio interior",
    descripcion: "Volumen y materiales en interior.",
    url: "https://picsum.photos/seed/fotazaexp6/480/680",
    autor: "Elena V.",
    etiquetaKey: "arquitectura",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "arquitectura,interior",
  },
  {
    id: "demo-7",
    titulo: "Branding editorial",
    descripcion: "Maquetación y ritmo visual.",
    url: "https://picsum.photos/seed/fotazaexp7/480/540",
    autor: "Ana R.",
    etiquetaKey: "diseño",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "diseño,editorial",
  },
  {
    id: "demo-8",
    titulo: "Retrato en exterior",
    descripcion: "Luz natural y fondo desenfocado.",
    url: "https://picsum.photos/seed/fotazaexp8/480/760",
    autor: "Ana R.",
    etiquetaKey: "fotografía",
    likes_count: 0,
    comentarios_count: 0,
    tagsCsv: "fotografía,retrato",
  },
];

// Ruta principal
router.get("/", (req, res) => {
  res.render("home", {
    title: "Inicio",
    user: req.session.user || null,
  });
});

// Explorar (publicaciones)
router.get("/publicaciones", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.titulo, p.descripcion, p.ruta_archivo AS url, p.etiquetas,
              COALESCE(u.nombre, 'Usuario') AS autor,
              COALESCE(l.likes_count, 0)::int AS likes_count,
              COALESCE(c.comentarios_count, 0)::int AS comentarios_count
       FROM publicaciones p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN (
         SELECT publicacion_id, COUNT(*)::int AS likes_count
         FROM likes GROUP BY publicacion_id
       ) l ON l.publicacion_id = p.id
       LEFT JOIN (
         SELECT publicacion_id, COUNT(*)::int AS comentarios_count
         FROM comentarios GROUP BY publicacion_id
       ) c ON c.publicacion_id = p.id
       ORDER BY p.create_timestamp DESC`
    );

    const publicaciones = result.rows.map((row) => {
      const tags = row.etiquetas;
      let first = "";
      if (Array.isArray(tags) && tags.length) {
        first = String(tags[0] || "");
      } else if (tags != null) {
        first = String(tags);
      }
      const etiquetaKey =
        first.trim().toLowerCase() || "sin-etiqueta";
      let tagsCsv = "";
      if (Array.isArray(tags) && tags.length) {
        tagsCsv = tags
          .map((t) => String(t || "").trim())
          .filter(Boolean)
          .join(",");
      } else if (tags != null && typeof tags === "string" && tags.trim()) {
        tagsCsv = tags
          .split(/[,;]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .join(",");
      }
      return { ...row, etiquetaKey, tagsCsv };
    });

    const usarDemos = publicaciones.length === 0;
    res.render("auth/explorar", {
      title: "Explorar",
      publicaciones: usarDemos ? EXPLORAR_DEMOS : publicaciones,
      demosPlaceholder: usarDemos,
    });
  } catch (err) {
    console.error("Error al cargar publicaciones:", err);
    res.render("auth/explorar", {
      title: "Explorar",
      publicaciones: [],
      loadError: true,
    });
  }
});

const proximamente = (pageTitle) => (req, res) => {
  res.render("placeholder", {
    title: pageTitle,
    pageTitle,
  });
};

router.get("/buscar", proximamente("Buscar"));
router.get("/notificaciones", proximamente("Notificaciones"));
router.get("/favoritos", proximamente("Mis favoritos"));
router.get("/seguidos", proximamente("Usuarios que sigo"));
router.get("/comunidad", proximamente("Comunidad"));
router.get("/privacidad", proximamente("Privacidad"));
router.get("/terminos", proximamente("Términos"));
router.get("/contacto", proximamente("Contacto"));

module.exports = router;
