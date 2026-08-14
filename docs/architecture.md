# VoiceCX AI Voice Calling Platform — System Architecture & Flow

This document details the end-to-end architecture, telephony provider abstraction, webhook processing pipeline, and AI summarization engine.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    User([Dashboard User]) -->|1. Submit Phone, Name & Purpose| Frontend[React Dashboard /calls]
    Frontend -->|2. POST /api/calls| ExpressAPI[Express API Backend]
    
    ExpressAPI -->|3. E.164 Phone Validation| Validator{Format Valid?}
    Validator -->|No| ErrReturn[Return E.164 Format Error]
    Validator -->|Yes| DBCreate[Create DB Record - status: queued]
    
    DBCreate -->|4. Get Active Provider| Factory[VoiceProvider Factory]
    Factory -->|VOICE_PROVIDER_MODE| ProviderChoice{Provider Mode}
    
    ProviderChoice -->|mock| MockProvider[MockVoiceProvider Sandbox]
    ProviderChoice -->|vapi| VapiProvider[VapiVoiceProvider Server-Side]
    ProviderChoice -->|exotel| ExotelProvider[ExotelVoiceProvider Stub]
    
    VapiProvider -->|5. POST /call with Server Key| VapiAPI[Vapi Telephony API]
    VapiAPI -->|6. Dial Recipient| Phone[Recipient Cellular Phone]
    
    Phone -->|7. Conversational Speech| AIConversation[Vapi AI Assistant]
    AIConversation -->|8. Webhook Events| WebhookEndpoint[POST /api/webhooks/vapi]
    MockProvider -->|Simulated Webhooks| WebhookEndpoint
    
    WebhookEndpoint -->|9. Idempotency & Signature Check| WebhookService[Webhook Processing Service]
    WebhookService -->|10. Update Status: calling ➔ in-progress ➔ completed| MongoDB[(MongoDB Atlas)]
    
    WebhookService -->|11. Trigger Transcript Analysis| GeminiAI[Google Gemini AI Engine]
    GeminiAI -->|12. Generate JSON Summary & Outcome| DBUpdate[Save Summary, Outcome, Sentiment in DB]
    
    Frontend -->|13. Auto-Polling / GET /api/calls| ExpressAPI
    ExpressAPI -->|14. Live Call Record & Transcript| Frontend
```

---

## 2. Telephony Abstraction Architecture (`VoiceProvider`)

The platform implements an abstract interface pattern (`VoiceProvider`) to decouple telephony logic from application logic:

- **`VoiceProvider`** (`server/src/services/voiceProvider/VoiceProvider.js`): Abstract base class defining `createOutboundCall()`, `getCall()`, `handleWebhook()`, and `endCall()`.
- **`VapiVoiceProvider`** (`server/src/services/voiceProvider/VapiVoiceProvider.js`): Server-side implementation interfacing with Vapi REST API (`POST https://api.vapi.ai/call`). Vapi API keys remain strictly server-side.
- **`MockVoiceProvider`** (`server/src/services/voiceProvider/MockVoiceProvider.js`): Sandbox testing provider that simulates complete call lifecycles and transcripts without telecommunication charges.
- **`ExotelVoiceProvider`** (`server/src/services/voiceProvider/ExotelVoiceProvider.js`): Extension stub for future provider expansion.

---

## 3. Idempotent Webhook Processing

- **Endpoint**: `POST /api/webhooks/vapi`
- **Idempotency Key**: Generated from `vapiCallId:eventType:status:transcriptLength`.
- **Duplicate Prevention**: Duplicate payloads are suppressed automatically to prevent multiple database updates or duplicate LLM summarization calls.
- **Fault Tolerance**: If AI summarization encounters an error, the call status remains `completed` while summary generation retries independently.

---

## 4. Environment Variables Reference

| Key | Description | Example / Default |
| --- | --- | --- |
| `VOICE_PROVIDER_MODE` | Telephony Provider Mode (`vapi`, `mock`, `exotel`) | `mock` |
| `VAPI_API_KEY` | Private Vapi API Key (Server-Side Only) | `4a3b...` |
| `VAPI_ASSISTANT_ID` | Vapi Configured Assistant ID | `asst_...` |
| `VAPI_PHONE_NUMBER_ID` | Vapi Registered Phone Number ID | `phone_...` |
| `VAPI_WEBHOOK_SECRET` | Secret token for Vapi webhook signature validation | `secret_...` |
| `GEMINI_API_KEY` | Google Gemini AI API Key for summarization | `AIza...` |
| `DATABASE_URL` | MongoDB Connection URI | `mongodb+srv://...` |
