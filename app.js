const categories = [
  "All",
  "Design",
  "Music",
  "Gaming",
  "Podcasts",
  "Live",
  "JavaScript",
  "Cooking",
  "Travel",
  "News",
  "Recently uploaded",
];

const videos = [
  {
    title: "I rebuilt my entire studio around one tiny desk",
    channel: "Creator Lab",
    views: "1.8M views",
    age: "2 days ago",
    duration: "12:48",
    category: "Design",
    thumb: "linear-gradient(135deg, #203a43, #2c5364 45%, #f9d423)",
    avatar: "#0ea5e9",
  },
  {
    title: "No-code automations that quietly save ten hours a week",
    channel: "Ops Theory",
    views: "418K views",
    age: "5 days ago",
    duration: "18:05",
    category: "JavaScript",
    thumb: "linear-gradient(135deg, #101820, #f2aa4c 58%, #ffffff)",
    avatar: "#f97316",
  },
  {
    title: "Lo-fi beats for late night edits and clean focus",
    channel: "Room Tone",
    views: "6.2M views",
    age: "1 month ago",
    duration: "1:02:12",
    category: "Music",
    thumb: "linear-gradient(135deg, #14213d, #fca311 52%, #e5e5e5)",
    avatar: "#8b5cf6",
  },
  {
    title: "Building a tiny city in survival mode",
    channel: "Block & Build",
    views: "923K views",
    age: "3 weeks ago",
    duration: "24:39",
    category: "Gaming",
    thumb: "linear-gradient(135deg, #2d6a4f, #95d5b2 55%, #ffd166)",
    avatar: "#22c55e",
  },
  {
    title: "What actually happens inside a coffee roastery",
    channel: "Field Notes",
    views: "311K views",
    age: "4 days ago",
    duration: "9:31",
    category: "Cooking",
    thumb: "linear-gradient(135deg, #1b1b1b, #6f4e37 50%, #e0b084)",
    avatar: "#7c2d12",
  },
  {
    title: "React state patterns explained with real interface problems",
    channel: "Frontend Desk",
    views: "782K views",
    age: "8 days ago",
    duration: "16:22",
    category: "JavaScript",
    thumb: "linear-gradient(135deg, #023047, #219ebc 55%, #ffb703)",
    avatar: "#0284c7",
  },
  {
    title: "A calm walking tour through Kyoto at sunrise",
    channel: "Slow Miles",
    views: "2.1M views",
    age: "2 weeks ago",
    duration: "34:10",
    category: "Travel",
    thumb: "linear-gradient(135deg, #355070, #eaac8b 50%, #f8edeb)",
    avatar: "#db2777",
  },
  {
    title: "The practical future of AI assistants at work",
    channel: "Signal Daily",
    views: "654K views",
    age: "13 hours ago",
    duration: "21:17",
    category: "News",
    thumb: "linear-gradient(135deg, #111827, #4f46e5 48%, #06b6d4)",
    avatar: "#111827",
  },
  {
    title: "Live jam: synthwave set with modular hardware",
    channel: "Patch Bay",
    views: "128K watching",
    age: "Live",
    duration: "LIVE",
    category: "Live",
    thumb: "linear-gradient(135deg, #240046, #ff006e 52%, #ffbe0b)",
    avatar: "#e11d48",
  },
  {
    title: "Why modern dashboards still feel slow and how to fix them",
    channel: "Product Systems",
    views: "234K views",
    age: "6 days ago",
    duration: "14:04",
    category: "Design",
    thumb: "linear-gradient(135deg, #3a0ca3, #4cc9f0 54%, #f72585)",
    avatar: "#7c3aed",
  },
  {
    title: "The restaurant prep list that changed my weeknight dinners",
    channel: "Sharp Knife",
    views: "1.1M views",
    age: "1 week ago",
    duration: "11:28",
    category: "Cooking",
    thumb: "linear-gradient(135deg, #283618, #dda15e 52%, #fefae0)",
    avatar: "#65a30d",
  },
  {
    title: "Deep dive podcast: shipping software without drama",
    channel: "Release Notes",
    views: "94K views",
    age: "Yesterday",
    duration: "58:43",
    category: "Podcasts",
    thumb: "linear-gradient(135deg, #001219, #0a9396 52%, #ee9b00)",
    avatar: "#0f766e",
  },
];

