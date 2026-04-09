const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const generateJWT = () => {
  const payload = {
    userId: process.env.TEST_USER_ID || 'test-user-123',
    role: process.env.TEST_USER_ROLE || 'user',
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    timestamp: Date.now(),
  };
  
  const secret = process.env.JWT_SECRET || 'aggregation-service';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  
  const token = jwt.sign(payload, secret, { expiresIn });
  
  console.log('\n🔐 JWT Token Generated\n');
  console.log('Token:', token);
  console.log('\n📋 Token Details:');
  console.log('  User ID:', payload.userId);
  console.log('  Role:', payload.role);
  console.log('  Expires:', expiresIn);
  console.log('\n💡 Usage:');
  console.log(`  curl -X POST http://localhost:3000/api/tasks \\`);
  console.log(`    -H "Authorization: Bearer ${token}" \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"taskType":"full_aggregation"}'`);
  console.log();
  
  return token;
};

// Generate token if script is run directly
if (require.main === module) {
  generateJWT();
}

module.exports = generateJWT;