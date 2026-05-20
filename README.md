# Virello

Virello is a YouTube-style video browsing clone built with plain HTML, CSS, JavaScript, and a dependency-free Node.js backend.

## Live Demo

[View the deployed app](https://deepak-kumar002.github.io/Youtube-clone/)

## Run Locally

```bash
node server.mjs
```

Then open `http://localhost:3000`.

## Backend API

The local server provides these JSON endpoints:

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/videos?category=Design&query=react`
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
- Video player modal
- Backend-powered views, likes, and comments
- Collapsible side navigation
