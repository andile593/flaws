"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const content_controller_1 = require("../controllers/content.controller");
const router = (0, express_1.Router)();
router.get('/', content_controller_1.getSiteContent);
exports.default = router;
