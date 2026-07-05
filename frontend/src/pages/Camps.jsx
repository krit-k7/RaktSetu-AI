import { useEffect, useState } from "react";
import { Building2, Calendar, Users, Sparkles, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api, CITIES } from "@/lib/api";
import { TEST_IDS } from "@/constants/testIds";

export default function Camps() {
  const [camps, setCamps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [genLoading, setGenLoading] = useState({});

  const load = async () => {
    const { data } = await api.get("/camps");
    setCamps(data);
  };
  useEffect(() => { load(); }, []);

  const generatePost = async (id) => {
    setGenLoading(g => ({ ...g, [id]: true }));
    try {
      const { data } = await api.post(`/camps/${id}/awareness`);
      setCamps(cs => cs.map(c => c.id === id ? { ...c, awareness_post: data.awareness_post } : c));
      toast.success("Awareness post generated");
    } catch { toast.error("Failed"); }
    finally { setGenLoading(g => ({ ...g, [id]: false })); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="overline">Blood Camp Organizer</p>
          <h1 className="h-section mt-2">Predict demand. Register camps. Amplify with AI.</h1>
          <p className="mt-3 text-[color:var(--text-secondary)] max-w-2xl">
            Colleges, NGOs, and corporate foundations can schedule camps, forecast donor throughput, and generate ready-to-share awareness copy.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4"/> Register Camp
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {camps.map(c => (
          <div key={c.id} className="card-flat relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="pill pill-info">{c.city}</span>
                  <span className="pill pill-neutral">{c.status}</span>
                </div>
                <h3 className="font-display font-semibold text-xl mt-3">{c.name}</h3>
                <p className="text-sm text-[color:var(--text-tertiary)] mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5"/> {c.organizer} · {c.location}
                </p>
                <p className="text-xs text-[color:var(--text-tertiary)] mt-2 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5"/> {new Date(c.date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display font-bold text-3xl">{c.expected_donors}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--text-tertiary)]">expected donors</div>
                <div className="mt-2 text-xs text-[color:var(--text-secondary)]">
                  Predicted demand: <span className="font-medium">{c.predicted_demand} units</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[color:var(--border-subtle)]">
              {c.awareness_post ? (
                <div className="bg-[color:var(--bg-secondary)] rounded-lg p-4 text-sm leading-relaxed text-[color:var(--text-primary)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[color:var(--brand)]"/>
                    <span className="overline">AI-generated post</span>
                  </div>
                  {c.awareness_post}
                </div>
              ) : (
                <button
                  data-testid={TEST_IDS.camps.genBtn}
                  onClick={() => generatePost(c.id)}
                  disabled={genLoading[c.id]}
                  className="btn-secondary text-sm">
                  <Sparkles className="w-4 h-4"/> {genLoading[c.id] ? "Generating…" : "Generate Awareness Post with AI"}
                </button>
              )}
            </div>
          </div>
        ))}
        {camps.length === 0 && (
          <div className="col-span-full card-flat text-center py-14">
            <Users className="w-8 h-8 mx-auto text-[color:var(--text-tertiary)]"/>
            <p className="mt-3 font-medium">No camps registered yet.</p>
          </div>
        )}
      </div>

      {showForm && <CampForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }}/>}
    </div>
  );
}

function CampForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", organizer: "", city: "Kolkata", location: "",
    date: new Date(Date.now() + 7*86400000).toISOString().slice(0,10),
    predicted_demand: 120, expected_donors: 150,
  });
  const [busy, setBusy] = useState(false);
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.organizer || !form.location) return toast.error("All fields required");
    setBusy(true);
    try {
      await api.post("/camps", { ...form, date: new Date(form.date).toISOString() });
      toast.success("Camp registered");
      onCreated();
    } catch { toast.error("Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-2xl w-full max-w-lg border border-[color:var(--border-default)] shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[color:var(--border-default)] flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">Register a blood camp</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-md hover:bg-[color:var(--bg-secondary)]">
            <X className="w-4 h-4"/>
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <F label="Camp name" span={2}><input data-testid={TEST_IDS.camps.formName} value={form.name} onChange={(e) => set("name", e.target.value)} className="inp"/></F>
          <F label="Organizer"><input data-testid={TEST_IDS.camps.formOrg} value={form.organizer} onChange={(e) => set("organizer", e.target.value)} className="inp"/></F>
          <F label="City">
            <select data-testid={TEST_IDS.camps.formCity} value={form.city} onChange={(e) => set("city", e.target.value)} className="inp">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="Location" span={2}><input data-testid={TEST_IDS.camps.formLoc} value={form.location} onChange={(e) => set("location", e.target.value)} className="inp"/></F>
          <F label="Date"><input type="date" data-testid={TEST_IDS.camps.formDate} value={form.date} onChange={(e) => set("date", e.target.value)} className="inp"/></F>
          <F label="Expected donors"><input type="number" value={form.expected_donors} onChange={(e) => set("expected_donors", parseInt(e.target.value || "0"))} className="inp"/></F>
          <F label="Predicted demand (units)" span={2}><input type="number" data-testid={TEST_IDS.camps.formDemand} value={form.predicted_demand} onChange={(e) => set("predicted_demand", parseInt(e.target.value || "0"))} className="inp"/></F>
        </div>
        <div className="p-5 bg-[color:var(--bg-secondary)] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" data-testid={TEST_IDS.camps.formSubmit} disabled={busy} className="btn-primary">{busy ? "Saving…" : "Register camp"}</button>
        </div>
        <style>{`.inp{border:1px solid var(--border-default);border-radius:8px;padding:10px 12px;font-size:14px;width:100%;background:#fff;outline:none}.inp:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(185,28,28,0.1)}`}</style>
      </form>
    </div>
  );
}

function F({ label, children, span = 1 }) {
  return (
    <label className={`flex flex-col gap-1.5 ${span === 2 ? "col-span-2" : ""}`}>
      <span className="text-xs font-medium text-[color:var(--text-tertiary)] uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
