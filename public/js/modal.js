(function () {
  "use strict";

  const modalEl = document.getElementById("postModal");
  const panel = document.getElementById("modalImagePanel");
  const initialsEl = document.getElementById("modalInitials");
  const authorEl = document.getElementById("modalAuthorName");
  const handleEl = document.getElementById("modalAuthorHandle");
  const categoryEl = document.getElementById("modalCategory");
  const titleEl = document.getElementById("modalTitle");
  const descEl = document.getElementById("modalPostDesc");
  const tagsRow = document.getElementById("modalTagsRow");
  const ratingNumEl = document.getElementById("ratingNum");
  const likesNumEl = document.getElementById("likesNum");
  const commentsCountEl = document.getElementById("commentsCountNum");
  const viewsCountEl = document.getElementById("viewsCountNum");
  const heartBtn = document.getElementById("heartBtn");
  const likeStat = document.getElementById("likeStat");
  const modalRatingForm = document.getElementById("modalRatingForm");
  const modalRatingMsg = document.getElementById("modalRatingMsg");
  const modalRatingLabel = document.getElementById("modalRatingLabel");
  const starBtnsModal = document.querySelectorAll(".estrella-btn-modal");
  const followBtn = document.getElementById("followBtn");
  const saveBtn = document.getElementById("saveBtn");
  const saveText = document.getElementById("saveText");
  const commentInput = document.getElementById("commentInput");
  const sendBtn = document.getElementById("sendBtn");
  const commentsList = document.getElementById("commentsList");

  if (
    !modalEl ||
    !panel ||
    !initialsEl ||
    !authorEl ||
    !handleEl ||
    !categoryEl ||
    !titleEl ||
    !descEl ||
    !tagsRow ||
    !ratingNumEl ||
    !likesNumEl ||
    !commentsCountEl ||
    !viewsCountEl ||
    !heartBtn ||
    !likeStat ||
    !modalRatingForm ||
    !followBtn ||
    !saveBtn ||
    !saveText ||
    !commentInput ||
    !sendBtn ||
    !commentsList
  ) {
    return;
  }

  let liked = false;
  let following = false;
  let saved = false;
  let likeCount = 0;
  let currentPubId = null;

  function handleFromAuthor(name) {
    const slug = String(name || "usuario")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9áéíóúüñ._-]/gi, "");
    return "@" + (slug || "usuario");
  }

  function cssUrlToken(url) {
    return String(url || "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  }

  function formatInt(n) {
    const x = parseInt(n, 10);
    if (!Number.isFinite(x)) return "0";
    return x.toLocaleString("es");
  }

  function formatViews(n) {
    const x = parseInt(n, 10);
    if (!Number.isFinite(x)) return "0";
    if (x >= 1_000_000) return (x / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (x >= 1_000) return (x / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(x);
  }

  function syncHeartUI() {
    const icon = heartBtn.querySelector("i");
    if (icon) icon.className = liked ? "bi bi-heart-fill" : "bi bi-heart";
    heartBtn.classList.toggle("liked", liked);
    if (likeStat) likeStat.classList.toggle("stat-active", liked);
  }

  function updateStarsUI(promedio, cantidad) {
    if (ratingNumEl) {
      ratingNumEl.textContent = `${Number(promedio).toFixed(1)} (${cantidad})`;
    }
  }

  function syncFollowUI() {
    followBtn.textContent = following ? "Siguiendo" : "Seguir";
    followBtn.classList.toggle("following", following);
  }

  function syncSaveUI() {
    const icon = saveBtn.querySelector("i");
    if (icon) icon.className = saved ? "bi bi-bookmark-fill" : "bi bi-bookmark";
    saveText.textContent = saved ? "Guardado" : "Guardar";
    saveBtn.classList.toggle("saved", saved);
  }

  function setPanelMedia(gradient, imageUrl) {
    const g =
      gradient ||
      "linear-gradient(135deg,#2a1f5e 0%,#6a4fa0 50%,#c07adb 100%)";
    if (imageUrl) {
      const u = cssUrlToken(imageUrl);
      panel.style.background = `linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.42)), url("${u}") center / cover no-repeat`;
    } else {
      panel.style.background = g;
      panel.style.backgroundSize = "";
      panel.style.backgroundPosition = "";
      panel.style.backgroundRepeat = "";
    }
  }

  function fillTags(csv) {
    tagsRow.innerHTML = "";
    const raw = String(csv || "").trim();
    if (!raw) {
      tagsRow.classList.add("is-empty");
      return;
    }
    const parts = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) {
      tagsRow.classList.add("is-empty");
      return;
    }
    tagsRow.classList.remove("is-empty");
    parts.forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t.startsWith("#") ? t : "#" + t;
      tagsRow.appendChild(span);
    });
  }

  modalEl.addEventListener("show.bs.modal", (e) => {
    const card = e.relatedTarget;
    if (!card) return;

    const gradient = card.dataset.gradient || "";
    const imageUrl = card.dataset.image || "";
    const author = card.dataset.author || "Usuario";
    const handle = (card.dataset.handle || "").trim();
    const initials = card.dataset.initials || "?";
    const title = card.dataset.title || "Sin título";
    const category = card.dataset.category || "Publicación";
    const desc = (card.dataset.desc || "").trim();
    const pubId = card.dataset.id || "";
    currentPubId = pubId;

    const likesRaw = parseInt(card.dataset.likes, 10);
    likeCount = Number.isFinite(likesRaw) ? likesRaw : 0;
    liked =
      card.dataset.liked === "1" ||
      card.dataset.liked === "true" ||
      card.dataset.liked === "yes";

    const promedio = parseFloat(card.dataset.promedio) || 0;
    const votos = parseInt(card.dataset.votos, 10) || 0;
    const yaValoro = card.dataset.yaValoro === "1";
    
    if (yaValoro) {
       modalRatingForm.style.display = "none";
       modalRatingLabel.style.display = "none";
       modalRatingMsg.style.display = "block";
       modalRatingMsg.textContent = "Ya valoraste esta publicación.";
    } else {
       modalRatingForm.style.display = "flex";
       modalRatingLabel.style.display = "block";
       modalRatingMsg.style.display = "none";
       modalRatingMsg.textContent = "";
       
       
       starBtnsModal.forEach(b => {
          b.classList.remove("btn-warning", "text-white");
          b.classList.add("btn-outline-warning");
       });
    }

    following = false;
    saved = false;

    setPanelMedia(gradient, imageUrl);
    initialsEl.textContent = initials;
    initialsEl.style.background = gradient || "linear-gradient(135deg,var(--vf-accent, #e2c98a),#c07adb)";
    authorEl.textContent = author;
    handleEl.textContent = handle || handleFromAuthor(author);
    categoryEl.textContent = category;
    titleEl.textContent = title;
    descEl.textContent = desc;
    descEl.classList.toggle("is-empty", !desc);

    likesNumEl.textContent = formatInt(likeCount);
    updateStarsUI(promedio, votos);
    commentsCountEl.textContent = formatInt(card.dataset.comments);
    viewsCountEl.textContent = formatViews(card.dataset.views);

    fillTags(card.dataset.tags);

    syncHeartUI();
    syncFollowUI();
    syncSaveUI();

    commentInput.value = "";
    commentsList.innerHTML = '<div class="text-center my-3"><span class="spinner-border spinner-border-sm text-secondary" role="status"></span></div>';
    
    if (pubId && !pubId.startsWith("demo")) {
      fetch(`/publicaciones/${pubId}/comentarios_api`)
        .then(res => res.json())
        .then(data => {
           if (data.ok) {
             commentsList.innerHTML = '';
             if (data.comentarios.length === 0) {
               commentsList.innerHTML = '<p class="text-muted small text-center my-3">Aún no hay comentarios.</p>';
             } else {
               data.comentarios.forEach(c => {
                  const bg = "linear-gradient(135deg,var(--vf-accent, #e2c98a),#c07adb)";
                  const avatarText = c.autor_nombre ? c.autor_nombre.substring(0, 2).toUpperCase() : 'US';
                  const item = document.createElement("div");
                  item.className = "comment-item";
                  item.innerHTML =
                    '<div class="comment-avatar" style="background:' + escapeHTML(bg) + '">' +
                    escapeHTML(avatarText) + '</div>' +
                    '<div class="comment-bubble">' +
                    '<div class="comment-author">' + escapeHTML(c.autor_nombre || 'Usuario') + '</div>' +
                    '<div class="comment-text">' + escapeHTML(c.contenido) + '</div></div>';
                  commentsList.appendChild(item);
               });
             }
           } else {
             commentsList.innerHTML = '<p class="text-danger small">Error al cargar comentarios.</p>';
           }
        })
        .catch(err => {
           console.error("Fetch error:", err);
           commentsList.innerHTML = '<p class="text-danger small">Error al cargar comentarios.</p>';
        });
    } else {
       commentsList.innerHTML = '<p class="text-muted small text-center my-3">Aún no hay comentarios.</p>';
    }

    //btnVerCompleto
    const btnVer = document.getElementById("btnVerCompleto");
    if (btnVer) {
      btnVer.href = pubId && !pubId.startsWith("demo")
        ? `/publicaciones/${pubId}`
        : "#";
      btnVer.style.display = pubId && !pubId.startsWith("demo") ? "" : "none";
    }
  });

  async function toggleLike() {
    if (!currentPubId) return;

    try {
      const res = await fetch(`/publicaciones/${currentPubId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          liked = data.liked;
          likeCount = data.likes_count;
          likesNumEl.textContent = formatInt(likeCount);
          syncHeartUI();
          
          
          const card = document.querySelector(`.post-card[data-id="${currentPubId}"]`) || document.querySelector(`.masonry-item[data-id="${currentPubId}"]`);
          if (card) {
             card.dataset.liked = liked ? '1' : '';
             card.dataset.likes = String(likeCount);
          }
        } else {
          console.error(data.error);
        }
      } else {
         if (res.status === 401) {
            alert('Debes iniciar sesión para dar me gusta');
            window.location.href = '/auth/login';
         }
      }
    } catch (e) {
      console.error('Error al dar like:', e);
    }
  }

  heartBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    toggleLike();
  });

  if (likeStat) {
     likeStat.addEventListener("click", () => {
       toggleLike();
     });
  }

  starBtnsModal.forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!currentPubId) return;
      const valor = btn.getAttribute("data-valor");

      try {
        const res = await fetch(`/publicaciones/${currentPubId}/valorar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ puntaje: valor })
        });
        
        const data = await res.json();
        if (res.ok && data.ok) {
           modalRatingForm.style.display = "none";
           modalRatingLabel.style.display = "none";
           modalRatingMsg.style.display = "block";
           modalRatingMsg.textContent = `Ya valoraste esta publicación con ${valor} ★`;
           
           updateStarsUI(data.promedio, data.cantidad);
           
           const card = document.querySelector(`.post-card[data-id="${currentPubId}"]`) || document.querySelector(`.masonry-item[data-id="${currentPubId}"]`);
           if (card) {
             card.dataset.yaValoro = '1';
             card.dataset.promedio = String(data.promedio);
             card.dataset.votos = String(data.cantidad);
           }
        } else {
           if (res.status === 401) {
              alert("Debes iniciar sesión para valorar");
              window.location.href = "/auth/login";
           } else {
              alert(data.error || "Error al valorar");
           }
        }
      } catch (err) {
        console.error(err);
      }
    });
    
    
    btn.addEventListener("mouseenter", () => {
       const valor = parseInt(btn.getAttribute("data-valor"));
       starBtnsModal.forEach(b => {
          if (parseInt(b.getAttribute("data-valor")) <= valor) {
             b.classList.remove("btn-outline-warning");
             b.classList.add("btn-warning", "text-white");
          } else {
             b.classList.remove("btn-warning", "text-white");
             b.classList.add("btn-outline-warning");
          }
       });
    });
  });
  
  if (modalRatingForm) {
     modalRatingForm.addEventListener("mouseleave", () => {
        starBtnsModal.forEach(b => {
           b.classList.remove("btn-warning", "text-white");
           b.classList.add("btn-outline-warning");
        });
     });
  }

  followBtn.addEventListener("click", () => {
    following = !following;
    syncFollowUI();
  });

  saveBtn.addEventListener("click", () => {
    saved = !saved;
    syncSaveUI();
  });

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c]),
    );
  }

  async function sendComment() {
    const text = commentInput.value.trim();
    if (!text || !currentPubId) return;

    try {
      const res = await fetch(`/publicaciones/${currentPubId}/comentar_api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: text })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          const bg = panel.style.background || "linear-gradient(135deg,var(--vf-accent, #e2c98a),#c07adb)";
          const item = document.createElement("div");
          item.className = "comment-item new-comment";
          
          const avatarText = data.comentario.autor ? data.comentario.autor.substring(0, 2).toUpperCase() : 'TU';
          
          item.innerHTML =
            '<div class="comment-avatar" style="background:' + escapeHTML(bg) + '">' +
            escapeHTML(avatarText) + '</div>' +
            '<div class="comment-bubble">' +
            '<div class="comment-author">' + escapeHTML(data.comentario.autor) + '</div>' +
            '<div class="comment-text">' + escapeHTML(data.comentario.contenido) + '</div></div>';

          commentsList.appendChild(item);
          commentInput.value = "";
          item.scrollIntoView({ behavior: "smooth", block: "nearest" });
          
          
          const card = document.querySelector(`.post-card[data-id="${currentPubId}"]`) || document.querySelector(`.masonry-item[data-id="${currentPubId}"]`);
          if (card) {
             const currentComments = parseInt(card.dataset.comments || "0", 10);
             card.dataset.comments = String(currentComments + 1);
             commentsCountEl.textContent = formatInt(currentComments + 1);
          }
        }
      } else if (res.status === 401) {
         alert('Debes iniciar sesión para comentar');
         window.location.href = '/auth/login';
      }
    } catch (e) {
      console.error('Error al comentar:', e);
    }
  }

  commentInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendComment();
  });
  sendBtn.addEventListener("click", sendComment);
})();
