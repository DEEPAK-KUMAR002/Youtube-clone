const api = {
  token() {
    return localStorage.getItem("virello:token") || "";
  },
  authHeaders() {
    const token = api.token();
    return token ? { authorization: `Bearer ${token}` } : {};
  },
  async bootstrap() {
    const response = await fetch("/api/bootstrap");
    if (!response.ok) throw new Error("API unavailable");
    return response.json();
  },
  async getVideo(id) {
    const response = await fetch(`/api/videos/${id}`);
    if (!response.ok) throw new Error("Video unavailable");
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
      headers: { "content-type": "application/json", ...api.authHeaders() },
      body: JSON.stringify(comment),
    });
    if (!response.ok) throw new Error("Comment failed");
    return response.json();
  },
  async createVideo(video) {
    const response = await fetch("/api/videos", {
      method: "POST",
      headers: { "content-type": "application/json", ...api.authHeaders() },
      body: JSON.stringify(video),
    });
    if (!response.ok) throw new Error("Create video failed");
    return response.json();
  },
  async me() {
    const response = await fetch("/api/auth/me", { headers: api.authHeaders() });
    if (!response.ok) throw new Error("Session unavailable");
    return response.json();
  },
  async login(credentials) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json();
  },
  async signup(credentials) {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error("Signup failed");
    return response.json();
  },
  async logout() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: api.authHeaders(),
    });
    if (!response.ok) throw new Error("Logout failed");
    return response.json();
  },
};

