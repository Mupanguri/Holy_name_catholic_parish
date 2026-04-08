/**
 * Image URL utility for centralized image path management
 * Handles PUBLIC_URL consistently across the application
 */

/**
 * Get a full image URL with proper PUBLIC_URL handling
 * @param {string} path - The image path (e.g., 'logo.jpg', '/images/logo.png')
 * @returns {string} - The full URL with PUBLIC_URL prepended
 */
export const imageUrl = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${process.env.PUBLIC_URL}/${cleanPath}`;
};

/**
 * Get an image URL from the images folder
 * @param {string} filename - The image filename (e.g., 'logo.jpg')
 * @returns {string} - The full URL to the image
 */
export const getImageUrl = (filename) => {
  return imageUrl(`images/${filename}`);
};

export default imageUrl;