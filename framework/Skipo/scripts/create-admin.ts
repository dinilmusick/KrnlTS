import { createAdminAccountServerSide } from '../lib/auth-storage';

async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('Usage: npm run create-admin <email> <password>');
    console.error('Or set env vars ADMIN_EMAIL and ADMIN_PASSWORD');
    process.exit(1);
  }

  try {
    const admin = createAdminAccountServerSide(email, password, 'System Administrator');
    console.log(`[BOOTSTRAP SUCCESS] Admin account created: ID=${admin.id}, Email=${admin.email}`);
  } catch (err: any) {
    console.error(`[BOOTSTRAP ERROR] ${err.message}`);
    process.exit(1);
  }
}

main();