const els = {
  shell: document.querySelector(".shell"),
  sidebar: document.querySelector("#sidebar"),
  homeView: document.querySelector("#homeView"),
  watchView: document.querySelector("#watchView"),
  homeLink: document.querySelector("#homeLink"),
  navItems: document.querySelectorAll(".nav-item"),
  createButton: document.querySelector("#createButton"),
  accountButton: document.querySelector("#accountButton"),
  accountMenu: document.querySelector("#accountMenu"),
  accountName: document.querySelector("#accountName"),
  accountEmail: document.querySelector("#accountEmail"),
  loginOpenButton: document.querySelector("#loginOpenButton"),
  logoutButton: document.querySelector("#logoutButton"),
  chips: document.querySelector("#chips"),
  videoGrid: document.querySelector("#videoGrid"),
  shortsRow: document.querySelector("#shortsRow"),
  feedTitle: document.querySelector("#feedTitle"),
  resultCount: document.querySelector("#resultCount"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  featuredThumb: document.querySelector("#featuredThumb"),
  featuredTitle: document.querySelector("#featuredTitle"),
  featuredDescription: document.querySelector("#featuredDescription"),
  watchFeatured: document.querySelector("#watchFeatured"),
  watchFeaturedAction: document.querySelector("#watchFeaturedAction"),
  copyLinkButton: document.querySelector("#copyLinkButton"),
  watchTitle: document.querySelector("#watchTitle"),
  watchAvatar: document.querySelector("#watchAvatar"),
  watchChannel: document.querySelector("#watchChannel"),
  watchSubscribers: document.querySelector("#watchSubscribers"),
  watchViews: document.querySelector("#watchViews"),
  watchDescription: document.querySelector("#watchDescription"),
  subscribeButton: document.querySelector("#subscribeButton"),
  likeButton: document.querySelector("#likeButton"),
  likeCount: document.querySelector("#likeCount"),
  shareButton: document.querySelector("#shareButton"),
  saveButton: document.querySelector("#saveButton"),
  commentCount: document.querySelector("#commentCount"),
  commentForm: document.querySelector("#commentForm"),
  commentText: document.querySelector("#commentText"),
  commentsList: document.querySelector("#commentsList"),
  watchRecommendations: document.querySelector("#watchRecommendations"),
  uploadModal: document.querySelector("#uploadModal"),
  closeUpload: document.querySelector("#closeUpload"),
  uploadForm: document.querySelector("#uploadForm"),
  uploadYoutube: document.querySelector("#uploadYoutube"),
  uploadTitle: document.querySelector("#uploadTitleInput"),
  uploadChannel: document.querySelector("#uploadChannel"),
  uploadCategory: document.querySelector("#uploadCategory"),
  uploadDescription: document.querySelector("#uploadDescription"),
  authModal: document.querySelector("#authModal"),
  closeAuth: document.querySelector("#closeAuth"),
  authForm: document.querySelector("#authForm"),
  authTitle: document.querySelector("#authTitle"),
  authNameLabel: document.querySelector("#authNameLabel"),
  authName: document.querySelector("#authName"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authSubmit: document.querySelector("#authSubmit"),
  loginTab: document.querySelector("#loginTab"),
  signupTab: document.querySelector("#signupTab"),
  toast: document.querySelector("#toast"),
};

const fallbackState = {
  categories: ["All", "Music", "Learning", "Gaming", "JavaScript", "Travel", "Cooking", "News", "Live", "Recently uploaded"],
  featured: null,
  videos: [],
  shorts: [],
};

let categories = [];
let allVideos = [];
let visibleVideos = [];
let shorts = [];
let featured = null;
let activeCategory = "All";
let activeQuery = "";
let activeMode = "home";
let activeVideo = null;
let currentUser = null;
let authMode = "login";
let searchTimer = null;
let toastTimer = null;

window.onYouTubeIframeAPIReady = () => {
  window.virelloYouTubeApiReady = true;
};

function readSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}

function writeSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

const savedIds = readSet("virello:saved");
const likedIds = readSet("virello:liked");
const subscribedChannels = readSet("virello:subscribed");
let historyIds = [...readSet("virello:history")];

function readLocalUser() {
  try {
    return JSON.parse(localStorage.getItem("virello:user") || "null");
  } catch {
    return null;
  }
}

function readLocalAccounts() {
  try {
    return JSON.parse(localStorage.getItem("virello:accounts") || "[]");
  } catch {
    return [];
  }
}

function writeLocalAccounts(accounts) {
  localStorage.setItem("virello:accounts", JSON.stringify(accounts));
}

function saveAuthSession(user, token = "") {
  currentUser = user;
  if (token) localStorage.setItem("virello:token", token);
  localStorage.setItem("virello:user", JSON.stringify(user));
  renderAccount();
}

function clearAuthSession() {
  currentUser = null;
  localStorage.removeItem("virello:token");
  localStorage.removeItem("virello:user");
  renderAccount();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compactNumber(value) {
  const count = Number(value || 0);
  if (count >= 1000000000) return `${Number((count / 1000000000).toFixed(1))}B`;
  if (count >= 1000000) return `${Number((count / 1000000).toFixed(1))}M`;
  if (count >= 1000) return `${Number((count / 1000).toFixed(1))}K`;
  return String(count);
}

function viewLabel(count, live = false) {
  return `${compactNumber(count)} ${live ? "watching" : "views"}`;
}

function thumbnailUrl(youtubeId, quality = "hqdefault") {
  return `https://img.youtube.com/vi/${youtubeId}/${quality}.jpg`;
}

function initials(name) {
  return String(name || "V")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function presentVideo(video) {
  return {
    ...video,
    comments: video.comments || [],
    views: viewLabel(video.viewCount, video.category === "Live"),
    thumbnail: video.thumbnail || thumbnailUrl(video.youtubeId),
  };
}

function presentShort(short) {
  return {
    ...short,
    views: viewLabel(short.viewCount),
    thumbnail: short.thumbnail || thumbnailUrl(short.youtubeId),
  };
}

function extractYouTubeId(value) {
  const text = String(value || "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  const match = patterns.map((pattern) => text.match(pattern)).find(Boolean);
  return match ? match[1] : "";
}

function slugify(value) {
  return String(value || "video")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42) || "video";
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1800);
}

function renderAccount() {
  const name = currentUser?.name || "Guest";
  els.accountButton.textContent = initials(name);
  els.accountName.textContent = name;
  els.accountEmail.textContent = currentUser?.email || "Not signed in";
  els.loginOpenButton.hidden = Boolean(currentUser);
  els.logoutButton.hidden = !currentUser;
  if (currentUser) {
    els.commentText.placeholder = `Comment as ${currentUser.name}`;
  } else {
    els.commentText.placeholder = "Sign in to add a comment";
  }
}

function requireLogin(action = "continue") {
  if (currentUser) return true;
  showToast(`Sign in to ${action}`);
  openAuthModal("login");
  return false;
}

function openAuthModal(mode = "login") {
  authMode = mode;
  const signingUp = authMode === "signup";
  els.authTitle.textContent = signingUp ? "Create your Virello account" : "Sign in to Virello";
  els.authSubmit.textContent = signingUp ? "Create account" : "Login";
  els.authNameLabel.hidden = !signingUp;
  els.authName.required = signingUp;
  els.loginTab.classList.toggle("active", !signingUp);
  els.signupTab.classList.toggle("active", signingUp);
  els.authModal.classList.add("open");
  els.authModal.setAttribute("aria-hidden", "false");
  els.accountMenu.hidden = true;
  setTimeout(() => (signingUp ? els.authName : els.authEmail).focus(), 0);
}

function closeAuthModal() {
  els.authModal.classList.remove("open");
  els.authModal.setAttribute("aria-hidden", "true");
  els.authForm.reset();
}

function setActiveNav(nav) {
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.nav === nav));
}

