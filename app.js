const api = {
  async getBootstrap(category = "All", query = "") {
    const params = new URLSearchParams({ category, query });
    const response = await fetch(`/api/bootstrap?${params}`);
    if (!response.ok) throw new Error("API unavailable");
    return response.json();
  },
  async countView(id) {
    const response = await fetch(`/api/videos/${id}/views`, { method: "POST" });
    if (!response.ok) throw new Error("View update failed");
    return response.json();
  },
  async likeVideo(id) {
    const response = await fetch(`/api/videos/${id}/likes`, { method: "POST" });
    if (!response.ok) throw new Error("Like update failed");
    return response.json();
  },
  async addComment(id, comment) {
    const response = await fetch(`/api/videos/${id}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(comment),
    });
    if (!response.ok) throw new Error("Comment failed");
    return response.json();
  },
};

const fallbackState = {
  categories: ["All", "Design", "Music", "Gaming", "Podcasts", "Live", "JavaScript", "Cooking", "Travel", "News", "Recently uploaded"],
  featured: {
    id: "featured-dashboard",
    title: "Build Room: Designing a Creator Dashboard",
    channel: "Creator Lab Live",
    viewsLabel: "128K watching",
    thumb: "linear-gradient(155deg, #304f9c 0%, #845ec2 42%, #ff6f59 100%)",
  },
  videos: [],
  shorts: [],
};

const chipsEl = document.querySelector("#chips");
const gridEl = document.querySelector("#videoGrid");
const shortsEl = document.querySelector("#shortsRow");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const playerModal = document.querySelector("#playerModal");
const playerScreen = document.querySelector("#playerScreen");
const playerTitle = document.querySelector("#playerTitle");
const playerChannel = document.querySelector("#playerChannel");
const likeButton = document.querySelector("#likeButton");
const likeCount = document.querySelector("#likeCount");
const commentCount = document.querySelector("#commentCount");
const commentsList = document.querySelector("#commentsList");
const commentForm = document.querySelector("#commentForm");
const commentName = document.querySelector("#commentName");
const commentText = document.querySelector("#commentText");

let categories = [];
let videos = [];
let shorts = [];
let featured = null;
let activeCategory = "All";
let activeQuery = "";
let activeVideo = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compactNumber(value) {
  if (value >= 1000000) return `${Number((value / 1000000).toFixed(1))}M`;
  if (value >= 1000) return `${Number((value / 1000).toFixed(1))}K`;
  return String(value);
}

function viewLabel(count, live = false) {
  return `${compactNumber(count)} ${live ? "watching" : "views"}`;
}

function presentVideo(video) {
  return {
    ...video,
    views: viewLabel(video.viewCount, video.category === "Live"),
    commentCount: video.comments.length,
  };
}

function presentShort(short) {
  return {
    ...short,
    views: viewLabel(short.viewCount),
  };
}

function filterFallbackVideos(items) {
  const query = activeQuery.trim().toLowerCase();
  return items.filter((video) => {
    const categoryMatch = activeCategory === "All" || video.category === activeCategory || activeCategory === "Recently uploaded";
    const queryMatch = [video.title, video.channel, video.category].some((value) => value.toLowerCase().includes(query));
    return categoryMatch && queryMatch;
  });
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createThumbnail(video) {
  return `
    <div class="thumb" style="--thumb-bg: ${escapeHtml(video.thumb)}">
      <div class="visual-block"></div>
      <div class="visual-lines"><span></span><span></span><span></span></div>
      <span class="duration">${escapeHtml(video.duration)}</span>
    </div>
  `;
}

function renderComments(video) {
  const comments = video.comments || [];
  commentCount.textContent = `${comments.length} comment${comments.length === 1 ? "" : "s"}`;
  commentsList.innerHTML = comments.length
    ? comments
        .map(
          (comment) => `
            <article class="comment">
              <strong>${escapeHtml(comment.name)}</strong>
              <p>${escapeHtml(comment.text)}</p>
            </article>
          `
        )
        .join("")
    : `<p class="empty-comments">No comments yet.</p>`;
}

async function openPlayer(video) {
  activeVideo = video;
  playerScreen.style.setProperty("--thumb-bg", video.thumb);
  playerTitle.textContent = video.title;
  playerChannel.textContent = `${video.channel} - ${video.views || video.viewsLabel}`;
  likeCount.textContent = compactNumber(video.likes || 0);
  renderComments(video);
  playerModal.classList.add("open");
  playerModal.setAttribute("aria-hidden", "false");

  if (!video.isShort && !video.isFeatured) {
    try {
      const updated = await api.countView(video.id);
      Object.assign(video, updated);
      playerChannel.textContent = `${video.channel} - ${video.views}`;
    } catch {
      video.viewCount = (video.viewCount || 0) + 1;
    }
  }
}

function renderVideos() {
  resultCount.textContent = `${videos.length} video${videos.length === 1 ? "" : "s"}`;
  gridEl.innerHTML = videos
    .map(
      (video) => `
        <button class="video-card" type="button" data-video-id="${escapeHtml(video.id)}">
          ${createThumbnail(video)}
          <footer>
            <span class="channel-avatar" style="--avatar-bg: ${escapeHtml(video.avatar)}">${escapeHtml(initials(video.channel))}</span>
            <div class="video-info">
              <h3 class="video-title">${escapeHtml(video.title)}</h3>
              <p class="video-channel">${escapeHtml(video.channel)}</p>
              <p class="meta-line"><span>${escapeHtml(video.views)}</span><span>-</span><span>${escapeHtml(video.age)}</span></p>
            </div>
          </footer>
        </button>
      `
    )
    .join("");

  if (!videos.length) {
    gridEl.innerHTML = `<p class="empty-state">No videos found. Try a broader search.</p>`;
  }
}

function renderChips() {
  chipsEl.innerHTML = categories
    .map((category) => `<button class="chip${category === activeCategory ? " active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
    .join("");
}

function renderShorts() {
  shortsEl.innerHTML = shorts
    .map(
      (short) => `
        <button class="short-card" type="button" data-short-id="${escapeHtml(short.id)}">
          <div class="short-thumb" style="--thumb-bg: ${escapeHtml(short.thumb)}"></div>
          <h3>${escapeHtml(short.title)}</h3>
          <p class="short-meta">${escapeHtml(short.views)}</p>
        </button>
      `
    )
    .join("");
}

async function refreshData() {
  try {
    const data = await api.getBootstrap(activeCategory, activeQuery);
    categories = data.categories;
    featured = data.featured;
    videos = data.videos;
    shorts = data.shorts;
  } catch {
    const response = await fetch("data/db.json");
    const data = response.ok ? await response.json() : fallbackState;
    categories = data.categories;
    featured = data.featured;
    videos = filterFallbackVideos(data.videos || []).map(presentVideo);
    shorts = (data.shorts || []).map(presentShort);
  }

  renderChips();
  renderVideos();
  renderShorts();
}

chipsEl.addEventListener("click", async (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  activeCategory = chip.dataset.category;
  await refreshData();
});

gridEl.addEventListener("click", (event) => {
  const card = event.target.closest(".video-card");
  if (!card) return;
  const video = videos.find((item) => item.id === card.dataset.videoId);
  if (video) openPlayer(video);
});

shortsEl.addEventListener("click", (event) => {
  const card = event.target.closest(".short-card");
  if (!card) return;
  const short = shorts.find((item) => item.id === card.dataset.shortId);
  if (!short) return;
  openPlayer({
    ...short,
    channel: "Virello Shorts",
    likes: 0,
    comments: [],
    isShort: true,
  });
});

document.querySelector("#watchFeatured").addEventListener("click", () => {
  openPlayer({
    ...featured,
    views: featured.viewsLabel,
    likes: 0,
    comments: [],
    isFeatured: true,
  });
});

document.querySelector("#searchForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  activeQuery = searchInput.value;
  await refreshData();
});

searchInput.addEventListener("input", async () => {
  activeQuery = searchInput.value;
  await refreshData();
});

likeButton.addEventListener("click", async () => {
  if (!activeVideo || activeVideo.isShort || activeVideo.isFeatured) return;
  try {
    const updated = await api.likeVideo(activeVideo.id);
    activeVideo.likes = updated.likes;
  } catch {
    activeVideo.likes = (activeVideo.likes || 0) + 1;
  }
  likeCount.textContent = compactNumber(activeVideo.likes || 0);
});

commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeVideo || activeVideo.isShort || activeVideo.isFeatured) return;

  const payload = {
    name: commentName.value,
    text: commentText.value,
  };

  try {
    const comment = await api.addComment(activeVideo.id, payload);
    activeVideo.comments = [comment, ...(activeVideo.comments || [])];
  } catch {
    activeVideo.comments = [
      { id: `local-${Date.now()}`, name: payload.name || "Guest", text: payload.text },
      ...(activeVideo.comments || []),
    ];
  }

  commentText.value = "";
  renderComments(activeVideo);
});

document.querySelector("#menuButton").addEventListener("click", () => {
  document.querySelector("#sidebar").classList.toggle("collapsed");
  document.querySelector(".shell").classList.toggle("nav-collapsed");
});

document.querySelector("#closePlayer").addEventListener("click", () => {
  playerModal.classList.remove("open");
  playerModal.setAttribute("aria-hidden", "true");
});

playerModal.addEventListener("click", (event) => {
  if (event.target === playerModal) {
    playerModal.classList.remove("open");
    playerModal.setAttribute("aria-hidden", "true");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && playerModal.classList.contains("open")) {
    playerModal.classList.remove("open");
    playerModal.setAttribute("aria-hidden", "true");
  }
});

refreshData();
