"""Seed demo donors, blood banks, and camps for RaktaSetu AI demo."""
from datetime import datetime, timezone, timedelta
import uuid

CITIES = {
    "Kolkata":   {"lat": 22.5726, "lng": 88.3639},
    "Mumbai":    {"lat": 19.0760, "lng": 72.8777},
    "Delhi":     {"lat": 28.6139, "lng": 77.2090},
    "Bangalore": {"lat": 12.9716, "lng": 77.5946},
    "Chennai":   {"lat": 13.0827, "lng": 80.2707},
}

DEMO_DONORS = [
    # Kolkata cluster
    {"name": "Arindam Banerjee",   "blood_group": "B+",  "city": "Kolkata",  "phone": "+91-9830011111", "lat": 22.5850, "lng": 88.4025, "last_donation_date": "2025-10-14", "response_history_score": 0.92, "eligible": True},
    {"name": "Rituparna Sen",      "blood_group": "B+",  "city": "Kolkata",  "phone": "+91-9830022222", "lat": 22.5670, "lng": 88.3540, "last_donation_date": "2025-08-01", "response_history_score": 0.88, "eligible": True},
    {"name": "Sourav Ghosh",       "blood_group": "O-",  "city": "Kolkata",  "phone": "+91-9830033333", "lat": 22.5915, "lng": 88.4110, "last_donation_date": "2025-07-05", "response_history_score": 0.95, "eligible": True},
    {"name": "Ishita Bhattacharya","blood_group": "A+",  "city": "Kolkata",  "phone": "+91-9830044444", "lat": 22.5520, "lng": 88.3400, "last_donation_date": "2025-11-20", "response_history_score": 0.7,  "eligible": False},
    {"name": "Debashish Roy",      "blood_group": "B-",  "city": "Kolkata",  "phone": "+91-9830055555", "lat": 22.5710, "lng": 88.4210, "last_donation_date": "2025-06-10", "response_history_score": 0.81, "eligible": True},
    {"name": "Priya Chatterjee",   "blood_group": "AB+", "city": "Kolkata",  "phone": "+91-9830066666", "lat": 22.5450, "lng": 88.3720, "last_donation_date": "2025-05-12", "response_history_score": 0.66, "eligible": True},
    {"name": "Rahul Das",          "blood_group": "O+",  "city": "Kolkata",  "phone": "+91-9830077777", "lat": 22.5810, "lng": 88.3300, "last_donation_date": "2025-09-01", "response_history_score": 0.79, "eligible": True},
    {"name": "Sanjukta Mitra",     "blood_group": "B+",  "city": "Kolkata",  "phone": "+91-9830088888", "lat": 22.6015, "lng": 88.3959, "last_donation_date": "2025-12-30", "response_history_score": 0.6,  "eligible": False},
    # Mumbai
    {"name": "Aditya Shah",        "blood_group": "A+",  "city": "Mumbai",   "phone": "+91-9820011111", "lat": 19.0800, "lng": 72.8800, "last_donation_date": "2025-07-20", "response_history_score": 0.9,  "eligible": True},
    {"name": "Meera Iyer",         "blood_group": "O+",  "city": "Mumbai",   "phone": "+91-9820022222", "lat": 19.1100, "lng": 72.8600, "last_donation_date": "2025-05-01", "response_history_score": 0.85, "eligible": True},
    {"name": "Kunal Verma",        "blood_group": "B+",  "city": "Mumbai",   "phone": "+91-9820033333", "lat": 19.0400, "lng": 72.9000, "last_donation_date": "2025-10-25", "response_history_score": 0.72, "eligible": True},
    # Delhi
    {"name": "Karan Malhotra",     "blood_group": "AB-", "city": "Delhi",    "phone": "+91-9810011111", "lat": 28.6200, "lng": 77.2100, "last_donation_date": "2025-04-11", "response_history_score": 0.9,  "eligible": True},
    {"name": "Neha Kapoor",        "blood_group": "O-",  "city": "Delhi",    "phone": "+91-9810022222", "lat": 28.6300, "lng": 77.2300, "last_donation_date": "2025-08-19", "response_history_score": 0.83, "eligible": True},
    # Bangalore
    {"name": "Vikram Reddy",       "blood_group": "A-",  "city": "Bangalore","phone": "+91-9880011111", "lat": 12.9700, "lng": 77.6000, "last_donation_date": "2025-06-30", "response_history_score": 0.87, "eligible": True},
    {"name": "Divya Rao",          "blood_group": "B+",  "city": "Bangalore","phone": "+91-9880022222", "lat": 12.9600, "lng": 77.5900, "last_donation_date": "2025-09-14", "response_history_score": 0.78, "eligible": True},
]

