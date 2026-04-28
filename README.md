# GitHub Activity Tracker

An AI-powered dashboard that tracks your GitHub push events and generates concise, plain-English summaries of your weekly activity using Google Gemini.

## 🚀 Features

- **GitHub OAuth Integration:** Securely log in with your GitHub account.
- **Real-time Event Tracking:** Automatically records `push` events via GitHub Webhooks.
- **AI Summaries:** Generates 3-sentence activity reports using the `gemini-1.5-flash` model.
- **Repository Filtering:** View activity and summaries for specific repositories.

## 🛠️ How to Generate a Summary

The app summarizes activity **recorded in real-time**. It does not fetch previous commit history from GitHub; it only summarizes events that occur *after* your repository is connected and the webhook is active.

1.  **Log In:** Click **Login with GitHub** to sync your repositories.
2.  **Connect Your Repo:** Ensure your GitHub repository has a Webhook pointing to your backend URL (or Smee URL for local dev).
3.  **Push Code:** Make a push to your repository. The app will detect this event and save it to the database.
4.  **Select & Generate:** 
    - Select the repository from the dropdown.
    - Click **Generate Summary**.
    - The AI will analyze the **recorded pushes** from the last 7 days and provide a 3-sentence summary of that specific activity.

## 💻 Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend:** Node.js, Express, Prisma (PostgreSQL).
- **AI:** Google Generative AI (Gemini API).
- **Webhooks:** GitHub Webhooks (with Smee.io for local development).

## ⚙️ Development Setup

### Backend (Server)
1. Navigate to `/server`.
2. Install dependencies: `npm install`.
3. Set up your `.env` file (see `server/prisma/schema.prisma` for DB requirements).
4. Run migrations: `npx prisma migrate dev`.
5. Start the server: `npm run dev`.

### Frontend
1. Navigate to the root directory.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.
4. Open [http://localhost:3000](http://localhost:3000).
