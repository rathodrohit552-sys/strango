import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../app/theme";
import { api } from "../app/api";
import { communities } from "../app/data";

export function Logo({ compact = false }) {
  return (
    <Link className="logo" to="/" aria-label="Strango home">
      <span className="logo-mark"><span>S</span></span>
      {!compact && <span>strango</span>}
    </Link>
  );
}

export function Icon({ name, size = 20 }) {
  const paths = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /></>,
    discuss: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path d="M8 9h8M8 13h5" /></>,
    live: <><circle cx="12" cy="12" r="2" /><path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2" /></>,
    rooms: <><path d="M4 4h16v12H8l-4 4z" /><path d="M8 8h8M8 12h5" /></>,
    message: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m7 9 5 4 5-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    spark: <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    vote: <path d="m12 4 7 8h-4v7H9v-7H5z" />,
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
    moon: <path d="M20.5 14.2A8 8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7z" />,
    hash: <><path d="M10 3 8 21M16 3l-2 18M4 9h16M3 15h16" /></>
  };

  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.spark}
    </svg>
  );
}

export function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button className={`theme-toggle${compact ? " is-compact" : ""}`} type="button" onClick={toggleTheme} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
      {!compact && <span>{theme === "dark" ? "Light" : "Dark"}</span>}
    </button>
  );
}

export function Avatar({ label = "S", tone = "green", small = false }) {
  return <span className={`avatar avatar-${tone}${small ? " avatar-small" : ""}`}>{label.slice(0, 2).toUpperCase()}</span>;
}

