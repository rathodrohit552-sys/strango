import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../app/api";
import { communities } from "../app/data";
import { getShellIdentityLabel, rememberIdentityPreference, shouldAutoOpenIdentityPrompt } from "../app/identity";
import { Avatar, CommunityMark, Icon, Logo, ThemeToggle } from "./UI";

const navItems = [
  ["/dashboard", "home", "Home"],
  ["/communities", "users", "Communities"],
  ["/discussions/new", "plus", "Create"],
  ["/messages", "message", "Messages"],
  ["/profile", "profile", "Profile"]
];

const mobileNavItems = navItems;

const secondaryNavItems = [
  ["/discussions", "discuss", "Discussions"],
  ["/live", "live", "Live"],
  ["/rooms", "rooms", "Rooms"],
  ["/notifications", "bell", "Notifications"],
  ["/sparks", "spark", "Sparks"],
  ["/pluto", "spark", "Pluto"]
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
  const [communityItems, setCommunityItems] = useState(communities);
  const [discussionItems, setDiscussionItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    api("/api/communities").then((data) => {
      const remote = data?.communities?.length ? data.communities : communities;
      setCommunityItems(remote.map((community, index) => {
        const design = communities.find((item) => item.slug === community.slug) || communities[index % communities.length] || {};
        return {
          ...design,
          ...community,
          category: community.category || design.category || community.shortName || "Community",
          members: Number(community.memberCount || community.members || 0),
          online: Number(community.onlineCount || community.online || 0),
          topics: Number(community.topicCount || community.topics || 0)
        };
      }));
    });
    api("/api/discussions").then((data) => setDiscussionItems(data?.discussions || []));
  }, []);

  useEffect(() => {
    if (paused || communityItems.length <= 5) return undefined;
    const timer = window.setInterval(() => setOffset((value) => (value + 1) % communityItems.length), 5200);
    return () => window.clearInterval(timer);
  }, [paused, communityItems.length]);

  const totalMembers = communityItems.reduce((total, item) => total + Number(item.members || item.memberCount || 0), 0);
  const onlineTotal = communityItems.reduce((total, item) => total + Number(item.online || item.onlineCount || 0), 0);
  const visibleCommunities = communityItems.length
    ? Array.from({ length: Math.min(5, communityItems.length) }, (_, index) => communityItems[(offset + index) % communityItems.length])
    : [];

  function rotate(direction) {
    if (!communityItems.length) return;
    setOffset((value) => (value + direction + communityItems.length) % communityItems.length);
  }

  return (
    <aside className="right-rail" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <section className="rail-pulse-card">
        <div className="rail-spotlight-top"><strong>Community pulse</strong><span>Live</span></div>
        <div className="rail-pulse-grid">
          <span><b>{communityItems.length}</b><small>communities</small></span>
          <span><b>{totalMembers}</b><small>members</small></span>
          <span><b>{onlineTotal}</b><small>online now</small></span>
        </div>
        <p>{onlineTotal > 0 ? "People are active across joined spaces." : "No live community activity yet. Join a space to start the pulse."}</p>
      </section>
      <section className="rail-block rail-community-rotator">
        <div className="rail-title">
          <h3>Discover communities</h3>
          <span className="rail-rotate-controls">
            <button type="button" aria-label="Previous communities" onClick={() => rotate(-1)}><Icon name="chevron" size={14} /></button>
            <button type="button" aria-label="Next communities" onClick={() => rotate(1)}><Icon name="chevron" size={14} /></button>
          </span>
        </div>
        {visibleCommunities.map((community, index) => (
          <Link className="rail-community" to={`/communities/${community.slug}`} key={`${community.slug}-${offset}`}>
            <span className="rail-rank">{String(((offset + index) % communityItems.length) + 1).padStart(2, "0")}</span>
            <CommunityMark community={community} size="small" showStatus={community.online > 0} />
            <span><strong>{community.name}</strong><small>{community.members || "Be first"} {community.members === 1 ? "member" : community.members ? "members" : ""}</small>{community.online > 0 && <em><i /> {community.online} online</em>}</span>
            <Icon name="arrow" size={15} />
          </Link>
        ))}
      </section>
      <section className="rail-block rail-discussion-teaser">
        <div className="rail-title"><h3>Members-only discussions</h3><Link to="/communities">Join</Link></div>
        {discussionItems.length ? discussionItems.slice(0, 3).map((item) => {
          const community = communities.find((entry) => entry.slug === item.communitySlug);
          return <Link className={`rail-suggestion${item.locked ? " is-locked" : ""}`} to={item.locked ? `/communities/${item.communitySlug}` : `/discussions/${item.slug || item.id}`} key={item.id}><span style={{ "--suggestion-accent": community?.accent }}>{item.community}</span><strong>{item.title}</strong><small>{item.locked ? "Join to view" : `${item.comments} ${item.comments === 1 ? "reply" : "replies"}`}</small></Link>;
        }) : <p className="quiet-state">Join communities to unlock member discussions.</p>}
      </section>
      <section className="rail-block"><div className="rail-title"><h3>STRANGO PLUTO</h3><Link to="/pluto">Coming soon</Link></div><p className="quiet-state">Premium customization without changing the core social experience.</p></section>
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
          if (seconds === 0 && shouldAutoOpenIdentityPrompt(user)) onAuth({ auto: true, user });
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

  const identity = getShellIdentityLabel(session);
  const identityMode = session?.mode === "profile" ? "Profile mode" : session?.mode === "ghost" ? "Ghost Mode" : "Incognito mode";

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
                <Icon name={icon} /><span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="secondary-nav-group" aria-label="Secondary navigation">
            {secondaryNavItems.map(([to, icon, label]) => (
              <NavLink to={to} key={to} className={({ isActive }) => isActive ? "active" : ""}>
                <Icon name={icon} /><span>{label}</span>{label === "Notifications" && <b>3</b>}
              </NavLink>
            ))}
          </div>
          <button className="identity-card" type="button" onClick={onAuth}>
            <Avatar label={identity} small />
            <span><strong>{identity}</strong><small>{identityMode}</small></span>
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
        {mobileNavItems.map(([to, icon, label]) => <NavLink to={to} key={to}><Icon name={icon} /><span>{label}</span></NavLink>)}
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
      rememberIdentityPreference("email");
      window.location.href = "/dashboard";
    } else {
      setMessage(awaitingCode ? "That code is invalid or expired." : "Email access is unavailable right now.");
    }
  }

  async function useIncognito() {
    const result = await api("/api/auth/anonymous", { method: "POST", body: JSON.stringify({ mode: "incognito" }) });
    if (result?.ok) {
      rememberIdentityPreference("incognito");
      window.location.href = "/dashboard";
    }
    else setMessage("Incognito access is unavailable right now.");
  }

  async function useGhost() {
    const result = await api("/api/auth/anonymous", { method: "POST", body: JSON.stringify({ mode: "ghost" }) });
    if (result?.ok) {
      rememberIdentityPreference("ghost");
      window.location.href = "/communities";
    }
    else setMessage("Ghost Mode is unavailable right now.");
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
        <button className="auth-choice" type="button" onClick={useGhost}><span className="choice-icon">O</span><span><strong>Browse in Ghost Mode</strong><small>Explore first. Participation stays locked until you choose an identity.</small></span><Icon name="arrow" /></button>
        <button className="auth-choice" type="button" onClick={useIncognito}><span className="choice-icon">G</span><span><strong>Continue incognito</strong><small>Participate anonymously and keep earning Sparks.</small></span><Icon name="arrow" /></button>
        <a className="auth-choice" href="/auth/google" onClick={() => rememberIdentityPreference("google")}><span className="choice-icon google-icon">G</span><span><strong>Continue with Google</strong><small>One-click access with a public profile.</small></span><Icon name="arrow" /></a>
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
