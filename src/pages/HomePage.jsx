import React from "react";
import { Link } from "react-router-dom";
import { communities, discussions, liveConversations } from "../app/data";
import { AdSlot, CommunityCard, DiscussionCard, Icon, LiveCard, Logo, SectionHeading } from "../components/UI";
import { PublicHeader } from "../components/Layout";

function FinanceCard({ title, copy, href, symbol }) {
  return (
    <a className="finance-tool" href={href}>
      <span>{symbol}</span><div><h3>{title}</h3><p>{copy}</p></div><Icon name="arrow" />
    </a>
  );
}

export default function HomePage({ onAuth }) {
  return (
    <div className="public-page">
      <PublicHeader onAuth={onAuth} />
      <main>
        <section className="home-hero">
          <div className="hero-copy">
            <p className="eyebrow">Observe. Talk. Connect.</p>
            <h1>Talk. Discover.<br /><em>Connect.</em></h1>
            <p>Join communities, discussions, and conversations that matter. Start anonymously, then stay for the people and ideas you find.</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to="/chat">Start chatting <Icon name="arrow" /></Link>
              <Link className="button button-secondary button-large" to="/communities">Explore communities</Link>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars"><span>MS</span><span>AK</span><span>NP</span><span>+</span></div>
              <p><strong>12,800+ conversations</strong><br />happening this week</p>
            </div>
          </div>
          <div className="hero-social-preview" aria-label="Strango conversation preview">
            <div className="preview-orbit orbit-one">Finance</div>
            <div className="preview-orbit orbit-two">Gaming</div>
            <div className="preview-orbit orbit-three">Technology</div>
            <div className="preview-window">
              <div className="preview-head"><span className="presence"><i /></span><div><strong>Someone curious</strong><small>online now</small></div><Icon name="more" /></div>
              <div className="preview-messages">
                <p>What is one idea you changed your mind about recently?</p>
                <p className="message-out">That productivity is about doing more. I think it is mostly about choosing better.</p>
                <p className="typing-bubble"><i /><i /><i /></p>
              </div>
              <div className="preview-input"><span>Write a message...</span><Link to="/chat" aria-label="Open anonymous chat"><Icon name="arrow" /></Link></div>
            </div>
          </div>
        </section>

        <section className="content-section">
          <SectionHeading eyebrow="Find your people" title="Featured communities" copy="Focused spaces for the subjects, goals, and questions you care about." action={<Link className="text-link" to="/communities">View all <Icon name="arrow" size={16} /></Link>} />
          <div className="community-grid">{communities.slice(0, 4).map((community) => <CommunityCard community={community} key={community.slug} onJoin={() => { onAuth(); return false; }} />)}</div>
        </section>

        <section className="content-section split-section">
          <div>
            <SectionHeading eyebrow="What people are thinking" title="Trending discussions" copy="Questions and ideas gaining momentum across Strango." />
            <div className="discussion-list">{discussions.slice(0, 3).map((discussion) => <DiscussionCard discussion={discussion} key={discussion.id} />)}</div>
            <Link className="button button-secondary" to="/discussions">Explore discussions</Link>
          </div>
          <aside className="daily-summary">
            <span className="summary-icon"><Icon name="spark" /></span>
            <p className="eyebrow">AI community summary</p>
            <h3>Today in Finance Circle</h3>
            <ul><li>Investors compared SIP and lump-sum strategies.</li><li>Members unpacked updated budget priorities.</li><li>A beginner-friendly tax checklist gained traction.</li></ul>
            <Link className="text-link" to="/communities/finance">Read the community <Icon name="arrow" size={16} /></Link>
          </aside>
        </section>

        <section className="content-section live-section">
          <SectionHeading eyebrow="Happening now" title="Live conversations" copy="Drop into a topic, listen first, and join when you are ready." action={<Link className="text-link" to="/live">All live conversations <Icon name="arrow" size={16} /></Link>} />
          <div className="live-grid">{liveConversations.slice(0, 4).map((item) => <LiveCard conversation={item} key={item.id} />)}</div>
        </section>

        <section className="content-section finance-section">
          <SectionHeading eyebrow="Useful by design" title="Quick finance tools" copy="Simple calculators for everyday money decisions." />
          <div className="finance-grid">
            <FinanceCard title="EMI Calculator" copy="Plan monthly loan payments." href="/emi-calculator" symbol="%" />
            <FinanceCard title="SIP Calculator" copy="Project long-term investments." href="/sip-calculator" symbol="↗" />
            <FinanceCard title="GST Calculator" copy="Add or remove GST quickly." href="/gst-calculator" symbol="₹" />
          </div>
        </section>

        <section className="trust-band">
          <div><p className="eyebrow">A calmer social platform</p><h2>Be anonymous without being invisible.</h2><p>Strango separates identity from contribution. Participate privately, earn trust through helpful actions, and decide when to show your profile.</p></div>
          <div className="trust-points">
            <article><span>01</span><h3>Ghost first</h3><p>Browse for five minutes without creating an account.</p></article>
            <article><span>02</span><h3>Reputation follows value</h3><p>Sparks recognize participation and helpful replies.</p></article>
            <article><span>03</span><h3>You control identity</h3><p>Move between incognito and profile modes intentionally.</p></article>
          </div>
        </section>
        <AdSlot />
      </main>
      <footer className="site-footer">
        <div className="footer-lead"><Logo /><p>A modern social platform for conversations that turn into connection.</p></div>
        <div><h3>Platform</h3><Link to="/communities">Communities</Link><Link to="/discussions">Discussions</Link><Link to="/live">Live</Link><Link to="/rooms">Rooms</Link></div>
        <div><h3>Company</h3><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/faq">FAQ</Link><Link to="/support">Support</Link></div>
        <div><h3>Legal</h3><a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms</a><a href="/community-guidelines">Guidelines</a></div>
        <p className="footer-base">© 2026 Strango. Observe. Talk. Connect.</p>
      </footer>
    </div>
  );
}
