import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, mergeCommunities } from "../app/api";
import { communities as fallbackCommunities, communityCategories, discussions, icebreakers, liveConversations, messages, notifications, rooms } from "../app/data";
import { getDiscussionIdentity, typingSummary } from "../app/identity";
import { AdSlot, Avatar, CommunityCard, CommunityMark, DiscussionCard, EmptyState, Icon, LiveCard, Logo, SectionHeading, ThemeToggle } from "../components/UI";

export function PageIntro({ eyebrow, title, copy, action }) {
  return (
    <div className="section-heading page-intro">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {copy && <p>{copy}</p>}
      </div>
      {action}
    </div>
  );
}

function InstagramConnectCard() {
  return (
    <section className="instagram-connect-card">
      <span>@</span>
      <div><p className="eyebrow">Instagram</p><h2>Follow Strango on Instagram</h2><p>@strangochat</p></div>
      <a className="button button-secondary button-small" href="https://www.instagram.com/strangochat/" target="_blank" rel="noreferrer">Follow</a>
    </section>
  );
}

function Modal({ title, copy, onClose, children }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button className="modal-scrim" type="button" aria-label="Close dialog" onClick={onClose} />
      <section className="form-modal">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
        <p className="eyebrow">Create on Strango</p>
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
        {children}
      </section>
    </div>
  );
}

function DiscussionComposer({ open, onClose, onCreated, onAuth }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communitySlug, setCommunitySlug] = useState("ai");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return <Navigate to="/discussions/new" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = await api("/api/posts", {
      method: "POST",
      body: JSON.stringify({ title, content, communitySlug })
    });
    setBusy(false);
    if (!result?.post) {
      setMessage("Sign in or continue incognito to publish this discussion.");
      onAuth?.();
      return;
    }
    const community = fallbackCommunities.find((item) => item.slug === communitySlug);
    onCreated?.({
      id: result.post.id,
      community: community?.name || "Strango",
      author: "You",
      time: "now",
      title,
      body: content,
      votes: 0,
      comments: 0,
      tag: community?.category || "Discussion"
    });
    onClose();
  }

  return (
    <Modal title="Start a discussion" copy="Ask a focused question and give people enough context to respond thoughtfully." onClose={onClose}>
      <form className="stacked-form" onSubmit={submit}>
        <label>Community<select value={communitySlug} onChange={(event) => setCommunitySlug(event.target.value)}>{fallbackCommunities.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></label>
        <label>Question<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="What do you want to understand?" required /></label>
        <label>Context<textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} placeholder="Add details, constraints, or what you have already tried." required /></label>
        {message && <p className="form-error">{message}</p>}
        <div className="form-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Publishing..." : "Publish discussion"}</button></div>
      </form>
    </Modal>
  );
}

export function DashboardPage({ onAuth }) {
  const navigate = useNavigate();
  const [feed, setFeed] = useState("For you");
  const [interest, setInterest] = useState("All");
  const [feedItems, setFeedItems] = useState([]);
  const [liveItems, setLiveItems] = useState([]);
  const [identity, setIdentity] = useState("Member");
  useEffect(() => {
    api("/api/discussions").then((data) => setFeedItems(data?.discussions || []));
    api("/api/live").then((data) => setLiveItems((data?.conversations || []).map((item) => ({ ...item, people: item.participantCount || 0, accent: "#14b8a6", speakers: [] }))));
    api("/api/session").then((data) => setIdentity(data?.user?.profile?.display_name || `Stranger #${data?.user?.strangerNumber || ""}`.trim()));
  }, []);
  const visible = feedItems.filter((item) => interest === "All" || item.tag === interest || item.community?.includes(interest));
  const ordered = feed === "Newest" ? [...visible].reverse() : feed === "Following" ? visible.filter((_, index) => index % 2 === 0) : visible;

  return (
    <div className="app-page">
      <PageIntro eyebrow="Your feed" title={`Welcome, ${identity}.`} copy="Your feed grows from communities you join and conversations you contribute to." action={<button className="button button-primary" type="button" onClick={() => navigate("/discussions/new")}><Icon name="plus" size={17} /> Create discussion</button>} />
      <section className="interest-strip"><span>Explore:</span>{["All", "Finance", "Technology", "Gaming", "Students"].map((item) => <button className={interest === item ? "active" : ""} type="button" key={item} onClick={() => setInterest(item)}>{item}</button>)}</section>
      <div className="feed-tabs">{["For you", "Following", "Newest"].map((item) => <button className={feed === item ? "active" : ""} type="button" key={item} onClick={() => setFeed(item)}>{item}</button>)}</div>
      <div className="discussion-list feed-list">{ordered.length ? ordered.map((item) => <DiscussionCard discussion={item} key={item.id} />) : <EmptyState title="Your feed is ready" copy="Join a community or start the first discussion to shape what appears here." action={<Link className="button button-secondary" to="/communities">Explore communities</Link>} />}</div>
      <div className="feed-inline-block">
        <div className="inline-block-head"><h3>Live conversations</h3><Link to="/live">See all</Link></div>
        <div className="mini-live-grid">{liveItems.length ? liveItems.slice(0, 2).map((item) => <LiveCard conversation={item} key={item.id} />) : <p className="quiet-state">No live conversations yet.</p>}</div>
      </div>
      <InstagramConnectCard />
      <AdSlot compact />
    </div>
  );
}

