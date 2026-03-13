import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - no token provided' })
  }

  const token = authHeader.split(' ')[1]

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return res.status(401).json({ message: 'Unauthorized - invalid token' })
  }

  req.user = data.user
  next()
}