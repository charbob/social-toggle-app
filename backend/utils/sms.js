const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

async function sendSMS(to, body) {
  if (!accountSid || !authToken || !fromNumber) {
    console.log('Twilio credentials not set. SMS not sent.');
    return;
  }
  try {
    await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    console.log(`SMS sent to ${to}`);
  } catch (err) {
    console.error('Failed to send SMS:', err.message);
  }
}

module.exports = { sendSMS }; 