const icons = {
  brain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 3 3"/><path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-3 3"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M9 8h6"/><path d="M9 16h6"/></svg>',
  gamepad: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11h4"/><path d="M8 9v4"/><path d="M15 12h.01"/><path d="M18 10h.01"/><path d="M6.5 17h11a4 4 0 0 0 3.8-5.3l-1.2-3.5A4 4 0 0 0 16.3 5H7.7a4 4 0 0 0-3.8 3.2l-1.2 3.5A4 4 0 0 0 6.5 17Z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5"/><path d="M4 19h18"/><path d="M8 16v-5"/><path d="M13 16V8"/><path d="M18 16v-9"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></svg>',
  film: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v14H4z"/><path d="M4 11h16"/><path d="M8 7l2-4"/><path d="M14 7l2-4"/><path d="M9 15l4 2.5v-5L9 15Z"/></svg>',
  clapper: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v14H4z"/><path d="M4 11h16"/><path d="M4 7l3-4h13"/><path d="M8 7l3-4"/><path d="M12 7l3-4"/><path d="M16 7l3-4"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z"/><path d="M6 14l.8 2.4L9 17l-2.2.6L6 20l-.8-2.4L3 17l2.2-.6L6 14Z"/><path d="M18 14l.8 2.4L21 17l-2.2.6L18 20l-.8-2.4L15 17l2.2-.6L18 14Z"/></svg>',
  flower: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12c3.5-4.2 7.5-2.4 7.5.8 0 3.4-4.1 4.6-7.5-.8Z"/><path d="M12 12c-3.5-4.2-7.5-2.4-7.5.8 0 3.4 4.1 4.6 7.5-.8Z"/><path d="M12 12c-4.2 3.5-2.4 7.5.8 7.5 3.4 0 4.6-4.1-.8-7.5Z"/><path d="M12 12c4.2 3.5 2.4 7.5-.8 7.5-3.4 0-4.6-4.1.8-7.5Z"/><path d="M12 12c-3.5-4.2-1.7-7.5 1.5-7.5 3.1 0 4 3.8-1.5 7.5Z"/><circle cx="12" cy="12" r="1.8"/></svg>',
  football: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10l4-3Z"/><path d="M12 7V3"/><path d="M16 10l4-1"/><path d="M14.5 15l2.5 4"/><path d="M9.5 15L7 19"/><path d="M8 10L4 9"/></svg>'
};

export function renderCommunityIcon(icon) {
  return icons[icon] || icons.spark;
}
