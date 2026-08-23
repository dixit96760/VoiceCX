# Y6 Restaurant Voice Customer Feedback SaaS - Backend API

Production-ready Node.js, Express, and MongoDB backend REST API for **Y6**, a voice customer feedback application for restaurants.

## 🚀 Features

- **Authentication System**: Secure owner registration & login using `bcryptjs` password hashing and `jsonwebtoken` (JWT).
- **Dashboard & Analytics**: Aggregated KPIs (total feedback, average rating, positive %, negative %, response rate, feedback trends, sentiment breakdown, top issues) & deep insights.
- **Feedback & Call Management**: Filterable customer feedback listings (date, sentiment, rating, status, search keyword), granular feedback detail view with transcripts, and owner notes persistence.
- **Customer CRM**: Centralized customer records with last visit tracking, sentiment history, total calls, and rating trend analytics.
- **Settings & Do-Not-Call (DNC)**: Customizable automated feedback calling hours/timezones and DNC phone blocklist CRUD operations.
- **Reports & Export**: Dynamic CSV dataset export generation (`GET /api/reports/export`).
- **AI Transcript Analysis**: Direct Google Gemini AI (`@google/genai`) integration to analyze raw transcripts into structured sentiment, ratings, top complaints, praises, and actionable recommendations.

---

## 🛠️ Tech Stack & Requirements

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: JWT & Bcrypt
- **Validation**: Zod schema validation
- **AI Model**: Google Gemini API (`gemini-2.5-flash`) via `GEMINI_API_KEY`
- **CORS**: Fully configured for React frontends

---

## 🔑 Environment Variables (`.env`)

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/restaurant-voice-agent
JWT_SECRET=super_secret_jwt_restaurant_voice_agent_key_2026
GEMINI_API_KEY=your_google_gemini_api_key_here

# Optional Twilio integrations
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567
```

---

## 📦 Installation & Setup

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Seed Initial Database (Optional)**:
   ```bash
   node src/seed.js
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Start Production Server**:
   ```bash
   npm start
   ```

---

## 📡 API Endpoints Reference

### 1. Authentication Routes (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new restaurant owner |
| `POST` | `/api/auth/login` | Authenticate owner & return JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### 2. Dashboard & Analytics (`/api`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Returns aggregated KPI metrics, trends, sentiment breakdown |
| `GET` | `/api/insights` | Returns sentiment distribution, top complaints, praises, & timeline |

### 3. Feedback Management (`/api/feedback`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/feedback` | Filter feedback list by date, sentiment, rating, status, search |
| `GET` | `/api/feedback/:id` | Returns feedback detail, transcript, category ratings, audio status |
| `POST` | `/api/feedback/:id/notes` | Saves or updates owner notes for a feedback entry |

### 4. Customer CRM (`/api/customers`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/customers` | Returns customer profiles, last visit, sentiment & average rating |
| `GET` | `/api/customers/:id` | Returns individual customer history and rating trends |

### 5. Settings & DNC List (`/api/settings` & `/api/do-not-call`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/settings` | Returns calling schedule settings (start time, end time, timezone) |
| `PUT` | `/api/settings/calling` | Updates calling schedule settings |
| `GET` | `/api/do-not-call` | Returns list of blocked DNC phone numbers |
| `POST` | `/api/do-not-call` | Adds a phone number to the DNC list |
| `DELETE` | `/api/do-not-call/:id` | Removes a phone number from the DNC list |

### 6. Reports & Export (`/api/reports`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/reports/export` | Generates & downloads feedback dataset formatted for CSV |

### 7. AI Integration (`/api/ai`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/analyze-transcript` | Extracts structured sentiment, ratings, and insights using Gemini AI |
