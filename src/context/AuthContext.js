// Re-export the shared useAuth hook so any imports that reference
// `context/AuthContext.js` will use the canonical hook from `hooks/useAuth.js`.
export { useAuth } from '../hooks/useAuth';

// Also export a no-op default to avoid import errors in files expecting a default export.
export default undefined;