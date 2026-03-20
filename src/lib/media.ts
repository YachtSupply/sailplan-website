/**
 * Media configuration for boatwork-websites S3 bucket.
 * All customer website assets are stored here, separate from boatwork-images.
 *
 * Bucket: boatwork-websites
 * Structure: /<site-slug>/<type>/<filename>
 *   - /<slug>/portfolio/*.{jpg,png,mp4}
 *   - /<slug>/videos/*.mp4
 *   - /<slug>/logo/*
 */

export const MEDIA_BASE_URL = 'https://boatwork-websites.s3.us-east-1.amazonaws.com';
export const MEDIA_BUCKET = 'boatwork-websites';
export const MEDIA_REGION = 'us-east-1';

/**
 * Build a full S3 URL for a customer media asset.
 * @param slug   - The site slug (e.g. "yachts-etc")
 * @param type   - Asset type: "portfolio" | "videos" | "logo"
 * @param file   - Filename (e.g. "photo-01.jpg")
 */
export function mediaUrl(slug: string, type: 'portfolio' | 'videos' | 'logo', file: string): string {
  return `${MEDIA_BASE_URL}/${slug}/${type}/${file}`;
}

/**
 * Check if a URL is a boatwork-websites S3 asset.
 */
export function isMediaUrl(url: string): boolean {
  return url.startsWith(MEDIA_BASE_URL);
}
