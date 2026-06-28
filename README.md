
# FINALPING — AI  🚀

> FINALPING is a polished AI-first productivity platform built for demo impact: smart task rescue, voice & chat assistants, multi-channel reminders, and real-time dashboards.

---

## 🔥 Quick Demo (what to show judges)
1. Landing page → Sign up / Sign in  
2. Create a task with a deadline → show dashboard and countdown  
3. Trigger AI Rescue Plan on a risky task → show suggested steps  
4. Create a goal + habit → show progress & streaks  
5. Trigger voice command (or simulate) → show assistant response  
6. Show email/SMS alert (demo logs or screenshots) → show alert ring  

---

## ✨ One‑Line Value Proposition
Make deadlines manageable — AI detects risk, suggests recovery plans, and rings the alarm when it matters.

---

## 🎯 Key Features

- AI Rescue Plans — automated recovery workflows for overdue/at-risk tasks  
- Voice & Chat Assistant — natural commands to create, update, or query items  
- Real-time Dashboard — Socket.io updates, live countdowns, and alerts  
- Multi-channel Reminders — Email, SMS, and in-app alert ring at 24h / 1h / 20m  
- Goals & Habits — visual progress, streak tracking, AI habit suggestions  
- Quick Attender — one-click urgent action flow for last-minute tasks  
- Integrations Ready — backend routes & UI placeholders for third-party plugins

---

## 🔧 Tech Stack

- Frontend: Next.js, React, Tailwind CSS, Axios, Socket.io-client  
- Backend: Node.js, Express, MongoDB (Mongoose), Socket.io, JWT, Nodemailer  
- AI: Assistant endpoints (Cohere-style), recommendation + summarization endpoints  
- Realtime: WebSockets (Socket.io) for live UI sync

---

## 🧩 Repo Structure

- frontend — Next.js app (UI, pages, components, AI widgets)  
- backend — Express API (auth, tasks, goals, habits, calendar, ai, alerts)  
- package.json (root) — convenience scripts to run dev servers

---

## ✅ Copy‑Paste Setup (for judges/demo)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open:
- Frontend: http://localhost:3000  
- Backend health: http://localhost:5000/api/health

Root shortcut:
```bash
npm run dev         # runs backend dev (root has helper scripts)
npm run dev:frontend
```

---

## 🔒 Environment Variables

Create .env:
```bash
PORT=5000
MONGO_URI=your_mongo_connection_string
CLIENT_URL=http://localhost:3000
JWT_SECRET=super_secret_jwt_key
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=you@example.com
EMAIL_PASS=your_password
SMS_API_KEY=your_sms_provider_key
COHERE_API_KEY=your_cohere_key
```

Create .env.local:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-host.com   # set when deployed separately
```



## 🧪 Demo Script (30–90 seconds flow)
1. "We built FINALPING — it rescues deadlines." (landing page intro)  
2. Create Task: "Submit report — due in FEW minutes" → Show countdown ring.  
3. Show Rescue: Click AI Rescue → "Here are 5 immediate steps" (display).  
4. Trigger Voice: Say "Snooze task for 20 minutes" → show immediate UI change.  
5. Show notification: Display email/SMS preview and in-app alert ring.  
6. End with: "All features are production-ready and extensible."






## 📞 Contact / Team
- Project: FINALPING  
- Lead: riteshjha689@gmail.com  
- Repo:https://github.com/riteshjha8

---
