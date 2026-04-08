// ─── Shared BOL utility ───────────────────────────────────────────────────────
// buildBOLHTML is the authoritative BOL generator used by both:
//   - Loads.jsx  (print/save directly from loads page)
//   - BrokerSheet.jsx (opened as separate print window alongside the cover sheet)

export const CARRIER_NAME = 'Signal Transportation Ltd';

/**
 * Build a complete HTML string for a Straight Bill of Lading.
 *
 * @param {object} opts
 * @param {object}   opts.load             - load record
 * @param {object[]} opts.stops            - stop records (shipper/consignee)
 * @param {object[]} opts.commodities      - commodity rows [{pieces,weight,commodity,description}]
 * @param {boolean}  opts.showFreight      - include freight charges section
 * @param {boolean}  opts.showBilling      - include billing notice
 * @param {boolean}  opts.showBothCarriers - show carrier name in delivering carrier field
 * @param {boolean}  opts.hidePhones       - hide phone/contact fields
 * @param {string}   opts.today            - formatted date string
 * @param {object}   opts.shipper          - shipper address object (overrides stops lookup)
 * @param {object}   opts.consignee        - consignee address object (overrides stops lookup)
 * @param {number}   opts.fuelAmt          - fuel surcharge amount
 * @param {number}   opts.freightAmt       - freight amount
 * @param {number}   opts.accTotal         - accessorials total
 */
