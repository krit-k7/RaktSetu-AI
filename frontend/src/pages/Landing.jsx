import { Link } from "react-router-dom";
import { Droplet, Activity, MapPin, ShieldCheck, ScanLine, Languages, HeartPulse, Sparkles, ArrowRight, Users, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TEST_IDS } from "@/constants/testIds";

const FEATURES = [
  { icon: Languages, title: "Multilingual Blood Assistant", body: "Ask in Hindi, Bengali, or English. AI understands urgency, blood group, hospital, and city — right from natural conversation." },
  { icon: ScanLine,  title: "Medical Document Vision",       body: "Upload a doctor's prescription or blood-requirement slip. AI extracts blood group, units, hospital & urgency in seconds." },
  { icon: HeartPulse,title: "Smart Donor Matching",           body: "Compatibility, distance, last-donation date, and response history — combined into a single match score per donor." },
  { icon: Activity,  title: "Emergency AI Agent",            body: "Auto-drafts a warm, urgent outreach message and notifies the top-eligible donors instantly across the network." },
  { icon: ShieldCheck,title:"Verified Blood Bank Directory",  body: "Live inventory across major hospital blood banks in Kolkata, Mumbai, Delhi, Bangalore — sorted by units available." },
  { icon: Sparkles,  title: "Blood Camp Organizer Mode",      body: "Colleges & NGOs can register camps, forecast demand, and let AI generate awareness posts for social sharing." },
];

