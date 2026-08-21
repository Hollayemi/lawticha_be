"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = loginAdmin;
exports.logoutAdmin = logoutAdmin;
exports.getCurrentAdmin = getCurrentAdmin;
exports.completeOnboardingStep = completeOnboardingStep;
exports.changePassword = changePassword;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.createAdmin = createAdmin;
exports.getAdmins = getAdmins;
exports.getAdminById = getAdminById;
exports.updateAdmin = updateAdmin;
exports.deleteAdmin = deleteAdmin;
exports.reactivateAdmin = reactivateAdmin;
exports.inviteAdmin = inviteAdmin;
exports.acceptInvite = acceptInvite;
exports.changeAdminRole = changeAdminRole;
exports.getAuditLogs = getAuditLogs;
exports.getMyAuditLogs = getMyAuditLogs;
exports.getInstructors = getInstructors;
exports.getInstructorModules = getInstructorModules;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_model_1 = require("../models/Admin.model");
const error_1 = require("../middleware/error");
const types_1 = require("../models/types");
// ============ Helper Functions ============
const generateToken = (adminId, role) => {
    return jsonwebtoken_1.default.sign({ id: adminId, role, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
const generateResetToken = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};
const createAuditLog = async (adminId, adminName, action, targetType, targetId, meta) => {
    try {
        await Admin_model_1.AuditLogModel.create({
            adminId: new mongoose_1.Types.ObjectId(adminId),
            adminName,
            action,
            targetType,
            targetId: targetId.toString(),
            meta,
        });
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
    }
};
async function loginAdmin(email, password) {
    const admin = await Admin_model_1.AdminUserModel.findOne({ email }).select('+passwordHash');
    if (!admin) {
        throw new error_1.AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }
    if (!admin.isActive) {
        throw new error_1.AppError('Account is deactivated. Please contact super admin.', 401, 'ACCOUNT_DEACTIVATED');
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
        throw new error_1.AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }
    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });
    // Create audit log
    await createAuditLog(admin._id.toString(), admin.name, types_1.AuditAction.LOGIN, 'admin', admin._id, { email: admin.email });
    const token = generateToken(admin._id.toString(), admin.role);
    // Check if onboarding is required
    const requiresOnboarding = !admin.onboardingCompleted;
    return {
        token,
        admin: admin.toObject(),
        requiresOnboarding,
    };
}
async function logoutAdmin(adminId, adminName) {
    await createAuditLog(adminId, adminName, types_1.AuditAction.LOGOUT, 'admin', adminId, {});
}
async function getCurrentAdmin(adminId) {
    const admin = await Admin_model_1.AdminUserModel.findById(adminId);
    if (!admin) {
        throw new error_1.AppError('Admin not found.', 404, 'NOT_FOUND');
    }
    const onboarding = {
        currentStep: admin.onboardingStep,
        acceptedTerms: admin.acceptedTermsAt !== null,
        profileCompleted: admin.profileCompletedAt !== null,
        trainingCompleted: admin.trainingCompletedAt !== null,
        hasCompletedOnboarding: admin.onboardingCompleted,
        onboardingData: {
            name: admin.name,
            email: admin.email,
            role: admin.role,
        },
    };
    return {
        ...admin.toObject(),
        onboarding,
    };
}
async function completeOnboardingStep(adminId, step, data) {
    const admin = await Admin_model_1.AdminUserModel.findById(adminId);
    if (!admin) {
        throw new error_1.AppError('Admin not found.', 404, 'NOT_FOUND');
    }
    if (admin.onboardingCompleted) {
        throw new error_1.AppError('Onboarding already completed.', 400, 'ONBOARDING_COMPLETED');
    }
    let nextStep = null;
    let completed = false;
    switch (step) {
        case 'accept_terms':
            if (!data.acceptedTerms) {
                throw new error_1.AppError('Terms must be accepted.', 400, 'TERMS_NOT_ACCEPTED');
            }
            admin.acceptedTermsAt = new Date();
            admin.onboardingStep = 'profile';
            nextStep = 'profile';
            break;
        case 'profile':
            if (data.profileData?.name)
                admin.name = data.profileData.name;
            if (data.profileData?.email)
                admin.email = data.profileData.email;
            admin.profileCompletedAt = new Date();
            admin.onboardingStep = 'training';
            nextStep = 'training';
            break;
        case 'training':
            if (data.trainingCompleted) {
                admin.trainingCompletedAt = new Date();
                admin.onboardingCompleted = true;
                admin.onboardingStep = 'complete';
                completed = true;
                nextStep = null;
            }
            else {
                throw new error_1.AppError('Training must be completed.', 400, 'TRAINING_NOT_COMPLETED');
            }
            break;
        default:
            throw new error_1.AppError('Invalid onboarding step.', 400, 'INVALID_STEP');
    }
    await admin.save();
    await createAuditLog(adminId, admin.name, types_1.AuditAction.PASSWORD_CHANGE, // Using PASSWORD_CHANGE as generic, you may want a dedicated ONBOARDING_STEP_COMPLETED action
    'admin', admin._id, { step, completed });
    return {
        admin: admin.toObject(),
        nextStep,
        completed,
    };
}
async function changePassword(adminId, adminName, input) {
    const admin = await Admin_model_1.AdminUserModel.findById(adminId).select('+passwordHash');
    if (!admin) {
        throw new error_1.AppError('Admin not found.', 404, 'NOT_FOUND');
    }
    const isPasswordValid = await bcryptjs_1.default.compare(input.currentPassword, admin.passwordHash);
    if (!isPasswordValid) {
        throw new error_1.AppError('Current password is incorrect.', 401, 'INVALID_PASSWORD');
    }
    const hashedPassword = await bcryptjs_1.default.hash(input.newPassword, 10);
    admin.passwordHash = hashedPassword;
    await admin.save();
    await createAuditLog(adminId, adminName, types_1.AuditAction.PASSWORD_CHANGE, 'admin', admin._id, {});
}
async function forgotPassword(email) {
    const admin = await Admin_model_1.AdminUserModel.findOne({ email });
    if (!admin) {
        // Don't reveal that email doesn't exist for security
        return;
    }
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = resetExpires;
    await admin.save();
    // TODO: Send email with reset link
    console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
}
async function resetPassword(input) {
    const admin = await Admin_model_1.AdminUserModel.findOne({
        resetPasswordToken: input.token,
        resetPasswordExpires: { $gt: new Date() },
    });
    if (!admin) {
        throw new error_1.AppError('Password reset token is invalid or has expired.', 400, 'INVALID_TOKEN');
    }
    const hashedPassword = await bcryptjs_1.default.hash(input.newPassword, 10);
    admin.passwordHash = hashedPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();
    await createAuditLog(admin._id.toString(), admin.name, types_1.AuditAction.PASSWORD_CHANGE, 'admin', admin._id, { reset: true });
}
// ============ Admin Management ============
async function createAdmin(input) {
    const existingAdmin = await Admin_model_1.AdminUserModel.findOne({ email: input.email.toLowerCase() });
    if (existingAdmin) {
        throw new error_1.AppError('Admin with this email already exists.', 409, 'DUPLICATE_EMAIL');
    }
    let passwordHash;
    let inviteSent = false;
    if (input.password) {
        passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    }
    else if (input.sendInvite) {
        // Generate temporary password for invite
        const tempPassword = Math.random().toString(36).substring(2, 10);
        passwordHash = await bcryptjs_1.default.hash(tempPassword, 10);
        inviteSent = true;
        // TODO: Send invite email with temp password
        console.log(`[INVITE] Admin created for ${input.email} with temp password: ${tempPassword}`);
    }
    else {
        throw new error_1.AppError('Either password or sendInvite must be provided.', 400, 'INVALID_INPUT');
    }
    const admin = await Admin_model_1.AdminUserModel.create({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        isActive: true,
        onboardingCompleted: false,
        onboardingStep: 'welcome',
    });
    // Audit log will be created by caller with admin context
    // For system creation, we skip audit log
    return {
        admin: admin.toObject(),
        inviteSent: inviteSent || undefined,
    };
}
async function getAdmins(filters = {}) {
    const { role, isActive, search, page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc', } = filters;
    const filter = {};
    if (role) {
        filter.role = role;
    }
    if (isActive !== undefined) {
        filter.isActive = isActive;
    }
    if (search?.trim()) {
        filter.$or = [
            { name: { $regex: search.trim(), $options: 'i' } },
            { email: { $regex: search.trim(), $options: 'i' } },
        ];
    }
    const skip = (page - 1) * pageSize;
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [admins, total] = await Promise.all([
        Admin_model_1.AdminUserModel.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize)
            .select('-passwordHash -resetPasswordToken -resetPasswordExpires'),
        Admin_model_1.AdminUserModel.countDocuments(filter),
    ]);
    return {
        data: admins.map(a => a.toObject()),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getAdminById(adminId) {
    const admin = await Admin_model_1.AdminUserModel.findById(adminId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    if (!admin) {
        throw new error_1.AppError('Admin not found.', 404, 'NOT_FOUND');
    }
    return admin.toObject();
}
async function updateAdmin(adminId, input, actorId, actorName) {
    const admin = await Admin_model_1.AdminUserModel.findById(adminId);
    if (!admin) {
        throw new error_1.AppError('Admin not found.', 404, 'NOT_FOUND');
    }
    const changes = {};
    if (input.name !== undefined && input.name !== admin.name) {
        changes.name = { from: admin.name, to: input.name };
        admin.name = input.name;
    }
    if (input.role !== undefined && input.role !== admin.role) {
        changes.role = { from: admin.role, to: input.role };
        admin.role = input.role;
        await createAuditLog(actorId, actorName, types_1.AuditAction.ROLE_CHANGED, 'admin', admin._id, { fromRole: changes.role?.from, toRole: changes.role?.to });
    }
    if (input.isActive !== undefined && input.isActive !== admin.isActive) {
        changes.isActive = { from: admin.isActive, to: input.isActive };
        admin.isActive = input.isActive;
        const action = input.isActive ? types_1.AuditAction.ADMIN_ACTIVATED : types_1.AuditAction.ADMIN_DEACTIVATED;
        await createAuditLog(actorId, actorName, action, 'admin', admin._id, {});
    }
    await admin.save();
    const updatedAdmin = await Admin_model_1.AdminUserModel.findById(adminId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    return updatedAdmin.toObject();
}
async function deleteAdmin(adminId, actorId, actorName, reason) {
    const admin = await Admin_model_1.AdminUserModel.findById(adminId);
    if (!admin) {
        throw new error_1.AppError('Admin not found.', 404, 'NOT_FOUND');
    }
    if (admin.role === types_1.AdminRole.SUPER_ADMIN) {
        throw new error_1.AppError('Cannot delete super admin.', 403, 'FORBIDDEN');
    }
    admin.isActive = false;
    admin.removedAt = new Date();
    admin.removedBy = new mongoose_1.Types.ObjectId(actorId);
    await admin.save();
    await createAuditLog(actorId, actorName, types_1.AuditAction.ADMIN_REMOVED, 'admin', admin._id, { reason });
}
async function reactivateAdmin(adminId, actorId, actorName) {
    const admin = await Admin_model_1.AdminUserModel.findById(adminId);
    if (!admin) {
        throw new error_1.AppError('Admin not found.', 404, 'NOT_FOUND');
    }
    admin.isActive = true;
    admin.removedAt = null;
    admin.removedBy = null;
    await admin.save();
    await createAuditLog(actorId, actorName, types_1.AuditAction.ADMIN_ACTIVATED, 'admin', admin._id, { reactivated: true });
    const reactivatedAdmin = await Admin_model_1.AdminUserModel.findById(adminId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    return reactivatedAdmin.toObject();
}
async function inviteAdmin(input, actorId, actorName) {
    const existingAdmin = await Admin_model_1.AdminUserModel.findOne({ email: input.email.toLowerCase() });
    if (existingAdmin) {
        throw new error_1.AppError('Admin with this email already exists.', 409, 'DUPLICATE_EMAIL');
    }
    const tempPassword = Math.random().toString(36).substring(2, 10);
    const passwordHash = await bcryptjs_1.default.hash(tempPassword, 10);
    const inviteToken = generateResetToken();
    const admin = await Admin_model_1.AdminUserModel.create({
        name: input.email.split('@')[0], // Temporary name
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        isActive: true,
        onboardingCompleted: false,
        onboardingStep: 'welcome',
        resetPasswordToken: inviteToken,
        resetPasswordExpires: new Date(Date.now() + 7 * 24 * 3600000), // 7 days
    });
    await createAuditLog(actorId, actorName, types_1.AuditAction.ADMIN_CREATED, 'admin', admin._id, { invite: true, message: input.message });
    // TODO: Send invite email with link containing token
    console.log(`[INVITE] Invite sent to ${input.email} with token: ${inviteToken}, temp password: ${tempPassword}`);
    return {
        message: `Invite sent to ${input.email}`,
        inviteId: admin._id.toString(),
    };
}
async function acceptInvite(token, password, name) {
    const admin = await Admin_model_1.AdminUserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
    });
    if (!admin) {
        throw new error_1.AppError('Invite token is invalid or has expired.', 400, 'INVALID_TOKEN');
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    admin.passwordHash = passwordHash;
    admin.name = name;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();
    const authToken = generateToken(admin._id.toString(), admin.role);
    await createAuditLog(admin._id.toString(), admin.name, types_1.AuditAction.PASSWORD_CHANGE, 'admin', admin._id, { inviteAccepted: true });
    return {
        token: authToken,
        admin: admin.toObject(),
    };
}
async function changeAdminRole(adminId, newRole, reason, actorId, actorName) {
    const admin = await Admin_model_1.AdminUserModel.findById(adminId);
    if (!admin) {
        throw new error_1.AppError('Admin not found.', 404, 'NOT_FOUND');
    }
    const oldRole = admin.role;
    admin.role = newRole;
    await admin.save();
    await createAuditLog(actorId, actorName, types_1.AuditAction.ROLE_CHANGED, 'admin', admin._id, { fromRole: oldRole, toRole: newRole, reason });
    const updatedAdmin = await Admin_model_1.AdminUserModel.findById(adminId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    return updatedAdmin.toObject();
}
// ============ Audit Log Service ============
async function getAuditLogs(filters = {}) {
    const { adminId, action, targetType, startDate, endDate, page = 1, pageSize = 50, } = filters;
    const filter = {};
    if (adminId) {
        filter.adminId = new mongoose_1.Types.ObjectId(adminId);
    }
    if (action) {
        filter.action = action;
    }
    if (targetType) {
        filter.targetType = targetType;
    }
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate);
        }
    }
    const skip = (page - 1) * pageSize;
    const [logs, total] = await Promise.all([
        Admin_model_1.AuditLogModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('adminId', 'name email'),
        Admin_model_1.AuditLogModel.countDocuments(filter),
    ]);
    return {
        data: logs.map(log => log.toObject()),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getMyAuditLogs(adminId, page = 1, pageSize = 20) {
    return getAuditLogs({
        adminId,
        page,
        pageSize,
    });
}
// ============ Instructor Service ============
async function getInstructors(search, limit = 50) {
    const filter = {
        role: types_1.AdminRole.INSTRUCTOR,
        isActive: true,
    };
    if (search?.trim()) {
        filter.$or = [
            { name: { $regex: search.trim(), $options: 'i' } },
            { email: { $regex: search.trim(), $options: 'i' } },
        ];
    }
    const instructors = await Admin_model_1.AdminUserModel.find(filter)
        .limit(limit)
        .select('name email role');
    return instructors.map(i => i.toObject());
}
async function getInstructorModules(instructorId) {
    // This would need to be implemented based on your module/course schema
    // For now, return mock data structure
    const instructor = await Admin_model_1.AdminUserModel.findById(instructorId);
    if (!instructor) {
        throw new error_1.AppError('Instructor not found.', 404, 'NOT_FOUND');
    }
    if (instructor.role !== types_1.AdminRole.INSTRUCTOR) {
        throw new error_1.AppError('User is not an instructor.', 400, 'NOT_INSTRUCTOR');
    }
    // TODO: Implement actual module fetching from Module model
    // This is a placeholder
    return [];
}
//# sourceMappingURL=admin.service.js.map