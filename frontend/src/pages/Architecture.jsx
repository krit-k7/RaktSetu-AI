import { Cpu, Layers, Database, MessageSquareText, ScanEye, Sparkles, GitBranch, Server } from "lucide-react";

const LAYERS = [
  { icon: MessageSquareText, name: "Conversation Layer",  detail: "React chat UI · SSE streaming · language auto-detect · session persistence in MongoDB." },
  { icon: Cpu,               name: "Gemma 4 Core", detail: "Multilingual reasoning (Hindi / Bengali / English), medical vision, request-message drafting, camp copywriting." },
  { icon: ScanEye,           name: "Document Vision",     detail: "Base64 image → Gemma 4 vision → strict JSON extraction (blood group, units, hospital, urgency, doctor)." },
  { icon: GitBranch,         name: "Smart Matcher",       detail: "Compat matrix × Haversine × cooldown (90d) × response history × urgency boost → weighted match score." },
  { icon: Server,            name: "FastAPI Backend",     detail: "REST + Server-Sent-Events. Routes: /chat, /document/analyze, /requests/:id/matches, /camps/:id/awareness." },
  { icon: Database,          name: "MongoDB Store",       detail: "Collections: donors, blood_banks, requests, notifications, camps, chat_messages, documents." },
];

const CODE_HINT = `# Gemma 4 via Emergent LLM Universal Key
chat = LlmChat(
    api_key=EMERGENT_LLM_KEY,
    session_id=session_id,
    system_message=MULTILINGUAL_SYSTEM_PROMPT,
).with_model("gemma", "gemma-4")

async for ev in chat.stream_message(UserMessage(text=user_msg)):
    if isinstance(ev, TextDelta): yield ev.content
    elif isinstance(ev, StreamDone): break`;

const VISION_HINT = `# Medical document → structured JSON
chat = LlmChat(
    api_key=EMERGENT_LLM_KEY,
    session_id=f"doc-{uuid4()}",
    system_message=DOC_EXTRACTION_PROMPT,   # returns strict JSON
).with_model("gemma", "gemma-4")

msg = UserMessage(
    text="Extract structured blood-request fields. JSON only.",
    file_contents=[ImageContent(image_base64=b64)],
)`;

const SCORE_HINT = `# Smart donor scoring
match_score = distance_score(0-40) +
              eligibility_score(0-30, ≥90d cooldown) +
              history_score(0-20, past response reliability) +
              urgency_boost(5-10)`;

export default function Architecture() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto">
        <p className="overline">Proof of Work</p>
        <h1 className="h-display mt-4">Inside the RaktaSetu.AI intelligence stack.</h1>
        <p className="mt-5 text-[color:var(--text-secondary)]">
          A dense, transparent look at how Gemma 4 &mdash; the multilingual, multimodal reasoning core &mdash; is composed with a
          purpose-built matching algorithm and an FastAPI/MongoDB backbone to save minutes when minutes matter.
        </p>
      </div>

      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAYERS.map((l, i) => (
          <div key={l.name} className="card-flat fade-up" style={{ animationDelay: `${0.05 * i}s` }}>
            <div className="w-10 h-10 rounded-lg bg-[color:var(--brand-light)] flex items-center justify-center text-[color:var(--brand)]">
              <l.icon className="w-5 h-5"/>
            </div>
            <h3 className="font-display font-semibold text-lg mt-4">{l.name}</h3>
            <p className="text-sm text-[color:var(--text-secondary)] mt-2 leading-relaxed">{l.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid lg:grid-cols-2 gap-6">
        <CodeCard title="Multilingual Chat · Gemma 4" body={CODE_HINT}/>
        <CodeCard title="Medical Document Vision" body={VISION_HINT}/>
      </div>

      <div className="mt-6 card-flat">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[color:var(--brand)]"/>
          <p className="overline">Smart Donor Matching Formula</p>
        </div>
        <pre className="mt-4 font-mono text-xs leading-relaxed text-[color:var(--text-primary)] whitespace-pre-wrap">{SCORE_HINT}</pre>
        <p className="mt-4 text-sm text-[color:var(--text-secondary)] leading-relaxed">
          For each request the backend fetches all donors in the target city, filters by blood-compatibility, then computes a per-donor score in Python
          before ranking. Distance uses the great-circle (Haversine) formula. Cooldown enforces the 90-day medical safety window; partial credit is given
          as the window approaches. The final top-N are dispatched via <span className="font-mono text-[color:var(--brand)]">POST /api/requests/:id/notify</span>.
        </p>
      </div>

      <div className="mt-16 card-flat relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[color:var(--brand)]"/>
          <p className="overline">How Gemma 4 is used</p>
        </div>
        <ul className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-[color:var(--text-secondary)]">
          <li className="p-4 rounded-lg bg-[color:var(--bg-secondary)]">
            <span className="font-medium text-[color:var(--text-primary)]">1. Streamed conversation</span> — SSE endpoint <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded">/api/chat</code> streams tokens to the browser in real-time.
          </li>
          <li className="p-4 rounded-lg bg-[color:var(--bg-secondary)]">
            <span className="font-medium text-[color:var(--text-primary)]">2. Multimodal vision</span> — Base64 image + strict JSON system prompt returns machine-parseable extraction from prescriptions.
          </li>
          <li className="p-4 rounded-lg bg-[color:var(--bg-secondary)]">
            <span className="font-medium text-[color:var(--text-primary)]">3. Outreach copywriting</span> — Every emergency request auto-generates a warm, urgent donor-facing message in the same call as its DB insert.
          </li>
          <li className="p-4 rounded-lg bg-[color:var(--bg-secondary)]">
            <span className="font-medium text-[color:var(--text-primary)]">4. Camp awareness content</span> — Ready-to-share social copy for organizers with a single click.
          </li>
        </ul>
      </div>
    </div>
  );
}

function CodeCard({ title, body }) {
  return (
    <div className="card-flat" style={{ padding: 0 }}>
      <div className="p-4 border-b border-[color:var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[color:var(--brand)]"/>
          <span className="font-mono text-xs font-medium">{title}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[color:var(--brand)]"/>
          <span className="w-2 h-2 rounded-full bg-[color:var(--border-default)]"/>
          <span className="w-2 h-2 rounded-full bg-[color:var(--border-default)]"/>
        </div>
      </div>
      <pre className="p-5 font-mono text-[12px] leading-relaxed overflow-x-auto text-[color:var(--text-primary)] bg-[color:var(--bg-secondary)]">{body}</pre>
    </div>
  );
}
