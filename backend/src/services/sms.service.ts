import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { extractIndianSubscriberDigits, canonicalPhone } from '@be11/shared';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

/**
 * Sends a 6-digit transactional Phone OTP via configured SMS provider.
 * Supported providers:
 * - 'fast2sms' (Fast2SMS Quick SMS / OTP route for India)
 * - 'msg91' (MSG91 OTP API)
 * - 'twilio' (Twilio Programmable SMS)
 * - non-production dev fallback
 */
export const sendPhoneOtpSms = async (
  rawPhone: string,
  code: string
): Promise<SendSmsResult> => {
  const subscriberDigits = extractIndianSubscriberDigits(rawPhone);
  const formattedPhone = canonicalPhone(rawPhone); // +919876543210

  if (subscriberDigits.length !== 10) {
    throw new Error(`Invalid mobile number format: ${rawPhone}`);
  }

  const provider = (env.SMS_PROVIDER || 'fast2sms').toLowerCase().trim();

  // 1. Fast2SMS Provider (widely used in India for transactional OTPs)
  if (provider === 'fast2sms' && env.SMS_API_KEY) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: env.SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: code,
          numbers: subscriberDigits,
        }),
      });

      const data = (await response.json()) as any;
      if (data && data.return === true) {
        logger.info(`[SMS] OTP dispatched via Fast2SMS to +91 ***${subscriberDigits.slice(-4)}`);
        return { success: true, provider: 'fast2sms', messageId: data.request_id };
      }

      const errMsg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || 'Fast2SMS dispatch failed';
      logger.error(`[SMS] Fast2SMS error: ${errMsg}`);
      return { success: false, provider: 'fast2sms', error: errMsg };
    } catch (err: any) {
      logger.error(`[SMS] Fast2SMS exception: ${err.message}`);
      return { success: false, provider: 'fast2sms', error: err.message };
    }
  }

  // 2. MSG91 Provider
  if (provider === 'msg91' && env.SMS_API_KEY) {
    try {
      const templateId = env.SMS_SENDER_ID || '';
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${formattedPhone.replace('+', '')}&authkey=${env.SMS_API_KEY}&otp=${code}`;
      const response = await fetch(url, { method: 'POST' });
      const data = (await response.json()) as any;
      if (data && (data.type === 'success' || data.message === 'OTP sent successfully')) {
        logger.info(`[SMS] OTP dispatched via MSG91 to +91 ***${subscriberDigits.slice(-4)}`);
        return { success: true, provider: 'msg91', messageId: data.request_id };
      }
      logger.error(`[SMS] MSG91 error: ${JSON.stringify(data)}`);
      return { success: false, provider: 'msg91', error: data?.message || 'MSG91 dispatch failed' };
    } catch (err: any) {
      logger.error(`[SMS] MSG91 exception: ${err.message}`);
      return { success: false, provider: 'msg91', error: err.message };
    }
  }

  // 3. Twilio Provider
  if (provider === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams({
        To: formattedPhone,
        From: env.TWILIO_PHONE_NUMBER,
        Body: `Your BE11 verification code is ${code}. Valid for 10 minutes. Do not share this with anyone.`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const data = (await response.json()) as any;
      if (response.ok && data.sid) {
        logger.info(`[SMS] OTP dispatched via Twilio to +91 ***${subscriberDigits.slice(-4)}`);
        return { success: true, provider: 'twilio', messageId: data.sid };
      }
      logger.error(`[SMS] Twilio error: ${data.message || response.statusText}`);
      return { success: false, provider: 'twilio', error: data.message };
    } catch (err: any) {
      logger.error(`[SMS] Twilio exception: ${err.message}`);
      return { success: false, provider: 'twilio', error: err.message };
    }
  }

  // 4. Non-production / sandbox fallback
  if (env.NODE_ENV !== 'production') {
    logger.info(`[DEV SMS] Simulating OTP dispatch to +91 ***${subscriberDigits.slice(-4)}: (code generated securely)`);
    return { success: true, provider: 'dev-simulator' };
  }

  // In production without configured SMS provider credentials, log operational warning
  logger.warn(
    `[SMS] Production SMS provider credentials (SMS_API_KEY or TWILIO_*) not configured. OTP generated for +91 ***${subscriberDigits.slice(-4)}.`
  );
  return {
    success: false,
    provider: 'unconfigured',
    error: 'Transactional SMS provider credentials not configured on server.',
  };
};
