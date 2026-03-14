import prisma from '../../lib/prisma'

export async function logActivity(
  action: string,
  entity: string,
  detail: string,
  entityId?: string,
  meta?: object
) {
  try {
    await prisma.activityLog.create({
      data: { action, entity, detail, entityId, meta },
    })
  } catch (err) {
    console.error('Failed to write activity log:', err)
  }
}