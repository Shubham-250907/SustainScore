# SustainScore 🌱

**Corporate Employee Sustainability Engagement Platform**  
IGDITW Hackathon Prototype · Built with React + Tailwind CSS + Firebase + Gemini AI

---

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in your Firebase + Gemini API keys in .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo Login

| Role     | Email                | Password |
|----------|----------------------|----------|
| Employee | arjun@sustain.co     | demo     |
| Admin    | dev@sustain.co       | demo     |

Or use the quick-login buttons on the login page.

---

## Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Frontend   | React 18 + Vite               |
| Styling    | Tailwind CSS v4               |
| Routing    | React Router v7               |
| Charts     | Recharts                      |
| Auth       | Firebase Authentication        |
| Database   | Cloud Firestore               |
| Storage    | Firebase Storage              |
| AI         | Google Gemini 1.5 Flash (Vision) |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `VITE_FIREBASE_*` — from [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps
- `VITE_GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/app/apikey)

If `VITE_GEMINI_API_KEY` is not set, AI verification uses simulated results (safe for demo).

---

## What's Hardcoded (Disclosure)

| Item | Details |
|------|---------|
| CO2 emission factors | Constants per task, sourced from World Bank emission factor publications. Not real-time API data. |
| Water/Energy conversions | 8L water per kg CO2, 2.5 kWh per kg CO2 (World Bank lifecycle averages). |
| Voucher codes | Randomly generated strings. No real payment or voucher integration(for now). |
| Department names | IT, HR, Finance, Marketing (seed data). |
| Trend chart data | 6-month historical scores are demo data. |
| targetCO2 baseline | 500 kg used to normalize the Environmental Impact Score. |
| Gemini model | gemini-1.5-flash (hardcoded). |
| Confidence threshold | 0.75 for auto-approval (hardcoded constant). |

---

## Screens

1. **Login / Signup** - Email/password, role selection (Employee / Admin)
2. **Employee Dashboard** - Personal eco score, streak, tasks, impact stats, mini leaderboard
3. **Tasks Page** - All tasks with category filter, daily progress bar
4. **Leaderboard** - Individual podium + department bar chart
5. **Rewards** - Redeem points for vouchers
6. **Profile** - Stats, submission history, redeemed rewards with codes
7. **Admin Dashboard** - Company score, trend chart, submissions review
8. **Admin: Tasks** - Add / edit / delete tasks
9. **Admin: Rewards** - Add / edit / delete rewards, claim notifications

---

## Sustainability Score Formula

Company Score = (Participation Score x 0.30) + (Completion Score x 0.30) + (Impact Score x 0.40)

All CO2 figures are **estimated based on predefined emission factors** - not directly measured.

---

## Future Scope

- Real Firebase integration (Auth + Firestore + Storage)
- Push notifications for streak reminders
- Team leaderboard view
- Real voucher/payment integration
- Mobile app (React Native)
- Webhook for HR system sync
- Monthly sustainability reports (PDF export)
- Carbon offset marketplace

---

*Built for IGDITW Hackathon. Prototype only - not production software.*
