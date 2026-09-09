import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { HttpStatus } from '@be11/shared';
import { logger } from '../config/logger.js';

interface CreateOrderOptions {
  amountPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: string;
  attempts: number;
  notes?: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id?: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string | null;
  captured: boolean;
  description?: string;
  card_id?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  email: string;
  contact: string;
  notes?: Record<string, string>;
  created_at: number;
}

/**
 * Returns Razorpay public key ID and credentials validation status.
 * Never logs or returns the secret.
 */
export const getRazorpayPublicKey = (): string | null => {
  return env.RAZORPAY_KEY_ID?.trim() || null;
};

export const isRazorpayConfigured = (): boolean => {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  return Boolean(keyId && keySecret);
};

const getAuthHeaders = (): Record<string, string> => {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new AppError(
      'Razorpay payment gateway is not configured on this environment',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Creates a server-side Razorpay order.
 * Amount MUST be in integer paise.
 */
export const createRazorpayOrder = async (
  options: CreateOrderOptions
): Promise<RazorpayOrderResponse> => {
  const { amountPaise, currency = 'INR', receipt, notes } = options;

  if (!amountPaise || amountPaise <= 0 || !Number.isInteger(amountPaise)) {
    throw new AppError(
      'Invalid order amount supplied for payment initialization',
      HttpStatus.BAD_REQUEST
    );
  }

  const headers = getAuthHeaders();
  const body = {
    amount: amountPaise,
    currency,
    receipt: receipt ? receipt.slice(0, 40) : undefined,
    notes: notes || {},
  };

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      const errorMsg =
        errorData?.error?.description ||
        `Razorpay order creation failed with HTTP ${response.status}`;
      logger.error('Razorpay order creation error', {
        status: response.status,
        description: errorMsg,
      });
      throw new AppError(errorMsg, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const order = (await response.json()) as RazorpayOrderResponse;
    return order;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    logger.error('Error connecting to Razorpay API for order creation', {
      message: error?.message,
    });
    throw new AppError(
      'Unable to connect to payment gateway. Please check your connection or try again later.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Verifies Razorpay payment signature using HMAC SHA256: order_id|payment_id
 */
export const verifyRazorpaySignature = (params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean => {
  const { orderId, paymentId, signature } = params;
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();

  if (!keySecret) {
    throw new AppError(
      'Razorpay secret key is not configured on server',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    logger.error('Signature verification error', { error: (err as any)?.message });
    return false;
  }
};

/**
 * Fetches verified payment details directly from Razorpay API.
 */
export const fetchRazorpayPayment = async (
  paymentId: string
): Promise<RazorpayPaymentResponse> => {
  if (!paymentId || paymentId.trim() === '') {
    throw new AppError('Payment ID is required to fetch payment record', HttpStatus.BAD_REQUEST);
  }

  const headers = getAuthHeaders();
  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      const errorMsg =
        errorData?.error?.description ||
        `Failed to fetch payment status from Razorpay (HTTP ${response.status})`;
      logger.error('Razorpay fetch payment error', {
        status: response.status,
        description: errorMsg,
      });
      throw new AppError(errorMsg, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const payment = (await response.json()) as RazorpayPaymentResponse;
    return payment;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    logger.error('Error fetching Razorpay payment status', {
      message: error?.message,
    });
    throw new AppError(
      'Unable to verify payment status with gateway.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Verifies Razorpay webhook signature using RAZORPAY_WEBHOOK_SECRET.
 */
export const verifyWebhookSignature = (rawBody: string | Buffer, signature: string): boolean => {
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET?.trim() || env.RAZORPAY_KEY_SECRET?.trim();
  if (!webhookSecret || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    logger.error('Webhook signature verification error', { error: (err as any)?.message });
    return false;
  }
};
