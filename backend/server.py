"""RaktaSetu AI — Emergency Blood & Donor Intelligence Network
FastAPI backend with Gemini 3 Flash multilingual assistant, medical document
vision extraction, smart donor matching, and blood-camp organizer AI.
"""
from __future__ import annotations

import os
import json
import base64
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ConfigDict
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from emergentintegrations.llm.chat import (
    LlmChat, UserMessage, ImageContent, TextDelta, StreamDone,
)

from blood_utils import rank_donors, COMPATIBLE_DONORS, haversine_km
from seed_data import build_seed, CITIES

# ---------- setup -------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("raktasetu")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME   = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

app = FastAPI(title="RaktaSetu AI")
api = APIRouter(prefix="/api")

GEMINI_MODEL = "gemini-3-flash-preview"

# ---------- models ------------------------------------------------------------
class Donor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    blood_group: str
    city: str
    phone: str
    lat: float
    lng: float
    last_donation_date: Optional[str] = None
    response_history_score: float = 0.75
    eligible: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BloodBank(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    phone: str
    lat: float
    lng: float
    inventory: Dict[str, int]


class BloodRequestCreate(BaseModel):
    patient_name: str
    blood_group: str
    units_needed: int = 1
    hospital: str
    city: str
    urgency: Literal["critical", "high", "normal"] = "high"
    requester_phone: str
    notes: Optional[str] = None


class BloodRequest(BloodRequestCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lat: float
    lng: float
    status: Literal["open", "fulfilled", "cancelled"] = "open"
    ai_message: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    donor_id: str
    donor_name: str
    request_id: str
    message: str
    status: Literal["pending", "accepted", "declined"] = "pending"
    match_score: float = 0.0
    distance_km: float = 0.0
    eta_min: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class NotifyResponse(BaseModel):
    response: Literal["accepted", "declined"]


class Camp(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    organizer: str
    city: str
    location: str
    date: str
    predicted_demand: int = 100
    expected_donors: int = 120
    status: str = "upcoming"
    awareness_post: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChatIn(BaseModel):
    session_id: str
    message: str
    language: Literal["auto", "en", "hi", "bn"] = "auto"


# ---------- helpers -----------------------------------------------------------
def city_coords(city: str) -> Dict[str, float]:
    key = city.strip().title()
    for k in CITIES:
        if k.lower() == city.strip().lower():
            return CITIES[k]
    return CITIES.get(key, {"lat": 22.5726, "lng": 88.3639})


def clean(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


def _mk_chat(session_id: str, system: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("gemini", GEMINI_MODEL)


# ---------- routes: health / seed --------------------------------------------
@api.get("/")
async def root():
    return {"service": "RaktaSetu AI", "status": "ok"}


@api.get("/health")
async def health():
    donors = await db.donors.count_documents({})
    banks = await db.blood_banks.count_documents({})
    return {"status": "ok", "donors": donors, "blood_banks": banks}


@api.post("/seed")
async def seed_db(force: bool = False):
    if not force and await db.donors.count_documents({}) > 0:
        return {"message": "already seeded", "seeded": False}
    await db.donors.delete_many({})
    await db.blood_banks.delete_many({})
    await db.camps.delete_many({})
    donors, banks, camps = build_seed()
    if donors:
        await db.donors.insert_many(donors)
    if banks:
        await db.blood_banks.insert_many(banks)
    if camps:
        await db.camps.insert_many(camps)
    return {"seeded": True, "donors": len(donors), "blood_banks": len(banks), "camps": len(camps)}


# ---------- routes: donors ---------------------------------------------------
@api.get("/donors")
async def list_donors(city: Optional[str] = None, blood_group: Optional[str] = None):
    q: Dict[str, Any] = {}
    if city:
        q["city"] = city
    if blood_group:
        q["blood_group"] = blood_group
    cursor = db.donors.find(q, {"_id": 0}).limit(200)
    return await cursor.to_list(200)


@api.post("/donors")
async def register_donor(payload: Donor):
    doc = payload.model_dump()
    if not doc.get("lat") or not doc.get("lng"):
        c = city_coords(doc["city"])
        doc["lat"], doc["lng"] = c["lat"], c["lng"]
    await db.donors.insert_one(doc)
    return {"id": doc["id"], "message": "Donor registered", "donor": clean(doc)}


# ---------- routes: blood banks ----------------------------------------------
@api.get("/blood-banks")
async def list_blood_banks(city: Optional[str] = None, blood_group: Optional[str] = None):
    q: Dict[str, Any] = {}
    if city:
        q["city"] = city
    banks = await db.blood_banks.find(q, {"_id": 0}).to_list(100)
    if blood_group:
        for b in banks:
            b["available_units"] = b.get("inventory", {}).get(blood_group, 0)
        banks.sort(key=lambda b: b["available_units"], reverse=True)
    return banks


# ---------- routes: blood requests -------------------------------------------
async def _generate_request_message(req: Dict[str, Any]) -> str:
    if not EMERGENT_LLM_KEY:
        return f"Emergency {req['blood_group']} blood needed at {req['hospital']}, {req['city']}. Please respond if you can donate."
    try:
        chat = _mk_chat(
            f"msg-{req['id']}",
            "You draft short, respectful, urgent emergency-blood outreach messages (max 3 sentences). "
            "No emojis. Include hospital, city, blood group, urgency. End with 'Every drop saves a life.'",
        )
        prompt = (
            f"Patient: {req['patient_name']}\nBlood group: {req['blood_group']} ({req['units_needed']} unit(s))\n"
            f"Hospital: {req['hospital']}, {req['city']}\nUrgency: {req['urgency']}\n"
            "Draft the outreach message a donor would receive."
        )
        text = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                text += ev.content
            elif isinstance(ev, StreamDone):
                break
        return text.strip() or f"Emergency {req['blood_group']} blood needed at {req['hospital']}, {req['city']}."
    except Exception as e:
        logger.warning(f"ai_message_generation_failed: {e}")
        return f"Emergency {req['blood_group']} blood needed at {req['hospital']}, {req['city']}. Every drop saves a life."


@api.post("/requests")
async def create_request(payload: BloodRequestCreate):
    coords = city_coords(payload.city)
    req = BloodRequest(**payload.model_dump(), lat=coords["lat"], lng=coords["lng"])
    doc = req.model_dump()
    doc["ai_message"] = await _generate_request_message(doc)
    await db.requests.insert_one(doc)
    return clean(doc)


@api.get("/requests")
async def list_requests(status: Optional[str] = None):
    q: Dict[str, Any] = {}
    if status:
        q["status"] = status
    docs = await db.requests.find(q, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs


@api.get("/requests/{rid}")
async def get_request(rid: str):
    doc = await db.requests.find_one({"id": rid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "request not found")
    return doc


@api.get("/requests/{rid}/matches")
async def matches(rid: str, top: int = 10):
    req = await db.requests.find_one({"id": rid}, {"_id": 0})
    if not req:
        raise HTTPException(404, "request not found")
    all_donors = await db.donors.find({"city": req["city"]}, {"_id": 0}).to_list(500)
    if not all_donors:
        all_donors = await db.donors.find({}, {"_id": 0}).to_list(500)
    ranked = rank_donors(all_donors, req)[:top]
    return {"request": req, "matches": ranked, "count": len(ranked)}


@api.post("/requests/{rid}/notify")
async def notify_donors(rid: str, top: int = 5):
    req = await db.requests.find_one({"id": rid}, {"_id": 0})
    if not req:
        raise HTTPException(404, "request not found")
    all_donors = await db.donors.find({"city": req["city"]}, {"_id": 0}).to_list(500)
    ranked = rank_donors(all_donors, req)[:top]
    created = []
    for d in ranked:
        n = Notification(
            donor_id=d["id"], donor_name=d["name"], request_id=rid,
            message=req.get("ai_message") or "Emergency blood needed. Can you help?",
            match_score=d["match_score"], distance_km=d["distance_km"], eta_min=d["eta_min"],
        ).model_dump()
        await db.notifications.insert_one(n)
        created.append(clean(n))
    return {"notified": len(created), "notifications": created}


# ---------- routes: notifications --------------------------------------------
@api.get("/notifications")
async def list_notifications(donor_id: Optional[str] = None, request_id: Optional[str] = None):
    q: Dict[str, Any] = {}
    if donor_id:
        q["donor_id"] = donor_id
    if request_id:
        q["request_id"] = request_id
    docs = await db.notifications.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.post("/notifications/{nid}/respond")
async def respond_notification(nid: str, body: NotifyResponse):
    res = await db.notifications.update_one(
        {"id": nid}, {"$set": {"status": body.response}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "notification not found")
    return {"id": nid, "status": body.response}


# ---------- routes: multilingual streaming chat -------------------------------
LANG_HINT = {
    "auto": "Detect the user's language (Hindi, Bengali, or English) and respond in the same language. Use Roman/Devanagari/Bengali script as the user does.",
    "en":   "Respond in English.",
    "hi":   "Respond in Hindi (Devanagari script).",
    "bn":   "Respond in Bengali (Bengali script).",
}

SYSTEM_ASSISTANT = (
    "You are RaktaSetu AI — a compassionate emergency blood-request assistant for India. "
    "Help users describe their need clearly (patient, blood group, hospital, city, urgency). "
    "Give short, calm, actionable responses (2-4 sentences). "
    "If the user gives partial info, ask ONE follow-up question at a time. "
    "When you have enough info, summarize it as: BLOOD_REQUEST_READY: <json with patient_name, blood_group, hospital, city, urgency, units_needed>. "
    "Never invent hospitals or donors — the app searches its own verified database. "
    "Reassure the family; blood shortage is stressful."
)


@api.post("/chat")
async def chat(body: ChatIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "EMERGENT_LLM_KEY not configured")

    lang_msg = LANG_HINT.get(body.language, LANG_HINT["auto"])
    system = f"{SYSTEM_ASSISTANT}\n\n{lang_msg}"

    # Persist user message
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": body.session_id,
        "role": "user", "content": body.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    chat_llm = _mk_chat(body.session_id, system)

    async def event_gen():
        full = ""
        try:
            async for ev in chat_llm.stream_message(UserMessage(text=body.message)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.exception("chat_stream_failed")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            await db.chat_messages.insert_one({
                "id": str(uuid.uuid4()), "session_id": body.session_id,
                "role": "assistant", "content": full,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api.get("/chat/history/{session_id}")
async def chat_history(session_id: str):
    docs = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return docs


# ---------- routes: medical document vision ----------------------------------
DOC_SYSTEM = (
    "You are a medical document extraction expert. From the uploaded doctor prescription "
    "or blood-requirement slip, extract structured fields. Return ONLY JSON with keys: "
    "patient_name, blood_group (one of O+/O-/A+/A-/B+/B-/AB+/AB-), units_needed (int), "
    "hospital, city, urgency (critical|high|normal), doctor_name, notes, confidence (0-1). "
    "If a field is not visible, set it to null. Do not add commentary — JSON only."
)


@api.post("/document/analyze")
async def analyze_document(file: UploadFile = File(...)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "EMERGENT_LLM_KEY not configured")
    contents = await file.read()
    if len(contents) > 8 * 1024 * 1024:
        raise HTTPException(413, "file too large (max 8MB)")

    mime = file.content_type or "image/jpeg"
    if mime not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "only JPEG / PNG / WEBP images supported")

    b64 = base64.b64encode(contents).decode("utf-8")

    chat_llm = _mk_chat(f"doc-{uuid.uuid4()}", DOC_SYSTEM)

    text = ""
    try:
        async for ev in chat_llm.stream_message(UserMessage(
            text="Extract structured blood-request fields from this document. Return JSON only.",
            file_contents=[ImageContent(image_base64=b64)],
        )):
            if isinstance(ev, TextDelta):
                text += ev.content
            elif isinstance(ev, StreamDone):
                break
    except Exception as e:
        logger.exception("doc_analyze_failed")
        raise HTTPException(500, f"document analysis failed: {e}")

    raw = text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()
    try:
        parsed = json.loads(raw)
    except Exception:
        # attempt to salvage JSON substring
        start = raw.find("{")
        end = raw.rfind("}")
        parsed = {"raw": text}
        if start != -1 and end != -1:
            try:
                parsed = json.loads(raw[start:end + 1])
            except Exception:
                pass

    record = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "extracted": parsed,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.documents.insert_one(record)
    return {"id": record["id"], "extracted": parsed}


# ---------- routes: camps ----------------------------------------------------
class CampCreate(BaseModel):
    name: str
    organizer: str
    city: str
    location: str
    date: str
    predicted_demand: int = 100
    expected_donors: int = 120


@api.get("/camps")
async def list_camps():
    return await db.camps.find({}, {"_id": 0}).sort("date", 1).to_list(100)


@api.post("/camps")
async def create_camp(payload: CampCreate):
    c = Camp(**payload.model_dump()).model_dump()
    await db.camps.insert_one(c)
    return clean(c)


@api.post("/camps/{cid}/awareness")
async def generate_awareness(cid: str):
    c = await db.camps.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(404, "camp not found")
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "EMERGENT_LLM_KEY not configured")

    chat_llm = _mk_chat(f"camp-{cid}",
        "You are a social-media copywriter for a blood-donation NGO. Write a punchy, warm, "
        "shareable awareness post (max 90 words). Include one strong opening line, a stat, "
        "and a clear call-to-action with date + location. No hashtags spam — max 3 relevant ones. No emojis.")
    prompt = (
        f"Camp: {c['name']}\nOrganizer: {c['organizer']}\nLocation: {c['location']}, {c['city']}\n"
        f"Date: {c['date']}\nExpected donors: {c['expected_donors']}\n"
        "Write the awareness post."
    )
    text = ""
    async for ev in chat_llm.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            text += ev.content
        elif isinstance(ev, StreamDone):
            break
    post = text.strip()
    await db.camps.update_one({"id": cid}, {"$set": {"awareness_post": post}})
    return {"id": cid, "awareness_post": post}


# ---------- routes: stats ----------------------------------------------------
@api.get("/stats")
async def stats():
    donors = await db.donors.count_documents({})
    banks = await db.blood_banks.count_documents({})
    requests = await db.requests.count_documents({})
    open_req = await db.requests.count_documents({"status": "open"})
    camps = await db.camps.count_documents({})
    return {
        "donors": donors, "blood_banks": banks, "requests_total": requests,
        "requests_open": open_req, "camps": camps,
    }


# ---------- register ---------------------------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Auto-seed on first boot for demo
    if await db.donors.count_documents({}) == 0:
        donors, banks, camps = build_seed()
        if donors:
            await db.donors.insert_many(donors)
        if banks:
            await db.blood_banks.insert_many(banks)
        if camps:
            await db.camps.insert_many(camps)
        logger.info("Auto-seeded demo data on first boot")


@app.on_event("shutdown")
async def on_shutdown():
    mongo_client.close()
