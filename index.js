require('dotenv').config(); // ✅ This must come first!
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Twilio credentials (from environment variables)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// ✅ Directly use your Twilio number instead of environment variable
const twilioPhone = '+18573823729';

const client = new twilio(accountSid, authToken);

// OTP memory store
let otpStore = {}; // { phone: { otp: 123456, expires: timestamp } }

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Send OTP route
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = generateOTP();
  otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5-minute validity

  try {
    await client.messages.create({
      body: `Your MechConnect OTP is ${otp}`,
      to: `+91${phone}`,  // Assuming you're sending to Indian numbers
      from: twilioPhone   // ✅ Your verified Twilio number
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ OTP backend running on port ${port}`);
});
