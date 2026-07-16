import mongoose, { Document, Schema } from 'mongoose';

export interface ISpecialism extends Document {
    name: string;
    displayName: string;
    group: string;
    createdAt: Date;
    updatedAt: Date;
}

const Specialism = new Schema<ISpecialism>({
    name: {
        type: String,
        required: [true, 'Specialism name is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z_]+$/, 'Specialism name can only contain lowercase letters and underscores']
    },
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true
    },
    group: {
        type: String,
        required: [true, 'group name is required'],
        trim: true
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
Specialism.index({ name: 1 });

export default mongoose.model<ISpecialism>('Specialism', Specialism);