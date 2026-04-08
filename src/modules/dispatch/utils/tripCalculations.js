import { WAREHOUSE } from '../../../shared/utils/constants';

export function calculateTripRevenue(loads = []) {
  return loads.reduce((sum, l) => sum + (Number(l.total_revenue || l.revenue) || 0), 0);
}

export function calculateDriverPay(payType, payRate, miles, revenue, stopCount) {
  const rate = Number(payRate) || 0;
  switch (payType) {
    case 'flat': return rate;
    case 'per_mile': return rate * (Number(miles) || 0);
    case 'percentage': return (rate / 100) * (Number(revenue) || 0);
    case 'hourly': return rate * 10;
    case 'per_stop': return rate * (Number(stopCount) || 0);
    default: return 0;
  }
}

export function calculateMargin(revenue, carrierCost, driverPay) {
  const rev = Number(revenue) || 0;
  const cost = Number(carrierCost) || Number(driverPay) || 0;
  return rev - cost;
}

export function getStopTypeLabel(stopType) {
  const map = {
    pickup: 'Pickup', delivery: 'Delivery',
    drop_warehouse: 'Drop at Dock', pickup_warehouse: 'Pick from Dock',
  };
  return map[stopType] || stopType;
}

export function getStopTypeIcon(stopType) {
  const map = {
    pickup: '\u{1F4E6}', delivery: '\u{1F3E0}',
    drop_warehouse: '\u{1F3ED}', pickup_warehouse: '\u{1F3ED}',
  };
  return map[stopType] || '\u{1F4CD}';
}

export function getRoutePreview(tripType) {
  switch (tripType) {
    case 'direct':
      return '\u{1F3E2} Signal WH \u2192 \u{1F4E6} Pickup \u2192 \u{1F3E0} Delivery \u2192 \u{1F3E2} Signal WH';
    case 'inbound':
      return '\u{1F3E2} Signal WH \u2192 \u{1F4E6} Pickup \u2192 \u{1F3E2} Signal WH';
    case 'outbound':
      return '\u{1F3E2} Signal WH \u2192 \u{1F3ED} Dock \u2192 \u{1F3E0} Delivery \u2192 \u{1F3E2} Signal WH';
    case 'multi_stop':
      return '\u{1F3E2} Signal WH \u2192 \u{1F4E6}\u{1F4E6}\u{1F4E6} Multiple \u2192 \u{1F3E0}\u{1F3E0}\u{1F3E0} Multiple \u2192 \u{1F3E2} Signal WH';
    case 'continuation':
      return '\u{1F4CD} Last Delivery \u2192 \u{1F4E6} Pickup \u2192 \u{1F3E2} Signal WH';
    default:
      return 'Pickup \u2192 Delivery';
  }
}

export function getTripTypeIcon(tripType) {
  const map = {
    direct: '\u{1F4E6}', inbound: '\u{1F3ED}', outbound: '\u{1F69B}',
    multi_stop: '\u{1F504}', continuation: '\u21A9\uFE0F',
  };
  return map[tripType] || '\u{1F4E6}';
}

export function groupLoadsByDate(loads = []) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const groups = { today: [], tomorrow: [], dayAfter: [], future: [], noDate: [] };
  loads.forEach((l) => {
    const d = l.pickup_date?.slice(0, 10);
    if (!d) groups.noDate.push(l);
    else if (d === today) groups.today.push(l);
    else if (d === tomorrow) groups.tomorrow.push(l);
    else if (d === dayAfter) groups.dayAfter.push(l);
    else groups.future.push(l);
  });
  return groups;
}

export function loadTotals(loads = []) {
  return {
    count: loads.length,
    weight: loads.reduce((s, l) => s + (Number(l.weight) || 0), 0),
    revenue: loads.reduce((s, l) => s + (Number(l.total_revenue || l.revenue) || 0), 0),
    pieces: loads.reduce((s, l) => s + (Number(l.pieces) || 0), 0),
  };
}

export function getPayRateLabel(payType) {
  const map = {
    flat: 'Amount $', per_mile: 'Rate $/mile', percentage: '% of revenue',
    hourly: '$/hour', per_stop: '$/stop',
  };
  return map[payType] || 'Rate';
}

export function getPayEstimateLabel(payType, rate, miles, revenue, stopCount) {
  const pay = calculateDriverPay(payType, rate, miles, revenue, stopCount);
  return pay;
}
