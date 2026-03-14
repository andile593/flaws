"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const rows = await prisma_1.default.siteContent.findMany();
    const content = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json(content);
});
exports.default = router;
