export const debounce = (fn, ms = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export const statusColor = (status) => {
  const map = {
    available: 'badge-available', dispatched: 'badge-dispatched',
    at_pickup: 'badge-dispatched', in_transit: 'badge-enroute',
    en_route: 'badge-enroute', at_delivery: 'badge-delivered',
    delivered: 'badge-delivered', on_dock: 'badge-pending',
    cancelled: 'badge-void', planned: 'badge-draft',
    active: 'badge-available', in_progress: 'badge-available',
    completed: 'badge-delivered', draft: 'badge-draft',
    sent: 'badge-available', unpaid: 'badge-pending',
    partial: 'badge-invoiced', invoiced: 'badge-invoiced',
    paid: 'badge-paid', void: 'badge-void',
    overdue: 'badge-overdue', pending: 'badge-pending',
    approved: 'badge-available',
    direct: 'badge-available', inbound: 'badge-invoiced', outbound: 'badge-delivered',
    dnu: 'badge-overdue',
    PORTAL: 'badge-portal', INTERNAL: 'badge-internal',
    portal: 'badge-portal', internal: 'badge-internal',
  };
  return map[status] || 'badge-draft';
};

export const tripTypeLabel = (type) => {
  const map = { direct: 'Direct', inbound: 'Inbound', outbound: 'Outbound', multi_stop: 'Multi-Stop', continuation: 'Continuation' };
  return map[type] || type;
};

export const classNames = (...args) => args.filter(Boolean).join(' ');

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
