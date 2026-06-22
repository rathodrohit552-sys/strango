const IDENTITY_PREFERENCE_KEY = "strango.identity.preference";
const IDENTITY_PROMPT_DISMISSED_KEY = "strango.identity.promptDismissed";

function readStorage(storage, key) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStorage(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

function removeStorage(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

export function rememberIdentityPreference(mode) {
  if (!mode) return;
  writeStorage(window.localStorage, IDENTITY_PREFERENCE_KEY, JSON.stringify({ mode, updatedAt: new Date().toISOString() }));
  removeStorage(window.sessionStorage, IDENTITY_PROMPT_DISMISSED_KEY);
}

export function getIdentityPreference() {
  const value = readStorage(window.localStorage, IDENTITY_PREFERENCE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return { mode: value };
  }
}

export function dismissIdentityPrompt() {
  writeStorage(window.sessionStorage, IDENTITY_PROMPT_DISMISSED_KEY, "1");
}

export function isIdentityPromptDismissed() {
  return readStorage(window.sessionStorage, IDENTITY_PROMPT_DISMISSED_KEY) === "1";
}

export function shouldAutoOpenIdentityPrompt(user) {
  if (["incognito", "profile"].includes(user?.mode)) return false;
  return !getIdentityPreference() && !isIdentityPromptDismissed();
}

export function getDiscussionIdentity(user) {
  if (user?.mode === "profile") {
    const name = user?.profile?.display_name || "Strango Member";
    return { name, avatar: name, anonymous: false };
  }
  if (user?.mode === "incognito") {
    return { name: "Anonymous User", avatar: `A${user?.strangerNumber || ""}`, anonymous: true };
  }
  return { name: "A person", avatar: "AP", anonymous: true };
}

export function getShellIdentityLabel(user) {
  if (user?.mode === "profile") return user?.profile?.display_name || "Strango Member";
  if (user?.mode === "ghost") return "Ghost Mode";
  if (user?.strangerNumber) return `Stranger #${user.strangerNumber}`;
  return "Anonymous User";
}

export function normalizeTypingName(name) {
  const value = String(name || "").trim();
  if (!value || /^(anonymous user|a person|ghost member|someone)$/i.test(value) || /^stranger #/i.test(value)) {
    return "Someone";
  }
  return value;
}

export function typingSummary(names) {
  const clean = [...new Set((names || []).map(normalizeTypingName).filter(Boolean))];
  if (!clean.length) return "";
  if (clean.length === 1) return `${clean[0]} is typing...`;
  if (clean.length === 2) return `${clean[0]} and ${clean[1]} are typing...`;
  return `${clean[0]} and ${clean.length - 1} others are typing...`;
}
