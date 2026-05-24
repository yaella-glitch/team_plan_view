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
  '057ba03d6c44104863dc7361fe4578965d1887360f90a0895882e58a6248fc86';

/** Bump this version to invalidate all unlocked sessions (e.g., after a password rotation). */
export const ACCESS_VERSION = 1;