function saveHistory(id) {
  historyIds = [id, ...historyIds.filter((item) => item !== id)].slice(0, 30);
  localStorage.setItem("virello:history", JSON.stringify(historyIds));
}

function titleForMode() {
  if (activeQuery) return `Search results for "${activeQuery}"`;
  if (activeMode === "library") return "Saved videos";
  if (activeMode === "history") return "History";
  if (activeMode === "subscriptions") return "Subscriptions";
  if (activeCategory !== "All") return activeCategory;
  return "Recommended";
}

function computeVisibleVideos() {
  const query = activeQuery.trim().toLowerCase();
  let items = [...allVideos];

  if (activeMode === "library") {
    items = items.filter((video) => savedIds.has(video.id));
  } else if (activeMode === "history") {
    const byId = new Map(items.map((video) => [video.id, video]));
    items = historyIds.map((id) => byId.get(id)).filter(Boolean);
  } else if (activeMode === "subscriptions") {
    items = items.filter((video) => subscribedChannels.has(video.channel));
  } else if (activeCategory !== "All") {
    items = items.filter((video) => video.category === activeCategory || activeCategory === "Recently uploaded");
  }

  if (query) {
    items = items.filter((video) =>
      [video.title, video.channel, video.category, video.description].some((value) => String(value).toLowerCase().includes(query))
    );
  }

  visibleVideos = items;
}

function renderFeatured() {
  if (!featured) return;
  const item = presentVideo(featured);
  els.featuredThumb.src = item.thumbnail;
  els.featuredThumb.alt = item.title;
  els.featuredTitle.textContent = item.title;
  els.featuredDescription.textContent = item.description;
}

