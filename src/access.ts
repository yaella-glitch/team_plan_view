/**
 * Password gate — client-side, obscurity not security.
 *
 * The constant below is the SHA-256 hash of the access password.
 * To change the password:
 *   1. Run:  npm run gen-password "your-new-password"
 *   2. Replace PASSWORD_HASH below with the printed hex string.
 *   3. Commit + push. GitHub Pages redeploys automatically.
 *
 * Whoever knows the password can access. To "revoke" everyone, change the password
 * and re-share. Local "unlocked" flags in their browsers will be invalidated.
 *
 * Default password for the placeholder hash below is:  changeme
 *   (Run: echo -n "changeme" | shasum -a 256  → 9bd9d105e9d0fdaa2bcd84cad9c1f1...)
 */

// SHA-256 of "changeme" — replace with your own. Run: npm run gen-password "yourpass"
export const PASSWORD_HASH =
  'ff4ae065c5c2fac3fc1405a0bd7bb95b7b6f00be85141867d4fdc4bc70a76701';

/**
 * SHA-256 of the ADMIN password — required to open the admin drawer.
 * This is separate from PASSWORD_HASH so viewers with the page password can
 * browse but cannot edit. Default is "admin" — change it for real use.
 *
 *   echo -n "your-admin-password" | shasum -a 256
 */
export const ADMIN_PASSWORD_HASH =
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

/** Bump this version to invalidate all unlocked sessions (e.g., after a password rotation). */
export const ACCESS_VERSION = 1;
