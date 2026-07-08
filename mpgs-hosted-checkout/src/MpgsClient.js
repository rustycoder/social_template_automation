const axios = require('axios');
const {
  DEFAULT_API_VERSION,
  DEFAULT_REGION,
  getRegionBaseUrl,
  buildMerchantBasePath,
} = require('./constants');

class MpgsClient {
  /**
   * @param {object} config
   * @param {string} config.merchantId
   * @param {string} config.apiPassword
   * @param {string} [config.apiVersion='74']
   * @param {string} [config.region='TEST']
   */
  constructor(config = {}) {
    const { merchantId, apiPassword, apiVersion = DEFAULT_API_VERSION, region = DEFAULT_REGION } =
      config;

    if (!merchantId) {
      throw new Error('MpgsClient requires a merchantId.');
    }

    if (!apiPassword) {
      throw new Error('MpgsClient requires an apiPassword.');
    }

    this.merchantId = merchantId;
    this.apiPassword = apiPassword;
    this.apiVersion = String(apiVersion);
    this.region = String(region).toUpperCase();

    const baseUrl = getRegionBaseUrl(this.region);
    this.merchantBasePath = buildMerchantBasePath({
      baseUrl,
      apiVersion: this.apiVersion,
      merchantId: this.merchantId,
    });

    this.httpClient = axios.create({
      baseURL: this.merchantBasePath,
      auth: {
        username: `merchant.${this.merchantId}`,
        password: this.apiPassword,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create a Hosted Checkout session.
   * POST /session
   *
   * @param {object} payloadData - MPGS session request body (order, interaction, apiOperation, etc.)
   * @returns {Promise<object>}
   */
  async createCheckoutSession(payloadData) {
    if (!payloadData || typeof payloadData !== 'object') {
      throw new Error('createCheckoutSession requires a payloadData object.');
    }

    try {
      const response = await this.httpClient.post('/session', payloadData);
      return response.data;
    } catch (error) {
      throw this._formatApiError(error, 'Failed to create checkout session.');
    }
  }

  /**
   * Retrieve a transaction for payment verification after redirect.
   * GET /order/{orderId}/transaction/{transactionId}
   *
   * @param {string} orderId
   * @param {string} transactionId
   * @returns {Promise<object>}
   */
  async getTransaction(orderId, transactionId) {
    if (!orderId) {
      throw new Error('getTransaction requires an orderId.');
    }

    if (!transactionId) {
      throw new Error('getTransaction requires a transactionId.');
    }

    const encodedOrderId = encodeURIComponent(orderId);
    const encodedTransactionId = encodeURIComponent(transactionId);

    try {
      const response = await this.httpClient.get(
        `/order/${encodedOrderId}/transaction/${encodedTransactionId}`,
      );
      return response.data;
    } catch (error) {
      throw this._formatApiError(error, 'Failed to retrieve transaction.');
    }
  }

  /**
   * @param {import('axios').AxiosError} error
   * @param {string} fallbackMessage
   * @returns {Error}
   * @private
   */
  _formatApiError(error, fallbackMessage) {
    const apiError = new Error(fallbackMessage);
    apiError.name = 'MpgsApiError';
    apiError.isMpgsError = true;

    if (error.response) {
      const { status, statusText, data } = error.response;

      apiError.status = status;
      apiError.statusText = statusText;
      apiError.responseData = data;

      const gatewayMessage =
        data?.error?.explanation ||
        data?.error?.message ||
        data?.result ||
        data?.message;

      if (gatewayMessage) {
        apiError.message = `${fallbackMessage} ${gatewayMessage}`;
      } else {
        apiError.message = `${fallbackMessage} HTTP ${status} ${statusText}.`;
      }

      return apiError;
    }

    if (error.request) {
      apiError.message = `${fallbackMessage} No response received from MPGS gateway.`;
      apiError.request = error.request;
      return apiError;
    }

    apiError.message = `${fallbackMessage} ${error.message}`;
    return apiError;
  }
}

module.exports = MpgsClient;