function renderChips() {
  els.chips.innerHTML = categories
    .map((category) => `<button class="chip${category === activeCategory ? " active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
    .join("");
}

function renderUploadCategories() {
  els.uploadCategory.innerHTML = categories
    .filter((category) => category !== "All")
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
}

function renderVideos() {
  computeVisibleVideos();
  els.feedTitle.textContent = titleForMode();
  els.resultCount.textContent = `${visibleVideos.length} video${visibleVideos.length === 1 ? "" : "s"}`;
  els.videoGrid.innerHTML = visibleVideos.length
    ? visibleVideos.map(videoCardTemplate).join("")
    : `<p class="empty-state">No videos found. Try another search or category.</p>`;
}

function videoCardTemplate(video) {
  return `
    <button class="video-card" type="button" data-video-id="${escapeHtml(video.id)}">
      <span class="thumb">
        <img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" loading="lazy" />
        <span class="duration">${escapeHtml(video.duration)}</span>
      </span>
      <footer>
        <span class="channel-avatar" style="--avatar-bg: ${escapeHtml(video.avatar)}">${escapeHtml(initials(video.channel))}</span>
        <span class="video-info">
          <h3 class="video-title">${escapeHtml(video.title)}</h3>
          <p class="video-channel">${escapeHtml(video.channel)}</p>
          <p class="meta-line"><span>${escapeHtml(video.views)}</span><span>-</span><span>${escapeHtml(video.age)}</span></p>
        </span>
      </footer>
    </button>
  `;
}

function renderShorts() {
  els.shortsRow.innerHTML = shorts
    .map(
      (short) => `
        <button class="short-card" type="button" data-short-id="${escapeHtml(short.id)}">
          <span class="short-thumb">
            <img src="${escapeHtml(short.thumbnail)}" alt="${escapeHtml(short.title)}" loading="lazy" />
          </span>
          <h3>${escapeHtml(short.title)}</h3>
          <p class="short-meta">${escapeHtml(short.views)}</p>
        </button>
      `
    )
    .join("");
}

function renderRecommendations() {
  const items = allVideos.filter((video) => video.id !== activeVideo?.id).slice(0, 10);
  els.watchRecommendations.innerHTML = items
    .map(
      (video) => `
        <button class="recommendation" type="button" data-video-id="${escapeHtml(video.id)}">
          <span class="recommendation-thumb">
            <img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" loading="lazy" />
            <span>${escapeHtml(video.duration)}</span>
          </span>
          <span class="recommendation-info">
            <strong>${escapeHtml(video.title)}</strong>
            <small>${escapeHtml(video.channel)}</small>
            <small>${escapeHtml(video.views)} - ${escapeHtml(video.age)}</small>
          </span>
        </button>
      `
    )
    .join("");
}

function renderComments(video) {
  const comments = video.comments || [];
  els.commentCount.textContent = `${comments.length} comment${comments.length === 1 ? "" : "s"}`;
  els.commentsList.innerHTML = comments.length
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

function renderWatchActions() {
  if (!activeVideo) return;
  els.likeButton.classList.toggle("selected", likedIds.has(activeVideo.id));
  els.saveButton.classList.toggle("selected", savedIds.has(activeVideo.id));
  els.saveButton.lastChild.textContent = savedIds.has(activeVideo.id) ? "Saved" : "Save";
  els.subscribeButton.textContent = subscribedChannels.has(activeVideo.channel) ? "Subscribed" : "Subscribe";
  els.subscribeButton.classList.toggle("subscribed", subscribedChannels.has(activeVideo.channel));
}

function renderAll() {
  renderFeatured();
  renderChips();
  renderUploadCategories();
  renderVideos();
  renderShorts();
  if (activeVideo) renderRecommendations();
}

function stopPlayer() {
  const host = document.querySelector("#youtubePlayer");
  if (host) host.innerHTML = "";
}

function loadPlayer(youtubeId) {
  const host = document.querySelector("#youtubePlayer");
  host.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&controls=1&rel=0&modestbranding=1"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen>
    </iframe>
  `;
}

function showHome() {
  els.homeView.hidden = false;
  els.watchView.hidden = true;
  document.body.classList.remove("watching");
  document.title = "Virello";
  history.replaceState(null, "", location.pathname);
  stopPlayer();
}

function showWatch() {
  els.homeView.hidden = true;
  els.watchView.hidden = false;
  document.body.classList.add("watching");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hydrateWatch(video) {
  activeVideo = presentVideo(video);
  document.title = `${activeVideo.title} - Virello`;
  els.watchTitle.textContent = activeVideo.title;
  els.watchAvatar.textContent = initials(activeVideo.channel);
  els.watchAvatar.style.setProperty("--avatar-bg", activeVideo.avatar);
  els.watchChannel.textContent = activeVideo.channel;
  els.watchSubscribers.textContent = activeVideo.subscribers || "Virello channel";
  els.watchViews.textContent = `${activeVideo.views} - ${activeVideo.age}`;
  els.watchDescription.textContent = activeVideo.description;
  els.likeCount.textContent = compactNumber(activeVideo.likes);
  renderComments(activeVideo);
  renderRecommendations();
  renderWatchActions();
  showWatch();
  loadPlayer(activeVideo.youtubeId);
}

async function openVideo(id, options = {}) {
  let video = allVideos.find((item) => item.id === id) || featured;
  if (!video) return;

  try {
    video = await api.getVideo(id);
  } catch {
    // GitHub Pages fallback uses the already loaded static data.
  }

  hydrateWatch(video);
  saveHistory(id);
  history.replaceState(null, "", `#watch=${encodeURIComponent(id)}`);

  if (!options.skipView) {
    try {
      const updated = await api.countView(id);
      const presented = presentVideo(updated);
      Object.assign(activeVideo, presented);
      allVideos = allVideos.map((item) => (item.id === id ? presented : item));
      els.watchViews.textContent = `${activeVideo.views} - ${activeVideo.age}`;
    } catch {
      activeVideo.viewCount = (activeVideo.viewCount || 0) + 1;
      activeVideo.views = viewLabel(activeVideo.viewCount, activeVideo.category === "Live");
      els.watchViews.textContent = `${activeVideo.views} - ${activeVideo.age}`;
    }
  }
}

async function loadData() {
  let data = fallbackState;
  try {
    data = await api.bootstrap();
  } catch {
    const response = await fetch("data/db.json");
    data = response.ok ? await response.json() : fallbackState;
  }

  categories = data.categories || fallbackState.categories;
  featured = data.featured;
  allVideos = (data.videos || []).map(presentVideo);
  shorts = (data.shorts || []).map(presentShort);
  renderAll();

  const watchId = location.hash.startsWith("#watch=") ? decodeURIComponent(location.hash.replace("#watch=", "")) : "";
  if (watchId) openVideo(watchId, { skipView: true });
}

function runSearch() {
  activeQuery = els.searchInput.value.trim();
  activeMode = "home";
  activeCategory = "All";
  setActiveNav("home");
  showHome();
  renderAll();
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 180);
}

function openUploadModal() {
  if (!requireLogin("create a video")) return;
  els.uploadModal.classList.add("open");
  els.uploadModal.setAttribute("aria-hidden", "false");
  els.uploadYoutube.focus();
}

function closeUploadModal() {
  els.uploadModal.classList.remove("open");
  els.uploadModal.setAttribute("aria-hidden", "true");
  els.uploadForm.reset();
}

function localCreateVideo(payload) {
  const youtubeId = extractYouTubeId(payload.youtubeUrl || payload.youtubeId);
  const baseId = slugify(payload.title);
  let id = baseId;
  let suffix = 2;
  while (allVideos.some((video) => video.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return presentVideo({
    id,
    youtubeId,
    title: payload.title,
    channel: payload.channel,
    description: payload.description || "Added through Virello Create.",
    viewCount: 0,
    age: "Just now",
    duration: "YouTube",
    category: payload.category || "Recently uploaded",
    avatar: "#2563eb",
    likes: 0,
    subscribers: "New channel",
    comments: [],
  });
}

els.homeLink.addEventListener("click", (event) => {
  event.preventDefault();
  activeMode = "home";
  activeCategory = "All";
  activeQuery = "";
  els.searchInput.value = "";
  setActiveNav("home");
  showHome();
  renderAll();
});

els.navItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    const nav = item.dataset.nav;
    setActiveNav(nav);

    if (nav === "shorts") {
      activeMode = "home";
      showHome();
      renderAll();
      document.querySelector("#shorts").scrollIntoView({ behavior: "smooth" });
      return;
    }

    activeMode = nav === "home" ? "home" : nav;
    activeCategory = "All";
    activeQuery = "";
    els.searchInput.value = "";
    showHome();
    renderAll();
  });
});

