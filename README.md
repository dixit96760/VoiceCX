# VoiceCX — AI Voice Calling Dashboard & Vapi Telephony Integration

VoiceCX is an enterprise AI Voice Agent & Customer Feedback SaaS platform built with React, Vite, Express, MongoDB Atlas, Google Gemini AI, and Vapi Telephony.

---

## 🌟 Key Features

1. **Outbound AI Voice Calls (Vapi Integration)**:
   - Initiate outbound AI phone calls directly from the dashboard to any recipient.
   - Form inputs for Contact Name, E.164 Phone Number, Call Purpose, and Custom Instructions.
   - Server-side Vapi REST API integration (`POST https://api.vapi.ai/call`) keeping API keys hidden from client-side code.

2. **Modular Provider Abstraction Layer (`VoiceProvider`)**:
   - Easily switch between `VapiVoiceProvider`, `MockVoiceProvider` (credit-free testing mode), and `ExotelVoiceProvider` without modifying frontend components or database schemas.

3. **Idempotent Webhook Processing (`POST /api/webhooks/vapi`)**:
   - Real-time handling of call events (`queued` ➔ `calling` ➔ `in-progress` ➔ `completed` / `failed`).
   - Signature validation, event logging, and duplicate payload suppression.

4. **Structured AI Summarization (Google Gemini AI)**:
   - Automated conversion of call transcripts into structured JSON summaries:
     - Short factual summary
     - Structured Outcome (`positive`, `negative`, `interested`, `not_interested`, `callback_requested`, `completed`, `unknown`)
     - Sentiment classification (`positive`, `neutral`, `negative`)
     - Recommended Next Action & Follow-up reasoning

5. **Live Call History & Analytics Dashboard**:
   - Real-time KPI cards: Total Calls, Completed, In-Progress, Failed, Average Duration.
   - Live call tracking with auto-polling.
   - Search, status filtering, outcome filtering, and date sorting.
   - Comprehensive Call Details Modal displaying speaker-tagged transcripts (`AI:`, `CUSTOMER:`), AI analysis, and audio playback.

6. **2FA Email OTP Authentication**:
   - Secure JSON Web Token authentication backed by MongoDB Atlas.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB Atlas cluster URI (or local MongoDB)

### 2. Environment Setup

Copy `.env.example` in `server/` to `server/.env`:

```bash
cd server
cp .env.example .env
```

Configure environment variables in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/voicecx

# Telephony Provider Mode (vapi | mock | exotel)
VOICE_PROVIDER_MODE=mock

# Vapi Credentials (Server-Side Only)
VAPI_API_KEY=your_vapi_private_api_key_here
VAPI_ASSISTANT_ID=your_vapi_assistant_id_here
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id_here
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret_here

# AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Security
JWT_SECRET=super_secret_jwt_key_2026
APP_URL=http://localhost:5000
```

### 3. Installation

Install dependencies for both frontend and backend:

```bash
# Root (Frontend dependencies)
npm install

# Backend dependencies
cd server
npm install
```

### 4. Running Local Development Mode

Start Express backend server (Port 5000):

```bash
cd server
npm run dev
```

In a separate terminal, start Vite frontend server (Port 5173):

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🧪 Development Sandbox / Mock Mode

To test the full outbound call workflow, webhooks, and AI summaries **without spending Vapi telephony credits**:

1. Ensure `VOICE_PROVIDER_MODE=mock` in `server/.env`.
2. Open `http://localhost:5173/calls`.
3. Fill in Contact Name, Phone Number (`+919876543210`), and Call Purpose.
4. Click **START AI CALL**.
5. The sandbox provider will simulate call progress (`queued` ➔ `calling` ➔ `in-progress` ➔ `completed`), send realistic transcripts, and trigger Gemini AI summarization automatically!

To switch to **Live Vapi Telephony**:
1. Set `VOICE_PROVIDER_MODE=vapi` in `server/.env`.
2. Provide valid `VAPI_API_KEY`, `VAPI_ASSISTANT_ID`, and `VAPI_PHONE_NUMBER_ID`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/calls` | Create outbound AI call (E.164 phone validated) |
| `GET` | `/api/calls` | Fetch call history (supports `search`, `status`, `outcome`) |
| `GET` | `/api/calls/:id` | Fetch single call details, transcript, and AI summary |
| `DELETE` | `/api/calls/:id` | Delete call record |
| `GET` | `/api/dashboard/stats` | Fetch aggregated call statistics |
| `POST` | `/api/webhooks/vapi` | Idempotent Vapi webhook event receiver |
| `GET` | `/api/health` | API health check & active provider mode status |

---

## 🧪 Testing

Run backend test suite:

```bash
cd server
npm test
```

Tests cover:
- E.164 phone number validation logic
- Outbound call creation & DB storage
- Mock provider lifecycle execution
- Webhook signature validation & idempotency
- Gemini AI transcript summarization
