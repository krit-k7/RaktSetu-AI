import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, Activity, Zap, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { api, streamChat, BLOOD_GROUPS, CITIES, URGENCY } from "@/lib/api";
import { TEST_IDS } from "@/constants/testIds";

const WELCOME = {
  auto: "Hi, I'm RaktaSetu AI. Tell me who needs blood, which group, which city, and how urgent — in Hindi, Bengali, or English.",
  en:   "Hi, I'm RaktaSetu AI. Tell me who needs blood, which group, which city, and how urgent.",
  hi:   "नमस्ते, मैं RaktaSetu AI हूँ। बताइए किसके लिए ब्लड चाहिए, कौन सा ग्रुप, कौन सा शहर, कितना अर्जेंट।",
  bn:   "নমস্কার, আমি RaktaSetu AI। বলুন কার জন্য রক্ত দরকার, কোন গ্রুপ, কোন শহর, কতটা জরুরি।",
};

const SUGGESTIONS = [
  "Mere father ke liye Kolkata mein urgent B+ blood chahiye",
  "Amar B+ blood dorkar, Salt Lake e — Apollo Hospital",
  "Need 2 units O- blood at AIIMS Delhi, critical",
];

function useSessionId() {
  const [sid] = useState(() => {
    const k = "raktasetu_sid";
    let v = localStorage.getItem(k);
    if (!v) { v = crypto.randomUUID(); localStorage.setItem(k, v); }
    return v;
  });
  return sid;
}

