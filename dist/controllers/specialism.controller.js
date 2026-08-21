"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllSpeicalism = void 0;
const error_1 = require("../middleware/error");
const Specialism_model_1 = __importDefault(require("../models/Specialism.model"));
exports.listAllSpeicalism = (0, error_1.asyncHandler)(async (req, res, _next) => {
    const specialisms = await Specialism_model_1.default.find();
    return res.data(specialisms, "Modules fetched successfully.");
});
//# sourceMappingURL=specialism.controller.js.map