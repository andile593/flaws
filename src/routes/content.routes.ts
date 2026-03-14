import { Router } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const rows = await prisma.siteContent.findMany()
    const content = Object.fromEntries(rows.map(r => [r.key, r.value]))
    res.json(content)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
})

export default router