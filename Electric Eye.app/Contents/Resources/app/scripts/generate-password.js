#!/usr/bin/env node

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generatePasswordHash() {
  rl.question('Enter password to hash: ', async (password) => {
    if (!password || password.trim().length === 0) {
      console.error('Error: Password cannot be empty');
      rl.close();
      process.exit(1);
    }

    try {
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);

      console.log('\n===========================================');
      console.log('Password hashed successfully!');
      console.log('===========================================');
      console.log('\nAdd this to your .env file:');
      console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
      console.log('\n===========================================\n');
    } catch (error) {
      console.error('Error generating hash:', error.message);
    }

    rl.close();
  });
}

generatePasswordHash();
