"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSpecialisms = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Specialism_model_1 = __importDefault(require("../models/Specialism.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seedSpecialisms = async () => {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.NODE_ENV === 'production'
            ? process.env.MONGODB_URI_PROD
            : process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        // Clear existing specialisms
        await Specialism_model_1.default.deleteMany({});
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
        ];
        const createdSpecialisms = await Specialism_model_1.default.insertMany(specialisms);
        console.log('Specialisms created successfully:');
        createdSpecialisms.forEach(specialism => {
            console.log(`- ${specialism.displayName} (${specialism.name})`);
        });
        console.log('\nDatabase seeded successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};
exports.seedSpecialisms = seedSpecialisms;
// Run seed
// seedSpecialisms();
//# sourceMappingURL=seed-specialism.js.map