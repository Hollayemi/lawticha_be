import mongoose from 'mongoose';
import Specialism from '../models/Specialism.model';
import dotenv from 'dotenv';

dotenv.config();

export const seedSpecialisms = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(
            process.env.NODE_ENV === 'production'
                ? process.env.MONGODB_URI_PROD!
                : process.env.MONGODB_URI!
        );
        console.log('MongoDB connected...');

        // Clear existing specialisms
        await Specialism.deleteMany({});
        console.log('Cleared existing specialisms');

        // Create specialisms
        const specialisms = [
            { name: "criminal", displayName: "Criminal Law", group: "Litigation" },
            { name: "employment", displayName: "Employment & Labour", group: "Litigation" },
            { name: "property", displayName: "Property & Tenancy", group: "Transactions" },
            { name: "family", displayName: "Family Law", group: "Litigation" },
            { name: "business", displayName: "Business & Commerce", group: "Transactions" },
            { name: "constitutional", displayName: "Constitutional Rights", group: "Litigation" },
            { name: "consumer", displayName: "Consumer Protection", group: "Advisory" },
            { name: "road", displayName: "Road Traffic", group: "Advisory" },
            { name: "contracts", displayName: "Contracts & Agreements", group: "Transactions" },
            { name: "tax", displayName: "Tax & Revenue", group: "Advisory" },
            { name: "ip", displayName: "Intellectual Property", group: "Transactions" },
            { name: "immigration", displayName: "Immigration", group: "Advisory" },
        ]

        const createdSpecialisms = await Specialism.insertMany(specialisms);
        console.log('Specialisms created successfully:');
        createdSpecialisms.forEach(specialism => {
            console.log(`- ${specialism.displayName} (${specialism.name})`);
        });


        console.log('\nDatabase seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run seed
// seedSpecialisms();