export function CommunityMark({ community, size = "medium", showStatus = false }) {
  const item = typeof community === "string"
    ? communities.find((entry) => entry.slug === community || entry.name === community)
    : community;
  const mark = item?.mark || "growth";
  const paths = {
    brain: <><path d="M9.5 5.2A3.2 3.2 0 0 0 4 7.5c0 .6.2 1.2.5 1.7A3.5 3.5 0 0 0 6 15.8V17a3 3 0 0 0 3.5 2.9V5.2Z" /><path d="M14.5 5.2A3.2 3.2 0 0 1 20 7.5c0 .6-.2 1.2-.5 1.7a3.5 3.5 0 0 1-1.5 6.6V17a3 3 0 0 1-3.5 2.9V5.2ZM9.5 9H7.8M14.5 9h1.7M9.5 14H7M14.5 14H17" /></>,
    code: <><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /><path d="m4 9 6-4 6 7 5-5" /></>,
    game: <><path d="M8 8h8a5 5 0 0 1 4.8 6.4l-.8 2.8a2.4 2.4 0 0 1-4.1 1L14 16h-4l-1.9 2.2a2.4 2.4 0 0 1-4.1-1l-.8-2.8A5 5 0 0 1 8 8Z" /><path d="M7 12v4M5 14h4M16.5 12.5h.01M18.5 15h.01" /></>,
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" /></>,
    activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
    film: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" /></>,
    rocket: <><path d="M14 5c3-3 6-3 6-3s0 3-3 6l-5 5-4-4 6-4Z" /><path d="m9 8-4 1-3 3 6 1M13 12l-1 6-3 3-1-6M5 19l-2 2M7 21l-1 1" /></>,
    growth: <><path d="M12 21V9M12 14c-4 0-7-2-7-6 4 0 7 2 7 6ZM12 11c4 0 7-2 7-6-4 0-7 2-7 6Z" /></>
  };
  return (
    <span
      className={`community-mark community-mark-${size}${showStatus ? " has-status" : ""}`}
      style={{ "--community-accent": item?.accent || "#14b8a6", "--community-accent-2": item?.accent2 || "#0f766e" }}
      aria-label={`${item?.name || "Community"} mark`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {paths[mark] || paths.growth}
      </svg>
      {showStatus && <i />}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, copy, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
      {action}
    </div>
  );
}

export function CommunityCard({ community, onJoin, joined = false, variant = "default" }) {
  const [busy, setBusy] = useState(false);
  const [isJoined, setIsJoined] = useState(joined);

  async function joinCommunity() {
    if (busy || isJoined) return;
    setBusy(true);
    const result = await onJoin?.(community);
    if (result !== false) setIsJoined(true);
    setBusy(false);
  }

  return (
    <article className={`community-card community-card-${variant}`} style={{ "--community-accent": community.accent, "--community-accent-2": community.accent2 }}>
      <div className="community-card-top">
        <CommunityMark community={community} showStatus={community.online > 0} />
        <span className="community-category">{community.category || "Community"}</span>
      </div>
      <Link className="community-card-link" to={`/communities/${community.slug}`}>
        <h3>{community.name}</h3>
        <p>{community.description}</p>
      </Link>
      <div className="community-meta">
        <span>{community.members > 0 ? `${community.members} ${community.members === 1 ? "member" : "members"}` : "Be first member"}</span>
        {community.online > 0 ? <span className="online-dot">{community.online} online</span> : <span>No one online yet</span>}
      </div>
      {community.activity && <small className="community-activity">{community.activity}</small>}
      <button className={`join-button${isJoined ? " is-joined" : ""}`} type="button" disabled={busy || isJoined} onClick={joinCommunity}>
        {busy ? "Joining..." : isJoined ? <><Icon name="check" size={15} /> Joined</> : "Join community"}
      </button>
    </article>
  );
}

export function DiscussionCard({ discussion, compact = false }) {
  const [voted, setVoted] = useState(false);
  const [shared, setShared] = useState(false);
  const [reported, setReported] = useState(false);
  const community = communities.find((item) => item.slug === discussion.communitySlug || item.name === discussion.community);

  async function shareDiscussion() {
    const url = `${window.location.origin}/discussions/${discussion.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: discussion.title, text: discussion.body, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  }

  async function reportDiscussion() {
    if (!discussion.communitySlug || reported) return;
    const reason = window.prompt("What should the moderators review?");
    if (!reason) return;
    const result = await api(`/api/communities/${discussion.communitySlug}/reports`, { method: "POST", body: JSON.stringify({ postId: discussion.id, reason }) });
    if (result?.report) setReported(true);
  }

  return (
    <article className={`discussion-card${compact ? " is-compact" : ""}`} style={{ "--discussion-accent": community?.accent || "#14b8a6" }}>
      <div className="vote-stack">
        <button className={voted ? "is-voted" : ""} type="button" aria-label={voted ? "Remove upvote" : "Upvote"} onClick={() => setVoted((value) => !value)}><Icon name="vote" size={17} /></button>
        <strong>{discussion.votes + (voted ? 1 : 0)}</strong>
      </div>
      <div className="discussion-copy">
        <div className="post-byline">
          <CommunityMark community={community} size="tiny" />
          <span>{discussion.community}</span><i />{discussion.author} · {discussion.time}
          {discussion.viewers > 0 && <b><span className="live-presence-dot" /> {discussion.viewers} viewing</b>}
        </div>
        <Link to={`/discussions/${discussion.id}`}><h3>{discussion.title}</h3></Link>
        {!compact && <p>{discussion.body}</p>}
        <div className="post-actions">
          <Link to={`/discussions/${discussion.id}`}><Icon name="discuss" size={16} /> {discussion.comments} comments</Link>
          <Link to={`/discussions/${discussion.id}`}><Icon name="eye" size={16} /> Live thread</Link>
          <button type="button" onClick={shareDiscussion}><Icon name={shared ? "check" : "share"} size={16} /> {shared ? "Copied" : "Share"}</button>
          {discussion.communitySlug && <button type="button" onClick={reportDiscussion} disabled={reported}>{reported ? "Reported" : "Report"}</button>}
          <span>{discussion.tag}</span>
        </div>
      </div>
    </article>
  );
}

export function LiveCard({ conversation, onJoin, active = false }) {
  return (
    <article className={`live-card${active ? " is-active" : ""}`} style={{ "--live-accent": conversation.accent }}>
      <div className="live-label"><i /> Live now</div>
      <span className="live-topic">{conversation.topic}</span>
      <h3>{conversation.title}</h3>
      <div className="live-card-stats">
        <span><Icon name="users" size={15} /> {conversation.people > 0 ? `${conversation.people} participants` : "Be first to join"}</span>
        {conversation.duration && <span><Icon name="clock" size={15} /> {conversation.duration}</span>}
      </div>
      <div className="live-card-footer">
        <div className="avatar-stack">{(conversation.speakers || []).map((speaker, index) => <Avatar key={speaker} label={speaker} small tone={["green", "blue", "gold"][index % 3]} />)}</div>
        {onJoin ? (
          <button className="button button-primary button-small" type="button" onClick={() => onJoin(conversation)}>{active ? "Open" : "Join live"}</button>
        ) : (
          <Link className="button button-primary button-small" to={`/live?join=${conversation.id}`}>Join live</Link>
        )}
      </div>
    </article>
  );
}

export function EmptyState({ title, copy, action }) {
  return <section className="empty-state"><span><Icon name="search" /></span><h3>{title}</h3><p>{copy}</p>{action}</section>;
}

export function AdSlot({ compact = false }) {
  return <aside className={`ad-slot${compact ? " ad-slot-compact" : ""}`} aria-label="Advertisement"><span>Advertisement</span></aside>;
}
