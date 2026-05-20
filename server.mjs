import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 3000);
const root = process.cwd();
const dbPath = join(root, "data", "db.json");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function readDb() {
  const raw = await readFile(dbPath, "utf-8");
  return JSON.parse(raw);
}

async function writeDb(db) {
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf-8");
}

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  json(res, 404, { error: "Not found" });
}

function formatViews(count, live = false) {
  if (live) return `${compactNumber(count)} watching`;
  return `${compactNumber(count)} views`;
}

function compactNumber(value) {
  if (value >= 1000000) return `${Number((value / 1000000).toFixed(1))}M`;
  if (value >= 1000) return `${Number((value / 1000).toFixed(1))}K`;
  return String(value);
}

function thumbnailUrl(youtubeId, quality = "hqdefault") {
  return `https://img.youtube.com/vi/${youtubeId}/${quality}.jpg`;
}

function presentVideo(video) {
  return {
    ...video,
    views: formatViews(video.viewCount, video.category === "Live"),
    thumbnail: video.thumbnail || thumbnailUrl(video.youtubeId),
    commentCount: video.comments.length,
  };
}

function presentShort(short) {
  return {
    ...short,
    views: formatViews(short.viewCount),
    thumbnail: short.thumbnail || thumbnailUrl(short.youtubeId),
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

function filterVideos(videos, url) {
  const category = url.searchParams.get("category") || "All";
  const query = (url.searchParams.get("query") || "").trim().toLowerCase();

  return videos.filter((video) => {
    const categoryMatch = category === "All" || video.category === category || category === "Recently uploaded";
    const queryMatch = [video.title, video.channel, video.category].some((value) => value.toLowerCase().includes(query));
    return categoryMatch && queryMatch;
  });
}

function resolvePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const requested = cleanPath === "/" ? "/index.html" : cleanPath;
  const filePath = normalize(join(root, requested));
  return filePath.startsWith(root) ? filePath : join(root, "index.html");
}

async function handleApi(req, res, url) {
  const db = await readDb();
  const path = url.pathname;

  if (req.method === "GET" && path === "/api/health") {
    return json(res, 200, { ok: true, app: "Virello" });
  }

  if (req.method === "GET" && path === "/api/bootstrap") {
    return json(res, 200, {
      categories: db.categories,
      featured: db.featured,
      videos: filterVideos(db.videos, url).map(presentVideo),
      shorts: db.shorts.map(presentShort),
    });
  }

  if (req.method === "GET" && path === "/api/categories") {
    return json(res, 200, db.categories);
  }

  if (req.method === "GET" && path === "/api/videos") {
    return json(res, 200, filterVideos(db.videos, url).map(presentVideo));
  }

  if (req.method === "GET" && path === "/api/shorts") {
    return json(res, 200, db.shorts.map(presentShort));
  }

  const videoMatch = path.match(/^\/api\/videos\/([^/]+)(?:\/([^/]+))?$/);
  if (!videoMatch) return notFound(res);

  const [, id, action] = videoMatch;
  const video = db.videos.find((item) => item.id === id);
  if (!video) return notFound(res);

  if (req.method === "GET" && !action) {
    return json(res, 200, presentVideo(video));
  }

  if (req.method === "POST" && action === "views") {
    video.viewCount += 1;
    await writeDb(db);
    return json(res, 200, presentVideo(video));
  }

  if (req.method === "POST" && action === "likes") {
    video.likes += 1;
    await writeDb(db);
    return json(res, 200, { id: video.id, likes: video.likes });
  }

  if (req.method === "GET" && action === "comments") {
    return json(res, 200, video.comments);
  }

  if (req.method === "POST" && action === "comments") {
    const body = await readBody(req);
    const text = String(body.text || "").trim();
    const name = String(body.name || "Guest").trim().slice(0, 32) || "Guest";
    if (!text) return json(res, 400, { error: "Comment text is required" });

    const comment = {
      id: `c-${Date.now()}`,
      name,
      text: text.slice(0, 280),
      createdAt: new Date().toISOString(),
    };
    video.comments.unshift(comment);
    await writeDb(db);
    return json(res, 201, comment);
  }

  return notFound(res);
}

async function handleStatic(req, res) {
  try {
    const filePath = resolvePath(req.url || "/");
    const content = await readFile(filePath);
    res.writeHead(200, {
      "content-type": types[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await handleStatic(req, res);
  } catch (error) {
    json(res, 500, { error: "Server error", detail: error.message });
  }
});

server.listen(port, () => {
  console.log(`Virello frontend and API are running at http://localhost:${port}`);
});
