
import { Router } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req, res) => {
  const rows = await prisma.siteContent.findMany()
  const content = Object.fromEntries(rows.map(r => [r.key, r.value]))
  res.json(content)
})

export default router