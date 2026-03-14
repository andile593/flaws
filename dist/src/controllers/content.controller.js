"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteContent = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getSiteContent = async (req, res) => {
    const content = await prisma_1.default.siteContent.findMany();
    const map = {};
    content.forEach(c => { map[c.key] = c.value; });
    // Return with defaults
    res.json({
        banner_text: map['banner_text'] || 'Free shipping on orders over R1000 — South Africa wide',
        hero_headline: map['hero_headline'] || 'New Arrivals',
        hero_subtext: map['hero_subtext'] || 'Explore the latest collection',
        featured_product_ids: map['featured_product_ids'] || '',
        featured_collection_ids: map['featured_collection_ids'] || '',
    });
};
exports.getSiteContent = getSiteContent;
