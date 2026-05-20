# Virello

Virello is a YouTube-style video browsing clone built with plain HTML, CSS, JavaScript, and a dependency-free Node.js backend.

## Live Demo

[View the deployed app](https://deepak-kumar002.github.io/Youtube-clone/)

The deployed GitHub Pages version includes the playable frontend and static data fallback. Run locally for the persistent Node.js backend.

## Run Locally

```bash
npm start
```

Then open `http://localhost:3000`.

The app uses the official YouTube iframe player API for real playback.

## Backend API

The local server provides these JSON endpoints:

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/videos?category=Learning&query=javascript`
- `GET /api/shorts`
- `POST /api/videos/:id/views`
- `POST /api/videos/:id/likes`
- `GET /api/videos/:id/comments`
- `POST /api/videos/:id/comments`

Video, like, view, and comment data is stored in `data/db.json`.

## Features

- Responsive video grid
- Search filtering
- Category chips
- Shorts row
- Real YouTube iframe playback
- YouTube-style watch page
- Recommendation sidebar
- Backend-powered views, likes, and comments
- Collapsible side navigation
