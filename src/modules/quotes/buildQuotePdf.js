import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const navy = rgb(0.059, 0.129, 0.267);
const gray = rgb(0.4, 0.4, 0.4);
const white = rgb(1, 1, 1);
const black = rgb(0, 0, 0);
const fmt = v => '$' + (v || 0).toFixed(2);

/**
 * Build a customer-facing quote PDF.
 * @param {Object} data - { quoteNumber, date, validUntil, customerName, originCity, originState,
 *   destCity, destState, equipment, pickupDate, commodity, pallets[], breakdown[], total, totalPieces, totalWeight }
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function buildQuotePdf(data) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);

  let y = 792;

  // ── HEADER BAR ──
  page.drawRectangle({ x: 0, y: y - 90, width: 612, height: 90, color: navy });
  y -= 25;
  page.drawText('Signal Transportation Ltd', { x: 30, y, size: 16, font: bold, color: white });
  y -= 14;
  page.drawText('3170 194th St Unit 102, Surrey BC V3Z 0N4', { x: 30, y, size: 9, font: reg, color: rgb(0.7, 0.8, 0.9) });
  y -= 12;
  page.drawText('604-867-5543 | signaltrucking@gmail.com', { x: 30, y, size: 9, font: reg, color: rgb(0.7, 0.8, 0.9) });

  // Right side of header
  const hy = 792 - 25;
  page.drawText('QUOTE', { x: 480, y: hy, size: 18, font: bold, color: white });
  page.drawText(data.quoteNumber || '', { x: 480, y: hy - 16, size: 11, font: bold, color: rgb(0.7, 0.8, 0.9) });
  page.drawText(`Date: ${data.date || ''}`, { x: 480, y: hy - 30, size: 9, font: reg, color: rgb(0.7, 0.8, 0.9) });
  if (data.validUntil) page.drawText(`Valid: ${data.validUntil}`, { x: 480, y: hy - 42, size: 9, font: reg, color: rgb(0.7, 0.8, 0.9) });

  y = 792 - 110;

  // ── BILL TO ──
  page.drawText('BILL TO', { x: 30, y, size: 10, font: bold, color: navy });
  y -= 14;
  page.drawText(data.customerName || '—', { x: 30, y, size: 11, font: reg, color: black });
  y -= 24;

  // ── SHIPMENT DETAILS ──
  page.drawText('SHIPMENT DETAILS', { x: 30, y, size: 10, font: bold, color: navy });
  y -= 14;
  const details = [
    ['From:', `${data.originCity || ''}${data.originState ? ', ' + data.originState : ''}`],
    ['To:', `${data.destCity || ''}${data.destState ? ', ' + data.destState : ''}`],
    ['Equipment:', data.equipment || 'Dry Van'],
  ];
  if (data.pickupDate) details.push(['Pickup Date:', data.pickupDate]);
  if (data.commodity) details.push(['Commodity:', data.commodity]);
  for (const [label, val] of details) {
    page.drawText(label, { x: 30, y, size: 9, font: bold, color: gray });
    page.drawText(val, { x: 110, y, size: 9, font: reg, color: black });
    y -= 13;
  }
  y -= 10;

  // ── PALLETS TABLE ──
  if (data.pallets && data.pallets.length > 0) {
    page.drawText('PALLET INFORMATION', { x: 30, y, size: 10, font: bold, color: navy });
    y -= 16;
    // Header row
    page.drawRectangle({ x: 30, y: y - 2, width: 552, height: 14, color: rgb(0.95, 0.96, 0.97) });
    const cols = [{ l: '#', x: 35 }, { l: 'Qty', x: 65 }, { l: 'Length', x: 110 }, { l: 'Width', x: 170 }, { l: 'Height', x: 230 }, { l: 'Weight', x: 290 }];
    for (const c of cols) page.drawText(c.l, { x: c.x, y, size: 8, font: bold, color: gray });
    y -= 16;
    data.pallets.forEach((p, i) => {
      page.drawText(String(i + 1), { x: 35, y, size: 8, font: reg, color: black });
      page.drawText(String(p.count || 1), { x: 65, y, size: 8, font: reg, color: black });
      page.drawText(`${p.len || 48}"`, { x: 110, y, size: 8, font: reg, color: black });
      page.drawText(`${p.wid || 48}"`, { x: 170, y, size: 8, font: reg, color: black });
      page.drawText(`${p.ht || 0}"`, { x: 230, y, size: 8, font: reg, color: black });
      page.drawText(`${(p.weight || 0).toLocaleString()} lb`, { x: 290, y, size: 8, font: reg, color: black });
      y -= 13;
    });
    y -= 6;
    page.drawText(`Total: ${data.totalPieces || 0} pieces, ${(data.totalWeight || 0).toLocaleString()} lb`, { x: 30, y, size: 8, font: reg, color: gray });
    y -= 18;
  }

  // ── RATE BREAKDOWN ──
  page.drawText('RATE', { x: 30, y, size: 10, font: bold, color: navy });
  y -= 16;
  if (data.breakdown && data.breakdown.length > 0) {
    for (const line of data.breakdown) {
      page.drawText(line.label, { x: 30, y, size: 9, font: reg, color: black });
      const amtStr = fmt(line.amt);
      page.drawText(amtStr, { x: 520 - reg.widthOfTextAtSize(amtStr, 9), y, size: 9, font: reg, color: black });
      y -= 13;
    }
  }
  // Separator line
  page.drawLine({ start: { x: 30, y: y + 2 }, end: { x: 520, y: y + 2 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 4;
  // Total
  const totalLabel = 'Total Estimated Rate:';
  const totalAmt = fmt(data.total || 0);
  page.drawText(totalLabel, { x: 30, y, size: 12, font: bold, color: navy });
  page.drawText(totalAmt, { x: 520 - bold.widthOfTextAtSize(totalAmt, 12), y, size: 12, font: bold, color: navy });
  y -= 30;

  // ── FOOTER ──
  if (data.validUntil) {
    page.drawText(`This quote is valid until ${data.validUntil}.`, { x: 30, y, size: 9, font: reg, color: gray });
    y -= 14;
  }
  page.drawText('Thank you for your business!', { x: 30, y, size: 9, font: reg, color: gray });

  // Bottom bar
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 36, color: navy });
  page.drawText('Signal Transportation Ltd', { x: 20, y: 14, size: 9, font: reg, color: white });
  page.drawText('signaltrucking@gmail.com | 604-867-5543', { x: 350, y: 14, size: 9, font: reg, color: rgb(0.7, 0.8, 0.9) });

  return doc.save();
}
