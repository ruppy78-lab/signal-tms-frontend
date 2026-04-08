/**
 * Signal TMS — Shared Rate Engine
 * Extracted from signal_v3.html rate calculator.
 * Single source of truth for both internal quotes and customer portal.
 */

/* ===== Cities / Regions ===== */
const BC_ZONE1 = ['Surrey','Delta','Richmond','Vancouver','Burnaby','New Westminster','Coquitlam','Port Coquitlam','Port Moody','Langley'];
const BC_ZONE2 = ['Abbotsford','Mission','Maple Ridge','Pitt Meadows'];
const BC_ZONE3 = ['Chilliwack','Agassiz','Hope'];

const WA_ZONE1 = ['Seattle','Tukwila','Renton','Kent','Bellevue','Auburn','Federal Way','Fife','Sumner','Tacoma'];
const WA_ZONE2 = ['Redmond','Lakewood','Bothell','Marysville','Monroe','Shoreline','Mountlake Terrace','Woodinville','Kenmore','Arlington','Mt Vernon','Kirkland','Burlington','Snohomish','Lynnwood'];
const WA_ZONE3 = ['Blaine','Custer','Ferndale','Bellingham','Lynden'];
const WA_ZONE4 = ['Olympia','Lacey','Tumwater'];
const PDX_CITIES = ['Portland','Vancouver WA','Beaverton','Tigard','Gresham','Hillsboro','Ridgefield','Woodland','Kalama','Longview','Napavine','Chehalis','Centralia','Troutdale','Canby','Sherwood','Tualatin'];

export const CITY_GROUPS = [
  { label: 'BC — Zone 1', cities: BC_ZONE1 },
  { label: 'BC — Zone 2', cities: BC_ZONE2 },
  { label: 'BC — Zone 3', cities: BC_ZONE3 },
  { label: 'WA — Zone 1', cities: WA_ZONE1 },
  { label: 'WA — Zone 2', cities: WA_ZONE2 },
  { label: 'WA — Zone 3', cities: WA_ZONE3 },
  { label: 'WA — Zone 4', cities: WA_ZONE4 },
  { label: 'PDX', cities: PDX_CITIES },
];

export function getAllCities() {
  return [...BC_ZONE1, ...BC_ZONE2, ...BC_ZONE3, ...WA_ZONE1, ...WA_ZONE2, ...WA_ZONE3, ...WA_ZONE4, ...PDX_CITIES];
}

export function getRegion(city) {
  if (BC_ZONE1.includes(city)) return 'BC1';
  if (BC_ZONE2.includes(city)) return 'BC2';
  if (BC_ZONE3.includes(city)) return 'BC3';
  if (WA_ZONE1.includes(city)) return 'WA1';
  if (WA_ZONE2.includes(city)) return 'WA2';
  if (WA_ZONE3.includes(city)) return 'WA3';
  if (WA_ZONE4.includes(city)) return 'WA4';
  if (PDX_CITIES.includes(city)) return 'PDX';
  return null;
}

/* ===== Fee tables (exact copy from HTML) ===== */
const FEES = {
  MAX_SPOTS: 10,
  SPOT_IN: 48,
  BLOCK_IN: 6,
  PER_SPOT_LB: 1750,
  PER_PALLET_MAX: 3500,
  HEIGHT_MAX: 96,
  MAX_SMALL_SIDE: 50,
  MAX_LARGE_SIDE: 225,

  baseByZone: {
    WA1: { first: 160, secondTotal: 220, extraEach: 50 },
    WA2: { first: 170, secondTotal: 220, extraEach: 50 },
    WA3: { first: 150, secondTotal: 220, extraEach: 50 },
    WA4: { table: { 1:190, 2:250, 3:315, 4:380, 5:445, 6:510, 7:575, 8:640, 9:705, 10:775 } },
    PDX: { first: 250, secondTotal: 350, extraEach: 100 },
  },

  blockFeeByZone: { DEFAULT: 7.50, PDX: 12.50 },

  services: {
    liftgatePickup: 30,
    liftgateDelivery: 30,
    appointmentPickup: 20,
    appointmentDelivery: 20,
    notifyBeforeDelivery: 20,
    jobSiteDelivery: 50,
    limitedAccess: 50,
    guaranteedNextDay: 120,
  },
};

