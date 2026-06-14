import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mergeCommunities } from "../app/api";
import { communities as communityDesigns } from "../app/data";
import { CommunityCard, DiscussionCard, Icon, Logo, SectionHeading } from "../components/UI";
import { PublicHeader } from "../components/Layout";

const constellationLayout = [
  { slug: "ai", x: "24%", y: "19%", color: "#a78bfa", delay: "-1.2s" },
  { slug: "technology", x: "60%", y: "13%", color: "#38bdf8", delay: "-3.8s" },
  { slug: "gaming", x: "82%", y: "38%", color: "#4ade80", delay: "-5.1s" },
  { slug: "movies", x: "76%", y: "75%", color: "#fb7185", delay: "-2.4s" },
  { slug: "self-improvement", x: "43%", y: "86%", color: "#f97316", delay: "-4.4s" },
  { slug: "finance", x: "16%", y: "68%", color: "#fbbf24", delay: "-6.2s" }
];

const constellationPaths = [
  ["constellation-ai", "M320 260 L154 99"],
  ["constellation-technology", "M320 260 L384 68"],
  ["constellation-gaming", "M320 260 L525 198"],
  ["constellation-movies", "M320 260 L486 390"],
  ["constellation-growth", "M320 260 L275 447"],
  ["constellation-finance", "M320 260 L102 354"],
  ["constellation-top", "M154 99 Q270 25 384 68"],
  ["constellation-right", "M525 198 Q570 300 486 390"],
  ["constellation-bottom", "M486 390 Q380 490 275 447"],
  ["constellation-left", "M275 447 Q120 455 102 354"]
];

const internationalHeroCopy = {
  ar: { eyebrow: "ابدأ بالمحادثة", line1: "تحدث أولاً،", line2: "ثم تعارف.", intro: "ابدأ بمحادثة صادقة، ثم اكتشف الأشخاص والمجتمعات التي تشاركك الاهتمام." },
  es: { eyebrow: "La conversación va primero", line1: "Primero hablamos,", line2: "luego conectamos.", intro: "Empieza con una conversación honesta y encuentra personas que comparten tu curiosidad." },
  fr: { eyebrow: "La conversation d'abord", line1: "Parlons d'abord,", line2: "rencontrons-nous ensuite.", intro: "Commencez par une conversation sincère et trouvez des personnes qui partagent votre curiosité." },
  ja: { eyebrow: "会話から始まるつながり", line1: "まず話して、", line2: "それからつながる。", intro: "ひとつの素直な会話から、同じ好奇心を持つ人やコミュニティを見つけよう。" }
};

function getHeroCopy() {
  const language = (navigator.language || "en").toLowerCase();
  const code = language.split("-")[0];
  const southAsianLanguages = ["as", "bn", "gu", "hi", "kn", "ml", "mr", "ne", "or", "pa", "si", "ta", "te", "ur"];

  if (southAsianLanguages.includes(code)) {
    return {
      eyebrow: "Conversation before connection",
      line1: "Pehle Baat,",
      line2: "Phir Mulakat.",
      intro: "Start with one honest conversation. Find people who think, build, learn, and care about the same things you do."
    };
  }

  return internationalHeroCopy[code] || {
    eyebrow: "Conversation before connection",
    line1: "Talk first,",
    line2: "meet after.",
    intro: "Start with one honest conversation. Find people who share your curiosity, interests, and point of view."
  };
}

function CommunityConstellation() {
  const nodes = constellationLayout.map((item) => ({
    ...item,
    community: communityDesigns.find((community) => community.slug === item.slug)
  })).filter((item) => item.community);

  return (
    <div className="community-constellation" aria-label="Communities connected through conversation">
      <div className="constellation-glow" />
      <svg className="constellation-network" viewBox="0 0 640 520" aria-hidden="true">
        <defs>
          <linearGradient id="constellation-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a78bfa" stopOpacity=".18" />
            <stop offset=".5" stopColor="#5eead4" stopOpacity=".72" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity=".18" />
          </linearGradient>
          <filter id="constellation-soft-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {constellationPaths.map(([id, d]) => <path className="constellation-line" id={id} d={d} key={id} />)}
        {constellationPaths.slice(0, 6).map(([id], index) => (
          <circle className="constellation-particle" r="2.4" key={`particle-${id}`} filter="url(#constellation-soft-glow)">
            <animateMotion dur={`${7.5 + index * .7}s`} begin={`${index * -.9}s`} repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        ))}
      </svg>

      <div className="constellation-core">
        <span className="constellation-core-pulse" />
        <small>Conversation</small>
        <strong>Connection</strong>
        <span>Community</span>
      </div>

      {nodes.map(({ community, x, y, color, delay }) => (
        <Link
          className="constellation-node"
          to={`/communities/${community.slug}`}
          key={community.slug}
          style={{ "--node-x": x, "--node-y": y, "--node-color": color, "--node-delay": delay }}
          aria-label={`Explore ${community.name}`}
        >
          <span className="constellation-node-orbit" />
          <span className="constellation-node-mark">{community.icon}</span>
          <span className="constellation-node-copy"><small>{community.category}</small><strong>{community.name}</strong></span>
        </Link>
      ))}

      <div className="constellation-caption">
        <i />
        <span>Ideas are moving between communities</span>
      </div>
    </div>
  );
}

