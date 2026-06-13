import React, { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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

const appPaths = ["/dashboard", "/communities", "/discussions", "/live", "/rooms", "/messages", "/notifications", "/sparks", "/profile"];

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();
  const inApp = appPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const openAuth = () => setAuthOpen(true);

  const routes = (
    <Routes>
      <Route path="/" element={<HomePage onAuth={openAuth} />} />
      <Route path="/chat" element={<AnonymousChatPage />} />
      <Route path="/dashboard" element={<DashboardPage onAuth={openAuth} />} />
      <Route path="/communities" element={<CommunitiesPage onAuth={openAuth} />} />
      <Route path="/communities/:slug" element={<CommunityPage onAuth={openAuth} />} />
      <Route path="/discussions" element={<DiscussionsPage onAuth={openAuth} />} />
      <Route path="/discussions/:slug" element={<DiscussionPage onAuth={openAuth} />} />
      <Route path="/live" element={<LivePage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/sparks" element={<SparksPage />} />
      <Route path="/profile" element={<ProfilePage />} />
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