els.chips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  activeMode = "home";
  activeCategory = chip.dataset.category;
  activeQuery = "";
  els.searchInput.value = "";
  setActiveNav("home");
  renderAll();
});

els.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});

els.searchInput.addEventListener("input", debounceSearch);

els.videoGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".video-card");
  if (card) openVideo(card.dataset.videoId);
});

els.watchRecommendations.addEventListener("click", (event) => {
  const card = event.target.closest(".recommendation");
  if (card) openVideo(card.dataset.videoId);
});

els.shortsRow.addEventListener("click", (event) => {
  const card = event.target.closest(".short-card");
  if (!card) return;
  const short = shorts.find((item) => item.id === card.dataset.shortId);
  const video = allVideos.find((item) => item.youtubeId === short?.youtubeId) || featured;
  if (video) openVideo(video.id);
});

els.watchFeatured.addEventListener("click", () => featured && openVideo(featured.id));
els.watchFeaturedAction.addEventListener("click", () => featured && openVideo(featured.id));

els.likeButton.addEventListener("click", async () => {
  if (!activeVideo) return;
  const alreadyLiked = likedIds.has(activeVideo.id);
  if (alreadyLiked) {
    likedIds.delete(activeVideo.id);
    activeVideo.likes = Math.max(0, Number(activeVideo.likes || 0) - 1);
  } else {
    likedIds.add(activeVideo.id);
    try {
      const updated = await api.likeVideo(activeVideo.id);
      activeVideo.likes = updated.likes;
    } catch {
      activeVideo.likes = Number(activeVideo.likes || 0) + 1;
    }
  }
  writeSet("virello:liked", likedIds);
  els.likeCount.textContent = compactNumber(activeVideo.likes);
  renderWatchActions();
});

