import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, BLOOD_GROUPS, CITIES } from "@/lib/api";
import { TEST_IDS } from "@/constants/testIds";

export default function DonorRegister() {
  const [form, setForm] = useState({
    name: "", blood_group: "O+", city: "Kolkata", phone: "",
    last_donation_date: "", response_history_score: 0.85,
    lat: 0, lng: 0, eligible: true,
  });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error("Name and phone are required");
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.last_donation_date) payload.last_donation_date = null;
      await api.post("/donors", payload);
      setSuccess(true);
      toast.success("Registered! You'll be notified for eligible emergencies in your city.");
      setTimeout(() => nav("/dashboard"), 1600);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to register");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="overline">Become a Lifeline</p>
        <h1 className="h-section mt-2">Register as a Verified Donor</h1>
        <p className="mt-3 text-[color:var(--text-secondary)] max-w-xl mx-auto">
          Your registration adds you to the RaktaSetu smart-matching pool. You will only be pinged for emergencies where you are compatible and eligible.
        </p>
      </div>

      {success ? (
        <div className="card-flat mt-10 text-center py-14">
          <CheckCircle2 className="w-12 h-12 mx-auto text-[color:var(--success)]"/>
          <h3 className="font-display font-semibold text-xl mt-4">You are on the network.</h3>
          <p className="text-sm text-[color:var(--text-tertiary)] mt-2">Redirecting to the dashboard…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="card-flat mt-10 grid md:grid-cols-2 gap-5">
          <Field label="Full name" span={2}>
            <input data-testid={TEST_IDS.donor.formName} value={form.name} onChange={(e) => set("name", e.target.value)} className="inp" required/>
          </Field>
          <Field label="Blood group">
            <select data-testid={TEST_IDS.donor.formGroup} value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)} className="inp">
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="City">
            <select data-testid={TEST_IDS.donor.formCity} value={form.city} onChange={(e) => set("city", e.target.value)} className="inp">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Phone" span={2}>
            <input data-testid={TEST_IDS.donor.formPhone} value={form.phone} onChange={(e) => set("phone", e.target.value)} className="inp" placeholder="+91-XXXXXXXXXX"/>
          </Field>
          <Field label="Last donation date (optional)" span={2}>
            <input type="date" value={form.last_donation_date} onChange={(e) => set("last_donation_date", e.target.value)} className="inp"/>
          </Field>
          <div className="md:col-span-2 flex items-center justify-between pt-2 border-t border-[color:var(--border-subtle)]">
            <p className="text-xs text-[color:var(--text-tertiary)]">By registering you consent to be contacted for verified emergencies only.</p>
            <button data-testid={TEST_IDS.donor.formSubmit} disabled={busy} className="btn-primary">
              <UserPlus className="w-4 h-4"/> {busy ? "Saving…" : "Register"}
            </button>
          </div>

          <style>{`.inp{border:1px solid var(--border-default);border-radius:8px;padding:10px 12px;font-size:14px;width:100%;background:#fff;outline:none;transition:border-color .15s}.inp:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(185,28,28,0.1)}`}</style>
        </form>
      )}
    </div>
  );
}

function Field({ label, children, span = 1 }) {
  return (
    <label className={`flex flex-col gap-1.5 ${span === 2 ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-[color:var(--text-tertiary)] uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
