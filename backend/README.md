# Vibe2Ship Backend

## Overview

This is the backend API for Vibe2Ship, an AI productivity companion built to manage tasks, goals, habits, calendar events, alerts, integrations, and AI-driven assistant workflows.

The backend is built with:
- Node.js + Express
- MongoDB + Mongoose
- Socket.io for real-time updates
- JWT authentication
- CORS support
- Email and SMS notification support
- AI assistant endpoints using Cohere (and related controllers)

## Features

Supported backend functionality:

- Authentication: login, register, refresh token, protected routes
- Task management: create, update, delete, list tasks
- Goal management: manage goal tracking and progress
- Habit tracking: create habits and monitor completion
- Calendar events: schedule and fetch calendar items
- Assignments: manage assignment items and deadlines
- Alerts: ring alerts, SMS reminders, email reminders
- Integrations: connect external services and sync data
- Meetings: meeting scheduling and management
- Chat: chat-related routes for AI or conversation support
- AI assistant: recommendations, rescue plans, habit suggestions, summaries, voice commands, and productivity reports
- Health check endpoint: `/api/health`

## API Routes

The backend exposes these main route groups:

- `/api/auth` - authentication and refresh token support
- `/api/tasks` - task operations
- `/api/goals` - goal operations
- `/api/habits` - habit operations
- `/api/calendar` - calendar event operations
- `/api/alerts` - alert and reminder operations
- `/api/integrations` - integration setup and service sync
- `/api/chat` - chat features
- `/api/ai` - AI recommendations, rescue plan, summaries, voice commands, and reports
- `/api/meetings` - meeting creation and management
- `/api/assignments` - assignment tracking
- `/api/test` - test or health-related routes

## Environment Variables

Create a `.env` file in the `backend/` folder and provide at least:

```bash
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
CLIENT_URL=http://localhost:3000
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRE=30d
REFRESH_TOKEN_EXPIRE=30d
EMAIL_HOST=<smtp-host>
EMAIL_PORT=<smtp-port>
EMAIL_USER=<smtp-user>
EMAIL_PASS=<smtp-pass>
SMS_API_KEY=<sms-provider-api-key>
COHERE_API_KEY=<cohere-api-key>
```

## Local Development

Install dependencies and start the backend server:

```bash
cd backend
npm install
npm run dev
```

The backend server listens on `http://localhost:5000` by default.

## Production

To run the backend in production mode:

```bash
cd backend
npm start
```

Make sure your environment variables are configured for the deployed staging or production host.

## Notes

- The backend uses a CORS whitelist based on `CLIENT_URL` and local frontend origins.
- Socket.io is configured with the same CORS policy so real-time updates can work from the frontend.
- Reminder scheduling is handled on server startup when MongoDB is available.
