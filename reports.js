const PDFDocument = require('pdfkit');

const inr = (value) => 'Rs. ' + Number(value || 0).toLocaleString('en-IN');
const date = (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function generateReportPdf(report) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 42 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      const heading = (text) => doc.fillColor('#e8112d').font('Helvetica-Bold').fontSize(13).text(text.toUpperCase());
      const line = () => doc.moveTo(42, doc.y + 7).lineTo(553, doc.y + 7).strokeColor('#dddddd').stroke().moveDown(1);
      const summary = report.summary || {};

      doc.rect(0, 0, doc.page.width, 82).fill('#0c0c0e');
      doc.fillColor('#fff').font('Helvetica-BoldOblique').fontSize(30).text('7', 42, 25, { continued: true });
      doc.fillColor('#e8112d').text('18', { continued: true });
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(14).text('  MMA GYM');
      doc.font('Helvetica-Bold').fontSize(17).text('FINANCIAL REPORT', 340, 32, { width: 170, align: 'right' });
      doc.fillColor('#333').font('Helvetica-Bold').fontSize(16).text(report.label, 42, 108);
      doc.fillColor('#777').font('Helvetica').fontSize(9).text(`Generated ${date(new Date())}`, 42, 130);

      let y = 158;
      const cards = [
        ['Collections', inr(summary.collections)], ['Expenses', inr(summary.expenses)],
        ['Net collections', inr(summary.netCollections)], ['New admissions', String(summary.admissions || 0)],
        ['Renewals', String(summary.renewals || 0)], ['Outstanding due', inr(summary.outstanding)],
      ];
      cards.forEach((card, index) => {
        const x = 42 + (index % 3) * 170;
        const cy = y + Math.floor(index / 3) * 62;
        doc.roundedRect(x, cy, 156, 50, 5).fillAndStroke('#f4f4f5', '#dddddd');
        doc.fillColor('#777').font('Helvetica').fontSize(8).text(card[0].toUpperCase(), x + 10, cy + 9);
        doc.fillColor('#111').font('Helvetica-Bold').fontSize(14).text(card[1], x + 10, cy + 24, { width: 136, align: 'right' });
      });
      doc.y = y + 145;
      heading('Daily expenses'); doc.moveDown(.4);
      const expenses = report.expenses || [];
      if (!expenses.length) doc.fillColor('#777').font('Helvetica').fontSize(10).text('No expenses recorded for this period.');
      expenses.slice(0, 25).forEach((expense) => {
        doc.fillColor('#222').font('Helvetica').fontSize(9).text(`${date(expense.expense_date)}  ·  ${expense.category || 'General'}  ·  ${expense.description || '-'}`, 42, doc.y, { width: 385 });
        doc.font('Helvetica-Bold').text(inr(expense.amount), 440, doc.y - 11, { width: 70, align: 'right' });
        line();
      });
      doc.moveDown(.8); heading('Collections'); doc.moveDown(.4);
      const payments = report.payments || [];
      if (!payments.length) doc.fillColor('#777').font('Helvetica').fontSize(10).text('No paid collections for this period.');
      payments.slice(0, 25).forEach((payment) => {
        if (doc.y > 735) { doc.addPage(); doc.y = 48; }
        doc.fillColor('#222').font('Helvetica').fontSize(9).text(`${date(payment.created_at)}  ·  ${payment.name || payment.email || 'Member'}  ·  ${payment.plan || '-'}`, 42, doc.y, { width: 385 });
        doc.font('Helvetica-Bold').text(inr(payment.amount), 440, doc.y - 11, { width: 70, align: 'right' });
        line();
      });
      doc.end();
    } catch (error) { reject(error); }
  });
}

module.exports = { generateReportPdf };
