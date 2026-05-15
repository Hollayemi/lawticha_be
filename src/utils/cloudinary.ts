import cloudinary from 'cloudinary';
import fs from 'fs';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: Express.Multer.File, folder: string): Promise<string | null> {
  try {
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: `lawticha/${folder}`,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
    
    // Delete local file after upload
    fs.unlinkSync(file.path);
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    await cloudinary.v2.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}