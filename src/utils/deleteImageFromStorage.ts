import cloudinary from './cloudinary.utils';

/**
 * Extracts the Cloudinary public_id from a full URL.
 * Example: 
 *  URL: https://res.cloudinary.com/demo/image/upload/v1234567890/images/my-image.jpg
 *  public_id: images/my-image (without extension)
 */
function extractPublicId(imageUrl: string): string | null {
  try {
    const parts = imageUrl.split('/');
    const fileWithExt = parts[parts.length - 1]; // my-image.jpg
    const publicId = fileWithExt.substring(0, fileWithExt.lastIndexOf('.')); // my-image
    const folderIndex = parts.findIndex(part => part === 'upload') + 1;
    const folderPath = parts.slice(folderIndex, parts.length - 1).join('/');
    return folderPath ? `${folderPath}/${publicId}` : publicId;
  } catch {
    console.error("Couldn't able to extract the publicId from : ",imageUrl);
    return null;
  }
}

/**
 * Deletes an image from Cloudinary using its URL
 * @param imageUrl Full Cloudinary image URL
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  const publicId = extractPublicId(imageUrl);

  if (!publicId) {
    console.warn("⚠️ Could not extract public_id from URL:", imageUrl);
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok' && result.result !== 'not found') {
      console.error("❌ Failed to delete image:", result);
    } else {
      console.info("✅ Image deleted from Cloudinary:", publicId);
    }
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error);
  }
}