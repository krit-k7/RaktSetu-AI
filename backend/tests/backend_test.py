"""RaktaSetu AI backend regression tests."""
import io
import os
import json
import base64
import struct
import zlib
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://emergency-blood-ai.preview.emergentagent.com").rstrip("/")


# ---------- helpers ----------
def _make_realistic_prescription_png() -> bytes:
    """Generate a real-looking prescription PNG using PIL with meaningful text.
    Falls back to procedural PNG only if PIL isn't available (should exist).
    """
    from PIL import Image, ImageDraw, ImageFont
    W, H = 900, 1100
    img = Image.new("RGB", (W, H), color=(252, 252, 245))
    d = ImageDraw.Draw(img)
    # draw border
    d.rectangle([20, 20, W - 20, H - 20], outline=(180, 30, 30), width=4)
    try:
        font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        font_med = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except Exception:
        font_big = font_med = font_sm = ImageFont.load_default()

    d.text((50, 50), "APOLLO GLENEAGLES HOSPITAL", fill=(150, 20, 20), font=font_big)
    d.text((50, 95), "Kolkata, West Bengal | Ph: +91-33-2320-3040", fill=(60, 60, 60), font=font_sm)
    d.line([(50, 130), (W - 50, 130)], fill=(150, 20, 20), width=2)

    d.text((50, 155), "BLOOD REQUIREMENT SLIP", fill=(0, 0, 0), font=font_big)

    lines = [
        ("Patient Name:", "Ramesh Kumar Sharma"),
        ("Age/Sex:", "58 / Male"),
        ("Blood Group:", "B+ (B Positive)"),
        ("Units Needed:", "2 units PRBC"),
        ("Hospital:", "Apollo Gleneagles Hospital"),
        ("City:", "Kolkata"),
        ("Ward/Bed:", "ICU-4 / Bed 12"),
        ("Doctor:", "Dr. Anirban Chatterjee, MD"),
        ("Urgency:", "CRITICAL - Required within 2 hours"),
        ("Diagnosis:", "Severe anemia post-surgery"),
    ]
    y = 220
    for label, val in lines:
        d.text((60, y), label, fill=(50, 50, 50), font=font_med)
        d.text((300, y), val, fill=(0, 0, 0), font=font_med)
        y += 45

    d.text((50, y + 30), "Signature: _____________________", fill=(0, 0, 0), font=font_med)
    d.text((50, y + 80), "Doctor Registration No: WBMC/54321", fill=(80, 80, 80), font=font_sm)
    d.text((50, y + 120), "Date: 15/01/2026", fill=(80, 80, 80), font=font_sm)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---------- Health & Stats ----------
