import crypto from 'node:crypto';

const code = process.argv.slice(2).join(' ');

if (!code) {
  console.error('Usage: npm run hash-code -- "secret-code"');
  process.exit(1);
}

console.log(crypto.createHash('sha256').update(code).digest('hex'));
