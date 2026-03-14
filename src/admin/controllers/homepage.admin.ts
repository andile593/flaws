import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import { layout } from '../views/layout'
import { logActivity } from '../lib/logger'
import type { Product, Collection } from '@prisma/client'

async function getContent(key: string, fallback = '') {
  const row = await prisma.siteContent.findUnique({ where: { key } })
  return row?.value ?? fallback
}

async function setContent(key: string, value: string) {
  await prisma.siteContent.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function getHomepage(req: Request, res: Response) {
  const [
    bannerText,
    heroHeadline,
    heroSubtext,
    allProducts,
    allCollections,
    featuredProductIds,
    featuredCollectionIds,
  ] = await Promise.all([
    getContent('banner_text', 'Free shipping on orders over R1000 — South Africa wide'),
    getContent('hero_headline', 'New Arrivals'),
    getContent('hero_subtext', 'Explore the latest collection'),
    prisma.product.findMany({ orderBy: { name: 'asc' }, include: { images: { where: { isPrimary: true }, take: 1 } } }),
    prisma.collection.findMany({ orderBy: { name: 'asc' } }),
    getContent('featured_product_ids', ''),
    getContent('featured_collection_ids', ''),
  ])

  const featuredPIds = featuredProductIds ? featuredProductIds.split(',') : []
  const featuredCIds = featuredCollectionIds ? featuredCollectionIds.split(',') : []

  const success = req.query.success || ''

  const productCheckboxes = allProducts.map((p: Product & { images: any[] }) => {
    const img = p.images[0]?.url || ''
    const checked = featuredPIds.includes(p.id) ? 'checked' : ''
    return `
      <label style="display:flex;align-items:center;gap:1rem;padding:0.75rem;border:1px solid #1a1a1a;
        cursor:pointer;${checked ? 'border-color:#444;' : ''}">
        <input type="checkbox" name="featured_products" value="${p.id}" ${checked}
          style="accent-color:#fff;width:16px;height:16px;" />
        ${img ? `<img src="${img}" style="width:40px;height:50px;object-fit:cover;background:#1a1a1a;" />` : 
          `<div style="width:40px;height:50px;background:#1a1a1a;"></div>`}
        <span style="font-size:0.8rem;">${p.name}</span>
      </label>
    `
  }).join('')

  const collectionCheckboxes = allCollections.map((c: Collection) => {
    const checked = featuredCIds.includes(c.id) ? 'checked' : ''
    return `
      <label style="display:flex;align-items:center;gap:1rem;padding:0.75rem;border:1px solid #1a1a1a;
        cursor:pointer;${checked ? 'border-color:#444;' : ''}">
        <input type="checkbox" name="featured_collections" value="${c.id}" ${checked}
          style="accent-color:#fff;width:16px;height:16px;" />
        <span style="font-size:0.8rem;">${c.name}</span>
        <span style="font-size:0.65rem;color:#888;margin-left:auto;">${c.gender}</span>
      </label>
    `
  }).join('')

  const body = `
    ${success ? `<div class="alert alert-success" style="margin-bottom:1.5rem;">Homepage updated successfully</div>` : ''}
    <div class="page-header">
      <span class="page-title">Homepage Content</span>
    </div>

    <form method="POST" action="/admin/homepage">
      <!-- Banner & Hero -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1.5rem;">
          Text Content
        </div>
        <div class="form-group">
          <label class="form-label">Announcement Banner</label>
          <input class="form-input" type="text" name="banner_text" value="${bannerText}" />
          <div style="font-size:0.65rem;color:#555;margin-top:0.4rem;">
            Shown at the top of every page (e.g. shipping promotions)
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Hero Headline</label>
            <input class="form-input" type="text" name="hero_headline" value="${heroHeadline}" />
          </div>
          <div class="form-group">
            <label class="form-label">Hero Subtext</label>
            <input class="form-input" type="text" name="hero_subtext" value="${heroSubtext}" />
          </div>
        </div>
      </div>

      <!-- Featured Products -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1.5rem;">
          Featured Products
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0.5rem;">
          ${productCheckboxes}
        </div>
      </div>

      <!-- Featured Collections -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1.5rem;">
          Featured Collections
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          ${collectionCheckboxes}
        </div>
      </div>

      <button type="submit" class="btn btn-primary">Save Homepage</button>
    </form>
  `
  res.send(layout('Homepage', body, 'homepage'))
}

export async function postHomepage(req: Request, res: Response) {
  const { banner_text, hero_headline, hero_subtext } = req.body
  const featuredProducts: string[] = [].concat(req.body.featured_products || [])
  const featuredCollections: string[] = [].concat(req.body.featured_collections || [])

  await Promise.all([
    setContent('banner_text', banner_text || ''),
    setContent('hero_headline', hero_headline || ''),
    setContent('hero_subtext', hero_subtext || ''),
    setContent('featured_product_ids', featuredProducts.join(',')),
    setContent('featured_collection_ids', featuredCollections.join(',')),
  ])

  await logActivity('SITE_CONTENT_UPDATED', 'SiteContent', 'Homepage content updated')

  res.redirect('/admin/homepage?success=1')
}