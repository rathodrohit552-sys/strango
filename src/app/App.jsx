import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { api } from "./api";
import { AppShell, AuthModal } from "../components/Layout";
import HomePage from "../pages/HomePage";
import {
  CommunitiesPage,
  CommunityPage,
  AnonymousChatPage,
  DashboardPage,
  DiscussionPage,
  DiscussionsPage,
  LivePage,
  MessagesPage,
  NotificationsPage,
  ProfilePage,
  RoomsPage,
  SparksPage,
  StaticInfoPage
} from "../pages/PlatformPages";
import CreateDiscussionPage from "../pages/CreateDiscussionPage";
import PlutoPage from "../pages/PlutoPage";

const appPaths = ["/dashboard", "/communities", "/discussions", "/live", "/rooms", "/messages", "/notifications", "/sparks", "/profile", "/pluto"];

function ParticipantRoute({ children }) {
  const [access, setAccess] = useState("checking");

  useEffect(() => {
    let active = true;
    api("/api/session").then((data) => {
      if (!active) return;
      setAccess(["incognito", "profile"].includes(data?.user?.mode) ? "allowed" : "homepage");
    });
    return () => { active = false; };
  }, []);

  if (access === "checking") {
    return <div className="route-loading" role="status"><span /><p>Opening your Strango space...</p></div>;
  }

  return access === "allowed" ? children : <Navigate to="/" replace />;
}

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();
  const inApp = appPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const openAuth = () => setAuthOpen(true);

  const routes = (
    <Routes>
      <Route path="/" element={<HomePage onAuth={openAuth} />} />
      <Route path="/chat" element={<AnonymousChatPage />} />
      <Route path="/dashboard" element={<ParticipantRoute><DashboardPage onAuth={openAuth} /></ParticipantRoute>} />
      <Route path="/communities" element={<CommunitiesPage onAuth={openAuth} />} />
      <Route path="/communities/:slug" element={<CommunityPage onAuth={openAuth} />} />
      <Route path="/discussions" element={<DiscussionsPage onAuth={openAuth} />} />
      <Route path="/discussions/new" element={<CreateDiscussionPage onAuth={openAuth} />} />
      <Route path="/discussions/:slug" element={<DiscussionPage onAuth={openAuth} />} />
      <Route path="/live" element={<LivePage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/messages" element={<ParticipantRoute><MessagesPage /></ParticipantRoute>} />
      <Route path="/notifications" element={<ParticipantRoute><NotificationsPage /></ParticipantRoute>} />
      <Route path="/sparks" element={<ParticipantRoute><SparksPage /></ParticipantRoute>} />
      <Route path="/profile" element={<ParticipantRoute><ProfilePage /></ParticipantRoute>} />
      <Route path="/pluto" element={<PlutoPage />} />
      <Route path="/about" element={<StaticInfoPage type="about" />} />
      <Route path="/contact" element={<StaticInfoPage type="contact" />} />
      <Route path="/faq" element={<StaticInfoPage type="faq" />} />
      <Route path="/support" element={<StaticInfoPage type="support" />} />
      <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <>
      {inApp ? <AppShell onAuth={openAuth}>{routes}</AppShell> : routes}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
