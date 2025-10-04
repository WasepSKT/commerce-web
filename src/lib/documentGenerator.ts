import { jsPDF } from 'jspdf';

interface OrderItem {
  name?: string;
  product_name?: string;
  title?: string;
  quantity?: number;
  qty?: number;
  unit_price?: number;
  price?: number;
}

interface Order {
  id: string;
  created_at?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount?: number;
  status?: string;
  shipping_courier?: string | null;
  tracking_number?: string | null;
  order_items?: OrderItem[];
}

export const downloadInvoice = (order: Order) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(122, 19, 22); // Primary color
  doc.text('INVOICE', 20, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('PT. Guna Aura Gemilang', 20, 45);
  doc.text('Regal Paw Pet Store', 20, 55);
  
  // Invoice Info
  doc.text(`Invoice #: ${order.id.slice(0, 8)}`, 120, 45);
  doc.text(`Tanggal: ${new Date(order.created_at || '').toLocaleDateString('id-ID')}`, 120, 55);
  doc.text(`Status: ${getStatusLabel(order.status || 'pending')}`, 120, 65);
  
  // Customer Info
  doc.text('Dikirim kepada:', 20, 80);
  doc.text(order.customer_name || '', 20, 90);
  doc.text(order.customer_phone || '', 20, 100);
  
  // Address with text wrapping
  const address = order.customer_address || '';
  const splitAddress = doc.splitTextToSize(address, 100);
  doc.text(splitAddress, 20, 110);
  
  // Items table header
  let yPos = 140;
  doc.setFillColor(242, 242, 242);
  doc.rect(20, yPos - 10, 170, 10, 'F');
  
  doc.setFontSize(10);
  doc.text('Produk', 25, yPos - 3);
  doc.text('Qty', 110, yPos - 3);
  doc.text('Harga', 130, yPos - 3);
  doc.text('Total', 160, yPos - 3);
  
  // Items
  doc.setFontSize(9);
  order.order_items?.forEach((item) => {
    yPos += 15;
    const name = item.name || item.product_name || item.title || '-';
    const quantity = item.quantity || item.qty || 1;
    const price = item.unit_price || item.price || 0;
    const total = price * quantity;
    
    doc.text(name.substring(0, 30), 25, yPos);
    doc.text(quantity.toString(), 115, yPos);
    doc.text(`Rp ${price.toLocaleString('id-ID')}`, 135, yPos);
    doc.text(`Rp ${total.toLocaleString('id-ID')}`, 165, yPos);
  });
  
  // Total
  yPos += 20;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total: Rp ${(order.total_amount || 0).toLocaleString('id-ID')}`, 130, yPos);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Terima kasih telah berbelanja di Regal Paw!', 20, 280);
  
  doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
};

export const downloadReceipt = (order: Order) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(122, 19, 22);
  doc.text('FAKTUR PENJUALAN', 20, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('PT. Guna Aura Gemilang', 20, 45);
  doc.text('Regal Paw Pet Store', 20, 55);
  doc.text('NPWP: 12.345.678.9-012.000', 20, 65);
  
  // Receipt Info
  doc.text(`Faktur #: ${order.id.slice(0, 8)}`, 120, 45);
  doc.text(`Tanggal: ${new Date(order.created_at || '').toLocaleDateString('id-ID')}`, 120, 55);
  doc.text('Status: SELESAI', 120, 65);
  
  // Customer Info
  doc.text('Pembeli:', 20, 85);
  doc.text(order.customer_name || '', 20, 95);
  doc.text(order.customer_phone || '', 20, 105);
  
  const address = order.customer_address || '';
  const splitAddress = doc.splitTextToSize(address, 100);
  doc.text(splitAddress, 20, 115);
  
  // Shipping Info
  if (order.shipping_courier || order.tracking_number) {
    doc.text('Pengiriman:', 120, 85);
    if (order.shipping_courier) {
      doc.text(`Kurir: ${order.shipping_courier}`, 120, 95);
    }
    if (order.tracking_number) {
      doc.text(`No. Resi: ${order.tracking_number}`, 120, 105);
    }
  }
  
  // Items table
  let yPos = 145;
  doc.setFillColor(242, 242, 242);
  doc.rect(20, yPos - 10, 170, 10, 'F');
  
  doc.setFontSize(10);
  doc.text('Produk', 25, yPos - 3);
  doc.text('Qty', 110, yPos - 3);
  doc.text('Harga', 130, yPos - 3);
  doc.text('Total', 160, yPos - 3);
  
  doc.setFontSize(9);
  let subtotal = 0;
  
  order.order_items?.forEach((item) => {
    yPos += 15;
    const name = item.name || item.product_name || item.title || '-';
    const quantity = item.quantity || item.qty || 1;
    const price = item.unit_price || item.price || 0;
    const total = price * quantity;
    subtotal += total;
    
    doc.text(name.substring(0, 30), 25, yPos);
    doc.text(quantity.toString(), 115, yPos);
    doc.text(`Rp ${price.toLocaleString('id-ID')}`, 135, yPos);
    doc.text(`Rp ${total.toLocaleString('id-ID')}`, 165, yPos);
  });
  
  // Totals
  yPos += 20;
  doc.line(130, yPos - 5, 185, yPos - 5);
  
  doc.setFontSize(10);
  doc.text(`Subtotal: Rp ${subtotal.toLocaleString('id-ID')}`, 130, yPos);
  
  yPos += 10;
  const ppn = Math.round(subtotal * 0.11); // PPN 11%
  doc.text(`PPN (11%): Rp ${ppn.toLocaleString('id-ID')}`, 130, yPos);
  
  yPos += 15;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text(`Total: Rp ${(order.total_amount || 0).toLocaleString('id-ID')}`, 130, yPos);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.', 20, 260);
  doc.text('Terima kasih telah berbelanja di Regal Paw!', 20, 270);
  
  doc.save(`faktur-${order.id.slice(0, 8)}.pdf`);
};

const getStatusLabel = (status: string) => {
  const statusMap: { [key: string]: string } = {
    pending: 'Menunggu Pembayaran',
    paid: 'Dibayar',
    shipped: 'Dikirim',
    dikirim: 'Dikirim',
    completed: 'Selesai',
    selesai: 'Selesai',
    cancelled: 'Dibatalkan',
    dibatalkan: 'Dibatalkan'
  };
  return statusMap[status] || status;
};