/**
 * MPGS regional gateway base URLs.
 */
export const REGION_BASE_URLS = Object.freeze({
  TEST: 'https://test-gateway.mastercard.com',
  NA: 'https://na-gateway.mastercard.com',
  AP: 'https://ap-gateway.mastercard.com',
  EU: 'https://eu-gateway.mastercard.com',
});

export const SUPPORTED_REGIONS = Object.freeze(Object.keys(REGION_BASE_URLS));

export const DEFAULT_API_VERSION = '74';
export const DEFAULT_REGION = 'TEST';

export function getRegionBaseUrl(region) {
  const normalizedRegion = String(region || DEFAULT_REGION).toUpperCase();
  const baseUrl = REGION_BASE_URLS[normalizedRegion];

  if (!baseUrl) {
    throw new Error(
      `Unsupported MPGS region "${region}". Supported regions: ${SUPPORTED_REGIONS.join(', ')}.`
    );
  }

  return baseUrl;
}

export function buildMerchantBasePath({ baseUrl, apiVersion, merchantId }) {
  return `${baseUrl}/api/rest/version/${apiVersion}/merchant/${merchantId}`;
}

export function getCheckoutScriptUrl(region) {
  return `${getRegionBaseUrl(region)}/static/checkout/checkout.min.js`;
}
