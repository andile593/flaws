import { Request, Response } from 'express'
import prisma from '../lib/prisma'

export const getSiteContent = async (req: Request, res: Response) => {
  const content = await prisma.siteContent.findMany()
  const map: Record<string, string> = {}
  content.forEach(c => { map[c.key] = c.value })

  res.json({
    banner_text: map['banner_text'] || 'Free shipping on orders over R1000 — South Africa wide',
    hero_headline: map['hero_headline'] || 'New Arrivals',
    hero_subtext: map['hero_subtext'] || 'Explore the latest collection',
    featured_product_ids: map['featured_product_ids'] || '',
    featured_collection_ids: map['featured_collection_ids'] || '',
    waitlist_mode: map['waitlist_mode'] || 'true',
  })
}