export default function Landing() {
  const [stats, setStats] = useState({ donors: 0, blood_banks: 0, camps: 0, requests_open: 0 });

  useEffect(() => { api.get("/stats").then(r => setStats(r.data)).catch(()=>{}); }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[color:var(--bg-primary)] grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 fade-up fade-up-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color:var(--brand-light)] border border-[color:var(--border-urgent)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--pulse)] pulse-ring"/>
                <span className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold text-[color:var(--brand)]">Live · Emergency Response Grid</span>
              </div>

              <h1 className="h-display mt-6">
                Every minute matters<br/>
                <span className="text-[color:var(--brand)]">in a blood emergency.</span>
              </h1>

              <p className="mt-6 text-lg text-[color:var(--text-secondary)] max-w-2xl">
                RaktaSetu.AI listens in Hindi, Bengali & English. Reads doctor prescriptions. Ranks the most eligible donors in seconds — and gets a life-saving message to them before you finish your call.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/emergency" className="btn-urgent" data-testid={TEST_IDS.landing.heroCta}>
                  <Activity className="w-4 h-4"/> Request Blood Now
                </Link>
                <Link to="/donors/register" className="btn-secondary" data-testid={TEST_IDS.landing.heroDonor}>
                  <Users className="w-4 h-4"/> Register as Donor
                </Link>
                <Link to="/architecture" className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] inline-flex items-center gap-1 ml-2">
                  <Cpu className="w-4 h-4"/> How the AI works <ArrowRight className="w-3.5 h-3.5"/>
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
                <Stat label="Verified Donors"  value={stats.donors}/>
                <Stat label="Blood Banks"      value={stats.blood_banks}/>
                <Stat label="Camps Scheduled"  value={stats.camps}/>
                <Stat label="Active Requests"  value={stats.requests_open}/>
              </div>
            </div>

            <div className="lg:col-span-5 fade-up fade-up-2">
              <HeroCard/>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t border-[color:var(--border-default)] bg-[color:var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <p className="overline">Killer AI Features</p>
              <h2 className="h-section mt-2 max-w-2xl">Built for the moment a family needs help &mdash; not another SaaS.</h2>
            </div>
            <Link to="/architecture" className="text-sm inline-flex items-center gap-1 text-[color:var(--brand)] font-medium">
              See architecture <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card-flat fade-up" style={{ animationDelay: `${0.05 * i}s` }}>
                <div className="w-10 h-10 rounded-lg bg-[color:var(--brand-light)] flex items-center justify-center text-[color:var(--brand)]">
                  <f.icon className="w-5 h-5"/>
                </div>
                <h3 className="font-display font-semibold text-lg mt-4">{f.title}</h3>
                <p className="text-sm text-[color:var(--text-secondary)] mt-2 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[color:var(--bg-primary)] border-t border-[color:var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="overline">Our Mission</p>
            <h2 className="h-section mt-2">A last-mile bridge, not another directory.</h2>
            <p className="mt-6 text-[color:var(--text-secondary)] leading-relaxed">
              Every year thousands of Indian families struggle to find compatible blood on time — because information is scattered, hospitals don't talk to each other, and language barriers slow everything down. RaktaSetu.AI is a purpose-built intelligence layer that <span className="text-[color:var(--text-primary)] font-medium">listens, understands, matches, and acts</span> — in the language you already speak.
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm text-[color:var(--text-tertiary)]">
              <MapPin className="w-4 h-4"/> Operational grid: Kolkata · Mumbai · Delhi · Bangalore · Chennai
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[color:var(--border-default)] shadow-sm">
            <img
              src="https://images.pexels.com/photos/5206923/pexels-photo-5206923.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              alt="Doctor holding patient's hands"
              className="w-full h-[380px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[color:var(--bg-secondary)] border-t border-[color:var(--border-default)]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.08]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1624533358643-7336036c9482?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHJlZCUyMHB1bHNlJTIwZGFya3xlbnwwfHx8fDE3ODIzMjEwMDR8MA&ixlib=rb-4.1.0&q=85')" }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <p className="overline">Emergency AI Ready</p>
          <h2 className="h-section mt-3 max-w-3xl mx-auto text-[color:var(--text-primary)]">&ldquo;Mere father ke liye Kolkata mein urgent B+ blood chahiye.&rdquo;</h2>
          <p className="mt-4 text-[color:var(--text-secondary)] max-w-2xl mx-auto">
            Say it in your language. Watch the AI parse it, match verified donors, and dispatch outreach &mdash; before the next minute passes.
          </p>
          <div className="mt-8 inline-flex">
            <Link to="/emergency" className="btn-urgent">
              <Droplet className="w-4 h-4" fill="currentColor"/> Start Emergency Request
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-display font-bold text-3xl">{value ?? 0}</div>
      <div className="mt-1 font-mono text-[11px] tracking-[0.16em] uppercase text-[color:var(--text-tertiary)]">{label}</div>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="relative card-flat overflow-hidden" style={{ padding: 0 }}>
      <div className="p-6 border-b border-[color:var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[color:var(--pulse)] pulse-ring"/>
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[color:var(--brand)]">Live Match · Kolkata</span>
        </div>
        <span className="pill pill-urgent">B+ · Critical</span>
      </div>

      <div className="divide-y divide-[color:var(--border-subtle)]">
        {[
          { name: "Arindam Banerjee",    score: 94, dist: "2.4 km", eta: "18 min", state: "eligible"  },
          { name: "Rituparna Sen",       score: 89, dist: "3.1 km", eta: "21 min", state: "eligible"  },
          { name: "Sourav Ghosh (O-)",   score: 86, dist: "4.7 km", eta: "26 min", state: "eligible"  },
          { name: "Sanjukta Mitra",      score: 61, dist: "5.9 km", eta: "31 min", state: "cooldown"  },
        ].map((d) => (
          <div key={d.name} className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <MatchRing pct={d.score}/>
              <div className="min-w-0">
                <div className="font-medium truncate">{d.name}</div>
                <div className="text-xs text-[color:var(--text-tertiary)] font-mono">
                  {d.dist} <span className="divider-dot"/> ETA {d.eta}
                </div>
              </div>
            </div>
            <div>
              {d.state === "eligible"
                ? <span className="pill pill-success">Eligible</span>
                : <span className="pill pill-warn">Cooldown</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-[color:var(--bg-secondary)] text-xs text-[color:var(--text-tertiary)] font-mono flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[color:var(--brand)]"/> Gemma 4 · Scored 15 donors in 340 ms
      </div>
    </div>
  );
}

export function MatchRing({ pct }) {
  return (
    <div
      className="match-ring rounded-full w-11 h-11 flex items-center justify-center shrink-0"
      style={{ "--pct": pct }}>
      <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center">
        <span className="font-mono text-[11px] font-bold">{pct}</span>
      </div>
    </div>
  );
}