export default function HomePage({ onAuth }) {
  const heroCopy = getHeroCopy();
  const [communities, setCommunities] = useState(communityDesigns);
  const [discussions, setDiscussions] = useState([]);
  const [liveConversations, setLiveConversations] = useState([]);

  useEffect(() => {
    api("/api/communities").then((data) => {
      if (data?.communities) setCommunities(mergeCommunities(data.communities, communityDesigns));
    });
    api("/api/discussions").then((data) => setDiscussions(data?.discussions || []));
    api("/api/live").then((data) => setLiveConversations((data?.conversations || []).map((item) => ({
      ...item,
      people: item.participantCount || 0,
      accent: "#14b8a6",
      speakers: []
    }))));
  }, []);

  return (
    <div className="public-page">
      <PublicHeader onAuth={onAuth} />
      <main>
        <section className="home-hero">
          <div className="hero-copy">
            <p className="eyebrow">{heroCopy.eyebrow}</p>
            <h1>{heroCopy.line1}<br /><em>{heroCopy.line2}</em></h1>
            <p>{heroCopy.intro}</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to="/chat">Start chatting <Icon name="arrow" /></Link>
              <Link className="button button-secondary button-large" to="/communities">Explore communities</Link>
            </div>
            <div className="hero-principles" aria-label="How Strango works">
              <span>Conversation</span><i /><span>Connection</span><i /><span>Community</span>
            </div>
          </div>
          <CommunityConstellation />
        </section>

        <section className="content-section home-community-section">
          <SectionHeading
            eyebrow="Find your corner"
            title="Every community has its own energy."
            copy="Distinct spaces for the subjects, goals, and questions you care about, each with its own identity and rhythm."
            action={<Link className="text-link" to="/communities">Explore all <Icon name="arrow" size={16} /></Link>}
          />
          <div className="community-grid home-community-grid">
            {communities.slice(0, 6).map((community) => (
              <CommunityCard community={community} key={community.slug} onJoin={() => { onAuth(); return false; }} />
            ))}
          </div>
        </section>

        <section className="content-section home-conversation-section">
          <div className="conversation-story">
            <p className="eyebrow">From hello to belonging</p>
            <h2>Built for conversations that go somewhere.</h2>
            <p>Listen first, join when you are ready, and let shared curiosity turn a stranger into someone worth knowing.</p>
            <div className="conversation-steps">
              <article><span>01</span><div><h3>Start privately</h3><p>Open with a thoughtful prompt or your own question.</p></div></article>
              <article><span>02</span><div><h3>Find common ground</h3><p>Follow the ideas, not the follower count.</p></div></article>
              <article><span>03</span><div><h3>Stay for the community</h3><p>Move naturally into discussions, rooms, and focused spaces.</p></div></article>
            </div>
            <Link className="button button-primary button-large" to="/chat">Have your first conversation <Icon name="arrow" /></Link>
          </div>

          <div className="conversation-now">
            <div className="conversation-now-head">
              <div><p className="eyebrow">Alive right now</p><h3>Conversations with momentum</h3></div>
              <Link className="text-link" to="/live">See live <Icon name="arrow" size={15} /></Link>
            </div>
            <div className="home-live-list">
              {liveConversations.length ? liveConversations.slice(0, 3).map((item) => (
                <Link to="/live" key={item.id} style={{ "--live-accent": item.accent }}>
                  <span className="home-live-signal"><i /><i /><i /></span>
                  <span><small>{item.topic}</small><strong>{item.title}</strong></span>
                  <Icon name="arrow" size={18} />
                </Link>
              )) : <div className="honest-empty"><strong>No live conversations yet</strong><span>Start a room when you are ready.</span></div>}
            </div>
            <div className="home-discussion-preview">
              <div className="conversation-now-head">
                <div><p className="eyebrow">Open discussions</p><h3>Ideas people are unpacking</h3></div>
                <Link className="text-link" to="/discussions">View all <Icon name="arrow" size={15} /></Link>
              </div>
              <div className="discussion-list">
                {discussions.length ? discussions.slice(0, 2).map((discussion) => <DiscussionCard discussion={discussion} key={discussion.id} />) : <div className="honest-empty"><strong>No discussions yet</strong><span>Be the first person to ask something worth answering.</span></div>}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer home-footer">
        <div className="footer-lead"><Logo /><p>Conversations that turn into connection, and connection that grows into community.</p></div>
        <div><h3>Discover</h3><Link to="/communities">Communities</Link><Link to="/discussions">Discussions</Link><Link to="/live">Live</Link></div>
        <div><h3>Strango</h3><Link to="/about">About</Link><Link to="/faq">FAQ</Link><Link to="/support">Support</Link></div>
        <div><h3>Legal</h3><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a><a href="/community-guidelines">Guidelines</a></div>
        <p className="footer-base">&copy; 2026 Strango. Pehle Baat, Phir Mulakat.</p>
      </footer>
    </div>
  );
}
