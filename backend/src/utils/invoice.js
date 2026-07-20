import PDFDocument from 'pdfkit';

/** Stream a branded PDF invoice for an order directly into the HTTP response. */
export const generateInvoicePDF = (order, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
  doc.pipe(res);

  // Header
  doc.fillColor('#4F46E5').fontSize(24).font('Helvetica-Bold').text('LUXORA', 50, 50);
  doc.fillColor('#64748B').fontSize(10).font('Helvetica').text('Premium E-Commerce Store', 50, 78);
  doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', 400, 50, { align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#334155')
    .text(`Invoice #: ${order.orderNumber}`, 400, 75, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' })
    .text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`, 400, 105, { align: 'right' });

  // Bill to
  const a = order.shippingAddress || {};
  doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#E2E8F0').stroke();
  doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Bill To', 50, 145);
  doc.fontSize(10).font('Helvetica').fillColor('#334155')
    .text(a.fullName || '', 50, 163)
    .text(`${a.line1 || ''}${a.line2 ? ', ' + a.line2 : ''}`, 50, 178)
    .text(`${a.city || ''}, ${a.state || ''} ${a.pincode || ''}`, 50, 193)
    .text(`Phone: ${a.phone || ''}`, 50, 208);

  // Items table
  let y = 245;
  doc.rect(50, y, 495, 22).fill('#4F46E5');
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
    .text('Item', 58, y + 6, { width: 240 }).text('Qty', 310, y + 6)
    .text('Price', 370, y + 6).text('Total', 480, y + 6);
  y += 30;
  doc.font('Helvetica').fillColor('#334155');
  order.items.forEach((it) => {
    const variant = [it.variant?.color, it.variant?.size].filter(Boolean).join(' / ');
    doc.text(`${it.name}${variant ? ` (${variant})` : ''}`, 58, y, { width: 240 });
    doc.text(String(it.quantity), 310, y).text(`Rs. ${it.price.toLocaleString('en-IN')}`, 370, y)
      .text(`Rs. ${(it.price * it.quantity).toLocaleString('en-IN')}`, 470, y);
    y += Math.max(18, doc.heightOfString(it.name, { width: 240 }) + 6);
  });

  // Totals
  y += 10;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#E2E8F0').stroke();
  y += 12;
  const row = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? '#0F172A' : '#334155')
      .text(label, 370, y).text(value, 460, y, { width: 85, align: 'right' });
    y += 17;
  };
  row('Subtotal', `Rs. ${order.itemsPrice.toLocaleString('en-IN')}`);
  row('Shipping', order.shippingPrice ? `Rs. ${order.shippingPrice.toLocaleString('en-IN')}` : 'FREE');
  row('GST (18%)', `Rs. ${order.taxPrice.toLocaleString('en-IN')}`);
  if (order.discount > 0) row(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- Rs. ${order.discount.toLocaleString('en-IN')}`);
  row('Grand Total', `Rs. ${order.totalPrice.toLocaleString('en-IN')}`, true);

  doc.fontSize(9).fillColor('#64748B').text('Thank you for shopping with LUXORA. For support, reply to this invoice email or visit the Contact page.', 50, 760, { align: 'center', width: 495 });
  doc.end();
};
