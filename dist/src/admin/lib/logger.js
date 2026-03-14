"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function logActivity(action, entity, detail, entityId, meta) {
    try {
        await prisma_1.default.activityLog.create({
            data: { action, entity, detail, entityId, meta },
        });
    }
    catch (err) {
        console.error('Failed to write activity log:', err);
    }
}
