/**
 * Utility to encode form data for OAuth2 style requests
 */
export function encodeFormData(data) {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

/**
 * URLSearchParams alternative for form encoding
 * Note: This is useful for browsers that don't support URLSearchParams
 *
 * @param {Object} data - The data to encode
 * @returns {string} - URL encoded form data
 */
export function encodeFormDataAlternative(data) {
  const formBody = [];
  for (const property in data) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(data[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  return formBody.join("&");
}

/**
 * Get encoded form data using URLSearchParams
 *
 * @param {Object} data - The data to encode
 * @returns {URLSearchParams} - URL search params object
 */
export function getUrlSearchParams(data) {
  const params = new URLSearchParams();
  for (const key in data) {
    params.append(key, data[key]);
  }
  return params;
}