export { FEES };

const LB_PER_BLOCK = FEES.PER_SPOT_LB / 8;

const isBC = (r) => typeof r === 'string' && r.startsWith('BC');
const isWAorPDX = (r) => r === 'WA1' || r === 'WA2' || r === 'WA3' || r === 'WA4' || r === 'PDX';

function bcBaseSurcharge(pRegion, dRegion) {
  const ends = [pRegion, dRegion].filter(Boolean);
  if (ends.includes('BC3')) return 50;
  if (ends.includes('BC2')) return 20;
  return 0;
}

function blockFeeForZone(zone) {
  return FEES.blockFeeByZone[zone] ?? FEES.blockFeeByZone.DEFAULT;
}

function baseForSpots(spots, zone) {
  if (spots <= 0) return 0;
  const z = FEES.baseByZone[zone] || FEES.baseByZone.WA1;
  if (zone === 'WA4' && z.table) {
    if (spots > 10) return null; // error
    return z.table[spots] ?? 0;
  }
  if (spots === 1) return z.first;
  if (spots === 2) return z.secondTotal;
  return z.secondTotal + z.extraEach * (spots - 2);
}

function spotsPerPallet(len, wid) {
  const a = Number(len) || 0;
  const b = Number(wid) || 0;
  if (a <= 0 || b <= 0) return 0;
  const longSide = Math.max(a, b);
  return Math.max(1, Math.floor(longSide / FEES.SPOT_IN));
}

function sizeBlocksPerPallet(len, wid) {
  const a = Number(len) || 0;
  const b = Number(wid) || 0;
  if (a <= 0 || b <= 0) return 0;
  const longSide = Math.max(a, b);
  const spots = Math.max(1, Math.floor(longSide / FEES.SPOT_IN));
  const leftover = Math.max(0, longSide - spots * FEES.SPOT_IN);
  if (leftover <= 0) return 0;
  return Math.ceil(leftover / FEES.BLOCK_IN);
}

/**
 * Main rate calculation — exact logic from signal_v3.html priceQuote()
 *
 * @param {string} pickupCity
 * @param {string} deliveryCity
 * @param {Array<{count:number, len:number, wid:number, ht:number, weight:number}>} pallets
 * @param {Object} accessories - keys: liftPU, liftDEL, apptPU, apptDEL, notifyPU, notifyDEL, jobPU, jobDEL, limitedPU, limitedDEL
 * @returns {Object} { valid, error, total, baseRate, bcSurcharge, sizeCharge, weightCharge, svcTotal, breakdown, totalSpots, totalPieces, totalWeight, zone }
 */
