const express = require("express");
const pool = require("../db/poolconnect");
const router = express.Router();

/** Tarjetas de ejemplo cuando aún no hay publicaciones (misma forma que las reales). */
const EXPLORAR_DEMOS = [
  {
    id: "demo-1",
    titulo: "Estudio en luz natural",
    url: "https://picsum.photos/seed/fotazaexp1/480/640",
    autor: "Lucía M.",
    etiquetaKey: "fotografía",
  },
  {
    id: "demo-2",
    titulo: "Identidad visual",
    url: "https://picsum.photos/seed/fotazaexp2/480/520",
    autor: "Marco D.",
    etiquetaKey: "diseño",
  },
  {
    id: "demo-3",
    titulo: "Fachada contemporánea",
    url: "https://picsum.photos/seed/fotazaexp3/480/720",
    autor: "Elena V.",
    etiquetaKey: "arquitectura",
  },
  {
    id: "demo-4",
    titulo: "Tipografía y color",
    url: "https://picsum.photos/seed/fotazaexp4/480/560",
    autor: "Marco D.",
    etiquetaKey: "diseño",
  },
  {
    id: "demo-5",
    titulo: "Atardecer urbano",
    url: "https://picsum.photos/seed/fotazaexp5/480/600",
    autor: "Lucía M.",
    etiquetaKey: "fotografía",
  },
  {
    id: "demo-6",
    titulo: "Espacio interior",
    url: "https://picsum.photos/seed/fotazaexp6/480/680",
    autor: "Elena V.",
    etiquetaKey: "arquitectura",
  },
  {
    id: "demo-7",
    titulo: "Branding editorial",
    url: "https://picsum.photos/seed/fotazaexp7/480/540",
    autor: "Ana R.",
    etiquetaKey: "diseño",
  },
  {
    id: "demo-8",
    titulo: "Retrato en exterior",
    url: "https://picsum.photos/seed/fotazaexp8/480/760",
    autor: "Ana R.",
    etiquetaKey: "fotografía",
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
              COALESCE(u.nombre, 'Usuario') AS autor
       FROM publicaciones p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       ORDER BY p.create_timestamp DESC`
    );

    const publicaciones = result.rows.map((row) => ({
      ...row,
      etiquetaKey: (row.etiqueta || "").trim().toLowerCase() || "sin-etiqueta",
    }));

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

module.exports = router;
