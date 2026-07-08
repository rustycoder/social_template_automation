/**
 * MPGS regional gateway base URLs.
 * Full REST paths are built as:
 *   {baseUrl}/api/rest/version/{apiVersion}/merchant/{merchantId}/...
 */
const REGION_BASE_URLS = Object.freeze({
  TEST: 'https://test-gateway.mastercard.com',
  NA: 'https://na-gateway.mastercard.com',
  AP: 'https://ap-gateway.mastercard.com',
  EU: 'https://eu-gateway.mastercard.com',
});

const SUPPORTED_REGIONS = Object.freeze(Object.keys(REGION_BASE_URLS));

const DEFAULT_API_VERSION = '74';
const DEFAULT_REGION = 'TEST';

/**
 * @param {string} region
 * @returns {string}
 */
function getRegionBaseUrl(region) {
  const normalizedRegion = String(region || DEFAULT_REGION).toUpperCase();
  const baseUrl = REGION_BASE_URLS[normalizedRegion];

  if (!baseUrl) {
    throw new Error(
      `Unsupported MPGS region "${region}". Supported regions: ${SUPPORTED_REGIONS.join(', ')}.`,
    );
  }

  return baseUrl;
}

/**
 * @param {object} options
 * @param {string} options.baseUrl
 * @param {string} options.apiVersion
 * @param {string} options.merchantId
 * @returns {string}
 */
function buildMerchantBasePath({ baseUrl, apiVersion, merchantId }) {
  return `${baseUrl}/api/rest/version/${apiVersion}/merchant/${merchantId}`;
}

module.exports = {
  REGION_BASE_URLS,
  SUPPORTED_REGIONS,
  DEFAULT_API_VERSION,
  DEFAULT_REGION,
  getRegionBaseUrl,
  buildMerchantBasePath,
};
