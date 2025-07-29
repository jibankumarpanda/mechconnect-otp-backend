const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

// Twilio credentials (from environment variables)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);

app.use(cors());
app.use(bodyParser.json());

let otpStore = {}; // { phone: { otp: 123456, expires: timestamp } }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = generateOTP();
  otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 mins

  try {
    await client.messages.create({
      body: `Your MechConnect OTP is ${otp}`,
      to: `+91${phone}`,
      from: twilioPhone
    });
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const stored = otpStore[phone];

  if (!stored) return res.status(400).json({ success: false, message: 'No OTP sent' });

  if (Date.now() > stored.expires) {
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  if (parseInt(otp) !== stored.otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  delete otpStore[phone]; // Clear after use
  res.json({ success: true, message: 'OTP verified' });
});

app.get("/", (req, res) => {
  res.send("MechConnect OTP Backend Running!");
});

app.listen(port, () => {
  console.log(`OTP backend running on port ${port}`);
});
