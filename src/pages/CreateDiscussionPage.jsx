import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, mergeCommunities } from "../app/api";
import { communities as fallbackCommunities } from "../app/data";
import { Icon } from "../components/UI";
import { PageIntro } from "./PlatformPages";

const composerTabs = [
  { key: "standard_post", label: "Standard Post", hint: "Longer social post with optional media." },
  { key: "discussion", label: "Community Discussion", hint: "Reddit-style question for one community." },
  { key: "short_post", label: "Short Post", hint: "Fast thought, poll, or real-time update." },
  { key: "reel", label: "Reel", hint: "Vertical video with caption and topics." }
];

const draftKey = "strango_create_composer_draft";

function normalizeInitialType(value) {
  const type = String(value || "").toLowerCase().replace(/[-\\s]+/g, "_");
  if (["discussion", "short_post", "standard_post", "reel"].includes(type)) return type;
  if (type === "short") return "short_post";
  if (type === "standard") return "standard_post";
  return "standard_post";
}

function emptyDraft(searchCommunity, searchType) {
  return {
    contentType: normalizeInitialType(searchType),
    communitySlug: searchCommunity || fallbackCommunities[0]?.slug || "",
    title: "",
    body: "",
    mediaUrl: "",
    thumbnailUrl: "",
    altText: "",
    tags: "",
    language: "English",
    visibility: "community",
    pollQuestion: "",
    pollOptions: ""
  };
}

function safeJsonParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

