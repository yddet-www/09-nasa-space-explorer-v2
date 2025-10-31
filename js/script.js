// js/script.js

// Data source
const APOD_CDN = "https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json";

// Elements
const galleryEl = document.getElementById("gallery");
const getImageBtn = document.getElementById("getImageBtn");

// --- Optional "Random Space Fact" (LevelUp) ---
const funFactEl = document.getElementById("funFact");
const SPACE_FACTS = [
  "Venus rotates backward—its sun rises in the west.",
  "Neutron stars can spin 600+ times per second.",
  "Jupiter’s Great Red Spot is at least 350 years old.",
  "A day on Mercury is longer than its year.",
  "There are more trees on Earth than stars in the Milky Way.",
  "Saturn could float in water—it's less dense than water.",
  "Spacesuits take up to 3 years to build.",
  "Olympus Mons on Mars is ~3x taller than Everest.",
];
if (funFactEl) {
  const fact = SPACE_FACTS[Math.floor(Math.random() * SPACE_FACTS.length)];
  funFactEl.textContent = `🛰️ Did you know? ${fact}`;
}

// --- Modal (created once) ---
let modalEl;
function ensureModal() {
  if (modalEl) return modalEl;
  modalEl = document.createElement("div");
  modalEl.id = "modal";
  modalEl.className = "modal hidden";
  modalEl.innerHTML = `
    <div class="modal-backdrop" data-close="true"></div>
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" aria-label="Close" data-close="true">✕</button>
      <div class="modal-media" id="modal-media"></div>
      <div class="modal-body">
        <h2 id="modal-title"></h2>
        <p class="modal-date"></p>
        <p class="modal-expl"></p>
      </div>
    </div>
  `;
  document.body.appendChild(modalEl);
  // Close handlers
  modalEl.addEventListener("click", (e) => {
    if (e.target.dataset.close === "true") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!modalEl.classList.contains("hidden") && e.key === "Escape")
      closeModal();
  });
  return modalEl;
}

function openModal(item) {
  ensureModal();
  const mediaWrap = modalEl.querySelector("#modal-media");
  const titleEl = modalEl.querySelector("#modal-title");
  const dateEl = modalEl.querySelector(".modal-date");
  const explEl = modalEl.querySelector(".modal-expl");

  // Clear media
  mediaWrap.innerHTML = "";

  if (item.media_type === "image") {
    const img = document.createElement("img");
    img.src = item.hdurl || item.url;
    img.alt = item.title || "APOD Image";
    mediaWrap.appendChild(img);
  } else if (item.media_type === "video") {
    // Try embedding if it looks like a YouTube embed URL, else show a link
    if (/youtube\.com\/embed\//.test(item.url)) {
      const iframe = document.createElement("iframe");
      iframe.src = item.url;
      iframe.loading = "lazy";
      iframe.allowFullscreen = true;
      iframe.title = item.title || "APOD Video";
      mediaWrap.appendChild(iframe);
    } else {
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Open video";
      mediaWrap.appendChild(link);
    }
  }

  titleEl.textContent = item.title || "Untitled";
  dateEl.textContent = item.date || "";
  explEl.textContent = item.explanation || "";

  modalEl.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.add("hidden");
  document.body.style.overflow = "";
}

// --- Render helpers ---
function placeholder(
  msg = 'Click "Fetch Space Images" to explore the cosmos!'
) {
  galleryEl.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🔭</div>
      <p>${msg}</p>
    </div>
  `;
}

function loading() {
  galleryEl.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🚀</div>
      <p>🔄 Loading space photos…</p>
    </div>
  `;
}

function renderGallery(items) {
  if (!Array.isArray(items) || items.length === 0) {
    placeholder("No results found.");
    return;
  }

  const frag = document.createDocumentFragment();

  items.forEach((item, idx) => {
    const card = document.createElement("article");
    card.className = "gallery-item";
    card.tabIndex = 0; // keyboard focus
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      `Open details for ${item.title || "APOD item"}`
    );

    // media block
    const mediaWrap = document.createElement("div");
    mediaWrap.className = "media-wrap";

    if (item.media_type === "image") {
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = item.title || `APOD ${item.date}`;
      mediaWrap.appendChild(img);
    } else if (item.media_type === "video") {
      // Prefer thumbnail if provided; otherwise simple badge + link style image
      const thumb = item.thumbnail_url || "";
      if (thumb) {
        const img = document.createElement("img");
        img.src = thumb;
        img.alt = (item.title || "APOD Video") + " (thumbnail)";
        mediaWrap.appendChild(img);

        const badge = document.createElement("span");
        badge.className = "video-badge";
        badge.textContent = "▶";
        mediaWrap.appendChild(badge);
      } else {
        const fallback = document.createElement("div");
        fallback.className = "video-fallback";
        fallback.textContent = "▶ Video";
        mediaWrap.appendChild(fallback);
      }
    }

    // text
    const meta = document.createElement("p");
    meta.innerHTML = `<strong>${item.title || "Untitled"}</strong><br/><span>${
      item.date || ""
    }</span>`;

    card.appendChild(mediaWrap);
    card.appendChild(meta);

    // Click/keyboard to open modal
    card.addEventListener("click", () => openModal(item));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(item);
      }
    });

    frag.appendChild(card);
  });

  galleryEl.innerHTML = "";
  galleryEl.appendChild(frag);
}

// --- Fetch flow ---
async function fetchApod() {
  loading();
  try {
    const res = await fetch(APOD_CDN, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Defensive sanity: expect an array of objects
    const items = Array.isArray(data) ? data : [];
    renderGallery(items);
  } catch (err) {
    console.error(err);
    placeholder("❌ Failed to load. Please try again.");
  }
}

// Wire up button
getImageBtn?.addEventListener("click", fetchApod);

// Initial placeholder
if (galleryEl && !galleryEl.children.length) placeholder();