export function buildBOLHTML({
  load,
  stops = [],
  commodities = [],
  showFreight = false,
  showBilling = false,
  showBothCarriers = true,
  hidePhones = true,
  today,
  shipper: shipperOverride,
  consignee: consigneeOverride,
  fuelAmt = 0,
  freightAmt = 0,
  accTotal = 0,
}) {
  const shipper   = shipperOverride   || stops.find(s => s.stop_type === 'shipper')   || stops[0]             || {};
  const consignee = consigneeOverride || stops.find(s => s.stop_type === 'consignee') || stops[stops.length - 1] || {};

  const totalPcs = commodities.reduce((s, c) => s + (parseInt(c.pieces)    || 0), 0);
  const totalWgt = commodities.reduce((s, c) => s + (parseFloat(c.weight)  || 0), 0);

  const commRows = commodities.map(c => `
    <tr>
      <td style="text-align:center;padding:4px 3px;border:1px solid #000">${c.pieces || ''}</td>
      <td style="padding:4px 3px;border:1px solid #000"></td>
      <td style="padding:4px 8px;border:1px solid #000">${[c.commodity, c.description].filter(Boolean).join(' — ')}</td>
      <td style="text-align:right;padding:4px 6px;border:1px solid #000">${c.weight || ''}</td>
      ${showFreight ? `<td style="padding:4px 6px;border:1px solid #000"></td>` : ''}
    </tr>`).join('');

  const blankRows = Array(6).fill(0).map(() => `
    <tr style="height:36px">
      <td style="border:1px solid #000;border-top:none"></td>
      <td style="border:1px solid #000;border-top:none"></td>
      <td style="border:1px solid #000;border-top:none"></td>
      <td style="border:1px solid #000;border-top:none"></td>
      ${showFreight ? '<td style="border:1px solid #000;border-top:none"></td>' : ''}
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>BOL ${load.load_number || 'NEW'}</title>
  <style>
    @page { size: letter portrait; margin: 0.45in 0.5in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: Arial, sans-serif; font-size: 10px; color: #000; }
    body { display: flex; flex-direction: column; min-height: 100vh; }
    .page { display: flex; flex-direction: column; flex: 1; }
    .top { flex-shrink: 0; }
    .mid { flex: 1; display: flex; flex-direction: column; }
    .bot { flex-shrink: 0; }
    h1 { text-align:center; font-size:11.5px; font-weight:bold; margin-bottom:4px; }
    .hdr { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; border:1px solid #000; }
    .hdr-cell { padding:3px 6px; border-right:1px solid #000; }
    .hdr-cell:last-child { border-right:none; }
    .lbl { font-size:7.5px; color:#333; text-transform:uppercase; display:block; margin-bottom:1px; }
    .val { font-weight:bold; font-size:11px; }
    .legal { font-size:7.5px; line-height:1.35; border:1px solid #000; border-top:none; padding:3px 6px; }
    .from-to { display:grid; grid-template-columns:1fr 1fr; border:1px solid #000; border-top:none; }
    .from-cell { padding:5px 8px; border-right:1px solid #000; font-size:10px; }
    .to-cell { padding:5px 8px; font-size:10px; }
    .section-lbl { font-size:8px; font-weight:bold; color:#cc0000; display:block; margin-bottom:2px; }
    .field-lbl { font-weight:bold; font-size:9px; }
    .deliv { display:grid; grid-template-columns:2fr 1fr 1fr; border:1px solid #000; border-top:none; }
    .d-cell { padding:3px 7px; border-right:1px solid #000; font-size:9px; }
    .d-cell:last-child { border-right:none; }
    .d-lbl { font-weight:bold; font-size:8px; display:block; margin-bottom:1px; }
    .comm-table { width:100%; border-collapse:collapse; flex:1; }
    .comm-table th { border:1px solid #000; border-top:none; padding:3px 5px; font-size:8.5px; background:#f5f5f5; text-align:center; font-weight:bold; }
    .comm-table th.left { text-align:left; }
    .hazmat { border:1px solid #000; border-top:none; padding:4px 7px; font-size:7.5px; line-height:1.4; }
    .cod-row { display:grid; grid-template-columns:2fr 1fr 1fr; border:1px solid #000; border-top:none; }
    .cod-cell { padding:4px 7px; border-right:1px solid #000; font-size:9.5px; }
    .cod-cell:last-child { border-right:none; }
    .freight-row { border:1px solid #000; border-top:none; padding:4px 8px; font-size:9.5px; }
    .billing { border:1px solid #000; border-top:none; padding:3px 7px; font-size:8px; font-style:italic; }
    .note-row { display:grid; grid-template-columns:1fr 1fr; border:1px solid #000; border-top:none; }
    .note-cell { padding:6px 8px; border-right:1px solid #000; font-size:8px; line-height:1.5; }
    .note-cell:last-child { border-right:none; }
    .note-title { font-weight:bold; font-size:9px; display:block; margin-bottom:3px; }
    .underline { border-bottom:1px solid #000; display:inline-block; min-width:140px; }
    .sig-row { display:grid; grid-template-columns:1fr 1fr 1fr; border:1px solid #000; border-top:none; }
    .sig-cell { padding:5px 8px; border-right:1px solid #000; }
    .sig-cell:last-child { border-right:none; }
    .sig-lbl { font-size:8px; font-weight:bold; text-transform:uppercase; display:block; margin-bottom:3px; }
    .sig-line { border-top:1px solid #000; margin-top:24px; padding-top:2px; font-size:8px; color:#555; }
    .final-row { display:grid; grid-template-columns:1fr 1fr; margin-top:6px; }
    .final-cell { padding:3px 0; }
    .final-line { border-top:1px solid #000; padding-top:3px; font-size:9.5px; display:inline-block; min-width:240px; }
    @media print {
      body { min-height:0; }
      .page { min-height: calc(100vh); }
    }
  </style></head><body>
  <div class="page">
    <div class="top">
      <h1>STRAIGHT BILL OF LADING – SHORT FORM – ORIGINAL - NOT NEGOTIABLE</h1>

      <div class="hdr">
        <div class="hdr-cell"><span class="lbl">Name of Carrier</span><span class="val">${CARRIER_NAME}</span></div>
        <div class="hdr-cell"><span class="lbl">Carrier's No.</span><span class="val">${load.load_number || 'NEW'}</span></div>
        <div class="hdr-cell"><span class="lbl">Date</span><span class="val">${today}</span></div>
        <div class="hdr-cell"><span class="lbl">Shipper's No.</span><span class="val">${shipper.reference || ''}</span></div>
      </div>

      <div class="legal">
        RECEIVED, subject to the classifications and lawfully filed tariffs in effect on the date of this Bill of Lading, the property described below in apparent good order, except as noted (contents and condition of contents of packages unknown), marked, consigned, and destined as indicated below which said carrier (the word carrier being understood throughout this contract as meaning any person or corporation in possession of the property under the contract) agrees to carry to its usual place of delivery at said destination, if on its route, otherwise to deliver to another carrier on the route to said destination. It is mutually agreed as to each carrier of all or any of said property over all or any portion of said route to destination, and as to each party at any time interested in all or any said property, that every service to be performed hereunder shall be subject to all the terms and conditions of the Uniform Domestic Straight Bill of Lading set forth (1) in Uniform Freight Classifications in effect on the date hereof, if this is a rail or a rail-water shipment, or (2) in the applicable motor carrier classification or tariff if this is a motor carrier shipment.<br/>
        Shipper hereby certifies that he is familiar with all the terms and conditions of the said bill of lading, set forth in the classification or tariff which governs the transportation of this shipment, and the said terms and conditions are hereby agreed to by the shipper and accepted for himself and his assigns.
      </div>

      <div class="from-to">
        <div class="from-cell">
          <span class="section-lbl">FROM:</span>
          <div style="font-size:8px;font-weight:bold;color:#555;margin-bottom:2px">SHIPPER</div>
          <div style="font-weight:bold;font-size:11px;margin-bottom:2px">${shipper.company_name || ''}</div>
          <div>${shipper.address || ''}</div>
          <div>${[shipper.city, shipper.state, shipper.zip].filter(Boolean).join(', ')}</div>
          ${!hidePhones && shipper.phone ? `<div style="margin-top:2px">${shipper.phone}</div>` : ''}
          ${!hidePhones && shipper.contact ? `<div>${shipper.contact}</div>` : ''}
        </div>
        <div class="to-cell">
          <span class="section-lbl">TO:</span>
          <div style="font-size:8px;font-weight:bold;color:#555;margin-bottom:2px">CONSIGNEE</div>
          <div style="font-weight:bold;font-size:11px;margin-bottom:2px">${consignee.company_name || ''}</div>
          <div>${consignee.address || ''}</div>
          <div>${[consignee.city, consignee.state, consignee.zip].filter(Boolean).join(', ')}</div>
          ${!hidePhones && consignee.phone ? `<div style="margin-top:2px">${consignee.phone}</div>` : ''}
        </div>
      </div>

      <div class="deliv">
        <div class="d-cell"><span class="d-lbl">DELIVERING CARRIER</span>${showBothCarriers ? CARRIER_NAME : ''}</div>
        <div class="d-cell"><span class="d-lbl">ROUTE</span></div>
        <div class="d-cell"><span class="d-lbl">VEHICLE NUMBER</span>${load.truck_unit || load.bol_number || ''}</div>
      </div>

      <table class="comm-table">
        <thead>
          <tr>
            <th style="width:52px">PIECES</th>
            <th style="width:22px;color:#cc0000">HM</th>
            <th class="left">KIND OF PACKAGE, DESCRIPTION OF ARTICLES, SPECIAL MARKS AND EXCEPTIONS</th>
            <th style="width:62px">WEIGHT</th>
            ${showFreight ? '<th style="width:105px">CHARGES<br/>(FOR CARRIER USE ONLY)</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${commRows}
          <tr style="font-weight:bold;background:#f8f8f8">
            <td style="text-align:center;border:1px solid #000;border-top:none;padding:3px">${totalPcs || ''}</td>
            <td style="border:1px solid #000;border-top:none"></td>
            <td style="text-align:right;border:1px solid #000;border-top:none;padding:3px;font-size:8.5px;color:#666">TOTALS</td>
            <td style="text-align:right;border:1px solid #000;border-top:none;padding:3px">${totalWgt || ''}</td>
            ${showFreight ? '<td style="border:1px solid #000;border-top:none"></td>' : ''}
          </tr>
          ${blankRows}
        </tbody>
      </table>
    </div>

    <div class="bot">
      <div class="hazmat">
        "This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation, according to the applicable regulations of the Department of Transportation."<br/>
        When transporting hazardous materials include the technical or chemical name for n.o.s. (not otherwise specified) or generic description of material with appropriate UN or NA number as defined in US DOT Emergency Response Communication Standard (HM-126C). Provide emergency response phone number in case of incident or accident.
      </div>

      <div class="cod-row">
        <div class="cod-cell"><b>REMIT C.O.D. TO:</b> <span class="underline">&nbsp;</span></div>
        <div class="cod-cell">
          <b>C.O.D. Amt $</b> <span class="underline" style="min-width:55px">&nbsp;</span>
          &nbsp;<b>C.O.D. FEE</b> &#9744; PREPAID &nbsp;&#9744; COLLECT
        </div>
        <div class="cod-cell" style="font-size:9px">
          Freight charges are <b>PREPAID</b> unless marked collect.<br/>
          &#9744; Check box if charges are Collect.<br/>
          <b>TOTAL CHARGES $</b> ${showFreight ? freightAmt.toFixed(2) : ''}
        </div>
      </div>

      ${showFreight ? `<div class="freight-row">
        <b>FREIGHT CHARGES</b>&nbsp;&nbsp;
        Freight: $${freightAmt.toFixed(2)} &nbsp;|&nbsp;
        Fuel Surcharge: $${fuelAmt.toFixed(2)} &nbsp;|&nbsp;
        Accessorials: $${accTotal.toFixed(2)} &nbsp;|&nbsp;
        <b>Total: $${freightAmt.toFixed(2)}</b>
      </div>` : ''}

      ${showBilling ? `<div class="billing">
        <i>BILLING NOTICE: The carrier will deliver the freight against payment of freight charges. No diversion or reconsignment will be made without prior written authorization from the consignor.</i>
      </div>` : ''}

      <div class="note-row">
        <div class="note-cell">
          <span class="note-title">NOTE:</span>
          Where the rate is dependent on value, shippers are required to state specifically in writing the agreed or declared value of the property.<br/><br/>
          The agreed or declared value of the property is hereby specifically stated by the shipper to be not exceeding <span class="underline">&nbsp;</span><br/><br/>
          Subject to Section 7 of conditions, if this shipment is to be delivered to the consignee without recourse on the consignor, the consignor shall sign the following statement:<br/><br/>
          The carrier shall not make delivery of this shipment without payment of freight and all other lawful charges.<br/><br/>
          <span class="underline" style="min-width:200px">&nbsp;</span><br/>
          <span style="font-size:7px">(Signature of Consignor)</span>
        </div>
        <div class="note-cell">
          <span class="note-title">Permanent post office address of shipper:</span>
          ${CARRIER_NAME}<br/><br/>
          <span class="underline" style="min-width:100%;display:block">&nbsp;</span><br/>
          <span style="font-size:7.5px">Shipper's imprint in lieu of stamp; not a part of bill of lading approved by the Interstate Commerce Commission.</span>
          <br/><br/>
          <span class="underline" style="min-width:100%;display:block">&nbsp;</span><br/>
          <span style="font-size:7.5px">* MARK WITH "X" TO DESIGNATE HAZARDOUS MATERIAL AS DEFINED IN TITLE 49 OF FEDERAL REGULATIONS.</span>
        </div>
      </div>

      <div class="sig-row">
        <div class="sig-cell">
          <span class="sig-lbl">Driver's Signature</span>
          <div class="sig-line"></div>
        </div>
        <div class="sig-cell">
          <span class="sig-lbl">Placards Supplied</span>
          <div style="margin-top:8px;font-size:10px">&#9744; YES &nbsp;&nbsp; &#9744; NO</div>
        </div>
        <div class="sig-cell">
          <span class="sig-lbl">Emergency Response Phone No</span>
          <div class="sig-line"></div>
        </div>
      </div>

      <div class="final-row">
        <div class="final-cell">
          <span class="final-line">Shipper, Per &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Agent, Per</span>
        </div>
        <div class="final-cell">
          <span class="final-line">Carrier Signature / Date</span>
        </div>
      </div>
    </div>
  </div>
  </body></html>`;
}

/**
 * Open the BOL HTML in a new print window (same behaviour as Loads.jsx).
 * Call this alongside generating the cover sheet PDF.
 */
export function openBOLPrintWindow(load) {
  const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

  // Map flat load fields → shipper / consignee shape that buildBOLHTML expects
  const shipper = {
    company_name: load.origin_name    || '',
    address:      load.origin_address || '',
    city:         load.origin_city    || '',
    state:        load.origin_state   || '',
    zip:          load.origin_zip     || '',
    phone:        load.origin_phone   || '',
    contact:      load.origin_contact || '',
    reference:    load.bol_number     || '',
  };

  const consignee = {
    company_name: load.dest_name    || '',
    address:      load.dest_address || '',
    city:         load.dest_city    || '',
    state:        load.dest_state   || '',
    zip:          load.dest_zip     || '',
    phone:        load.dest_phone   || '',
  };

  // Build a single commodity row from load-level fields
  const commodities = [{
    pieces:      load.pieces    || '',
    weight:      load.weight    || '',
    commodity:   load.commodity || '',
    description: '',
  }];

  const html = buildBOLHTML({
    load,
    shipper,
    consignee,
    commodities,
    today,
    showFreight:      false,
    showBilling:      false,
    showBothCarriers: true,
    hidePhones:       true,
    fuelAmt:          0,
    freightAmt:       0,
    accTotal:         0,
  });

  const w = window.open('', '_blank', 'width=960,height=750');
  if (w) {
    w.document.write(html);
    w.document.close();
    // Small delay so the browser has time to render before showing print dialog
    setTimeout(() => w.print(), 600);
  }
}

/**
 * Build BOL HTML from load data + stops array.
 * Returns the HTML string — reusable by both print window and PDF generation.
 */
export function buildBOLHTMLFromStops(loadData, stops) {
  const allStops = stops || loadData.stops || [];
  const firstStop = allStops.find(s => s.stop_type === 'pickup') || allStops[0] || {};
  const lastStop = allStops.find(s => s.stop_type === 'delivery') || allStops[allStops.length - 1] || {};

  return buildBOLHTML({
    load: loadData,
    shipper: {
      company_name: firstStop.company_name || loadData.origin_name || '',
      address: firstStop.address || '',
      city: firstStop.city || loadData.origin_city || '',
      state: firstStop.state || loadData.origin_state || '',
      zip: firstStop.zip || '',
      phone: firstStop.phone || '',
      contact: firstStop.contact_name || '',
      reference: loadData.ref_number || loadData.reference_number || loadData.bol_number || '',
    },
    consignee: {
      company_name: lastStop.company_name || loadData.dest_name || '',
      address: lastStop.address || '',
      city: lastStop.city || loadData.dest_city || '',
      state: lastStop.state || loadData.dest_state || '',
      zip: lastStop.zip || '',
      phone: lastStop.phone || '',
    },
    commodities: [{
      pieces: loadData.total_pieces || loadData.pieces || '',
      weight: loadData.total_weight || loadData.weight || '',
      commodity: loadData.commodity || 'General Freight',
      description: '',
    }],
    today: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
    showFreight: false,
    showBilling: false,
    showBothCarriers: true,
    hidePhones: false,
  });
}

/**
 * Open BOL print window using stops-based load data (from LoadForm).
 */
export function openBOLFromStops(loadData) {
  const html = buildBOLHTMLFromStops(loadData);
  const w = window.open('', '_blank', 'width=960,height=750');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  }
}
