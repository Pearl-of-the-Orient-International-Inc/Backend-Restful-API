# Sandbox payment setup

The Chaplain product checkout supports Xendit test mode for local payments and
PayPal Sandbox for international payments. Credentials belong only in
`backend/.env`; never expose secret keys through a `NEXT_PUBLIC_` variable.

## Xendit test mode

1. Create or open a Xendit account and switch the dashboard to **Test Mode**.
2. Open **Settings → Developers → API Keys** and generate a test Secret API
   Key with write access for Payments/Payment Sessions.
3. Open **Settings → Webhooks**, copy the webhook verification token, and set
   the Payment Session webhook URL to:

   `https://YOUR-PUBLIC-API/api/v1/payments/webhooks/xendit`

4. Add the following to `backend/.env`:

   ```dotenv
   XENDIT_SECRET_KEY="xnd_development_..."
   XENDIT_WEBHOOK_TOKEN="..."
   ```

Subscribe to Payment Session completed and expired events. The application
validates `x-callback-token`, the stored payment-session ID, amount, and
currency before marking an order paid.

## PayPal Sandbox

1. Sign in to the PayPal Developer Dashboard.
2. Open **Apps & Credentials → Sandbox** and create or select a REST app.
3. Copy its Client ID and Secret.
4. Under the same app's **Sandbox Webhooks**, add:

   `https://YOUR-PUBLIC-API/api/v1/payments/webhooks/paypal`

5. Subscribe to `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.PENDING`,
   `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`,
   `CHECKOUT.ORDER.DECLINED`, and `PAYMENT.CAPTURE.REFUNDED`.
6. Copy the generated Webhook ID and add:

   ```dotenv
   PAYPAL_ENVIRONMENT="sandbox"
   PAYPAL_CLIENT_ID="..."
   PAYPAL_CLIENT_SECRET="..."
   PAYPAL_WEBHOOK_ID="..."
   ```

Use the Personal sandbox account to pay and the Business sandbox account tied
to the REST app to receive the test payment. PayPal webhook signatures are
verified through PayPal before an order is updated.

## Local webhook testing

Providers cannot call `localhost`. Expose port `5001` through an HTTPS tunnel
and use its public URL as `YOUR-PUBLIC-API`. Xendit also requires HTTPS return
URLs, so set `APP_URL` to an HTTPS URL that reaches the website while testing.

Restart the backend after changing environment variables.

## Configurable customer-facing fees

The defaults are development estimates and must be replaced with the approved
merchant pricing before launch:

```dotenv
XENDIT_PLATFORM_FEE_PERCENT=3.5
XENDIT_PLATFORM_FEE_FIXED=11
PAYPAL_PLATFORM_FEE_PERCENT=4.4
PAYPAL_PLATFORM_FEE_FIXED=15
```

Xendit's actual fee varies by the payment channel chosen on its hosted page.
Confirm whether passing gateway fees to customers is permitted by the final
merchant agreement and applicable rules.
