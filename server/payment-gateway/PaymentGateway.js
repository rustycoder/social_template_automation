import axios from "axios";
import { DEFAULT_API_VERSION, DEFAULT_REGION, buildMerchantBasePath, getRegionBaseUrl } from "./constants.js";

export default class PaymentGateway {
  constructor(config = {}) {
    console.log("config payment gateway", config);
    const { merchantId, apiPassword, apiVersion = DEFAULT_API_VERSION, region = DEFAULT_REGION } = config;

    if (!merchantId) {
      throw new Error("PaymentGateway requires a merchantId.");
    }

    if (!apiPassword) {
      throw new Error("PaymentGateway requires an apiPassword.");
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

    console.log("merchantBasePath", this.merchantBasePath);

    this.httpClient = axios.create({
      baseURL: this.merchantBasePath,
      auth: {
        username: `merchant.${this.merchantId}`,
        password: this.apiPassword,
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });
  }

  async createCheckoutSession(payloadData) {
    if (!payloadData || typeof payloadData !== "object") {
      throw new Error("createCheckoutSession requires a payloadData object.");
    }
    console.log("payloadData", payloadData);
    try {
      const response = await this.httpClient.post("/session", payloadData);
      return response.data;
    } catch (error) {
      throw this._formatApiError(error, "Failed to create checkout session.");
    }
  }

  async getOrder(orderId) {
    if (!orderId) {
      throw new Error("getOrder requires an orderId.");
    }

    try {
      const response = await this.httpClient.get(`/order/${encodeURIComponent(orderId)}`);
      return response.data;
    } catch (error) {
      throw this._formatApiError(error, "Failed to retrieve order.");
    }
  }

  async getTransaction(orderId, transactionId) {
    if (!orderId) {
      throw new Error("getTransaction requires an orderId.");
    }

    if (!transactionId) {
      throw new Error("getTransaction requires a transactionId.");
    }

    try {
      const response = await this.httpClient.get(`/order/${encodeURIComponent(orderId)}/transaction/${encodeURIComponent(transactionId)}`);
      return response.data;
    } catch (error) {
      throw this._formatApiError(error, "Failed to retrieve transaction.");
    }
  }

  _formatApiError(error, fallbackMessage) {
    const apiError = new Error(fallbackMessage);
    apiError.name = "PaymentGatewayError";
    apiError.isPaymentGatewayError = true;

    if (error.response) {
      const { status, statusText, data } = error.response;

      apiError.status = status;
      apiError.statusText = statusText;
      apiError.responseData = data;

      const gatewayMessage = data?.error?.explanation || data?.error?.message || data?.result || data?.message;

      apiError.message = gatewayMessage ? `${fallbackMessage} ${gatewayMessage}` : `${fallbackMessage} HTTP ${status} ${statusText}.`;

      return apiError;
    }

    if (error.request) {
      apiError.message = `${fallbackMessage} No response received from payment gateway.`;
      apiError.request = error.request;
      return apiError;
    }

    apiError.message = `${fallbackMessage} ${error.message}`;
    return apiError;
  }
}
