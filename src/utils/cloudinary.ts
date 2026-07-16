import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { Readable } from 'stream';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


interface UploadResult {
    url: string;
    publicId: string;
}

class CloudinaryService {
    async uploadFile(
        file: Express.Multer.File | Buffer | string,
        folder = "lawticha",
        type: "image" | "raw" | "video" = "image"
    ): Promise<UploadResult> {
        // Base64, URL or local path
        if (typeof file === "string") {
            const options: any = {
                folder,
                resource_type: type,
            };

            // Only images should receive transformations
            if (type === "image") {
                options.transformation = [
                    { width: 1000, height: 1000, crop: "limit" },
                    { quality: "auto:good" },
                ];
            }

            const result = await cloudinary.uploader.upload(file, options);

            return {
                url: result.secure_url,
                publicId: result.public_id,

            };
        }

        // Buffer from multer
        const buffer =
            Buffer.isBuffer(file)
                ? file
                : file.buffer;

        return new Promise((resolve, reject) => {
            const options: any = {
                folder,
                resource_type: type,
                format: "pdf",
                use_filename: true,
                unique_filename: true,
            };

            console.log({ buffer, folder, type, options })

            if (type === "image") {
                options.transformation = [
                    { width: 1000, height: 1000, crop: "limit" },
                    { quality: "auto:good" },
                ];
            }

            const uploadStream = cloudinary.uploader.upload_stream(
                options,
                (error, result?: UploadApiResponse) => {
                    if (error) return reject(error);

                    if (!result) {
                        return reject(new Error("Cloudinary upload failed."));
                    }

                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            );

            Readable.from(buffer).pipe(uploadStream);
        });
    }

    async uploadMultipleFiles(
        files: (Express.Multer.File | Buffer | string)[],
        folder = "lawticha",
        type: "image" | "raw" | "video" = "image"
    ): Promise<UploadResult[]> {
        return Promise.all(
            files.map((file) => this.uploadFile(file, folder, type))
        );
    }

    async deleteFile(
        publicId: string,
        type: "image" | "raw" | "video" = "image"
    ) {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: type,
        });
    }
}


export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', "application/pdf"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
    }
});

export default new CloudinaryService();