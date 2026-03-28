# MedBridge — AI Drug Interaction Triage

A Next.js 16 medical triage dashboard that uses **Google Gemini AI** to analyze prescription images and patient-recorded audio symptoms, detecting dangerous drug interactions in real time.

## Features

- **Multimodal AI Analysis** — Upload a prescription photo + record symptoms via microphone → Gemini 1.5 Flash cross-references medications and symptoms
- **Strict Schema Validation** — Zod v4 validates every AI response on the server, guaranteeing typed API contracts
- **Firebase Auth** — Google sign-in with `onAuthStateChanged` listener
- **Firestore Persistence** — Every triage result is auto-saved to a user-scoped subcollection (`users/{uid}/triage_logs`)
- **Accessible UI** — ARIA roles, keyboard navigation, live regions, and `suppressHydrationWarning` for browser extension compatibility
- **Component Architecture** — Modular extraction: `TriageInputForm`, `TriageResultCard`, and orchestrator `TriageDashboard`
- **Test Coverage** — 14 unit + component tests via Vitest + React Testing Library

## Tech Stack

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| Framework    | Next.js 16.2 (App Router, Turbopack)        |
| Language     | TypeScript 5                                |
| AI           | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Validation   | Zod v4                                      |
| Auth & DB    | Firebase Auth + Firestore                   |
| Styling      | Tailwind CSS 4 + custom design tokens       |
| Testing      | Vitest, React Testing Library, jsdom        |
| Icons        | Lucide React                                |

## Project Structure

```
src/
├── app/
│   ├── api/analyze-triage/route.ts   # Gemini API + Zod validation
│   ├── globals.css                   # Design system & tokens
│   ├── layout.tsx                    # Root layout (hydration fix)
│   └── page.tsx                      # Auth gate → Dashboard
├── components/
│   ├── Header.tsx                    # App header with user menu
│   ├── TriageDashboard.tsx           # Orchestrator (state + logic)
│   ├── TriageInputForm.tsx           # Left column: upload + recording
│   ├── TriageResultCard.tsx          # Right column: AI results
│   └── TriageResultCard.test.tsx     # Component tests
├── lib/
│   ├── firebase.config.ts            # Firebase init with key guard
│   ├── firestore.service.ts          # Typed Firestore write
│   ├── schema.ts                     # Zod schema + TriageResult type
│   └── schema.test.ts                # Schema validation tests
├── hooks/                            # Custom React hooks
└── test/
    └── setup.ts                      # Testing Library setup
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)
- A [Firebase](https://console.firebase.google.com/) project with Auth + Firestore enabled

### 1. Clone & Install

```bash
git clone https://github.com/adarshjha01/promptwars-project.git
cd promptwars-project
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **Note:** `.env.local` is gitignored and will not be committed.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Tests

```bash
npm test
```

### 5. Production Build

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` to the Vercel project settings → **Environment Variables**
4. Deploy — Vercel will auto-detect Next.js and build

> **Important:** Server-side env vars like `GEMINI_API_KEY` (no `NEXT_PUBLIC_` prefix) must be added manually in Vercel's dashboard. They are not exposed to the client.

## API Contract

**`POST /api/analyze-triage`**

| Field                    | Type       | Description                              |
| ------------------------ | ---------- | ---------------------------------------- |
| `symptoms`               | `string[]` | Patient-reported symptoms from audio     |
| `identified_medications` | `string[]` | Medications found in the prescription    |
| `risk_level`             | `enum`     | `Low` · `Medium` · `High` · `Critical`  |
| `potential_interactions`  | `string`   | Drug interaction analysis                |
| `action_plan`            | `string[]` | Ordered next steps for patient/caregiver |

The response is validated server-side with Zod. Malformed AI output returns `500` with structured error details.

## License

Private project.
