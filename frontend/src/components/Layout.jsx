import { Link, NavLink, useLocation } from "react-router-dom";
import { Droplet, Activity, Users, Building2, FileScan, Cpu, Menu, X } from "lucide-react";
import { useState } from "react";
import { TEST_IDS } from "@/constants/testIds";

const NAV = [
  { to: "/",                  label: "Home",         id: TEST_IDS.nav.home,      icon: null },
  { to: "/emergency",         label: "Emergency AI", id: TEST_IDS.nav.emergency, icon: Activity },
  { to: "/dashboard",         label: "Requests",     id: TEST_IDS.nav.dashboard, icon: Droplet  },
  { to: "/donors/register",   label: "Register",     id: TEST_IDS.nav.donor,     icon: Users    },
  { to: "/camps",             label: "Camps",        id: TEST_IDS.nav.camps,     icon: Building2},
  { to: "/document",          label: "Document AI",  id: TEST_IDS.nav.doc,       icon: FileScan },
  { to: "/architecture",      label: "Architecture", id: TEST_IDS.nav.arch,      icon: Cpu      },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const isLanding = loc.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[color:var(--bg-primary)]/85 border-b border-[color:var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" data-testid={TEST_IDS.landing.logo} className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-md bg-[color:var(--brand)] flex items-center justify-center text-white">
                <Droplet className="w-4 h-4" fill="currentColor" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[color:var(--pulse)] pulse-ring" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-lg tracking-tight">RaktaSetu<span className="text-[color:var(--brand)]">.</span>AI</span>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[color:var(--text-tertiary)]">Blood Intelligence Network</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.slice(1).map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.id}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "text-[color:var(--brand)] bg-[color:var(--brand-light)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  }`
                }>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Link to="/emergency" className="btn-urgent text-sm py-2 px-4" data-testid="header-emergency-btn">
              <Activity className="w-4 h-4" /> Request Blood
            </Link>
          </div>

          <button
            className="lg:hidden p-2 rounded-md border border-[color:var(--border-default)]"
            onClick={() => setOpen(!open)}
            data-testid="mobile-menu-toggle"
            aria-label="menu">
            {open ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-[color:var(--border-default)] bg-white">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV.map(n => (
                <NavLink
                  key={n.to} to={n.to} data-testid={n.id + "-m"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `px-3 py-2 rounded-md text-sm ${isActive ? "text-[color:var(--brand)] bg-[color:var(--brand-light)]" : "text-[color:var(--text-secondary)]"}`}>
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className={`flex-1 ${isLanding ? "" : "py-10"}`}>
        {children}
      </main>

      <footer className="border-t border-[color:var(--border-default)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[color:var(--brand)] flex items-center justify-center text-white">
                <Droplet className="w-3.5 h-3.5" fill="currentColor" />
              </div>
              <span className="font-display font-bold">RaktaSetu.AI</span>
            </div>
            <p className="mt-3 text-sm text-[color:var(--text-tertiary)] max-w-xs">
              An emergency blood & donor intelligence network powered by multilingual AI. Built to bridge the last-mile gap in critical care.
            </p>
          </div>
          <div>
            <p className="overline mb-3">Platform</p>
            <ul className="space-y-2 text-sm text-[color:var(--text-secondary)]">
              <li><Link to="/emergency">Emergency AI Assistant</Link></li>
              <li><Link to="/dashboard">Live Requests</Link></li>
              <li><Link to="/document">Document Vision</Link></li>
              <li><Link to="/camps">Blood Camp Organizer</Link></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-3">Proof of Work</p>
            <ul className="space-y-2 text-sm text-[color:var(--text-secondary)]">
              <li><Link to="/architecture">Architecture</Link></li>
              <li>Gemma 4 · Multilingual + Vision</li>
              <li className="font-mono text-xs text-[color:var(--text-tertiary)]">© {new Date().getFullYear()} RaktaSetu.AI</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
