
document.addEventListener("DOMContentLoaded", () => {
    const botones = document.querySelectorAll(".estrella-btn");
    if (!botones.length) return;
  
    const publicacionId = botones[0].dataset.id;
  
    
    botones.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        const val = parseInt(btn.dataset.valor);
        botones.forEach((b) => {
          b.textContent = parseInt(b.dataset.valor) <= val ? "★" : "☆";
        });
      });
  
      btn.addEventListener("mouseleave", () => {
        botones.forEach((b) => (b.textContent = "★"));
      });
  
     
      btn.addEventListener("click", async () => {
        const puntaje = btn.dataset.valor;
  
        try {
          const res = await fetch(`/publicaciones/${publicacionId}/valorar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ puntaje }),
          });
  
          const data = await res.json();
  
          if (data.ok) {
           
            const promDiv = document.querySelector(".valoracion-promedio");
            if (promDiv) {
              promDiv.textContent = `${data.promedio} (${data.cantidad} votos)`;
            }
          
            document.querySelector("#estrellas-form")?.remove();
  
            // Mostrar mensaje de confirmación
            const msg = document.createElement("p");
            msg.className = "small text-muted";
            msg.textContent = `Ya valoraste esta publicación con ${puntaje} ★`;
            document.querySelector("#estrellas-form")?.replaceWith(msg);
          } else {
            alert(data.error || "No se pudo guardar la valoración");
          }
        } catch (e) {
          console.error("Error al valorar:", e);
        }
      });
    });
  });