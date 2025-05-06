import * as process from 'node:process';
import { UrlParser } from '../../common/util/url-parser';

export default () => {
  const frontendURL = process.env.FRONTEND_URL;
  const backendURL = process.env.BACKEND_URL;
  return {
    common: {
      firstSuccessReturnPage:
        frontendURL + process.env.PAYMENT_FIRST_SUCCESS_RETURN_PAGE,
      firstErrorReturnPage:
        frontendURL + process.env.PAYMENT_FIRST_ERROR_RETURN_PAGE,
      secondSuccessReturnPage:
        frontendURL + process.env.PAYMENT_SECOND_SUCCESS_RETURN_PAGE,
      secondErrorReturnPage:
        frontendURL + process.env.PAYMENT_SECOND_ERROR_RETURN_PAGE,
      defaultReturnPage: frontendURL + '/?tab=order-pending',
      secondPaymentInfoPage:
        frontendURL + '/order/:orderNo/appeal-success/payment',
      secondOrderInfoPage: frontendURL + '/order/:id',
      noAuthFirstSuccessReturnPage: UrlParser.join(
        frontendURL,
        process.env.PAYMENT_NO_AUTH_FIRST_SUCCESS_RETURN_PAGE,
      ),
      noAuthFirstErrorReturnPage: UrlParser.join(
        frontendURL,
        process.env.PAYMENT_NO_AUTH_FIRST_ERROR_RETURN_PAGE,
      ),
      giftCardSuccessReturnPage:
        frontendURL + '/gift-card/:productId/payment/success?code=:code',
      giftCardErrorReturnPage:
        frontendURL + '/gift-card/:productId/payment/error',
      giftCardDefaultReturnPage: frontendURL,
    },
    newebpay: {
      hashKey: process.env.NEWEBPAY_HASH_KEY,
      hashIV: process.env.NEWEBPAY_HASH_IV,
      merchantID: process.env.NEWEBPAY_MERCHANT_ID,
      version: process.env.NEWEBPAY_VERSION,
      url: process.env.NEWEBPAY_URL,
      notifyURL: UrlParser.join(backendURL, process.env.NEWEBPAY_NOTIFY_URI),
      returnURL: UrlParser.join(backendURL, process.env.NEWEBPAY_RETURN_URI),
      noAuthReturnURL: UrlParser.join(
        backendURL,
        process.env.NEWEBPAY_NO_AUTH_RETURN_URI,
      ),
      returnSuccessURL: frontendURL + process.env.NEWEBPAY_RETURN_SUCCESS_URI,
      returnErrorURL: frontendURL + process.env.NEWEBPAY_RETURN_ERROR_URI,
      giftCardNotifyURL: backendURL + process.env.NEWEBPAY_GIFT_CARD_NOTIFY_URI,
      giftCardReturnURL: backendURL + process.env.NEWEBPAY_GIFT_CARD_RETURN_URI,
    },
    aftee: {
      shopPublicKey: process.env.AFTEE_SHOP_PUBLIC_KEY,
      shopSecretKey: process.env.AFTEE_SHOP_SECRET_KEY,
      preRegisterURL: process.env.AFTEE_PRE_REGISTER_URL,
      paymentURL: process.env.AFTEE_PAYMENT_URL,
      updateURL: process.env.AFTEE_UPDATE_URL,
      cancelURL: process.env.AFTEE_CANCEL_URL,
      returnURL: backendURL + process.env.AFTEE_RETURN_URI,
      noAuthReturnURL: UrlParser.join(
        backendURL,
        process.env.AFTEE_NO_AUTH_RETURN_URI,
      ),
    },
    ezpay: {
      url: process.env.EZPAY_URI,
      hashKey: process.env.EZPAY_HASH_KEY,
      hashIV: process.env.EZPAY_HASH_IV,
      merchantID: process.env.EZPAY_MERCHANT_ID,
    },
  };
};
