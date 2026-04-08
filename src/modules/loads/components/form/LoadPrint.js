export function printLoad(type, { form, load, customers }) {
  const cust = customers.find(c => c.value === form.customer_id);
  const w = window.open('', '_blank');
  if (!w) return;
  const stops = Array.isArray(form.stops) ? form.stops : [];
  const pickups = stops.filter(s => s.stop_type === 'pickup');
  const deliveries = stops.filter(s => s.stop_type === 'delivery');
  const loadNum = load?.load_number || 'NEW';
  const date = form.pickup_date
    ? new Date(form.pickup_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalPcs = stops.reduce((s, st) => s + (parseInt(st.pieces) || 0), 0);
  const totalWgt = stops.reduce((s, st) => s + (parseFloat(st.weight) || 0), 0);
  const baseRate = parseFloat(form.base_rate) || 0;
  const fsc = parseFloat(form.fuel_surcharge) || 0;
  const accTotal = (Array.isArray(form.accessorials) ? form.accessorials : []).reduce((a, x) => a + (parseFloat(x.amount) || 0), 0);
  const totalCharges = baseRate + fsc + accTotal;
  const p = pickups[0] || {};
  const d = deliveries[0] || {};

  let html = '';

  if (type === 'bol') {
    html = buildBOL({ loadNum, date, form, p, d, stops, totalPcs, totalWgt, baseRate, fsc, accTotal, totalCharges });
  } else if (type === 'delivery') {
    html = buildDeliveryReceipt({ loadNum, date, form, d, stops, totalPcs, totalWgt });
  } else {
    html = buildRateConf({ loadNum, date, form, cust, stops, totalPcs, totalWgt, baseRate, fsc, accTotal, totalCharges });
  }

  w.document.write(html);
  w.document.close();
}

function fmt$(v) { return '$' + (parseFloat(v) || 0).toFixed(2); }

function buildBOL({ loadNum, date, form, p, d, stops, totalPcs, totalWgt, baseRate, fsc, accTotal, totalCharges }) {
  const acc = Array.isArray(form.accessorials) ? form.accessorials : [];
  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;color:#000;width:8in;margin:0 auto;padding:10px}
    .no-print{text-align:center;padding:8px;margin-bottom:10px}
    .no-print button{padding:8px 24px;font-size:13px;background:#1a3a6b;color:#fff;border:none;border-radius:4px;cursor:pointer}
    .banner{background:#1a3a6b;color:#fff;padding:8px 14px;display:flex;justify-content:space-between;align-items:center}
    .banner-name{font-size:14px;font-weight:700;letter-spacing:0.03em}
    .banner-addr{font-size:8px;opacity:0.85;text-align:right}
    .title-row{background:#e8ecf1;border:1px solid #000;border-top:none;padding:4px 10px;text-align:center;font-size:9px;font-weight:700;letter-spacing:0.06em}
    .meta-row{display:flex;border:1px solid #000;border-top:none}
    .meta-cell{flex:1;padding:3px 8px;border-right:1px solid #000;font-size:8px}
    .meta-cell:last-child{border-right:none}
    .meta-lbl{font-size:7px;color:#555;text-transform:uppercase;font-weight:700}
    .legal{border:1px solid #000;border-top:none;padding:4px 8px;font-size:6.5px;line-height:1.4;color:#333}
    .party-row{display:flex;border:1px solid #000;border-top:none}
    .party-cell{flex:1;padding:6px 10px;border-right:1px solid #000;min-height:60px}
    .party-cell:last-child{border-right:none}
    .party-lbl{font-size:7px;color:#555;text-transform:uppercase;font-weight:700;margin-bottom:2px}
    .party-name{font-size:10px;font-weight:700}
    .party-addr{font-size:8px;margin-top:2px;line-height:1.3}
    .carrier-row{display:flex;border:1px solid #000;border-top:none}
    .carrier-cell{flex:1;padding:3px 8px;border-right:1px solid #000}
    .carrier-cell:last-child{border-right:none}
    .freight-tbl{width:100%;border-collapse:collapse;border:1px solid #000;border-top:none}
    .freight-tbl th{background:#e8ecf1;border:1px solid #000;padding:3px 6px;font-size:7px;text-transform:uppercase;font-weight:700;text-align:center}
    .freight-tbl td{border:1px solid #000;padding:3px 6px;font-size:9px;text-align:center}
    .freight-tbl .desc{text-align:left;min-width:200px}
    .freight-tbl .total-row td{font-weight:700;background:#f5f7fa}
    .special-box{border:1px solid #000;border-top:none;padding:4px 8px;min-height:30px}
    .cert{border:1px solid #000;border-top:none;padding:6px 10px;font-size:7px;line-height:1.5;color:#333;font-style:italic}
    .bottom{display:flex;border:1px solid #000;border-top:none;min-height:140px}
    .bottom-left{width:320px;padding:10px 12px;border-right:1px solid #000;display:flex;flex-direction:column;justify-content:space-between}
    .bottom-center{flex:1;border-right:1px solid #000}
    .bottom-right{width:230px;display:flex;flex-direction:column}
    .sig-line{border-bottom:1px solid #555;margin:14px 0 2px;width:100%}
    .sig-lbl{font-size:7px;color:#555}
    .charges-hdr{background:#e8ecf1;padding:4px 8px;font-size:8px;font-weight:700;text-transform:uppercase;text-align:center;border-bottom:1px solid #000}
    .charges-row{display:flex;justify-content:space-between;padding:3px 8px;font-size:8px;border-bottom:1px solid #ddd}
    .charges-total{display:flex;justify-content:space-between;padding:5px 8px;font-size:10px;font-weight:700;background:#e8ecf1;margin-top:auto}
    .chk{display:inline-block;width:10px;height:10px;border:1px solid #000;margin-right:3px;vertical-align:middle}
    @media print{.no-print{display:none}body{padding:0;width:100%}}
  `;

  const legalText = 'Received, subject to individually determined rates or contracts that have been agreed upon in writing between the carrier and shipper, if applicable, otherwise to the rates, classifications and rules that have been established by the carrier and are available to the shipper, on request, and to all applicable state and federal regulations, the property described below, in apparent good order, except as noted (contents and condition of contents of packages unknown), marked, consigned, and destined as indicated below, which said carrier (the word carrier being understood throughout this contract as meaning any person or corporation in possession of the property under the contract) agrees to carry to its usual place of delivery at said destination, if on its route, otherwise to deliver to another carrier on the route to said destination.';

  const certText = 'This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the Department of Transportation.';

  return `<!DOCTYPE html><html><head><title>BOL — ${loadNum}</title><style>${css}</style></head><body>
    <div class="no-print"><button onclick="window.print()">Print BOL</button></div>

    <div class="banner">
      <div class="banner-name">SIGNAL TRANSPORTATION LTD</div>
      <div class="banner-addr">3170 194th St Unit 102, Surrey BC V3Z 0N4<br>Phone: 604-867-5543</div>
    </div>

    <div class="title-row">STRAIGHT BILL OF LADING — SHORT FORM — ORIGINAL — NOT NEGOTIABLE</div>

    <div class="meta-row">
      <div class="meta-cell"><div class="meta-lbl">Carrier's No.</div><strong>${loadNum}</strong></div>
      <div class="meta-cell"><div class="meta-lbl">Date</div>${date}</div>
      <div class="meta-cell"><div class="meta-lbl">Shipper's No. / PO#</div><strong>${p.po_number || form.po_number || form.ref_number || ''}</strong></div>
    </div>

    <div class="legal">${legalText}</div>

    <div class="party-row">
      <div class="party-cell">
        <div class="party-lbl">FROM (Shipper)</div>
        <div class="party-name">${p.company_name || ''}</div>
        <div class="party-addr">${p.address || ''}<br>${p.city || ''}, ${p.state || ''} ${p.zip || ''}<br>${p.phone || ''}${(p.po_number || form.po_number) ? '<br><strong>PO #: ' + (p.po_number || form.po_number) + '</strong>' : ''}</div>
      </div>
      <div class="party-cell">
        <div class="party-lbl">TO (Consignee)</div>
        <div class="party-name">${d.company_name || ''}</div>
        <div class="party-addr">${d.address || ''}<br>${d.city || ''}, ${d.state || ''} ${d.zip || ''}<br>${d.phone || ''}</div>
      </div>
    </div>

    <div class="carrier-row">
      <div class="carrier-cell"><div class="meta-lbl">Delivering Carrier</div>Signal Transportation Ltd</div>
      <div class="carrier-cell"><div class="meta-lbl">Vehicle / Trailer No.</div></div>
      <div class="carrier-cell" style="width:40px"><div class="meta-lbl">HM</div></div>
    </div>
    <div class="carrier-row">
      <div class="carrier-cell" style="flex:1"><div class="meta-lbl">Route</div>${p.city || ''} to ${d.city || ''}</div>
    </div>

    <table class="freight-tbl">
      <tr><th style="width:60px">Pieces</th><th style="width:30px">HM</th><th class="desc">Kind of Package / Description of Articles</th><th style="width:80px">Weight (lbs)</th><th style="width:60px">Rate</th><th style="width:80px">Charges</th></tr>
      ${stops.map(s => `<tr>
        <td>${s.pieces || ''}</td>
        <td>${s.hazmat ? 'X' : ''}</td>
        <td class="desc">${s.commodity || form.commodity || 'General Freight'}${s.reference_number ? ' — Ref: ' + s.reference_number : ''}</td>
        <td>${s.weight ? Number(s.weight).toLocaleString() : ''}</td>
        <td></td><td></td>
      </tr>`).join('')}
      <tr class="total-row"><td>${totalPcs}</td><td></td><td>TOTAL</td><td>${totalWgt.toLocaleString()}</td><td></td><td>${fmt$(totalCharges)}</td></tr>
    </table>

    <div class="special-box">
      <div class="meta-lbl">Special Marks & Exceptions</div>
      ${form.special_instructions || ''}
    </div>

    <div class="cert">${certText}</div>

    <div class="bottom">
      <div class="bottom-left">
        <div>
          <div class="sig-line"></div><div class="sig-lbl">Shipper Signature / Date</div>
          <div class="sig-line"></div><div class="sig-lbl">Agent Signature / Date</div>
          <div class="sig-line"></div><div class="sig-lbl">Driver Signature / Date</div>
        </div>
        <div style="font-size:8px;margin-top:8px">
          <span class="meta-lbl">Placards:</span> <span class="chk"></span> YES <span class="chk"></span> NO &nbsp;&nbsp;&nbsp;
          <span class="meta-lbl">Freight:</span> <span class="chk"></span> Prepaid <span class="chk"></span> Collect
        </div>
      </div>
      <div class="bottom-center"></div>
      <div class="bottom-right">
        <div class="charges-hdr">Charges</div>
        <div class="charges-row"><span>Freight Charge</span><span>${fmt$(baseRate)}</span></div>
        <div class="charges-row"><span>Fuel Surcharge</span><span>${fmt$(fsc)}</span></div>
        ${acc.map(a => `<div class="charges-row"><span>${a.charge_type || 'Accessorial'}</span><span>${fmt$(a.amount)}</span></div>`).join('')}
        ${acc.length === 0 ? `<div class="charges-row"><span>Accessorial</span><span>$0.00</span></div>` : ''}
        <div class="charges-total"><span>TOTAL CHARGES</span><span>${fmt$(totalCharges)}</span></div>
      </div>
    </div>

    <script>/* auto-print after 500ms */ setTimeout(function(){window.print()},500)</script>
  </body></html>`;
}

function buildDeliveryReceipt({ loadNum, date, form, d, stops, totalPcs, totalWgt }) {
  const css = `body{font-family:Arial,sans-serif;font-size:11px;padding:20px;color:#333;max-width:800px;margin:0 auto}
    h1{font-size:16px;text-align:center;margin:0 0 2px;color:#1a3a6b}
    h2{font-size:11px;background:#1a3a6b;color:#fff;padding:5px 10px;margin:12px 0 6px;text-transform:uppercase;letter-spacing:0.05em}
    table{width:100%;border-collapse:collapse;margin-bottom:10px}th,td{border:1px solid #D1D5DB;padding:4px 8px;text-align:left;font-size:10px}
    th{background:#F1F5F9;font-weight:700;text-transform:uppercase;color:#1a3a6b}
    .hdr{text-align:center;border-bottom:2px solid #1a3a6b;padding-bottom:10px;margin-bottom:12px}
    .co{font-size:14px;font-weight:700;color:#1a3a6b}.addr{font-size:9px;color:#6B7280}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #D1D5DB}
    .grid2 .cell{padding:8px 10px;border-bottom:1px solid #D1D5DB}.grid2 .cell:nth-child(odd){border-right:1px solid #D1D5DB}
    .lbl{font-size:9px;color:#6B7280;text-transform:uppercase;font-weight:700;margin-bottom:2px}
    .chk{display:inline-block;width:12px;height:12px;border:1px solid #333;margin-right:4px;vertical-align:middle}
    .no-print{text-align:center;padding:8px;margin-bottom:10px}
    .no-print button{padding:8px 24px;font-size:13px;background:#1a3a6b;color:#fff;border:none;border-radius:4px;cursor:pointer}
    @media print{.no-print{display:none}body{padding:10px}}`;
  return `<!DOCTYPE html><html><head><title>Delivery Receipt — ${loadNum}</title><style>${css}</style></head><body>
    <div class="no-print"><button onclick="window.print()">Print Delivery Receipt</button></div>
    <div class="hdr"><div class="co">Signal Transportation Ltd</div><div class="addr">3170 194th St Unit 102, Surrey BC V3Z 0N4 · 604-867-5543</div>
    <h1>DELIVERY RECEIPT</h1><div style="font-size:10px">Date: ${date}</div></div>
    <div class="grid2">
      <div class="cell"><div class="lbl">Load #</div><strong>${loadNum}</strong></div>
      <div class="cell"><div class="lbl">PO #</div>${form.po_number || ''}</div>
      <div class="cell"><div class="lbl">Ref #</div>${form.ref_number || ''}</div>
      <div class="cell"><div class="lbl">Driver</div>_________________</div>
    </div>
    <h2>Delivered To</h2>
    <div style="border:1px solid #D1D5DB;padding:8px 10px;margin-bottom:10px;font-size:10px">
      <strong>${d.company_name || ''}</strong><br>${d.address || ''}<br>${d.city || ''}, ${d.state || ''} ${d.zip || ''}</div>
    <h2>Items Delivered</h2>
    <table><tr><th>Description</th><th>Pieces</th><th>Weight (lb)</th></tr>
    ${stops.map(s => `<tr><td>${s.commodity || form.commodity || 'General Freight'}</td><td>${s.pieces || ''}</td><td>${s.weight || ''}</td></tr>`).join('')}
    <tr style="font-weight:700"><td>Total</td><td>${totalPcs}</td><td>${totalWgt.toLocaleString()}</td></tr></table>
    <h2>Condition</h2>
    <div style="font-size:10px;margin-bottom:8px"><span class="chk"></span> Good &nbsp; <span class="chk"></span> Damaged</div>
    <div style="font-size:10px;margin-bottom:16px">Damage Notes: ________________________________________</div>
    <div class="grid2">
      <div class="cell" style="min-height:60px"><div class="lbl">Received By (Print Name)</div></div>
      <div class="cell" style="min-height:60px"><div class="lbl">Signature</div></div>
      <div class="cell"><div class="lbl">Date / Time</div></div>
      <div class="cell"><div class="lbl">Driver Signature</div></div>
    </div>
    <script>setTimeout(function(){window.print()},500)</script></body></html>`;
}

function buildRateConf({ loadNum, date, form, cust, stops, totalPcs, totalWgt, baseRate, fsc, accTotal, totalCharges }) {
  const css = `body{font-family:Arial,sans-serif;font-size:11px;padding:20px;color:#333;max-width:800px;margin:0 auto}
    h1{font-size:16px;text-align:center;margin:0 0 2px;color:#1a3a6b}
    h2{font-size:11px;background:#1a3a6b;color:#fff;padding:5px 10px;margin:12px 0 6px;text-transform:uppercase;letter-spacing:0.05em}
    table{width:100%;border-collapse:collapse;margin-bottom:10px}th,td{border:1px solid #D1D5DB;padding:4px 8px;text-align:left;font-size:10px}
    th{background:#F1F5F9;font-weight:700;text-transform:uppercase;color:#1a3a6b}
    .hdr{text-align:center;border-bottom:2px solid #1a3a6b;padding-bottom:10px;margin-bottom:12px}
    .co{font-size:14px;font-weight:700;color:#1a3a6b}.addr{font-size:9px;color:#6B7280}
    .sig-line{border-top:1px solid #333;padding-top:4px;width:180px;font-size:9px;margin-top:40px}
    .box{border:1px solid #D1D5DB;padding:8px;min-height:40px;font-size:10px;margin-bottom:8px}
    .no-print{text-align:center;padding:8px;margin-bottom:10px}
    .no-print button{padding:8px 24px;font-size:13px;background:#1a3a6b;color:#fff;border:none;border-radius:4px;cursor:pointer}
    @media print{.no-print{display:none}body{padding:10px}}`;
  const stopRow = (s, i) => `<tr><td>${i+1}</td><td>${s.company_name || ''}</td><td>${s.address || ''}</td><td>${s.city || ''}, ${s.state || ''} ${s.zip || ''}</td><td>${s.date || ''}</td><td>${s.pieces || ''}</td><td>${s.weight || ''}</td></tr>`;
  return `<!DOCTYPE html><html><head><title>Rate Confirmation — ${loadNum}</title><style>${css}</style></head><body>
    <div class="no-print"><button onclick="window.print()">Print Rate Confirmation</button></div>
    <div class="hdr"><div class="co">Signal Transportation Ltd</div><div class="addr">3170 194th St Unit 102, Surrey BC V3Z 0N4 · 604-867-5543</div>
    <h1>RATE CONFIRMATION</h1><div style="font-size:10px">Load #: <strong>${loadNum}</strong> | Date: ${date}</div></div>
    ${cust ? `<div style="margin-bottom:8px"><strong>Bill To:</strong> ${cust.label}</div>` : ''}
    ${form.po_number ? `<div style="font-size:10px">PO: ${form.po_number} | BOL: ${form.bol_number || ''} | Ref: ${form.ref_number || ''}</div>` : ''}
    <h2>Stops</h2>
    <table><tr><th>#</th><th>Company</th><th>Address</th><th>City/ST/ZIP</th><th>Date</th><th>PCS</th><th>WGT</th></tr>
    ${stops.map(stopRow).join('')}</table>
    <h2>Charges</h2>
    <table><tr><th>Description</th><th style="text-align:right">Amount</th></tr>
    <tr><td>Freight Charge</td><td style="text-align:right">${fmt$(baseRate)}</td></tr>
    <tr><td>Fuel Surcharge</td><td style="text-align:right">${fmt$(fsc)}</td></tr>
    ${accTotal > 0 ? `<tr><td>Accessorials</td><td style="text-align:right">${fmt$(accTotal)}</td></tr>` : ''}
    <tr style="font-weight:700"><td>TOTAL</td><td style="text-align:right">${fmt$(totalCharges)}</td></tr></table>
    <h2>Equipment</h2>
    <div style="font-size:10px">${form.equipment_type || 'Dry Van'} | Pieces: ${totalPcs} | Weight: ${totalWgt.toLocaleString()} lb</div>
    ${form.special_instructions ? `<h2>Special Instructions</h2><div class="box">${form.special_instructions}</div>` : ''}
    <div style="margin-top:16px;font-size:9px;color:#6B7280;border-top:1px solid #D1D5DB;padding-top:8px">Signal Transportation Ltd · 3170 194th St Unit 102, Surrey BC V3Z 0N4 · 604-867-5543</div>
    <div style="display:flex;gap:30px"><div class="sig-line">Authorized Signature / Date</div></div>
    <script>setTimeout(function(){window.print()},500)</script></body></html>`;
}
