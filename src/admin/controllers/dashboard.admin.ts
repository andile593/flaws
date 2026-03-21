import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import { layout } from '../views/layout'

type Interval = 'daily' | 'weekly' | 'monthly' | 'yearly'

function getDateRange(interval: Interval): { from: Date; points: number; labelFn: (d: Date) => string; stepFn: (d: Date, i: number) => Date } {
  const now = new Date()

  switch (interval) {
    case 'daily':
      // Last 30 days, one point per day
      return {
        from: new Date(new Date().setDate(now.getDate() - 29)),
        points: 30,
        labelFn: (d) => `${d.getDate()}/${d.getMonth() + 1}`,
        stepFn: (base, i) => {
          const d = new Date(now)
          d.setDate(now.getDate() - (29 - i))
          d.setHours(0, 0, 0, 0)
          return d
        },
      }
    case 'weekly':
      // Last 12 weeks, one point per week
      return {
        from: new Date(new Date().setDate(now.getDate() - 83)),
        points: 12,
        labelFn: (d) => `W${getWeekNumber(d)}`,
        stepFn: (base, i) => {
          const d = new Date(now)
          d.setDate(now.getDate() - (11 - i) * 7)
          d.setHours(0, 0, 0, 0)
          return d
        },
      }
    case 'monthly':
      // Last 12 months, one point per month
      return {
        from: new Date(new Date().setMonth(now.getMonth() - 11)),
        points: 12,
        labelFn: (d) => d.toLocaleString('default', { month: 'short' }),
        stepFn: (base, i) => {
          const d = new Date(now)
          d.setMonth(now.getMonth() - (11 - i))
          d.setDate(1)
          d.setHours(0, 0, 0, 0)
          return d
        },
      }
    case 'yearly':
      // Last 5 years, one point per year
      return {
        from: new Date(new Date().setFullYear(now.getFullYear() - 4)),
        points: 5,
        labelFn: (d) => `${d.getFullYear()}`,
        stepFn: (base, i) => {
          const d = new Date(now)
          d.setFullYear(now.getFullYear() - (4 - i))
          d.setMonth(0, 1)
          d.setHours(0, 0, 0, 0)
          return d
        },
      }
  }
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function groupOrders(orders: { createdAt: Date; total: any }[], interval: Interval, points: number, stepFn: (base: Date, i: number) => Date) {
  return Array.from({ length: points }, (_, i) => {
    const stepDate = stepFn(new Date(), i)

    const revenue = orders
      .filter(o => {
        const od = o.createdAt
        if (interval === 'daily') {
          return od.toISOString().slice(0, 10) === stepDate.toISOString().slice(0, 10)
        }
        if (interval === 'weekly') {
          const weekStart = new Date(stepDate)
          const weekEnd = new Date(stepDate)
          weekEnd.setDate(weekStart.getDate() + 6)
          return od >= weekStart && od <= weekEnd
        }
        if (interval === 'monthly') {
          return od.getFullYear() === stepDate.getFullYear() && od.getMonth() === stepDate.getMonth()
        }
        if (interval === 'yearly') {
          return od.getFullYear() === stepDate.getFullYear()
        }
        return false
      })
      .reduce((sum, o) => sum + Number(o.total), 0)

    return { date: stepDate, revenue }
  })
}

function buildSVG(chartData: { date: Date; revenue: number }[], labelFn: (d: Date) => string, interval: Interval) {
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const chartWidth = 900
  const chartHeight = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 60 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const points = chartData.map((d, i) => {
    const x = padding.left + (i / Math.max(chartData.length - 1, 1)) * innerWidth
    const y = padding.top + innerHeight - (d.revenue / maxRevenue) * innerHeight
    return { x, y, ...d }
  })

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaPoints = [
    `${points[0].x},${padding.top + innerHeight}`,
    ...points.map(p => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${padding.top + innerHeight}`,
  ].join(' ')

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
    const value = maxRevenue * ratio
    const y = padding.top + innerHeight - ratio * innerHeight
    return `<text x="${padding.left - 8}" y="${y + 4}" fill="#555" font-size="10" text-anchor="end">R${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)}</text>`
  }).join('')

  const xLabels = chartData.map((d, i) => {
    const skip = interval === 'daily' ? 5 : 1
    if (i % skip !== 0) return ''
    const x = padding.left + (i / Math.max(chartData.length - 1, 1)) * innerWidth
    return `<text x="${x}" y="${chartHeight - 5}" fill="#555" font-size="10" text-anchor="middle">${labelFn(d.date)}</text>`
  }).join('')

  const dotSkip = interval === 'daily' ? 5 : 1

  return `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:200px;">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${[0.25, 0.5, 0.75, 1].map(ratio => {
        const y = padding.top + innerHeight - ratio * innerHeight
        return `<line x1="${padding.left}" y1="${y}" x2="${padding.left + innerWidth}" y2="${y}" stroke="#1a1a1a" stroke-width="1"/>`
      }).join('')}
      <polygon points="${areaPoints}" fill="url(#areaGrad)"/>
      <polyline points="${polylinePoints}" fill="none" stroke="#ffffff" stroke-width="1.5"/>
      ${points.filter((_, i) => i % dotSkip === 0).map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="3" fill="#ffffff"/>
      `).join('')}
      ${yLabels}
      ${xLabels}
      ${points.map(p => `
        <g class="chart-point" data-date="${p.date.toISOString()}" data-revenue="${p.revenue.toFixed(2)}">
          <line x1="${p.x}" y1="${padding.top}" x2="${p.x}" y2="${padding.top + innerHeight}" stroke="transparent" stroke-width="20"/>
          <circle cx="${p.x}" cy="${p.y}" r="6" fill="transparent"/>
        </g>
      `).join('')}
    </svg>
  `
}

