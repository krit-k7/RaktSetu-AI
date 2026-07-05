import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Droplet, Clock, MapPin, Phone, Bell, RefreshCw, User, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { TEST_IDS } from "@/constants/testIds";
import { MatchRing } from "@/pages/Landing";

const URG_COLOR = { critical: "pill-urgent", high: "pill-warn", normal: "pill-neutral" };

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: reqs }] = await Promise.all([api.get("/requests")]);
      setRequests(reqs);
      const target = params.get("req") ? reqs.find(r => r.id === params.get("req")) : reqs[0];
      if (target) selectReq(target);
    } finally { setLoading(false); }
  };

  const selectReq = async (r) => {
    setSelected(r);
    try {
      const [{ data: m }, { data: b }] = await Promise.all([
        api.get(`/requests/${r.id}/matches?top=8`),
        api.get(`/blood-banks?city=${encodeURIComponent(r.city)}&blood_group=${encodeURIComponent(r.blood_group)}`),
      ]);
      setMatches(m.matches);
      setBanks(b);
    } catch (e) { toast.error("Could not load matches"); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, []);

  const notify = async () => {
    if (!selected) return;
    try {
      const { data } = await api.post(`/requests/${selected.id}/notify`);
      toast.success(`Dispatched to ${data.notified} donors`);
    } catch { toast.error("Failed to notify"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-testid={TEST_IDS.dashboard.root}>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="overline">Live Emergency Grid</p>
          <h1 className="h-section mt-2">Active Blood Requests</h1>
          <p className="text-sm text-[color:var(--text-tertiary)] mt-2">Real-time queue of open requirements and their AI-ranked donor matches.</p>
        </div>
        <button onClick={loadAll} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}/> Refresh
        </button>
      </div>

      {requests.length === 0 && !loading && (
        <div className="card-flat text-center py-16">
          <AlertCircle className="w-8 h-8 mx-auto text-[color:var(--text-tertiary)]"/>
          <p className="mt-3 font-medium">No emergency requests yet.</p>
          <p className="text-sm text-[color:var(--text-tertiary)] mt-1">File one from the Emergency AI page to see the matching engine in action.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: request list */}
        <div className="lg:col-span-2 space-y-3">
          {requests.map(r => (
            <button
              key={r.id}
              onClick={() => selectReq(r)}
              data-testid={TEST_IDS.dashboard.requestCard}
              className={`card-flat w-full text-left transition-all ${selected?.id === r.id ? "ring-2 ring-[color:var(--brand)] border-transparent" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-[color:var(--brand)] text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    {r.blood_group}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.patient_name}</div>
                    <div className="text-xs text-[color:var(--text-tertiary)] flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3 h-3"/> {r.hospital}, {r.city}
                    </div>
                  </div>
                </div>
                <span className={`pill ${URG_COLOR[r.urgency] || "pill-neutral"}`}>{r.urgency}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-[color:var(--border-subtle)] flex items-center justify-between text-xs text-[color:var(--text-tertiary)] font-mono">
                <span>{r.units_needed} unit{r.units_needed>1?"s":""} needed</span>
                <span>{new Date(r.created_at).toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Right: matches + banks + AI message */}
        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <>
              {/* AI outreach card */}
              <div className="card-flat relative overflow-hidden">
                <div className="scan-line"/>
                <p className="overline">AI-Drafted Outreach</p>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-primary)] italic">&ldquo;{selected.ai_message || "Emergency blood needed."}&rdquo;</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-[color:var(--text-tertiary)] font-mono">Auto-generated by Gemma 4</div>
                  <button data-testid={TEST_IDS.emergency.notifyBtn} onClick={notify} className="btn-primary text-sm py-2 px-4">
                    <Bell className="w-4 h-4"/> Notify Top Donors
                  </button>
                </div>
              </div>

              {/* Matches */}
              <div className="card-flat" style={{ padding: 0 }}>
                <div className="p-5 border-b border-[color:var(--border-default)] flex items-center justify-between">
                  <div>
                    <p className="overline">Smart Donor Matches</p>
                    <h3 className="font-display font-semibold text-lg mt-1">Ranked by compatibility × distance × eligibility × history</h3>
                  </div>
                  <span className="pill pill-info">{matches.length} donors</span>
                </div>
                <div className="divide-y divide-[color:var(--border-subtle)]">
                  {matches.length === 0 && (
                    <div className="p-6 text-sm text-[color:var(--text-tertiary)]">No compatible donors found in this city.</div>
                  )}
                  {matches.map(m => (
                    <div key={m.id} data-testid={TEST_IDS.dashboard.matchRow} className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <MatchRing pct={Math.round(m.match_score)}/>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{m.name}</span>
                            <span className="pill pill-neutral font-mono text-[10px]">{m.blood_group}</span>
                            {m.eligible
                              ? <span className="pill pill-success">Eligible</span>
                              : <span className="pill pill-warn">Cooldown</span>}
                          </div>
                          <div className="mt-1 text-xs text-[color:var(--text-tertiary)] font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{m.distance_km} km</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>ETA {m.eta_min}m</span>
                            <span>Last donation {m.days_since_donation}d ago</span>
                          </div>
                        </div>
                      </div>
                      <a href={`tel:${m.phone}`} className="btn-secondary text-xs py-2 px-3">
                        <Phone className="w-3.5 h-3.5"/> Call
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blood banks */}
              <div className="card-flat" style={{ padding: 0 }}>
                <div className="p-5 border-b border-[color:var(--border-default)]">
                  <p className="overline">Nearest Blood Banks · {selected.blood_group} availability</p>
                </div>
                <div className="divide-y divide-[color:var(--border-subtle)]">
                  {banks.map(b => (
                    <div key={b.id} className="p-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[color:var(--bg-secondary)] flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[color:var(--text-secondary)]"/>
                        </div>
                        <div>
                          <div className="font-medium">{b.name}</div>
                          <div className="text-xs text-[color:var(--text-tertiary)]">{b.city} · {b.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-display font-bold text-2xl ${b.available_units > 0 ? "text-[color:var(--success)]" : "text-[color:var(--brand)]"}`}>{b.available_units ?? 0}</div>
                        <div className="text-[10px] font-mono uppercase text-[color:var(--text-tertiary)] tracking-wider">units</div>
                      </div>
                    </div>
                  ))}
                  {banks.length === 0 && <div className="p-6 text-sm text-[color:var(--text-tertiary)]">No inventory data.</div>}
                </div>
              </div>
            </>
          ) : (
            <div className="card-flat text-center py-16">
              <Droplet className="w-8 h-8 mx-auto text-[color:var(--text-tertiary)]" fill="currentColor"/>
              <p className="mt-3 font-medium">Select a request to see matches</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