els.saveButton.addEventListener("click", () => {
  if (!activeVideo) return;
  if (savedIds.has(activeVideo.id)) {
    savedIds.delete(activeVideo.id);
    showToast("Removed from Library");
  } else {
    savedIds.add(activeVideo.id);
    showToast("Saved to Library");
  }
  writeSet("virello:saved", savedIds);
  renderWatchActions();
});

els.subscribeButton.addEventListener("click", () => {
  if (!activeVideo) return;
  if (subscribedChannels.has(activeVideo.channel)) {
    subscribedChannels.delete(activeVideo.channel);
    showToast(`Unsubscribed from ${activeVideo.channel}`);
  } else {
    subscribedChannels.add(activeVideo.channel);
    showToast(`Subscribed to ${activeVideo.channel}`);
  }
  writeSet("virello:subscribed", subscribedChannels);
  renderWatchActions();
});

els.commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeVideo || !requireLogin("comment")) return;

  const payload = {
    name: currentUser.name,
    text: els.commentText.value,
  };

  try {
    const comment = await api.addComment(activeVideo.id, payload);
    activeVideo.comments = [comment, ...(activeVideo.comments || [])];
  } catch {
    activeVideo.comments = [
      {
        id: `local-${Date.now()}`,
        name: currentUser.name,
        text: payload.text,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
      },
      ...(activeVideo.comments || []),
    ];
  }

  els.commentText.value = "";
  renderComments(activeVideo);
  showToast("Comment posted");
});

els.shareButton.addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#watch=${encodeURIComponent(activeVideo?.id || "")}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  } catch {
    window.prompt("Copy link", url);
  }
});

els.copyLinkButton.addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  } catch {
    window.prompt("Copy link", url);
  }
});

