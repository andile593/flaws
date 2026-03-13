import { Request, Response } from 'express'
import prisma from '../lib/prisma'

// GET /api/products
export const getAllProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      images: true,
      variants: true,
      collection: true,
    },
  })
  res.json(products)
}

// GET /api/products/:slug
export const getProductBySlug = async (req: Request, res: Response) => {
  const slug = req.params.slug as string
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: true,
      variants: true,
      collection: true,
    },
  })
  if (!product) return res.status(404).json({ message: 'Product not found' })
  res.json(product)
}

// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
  const { name, slug, description, gender, collectionId, images, variants } = req.body
  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      gender,
      collectionId,
      images: { create: images },
      variants: { create: variants },
    },
    include: {
      images: true,
      variants: true,
      collection: true,
    },
  })
  res.status(201).json(product)
}


// PATCH /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string
  const product = await prisma.product.update({
    where: { id },
    data: req.body,
  })
  res.json(product)
}


// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  })
  res.json({ message: 'Product deactivated' })
}