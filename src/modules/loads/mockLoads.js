const MOCK_LOADS = [
  {
    id: 'm1', load_number: 'LD-1010', customer_name: 'Signal TMS',
    origin_city: 'Surrey', origin_state: 'BC', dest_city: 'Arlington', dest_state: 'WA',
    pickup_date: '2026-03-27', delivery_date: '2026-03-27',
    pieces: 2, weight: 1500, equipment_type: 'Dry Van',
    appointment: true, liftgate: true, residential: false, construction: false,
    driver_name: 'Gurpreet J', total_revenue: 1575, margin: 350,
    status: 'in_transit',
  },
  {
    id: 'm2', load_number: 'LD-1011', customer_name: 'Hugsmart',
    origin_city: 'Surrey', origin_state: 'BC', dest_city: 'Vancouver', dest_state: 'BC',
    pickup_date: '2026-03-27', delivery_date: '2026-03-27',
    pieces: 1, weight: 800, equipment_type: 'Dry Van',
    appointment: false, liftgate: false, residential: true, construction: false,
    driver_name: '', total_revenue: 450, margin: 0,
    status: 'available',
  },
  {
    id: 'm3', load_number: 'LD-1012', customer_name: 'AP International',
    origin_city: 'Delta', origin_state: 'BC', dest_city: 'Seattle', dest_state: 'WA',
    pickup_date: '2026-03-28', delivery_date: '2026-03-28',
    pieces: 4, weight: 2200, equipment_type: 'Dry Van',
    appointment: true, liftgate: false, residential: false, construction: false,
    driver_name: 'Sarbjit S', total_revenue: 2100, margin: 480,
    status: 'dispatched',
  },
  {
    id: 'm4', load_number: 'LD-1013', customer_name: 'Pacific Coast Distributors',
    origin_city: 'Langley', origin_state: 'BC', dest_city: 'Kamloops', dest_state: 'BC',
    pickup_date: '2026-03-26', delivery_date: '2026-03-26',
    pieces: 6, weight: 3400, equipment_type: 'Dry Van',
    appointment: false, liftgate: true, residential: false, construction: true,
    driver_name: 'Mike C', total_revenue: 2800, margin: 620,
    status: 'delivered',
  },
  {
    id: 'm5', load_number: 'LD-1014', customer_name: 'Island Furniture Warehouse',
    origin_city: 'Richmond', origin_state: 'BC', dest_city: 'Victoria', dest_state: 'BC',
    pickup_date: '2026-03-28', delivery_date: '2026-03-29',
    pieces: 3, weight: 1800, equipment_type: 'Dry Van',
    appointment: true, liftgate: false, residential: false, construction: false,
    driver_name: '', total_revenue: 1200, margin: 0,
    status: 'on_dock',
  },
];

export default MOCK_LOADS;