export function CommunitiesPage({ onAuth }) {
  const [items, setItems] = useState(fallbackCommunities);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [joined, setJoined] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "Technology", rules: "", bannerUrl: "", logoUrl: "" });
  const [createMessage, setCreateMessage] = useState("");
  const categoryRail = useRef(null);

  useEffect(() => {
    api("/api/communities").then((data) => setItems(mergeCommunities(data?.communities, fallbackCommunities)));
  }, []);

  const categories = ["All", ...communityCategories];
  const filtered = useMemo(() => items.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const text = `${item.name} ${item.description} ${item.category}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  }), [items, query, category]);

  async function joinCommunity(community) {
    const result = await api(`/api/communities/${community.slug}/join`, { method: "POST", body: "{}" });
    if (!result?.community) {
      onAuth?.();
      return false;
    }
    setJoined((current) => [...new Set([...current, community.slug])]);
    return true;
  }

  async function createCommunity(event) {
    event.preventDefault();
    setCreateMessage("");
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const result = await api("/api/communities", {
      method: "POST",
      body: JSON.stringify({ ...form, rules: form.rules.split("\n").map((rule) => rule.trim()).filter(Boolean), slug, icon: form.name.slice(0, 2).toUpperCase() })
    });
    if (!result?.community) {
      setCreateMessage("Continue incognito or sign in to create a community.");
      onAuth?.();
      return;
    }
    const created = mergeCommunities([result.community], fallbackCommunities)[0];
    setItems((current) => [created, ...current]);
    setCreateOpen(false);
    setForm({ name: "", description: "", category: "Technology", rules: "", bannerUrl: "", logoUrl: "" });
  }

  function scrollCategoryRail(direction) {
    const rail = categoryRail.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(220, rail.clientWidth * 0.72), behavior: "smooth" });
  }

  function handleCategoryWheel(event) {
    const rail = categoryRail.current;
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    rail.scrollLeft += delta;
    if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) event.preventDefault();
  }

  const renderGrid = (list, variant) => <div className={`community-grid ${variant === "featured" ? "featured-community-grid" : ""}`}>{list.map((community) => <CommunityCard community={community} variant={variant} joined={joined.includes(community.slug)} key={`${variant}-${community.slug}`} onJoin={joinCommunity} />)}</div>;

  return (
    <div className="app-page wide-page">
      <PageIntro eyebrow="Community discovery" title="Find your corner of Strango." copy="Focused spaces with real momentum, useful context, and people who care about the same things." action={<button className="button button-primary" type="button" onClick={() => setCreateOpen(true)}><Icon name="plus" size={17} /> Create community</button>} />
      <div className="discovery-toolbar">
        <label className="page-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic or community" /></label>
        <div className="category-scroll-shell">
          <button className="category-scroll-button" type="button" aria-label="Scroll categories left" onClick={() => scrollCategoryRail(-1)}><Icon name="chevron" size={16} /></button>
          <div className="category-pills category-pills-scroll" ref={categoryRail} onWheel={handleCategoryWheel}>
            {categories.map((item) => <button className={category === item ? "active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <button className="category-scroll-button category-scroll-button-next" type="button" aria-label="Scroll categories right" onClick={() => scrollCategoryRail(1)}><Icon name="chevron" size={16} /></button>
        </div>
      </div>
      {!filtered.length ? <EmptyState title="No communities found" copy="Try a broader topic or explore every category." action={<button className="button button-secondary" type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button>} /> : query || category !== "All" ? (
        <section className="filtered-community-results">
          <SectionHeading eyebrow="Filtered discovery" title={`${filtered.length} ${filtered.length === 1 ? "community" : "communities"} found`} copy="Results matching your current topic and category filters." />
          {renderGrid(filtered, "results")}
        </section>
      ) : (
        <div className="community-sections">
          <section><SectionHeading eyebrow="Community directory" title="Spaces built around shared interests" copy="Membership and presence values below come directly from Strango activity." />{renderGrid(filtered, "featured")}</section>
        </div>
      )}
      {createOpen && <Modal title="Create a community" copy="Give the community a clear purpose. You can add channels after it is created." onClose={() => setCreateOpen(false)}>
        <form className="stacked-form" onSubmit={createCommunity}>
          <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Indie Builders" required /></label>
          <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What will people learn, share, or do here?" required /></label>
          <label>Rules<textarea value={form.rules} onChange={(event) => setForm({ ...form, rules: event.target.value })} placeholder={"One rule per line\nBe constructive and stay on topic."} required /></label>
          <label>Banner URL<input type="url" value={form.bannerUrl} onChange={(event) => setForm({ ...form, bannerUrl: event.target.value })} placeholder="https://..." /></label>
          <label>Logo URL<input type="url" value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} placeholder="https://..." /></label>
          {createMessage && <p className="form-error">{createMessage}</p>}
          <div className="form-actions"><button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button button-primary" type="submit">Create community</button></div>
        </form>
      </Modal>}
    </div>
  );
}

const calculatorDefaults = {
  sipMonthly: "500",
  sipRate: "12",
  sipYears: "10",
  loanAmount: "25000",
  loanRate: "8",
  loanYears: "5",
  compoundPrincipal: "10000",
  compoundRate: "7",
  compoundYears: "8",
  compoundTimes: "12",
  simplePrincipal: "5000",
  simpleRate: "6",
  simpleYears: "3",
  profitCost: "100",
  profitSell: "125",
  profitQuantity: "10"
};

function readPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatMoney(value) {
  const number = Number.isFinite(value) ? value : 0;
  const sign = number < 0 ? "-" : "";
  return `${sign}$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.abs(number))}`;
}

function formatPercent(value) {
  return `${Number.isFinite(value) ? value.toFixed(2) : "0.00"}%`;
}

function CalculatorInput({ label, value, onChange, suffix }) {
  return (
    <label>
      <span>{label}</span>
      <div className="calculator-input">
        <input type="number" min="0" step="any" value={value} onChange={(event) => onChange(event.target.value)} />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}

function FinanceCalculators() {
  const [values, setValues] = useState(calculatorDefaults);
  const update = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));

  const sipMonthly = readPositiveNumber(values.sipMonthly);
  const sipMonths = Math.round(readPositiveNumber(values.sipYears) * 12);
  const sipRate = readPositiveNumber(values.sipRate) / 100 / 12;
  const sipInvested = sipMonthly * sipMonths;
  const sipValue = sipMonths > 0 ? (sipRate > 0 ? sipMonthly * ((Math.pow(1 + sipRate, sipMonths) - 1) / sipRate) : sipInvested) : 0;

  const loanAmount = readPositiveNumber(values.loanAmount);
  const loanMonths = Math.round(readPositiveNumber(values.loanYears) * 12);
  const loanRate = readPositiveNumber(values.loanRate) / 100 / 12;
  const emi = loanMonths > 0 ? (loanRate > 0 ? loanAmount * loanRate * Math.pow(1 + loanRate, loanMonths) / (Math.pow(1 + loanRate, loanMonths) - 1) : loanAmount / loanMonths) : 0;

  const compoundPrincipal = readPositiveNumber(values.compoundPrincipal);
  const compoundRate = readPositiveNumber(values.compoundRate) / 100;
  const compoundYears = readPositiveNumber(values.compoundYears);
  const compoundTimes = Math.max(1, Math.round(readPositiveNumber(values.compoundTimes)));
  const compoundValue = compoundPrincipal * Math.pow(1 + compoundRate / compoundTimes, compoundTimes * compoundYears);

  const simplePrincipal = readPositiveNumber(values.simplePrincipal);
  const simpleInterest = simplePrincipal * readPositiveNumber(values.simpleRate) * readPositiveNumber(values.simpleYears) / 100;

  const profitCost = readPositiveNumber(values.profitCost) * readPositiveNumber(values.profitQuantity);
  const profitSell = readPositiveNumber(values.profitSell) * readPositiveNumber(values.profitQuantity);
  const profit = profitSell - profitCost;
  const profitPercent = profitCost > 0 ? profit / profitCost * 100 : 0;

  return (
    <section className="finance-calculators">
      <SectionHeading eyebrow="Finance Tools" title="Calculators for quick money math" copy="Run common investing, loan, and trade checks without leaving the Finance community." />
      <div className="calculator-grid">
        <article className="calculator-card">
          <div className="calculator-card-head"><span>SIP</span><div><h3>SIP calculator</h3><p>Monthly investing projection.</p></div></div>
          <div className="calculator-fields">
            <CalculatorInput label="Monthly investment" value={values.sipMonthly} onChange={update("sipMonthly")} suffix="$" />
            <CalculatorInput label="Expected return" value={values.sipRate} onChange={update("sipRate")} suffix="%" />
            <CalculatorInput label="Years" value={values.sipYears} onChange={update("sipYears")} />
          </div>
          <div className="calculator-result"><span>Future value</span><strong>{formatMoney(sipValue)}</strong><small>Invested {formatMoney(sipInvested)} - gains {formatMoney(sipValue - sipInvested)}</small></div>
        </article>

        <article className="calculator-card">
          <div className="calculator-card-head"><span>EMI</span><div><h3>EMI / loan calculator</h3><p>Monthly payment estimate.</p></div></div>
          <div className="calculator-fields">
            <CalculatorInput label="Loan amount" value={values.loanAmount} onChange={update("loanAmount")} suffix="$" />
            <CalculatorInput label="Interest rate" value={values.loanRate} onChange={update("loanRate")} suffix="%" />
            <CalculatorInput label="Years" value={values.loanYears} onChange={update("loanYears")} />
          </div>
          <div className="calculator-result"><span>Monthly EMI</span><strong>{formatMoney(emi)}</strong><small>Total payment {formatMoney(emi * loanMonths)} - interest {formatMoney(emi * loanMonths - loanAmount)}</small></div>
        </article>

        <article className="calculator-card">
          <div className="calculator-card-head"><span>CI</span><div><h3>Compound interest</h3><p>Compounded growth over time.</p></div></div>
          <div className="calculator-fields">
            <CalculatorInput label="Principal" value={values.compoundPrincipal} onChange={update("compoundPrincipal")} suffix="$" />
            <CalculatorInput label="Annual rate" value={values.compoundRate} onChange={update("compoundRate")} suffix="%" />
            <CalculatorInput label="Years" value={values.compoundYears} onChange={update("compoundYears")} />
            <CalculatorInput label="Compounds per year" value={values.compoundTimes} onChange={update("compoundTimes")} />
          </div>
          <div className="calculator-result"><span>Maturity value</span><strong>{formatMoney(compoundValue)}</strong><small>Interest earned {formatMoney(compoundValue - compoundPrincipal)}</small></div>
        </article>

        <article className="calculator-card">
          <div className="calculator-card-head"><span>SI</span><div><h3>Simple interest</h3><p>Flat interest calculation.</p></div></div>
          <div className="calculator-fields">
            <CalculatorInput label="Principal" value={values.simplePrincipal} onChange={update("simplePrincipal")} suffix="$" />
            <CalculatorInput label="Annual rate" value={values.simpleRate} onChange={update("simpleRate")} suffix="%" />
            <CalculatorInput label="Years" value={values.simpleYears} onChange={update("simpleYears")} />
          </div>
          <div className="calculator-result"><span>Total amount</span><strong>{formatMoney(simplePrincipal + simpleInterest)}</strong><small>Interest earned {formatMoney(simpleInterest)}</small></div>
        </article>

        <article className="calculator-card">
          <div className="calculator-card-head"><span>P/L</span><div><h3>Profit / loss</h3><p>Position return and margin.</p></div></div>
          <div className="calculator-fields">
            <CalculatorInput label="Cost price" value={values.profitCost} onChange={update("profitCost")} suffix="$" />
            <CalculatorInput label="Selling price" value={values.profitSell} onChange={update("profitSell")} suffix="$" />
            <CalculatorInput label="Quantity" value={values.profitQuantity} onChange={update("profitQuantity")} />
          </div>
          <div className={`calculator-result ${profit >= 0 ? "is-profit" : "is-loss"}`}><span>{profit >= 0 ? "Profit" : "Loss"}</span><strong>{formatMoney(profit)}</strong><small>Return {formatPercent(profitPercent)}</small></div>
        </article>
      </div>
    </section>
  );
}

export function CommunityPage({ onAuth }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const base = fallbackCommunities.find((community) => community.slug === slug) || fallbackCommunities[0];
  const [community, setCommunity] = useState(base);
  const [tab, setTab] = useState("Posts");
  const [joined, setJoined] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [localPosts, setLocalPosts] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [settings, setSettings] = useState({ name: "", description: "", category: "", rules: "", bannerUrl: "", logoUrl: "" });
  const [moderatorId, setModeratorId] = useState("");

  useEffect(() => {
    api(`/api/communities/${slug}`).then((data) => {
      if (data?.community) {
        const next = mergeCommunities([data.community], [base])[0];
        setCommunity(next);
        setJoined(Boolean(next.viewerRole));
        setSettings({ name: next.name || "", description: next.description || "", category: next.category || "", rules: (next.rules || []).join("\n"), bannerUrl: next.bannerUrl || "", logoUrl: next.logoUrl || "" });
      }
    });
    api(`/api/communities/${slug}/posts`).then((data) => setLocalPosts((data?.posts || []).map((post) => ({
      id: post.id, community: base.name, communitySlug: slug, author: post.author,
      time: new Date(post.time).toLocaleDateString(), title: post.title, body: post.preview,
      votes: post.likes || 0, comments: post.comments || 0, viewers: 0, tag: base.category
    }))));
  }, [slug]);

  async function join() {
    const result = await api(`/api/communities/${community.slug}/join`, { method: "POST", body: "{}" });
    if (!result?.community) return onAuth?.();
    setJoined(true);
    api(`/api/communities/${community.slug}/posts`).then((data) => setLocalPosts((data?.posts || []).map((post) => ({
      id: post.id, community: community.name, communitySlug: community.slug, author: post.author,
      time: new Date(post.time).toLocaleDateString(), title: post.title, body: post.preview,
      votes: post.likes || 0, comments: post.comments || 0, viewers: 0, tag: community.category
    }))));
  }

  async function saveSettings(event) {
    event.preventDefault();
    const result = await api(`/api/communities/${community.slug}`, { method: "PATCH", body: JSON.stringify({ ...settings, rules: settings.rules.split("\n").map((rule) => rule.trim()).filter(Boolean) }) });
    if (result?.community) {
      setCommunity((current) => ({ ...current, ...result.community }));
      setManageOpen(false);
    }
  }

  async function addModerator(event) {
    event.preventDefault();
    const result = await api(`/api/communities/${community.slug}/moderators`, { method: "POST", body: JSON.stringify({ userId: moderatorId.trim() }) });
    if (result?.ok) {
      setModeratorId("");
      const data = await api(`/api/communities/${community.slug}`);
      if (data?.community) setCommunity(mergeCommunities([data.community], [base])[0]);
    }
  }

  async function deleteCommunity() {
    if (!window.confirm(`Delete ${community.name}? This cannot be undone.`)) return;
    const result = await api(`/api/communities/${community.slug}`, { method: "DELETE" });
    if (result?.ok) navigate("/communities");
  }

  async function moderate(action, target) {
    const reason = window.prompt("Add a short moderation reason:") || "";
    const result = await api(`/api/communities/${community.slug}/moderation`, {
      method: "POST",
      body: JSON.stringify({ action, postId: target.postId, userId: target.userId, reason })
    });
    if (result?.action) {
      const data = await api(`/api/communities/${community.slug}`);
      if (data?.community) setCommunity(mergeCommunities([data.community], [base])[0]);
    }
  }

  const memberCount = Number(community.members || 0);
  const onlineCount = Number(community.online || 0);
  const topicCount = Number(community.topics || 0);
  const canManage = community.viewerRole === "Owner";
  const isFinanceCommunity = community.slug === "finance" || community.category === "Finance";

  return (
    <div className="app-page">
      <section className="community-hero community-identity-hero" style={{ "--community-accent": community.accent, "--community-accent-2": community.accent2 }}>
        {community.bannerUrl && <img className="community-banner" src={community.bannerUrl} alt="" />}
        <div className="community-hero-main">
          {community.logoUrl ? <img className="community-logo-image" src={community.logoUrl} alt={`${community.name} logo`} /> : <CommunityMark community={community} size="hero" showStatus={onlineCount > 0} />}
          <div className="community-hero-copy">
            <p className="eyebrow">{community.category || "Strango community"} community</p>
            <h1>{community.name}</h1>
            <p>{community.description}</p>
            <div className="community-trending-topics">{(community.trends || []).map((topic) => <span key={topic}><Icon name="hash" size={14} /> {topic}</span>)}</div>
          </div>
          <div className="community-hero-actions">{canManage && <button className="button button-secondary" type="button" onClick={() => setManageOpen(true)}>Manage</button>}<button className={`button ${joined ? "button-secondary" : "button-primary"}`} type="button" onClick={join} disabled={joined}>{joined ? <><Icon name="check" size={17} /> Joined</> : "Join community"}</button></div>
        </div>
        <div className="community-hero-stats">
          <div><strong>{memberCount || "New"}</strong><span>{memberCount === 1 ? "Member" : "Members"}</span></div>
          <div><strong>{onlineCount || "None"}</strong><span>{onlineCount > 0 && <i />} Online now</span></div>
          <div><strong>{topicCount || "None"}</strong><span>Discussions</span></div>
          <div className="community-hero-people"><span><strong>{community.owner?.displayName || "Community-led"}</strong><small>{community.owner ? "Owner" : "No owner assigned"}</small></span></div>
        </div>
      </section>
      <div className="community-live-strip"><span>{onlineCount > 0 ? <><i /> Live presence</> : "No live activity yet"}</span><strong>{onlineCount > 0 ? `${onlineCount} online` : "Start the first conversation"}</strong><Link to="/live">Open live <Icon name="arrow" size={15} /></Link></div>
      <section className="community-engagement-panel" style={{ "--community-accent": community.accent, "--community-accent-2": community.accent2 }}>
        <article className="today-prompt-card"><p className="eyebrow">Today's prompt</p><h2>{community.trends?.[0] ? `What is your take on ${community.trends[0]}?` : `What should ${community.name} discuss today?`}</h2><button className="button button-secondary button-small" type="button" onClick={() => navigate(`/discussions/new?community=${community.slug}`)}>Start with this</button></article>
        <article><p className="eyebrow">Community pulse</p><div className="community-pulse-grid"><span><strong>{onlineCount}</strong><small>active now</small></span><span><strong>{topicCount}</strong><small>discussions</small></span><span><strong>{memberCount}</strong><small>members</small></span></div></article>
        <article><p className="eyebrow">Hot topics</p><div className="community-hot-topic-row">{(community.trends || [community.category, "Live questions", "Helpful replies"]).slice(0, 4).map((topic) => <span key={topic}><Icon name="hash" size={13} /> {topic}</span>)}</div></article>
      </section>
      {isFinanceCommunity && <FinanceCalculators />}
      <nav className="page-tabs">{["Posts", "Rules", "Moderators", ...(community.viewerPermissions?.includes("view_mod_log") || canManage ? ["Moderation"] : [])].map((item) => <button className={tab === item ? "active" : ""} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      {(tab === "Posts" || tab === "Discussions") && (joined ? <>
        <button className="composer-card" type="button" onClick={() => navigate(`/discussions/new?community=${community.slug}`)}><Avatar label="GS" small /><span>Start a discussion in {community.name}</span><span className="button button-primary"><Icon name="plus" size={16} /> Post</span></button>
        <div className="discussion-list">{localPosts.length ? localPosts.map((item) => <DiscussionCard key={item.id} discussion={{ ...item, community: community.name, communitySlug: community.slug }} />) : <EmptyState title="No discussions yet" copy="This community is ready for its first useful question." action={<button className="button button-primary" type="button" onClick={() => navigate(`/discussions/new?community=${community.slug}`)}>Start discussion</button>} />}</div>
      </> : <section className="community-discussion-gate" style={{ "--community-accent": community.accent, "--community-accent-2": community.accent2 }}><span><Icon name="users" /></span><div><p className="eyebrow">Members-only discussions</p><h2>Join {community.name} to view and participate in discussions.</h2><p>Preview stats are visible before joining: {memberCount} members, {onlineCount} online, and {topicCount} discussion topics.</p></div><button className="button button-primary" type="button" onClick={join}>Join community</button></section>)}
      {tab === "Events" && <div className="event-grid">{[["Community welcome room", "Today · 7:30 PM", "Meet regulars and learn where conversations happen."], ["Weekly topic roundtable", "Saturday · 5:00 PM", "A moderated conversation around the week's biggest question."]].map(([title, time, copy]) => <article key={title}><span><Icon name="live" /></span><div><small>{time}</small><h3>{title}</h3><p>{copy}</p></div><Link className="button button-secondary button-small" to="/live">View live</Link></article>)}</div>}
      {tab === "Rules" && <section className="community-rules-panel"><p className="eyebrow">Community rules</p><h2>Clear expectations make better conversations.</h2><ol>{(community.rules || []).map((rule) => <li key={rule}>{rule}</li>)}</ol></section>}
      {tab === "Moderators" && <div className="member-grid">{community.moderators?.length ? community.moderators.map((person, index) => <article key={person.id}><Avatar label={person.displayName} tone={["green", "blue", "gold"][index % 3]} /><div><strong>{person.displayName}</strong><small>{person.role}</small></div></article>) : <EmptyState title="No moderators yet" copy="The owner can invite trusted members as the community grows." />}</div>}
      {tab === "Moderation" && <section className="moderation-console"><p className="eyebrow">Moderation center</p><h2>Clear reports and transparent actions</h2>{canManage && <form className="moderator-form" onSubmit={addModerator}><input value={moderatorId} onChange={(event) => setModeratorId(event.target.value)} placeholder="Member user ID" required /><button className="button button-secondary" type="submit">Add moderator</button></form>}<div className="moderation-reports"><h3>Open reports</h3>{community.openReports?.length ? community.openReports.map((report) => <article key={report.id}><strong>{report.reason}</strong><small>{report.postId ? `Post ${report.postId}` : "Member report"} · {new Date(report.createdAt).toLocaleString()}</small><div>{report.postId && <><button type="button" onClick={() => moderate("approve_post", report)}>Approve</button><button type="button" onClick={() => moderate("remove_post", report)}>Remove</button></>}{report.userId && <><button type="button" onClick={() => moderate("mute_user", report)}>Mute</button><button type="button" onClick={() => moderate("ban_user", report)}>Ban</button></>}</div></article>) : <p className="quiet-state">No open reports.</p>}</div><div className="moderation-log"><h3>Action log</h3>{community.moderationLog?.length ? community.moderationLog.map((entry) => <article key={entry.id}><strong>{entry.action.replace(/_/g, " ")}</strong><span>{entry.actor}{entry.target ? ` · ${entry.target}` : ""}</span><small>{entry.reason || new Date(entry.createdAt).toLocaleString()}</small></article>) : <p className="quiet-state">No moderation actions yet.</p>}</div></section>}
      <DiscussionComposer open={composerOpen} onClose={() => setComposerOpen(false)} onCreated={() => window.location.reload()} onAuth={onAuth} />
      {manageOpen && <Modal title="Manage community" copy="Update identity and rules. Changes are recorded in the moderation log." onClose={() => setManageOpen(false)}><form className="stacked-form" onSubmit={saveSettings}><label>Name<input value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} required /></label><label>Description<textarea value={settings.description} onChange={(event) => setSettings({ ...settings, description: event.target.value })} required /></label><label>Category<input value={settings.category} onChange={(event) => setSettings({ ...settings, category: event.target.value })} /></label><label>Rules<textarea value={settings.rules} onChange={(event) => setSettings({ ...settings, rules: event.target.value })} /></label><label>Banner URL<input type="url" value={settings.bannerUrl} onChange={(event) => setSettings({ ...settings, bannerUrl: event.target.value })} /></label><label>Logo URL<input type="url" value={settings.logoUrl} onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })} /></label><button className="danger-action" type="button" onClick={deleteCommunity}>Delete community</button><div className="form-actions"><button className="button button-secondary" type="button" onClick={() => setManageOpen(false)}>Cancel</button><button className="button button-primary" type="submit">Save changes</button></div></form></Modal>}
    </div>
  );
}

function makeDraftDiscussionRoom(filter) {
  const community = fallbackCommunities.find((item) => item.category === filter || item.name.includes(filter)) || fallbackCommunities[0];
  const topic = ["Trending", "Newest", "Unanswered"].includes(filter) ? "Strango" : filter;
  return {
    id: `draft-${Date.now()}`,
    title: `${topic} group discussion`,
    body: "A focused room for people joining from the discussion feed.",
    community: community.name,
    communitySlug: community.slug
  };
}

function FeedDiscussionRoom({ room, onClose }) {
  const community = fallbackCommunities.find((entry) => entry.slug === room.communitySlug) || fallbackCommunities[0];
  const [draft, setDraft] = useState("");
  const [messagesInThread, setMessagesInThread] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [typingNames, setTypingNames] = useState([]);
  const [selfIdentity, setSelfIdentity] = useState({ name: "A person", avatar: "AP" });
  const [connected, setConnected] = useState(false);
  const socket = useRef(null);
  const stream = useRef(null);
  const typingTimer = useRef(null);
  const mockTypingTimer = useRef(null);

  useEffect(() => {
    let active = true;
    setDraft("");
    setMessagesInThread([]);
    setParticipants([]);
    setTypingNames([]);
    setConnected(false);
    api("/api/session").then((data) => {
      if (!active) return;
      const identity = getDiscussionIdentity(data?.user);
      setSelfIdentity(identity);
      if (!window.io) return;
      const client = window.io({ transports: ["websocket", "polling"] });
      socket.current = client;
      setConnected(true);
      client.emit("joinDiscussion", { discussionId: room.id, author: identity.name, avatar: identity.avatar });
      client.on("discussionHistory", (payload) => {
        if (payload.discussionId !== room.id || !payload.messages?.length) return;
        setMessagesInThread((current) => {
          const ids = new Set(current.map((message) => message.id));
          return [...current, ...payload.messages.filter((message) => !ids.has(message.id))];
        });
      });
      client.on("discussionMessage", (message) => {
        if (message.discussionId === room.id) setMessagesInThread((current) => [...current, message]);
      });
      client.on("discussionPresence", (payload) => {
        if (payload.discussionId === room.id) setParticipants(payload.participants || []);
      });
      client.on("discussionTyping", (payload) => {
        if (payload.discussionId !== room.id) return;
        setTypingNames((current) => payload.isTyping
          ? [...new Set([...current, payload.author])]
          : current.filter((name) => name !== payload.author));
      });
    });
    return () => {
      active = false;
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(mockTypingTimer.current);
      socket.current?.emit("discussionTyping", { discussionId: room.id, isTyping: false });
      socket.current?.emit("leaveDiscussion");
      socket.current?.disconnect();
      socket.current = null;
    };
  }, [room.id]);

  useEffect(() => {
    stream.current?.scrollTo({ top: stream.current.scrollHeight, behavior: "smooth" });
  }, [messagesInThread, typingNames]);

  function updateDraft(value) {
    setDraft(value);
    if (socket.current) {
      socket.current.emit("discussionTyping", { discussionId: room.id, isTyping: Boolean(value.trim()) });
      window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => socket.current?.emit("discussionTyping", { discussionId: room.id, isTyping: false }), 1200);
      return;
    }
    window.clearTimeout(mockTypingTimer.current);
    setTypingNames(value.trim() ? ["A person"] : []);
    mockTypingTimer.current = window.setTimeout(() => setTypingNames([]), 1300);
  }

  function submitMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    window.clearTimeout(typingTimer.current);
    window.clearTimeout(mockTypingTimer.current);
    setTypingNames([]);
    if (socket.current) {
      socket.current.emit("discussionMessage", { discussionId: room.id, message: text, avatar: selfIdentity.avatar });
      socket.current.emit("discussionTyping", { discussionId: room.id, isTyping: false });
    } else {
      setMessagesInThread((current) => [...current, { id: `local-${Date.now()}`, author: selfIdentity.name, avatar: selfIdentity.avatar, message: text, createdAt: new Date().toISOString() }]);
    }
    setDraft("");
  }

  const activeCount = Math.max(participants.length, connected ? 1 : 0);
  const typingText = typingSummary(typingNames);

  return (
    <section className="feed-discussion-room group-conversation" style={{ "--community-accent": community.accent, "--community-accent-2": community.accent2 }}>
      <header className="group-conversation-header">
        <div><span className="group-live-pulse"><i /></span><span><strong>{room.title}</strong><small>{connected ? "Connected" : "Local room"} - posting as {selfIdentity.name}</small></span></div>
        <button className="discussion-room-close" type="button" onClick={onClose} aria-label="Close discussion room"><Icon name="close" /></button>
      </header>
      <div className="group-message-stream" ref={stream}>
        <div className="group-day-divider"><span>Now</span></div>
        {messagesInThread.length === 0 && (
          <section className="discussion-room-empty">
            <span><Icon name="discuss" /></span>
            <h3>No messages yet</h3>
            <p>Start the room with a question, observation, or useful context.</p>
          </section>
        )}
        {messagesInThread.map((message) => <LiveDiscussionMessage message={message} key={message.id} own={message.author === selfIdentity.name} />)}
        {typingText && <div className="group-typing-row"><span className="typing-bubble"><i /><i /><i /></span><small>{typingText}</small></div>}
      </div>
      <div className="group-composer-status">{typingText || `${activeCount || 1} ${activeCount === 1 ? "person" : "people"} in this discussion room`}</div>
      <form className="group-message-composer" onSubmit={submitMessage}>
        <Avatar label={selfIdentity.avatar} tone="green" />
        <textarea value={draft} onChange={(event) => updateDraft(event.target.value)} placeholder={`Message ${community.name}`} rows="1" required />
        <button type="button" aria-label="Add a prompt" onClick={() => updateDraft("A useful way to think about this is ")}><Icon name="spark" /></button>
        <button type="submit" aria-label="Send message" disabled={!draft.trim()}><Icon name="send" /></button>
      </form>
    </section>
  );
}

export function DiscussionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState("Trending");
  const [feedItems, setFeedItems] = useState([]);
  const [localPosts] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const composeHandled = useRef(false);
  const query = searchParams.get("q") || "";
  const composeOpen = searchParams.get("compose") === "1";

  useEffect(() => {
    api("/api/discussions").then((data) => setFeedItems(data?.discussions || []));
  }, []);

  const visible = useMemo(() => {
    let list = [...localPosts, ...feedItems];
    if (query) list = list.filter((item) => `${item.title} ${item.body} ${item.community} ${item.tag}`.toLowerCase().includes(query.toLowerCase()));
    if (filter === "Newest") list = list.reverse();
    if (filter === "Unanswered") list = list.filter((item) => item.comments < 50);
    if (!["Trending", "Newest", "Unanswered"].includes(filter)) list = list.filter((item) => item.tag === filter || item.community.includes(filter));
    return list;
  }, [filter, query, localPosts, feedItems]);

  function openDiscussionRoom() {
    const next = new URLSearchParams(searchParams);
    next.delete("compose");
    setSearchParams(next);
    setActiveRoom(makeDraftDiscussionRoom(filter));
  }

  useEffect(() => {
    if (!composeOpen || activeRoom || composeHandled.current) return;
    composeHandled.current = true;
    openDiscussionRoom();
  }, [composeOpen, activeRoom]);

  return (
    <div className="app-page">
      <PageIntro eyebrow="Discussion feed" title="Ideas worth adding to." copy="Vote, comment, share a useful perspective, or start a focused conversation of your own." action={<button className="button button-primary" type="button" onClick={openDiscussionRoom}><Icon name="plus" size={17} /> Start discussion</button>} />
      {query && <div className="result-banner"><span>Results for <strong>"{query}"</strong></span><button type="button" onClick={() => setSearchParams({})}>Clear search</button></div>}
      <div className="category-pills">{["Trending", "Newest", "Unanswered", "Finance", "AI", "Students", "Startups"].map((item) => <button className={filter === item ? "active" : ""} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {activeRoom && <FeedDiscussionRoom room={activeRoom} onClose={() => setActiveRoom(null)} />}
      {visible.length ? <div className="discussion-list feed-list">{visible.map((item) => <DiscussionCard discussion={item} key={item.id} />)}</div> : <EmptyState title="No discussions found" copy="Try another topic or start the conversation yourself." action={<button className="button button-primary" type="button" onClick={openDiscussionRoom}>Start discussion</button>} />}
    </div>
  );
}

export function DiscussionPage({ onAuth }) {
  const { slug } = useParams();
  const [item, setItem] = useState({ id: slug, community: "Strango", communitySlug: "ai", author: "Member", time: "", title: "Discussion", body: "", votes: 0, comments: 0, viewers: 0, tag: "Community" });
  const community = fallbackCommunities.find((entry) => entry.slug === item.communitySlug) || fallbackCommunities[0];
  const [draft, setDraft] = useState("");
  const [messagesInThread, setMessagesInThread] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [typingNames, setTypingNames] = useState([]);
  const [selfName, setSelfName] = useState("You");
  const [selfAvatar, setSelfAvatar] = useState("AP");
  const [liveMenuOpen, setLiveMenuOpen] = useState(false);
  const socket = useRef(null);
  const stream = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    api("/api/discussions").then((data) => {
      const match = (data?.discussions || []).find((discussion) => slug === discussion.id || slug === discussion.slug || slug.endsWith(`-${discussion.id}`));
      if (match) {
        setItem({ ...match, time: new Date(match.createdAt).toLocaleDateString(), tag: match.community || "Community", viewers: 0 });
        setMessagesInThread(match.locked ? [] : [{ id: `post-${match.id}`, author: match.author, avatar: match.author, message: match.body, createdAt: match.createdAt, role: "Thread starter" }]);
      }
    });
  }, [slug]);

  useEffect(() => {
    if (item.locked || !window.io) return undefined;
    socket.current = window.io({ transports: ["websocket", "polling"] });
    api("/api/session").then((data) => {
      const identity = getDiscussionIdentity(data?.user);
      setSelfName(identity.name);
      setSelfAvatar(identity.avatar);
      socket.current?.emit("joinDiscussion", { discussionId: item.id, author: identity.name, avatar: identity.avatar });
    });
    socket.current.on("discussionHistory", (payload) => {
      if (payload.discussionId !== item.id || !payload.messages?.length) return;
      setMessagesInThread((current) => {
        const ids = new Set(current.map((message) => message.id));
        return [...current, ...payload.messages.filter((message) => !ids.has(message.id))];
      });
    });
    socket.current.on("discussionMessage", (message) => {
      if (message.discussionId === item.id) setMessagesInThread((current) => [...current, message]);
    });
    socket.current.on("discussionPresence", (payload) => {
      if (payload.discussionId === item.id) setParticipants(payload.participants || []);
    });
    socket.current.on("discussionTyping", (payload) => {
      if (payload.discussionId !== item.id) return;
      setTypingNames((current) => payload.isTyping
        ? [...new Set([...current, payload.author])]
        : current.filter((name) => name !== payload.author));
    });
    return () => {
      window.clearTimeout(typingTimer.current);
      socket.current?.emit("leaveDiscussion");
      socket.current?.disconnect();
    };
  }, [item.id, item.locked]);

  useEffect(() => {
    stream.current?.scrollTo({ top: stream.current.scrollHeight, behavior: "smooth" });
  }, [messagesInThread, typingNames]);

  function submitReply(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || item.locked) return;
    if (socket.current) {
      socket.current.emit("discussionMessage", { discussionId: item.id, message: text, avatar: selfAvatar });
      socket.current.emit("discussionTyping", { discussionId: item.id, isTyping: false });
    } else {
      setMessagesInThread((current) => [...current, { id: `local-${Date.now()}`, author: selfName, avatar: selfAvatar, message: text, createdAt: new Date().toISOString() }]);
    }
    setDraft("");
  }

  function updateDraft(value) {
    if (item.locked) return;
    setDraft(value);
    socket.current?.emit("discussionTyping", { discussionId: item.id, isTyping: Boolean(value) });
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => socket.current?.emit("discussionTyping", { discussionId: item.id, isTyping: false }), 1200);
  }

  const people = participants.map((participant, index) => ({ ...participant, activity: "Live in thread", tone: ["green", "blue", "purple", "gold"][index % 4] }));
  const activeCount = participants.length;
  const typingText = typingSummary(typingNames);

  if (item.locked) {
    return (
      <div className="app-page discussion-live-page is-locked" style={{ "--community-accent": community.accent, "--community-accent-2": community.accent2 }}>
        <header className="discussion-live-topbar"><Link className="back-link" to="/discussions">All discussions</Link></header>
        <section className="community-discussion-gate discussion-page-gate">
          <span><Icon name="users" /></span>
          <div><p className="eyebrow">Members-only discussion</p><h1>Join {community.name} to view this live discussion.</h1><p>Discussion content is available only after you join the community. Preview stats stay visible in community cards and panels.</p></div>
          <Link className="button button-primary" to={`/communities/${community.slug}`}>Join community</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page discussion-live-page" style={{ "--community-accent": community.accent, "--community-accent-2": community.accent2 }}>
      <header className="discussion-live-topbar">
        <Link className="back-link" to="/discussions">All discussions</Link>
        <button className="live-mobile-menu-button" type="button" aria-label="Open live discussion menu" onClick={() => setLiveMenuOpen((value) => !value)}><Icon name="more" /></button>
        {liveMenuOpen && (
          <nav className="live-mobile-menu" aria-label="Live discussion menu">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/communities">Explore</Link>
            <Link to={`/communities/${community.slug}`}>Back to community</Link>
            <Link to="/discussions">Leave discussion</Link>
          </nav>
        )}
      </header>
      <section className="discussion-live-hero">
        <div className="discussion-live-community"><CommunityMark community={community} size="small" showStatus /><span><strong>{community.name}</strong><small>{community.category} · Live discussion</small></span></div>
        <h1>{item.title}</h1>
        <p>{item.body}</p>
        <div className="discussion-live-meta">
          <span><Icon name="vote" size={17} /> {item.votes} helpful</span>
          <span><Icon name="message" size={17} /> {messagesInThread.length + item.comments} messages</span>
          <span className="is-live"><i /> {activeCount} viewing now</span>
        </div>
        <div className="discussion-topic-row">{(community.trends || [item.tag, "Community insight", "Live answers"]).map((topic) => <span key={topic}><Icon name="hash" size={14} /> {topic}</span>)}</div>
      </section>

      <div className="discussion-live-layout">
        <section className="group-conversation">
          <header className="group-conversation-header">
            <div><span className="group-live-pulse"><i /></span><span><strong>Live group conversation</strong><small>{activeCount} active · messages update instantly</small></span></div>
            <div className="group-header-avatars"><span className="avatar-stack">{people.slice(0, 4).map((person, index) => <Avatar key={person.id || `${person.author}-${index}`} label={person.avatar} small tone={person.tone} />)}</span><span>+{Math.max(0, activeCount - 4)}</span></div>
          </header>
          <div className="group-message-stream" ref={stream}>
            <div className="group-day-divider"><span>Today</span></div>
            <p className="group-system-message"><Icon name="bolt" size={14} /> {item.author} started this live discussion - {activeCount} people are viewing</p>
            {messagesInThread.map((message) => <LiveDiscussionMessage message={message} key={message.id} own={message.author === selfName} />)}
            {typingText && <div className="group-typing-row"><span className="typing-bubble"><i /><i /><i /></span><small>{typingText}</small></div>}
          </div>
          <div className="group-composer-status">{typingText || `${activeCount} people are following this conversation`}</div>
          <form className="group-message-composer" onSubmit={submitReply}>
            <Avatar label={selfAvatar} tone="green" />
            <textarea value={draft} onChange={(event) => updateDraft(event.target.value)} placeholder={`Message ${community.name}`} rows="1" required />
            <button type="button" aria-label="Add a prompt" onClick={() => updateDraft("A useful way to think about this is ")}><Icon name="spark" /></button>
            <button type="submit" aria-label="Send message" disabled={!draft.trim()}><Icon name="send" /></button>
          </form>
        </section>

        <aside className="discussion-presence-panel">
          <section>
            <div className="presence-panel-title"><div><span><i /></span><h2>Online now</h2></div><strong>{activeCount}</strong></div>
            <p>People currently reading or contributing to this discussion.</p>
            <div className="discussion-participant-list">{people.slice(0, 6).map((person, index) => <article key={person.id || `${person.author}-${index}`}><span className="presence"><Avatar label={person.avatar} small tone={person.tone} /></span><span><strong>{person.author}</strong><small>{person.activity}</small></span></article>)}</div>
          </section>
          <section className="thread-signal-panel">
            <p className="eyebrow">Thread signals</p>
            <div><span><Icon name="eye" size={17} /> Live viewers</span><strong>{activeCount}</strong></div>
            <div><span><Icon name="message" size={17} /> Messages today</span><strong>{messagesInThread.length + item.comments}</strong></div>
            <div><span><Icon name="bolt" size={17} /> Typing now</span><strong>{typingNames.length}</strong></div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function LiveDiscussionMessage({ message, own }) {
  const [reaction, setReaction] = useState(false);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <article className={`group-message${own ? " is-own" : ""}`}>
      {!own && <span className="presence"><Avatar label={message.avatar || message.author} tone={message.author === "Mira S." ? "purple" : message.author === "Naina P." ? "gold" : "blue"} /></span>}
      <div className="group-message-body">
        <div className="group-message-author"><strong>{own ? "You" : message.author || "A person"}</strong>{message.role && <span>{message.role}</span>}<time>{time}</time></div>
        <p>{message.message}</p>
        {message.translation && <span className="message-translation"><small>{message.translation.detectedLanguage}</small>{message.translation.translatedText ? <><b>Translated</b>{message.translation.translatedText}</> : <em>Translation provider ready</em>}</span>}
        <div className="group-message-actions"><button className={reaction ? "active" : ""} type="button" onClick={() => setReaction((value) => !value)}>Helpful {reaction ? 1 : ""}</button><button type="button">Reply</button><button type="button"><Icon name="more" size={15} /></button></div>
      </div>
    </article>
  );
}

export function LivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    api("/api/live").then((data) => {
      const next = (data?.conversations || []).map((item) => ({ ...item, people: item.participantCount || 0, accent: "#14b8a6", speakers: [], duration: null }));
      setConversations(next);
      const requested = next.find((item) => item.id === searchParams.get("join"));
      if (requested) setActive(requested);
    });
  }, []);

  function join(conversation) {
    if (!conversation) return;
    setActive(conversation);
    setSearchParams({ join: conversation.id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function leave() {
    setActive(null);
    setSearchParams({});
  }

  return (
    <div className="app-page wide-page">
      <PageIntro eyebrow="Live conversations" title="Join what is happening now." copy="Topic-led conversations you can enter instantly. Listen first, react, or take the mic when you are ready." />
      {active && <section className="live-stage" style={{ "--live-accent": active.accent }}>
        <div className="live-stage-copy"><span className="live-label"><i /> Live now</span><small>{active.topic} · {active.duration}</small><h2>{active.title}</h2><p>You are in listening mode with {active.people} participants. Raise your hand when you want to speak.</p><div><button className="button button-primary" type="button" onClick={() => document.getElementById("live-chat-input")?.focus()}>Join the chat</button><button className="button button-secondary" type="button" onClick={leave}>Leave conversation</button></div></div>
        <div className="live-stage-orbit">{active.speakers.map((speaker, index) => <Avatar key={speaker} label={speaker} tone={["green", "blue", "gold"][index]} />)}<span>+{active.people - active.speakers.length}</span></div>
        <form className="live-chat-bar" onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); }}><input id="live-chat-input" placeholder="Add to the live chat" required /><button type="submit"><Icon name="send" /></button></form>
      </section>}
      <div className="live-layout">
        <section><SectionHeading eyebrow="Conversations" title="Live now" copy="Only conversations with real active participants appear here." /><div className="live-grid app-live-grid">{conversations.length ? conversations.map((item) => <LiveCard conversation={item} active={active?.id === item.id} onJoin={join} key={item.id} />) : <EmptyState title="No live conversations yet" copy="When a community starts a live conversation, it will appear here immediately." action={<Link className="button button-secondary" to="/communities">Explore communities</Link>} />}</div></section>
        <aside className="live-sidebar">
          <section><p className="eyebrow">Live activity</p><p className="quiet-state">{conversations.length ? `${conversations.reduce((total, item) => total + item.people, 0)} people are participating now.` : "No active participants right now."}</p></section>
        </aside>
      </div>
      <section className="icebreaker-panel"><span><Icon name="spark" /></span><div><p className="eyebrow">AI Icebreaker</p><h2>Not sure how to begin?</h2><p>{icebreakers[promptIndex]}</p></div><button className="button button-secondary" type="button" onClick={() => setPromptIndex((promptIndex + 1) % icebreakers.length)}>Try another</button></section>
    </div>
  );
}

export function AnonymousChatPage() {
  const [status, setStatus] = useState("Finding someone thoughtful...");
  const [messagesInChat, setMessagesInChat] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [sendNotice, setSendNotice] = useState("");
  const [nextMenuOpen, setNextMenuOpen] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [icebreakerCollapsed, setIcebreakerCollapsed] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [identity, setIdentity] = useState({ self: null, partner: null });
  const socket = useRef(null);
  const scroll = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    if (!window.io) {
      setStatus("Realtime chat is unavailable.");
      return undefined;
    }
    socket.current = window.io({ transports: ["websocket", "polling"] });
    socket.current.on("status", (nextStatus) => {
      const next = String(nextStatus || "Connected");
      setStatus(next);
      if (!/^stranger connected$/i.test(next)) {
        setIdentity((current) => ({ ...current, partner: null }));
        setTyping(false);
      }
    });
    socket.current.on("chatIdentity", (nextIdentity) => setIdentity(nextIdentity || { self: null, partner: null }));
    socket.current.on("message", (message) => {
      setSendNotice("");
      setConversationStarted(true);
      setIcebreakerCollapsed(true);
      const payload = typeof message === "object" ? message : { text: String(message), translation: null };
      setMessagesInChat((items) => [...items, { direction: "incoming", text: payload.text, translation: payload.translation, time: new Date() }]);
    });
    socket.current.on("typing", (state) => setTyping(Boolean(state)));
    return () => socket.current?.disconnect();
  }, []);

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" });
  }, [messagesInChat, typing]);

  function sendMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !socket.current) return;
    if (!isPeerConnected) {
      setSendNotice("Connect with a stranger before sending.");
      socket.current?.emit("typing", false);
      return;
    }
    socket.current.emit("message", { text: message });
    setMessagesInChat((items) => [...items, { direction: "outgoing", text: message, time: new Date() }]);
    setDraft("");
    setSendNotice("");
    setConversationStarted(true);
    setIcebreakerCollapsed(true);
    socket.current.emit("typing", false);
  }

  function connectNextPerson() {
    socket.current?.emit("next");
    setMessagesInChat([]);
    setDraft("");
    setTyping(false);
    setSendNotice("");
    setIdentity((current) => ({ ...current, partner: null }));
    setConversationStarted(false);
    setIcebreakerCollapsed(false);
    setNextMenuOpen(false);
    setStatus("Finding someone new...");
  }

  function usePrompt() {
    insertPrompt(icebreakers[promptIndex]);
    setPromptIndex((promptIndex + 1) % icebreakers.length);
  }

  function insertPrompt(prompt) {
    setDraft(prompt);
    setConversationStarted(true);
    setIcebreakerCollapsed(true);
    setSendNotice("");
    if (isPeerConnected) socket.current?.emit("typing", true);
    window.requestAnimationFrame(() => input.current?.focus());
  }

  const isPeerConnected = Boolean(identity.partner && socket.current?.connected && /^stranger connected$/i.test(status));
  const statusLabel = isPeerConnected ? `Connected with Stranger #${identity.partner}` : status;
  const helperText = sendNotice || (typing ? "Stranger is typing..." : isPeerConnected ? "Messages are not saved after this chat ends." : "Waiting for a stranger to connect.");

  return (
    <div className="anonymous-chat-page">
      <header className="anonymous-chat-header">
        <Logo />
        <button className="anonymous-chat-person" type="button" onClick={() => setNextMenuOpen(true)}><span className="presence"><Avatar label={identity.partner ? `S${identity.partner}` : "NP"} small /></span><span><strong>Next person</strong><small>{identity.self ? `You #${identity.self} - ${statusLabel}` : statusLabel}</small></span></button>
        <div className="chat-header-actions"><ThemeToggle compact /></div>
      </header>
      <main className="chat-workspace">
        <aside className="chat-ad-reserve chat-ad-reserve-left" aria-hidden="true">
          <span>Reserved</span>
        </aside>
        <section className="chat-conversation">
          <div className="anonymous-chat-scroll" ref={scroll}>
            <div className="chat-date-pill">Today · End-to-end anonymity by default</div>
          <section className={`chat-welcome-card${icebreakerCollapsed ? " is-collapsed" : ""}`} aria-hidden={icebreakerCollapsed}>
            {!icebreakerCollapsed && <>
              <span><Icon name="spark" /></span>
              <div><p className="eyebrow">AI Icebreaker</p><h1>Start with a better question.</h1><p>{icebreakers[promptIndex]}</p></div>
              <button className="button button-secondary" type="button" onClick={usePrompt}>Use prompt</button>
            </>}
          </section>
          {conversationStarted && messagesInChat.length === 0 && (
            <section className="chat-started-state">
              <span><Icon name="check" /></span>
              <div><strong>Conversation starter ready</strong><small>Your question is ready below. Edit it or send when it feels right.</small></div>
            </section>
          )}
          {messagesInChat.length === 0 && !conversationStarted && (
            <section className="chat-empty-guide">
                <div><span><Icon name="discuss" /></span><div><strong>Your conversation starts here</strong><small>Choose a question or write your own when you feel ready.</small></div></div>
                <div className="chat-quick-prompts">{icebreakers.slice(2, 5).map((prompt) => <button type="button" key={prompt} onClick={() => insertPrompt(prompt)}>{prompt}<Icon name="arrow" size={14} /></button>)}</div>
                <p><Icon name="check" size={14} /> No profile details are shared with the other person.</p>
              </section>
            )}
              {messagesInChat.map((message, index) => <div className={`chat-bubble ${message.direction}`} key={`${message.time.getTime()}-${index}`}><p>{message.text}</p>{message.translation && <span className="message-translation"><small>{message.translation.detectedLanguage}</small>{message.translation.translatedText ? <><b>Translated</b>{message.translation.translatedText}</> : <em>Translation provider ready</em>}</span>}<time>{message.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>)}
            {typing && <p className="chat-bubble incoming typing-bubble"><i /><i /><i /></p>}
          </div>
          <div className={`typing-indicator${typing ? " is-visible" : ""}${sendNotice ? " is-warning" : ""}`}>{helperText}</div>
          <form className="anonymous-chat-compose" onSubmit={sendMessage}>
            <button type="button" aria-label="Use a new icebreaker" onClick={usePrompt}><Icon name="spark" /></button>
            <input ref={input} value={draft} onChange={(event) => { setDraft(event.target.value); setSendNotice(""); if (isPeerConnected) socket.current?.emit("typing", Boolean(event.target.value)); }} placeholder="Write a message..." aria-label="Message" />
            <button type="submit" aria-label="Send message" disabled={!draft.trim()}><Icon name="send" /></button>
          </form>
        </section>
        <aside className="chat-ad-reserve chat-ad-reserve-right" aria-hidden="true">
          <span>Reserved</span>
        </aside>
      </main>
      {nextMenuOpen && (
        <div className="next-person-layer" role="dialog" aria-modal="true" aria-label="Next person">
          <button className="modal-scrim" type="button" aria-label="Stay as it is" onClick={() => setNextMenuOpen(false)} />
          <section className="next-person-menu">
            <p className="eyebrow">Next person</p>
            <h2>Connect with someone new?</h2>
            <p>Your current chat will stay as it is unless you choose to connect.</p>
            <div>
              <button className="button button-primary" type="button" onClick={connectNextPerson}>Connect</button>
              <button className="button button-secondary" type="button" onClick={() => setNextMenuOpen(false)}>Stay as it is</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function RoomsPage() {
  const [activeRoom, setActiveRoom] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [roomMessages, setRoomMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("All");
  const socket = useRef(null);
  const filteredRooms = rooms.filter((room) => filter === "All" || room.category === filter);

  useEffect(() => {
    if (!activeRoom || !window.io) return undefined;
    socket.current = window.io({ transports: ["websocket", "polling"] });
    socket.current.emit("joinPlatformRoom", { roomId: activeRoom.id });
    socket.current.on("platformRoomPresence", (payload) => { if (payload.roomId === activeRoom.id) setParticipantCount(payload.participantCount); });
    socket.current.on("platformRoomMessage", (payload) => { if (payload.roomId === activeRoom.id) setRoomMessages((items) => [...items, payload]); });
    return () => { socket.current?.disconnect(); socket.current = null; };
  }, [activeRoom]);

  function sendRoomMessage(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !socket.current) return;
    socket.current.emit("platformRoomMessage", { roomId: activeRoom.id, message, author: "Ghost 148" });
    setDraft("");
  }

  return (
    <div className="app-page wide-page">
      <PageIntro eyebrow="Topic rooms" title="Walk into a room that feels alive." copy="Persistent spaces for focus, learning, debate, and relaxed conversation. Every room below is ready to join." />
      <div className="category-pills">{["All", "Technology", "Finance", "Students", "Gaming", "Social"].map((item) => <button className={filter === item ? "active" : ""} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {activeRoom && <section className="active-room-panel">
        <header><div><span className="live-label"><i /> Connected</span><h2>{activeRoom.title}</h2><p>{participantCount || activeRoom.people} participants · {activeRoom.description}</p></div><button type="button" onClick={() => setActiveRoom(null)} aria-label="Leave room"><Icon name="close" /></button></header>
        <div className="room-message-scroll"><p className="system-message">You joined {activeRoom.title}. Say hello when you are ready.</p>{roomMessages.map((item, index) => <p className="room-message" key={`${item.createdAt}-${index}`}><strong>{item.author}</strong>{item.message}<small>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></p>)}</div>
        <form onSubmit={sendRoomMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${activeRoom.title}`} required /><button className="button button-primary" type="submit">Send</button></form>
      </section>}
      <div className="room-grid">{filteredRooms.length ? filteredRooms.map((room) => <article className="room-card" key={room.id} style={{ "--room-color": room.color }}><div className="room-card-head"><div className="room-signal"><i /><i /><i /></div><span>{room.status}</span></div><small>{room.category}</small><h2>{room.title}</h2><p>{room.description}</p><div className="room-card-footer"><strong><Icon name="users" size={16} /> {room.people} participants</strong><button className="button button-primary" type="button" onClick={() => { setRoomMessages([]); setParticipantCount(0); setActiveRoom(room); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{activeRoom?.id === room.id ? "Open room" : "Join room"}</button></div></article>) : <EmptyState title="No active rooms yet" copy="Community rooms appear here once real participants join." action={<Link className="button button-secondary" to="/communities">Explore communities</Link>} />}</div>
    </div>
  );
}

export function MessagesPage() {
  const [active, setActive] = useState(messages[0]);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState([]);
  const [filter, setFilter] = useState("All");
  const filtered = messages.filter((message) => filter === "All" || (filter === "Unread" && message.unread) || (filter === "Requests" && message.id === "nova"));

  function send(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    setSent((items) => [...items, draft.trim()]);
    setDraft("");
  }

  if (!active) {
    return <div className="app-page"><PageIntro eyebrow="Private messages" title="Your inbox is ready." copy="Direct conversations will appear here after you connect with someone." /><EmptyState title="No messages yet" copy="Join a community or start a chat to meet people first." action={<Link className="button button-secondary" to="/communities">Explore communities</Link>} /></div>;
  }

  return (
    <div className="messages-page">
      <aside className="conversation-list">
        <div className="messages-head"><div><p className="eyebrow">Private</p><h1>Messages</h1></div><Link to="/communities" aria-label="Find people"><Icon name="plus" /></Link></div>
        <label className="page-search"><Icon name="search" /><input placeholder="Search messages" /></label>
        <div className="message-filters">{["All", "Unread", "Requests"].map((item) => <button className={filter === item ? "active" : ""} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
        {filtered.map((message) => <button className={`conversation-row${active.id === message.id ? " active" : ""}`} type="button" key={message.id} onClick={() => { setActive(message); setSent([]); }}><span className="presence"><Avatar label={message.avatar} tone="green" /></span><span><strong>{message.name}</strong><small>{message.preview}</small></span><span><time>{message.time}</time>{message.unread > 0 && <b>{message.unread}</b>}</span></button>)}
      </aside>
      <section className="chat-window">
        <header><span className="presence"><Avatar label={active.avatar} tone="green" /></span><div><strong>{active.name}</strong><small>{active.status}</small></div><Link to="/profile" aria-label="View profile"><Icon name="profile" /></Link></header>
        <div className="chat-scroll"><time>Today</time><p className="chat-bubble incoming">Hey, I found your reply in the discussion really useful.<small>10:32</small></p><p className="chat-bubble outgoing">Glad it helped. I was trying to make the tradeoff a little less abstract.<small>10:35 ✓✓</small></p><p className="chat-bubble incoming">{active.preview}<small>10:42</small></p>{sent.map((text, index) => <p className="chat-bubble outgoing" key={`${text}-${index}`}>{text}<small>now ✓</small></p>)}</div>
        <form className="chat-input" onSubmit={send}><button type="button" onClick={() => setDraft((value) => `${value}${value ? " " : ""}🙂`)}>+</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message" /><button type="submit" aria-label="Send"><Icon name="send" /></button></form>
      </section>
    </div>
  );
}

export function NotificationsPage() {
  const [read, setRead] = useState([]);
  return (
    <div className="app-page">
      <PageIntro eyebrow="Updates" title="Notifications" copy="Mentions, replies, badges, invitations, and messages in one place." action={<button className="text-button" type="button" onClick={() => setRead(notifications.map((_, index) => index))}>Mark all as read</button>} />
      <div className="notification-list">{notifications.map((item, index) => <button type="button" className={read.includes(index) ? "" : "unread"} key={item.title} onClick={() => setRead((items) => [...new Set([...items, index])])}><span className={`notification-icon type-${item.type}`}><Icon name={item.type === "badge" ? "spark" : item.type === "message" ? "message" : item.type === "invite" ? "live" : "discuss"} /></span><div><h3>{item.title}</h3><p>{item.detail}</p><small>{item.time}</small></div>{!read.includes(index) && <i />}</button>)}</div>
    </div>
  );
}

export function SparksPage() {
  const levels = [["Explorer", 0], ["Connector", 30], ["Contributor", 100], ["Veteran", 250], ["Pioneer", 500]];
  return (
    <div className="app-page">
      <PageIntro eyebrow="Reputation" title="Your Sparks" copy="Recognition that follows useful participation, even when you choose to stay incognito." />
      <section className="sparks-hero"><div className="spark-orb"><Icon name="spark" size={34} /></div><div><p>Current balance</p><strong>128</strong><span>Sparks</span></div><div className="level-progress"><span><strong>Contributor</strong><small>122 Sparks to Veteran</small></span><progress value="128" max="250" /></div></section>
      <section className="achievement-grid">{[["Helpful Voice", "25 helpful reactions", "Unlocked"], ["Conversation Starter", "Created 10 discussions", "Unlocked"], ["Community Builder", "Join 8 communities", "6 / 8"], ["Trusted Connector", "Receive 50 replies", "31 / 50"]].map(([title, detail, state], index) => <article key={title} className={index < 2 ? "unlocked" : ""}><span><Icon name={index % 2 ? "users" : "spark"} /></span><h3>{title}</h3><p>{detail}</p><small>{state}</small></article>)}</section>
      <section className="levels-panel"><h2>Reputation levels</h2>{levels.map(([level, points], index) => <div className={points <= 128 ? "reached" : ""} key={level}><span>{index + 1}</span><strong>{level}</strong><small>{points} Sparks</small></div>)}</section>
    </div>
  );
}

export function ProfilePage() {
  const [mode, setMode] = useState("incognito");
  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("Curious about finance, technology, and building better habits.");
  const [draftBio, setDraftBio] = useState(bio);
  return (
    <div className="app-page">
      <section className="profile-hero"><div className="profile-cover" /><div className="profile-main"><Avatar label="GS" tone="green" /><div><h1>Ghost 148</h1><p>{bio}</p><div><span>128 Sparks</span><span>6 communities</span><span>14 discussions</span></div></div><button className="button button-secondary" type="button" onClick={() => { if (editing) { setBio(draftBio); setEditing(false); } else setEditing(true); }}>{editing ? "Save profile" : "Edit profile"}</button></div>{editing && <div className="profile-editor"><label>Bio<input value={draftBio} onChange={(event) => setDraftBio(event.target.value)} /></label><button type="button" onClick={() => { setDraftBio(bio); setEditing(false); }}>Cancel</button></div>}</section>
      <section className="mode-switcher"><div><p className="eyebrow">Identity mode</p><h2>Choose how others see you</h2></div><div><button className={mode === "incognito" ? "active" : ""} type="button" onClick={() => setMode("incognito")}>Incognito</button><button className={mode === "profile" ? "active" : ""} type="button" onClick={() => setMode("profile")}>Profile</button></div><p>{mode === "incognito" ? "Your participation is anonymous. Sparks and achievements still accumulate privately." : "Your display name, bio, badges, and contributions are visible to the community."}</p></section>
      <nav className="page-tabs">{["Overview", "Discussions", "Communities", "Achievements"].map((item) => <button className={tab === item ? "active" : ""} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      {tab === "Overview" || tab === "Discussions" ? <section className="profile-overview"><div><h2>Recent discussions</h2>{discussions.slice(0, tab === "Overview" ? 2 : 4).map((item) => <DiscussionCard discussion={item} compact key={item.id} />)}</div><aside><h2>Badges</h2>{["Helpful Voice", "Early Connector", "Finance Regular"].map((badge) => <div className="badge-row" key={badge}><span><Icon name="spark" /></span><strong>{badge}</strong></div>)}</aside></section> : tab === "Communities" ? <div className="community-grid">{fallbackCommunities.slice(0, 4).map((item) => <CommunityCard community={item} joined key={item.slug} />)}</div> : <section className="achievement-grid">{["Helpful Voice", "Conversation Starter", "Community Builder", "Trusted Connector"].map((title, index) => <article className={index < 2 ? "unlocked" : ""} key={title}><span><Icon name="spark" /></span><h3>{title}</h3><p>Progress earned through useful participation.</p><small>{index < 2 ? "Unlocked" : "In progress"}</small></article>)}</section>}
    </div>
  );
}

export function PlutoPage() {
  const [interested, setInterested] = useState(false);
  useEffect(() => { api("/api/pluto").then((data) => setInterested(Boolean(data?.interested))); }, []);
  async function joinWaitlist() {
    const result = await api("/api/pluto/interest", { method: "POST", body: "{}" });
    if (result?.ok) setInterested(true);
  }
  const benefits = [
    ["Custom profiles", "More control over how your identity appears."],
    ["Premium themes", "A refined set of personal visual modes."],
    ["Priority matching", "Future matching controls for relevant conversations."],
    ["Profile customization", "Flexible layouts, details, and presentation."],
    ["Premium badges", "Optional recognition without pay-to-win influence."],
    ["Advanced translation", "Expanded multilingual conversation tools."],
    ["Exclusive communities", "Curated spaces with focused membership."]
  ];
  return <div className="app-page pluto-page"><section className="pluto-hero"><p className="eyebrow">Coming soon</p><span className="pluto-orbit"><i /><i /><i /></span><h1>STRANGO PLUTO</h1><p>A future premium layer for people who want deeper customization and more control. Core conversation and community access stays open.</p><button className="button button-primary button-large" type="button" onClick={joinWaitlist} disabled={interested}>{interested ? <><Icon name="check" /> Interest registered</> : "Notify me at launch"}</button><small>No payments are being collected.</small></section><section className="pluto-benefits">{benefits.map(([title, copy], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{copy}</p></article>)}</section></div>;
}

export function StaticInfoPage({ type }) {
  const pages = {
    about: ["About Strango", "A social platform built around a simple sequence: observe, talk, connect.", "Strango brings communities, live discussions, anonymous conversation, direct messages, reputation, and useful tools into one calmer social experience."],
    contact: ["Contact", "Talk to the Strango team.", "For support, partnerships, safety reports, or product feedback, email support@strango.xyz."],
    faq: ["Frequently asked questions", "The quick version of how Strango works.", "Ghost Mode lets you browse before joining. Incognito Mode supports anonymous participation with private reputation. Profile Mode gives you a public identity."],
    support: ["Support", "Help when you need it.", "Visit the Safety Center, review community guidelines, or contact support@strango.xyz for account and product help."]
  };
  const [title, subtitle, copy] = pages[type] || pages.about;
  return <div className="app-page info-page"><p className="eyebrow">Strango</p><h1>{title}</h1><h2>{subtitle}</h2><p>{copy}</p><Link className="button button-primary" to="/dashboard">Open Strango</Link></div>;
}
