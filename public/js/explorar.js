(function () {
  "use strict";

  function normalize(s) {
    return (s || "").trim().toLowerCase();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("exploreGrid");
    var filterBtns = document.querySelectorAll(".explore-filters .filter-item");

    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var selected = normalize(btn.getAttribute("data-filter"));
        filterBtns.forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        if (!grid) return;
        grid.querySelectorAll(".post-card").forEach(function (card) {
          var tag = normalize(card.getAttribute("data-etiqueta"));
          var show = selected === "todo" || tag === selected;
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  });
})();
