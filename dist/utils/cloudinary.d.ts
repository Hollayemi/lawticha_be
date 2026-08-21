import multer from 'multer';
interface UploadResult {
    url: string;
    publicId: string;
}
declare class CloudinaryService {
    uploadFile(file: Express.Multer.File | Buffer | string, folder?: string, type?: "image" | "raw" | "video"): Promise<UploadResult>;
    uploadMultipleFiles(files: (Express.Multer.File | Buffer | string)[], folder?: string, type?: "image" | "raw" | "video"): Promise<UploadResult[]>;
    deleteFile(publicId: string, type?: "image" | "raw" | "video"): Promise<void>;
}
export declare const upload: multer.Multer;
declare const _default: CloudinaryService;
export default _default;
//# sourceMappingURL=cloudinary.d.ts.map