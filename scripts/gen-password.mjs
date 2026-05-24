#!/usr/bin/env node
// Usage: npm run gen-password "your-password"
// Prints the SHA-256 hash to paste into src/access.ts

import { createHash } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run gen-password "your-password"');
  process.exit(1);
}

const hash = createHash('sha256').update(password).digest('hex');
console.log('\nSHA-256 hash:');
console.log(hash);
console.log('\nPaste this as PASSWORD_HASH in src/access.ts\n');
