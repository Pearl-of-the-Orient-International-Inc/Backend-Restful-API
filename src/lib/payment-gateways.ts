import config from '@/config';

type CheckoutInput = {
  reference: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type GatewayCheckout = {
  gatewayReference: string;
  checkoutUrl: string;
  providerStatus: string;
  expiresAt?: Date;
};

const requireValue = (value: string | undefined, name: string) => {
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const parseProviderError = async (response: globalThis.Response) => {
  const body = (await response.json().catch(() => null)) as {
    message?: string;
    error_description?: string;
    details?: Array<{ description?: string }>;
  } | null;
  return (
    body?.message ??
    body?.error_description ??
    body?.details?.[0]?.description ??
    `Payment provider returned HTTP ${response.status}`
  );
};

export const createXenditCheckout = async (
  input: CheckoutInput,
): Promise<GatewayCheckout> => {
  const secretKey = requireValue(config.XENDIT_SECRET_KEY, 'XENDIT_SECRET_KEY');
  const authorization = Buffer.from(`${secretKey}:`).toString('base64');
  const response = await fetch('https://api.xendit.co/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference_id: input.reference,
      session_type: 'PAY',
      mode: 'PAYMENT_LINK',
      amount: input.amount,
      currency: input.currency,
      country: 'PH',
      locale: 'en',
      capture_method: 'AUTOMATIC',
      allow_save_payment_method: 'DISABLED',
      description: input.description,
      customer: {
        reference_id: input.reference,
        type: 'INDIVIDUAL',
        email: input.customerEmail,
        individual_detail: { given_names: input.customerName },
      },
      success_return_url: `${config.APP_URL}/shop?payment=processing&reference=${encodeURIComponent(input.reference)}`,
      cancel_return_url: `${config.APP_URL}/shop?payment=cancelled&reference=${encodeURIComponent(input.reference)}`,
      metadata: { payment_reference: input.reference },
    }),
  });
  if (!response.ok) throw new Error(await parseProviderError(response));
  const data = (await response.json()) as {
    payment_session_id: string;
    payment_link_url: string;
    status: string;
    expires_at?: string;
  };
  if (!data.payment_session_id || !data.payment_link_url) {
    throw new Error('Xendit did not return a payment link');
  }
  return {
    gatewayReference: data.payment_session_id,
    checkoutUrl: data.payment_link_url,
    providerStatus: data.status,
    expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
  };
};

export const getPayPalAccessToken = async () => {
  const clientId = requireValue(config.PAYPAL_CLIENT_ID, 'PAYPAL_CLIENT_ID');
  const secret = requireValue(
    config.PAYPAL_CLIENT_SECRET,
    'PAYPAL_CLIENT_SECRET',
  );
  const authorization = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response = await fetch(`${config.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new Error(await parseProviderError(response));
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token)
    throw new Error('PayPal did not return an access token');
  return data.access_token;
};

export const createPayPalCheckout = async (
  input: CheckoutInput,
): Promise<GatewayCheckout> => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${config.PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': input.reference,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.reference,
          custom_id: input.reference,
          invoice_id: input.reference,
          description: input.description,
          amount: {
            currency_code: input.currency,
            value: input.amount.toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: 'PAY_NOW',
            return_url: `${config.APP_URL}/shop?payment=processing&reference=${encodeURIComponent(input.reference)}`,
            cancel_url: `${config.APP_URL}/shop?payment=cancelled&reference=${encodeURIComponent(input.reference)}`,
          },
        },
      },
    }),
  });
  if (!response.ok) throw new Error(await parseProviderError(response));
  const data = (await response.json()) as {
    id: string;
    status: string;
    links?: Array<{ rel: string; href: string }>;
  };
  const checkoutUrl = data.links?.find(
    (link) => link.rel === 'payer-action' || link.rel === 'approve',
  )?.href;
  if (!data.id || !checkoutUrl)
    throw new Error('PayPal did not return an approval link');
  return {
    gatewayReference: data.id,
    checkoutUrl,
    providerStatus: data.status,
  };
};

export const capturePayPalOrder = async (orderId: string) => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${config.PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: '{}',
    },
  );
  if (!response.ok) throw new Error(await parseProviderError(response));
  return (await response.json()) as { id: string; status: string };
};
