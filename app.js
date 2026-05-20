const api = {
  async getBootstrap(category = "All", query = "") {
    const params = new URLSearchParams({ category, query });
    const response = await fetch(`/api/bootstrap?${params}`);
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
      headers: { "content-type": "application/json" },
      body: JSON.stringify(comment),
    });
    if (!response.ok) throw new Error("Comment failed");
    return response.json();
  },
};

const fallbackState = {
  categories: ["All", "Music", "Learning", "Gaming", "JavaScript", "Travel", "Cooking", "News", "Live", "Recently uploaded"],
  featured: null,
  videos: [],
  shorts: [],
};

const els = {
  shell: document.querySelector(".shell"),
  sidebar: document.querySelector("#sidebar"),
  homeView: document.querySelector("#homeView"),
  watchView: document.querySelector("#watchView"),
  homeLink: document.querySelector("#homeLink"),
  chips: document.querySelector("#chips"),
  videoGrid: document.querySelector("#videoGrid"),
  shortsRow: document.querySelector("#shortsRow"),
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
  likeButton: document.querySelector("#likeButton"),
  likeCount: document.querySelector("#likeCount"),
  shareButton: document.querySelector("#shareButton"),
  commentCount: document.querySelector("#commentCount"),
  commentForm: document.querySelector("#commentForm"),
  commentName: document.querySelector("#commentName"),
  commentText: document.querySelector("#commentText"),
  commentsList: document.querySelector("#commentsList"),
  watchRecommendations: document.querySelector("#watchRecommendations"),
};

let categories = [];
let videos = [];
let shorts = [];
let featured = null;
let activeCategory = "All";
let activeQuery = "";
let activeVideo = null;
let player = null;
let playerApiReady = false;
let pendingVideoId = null;

window.onYouTubeIframeAPIReady = () => {
  playerApiReady = true;
  if (pendingVideoId) loadPlayer(pendingVideoId);
};

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
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function presentVideo(video) {
  return {
    ...video,
    views: viewLabel(video.viewCount, video.category === "Live"),
    thumbnail: video.thumbnail || thumbnailUrl(video.youtubeId),
    commentCount: (video.comments || []).length,
  };
}

