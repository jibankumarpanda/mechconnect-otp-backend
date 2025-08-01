require('dotenv').config(); // ✅ Load env first
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Twilio Credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = '+18573823729'; // Your verified Twilio number

const client = new twilio(accountSid, authToken);

// OTP store
let otpStore = {}; // Format: { phone: { otp, expires } }

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// ✅ Send OTP
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = generateOTP();

  otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min

  try {
    await client.messages.create({
      body: `Your MechConnect OTP is ${otp}`,
      to: `+91${phone}`,
      from: twilioPhone
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Twilio error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
});

// ✅ Verify OTP
app.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const record = otpStore[phone];

  if (!record) {
    return res.status(400).json({ verified: false, message: 'No OTP sent to this number.' });
  }

  const now = Date.now();
  if (now > record.expires) {
    delete otpStore[phone];
    return res.status(400).json({ verified: false, message: 'OTP expired.' });
  }

  if (record.otp == otp) {
    delete otpStore[phone];
    return res.json({ verified: true, message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ verified: false, message: 'Invalid OTP' });
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ OTP backend running on port ${port}`);
});

