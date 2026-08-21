"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTokenResponse = exports.verifyToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
//  Sign access token 
const signAccessToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id: id.toString(), role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });
};
exports.signAccessToken = signAccessToken;
//  Sign refresh token 
const signRefreshToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id: id.toString(), role }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
};
exports.signRefreshToken = signRefreshToken;
//  Verify token 
const verifyToken = (token, secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
//  Send tokens to client (access in body, refresh in httpOnly cookie) 
const sendTokenResponse = (res, userId, role, payload, statusCode = 200) => {
    const accessToken = (0, exports.signAccessToken)(userId, role);
    const refreshToken = (0, exports.signRefreshToken)(userId, role);
    const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE ?? 7);
    const cookieOptions = {
        expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };
    res.cookie('refreshToken', refreshToken, cookieOptions);
    return res.data({ accessToken, ...payload }, 'Authentication successful', statusCode);
};
exports.sendTokenResponse = sendTokenResponse;
//# sourceMappingURL=jwt.helper.js.map