function presentShort(short) {
  return {
    ...short,
    views: viewLabel(short.viewCount),
    thumbnail: short.thumbnail || thumbnailUrl(short.youtubeId),
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

function loadPlayer(youtubeId) {
  pendingVideoId = youtubeId;
  if (!playerApiReady || !window.YT?.Player) {
    document.querySelector("#youtubePlayer").innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&controls=1&rel=0&modestbranding=1"
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `;
    return;
  }

  if (!player) {
    document.querySelector("#youtubePlayer").innerHTML = "";
    player = new YT.Player("youtubePlayer", {
      videoId: youtubeId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
    });
    return;
  }

  player.loadVideoById(youtubeId);
}

function showHome() {
  els.homeView.hidden = false;
  els.watchView.hidden = true;
  document.body.classList.remove("watching");
  history.replaceState(null, "", location.pathname);
  if (player?.stopVideo) player.stopVideo();
}

function showWatch() {
  els.homeView.hidden = true;
  els.watchView.hidden = false;
  document.body.classList.add("watching");
  window.scrollTo({ top: 0, behavior: "smooth" });
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

function renderVideos() {
  els.resultCount.textContent = `${videos.length} video${videos.length === 1 ? "" : "s"}`;
  els.videoGrid.innerHTML = videos.length
    ? videos
        .map(
          (video) => `
            <button class="video-card" type="button" data-video-id="${escapeHtml(video.id)}">
              <span class="thumb">
                <img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" loading="lazy" />
                <span class="duration">${escapeHtml(video.duration)}</span>
              </span>
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
        .join("")
    : `<p class="empty-state">No videos found. Try a broader search.</p>`;
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
  const items = videos.filter((video) => video.id !== activeVideo?.id).slice(0, 8);
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
  showWatch();
  loadPlayer(activeVideo.youtubeId);
}

async function openVideo(id, options = {}) {
  const localVideo = videos.find((video) => video.id === id) || featured;
  if (!localVideo) return;

  let video = localVideo;
  try {
    video = await api.getVideo(id);
  } catch {
    video = localVideo;
  }

  hydrateWatch(video);
  history.replaceState(null, "", `#watch=${encodeURIComponent(id)}`);

  if (!options.skipView) {
    try {
      const updated = await api.countView(id);
      Object.assign(activeVideo, presentVideo(updated));
      els.watchViews.textContent = `${activeVideo.views} - ${activeVideo.age}`;
    } catch {
      activeVideo.viewCount = (activeVideo.viewCount || 0) + 1;
      activeVideo.views = viewLabel(activeVideo.viewCount, activeVideo.category === "Live");
      els.watchViews.textContent = `${activeVideo.views} - ${activeVideo.age}`;
    }
  }
}

async function refreshData() {
  try {
    const data = await api.getBootstrap(activeCategory, activeQuery);
    categories = data.categories;
    featured = data.featured;
    videos = data.videos.map(presentVideo);
    shorts = data.shorts.map(presentShort);
  } catch {
    const response = await fetch("data/db.json");
    const data = response.ok ? await response.json() : fallbackState;
    categories = data.categories;
    featured = data.featured;
    videos = filterFallbackVideos(data.videos || []).map(presentVideo);
    shorts = (data.shorts || []).map(presentShort);
  }

  renderFeatured();
  renderChips();
  renderVideos();
  renderShorts();

  const watchId = location.hash.startsWith("#watch=") ? decodeURIComponent(location.hash.replace("#watch=", "")) : "";
  if (watchId && !activeVideo) openVideo(watchId, { skipView: true });
}

els.homeLink.addEventListener("click", (event) => {
  event.preventDefault();
  document.title = "Virello";
  activeVideo = null;
  showHome();
});

els.chips.addEventListener("click", async (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  activeCategory = chip.dataset.category;
  await refreshData();
});

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
  const video = videos.find((item) => item.youtubeId === short?.youtubeId) || featured;
  if (video) openVideo(video.id);
});

els.watchFeatured.addEventListener("click", () => featured && openVideo(featured.id));
els.watchFeaturedAction.addEventListener("click", () => featured && openVideo(featured.id));

els.searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  activeQuery = els.searchInput.value;
  await refreshData();
  showHome();
});

els.searchInput.addEventListener("input", async () => {
  activeQuery = els.searchInput.value;
  await refreshData();
});

els.likeButton.addEventListener("click", async () => {
  if (!activeVideo) return;
  try {
    const updated = await api.likeVideo(activeVideo.id);
    activeVideo.likes = updated.likes;
  } catch {
    activeVideo.likes = (activeVideo.likes || 0) + 1;
    localStorage.setItem(`virello-likes-${activeVideo.id}`, String(activeVideo.likes));
  }
  els.likeCount.textContent = compactNumber(activeVideo.likes);
});

els.commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeVideo) return;

  const payload = {
    name: els.commentName.value,
    text: els.commentText.value,
  };

  try {
    const comment = await api.addComment(activeVideo.id, payload);
    activeVideo.comments = [comment, ...(activeVideo.comments || [])];
  } catch {
    const comment = {
      id: `local-${Date.now()}`,
      name: payload.name || "Guest",
      text: payload.text,
      createdAt: new Date().toISOString(),
    };
    activeVideo.comments = [comment, ...(activeVideo.comments || [])];
    localStorage.setItem(`virello-comments-${activeVideo.id}`, JSON.stringify(activeVideo.comments));
  }

  els.commentText.value = "";
  renderComments(activeVideo);
});

els.shareButton.addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#watch=${encodeURIComponent(activeVideo?.id || "")}`;
  try {
    await navigator.clipboard.writeText(url);
    els.shareButton.lastChild.textContent = "Copied";
    setTimeout(() => {
      els.shareButton.lastChild.textContent = "Share";
    }, 1200);
  } catch {
    prompt("Copy link", url);
  }
});

els.copyLinkButton.addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}`;
  try {
    await navigator.clipboard.writeText(url);
    els.copyLinkButton.textContent = "Copied";
    setTimeout(() => {
      els.copyLinkButton.textContent = "Copy link";
    }, 1200);
  } catch {
    prompt("Copy link", url);
  }
});

document.querySelector("#menuButton").addEventListener("click", () => {
  els.sidebar.classList.toggle("collapsed");
  els.shell.classList.toggle("nav-collapsed");
});

refreshData();