export function calculateRate({ pickupCity, deliveryCity, pallets = [], accessories = {} }) {
  const pRegion = getRegion(pickupCity);
  const dRegion = getRegion(deliveryCity);

  if (!pRegion || !dRegion) {
    return { valid: false, error: 'Select valid pickup and delivery cities', total: 0, breakdown: [] };
  }

  const valid = (isBC(pRegion) && isWAorPDX(dRegion)) || (isWAorPDX(pRegion) && isBC(dRegion));
  if (!valid) {
    return { valid: false, error: 'Route must be BC → WA/PDX or WA/PDX → BC', total: 0, breakdown: [] };
  }

  const billZone = dRegion && !isBC(dRegion) ? dRegion : pRegion && !isBC(pRegion) ? pRegion : null;
  if (!billZone) {
    return { valid: false, error: 'Invalid route — one side must be WA or PDX', total: 0, breakdown: [] };
  }

  // Process pallets
  let spaceSpots = 0, totalSizeBlocks = 0, totalWeight = 0, totalPieces = 0;
  for (const p of pallets) {
    const count = p.count || 1;
    const len = p.len || 48;
    const wid = p.wid || 48;
    const ht = p.ht || 0;
    const rowWeight = p.weight || 0;

    // Validation
    if (ht > FEES.HEIGHT_MAX) {
      return { valid: false, error: `Height > ${FEES.HEIGHT_MAX}". Contact Signal.`, total: 0, breakdown: [] };
    }
    const perPalletW = count > 0 && rowWeight > 0 ? rowWeight / count : 0;
    if (perPalletW > FEES.PER_PALLET_MAX) {
      return { valid: false, error: `Single pallet > ${FEES.PER_PALLET_MAX} lb. Contact Signal.`, total: 0, breakdown: [] };
    }

    spaceSpots += spotsPerPallet(len, wid) * count;
    totalSizeBlocks += sizeBlocksPerPallet(len, wid) * count;
    totalWeight += rowWeight;
    totalPieces += count;
  }

  if (spaceSpots <= 0) {
    return { valid: false, error: 'Enter at least one pallet', total: 0, breakdown: [] };
  }

  // Size blocks → extra spots + remaining blocks
  const sizeExtraSpots = Math.floor(totalSizeBlocks / 8);
  const sizeBlocksToCharge = totalSizeBlocks % 8;
  const totalSpots = spaceSpots + sizeExtraSpots;

  if (totalSpots > FEES.MAX_SPOTS) {
    return { valid: false, error: `Max ${FEES.MAX_SPOTS} spots. Split the load.`, total: 0, breakdown: [] };
  }

  // Base rate + BC surcharge
  const baseVal = baseForSpots(totalSpots, billZone);
  if (baseVal === null) {
    return { valid: false, error: 'Max 10 spots for WA4 zone', total: 0, breakdown: [] };
  }
  const surcharge = bcBaseSurcharge(pRegion, dRegion);
  const baseRate = baseVal + surcharge;

  // Size block charge
  const blockFee = blockFeeForZone(billZone);
  const sizeCharge = sizeBlocksToCharge * blockFee;

  // Weight blocks
  const allowed = totalSpots * FEES.PER_SPOT_LB;
  const overWeight = Math.max(0, totalWeight - allowed);
  const wBlocks = overWeight > 0 ? Math.ceil(overWeight / LB_PER_BLOCK) : 0;
  const weightCharge = wBlocks * blockFee;

  // Accessorials
  const S = FEES.services;
  let svcTotal = 0;
  const svcLines = [];
  const addSvc = (key, label, amt) => { if (accessories[key]) { svcTotal += amt; svcLines.push({ label, amt }); } };

  addSvc('liftPU', 'Liftgate Pickup', S.liftgatePickup);
  addSvc('apptPU', 'Appointment Pickup', S.appointmentPickup);
  addSvc('limitedPU', 'Limited Access Pickup', S.limitedAccess);
  addSvc('notifyPU', 'Notify Before Pickup', S.notifyBeforeDelivery);
  addSvc('jobPU', 'Job Site Pickup', S.jobSiteDelivery);

  addSvc('liftDEL', 'Liftgate Delivery', S.liftgateDelivery);
  addSvc('apptDEL', 'Appointment Delivery', S.appointmentDelivery);
  addSvc('limitedDEL', 'Limited Access Delivery', S.limitedAccess);
  addSvc('notifyDEL', 'Notify Before Delivery', S.notifyBeforeDelivery);
  addSvc('jobDEL', 'Job Site Delivery', S.jobSiteDelivery);

  const total = baseRate + sizeCharge + weightCharge + svcTotal;

  // Build breakdown lines
  const breakdown = [];
  breakdown.push({ label: `Base Rate (${totalSpots} spot${totalSpots > 1 ? 's' : ''}, ${billZone})`, amt: baseVal });
  if (surcharge > 0) breakdown.push({ label: `BC ${pRegion?.startsWith('BC') ? pRegion : dRegion} Surcharge`, amt: surcharge });
  if (sizeCharge > 0) breakdown.push({ label: `Size Blocks (${sizeBlocksToCharge} × $${blockFee.toFixed(2)})`, amt: sizeCharge });
  if (weightCharge > 0) breakdown.push({ label: `Overweight (${wBlocks} blocks × $${blockFee.toFixed(2)})`, amt: weightCharge });
  breakdown.push(...svcLines);

  return {
    valid: true, error: null, total, baseRate: baseVal, bcSurcharge: surcharge,
    sizeCharge, weightCharge, svcTotal, svcLines, breakdown,
    totalSpots, totalPieces, totalWeight, zone: billZone,
  };
}
