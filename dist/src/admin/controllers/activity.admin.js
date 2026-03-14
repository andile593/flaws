"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLog = getActivityLog;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const layout_1 = require("../views/layout");
const ACTION_COLORS = {
    PRODUCT_CREATED: '#81c784',
    PRODUCT_UPDATED: '#4fc3f7',
    PRODUCT_DELETED: '#ef9a9a',
    COLLECTION_CREATED: '#81c784',
    COLLECTION_UPDATED: '#4fc3f7',
    COLLECTION_DELETED: '#ef9a9a',
    ORDER_STATUS_CHANGED: '#ffeb3b',
    ADMIN_LOGIN: '#ce93d8',
    ADMIN_LOGOUT: '#888888',
    USER_CART_UPDATED: '#80cbc4',
    SITE_CONTENT_UPDATED: '#ffcc80',
};
async function getActivityLog(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;
    const entity = req.query.entity || '';
    const where = entity ? { entity } : {};
    const [logs, total] = await Promise.all([
        prisma_1.default.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma_1.default.activityLog.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    const entities = ['Product', 'Collection', 'Order', 'Admin', 'User', 'SiteContent'];
    const filterTabs = ['', ...entities].map(e => `
    <button
      onclick="window.location.href='/admin/activity${e ? '?entity=' + e : ''}'"
      class="tab ${entity === e ? 'active' : ''}"
    >${e || 'All'}</button>
  `).join('');
    const rows = logs.map((log) => {
        const color = ACTION_COLORS[log.action] || '#888';
        const time = new Date(log.createdAt);
        const timeStr = time.toLocaleString('en-ZA', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
        return `
      <tr>
        <td style="color:#888;font-size:0.7rem;white-space:nowrap;">${timeStr}</td>
        <td>
          <span style="display:inline-block;padding:2px 8px;font-size:0.55rem;letter-spacing:0.1em;
            background:${color}22;color:${color};text-transform:uppercase;font-weight:600;">
            ${log.action.replace(/_/g, ' ')}
          </span>
        </td>
        <td style="color:#888;font-size:0.7rem;">${log.entity}</td>
        <td style="font-size:0.8rem;">${log.detail}</td>
        <td style="color:#555;font-size:0.65rem;">${log.entityId ? '#' + log.entityId.slice(0, 8).toUpperCase() : '—'}</td>
      </tr>
    `;
    }).join('');
    const pagination = totalPages > 1 ? `
    <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
      ${page > 1 ? `<a href="/admin/activity?entity=${entity}&page=${page - 1}" class="btn btn-sm btn-secondary">← Prev</a>` : ''}
      <span style="font-size:0.7rem;color:#888;padding:0.4rem 0.75rem;">Page ${page} of ${totalPages}</span>
      ${page < totalPages ? `<a href="/admin/activity?entity=${entity}&page=${page + 1}" class="btn btn-sm btn-secondary">Next →</a>` : ''}
    </div>
  ` : '';
    const body = `
    <div class="page-header">
      <span class="page-title">Activity Log</span>
      <span style="font-size:0.75rem;color:#888;">${total} events</span>
    </div>
    <div class="tabs">${filterTabs}</div>
    <div class="card">
      ${logs.length === 0 ? '<div class="empty-state">No activity recorded yet</div>' : `
        <table>
          <thead><tr>
            <th>Time</th><th>Action</th><th>Entity</th><th>Detail</th><th>ID</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${pagination}
      `}
    </div>
  `;
    res.send((0, layout_1.layout)('Activity Log', body, 'activity'));
}
