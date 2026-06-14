import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, mergeCommunities } from "../app/api";
import { communities as fallbackCommunities } from "../app/data";
import { Icon } from "../components/UI";
import { PageIntro } from "./PlatformPages";

const questionSuggestions = [
  "What changed your mind about this topic?",
  "What is the most useful lesson you learned the hard way?",
  "What is everyone overlooking right now?",
  "How would you explain this to someone just starting?",
  "What tradeoff matters most here?",
  "What would you do differently if you started again?"
];

export default function CreateDiscussionPage({ onAuth }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const titleInput = useRef(null);
  const [communities, setCommunities] = useState(fallbackCommunities);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communitySlug, setCommunitySlug] = useState(searchParams.get("community") || fallbackCommunities[0]?.slug || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/communities").then((data) => {
      const next = mergeCommunities(data?.communities, fallbackCommunities);
      if (next.length) setCommunities(next);
    });
    titleInput.current?.focus();
  }, []);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.slug === communitySlug),
    [communities, communitySlug]
  );

  function useSuggestion(suggestion) {
    setTitle(suggestion);
    window.requestAnimationFrame(() => titleInput.current?.focus());
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = await api("/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: title.trim(), content: content.trim(), communitySlug })
    });
    setBusy(false);

    if (!result?.post) {
      setMessage("Continue incognito or sign in before publishing.");
      onAuth?.();
      return;
    }

    navigate(`/discussions/${result.post.id}`);
  }

  return (
    <div className="app-page discussion-create-page">
      <PageIntro
        eyebrow="New discussion"
        title="Ask something worth answering."
        copy="A clear question and a little context are usually enough to begin a useful conversation."
        action={<Link className="button button-secondary" to="/discussions"><Icon name="close" size={17} /> Cancel</Link>}
      />

      <div className="discussion-create-layout">
        <form className="discussion-create-form" onSubmit={submit}>
          <label>
            <span>Community</span>
            <select value={communitySlug} onChange={(event) => setCommunitySlug(event.target.value)} required>
              {communities.map((community) => <option value={community.slug} key={community.slug}>{community.name}</option>)}
            </select>
          </label>

          <label>
            <span>Question</span>
            <input
              ref={titleInput}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              placeholder="What do you want to understand?"
              required
            />
            <small>{title.length}/160</small>
          </label>

          <section className="question-suggestions" aria-label="Question suggestions">
            <div><Icon name="spark" size={18} /><span><strong>Need a starting point?</strong><small>Choose one and make it your own.</small></span></div>
            <div className="question-suggestion-list">
              {questionSuggestions.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => useSuggestion(suggestion)}>{suggestion}</button>
              ))}
            </div>
          </section>

          <label>
            <span>Context</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={5000}
              placeholder="Add the detail people need to respond thoughtfully. What prompted the question? What have you tried or considered?"
              required
            />
            <small>{content.length}/5000</small>
          </label>

          {message && <p className="form-error">{message}</p>}
          <div className="discussion-publish-bar">
            <span>{selectedCommunity ? `Publishing in ${selectedCommunity.name}` : "Choose a community"}</span>
            <button className="button button-primary button-large" type="submit" disabled={busy || !title.trim() || !content.trim()}>
              {busy ? "Publishing..." : "Publish discussion"} <Icon name="arrow" size={17} />
            </button>
          </div>
        </form>

        <aside className="discussion-writing-guide">
          <p className="eyebrow">A useful question</p>
          <h2>Make it easy to join in.</h2>
          <div><span>01</span><p><strong>Lead with the real question.</strong> Keep the title focused enough to answer.</p></div>
          <div><span>02</span><p><strong>Add relevant context.</strong> Share the situation without writing an essay.</p></div>
          <div><span>03</span><p><strong>Invite different views.</strong> Curiosity creates better conversations than certainty.</p></div>
        </aside>
      </div>
    </div>
  );
}
