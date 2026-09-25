// A random id kept in localStorage so the admin dashboard can count unique
// visitors (not just page views) without requiring a login - most tracked
// pages (landing, login, signup) are visited by guests.
const SESSION_KEY = 'exios_analytics_session_id';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getVisitorSessionId = (): string => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = createId();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch (error) {
    // Private browsing / blocked storage - fall back to a per-load id rather than throwing.
    return createId();
  }
};
