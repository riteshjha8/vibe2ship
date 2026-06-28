# Vibe2Ship Frontend

## Overview

This is the frontend application for Vibe2Ship, a Next.js + Tailwind CSS AI productivity companion. It provides the user interface for the dashboard, tasks, goals, habits, calendar, integrations, profile, alerts, and AI assistant experiences.

The frontend is built with:
- Next.js 16
- React 18
- Tailwind CSS
- Axios for API calls
- Socket.io client for real-time updates

## Features

The frontend includes pages and components for:

- Landing page with AI productivity features and onboarding links
- Dashboard overview and real-time status panels
- Tasks page: create, search, update, and manage tasks
- Goals page: goal creation, progress tracking, and performance summary
- Habits page: habit tracking, history, and completion management
- Quick Attender page: fast task/meeting attention workflows
- Calendar page: event scheduling and visual calendar integration
- Integrations page: connect external services and sync data
- Profile page: user settings and account details
- Alerts and reminder ring notifications
- SMS and email reminder support
- AI assistant panel and voice assistant interaction
- Task creation flow with smart labeling and due-date features

## Project Structure

- `app/` - Next.js app routes and page structure
- `components/` - shared UI components and widgets
- `lib/` - API utilities, including auth and data fetch wrappers
- `context/` - app-level React context for authentication
- `utils/` - helper utilities and client-side logic
- `public/` - static assets (if any)

## Local Development

Install dependencies and start the frontend app:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment Variables

The frontend may use `NEXT_PUBLIC_API_URL` when deployed separately from the backend:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-host.com
```

If the frontend and backend are served from the same origin in production, the app can continue using relative `/api` requests.

## Build and Start

```bash
cd frontend
npm run build
npm start
```

## Notes

- The frontend uses a proxy rewrite during development to forward `/api/*` to the backend at `http://localhost:5000`.
- Make sure the backend is running before using the dashboard and API-connected pages.
- The frontend includes voice and AI assistant capabilities that rely on backend AI endpoints and speech logic.
