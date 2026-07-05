"""Blood group compatibility and smart matching utilities."""
from math import radians, sin, cos, asin, sqrt
from datetime import datetime, timezone
from typing import List, Dict, Any

# Which blood groups can DONATE to a given recipient
COMPATIBLE_DONORS: Dict[str, List[str]] = {
    "O-":  ["O-"],
    "O+":  ["O-", "O+"],
    "A-":  ["O-", "A-"],
    "A+":  ["O-", "O+", "A-", "A+"],
    "B-":  ["O-", "B-"],
    "B+":  ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
}

# Which blood groups can RECEIVE from a given donor
COMPATIBLE_RECIPIENTS: Dict[str, List[str]] = {
    "O-":  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+":  ["O+", "A+", "B+", "AB+"],
    "A-":  ["A-", "A+", "AB-", "AB+"],
    "A+":  ["A+", "AB+"],
    "B-":  ["B-", "B+", "AB-", "AB+"],
    "B+":  ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometers."""
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * asin(sqrt(a))
    return R * c


def days_since(iso_date: str | None) -> int:
    if not iso_date:
        return 9999
    try:
        d = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - d).days
    except Exception:
        return 9999


def score_donor(donor: Dict[str, Any], request: Dict[str, Any]) -> Dict[str, Any]:
    """Return donor with computed match_score, distance_km, eta_min, factors."""
    req_group = request["blood_group"]
    if donor["blood_group"] not in COMPATIBLE_DONORS.get(req_group, []):
        return {**donor, "match_score": 0, "compatible": False}

    distance = haversine_km(
        donor.get("lat", 0), donor.get("lng", 0),
        request.get("lat", 0), request.get("lng", 0),
    )

    dist_score = max(0, 40 - (distance * 2)) if distance <= 20 else max(0, 20 - distance * 0.5)
    dist_score = min(40, dist_score)

    dsl = days_since(donor.get("last_donation_date"))
    if dsl >= 90:
        eligibility_score = 30
        eligible = True
    else:
        eligibility_score = max(0, (dsl / 90) * 15)
        eligible = False

    history = float(donor.get("response_history_score", 0.7))
    history_score = min(20.0, history * 20)

    urgency_boost = 10 if request.get("urgency", "normal") in ("critical", "high") else 5

    match_score = round(dist_score + eligibility_score + history_score + urgency_boost, 1)

    eta_min = int(distance * 3) + 12  # rough ETA (5-min city crawl)

    return {
        **donor,
        "compatible": True,
        "eligible": eligible,
        "distance_km": round(distance, 2),
        "eta_min": eta_min,
        "match_score": match_score,
        "days_since_donation": dsl,
        "factors": {
            "distance_score": round(dist_score, 1),
            "eligibility_score": round(eligibility_score, 1),
            "history_score": round(history_score, 1),
            "urgency_boost": urgency_boost,
        },
    }


def rank_donors(donors: List[Dict[str, Any]], request: Dict[str, Any]) -> List[Dict[str, Any]]:
    scored = [score_donor(d, request) for d in donors]
    scored = [s for s in scored if s.get("compatible")]
    scored.sort(key=lambda d: d["match_score"], reverse=True)
    return scored