const shorts = [
  ["Fastest color palette trick", "3.4M views", "linear-gradient(145deg, #ff595e, #ffca3a, #8ac926)"],
  ["One minute desk reset", "742K views", "linear-gradient(145deg, #1982c4, #6a4c93, #ff99c8)"],
  ["Pocket synth test", "1.2M views", "linear-gradient(145deg, #2b2d42, #8d99ae, #ef233c)"],
  ["A street food perfect loop", "986K views", "linear-gradient(145deg, #006d77, #83c5be, #ffddd2)"],
  ["Tiny game level reveal", "521K views", "linear-gradient(145deg, #386641, #a7c957, #f2e8cf)"],
  ["Travel bag in 20 seconds", "2M views", "linear-gradient(145deg, #03045e, #00b4d8, #caf0f8)"],
];

const chipsEl = document.querySelector("#chips");
const gridEl = document.querySelector("#videoGrid");
const shortsEl = document.querySelector("#shortsRow");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const playerModal = document.querySelector("#playerModal");
const playerScreen = document.querySelector("#playerScreen");
const playerTitle = document.querySelector("#playerTitle");
const playerChannel = document.querySelector("#playerChannel");

let activeCategory = "All";
let activeQuery = "";

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
    <div class="thumb" style="--thumb-bg: ${video.thumb}">
      <div class="visual-block"></div>
      <div class="visual-lines"><span></span><span></span><span></span></div>
      <span class="duration">${video.duration}</span>
    </div>
  `;
}

function openPlayer(video) {
  playerScreen.style.setProperty("--thumb-bg", video.thumb);
  playerTitle.textContent = video.title;
  playerChannel.textContent = `${video.channel} • ${video.views}`;
  playerModal.classList.add("open");
  playerModal.setAttribute("aria-hidden", "false");
}

function renderVideos() {
  const query = activeQuery.trim().toLowerCase();
  const visible = videos.filter((video) => {
    const categoryMatch = activeCategory === "All" || video.category === activeCategory || activeCategory === "Recently uploaded";
    const queryMatch = [video.title, video.channel, video.category].some((value) => value.toLowerCase().includes(query));
    return categoryMatch && queryMatch;
  });

  resultCount.textContent = `${visible.length} video${visible.length === 1 ? "" : "s"}`;
  gridEl.innerHTML = visible
    .map(
      (video) => `
        <button class="video-card" type="button" data-index="${videos.indexOf(video)}">
          ${createThumbnail(video)}
          <footer>
            <span class="channel-avatar" style="--avatar-bg: ${video.avatar}">${initials(video.channel)}</span>
            <div class="video-info">
              <h3 class="video-title">${video.title}</h3>
              <p class="video-channel">${video.channel}</p>
              <p class="meta-line"><span>${video.views}</span><span>•</span><span>${video.age}</span></p>
            </div>
          </footer>
        </button>
      `
    )
    .join("");

  if (!visible.length) {
    gridEl.innerHTML = `<p class="empty-state">No videos found. Try a broader search.</p>`;
  }
}

function renderChips() {
  chipsEl.innerHTML = categories
    .map((category) => `<button class="chip${category === activeCategory ? " active" : ""}" type="button" data-category="${category}">${category}</button>`)
    .join("");
}

function renderShorts() {
  shortsEl.innerHTML = shorts
    .map(
      ([title, views, thumb], index) => `
        <button class="short-card" type="button" data-short="${index}">
          <div class="short-thumb" style="--thumb-bg: ${thumb}"></div>
          <h3>${title}</h3>
          <p class="short-meta">${views}</p>
        </button>
      `
    )
    .join("");
}

chipsEl.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  activeCategory = chip.dataset.category;
  renderChips();
  renderVideos();
});

gridEl.addEventListener("click", (event) => {
  const card = event.target.closest(".video-card");
  if (!card) return;
  openPlayer(videos[Number(card.dataset.index)]);
});

shortsEl.addEventListener("click", (event) => {
  const card = event.target.closest(".short-card");
  if (!card) return;
  const [title, views, thumb] = shorts[Number(card.dataset.short)];
  openPlayer({
    title,
    channel: "Virello Shorts",
    views,
    thumb,
  });
});

document.querySelector("#watchFeatured").addEventListener("click", () => {
  openPlayer({
    title: "Build Room: Designing a Creator Dashboard",
    channel: "Creator Lab Live",
    views: "128K watching",
    thumb: "linear-gradient(155deg, #304f9c 0%, #845ec2 42%, #ff6f59 100%)",
  });
});

document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  activeQuery = searchInput.value;
  renderVideos();
});

searchInput.addEventListener("input", () => {
  activeQuery = searchInput.value;
  renderVideos();
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

renderChips();
renderVideos();
renderShorts();
