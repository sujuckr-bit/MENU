const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2a$10$APrA8edtcQGw9KPe4d0TXuOajhoGg7KWpZksL4dN8NileX5vuIid2';
  const pwd = 'Bazar@Secure123!';
  
  console.log('Testing bcrypt.compare...');
  const match = await bcrypt.compare(pwd, hash);
  console.log('Password match:', match);
  
  if (!match) {
    console.log('\nPassword mismatch! Generating new hash...');
    const newHash = await bcrypt.hash(pwd, 10);
    console.log('New hash:', newHash);
  }
}

test().catch(e => console.error('Error:', e));
