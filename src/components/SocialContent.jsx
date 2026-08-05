import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../app/api";
import { Avatar, CommunityMark, EmptyState, Icon } from "./UI";

const typeLabels = {
  discussion: "Community Discussion",
  short_post: "Short Post",
  standard_post: "Standard Post",
  reel: "Reel"
};

function postPath(post) {
  return post.contentType === "discussion" ? `/discussions/${post.slug || post.id}` : `/discussions/${post.slug || post.id}`;
}

function actionCount(value) {
  const number = Number(value || 0);
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`;
  return String(number);
}

function MediaGrid({ post }) {
  const media = Array.isArray(post.media) ? post.media : [];
  if (!media.length) return null;
  return (
    <div className={`social-media-grid media-count-${Math.min(media.length, 4)}`}>
      {media.slice(0, 4).map((item, index) => item.kind === "video" ? (
        <video key={item.id || item.url} src={item.url} poster={item.thumbnailUrl || post.thumbnailUrl} preload="metadata" muted playsInline controls={post.contentType !== "reel"} aria-label={item.altText || post.title || "Post video"} />
      ) : (
        <img key={item.id || item.url} src={item.url} alt={item.altText || post.title || ""} loading="lazy" />
      ))}
      {media.length > 4 && <span className="media-overflow">+{media.length - 4}</span>}
    </div>
  );
}

export function SocialPostCard({ post: initialPost, onAuth, compact = false }) {
  const [post, setPost] = useState(initialPost);
  const [busyAction, setBusyAction] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const locked = Boolean(post.locked);

  useEffect(() => setPost(initialPost), [initialPost]);

  async function update(endpoint, body, actionName) {
    if (locked || busyAction) return;
    setBusyAction(actionName);
    const result = await api(endpoint, { method: "POST", body: JSON.stringify(body || {}) });
    setBusyAction("");
    if (result?.post) setPost(result.post);
    else onAuth?.();
  }

  async function sharePost() {
    if (locked) return;
    const url = `${window.location.origin}${postPath(post)}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title || "Strango post", text: post.body || "", url });
      else await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    update(`/api/posts/${post.id}/share`, { target: "copy" }, "share");
  }

  async function reportPost() {
    if (!post.communitySlug) return;
    const reason = window.prompt("What should moderators review?");
    if (!reason) return;
    const result = await api(`/api/communities/${post.communitySlug}/reports`, { method: "POST", body: JSON.stringify({ postId: post.id, reason }) });
    if (result?.report) setMenuOpen(false);
  }

  const label = typeLabels[post.contentType] || "Post";
  const bodyLimit = post.contentType === "short_post" ? 500 : compact ? 220 : 1200;
  const body = String(post.body || "").slice(0, bodyLimit);

  return (
    <article className={`social-post-card social-post-${post.contentType}${compact ? " is-compact" : ""}${locked ? " is-locked" : ""}`}>
      <header className="social-post-head">
        <CommunityMark community={post.communitySlug || post.community} size="tiny" showStatus={post.contentType === "reel"} />
        <div>
          <span><strong>{post.community || "Strango"}</strong><i />{label}</span>
          <small>{post.author || "Anonymous User"} · {post.time || "now"}</small>
        </div>
        <button className="icon-button" type="button" aria-label="Open post menu" onClick={() => setMenuOpen((value) => !value)}><Icon name="more" size={17} /></button>
        {menuOpen && (
          <div className="post-menu" role="menu">
            <button type="button" onClick={sharePost}>Share</button>
            {post.communitySlug && <button type="button" onClick={reportPost}>Report</button>}
          </div>
        )}
      </header>

      <div className="social-post-body">
        {post.title && <Link to={postPath(post)}><h3>{post.title}</h3></Link>}
        {body && <p>{body}</p>}
        {locked && <Link className="locked-post-link" to={`/communities/${post.communitySlug}`}>Join community to unlock</Link>}
        {!locked && <MediaGrid post={post} />}
        {!locked && post.poll?.question && (
          <div className="poll-preview">
            <strong>{post.poll.question}</strong>
            {(post.poll.options || []).map((option) => <span key={option}>{option}</span>)}
          </div>
        )}
        {!locked && post.topicTags?.length > 0 && <div className="topic-chip-row">{post.topicTags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
      </div>

      <footer className="social-action-row">
        {post.contentType === "discussion" && (
          <>
            <button type="button" disabled={locked || busyAction === "upvote"} className={post.viewerVote > 0 ? "active" : ""} onClick={() => update(`/api/posts/${post.id}/vote`, { value: post.viewerVote > 0 ? 0 : 1 }, "upvote")}><Icon name="vote" size={16} /> {actionCount(post.votes)}</button>
            <button type="button" disabled={locked || busyAction === "downvote"} className={post.viewerVote < 0 ? "active" : ""} onClick={() => update(`/api/posts/${post.id}/vote`, { value: post.viewerVote < 0 ? 0 : -1 }, "downvote")}>Down</button>
          </>
        )}
        <button type="button" disabled={locked || busyAction === "like"} className={post.viewerLiked ? "active" : ""} onClick={() => update(`/api/posts/${post.id}/reactions`, { type: post.contentType === "discussion" ? "helpful" : "like" }, "like")}><Icon name="spark" size={16} /> {actionCount(post.likes)}</button>
        <Link to={postPath(post)}><Icon name="discuss" size={16} /> {actionCount(post.comments)}</Link>
        <button type="button" disabled={locked || busyAction === "save"} className={post.viewerSaved ? "active" : ""} onClick={() => update(`/api/posts/${post.id}/save`, {}, "save")}><Icon name="check" size={16} /> Save</button>
        <button type="button" disabled={locked || busyAction === "share"} onClick={sharePost}><Icon name="share" size={16} /> {actionCount(post.shares)}</button>
        <span><Icon name="eye" size={15} /> {actionCount(post.views)}</span>
      </footer>
    </article>
  );
}

export function SocialFeed({ items, onAuth, emptyTitle = "No posts yet", emptyCopy = "Create the first useful post for this space." }) {
  if (!items?.length) return <EmptyState title={emptyTitle} copy={emptyCopy} />;
  return <div className="social-feed-list">{items.map((post) => <SocialPostCard post={post} onAuth={onAuth} key={post.id} />)}</div>;
}

export function ReelDeck({ reels, onAuth }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(() => sessionStorage.getItem("strango_reels_muted") !== "0");
  const [paused, setPaused] = useState(false);
  const videoRefs = useRef([]);
  const viewed = useRef(new Set());

  useEffect(() => {
    sessionStorage.setItem("strango_reels_muted", muted ? "1" : "0");
  }, [muted]);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion || !reels?.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
          const next = Number(entry.target.getAttribute("data-index") || 0);
          setActiveIndex(next);
          setPaused(false);
        }
      });
    }, { threshold: [0.65] });
    videoRefs.current.forEach((node) => node?.parentElement && observer.observe(node.parentElement));
    return () => observer.disconnect();
  }, [reels]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      video.muted = muted;
      if (index === activeIndex && !paused) {
        video.play().catch(() => {});
        if (reels[index] && !viewed.current.has(reels[index].id)) {
          viewed.current.add(reels[index].id);
          api(`/api/posts/${reels[index].id}/views`, { method: "POST", body: "{}" });
        }
      } else {
        video.pause();
      }
    });
  }, [activeIndex, muted, paused, reels]);

  if (!reels?.length) return <EmptyState title="No reels yet" copy="Publish a reel with a safe hosted video URL to start the vertical feed." />;

  return (
    <section className="reel-deck" aria-label="Strango Reels">
      {reels.map((reel, index) => {
        const video = reel.media?.find((item) => item.kind === "video");
        return (
          <article className={`reel-card${index === activeIndex ? " is-active" : ""}`} data-index={index} key={reel.id}>
            <div className="reel-video-shell">
              {video ? <video ref={(node) => { videoRefs.current[index] = node; }} src={video.url} poster={video.thumbnailUrl || reel.thumbnailUrl} preload="metadata" playsInline loop onClick={() => setPaused((value) => !value)} /> : <div className="reel-failed">Video unavailable</div>}
              <div className="reel-overlay">
                <div><p className="eyebrow">Strango Reels</p><h3>{reel.title || reel.body || "Untitled reel"}</h3><p>{reel.body}</p><small>{reel.community} · {reel.author}</small></div>
                <div className="reel-actions">
                  <button type="button" onClick={() => setMuted((value) => !value)}>{muted ? "Muted" : "Sound"}</button>
                  <button type="button" onClick={() => setPaused((value) => !value)}>{paused && index === activeIndex ? "Play" : "Pause"}</button>
                  <SocialPostCard post={reel} onAuth={onAuth} compact />
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
