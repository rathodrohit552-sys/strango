import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../app/api";
import { communities, discussions } from "../app/data";
import { Avatar, CommunityMark, Icon, Logo, ThemeToggle } from "./UI";

const navItems = [
  ["/dashboard", "home", "Home"],
  ["/communities", "users", "Communities"],
  ["/discussions", "discuss", "Discussions"],
  ["/live", "live", "Live"],
  ["/rooms", "rooms", "Rooms"],
  ["/messages", "message", "Messages"],
  ["/notifications", "bell", "Notifications"],
  ["/sparks", "spark", "Sparks"],
  ["/profile", "profile", "Profile"]
];

export function PublicHeader({ onAuth }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="public-header">
      <Logo />
      <nav className={open ? "is-open" : ""}>
        <Link to="/communities">Communities</Link>
        <Link to="/discussions">Discussions</Link>
        <Link to="/live">Live</Link>
        <Link to="/rooms">Rooms</Link>
        <ThemeToggle compact />
        <button className="button button-ghost" type="button" onClick={onAuth}>Sign in</button>
        <Link className="button button-primary" to="/chat">Start chatting</Link>
      </nav>
      <div className="public-mobile-actions">
        <ThemeToggle compact />
        <button className="mobile-menu-button" type="button" aria-label="Toggle menu" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
      </div>
    </header>
  );
}

function RightRail() {
  const activePeople = [
    ["MS", "Mira S.", "Viewing AI careers", "purple"],
    ["AK", "Aarav K.", "Typing in Finance Circle", "green"],
    ["NP", "Naina P.", "Joined Student Desk", "gold"]
  ];
  return (
    <aside className="right-rail">
      <section className="rail-spotlight">
        <div className="rail-spotlight-top"><span className="rail-live-dot" /><strong>Platform live</strong><span>Now</span></div>
        <b>1,284</b>
        <p>people online across 38 active conversations</p>
        <div className="rail-avatar-stack">{activePeople.map(([label, name, , tone]) => <Avatar key={name} label={label} small tone={tone} />)}<span>+1.2k</span></div>
        <Link to="/live">Explore live activity <Icon name="arrow" size={15} /></Link>
      </section>
      <section className="rail-block">
        <div className="rail-title"><h3>Trending communities</h3><Link to="/communities">See all</Link></div>
        {communities.slice(0, 4).map((community, index) => (
          <Link className="rail-community" to={`/communities/${community.slug}`} key={community.slug}>
            <span className="rail-rank">{String(index + 1).padStart(2, "0")}</span>
            <CommunityMark community={community} size="small" showStatus />
            <span><strong>{community.name}</strong><small>{community.members} members</small><em><i /> {community.online} online</em></span>
            <Icon name="arrow" size={15} />
          </Link>
        ))}
      </section>
      <section className="rail-block">
        <div className="rail-title"><h3>Live discussions</h3><span className="rail-title-live"><i /> Updating</span></div>
        {discussions.slice(0, 3).map((item) => {
          const community = communities.find((entry) => entry.slug === item.communitySlug);
          return <Link className="rail-suggestion" to={`/discussions/${item.id}`} key={item.id}><span style={{ "--suggestion-accent": community?.accent }}>{item.tag}</span><strong>{item.title}</strong><small><Icon name="eye" size={13} /> {item.viewers} viewing <i /> {item.comments} messages</small></Link>;
        })}
      </section>
      <section className="rail-block rail-active-block">
        <div className="rail-title"><h3>Active people</h3><span className="rail-title-live"><i /> Live</span></div>
        {activePeople.map(([label, name, activity, tone]) => (
          <Link className="rail-active-person" to="/messages" key={name}>
            <span className="presence"><Avatar label={label} small tone={tone} /></span>
            <span><strong>{name}</strong><small>{activity}</small></span>
          </Link>
        ))}
      </section>
      <nav className="rail-footer"><Link to="/about">About</Link><Link to="/privacy-policy">Privacy</Link><Link to="/terms-of-service">Terms</Link><Link to="/contact">Contact</Link></nav>
    </aside>
  );
}

