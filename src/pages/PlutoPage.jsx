import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/UI";

const plutoBenefits = [
  {
    icon: "message",
    title: "Conversation Vault",
    copy: "Privately save the conversations and moments you choose to keep."
  },
  {
    icon: "users",
    title: "Reconnect Pass",
    copy: "Create a consent-first path back to a meaningful anonymous connection."
  },
  {
    icon: "globe",
    title: "Universal Translation",
    copy: "Understand and respond across languages without leaving the conversation."
  },
  {
    icon: "spark",
    title: "AI Conversation Coach",
    copy: "Get quiet, optional guidance when a conversation needs a better opening."
  },
  {
    icon: "theme",
    title: "Custom Themes",
    copy: "Shape your space with refined colors and atmosphere that still feel like Strango."
  }
];

export default function PlutoPage() {
  return (
    <div className="app-page pluto-page">
      <section className="pluto-hero">
        <div className="pluto-orbit" aria-hidden="true"><i /><i /><i /><span>PLUTO</span></div>
        <div className="pluto-hero-copy">
          <p className="eyebrow">Strango Pluto · Coming soon</p>
          <h1>More depth for conversations worth keeping.</h1>
          <p>Pluto is an optional layer for continuity, expression, and understanding. The core Strango experience stays open and simple.</p>
          <div><a className="button button-primary button-large" href="#pluto-benefits">Explore Pluto</a><Link className="button button-secondary button-large" to="/chat">Start a conversation</Link></div>
          <small>No pricing or payment is available yet.</small>
        </div>
      </section>

      <section className="pluto-benefits" id="pluto-benefits">
        <div className="pluto-section-heading"><p className="eyebrow">Designed around conversation</p><h2>Five considered ways to make connection more useful.</h2></div>
        <div className="pluto-benefit-grid">
          {plutoBenefits.map((benefit, index) => (
            <article key={benefit.title}>
              <span><Icon name={benefit.icon} /></span>
              <small>0{index + 1}</small>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