export default function CreateDiscussionPage({ onAuth }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCommunity = searchParams.get("community") || "";
  const initialType = searchParams.get("type") || "";
  const [communities, setCommunities] = useState(fallbackCommunities);
  const [draft, setDraft] = useState(() => ({ ...emptyDraft(initialCommunity, initialType), ...safeJsonParse(localStorage.getItem(draftKey), {}) }));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const titleInput = useRef(null);

  useEffect(() => {
    api("/api/communities").then((data) => {
      const next = mergeCommunities(data?.communities, fallbackCommunities);
      if (next.length) setCommunities(next);
    });
    titleInput.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    function warn(event) {
      if (!hasUnsavedDraft) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  });

  const selectedCommunity = useMemo(() => communities.find((community) => community.slug === draft.communitySlug), [communities, draft.communitySlug]);
  const activeTab = composerTabs.find((tab) => tab.key === draft.contentType) || composerTabs[0];
  const bodyLimit = draft.contentType === "short_post" ? 500 : 5000;
  const hasUnsavedDraft = Boolean(draft.title || draft.body || draft.mediaUrl || draft.tags || draft.pollQuestion);
  const requiresTitle = draft.contentType === "discussion";
  const requiresVideo = draft.contentType === "reel";
  const canPublish = !busy && draft.communitySlug && (!requiresTitle || draft.title.trim()) && (requiresVideo ? draft.mediaUrl.trim() : draft.contentType === "standard_post" ? (draft.body.trim() || draft.mediaUrl.trim()) : draft.body.trim());

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function resetDraft() {
    if (hasUnsavedDraft && !window.confirm("Discard this draft?")) return;
    const next = emptyDraft(initialCommunity, initialType);
    setDraft(next);
    localStorage.removeItem(draftKey);
  }

  function mediaPayload() {
    if (!draft.mediaUrl.trim()) return [];
    return [{
      kind: draft.contentType === "reel" ? "video" : "image",
      url: draft.mediaUrl.trim(),
      thumbnailUrl: draft.thumbnailUrl.trim(),
      altText: draft.altText.trim()
    }];
  }

  function pollPayload() {
    if (draft.contentType !== "short_post" || !draft.pollQuestion.trim()) return null;
    return {
      question: draft.pollQuestion.trim(),
      options: draft.pollOptions.split("\n").map((item) => item.trim()).filter(Boolean)
    };
  }

  async function submit(event) {
    event.preventDefault();
    if (!canPublish) return;
    setBusy(true);
    setMessage("");
    const result = await api("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        contentType: draft.contentType,
        communitySlug: draft.communitySlug,
        title: draft.title.trim(),
        body: draft.body.trim(),
        media: mediaPayload(),
        thumbnailUrl: draft.thumbnailUrl.trim(),
        altText: draft.altText.trim(),
        topicTags: draft.tags.split(",").map((item) => item.trim()).filter(Boolean),
        language: draft.language,
        visibility: draft.visibility,
        poll: pollPayload()
      })
    });
    setBusy(false);
    if (!result?.post) {
      setMessage("Continue incognito or sign in before publishing. If you entered media, confirm it is a safe http(s) URL.");
      onAuth?.();
      return;
    }
    localStorage.removeItem(draftKey);
    if (result.post.contentType === "discussion") navigate(`/discussions/${result.post.slug || result.post.id}`);
    else navigate(`/dashboard?type=${result.post.contentType}`);
  }

  return (
    <div className="app-page discussion-create-page unified-create-page">
      <PageIntro
        eyebrow="Create"
        title="Publish into Strango."
        copy="Choose the right format for the moment: a discussion, short post, standard post, or reel. Drafts are saved locally on this device."
        action={<Link className="button button-secondary" to="/dashboard"><Icon name="close" size={17} /> Cancel</Link>}
      />

      <div className="composer-shell">
        <aside className="composer-type-panel">
          {composerTabs.map((tab) => (
            <button className={draft.contentType === tab.key ? "active" : ""} type="button" key={tab.key} onClick={() => update("contentType", tab.key)}>
              <strong>{tab.label}</strong><span>{tab.hint}</span>
            </button>
          ))}
        </aside>

        <form className="premium-composer-form" onSubmit={submit}>
          <header><p className="eyebrow">{activeTab.label}</p><h2>{activeTab.hint}</h2></header>

          <label><span>Community</span><select value={draft.communitySlug} onChange={(event) => update("communitySlug", event.target.value)} required>{communities.map((community) => <option value={community.slug} key={community.slug}>{community.name}</option>)}</select><small>Community publishing is enforced by the current backend.</small></label>

          {draft.contentType === "discussion" && <label><span>Discussion title</span><input ref={titleInput} value={draft.title} onChange={(event) => update("title", event.target.value)} maxLength={180} placeholder="What do you want people to unpack?" required /><small>{draft.title.length}/180</small></label>}

          {draft.contentType !== "discussion" && draft.contentType !== "short_post" && <label><span>Optional title</span><input value={draft.title} onChange={(event) => update("title", event.target.value)} maxLength={180} placeholder={draft.contentType === "reel" ? "Reel title" : "Post title"} /><small>{draft.title.length}/180</small></label>}

          <label><span>{draft.contentType === "reel" ? "Caption" : draft.contentType === "short_post" ? "Short text" : "Text"}</span><textarea value={draft.body} onChange={(event) => update("body", event.target.value.slice(0, bodyLimit))} maxLength={bodyLimit} placeholder={draft.contentType === "short_post" ? "Share a concise thought..." : "Write with useful context..."} required={draft.contentType !== "standard_post" && draft.contentType !== "reel"} /><small>{draft.body.length}/{bodyLimit}</small></label>

          <div className="composer-grid-two">
            <label><span>{draft.contentType === "reel" ? "Video URL" : "Image URL"}</span><input type="url" value={draft.mediaUrl} onChange={(event) => update("mediaUrl", event.target.value)} placeholder="https://..." required={draft.contentType === "reel"} /><small>{draft.contentType === "reel" ? "Use a hosted mp4/webm URL until production upload storage is configured." : "Optional hosted image URL."}</small></label>
            <label><span>Thumbnail URL</span><input type="url" value={draft.thumbnailUrl} onChange={(event) => update("thumbnailUrl", event.target.value)} placeholder="https://..." /></label>
          </div>

          <label><span>Alt or accessibility text</span><input value={draft.altText} onChange={(event) => update("altText", event.target.value)} maxLength={180} placeholder="Describe the media for accessibility" /></label>

          {draft.contentType === "short_post" && <section className="composer-poll-box"><p className="eyebrow">Optional poll</p><label><span>Question</span><input value={draft.pollQuestion} onChange={(event) => update("pollQuestion", event.target.value)} maxLength={160} placeholder="Ask a quick poll question" /></label><label><span>Options</span><textarea value={draft.pollOptions} onChange={(event) => update("pollOptions", event.target.value)} placeholder={"One option per line\nYes\nNo"} /></label></section>}

          <div className="composer-grid-two">
            <label><span>Topic tags</span><input value={draft.tags} onChange={(event) => update("tags", event.target.value)} placeholder="AI, tools, workflow" /></label>
            <label><span>Language</span><input value={draft.language} onChange={(event) => update("language", event.target.value)} /></label>
          </div>

          <label><span>Audience</span><select value={draft.visibility} onChange={(event) => update("visibility", event.target.value)}><option value="community">Community members</option><option value="public">Public</option><option value="private">Only me</option></select><small>Only choices the current backend can store are shown.</small></label>

          {message && <p className="form-error">{message}</p>}
          <section className="composer-preview"><p className="eyebrow">Preview</p><h3>{draft.title || selectedCommunity?.name || "Untitled"}</h3><p>{draft.body || "Your post text will appear here."}</p>{draft.mediaUrl && <span>{draft.contentType === "reel" ? "Video" : "Media"}: {draft.mediaUrl}</span>}</section>

          <div className="discussion-publish-bar"><span>{selectedCommunity ? `Publishing in ${selectedCommunity.name}` : "Choose a community"}</span><div><button className="button button-secondary" type="button" onClick={resetDraft}>Discard draft</button><button className="button button-primary button-large" type="submit" disabled={!canPublish}>{busy ? "Publishing..." : "Publish"} <Icon name="arrow" size={17} /></button></div></div>
        </form>
      </div>
    </div>
  );
}