export default function Emergency() {
  const sid = useSessionId();
  const [language, setLanguage] = useState("auto");
  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME.auto }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text || streaming) return;
    setMessages(m => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    await streamChat({
      session_id: sid, message: text, language,
      onDelta: (d) => setMessages(m => {
        const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + d };
        return c;
      }),
      onDone: () => setStreaming(false),
      onError: (e) => { setStreaming(false); toast.error(e); },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chat panel */}
        <div className="lg:col-span-3 flex flex-col card-flat" style={{ padding: 0, height: "min(74vh, 780px)" }}>
          <div className="p-5 border-b border-[color:var(--border-default)] flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="overline">Multilingual Blood Assistant</p>
              <h2 className="font-display font-semibold text-xl mt-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[color:var(--brand)]"/> Talk in your language
              </h2>
            </div>
            <select
              data-testid={TEST_IDS.emergency.langSelect}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm border border-[color:var(--border-default)] rounded-md px-3 py-2 bg-white">
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed
                  ${m.role === "user"
                    ? "bg-[color:var(--brand)] text-white rounded-br-sm"
                    : "bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)] rounded-bl-sm"}`}>
                  {m.content || <TypingDots/>}
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 2 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[color:var(--border-default)] hover:bg-[color:var(--bg-secondary)] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input.trim()); }}
            className="p-4 border-t border-[color:var(--border-default)] flex gap-2">
            <input
              data-testid={TEST_IDS.emergency.chatInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === "hi" ? "अपना संदेश टाइप करें…" : language === "bn" ? "আপনার বার্তা টাইপ করুন…" : "Type your emergency…"}
              className="flex-1 border border-[color:var(--border-default)] rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              data-testid={TEST_IDS.emergency.chatSend}
              className="btn-primary disabled:opacity-50">
              <Send className="w-4 h-4"/> Send
            </button>
          </form>
        </div>

        {/* Request Form panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-flat">
            <div className="flex items-center justify-between">
              <p className="overline">Structured Emergency Request</p>
              <span className="pill pill-urgent"><Activity className="w-3 h-3"/> Live</span>
            </div>
            <h3 className="font-display font-semibold text-lg mt-2">Skip the chat — file directly.</h3>
            <p className="text-sm text-[color:var(--text-tertiary)] mt-1.5">
              We&apos;ll draft an outreach message, rank donors by match score, and dispatch notifications.
            </p>
            <button
              onClick={() => setShowForm(true)}
              data-testid={TEST_IDS.emergency.createBtn}
              className="mt-5 btn-urgent w-full">
              <Zap className="w-4 h-4"/> Create Emergency Request
            </button>
          </div>

          <div className="card-flat">
            <p className="overline">What happens next</p>
            <ol className="mt-4 space-y-3 text-sm">
              {[
                "Gemma 4 parses patient, group, hospital, urgency",
                "Smart matcher scores every donor: compat × distance × cooldown × history",
                "AI drafts a warm outreach message in the patient's language",
                "Top-5 donors receive instant in-app notifications",
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-[10px] w-5 h-5 rounded-full bg-[color:var(--brand-light)] text-[color:var(--brand)] flex items-center justify-center shrink-0 mt-0.5 font-bold">{i+1}</span>
                  <span className="text-[color:var(--text-secondary)] leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {showForm && <RequestModal onClose={() => setShowForm(false)} onCreated={(r) => { setShowForm(false); toast.success("Emergency request created"); navigate(`/dashboard?req=${r.id}`); }} />}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--brand)] animate-pulse"/>
      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--brand)] animate-pulse" style={{ animationDelay: "0.15s" }}/>
      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--brand)] animate-pulse" style={{ animationDelay: "0.3s" }}/>
    </span>
  );
}

function RequestModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    patient_name: "", blood_group: "B+", units_needed: 1,
    hospital: "", city: "Kolkata", urgency: "high", requester_phone: "", notes: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patient_name || !form.hospital || !form.requester_phone) {
      toast.error("Please fill patient name, hospital, and phone");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/requests", form);
      // auto-notify donors
      await api.post(`/requests/${data.id}/notify`).catch(()=>{});
      onCreated(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create request");
    } finally { setBusy(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-2xl w-full max-w-lg border border-[color:var(--border-default)] shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[color:var(--border-default)] flex items-center justify-between">
          <div>
            <p className="overline">Emergency Request</p>
            <h3 className="font-display font-semibold text-lg mt-1">File a blood requirement</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-md hover:bg-[color:var(--bg-secondary)]">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <Field label="Patient name" span={2}>
            <input data-testid={TEST_IDS.emergency.formName} value={form.patient_name} onChange={(e) => set("patient_name", e.target.value)} className="inp" required/>
          </Field>
          <Field label="Blood group">
            <select data-testid={TEST_IDS.emergency.formGroup} value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)} className="inp">
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Units needed">
            <input type="number" min="1" max="10" data-testid={TEST_IDS.emergency.formUnits} value={form.units_needed} onChange={(e) => set("units_needed", parseInt(e.target.value || "1"))} className="inp"/>
          </Field>
          <Field label="Hospital" span={2}>
            <input data-testid={TEST_IDS.emergency.formHosp} value={form.hospital} onChange={(e) => set("hospital", e.target.value)} className="inp" placeholder="e.g. Apollo Hospital"/>
          </Field>
          <Field label="City">
            <select data-testid={TEST_IDS.emergency.formCity} value={form.city} onChange={(e) => set("city", e.target.value)} className="inp">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Urgency">
            <select data-testid={TEST_IDS.emergency.formUrgency} value={form.urgency} onChange={(e) => set("urgency", e.target.value)} className="inp">
              {URGENCY.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </Field>
          <Field label="Requester phone" span={2}>
            <input data-testid={TEST_IDS.emergency.formPhone} value={form.requester_phone} onChange={(e) => set("requester_phone", e.target.value)} className="inp" placeholder="+91-..." />
          </Field>
          <Field label="Notes (optional)" span={2}>
            <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className="inp resize-none"/>
          </Field>
        </div>

        <div className="p-5 bg-[color:var(--bg-secondary)] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={busy} data-testid={TEST_IDS.emergency.formSubmit} className="btn-urgent">
            {busy ? "Filing…" : <>File Request <ArrowRight className="w-4 h-4"/></>}
          </button>
        </div>

        <style>{`.inp{border:1px solid var(--border-default);border-radius:8px;padding:10px 12px;font-size:14px;width:100%;background:#fff;outline:none;transition:border-color .15s}.inp:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(185,28,28,0.1)}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children, span = 1 }) {
  return (
    <label className={`flex flex-col gap-1.5 col-span-${span === 2 ? 2 : 1}`}>
      <span className="text-xs font-medium text-[color:var(--text-tertiary)] uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
