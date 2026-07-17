/**
 * invoice.js — generates a branded 718 MMA Gym PDF invoice as a Buffer.
 * Uses pdfkit (no system/native dependencies).
 */
const PDFDocument = require('pdfkit');

const RED = '#e8112d';
const INK = '#0c0c0e';
const GREY = '#6b6b73';

const GYM = {
  name: '718 MMA GYM',
  legal: 'Seven One Eight Active MMA',
  addr: 'Opp. National Police Academy, Raghavendra Nagar,\nShivarampally Jagir, Telangana 500052',
  phone: '+91 91337 18718',
  email: '718mmahyd@gmail.com',
};

const inr = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => new Date(d || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * data: { invoiceNo, name, email, phone, plan, amount, method, paymentId, date, expiresAt }
 * returns Promise<Buffer>
 */
function generateInvoicePdf(data = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const L = 50, R = 545; // page content bounds

      // ---- Header band ----
      doc.rect(0, 0, doc.page.width, 96).fill(INK);
      doc.fillColor('#ffffff').font('Helvetica-BoldOblique').fontSize(34).text('7', L, 30, { continued: true });
      doc.fillColor(RED).text('18', { continued: true });
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('  MMA GYM', { continued: false });
      doc.font('Helvetica').fontSize(9).fillColor('#b9b9c2').text(GYM.legal, L, 68);
      doc.font('Helvetica-Bold').fontSize(26).fillColor('#ffffff').text('INVOICE', R - 160, 34, { width: 160, align: 'right' });

      // ---- Invoice meta ----
      let y = 120;
      doc.fillColor(GREY).font('Helvetica').fontSize(10);
      doc.text('Invoice No.', R - 220, y, { width: 100, align: 'left' });
      doc.text('Date', R - 220, y + 16, { width: 100, align: 'left' });
      doc.fillColor(INK).font('Helvetica-Bold');
      doc.text(data.invoiceNo || '—', R - 120, y, { width: 120, align: 'right' });
      doc.text(fmtDate(data.date), R - 120, y + 16, { width: 120, align: 'right' });

      // ---- Billed to ----
      doc.fillColor(GREY).font('Helvetica').fontSize(10).text('BILLED TO', L, y);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(13).text(data.name || data.email || 'Member', L, y + 15);
      doc.font('Helvetica').fontSize(10).fillColor('#333');
      if (data.email) doc.text(data.email, L, y + 34);
      if (data.phone) doc.text(data.phone, L, y + 48);

      // GST is inclusive of the amount paid.
      const total = Number(data.amount || 0);
      const rate = data.gstRate != null ? data.gstRate : 5;
      const gst = data.gst != null ? Number(data.gst) : Math.round(total * rate / 100);
      const base = data.base != null ? Number(data.base) : total - gst;

      // ---- Table ----
      y = 200;
      doc.rect(L, y, R - L, 26).fill(RED);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10);
      doc.text('DESCRIPTION', L + 12, y + 8);
      doc.text('AMOUNT', R - 150, y + 8, { width: 138, align: 'right' });

      y += 26;
      doc.rect(L, y, R - L, 40).fill('#f5f5f7');
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(`${data.plan || 'Membership'} Plan`, L + 12, y + 8);
      doc.fillColor(GREY).font('Helvetica').fontSize(9)
        .text(data.expiresAt ? `Valid until ${fmtDate(data.expiresAt)}` : 'Gym membership', L + 12, y + 23);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(inr(base), R - 150, y + 15, { width: 138, align: 'right' });

      // ---- Tax breakdown ----
      y += 40 + 12;
      const rowRight = (label, val, bold) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10);
        doc.fillColor(bold ? INK : GREY).text(label, R - 300, y, { width: 170, align: 'right' });
        doc.fillColor(bold ? INK : '#333').text(inr(val), R - 150, y, { width: 138, align: 'right' });
        y += bold ? 22 : 18;
      };
      rowRight('Fees (taxable value)', base, false);
      rowRight(`GST @ ${rate}%`, gst, false);
      doc.moveTo(R - 300, y + 2).lineTo(R, y + 2).strokeColor('#e2e2e6').stroke();
      y += 10;
      doc.fillColor(GREY).font('Helvetica').fontSize(11).text('Total Paid (incl. GST)', R - 320, y, { width: 170, align: 'right' });
      doc.fillColor(RED).font('Helvetica-Bold').fontSize(16).text(inr(total), R - 150, y - 3, { width: 138, align: 'right' });
      y += 24;
      doc.fillColor('#9a9aa3').font('Helvetica').fontSize(8).text(`GST ${rate}% inclusive · ${inr(gst)} of the amount paid is GST.`, R - 320, y, { width: 320, align: 'right' });

      // ---- Payment info ----
      y += 40;
      doc.fillColor(GREY).font('Helvetica').fontSize(10).text('Payment method', L, y);
      doc.fillColor(INK).font('Helvetica-Bold').text((data.method || 'Online').toUpperCase(), L, y + 14);
      if (data.paymentId) {
        doc.fillColor(GREY).font('Helvetica').text('Reference', L + 200, y);
        doc.fillColor(INK).font('Helvetica-Bold').text(String(data.paymentId), L + 200, y + 14);
      }
      doc.fillColor('#1a9e5c').font('Helvetica-Bold').fontSize(11).text('PAID', R - 100, y + 6, { width: 88, align: 'right' });

      // ---- Footer ----
      const fy = 740;
      doc.moveTo(L, fy).lineTo(R, fy).strokeColor('#e2e2e6').stroke();
      doc.fillColor(GREY).font('Helvetica').fontSize(9);
      doc.text(GYM.addr, L, fy + 10);
      doc.text(`${GYM.phone}   |   ${GYM.email}`, L, fy + 40);
      doc.fillColor('#a0a0a8').fontSize(8).text('Thank you for training with 718 MMA. This is a computer-generated invoice.', L, fy + 58);

      doc.end();
    } catch (e) { reject(e); }
  });
}

module.exports = { generateInvoicePdf };
