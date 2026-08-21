"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const stream_1 = require("stream");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
class CloudinaryService {
    async uploadFile(file, folder = "lawticha", type = "image") {
        // Base64, URL or local path
        if (typeof file === "string") {
            const options = {
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
            const result = await cloudinary_1.v2.uploader.upload(file, options);
            return {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }
        // Buffer from multer
        const buffer = Buffer.isBuffer(file)
            ? file
            : file.buffer;
        return new Promise((resolve, reject) => {
            const options = {
                folder,
                resource_type: type,
                format: "pdf",
                use_filename: true,
                unique_filename: true,
            };
            console.log({ buffer, folder, type, options });
            if (type === "image") {
                options.transformation = [
                    { width: 1000, height: 1000, crop: "limit" },
                    { quality: "auto:good" },
                ];
            }
            const uploadStream = cloudinary_1.v2.uploader.upload_stream(options, (error, result) => {
                if (error)
                    return reject(error);
                if (!result) {
                    return reject(new Error("Cloudinary upload failed."));
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            });
            stream_1.Readable.from(buffer).pipe(uploadStream);
        });
    }
    async uploadMultipleFiles(files, folder = "lawticha", type = "image") {
        return Promise.all(files.map((file) => this.uploadFile(file, folder, type)));
    }
    async deleteFile(publicId, type = "image") {
        await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: type,
        });
    }
}
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
    }
});
exports.default = new CloudinaryService();
//# sourceMappingURL=cloudinary.js.map