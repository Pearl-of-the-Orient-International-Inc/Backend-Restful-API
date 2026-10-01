"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capturePayPalOrder = exports.createPayPalCheckout = exports.getPayPalAccessToken = exports.createXenditCheckout = void 0;
const config_1 = __importDefault(require("@/config"));
const requireValue = (value, name) => {
    if (!value)
        throw new Error(`${name} is not configured`);
    return value;
};
const parseProviderError = (response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const body = (yield response.json().catch(() => null));
    return ((_e = (_b = (_a = body === null || body === void 0 ? void 0 : body.message) !== null && _a !== void 0 ? _a : body === null || body === void 0 ? void 0 : body.error_description) !== null && _b !== void 0 ? _b : (_d = (_c = body === null || body === void 0 ? void 0 : body.details) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.description) !== null && _e !== void 0 ? _e : `Payment provider returned HTTP ${response.status}`);
});
const createXenditCheckout = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const secretKey = requireValue(config_1.default.XENDIT_SECRET_KEY, 'XENDIT_SECRET_KEY');
    const authorization = Buffer.from(`${secretKey}:`).toString('base64');
    const response = yield fetch('https://api.xendit.co/sessions', {
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
            success_return_url: `${config_1.default.APP_URL}/payment/success?reference=${encodeURIComponent(input.reference)}`,
            cancel_return_url: `${config_1.default.APP_URL}/payment/error?reason=cancelled&reference=${encodeURIComponent(input.reference)}`,
            metadata: { payment_reference: input.reference },
        }),
    });
    if (!response.ok)
        throw new Error(yield parseProviderError(response));
    const data = (yield response.json());
    if (!data.payment_session_id || !data.payment_link_url) {
        throw new Error('Xendit did not return a payment link');
    }
    return {
        gatewayReference: data.payment_session_id,
        checkoutUrl: data.payment_link_url,
        providerStatus: data.status,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    };
});
exports.createXenditCheckout = createXenditCheckout;
const getPayPalAccessToken = () => __awaiter(void 0, void 0, void 0, function* () {
    const clientId = requireValue(config_1.default.PAYPAL_CLIENT_ID, 'PAYPAL_CLIENT_ID');
    const secret = requireValue(config_1.default.PAYPAL_CLIENT_SECRET, 'PAYPAL_CLIENT_SECRET');
    const authorization = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const response = yield fetch(`${config_1.default.PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${authorization}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    if (!response.ok)
        throw new Error(yield parseProviderError(response));
    const data = (yield response.json());
    if (!data.access_token)
        throw new Error('PayPal did not return an access token');
    return data.access_token;
});
exports.getPayPalAccessToken = getPayPalAccessToken;
const createPayPalCheckout = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const accessToken = yield (0, exports.getPayPalAccessToken)();
    const response = yield fetch(`${config_1.default.PAYPAL_API_BASE}/v2/checkout/orders`, {
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
                        return_url: `${config_1.default.APP_URL}/payment/success?reference=${encodeURIComponent(input.reference)}`,
                        cancel_url: `${config_1.default.APP_URL}/payment/error?reason=cancelled&reference=${encodeURIComponent(input.reference)}`,
                    },
                },
            },
        }),
    });
    if (!response.ok)
        throw new Error(yield parseProviderError(response));
    const data = (yield response.json());
    const checkoutUrl = (_b = (_a = data.links) === null || _a === void 0 ? void 0 : _a.find((link) => link.rel === 'payer-action' || link.rel === 'approve')) === null || _b === void 0 ? void 0 : _b.href;
    if (!data.id || !checkoutUrl)
        throw new Error('PayPal did not return an approval link');
    return {
        gatewayReference: data.id,
        checkoutUrl,
        providerStatus: data.status,
    };
});
exports.createPayPalCheckout = createPayPalCheckout;
const capturePayPalOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = yield (0, exports.getPayPalAccessToken)();
    const response = yield fetch(`${config_1.default.PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
        },
        body: '{}',
    });
    if (!response.ok)
        throw new Error(yield parseProviderError(response));
    return (yield response.json());
});
exports.capturePayPalOrder = capturePayPalOrder;