DEMO_BLOOD_BANKS = [
    {"name": "Apollo Blood Bank",           "city": "Kolkata",  "phone": "+91-3323207000", "lat": 22.5385, "lng": 88.3800, "inventory": {"O+": 12, "O-": 3, "A+": 8, "A-": 2, "B+": 15, "B-": 4, "AB+": 5, "AB-": 1}},
    {"name": "AMRI Hospital Blood Centre",  "city": "Kolkata",  "phone": "+91-3366800000", "lat": 22.5205, "lng": 88.3612, "inventory": {"O+": 7,  "O-": 1, "A+": 5, "A-": 1, "B+": 9,  "B-": 2, "AB+": 3, "AB-": 0}},
    {"name": "Peerless Blood Bank",         "city": "Kolkata",  "phone": "+91-3340111222", "lat": 22.4980, "lng": 88.3950, "inventory": {"O+": 5,  "O-": 2, "A+": 3, "A-": 0, "B+": 6,  "B-": 1, "AB+": 2, "AB-": 1}},
    {"name": "Fortis Blood Bank Mumbai",    "city": "Mumbai",   "phone": "+91-2266754444", "lat": 19.0900, "lng": 72.8500, "inventory": {"O+": 14, "O-": 4, "A+": 9, "A-": 3, "B+": 11, "B-": 2, "AB+": 4, "AB-": 1}},
    {"name": "AIIMS Blood Centre",          "city": "Delhi",    "phone": "+91-1126588500", "lat": 28.5670, "lng": 77.2100, "inventory": {"O+": 20, "O-": 6, "A+": 12, "A-": 4, "B+": 18, "B-": 5, "AB+": 6, "AB-": 2}},
    {"name": "Manipal Blood Bank",          "city": "Bangalore","phone": "+91-8025023200", "lat": 12.9600, "lng": 77.6200, "inventory": {"O+": 10, "O-": 3, "A+": 7, "A-": 2, "B+": 8,  "B-": 3, "AB+": 3, "AB-": 1}},
]

DEMO_CAMPS = [
    {"name": "IIT Kharagpur Mega Blood Drive", "organizer": "IIT KGP NSS", "city": "Kolkata", "location": "Nehru Hall Auditorium", "date": (datetime.now(timezone.utc) + timedelta(days=12)).isoformat(), "predicted_demand": 220, "expected_donors": 260, "status": "upcoming"},
    {"name": "Presidency College Rotaract",    "organizer": "Rotaract Club", "city": "Kolkata", "location": "College Street Campus", "date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),  "predicted_demand": 140, "expected_donors": 180, "status": "upcoming"},
    {"name": "Wockhardt Corporate Drive",      "organizer": "Wockhardt Foundation", "city": "Mumbai", "location": "BKC Business Park", "date": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat(), "predicted_demand": 300, "expected_donors": 340, "status": "upcoming"},
]


def build_seed():
    now = datetime.now(timezone.utc).isoformat()
    donors = [{"id": str(uuid.uuid4()), "created_at": now, **d} for d in DEMO_DONORS]
    banks  = [{"id": str(uuid.uuid4()), "created_at": now, **b} for b in DEMO_BLOOD_BANKS]
    camps  = [{"id": str(uuid.uuid4()), "created_at": now, **c} for c in DEMO_CAMPS]
    return donors, banks, camps