els.createButton.addEventListener("click", openUploadModal);
els.accountButton.addEventListener("click", () => {
  els.accountMenu.hidden = !els.accountMenu.hidden;
});
els.loginOpenButton.addEventListener("click", () => openAuthModal("login"));
els.logoutButton.addEventListener("click", async () => {
  try {
    await api.logout();
  } catch {
    // Static fallback can still clear the local session.
  }
  clearAuthSession();
  els.accountMenu.hidden = true;
  showToast("Signed out");
});
els.closeUpload.addEventListener("click", closeUploadModal);
els.uploadModal.addEventListener("click", (event) => {
  if (event.target === els.uploadModal) closeUploadModal();
});

els.closeAuth.addEventListener("click", closeAuthModal);
els.authModal.addEventListener("click", (event) => {
  if (event.target === els.authModal) closeAuthModal();
});
els.loginTab.addEventListener("click", () => openAuthModal("login"));
els.signupTab.addEventListener("click", () => openAuthModal("signup"));

els.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const credentials = {
    name: els.authName.value.trim(),
    email: els.authEmail.value.trim(),
    password: els.authPassword.value,
  };

  try {
    const session = authMode === "signup" ? await api.signup(credentials) : await api.login(credentials);
    saveAuthSession(session.user, session.token);
    closeAuthModal();
    showToast(authMode === "signup" ? "Account created" : "Signed in");
  } catch {
    if (authMode === "signup") {
      const localUser = {
        id: `local-${Date.now()}`,
        name: credentials.name || credentials.email.split("@")[0],
        email: credentials.email,
        avatar: (credentials.name || credentials.email).slice(0, 1).toUpperCase(),
      };
      const accounts = readLocalAccounts().filter((account) => account.email !== localUser.email);
      accounts.push({ ...localUser, password: credentials.password });
      writeLocalAccounts(accounts);
      saveAuthSession(localUser, `local-${Date.now()}`);
      closeAuthModal();
      showToast("Account created locally");
    } else {
      const account = readLocalAccounts().find((item) => item.email === credentials.email && item.password === credentials.password);
      if (account) {
        const { password, ...localUser } = account;
        saveAuthSession(localUser, `local-${Date.now()}`);
        closeAuthModal();
        showToast("Signed in locally");
      } else {
        showToast("Login failed. Try sign up first.");
      }
    }
  }
});

els.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const youtubeId = extractYouTubeId(els.uploadYoutube.value);
  if (!youtubeId) {
    showToast("Enter a valid YouTube URL or 11-character video ID");
    return;
  }

  const payload = {
    youtubeUrl: els.uploadYoutube.value,
    youtubeId,
    title: els.uploadTitle.value.trim(),
    channel: els.uploadChannel.value.trim(),
    category: els.uploadCategory.value,
    description: els.uploadDescription.value.trim(),
  };

  let created;
  try {
    created = await api.createVideo(payload);
    showToast("Video added");
  } catch {
    created = localCreateVideo(payload);
    showToast("Video added locally");
  }

  const presented = presentVideo(created);
  allVideos = [presented, ...allVideos.filter((video) => video.id !== presented.id)];
  closeUploadModal();
  renderAll();
  openVideo(presented.id, { skipView: true });
});

document.querySelector("#menuButton").addEventListener("click", () => {
  els.sidebar.classList.toggle("collapsed");
  els.shell.classList.toggle("nav-collapsed");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && els.uploadModal.classList.contains("open")) {
    closeUploadModal();
  }
  if (event.key === "Escape" && els.authModal.classList.contains("open")) {
    closeAuthModal();
  }
});

async function restoreSession() {
  currentUser = readLocalUser();
  renderAccount();
  if (!api.token()) return;
  try {
    const session = await api.me();
    if (session.user) saveAuthSession(session.user);
  } catch {
    // Keep static/local sessions available on GitHub Pages.
  }
}

restoreSession();
loadData();