class TestHealthAndStats:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "ok"
        assert d["donors"] > 0
        assert d["blood_banks"] > 0

    def test_stats(self):
        r = requests.get(f"{BASE_URL}/api/stats", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("donors", "blood_banks", "camps", "requests_total", "requests_open"):
            assert k in d
        assert d["donors"] >= 15
        assert d["camps"] >= 3


# ---------- Donors ----------
class TestDonors:
    def test_list_all_donors(self):
        r = requests.get(f"{BASE_URL}/api/donors", timeout=15)
        assert r.status_code == 200
        donors = r.json()
        assert isinstance(donors, list)
        assert len(donors) >= 15

    def test_filter_donors_kolkata_bpos(self):
        r = requests.get(f"{BASE_URL}/api/donors", params={"city": "Kolkata", "blood_group": "B+"}, timeout=15)
        assert r.status_code == 200
        donors = r.json()
        assert len(donors) > 0
        for d in donors:
            assert d["city"] == "Kolkata"
            assert d["blood_group"] == "B+"

    def test_register_donor(self):
        payload = {
            "name": "TEST_Donor_Regression",
            "blood_group": "O+",
            "city": "Kolkata",
            "phone": "+91-9999900000",
            "lat": 22.5726,
            "lng": 88.3639,
            "response_history_score": 0.8,
        }
        r = requests.post(f"{BASE_URL}/api/donors", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d
        # verify persisted
        list_r = requests.get(f"{BASE_URL}/api/donors", params={"city": "Kolkata", "blood_group": "O+"}, timeout=15)
        names = [x["name"] for x in list_r.json()]
        assert "TEST_Donor_Regression" in names


# ---------- Blood Banks ----------
class TestBloodBanks:
    def test_blood_banks_kolkata_bpos(self):
        r = requests.get(f"{BASE_URL}/api/blood-banks", params={"city": "Kolkata", "blood_group": "B+"}, timeout=15)
        assert r.status_code == 200
        banks = r.json()
        assert len(banks) > 0
        for b in banks:
            assert b["city"] == "Kolkata"
            assert "available_units" in b
        # sorted desc
        units = [b["available_units"] for b in banks]
        assert units == sorted(units, reverse=True)


# ---------- Requests & Matches ----------
@pytest.fixture(scope="module")
def created_request():
    payload = {
        "patient_name": "TEST_Patient_Ramesh",
        "blood_group": "B+",
        "units_needed": 2,
        "hospital": "Apollo Gleneagles",
        "city": "Kolkata",
        "urgency": "critical",
        "requester_phone": "+91-9000000000",
        "notes": "Post-surgery, need ASAP",
    }
    r = requests.post(f"{BASE_URL}/api/requests", json=payload, timeout=60)
    assert r.status_code == 200, r.text
    return r.json()


class TestRequests:
    def test_create_request_has_ai_message_and_coords(self, created_request):
        d = created_request
        assert d["status"] == "open"
        assert d["blood_group"] == "B+"
        assert d.get("lat") and d.get("lng")
        assert d.get("ai_message"), "ai_message should be generated (may fallback text)"
        assert isinstance(d["ai_message"], str) and len(d["ai_message"]) > 5

    def test_get_request(self, created_request):
        r = requests.get(f"{BASE_URL}/api/requests/{created_request['id']}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == created_request["id"]

    def test_matches_compatible_only(self, created_request):
        r = requests.get(f"{BASE_URL}/api/requests/{created_request['id']}/matches", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "matches" in data
        matches = data["matches"]
        assert len(matches) > 0
        # B+ recipient can receive from O-, O+, B-, B+
        allowed = {"O-", "O+", "B-", "B+"}
        for m in matches:
            assert m["blood_group"] in allowed, f"Incompatible group returned: {m['blood_group']}"
        # ranked descending
        scores = [m["match_score"] for m in matches]
        assert scores == sorted(scores, reverse=True)


# ---------- Notifications ----------
class TestNotifications:
    def test_notify_and_list_and_respond(self, created_request):
        rid = created_request["id"]
        r = requests.post(f"{BASE_URL}/api/requests/{rid}/notify", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["notified"] >= 1
        assert len(d["notifications"]) == d["notified"]

        # list
        lr = requests.get(f"{BASE_URL}/api/notifications", params={"request_id": rid}, timeout=15)
        assert lr.status_code == 200
        notifs = lr.json()
        assert len(notifs) >= 1

        # respond
        nid = notifs[0]["id"]
        rr = requests.post(f"{BASE_URL}/api/notifications/{nid}/respond", json={"response": "accepted"}, timeout=15)
        assert rr.status_code == 200
        assert rr.json()["status"] == "accepted"

        # verify status persisted
        lr2 = requests.get(f"{BASE_URL}/api/notifications", params={"request_id": rid}, timeout=15)
        by_id = {n["id"]: n for n in lr2.json()}
        assert by_id[nid]["status"] == "accepted"


# ---------- Chat SSE ----------
class TestChat:
    def test_chat_sse_hindi(self):
        payload = {
            "session_id": "TEST_session_hindi_1",
            "message": "Mere father ke liye Kolkata me urgent B+ blood chahiye",
            "language": "auto",
        }
        r = requests.post(f"{BASE_URL}/api/chat", json=payload, stream=True, timeout=60)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "text/event-stream" in ct, f"unexpected ct: {ct}"
        got_delta = False
        got_done = False
        for raw in r.iter_lines(decode_unicode=True):
            if not raw:
                continue
            assert raw.startswith("data:"), f"non-SSE line: {raw!r}"
            try:
                obj = json.loads(raw[5:].strip())
            except Exception:
                continue
            if "delta" in obj:
                got_delta = True
            if obj.get("done"):
                got_done = True
                break
        assert got_delta, "Expected at least one delta token"
        assert got_done, "Expected done event"

    def test_chat_history(self):
        # send a message first
        payload = {"session_id": "TEST_session_history", "message": "Hello", "language": "en"}
        with requests.post(f"{BASE_URL}/api/chat", json=payload, stream=True, timeout=60) as r:
            for _ in r.iter_lines():
                pass  # drain
        time.sleep(1)
        r = requests.get(f"{BASE_URL}/api/chat/history/TEST_session_history", timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        assert len(msgs) >= 1
        roles = [m["role"] for m in msgs]
        assert "user" in roles


# ---------- Document analyze (vision) ----------
class TestDocument:
    def test_analyze_prescription_image(self):
        png = _make_realistic_prescription_png()
        files = {"file": ("prescription.png", png, "image/png")}
        r = requests.post(f"{BASE_URL}/api/document/analyze", files=files, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "extracted" in data
        ex = data["extracted"]
        # ensure key set is present or raw fallback
        expected_keys = {"patient_name", "blood_group", "units_needed", "hospital", "city", "urgency"}
        present = expected_keys.intersection(set(ex.keys()) if isinstance(ex, dict) else set())
        assert len(present) >= 3, f"Expected structured fields, got: {ex}"


# ---------- Camps ----------
class TestCamps:
    def test_create_and_list_camp(self):
        payload = {
            "name": "TEST_Camp_Regression",
            "organizer": "Test Org",
            "city": "Kolkata",
            "location": "Test Hall",
            "date": "2026-03-15T09:00:00+00:00",
            "predicted_demand": 150,
            "expected_donors": 180,
        }
        r = requests.post(f"{BASE_URL}/api/camps", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        camp = r.json()
        assert camp["name"] == payload["name"]

        # list
        lr = requests.get(f"{BASE_URL}/api/camps", timeout=15)
        assert lr.status_code == 200
        names = [c["name"] for c in lr.json()]
        assert "TEST_Camp_Regression" in names
        # keep camp id for awareness test
        pytest.raktasetu_camp_id = camp["id"]

    def test_generate_awareness(self):
        cid = getattr(pytest, "raktasetu_camp_id", None)
        if not cid:
            pytest.skip("camp not created")
        r = requests.post(f"{BASE_URL}/api/camps/{cid}/awareness", timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "awareness_post" in d
        assert isinstance(d["awareness_post"], str) and len(d["awareness_post"]) > 20
