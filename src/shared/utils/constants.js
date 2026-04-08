export const LOAD_STATUSES = [
  'available', 'dispatched', 'at_pickup', 'in_transit',
  'at_delivery', 'delivered', 'on_dock', 'cancelled',
];

export const TRIP_TYPES = ['direct', 'inbound', 'outbound', 'multi_stop', 'continuation'];

export const TRIP_STATUSES = ['planned', 'active', 'in_progress', 'completed', 'cancelled'];

export const EQUIPMENT_TYPES = [
  'Dry Van', '53ft Dry Van', '48ft Dry Van', 'Flatbed',
  'Reefer', 'Step Deck', 'Tanker', 'Straight Truck',
  'Sprinter Van', 'Other',
];

export const PAY_TYPES = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'per_stop', label: 'Per Stop' },
];

export const PAYMENT_TERMS = [
  { value: 0, label: 'Due on Receipt' },
  { value: -1, label: 'COD' },
  { value: 15, label: 'Net 15' },
  { value: 30, label: 'Net 30' },
  { value: 45, label: 'Net 45' },
  { value: 60, label: 'Net 60' },
];

export const DOC_TYPES = [
  'Contract', 'Credit Application', 'Insurance',
  'W9', 'Rate Confirmation', 'BOL', 'POD', 'Other',
];

export const WAREHOUSE = {
  name: 'Signal Warehouse',
  address: '3170 194th St Unit 102',
  city: 'Surrey',
  state: 'BC',
  zip: 'V3Z 0N4',
  full: 'Signal Warehouse — 3170 194th St, Surrey BC',
};

export const INVOICE_STATUSES = ['draft', 'sent', 'unpaid', 'partial', 'paid', 'void'];

export const SETTLEMENT_STATUSES = ['draft', 'pending', 'approved', 'paid'];

export const CARRIER_STATUSES = ['active', 'inactive', 'blocked'];

export const DRIVER_STATUSES = ['available', 'on_trip', 'off_duty', 'inactive'];

export const EXPENSE_CATEGORIES = [
  'Fuel', 'Maintenance', 'Insurance', 'Tolls', 'Parking',
  'Lumper', 'Detention', 'Repair', 'Office', 'Other',
];