export async function getDashboard(req: Request, res: Response) {
  const interval: Interval = (req.query.interval as Interval) || 'daily'
  const now = new Date()

  const { from, points, labelFn, stepFn } = getDateRange(interval)

  const [totalOrders, totalUsers, totalProducts, recentOrders, revenue, periodOrders, lowStockVariants] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true, items: true },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: from },
        status: { not: 'CANCELLED' },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { name: true } } },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
  ])

  const totalRevenue = Number(revenue._sum.total || 0).toFixed(2)
  const chartData = groupOrders(periodOrders, interval, points, stepFn)
  const svgChart = buildSVG(chartData, labelFn, interval)

  const intervalLabels: Record<Interval, string> = {
    daily: 'Last 30 Days',
    weekly: 'Last 12 Weeks',
    monthly: 'Last 12 Months',
    yearly: 'Last 5 Years',
  }

  const intervalButtons = (['daily', 'weekly', 'monthly', 'yearly'] as Interval[]).map(iv => `
    <a href="/admin?interval=${iv}" style="
      display:inline-block;
      padding:0.4rem 0.9rem;
      font-size:0.6rem;
      letter-spacing:0.15em;
      text-transform:uppercase;
      text-decoration:none;
      border:1px solid ${interval === iv ? '#ffffff' : '#333'};
      color:${interval === iv ? '#ffffff' : '#888'};
      background:${interval === iv ? '#1a1a1a' : 'none'};
      transition:all 0.2s;
    ">${iv}</a>
  `).join('')

  const lowStockRows = lowStockVariants.length === 0
    ? '<div class="empty-state" style="padding:2rem;">All variants well stocked</div>'
    : lowStockVariants.map(v => `
        <tr>
          <td><strong>${v.product.name}</strong></td>
          <td style="color:#888;">${v.color} / ${v.size}</td>
          <td>
            <span style="
              display:inline-block;padding:3px 10px;font-size:0.6rem;
              letter-spacing:0.1em;font-weight:600;
              background:${v.stock === 0 ? '#1a0000' : '#1a0a00'};
              color:${v.stock === 0 ? '#ff6b6b' : '#ffb347'};
              border:1px solid ${v.stock === 0 ? '#ff6b6b33' : '#ffb34733'};
            ">
              ${v.stock === 0 ? 'OUT OF STOCK' : `${v.stock} left`}
            </span>
          </td>
          <td><a href="/admin/products/${v.productId}/edit" class="btn btn-sm btn-secondary">Restock</a></td>
        </tr>
      `).join('')

  const recentRows = recentOrders.map(o => `
    <tr>
      <td style="color:#888;font-size:0.7rem;">#${o.id.slice(0, 8).toUpperCase()}</td>
      <td>${o.user.name}</td>
      <td>R${Number(o.total).toFixed(2)}</td>
      <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
      <td style="color:#888;font-size:0.7rem;">${new Date(o.createdAt).toLocaleDateString('en-ZA')}</td>
      <td><a href="/admin/orders/${o.id}" class="btn btn-sm btn-secondary">View</a></td>
    </tr>
  `).join('')

  const body = `
    <!-- Stats -->
    <div class="card-grid">
      <div class="card">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value">R${totalRevenue}</div>
        <div class="stat-sub">Excluding cancelled</div>
      </div>
      <div class="card">
        <div class="stat-label">Total Orders</div>
        <div class="stat-value">${totalOrders}</div>
      </div>
      <div class="card">
        <div class="stat-label">Customers</div>
        <div class="stat-value">${totalUsers}</div>
      </div>
      <div class="card">
        <div class="stat-label">Products</div>
        <div class="stat-value">${totalProducts}</div>
      </div>
    </div>

    <!-- Revenue Chart -->
    <div class="card" style="margin-bottom:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <div class="stat-label">Revenue</div>
          <div style="font-size:0.85rem;font-weight:600;">${intervalLabels[interval]}</div>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          ${intervalButtons}
          <div id="chart-tooltip" style="font-size:0.75rem;color:#888;text-align:right;min-width:80px;"></div>
        </div>
      </div>
      <div id="chart-container" style="position:relative;">
        ${svgChart}
      </div>
    </div>

    <!-- Bottom grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
      <div class="card">
        <div class="page-header" style="margin-bottom:1.5rem;">
          <span style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Recent Orders</span>
          <a href="/admin/orders" class="btn btn-sm btn-secondary">View All</a>
        </div>
        ${recentOrders.length === 0 ? '<div class="empty-state">No orders yet</div>' : `
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>${recentRows}</tbody>
          </table>
        `}
      </div>
      <div class="card">
        <div class="page-header" style="margin-bottom:1.5rem;">
          <span style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;">
            Stock Alerts
            ${lowStockVariants.length > 0 ? `<span style="display:inline-block;margin-left:0.5rem;background:#1a0000;color:#ff6b6b;font-size:0.55rem;padding:2px 8px;border-radius:2px;">${lowStockVariants.length}</span>` : ''}
          </span>
          <a href="/admin/products" class="btn btn-sm btn-secondary">All Products</a>
        </div>
        <table>
          <thead><tr><th>Product</th><th>Variant</th><th>Stock</th><th></th></tr></thead>
          <tbody>${lowStockRows}</tbody>
        </table>
      </div>
    </div>

    <script>
      document.querySelectorAll('.chart-point').forEach(point => {
        point.addEventListener('mouseenter', function() {
          const date = new Date(this.dataset.date)
          const revenue = this.dataset.revenue
          const interval = '${interval}'
          let label = ''
          if (interval === 'daily') {
            label = date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
          } else if (interval === 'weekly') {
            label = 'Week of ' + date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
          } else if (interval === 'monthly') {
            label = date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
          } else if (interval === 'yearly') {
            label = date.getFullYear().toString()
          }
          document.getElementById('chart-tooltip').innerHTML =
            '<span style="color:#fff;font-weight:600;">R' + revenue + '</span>' +
            '<br/><span style="color:#555;font-size:0.65rem;">' + label + '</span>'
        })
        point.addEventListener('mouseleave', function() {
          document.getElementById('chart-tooltip').innerHTML = ''
        })
      })
    </script>
  `

  res.send(layout('Dashboard', body, 'dashboard'))
}