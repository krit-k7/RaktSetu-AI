# RaktaSetu AI — Emergency Blood & Donor Intelligence Network
## PRD (Product Requirements Doc)

### Original Problem Statement
Build a system where a person can say "Mere father ke liye Kolkata me urgent B+ blood chahiye" and an AI understands location, urgency, finds compatible donors, suggests nearest blood banks and generates a request message. Support multilingual (Hindi / Bengali / English), medical-document vision extraction, smart donor matching (compat + distance + last-donation + response history), an emergency AI agent that auto-contacts eligible donors, and a Blood Camp Organizer mode for NGOs/colleges. Professional UI/UX; hackathon Proof-of-Work explaining how Gemma/Gemini is used.

### Users / Personas
- **Patient family (requester)** — files an emergency need, chats in local language, sees matched donors.
- **Donor** — registers once; gets pinged only for compatible + eligible + nearby emergencies.
- **Camp organizer (NGO / college / corporate foundation)** — registers a camp, forecasts demand, generates AI awareness copy.

### Architecture (as built)
- **Frontend**: React 19 + React Router + Tailwind + shadcn/ui + Framer-lite CSS keyframes + Sonner toasts.
- **Backend**: FastAPI + Motor (MongoDB) + Server-Sent-Events for chat streaming.
- **AI Core**: Gemini 3 Flash Preview via Emergent LLM Universal Key (`emergentintegrations` library). Used for (1) multilingual chat, (2) medical-document vision → JSON, (3) request-message drafting, (4) camp awareness copywriting.
- **Matching engine**: `blood_utils.py` — compatibility matrix × Haversine × cooldown (90d) × response history × urgency boost.
- **DB collections**: donors, blood_banks, requests, notifications, camps, chat_messages, documents.

### Implemented (Feb 2026, iteration 1)
- Landing page with hero, live-match sample card, feature grid, mission section, CTA.
- Emergency AI Assistant with SSE-streamed multilingual chat + language selector + Create-Emergency-Request modal.
- Dashboard with request list → matches (with match-score ring) → nearest blood banks + AI outreach message + notify button.
- Donor Registration form → posts to /api/donors.
- Blood Camp Organizer: list, create-camp modal, one-click AI awareness-post generation.
- Document Vision uploader (drag-drop, JPEG/PNG/WEBP) → Gemini extracts structured JSON.
- Architecture / Proof-of-Work page with layer cards + code snippets.
- Auto-seed on first boot: 15 donors across 5 cities, 6 blood banks, 3 upcoming camps.

### Backlog (P1 / P2)
- **P1**: Notification inbox for donors (view + accept/decline UI) — endpoint exists, UI to add.
- **P1**: Show live "who accepted" state on the dashboard once donors respond.
- **P2**: Map view (Leaflet/Mapbox) for blood banks + donors.
- **P2**: SMS/WhatsApp fanout via Twilio/WATI for real-world routing (currently in-app only).
- **P2**: Emergent Google Auth so donors have a proper profile & response history.
- **P2**: Object-storage backed prescription archive per patient.
- **P2**: Analytics for organizers — donor throughput vs prediction.

### Test credentials
- No auth (demo mode by user choice). All endpoints open.

### Testing
- `/app/backend/tests/backend_test.py` (created by testing agent) — 15/15 pytest pass.
- Frontend end-to-end (Playwright) — all 7 pages verified, chat streams, matches load, doc-vision returns JSON.
