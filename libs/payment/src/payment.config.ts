import { UrlParser } from '@app/common/util/url-parser';
import * as process from 'node:process';

export default () => {
  const frontendURL = process.env.FRONTEND_URL;
  const backendURL = process.env.BACKEND_URL;
  return {
    common: {},
    newebpay: {
      hashKey: process.env.NEWEBPAY_HASH_KEY,
      hashIV: process.env.NEWEBPAY_HASH_IV,
      merchantID: process.env.NEWEBPAY_MERCHANT_ID,
      version: process.env.NEWEBPAY_VERSION,
      url: process.env.NEWEBPAY_URL,
      notifyURL: UrlParser.join(backendURL, process.env.NEWEBPAY_NOTIFY_URI),
      returnURL: UrlParser.join(backendURL, process.env.NEWEBPAY_RETURN_URI),
    },
    aftee: {
      shopPublicKey: process.env.AFTEE_SHOP_PUBLIC_KEY,
      shopSecretKey: process.env.AFTEE_SHOP_SECRET_KEY,
      preRegisterURL: process.env.AFTEE_PRE_REGISTER_URL,
      paymentURL: process.env.AFTEE_PAYMENT_URL,
      updateURL: process.env.AFTEE_UPDATE_URL,
      cancelURL: process.env.AFTEE_CANCEL_URL,
      returnURL: backendURL + process.env.AFTEE_RETURN_URI,
    },
    ezpay: {
      url: process.env.EZPAY_URI,
      hashKey: process.env.EZPAY_HASH_KEY,
      hashIV: process.env.EZPAY_HASH_IV,
      merchantID: process.env.EZPAY_MERCHANT_ID,
    },
  };
};
