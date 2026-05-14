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
  const likesNumEl = document.getElementById("likesNum");
  const commentsCountEl = document.getElementById("commentsCountNum");
  const viewsCountEl = document.getElementById("viewsCountNum");
  const heartBtn = document.getElementById("heartBtn");
  const likeStat = document.getElementById("likeStat");
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
    !likesNumEl ||
    !commentsCountEl ||
    !viewsCountEl ||
    !heartBtn ||
    !likeStat ||
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
    likeStat.classList.toggle("stat-active", liked);
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

    const likesRaw = parseInt(card.dataset.likes, 10);
    likeCount = Number.isFinite(likesRaw) ? likesRaw : 0;
    liked =
      card.dataset.liked === "1" ||
      card.dataset.liked === "true" ||
      card.dataset.liked === "yes";

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
    commentsCountEl.textContent = formatInt(card.dataset.comments);
    viewsCountEl.textContent = formatViews(card.dataset.views);

    fillTags(card.dataset.tags);

    syncHeartUI();
    syncFollowUI();
    syncSaveUI();

    commentsList.querySelectorAll(".comment-item.new-comment").forEach((el) => el.remove());
    commentInput.value = "";
  });

  heartBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    liked = !liked;
    likeCount += liked ? 1 : -1;
    if (likeCount < 0) likeCount = 0;
    likesNumEl.textContent = formatInt(likeCount);
    syncHeartUI();
  });

  likeStat.addEventListener("click", () => {
    liked = !liked;
    likeCount += liked ? 1 : -1;
    if (likeCount < 0) likeCount = 0;
    likesNumEl.textContent = formatInt(likeCount);
    syncHeartUI();
  });

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

  function sendComment() {
    const text = commentInput.value.trim();
    if (!text) return;

    const bg =
      panel.style.background ||
      "linear-gradient(135deg,var(--vf-accent, #e2c98a),#c07adb)";
    const item = document.createElement("div");
    item.className = "comment-item new-comment";
    item.innerHTML =
      '<div class="comment-avatar" style="background:' +
      escapeHTML(bg) +
      '">Tú</div>' +
      '<div class="comment-bubble">' +
      '<div class="comment-author">Tú</div>' +
      '<div class="comment-text">' +
      escapeHTML(text) +
      "</div></div>";

    commentsList.appendChild(item);
    commentInput.value = "";
    item.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  commentInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendComment();
  });
  sendBtn.addEventListener("click", sendComment);
})();
