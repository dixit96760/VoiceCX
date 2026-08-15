const twilio = require('twilio');

const sendOtpWhatsApp = async (toPhone, otpCode) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      console.warn('[WhatsApp] Twilio credentials missing in .env. Skipping WhatsApp OTP.');
      return { success: false, message: 'Twilio credentials not configured.' };
    }

    const client = twilio(accountSid, authToken);

    // Ensure phone number starts with + and contains only digits after +
    let cleanPhone = toPhone.trim().replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+1${cleanPhone.replace(/\D/g, '')}`; // fallback default to +1
    }

    const twilioFrom = fromPhone;
    const twilioTo = cleanPhone;

    const message = await client.messages.create({
      body: `Your VoiceCX verification code is: ${otpCode}. It expires in 5 minutes.`,
      from: twilioFrom,
      to: twilioTo
    });

    console.log(`[SMS] Sent OTP to ${twilioTo}. Message SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('[SMS] Failed to send message:', error.message);
    return { success: false, message: error.message };
  }
};

module.exports = { sendOtpWhatsApp };