export function AppShell({ children, onAuth }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [session, setSession] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMobileNav(false), [location.pathname]);
  useEffect(() => {
    let timer;
    api("/api/session").then((data) => {
      const user = data?.user;
      setSession(user || null);
      if (user?.mode === "ghost" && user.ghostExpiresAt) {
        const update = () => {
          const seconds = Math.max(0, Math.ceil((new Date(user.ghostExpiresAt).getTime() - Date.now()) / 1000));
          setRemaining(seconds);
          if (seconds === 0) onAuth();
        };
        update();
        timer = window.setInterval(update, 1000);
      }
    });
    return () => window.clearInterval(timer);
  }, [onAuth]);

  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/discussions?q=${encodeURIComponent(query)}` : "/discussions");
  }

  const identity = session?.profile?.display_name || (session?.mode === "profile" ? "Strango Member" : "Ghost 148");

  return (
    <div className="platform-shell">
      <header className="app-topbar">
        <button type="button" className="mobile-menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Icon name="menu" /></button>
        <Logo />
        <form className="global-search" onSubmit={submitSearch}>
          <Icon name="search" size={18} />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search discussions and communities" aria-label="Search Strango" />
          <kbd>/</kbd>
        </form>
        <div className="topbar-actions">
          <ThemeToggle compact />
          <Link to="/notifications" aria-label="Notifications"><Icon name="bell" /><i /></Link>
          <button type="button" onClick={onAuth} aria-label="Open sign in"><Avatar label={identity} small /></button>
        </div>
      </header>
      <div className="app-frame">
        <aside className={`left-nav${mobileNav ? " is-open" : ""}`}>
          <div className="mobile-nav-head"><Logo /><button type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><Icon name="close" /></button></div>
          <nav>
            {navItems.map(([to, icon, label]) => (
              <NavLink to={to} key={to} className={({ isActive }) => isActive ? "active" : ""}>
                <Icon name={icon} /><span>{label}</span>{label === "Notifications" && <b>3</b>}
              </NavLink>
            ))}
          </nav>
          <button className="button button-primary compose-button" type="button" onClick={() => navigate("/discussions?compose=1")}><Icon name="plus" size={18} /> Create discussion</button>
          <button className="identity-card" type="button" onClick={onAuth}>
            <Avatar label={identity} small />
            <span><strong>{identity}</strong><small>{session?.mode === "profile" ? "Profile mode" : "Incognito mode"}</small></span>
            <Icon name="more" />
          </button>
        </aside>
        {mobileNav && <button className="nav-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
        <main className="feed-column">
          {session?.mode === "ghost" && remaining !== null && (
            <div className="ghost-bar">
              <span><strong>Ghost Mode</strong> · {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")} remaining</span>
              <button type="button" onClick={onAuth}>Participate</button>
            </div>
          )}
          <div className="page-transition" key={location.pathname}>{children}</div>
        </main>
        <RightRail />
      </div>
      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        {navItems.slice(0, 5).map(([to, icon, label]) => <NavLink to={to} key={to}><Icon name={icon} /><span>{label}</span></NavLink>)}
      </nav>
    </div>
  );
}

export function AuthModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [message, setMessage] = useState("");
  if (!open) return null;

  async function continueWithEmail(event) {
    event.preventDefault();
    setMessage("");
    const result = await api("/api/auth/email", {
      method: "POST",
      body: JSON.stringify({ email, code: awaitingCode ? code : undefined })
    });
    if (result?.challenge) {
      setAwaitingCode(true);
      setMessage(result.devCode ? `Development code: ${result.devCode}` : "Check your email for a 6-digit login code.");
    } else if (result?.ok) {
      window.location.href = "/dashboard";
    } else {
      setMessage(awaitingCode ? "That code is invalid or expired." : "Email access is unavailable right now.");
    }
  }

  async function useIncognito() {
    const result = await api("/api/auth/anonymous", { method: "POST", body: JSON.stringify({ mode: "incognito" }) });
    if (result?.ok) window.location.href = "/dashboard";
    else setMessage("Incognito access is unavailable right now.");
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-scrim" type="button" aria-label="Close" onClick={onClose} />
      <section className="auth-modal">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close sign in"><Icon name="close" /></button>
        <Logo />
        <p className="eyebrow">Observe. Talk. Connect.</p>
        <h2 id="auth-title">Choose how you show up</h2>
        <p>Participate privately or build a public profile. You stay in control of your identity.</p>
        <button className="auth-choice" type="button" onClick={useIncognito}><span className="choice-icon">G</span><span><strong>Continue incognito</strong><small>Participate anonymously and keep earning Sparks.</small></span><Icon name="arrow" /></button>
        <a className="auth-choice" href="/auth/google"><span className="choice-icon google-icon">G</span><span><strong>Continue with Google</strong><small>One-click access with a public profile.</small></span><Icon name="arrow" /></a>
        <div className="auth-divider"><span>or use email</span></div>
        <form onSubmit={continueWithEmail}>
          <input
            type={awaitingCode ? "text" : "email"}
            value={awaitingCode ? code : email}
            onChange={(event) => awaitingCode ? setCode(event.target.value.replace(/\D/g, "").slice(0, 6)) : setEmail(event.target.value)}
            placeholder={awaitingCode ? "6-digit code" : "you@example.com"}
            inputMode={awaitingCode ? "numeric" : "email"}
            required
          />
          <button className="button button-primary" type="submit">{awaitingCode ? "Verify" : "Continue"}</button>
        </form>
        {awaitingCode && <button className="text-button auth-back" type="button" onClick={() => { setAwaitingCode(false); setCode(""); setMessage(""); }}>Use a different email</button>}
        {message && <small className="form-message">{message}</small>}
        <small>By continuing, you agree to the <Link to="/terms-of-service">Terms</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.</small>
      </section>
    </div>
  );
}
