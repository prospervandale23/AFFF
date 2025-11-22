const jwt = require('jsonwebtoken');
const fs = require('fs');

// =====================================================
// CONFIGURATION - EDIT THESE 4 VALUES
// =====================================================

const TEAM_ID = '77J6U6F554';
const SERVICES_ID = 'com.pvandale766.fishingbuddy.auth';
const KEY_ID = '5Z38SY47JM';  // From .p8 filename: AuthKey_XXXXX.p8
const KEY_PATH = 'C:\\Users\\prosp\\Downloads\\AuthKey_5Z38SY47JM.p8';  // Full path to .p8 file

// =====================================================
// GENERATE TOKEN
// =====================================================

const privateKey = fs.readFileSync(KEY_PATH, 'utf8');

const token = jwt.sign(
  {},
  privateKey,
  {
    algorithm: 'ES256',
    expiresIn: '180d',
    audience: 'https://appleid.apple.com',
    issuer: TEAM_ID,
    subject: SERVICES_ID,
    keyid: KEY_ID,
  }
);

console.log(token);