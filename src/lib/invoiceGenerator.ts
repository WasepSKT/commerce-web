interface OrderItem {
  name?: string;
  product_name?: string;
  title?: string;
  quantity?: number;
  qty?: number;
  unit_price?: number;
  price?: number;
  [key: string]: unknown;
}

interface Order {
  id: string;
  created_at?: string;
  customer_name?: string;
  user_id?: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount?: number;
  status?: string;
  shipping_courier?: string | null;
  tracking_number?: string | null;
  order_items?: OrderItem[];
  [key: string]: unknown;
}

export const generateInvoiceHTML = (order: Order): string => {
  const items = order.order_items ?? [];
  
  const rowsHtml = items.map((it) => {
    const name = String(it.name ?? it.product_name ?? it.title ?? '-');
    const quantity = Number(it.quantity ?? it.qty ?? 1);
    const unitPrice = Number(it.unit_price ?? it.price ?? 0);
    const total = unitPrice * quantity;
    
    return `
      <tr>
        <td style="padding:6px;border:1px solid #ddd">${name}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${quantity}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right">Rp ${unitPrice.toLocaleString('id-ID')}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right">Rp ${total.toLocaleString('id-ID')}</td>
      </tr>
    `;
  }).join('');

  const shippingInfo = (order.status === 'dikirim' || order.status === 'shipped') ? `
    <hr style="margin:20px 0" />
    <div style="background:#f8f9fa;padding:15px;border-radius:8px;">
      <h3 style="margin:0 0 10px 0;color:#7A1316;">Informasi Pengiriman</h3>
      <table style="border:none;width:100%;">
        <tr style="border:none;">
          <td style="border:none;padding:4px 8px;font-weight:bold;">Kurir:</td>
          <td style="border:none;padding:4px 8px;">${order.shipping_courier ?? '-'}</td>
        </tr>
        <tr style="border:none;">
          <td style="border:none;padding:4px 8px;font-weight:bold;">No. Resi:</td>
          <td style="border:none;padding:4px 8px;font-family:monospace;font-weight:bold;color:#8B5CF6;">${order.tracking_number ?? '-'}</td>
        </tr>
      </table>
      <p style="margin:10px 0 0 0;font-style:italic;color:#666;font-size:14px;">
        Gunakan nomor resi untuk melacak status pengiriman Anda melalui website kurir yang bersangkutan.
      </p>
    </div>
  ` : '';

  return `
    <html>
    <head>
      <title>Invoice - ${order.id}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, Helvetica, sans-serif; 
          padding: 20px; 
          line-height: 1.5;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #7A1316;
          padding-bottom: 20px;
        }
        .logo {
          max-width: 240px;
          height: auto;
          margin-bottom: 10px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #7A1316;
          margin: 0;
          text-align: center;
        }
        .order-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .customer-info {
          margin: 20px 0;
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 20px 0;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          text-align: left;
        }
        .total-section {
          text-align: right;
          font-size: 18px;
          font-weight: bold;
          margin: 20px 0;
          padding: 15px;
          background: #e8f5e8;
          border-radius: 8px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .header { border-bottom-color: #000; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/regalpaw.png" alt="Regal Paw Logo" class="logo">
      </div>
      <h1 class="invoice-title">INVOICE</h1>
     <p style="margin:5px 0;color:#666; text-align:center;">Regal Paw Pet Shop</p>
      <div class="order-info">
        <table style="border:none;width:100%;">
          <tr style="border:none;">
            <td style="border:none;padding:4px 8px;font-weight:bold;">Order ID:</td>
            <td style="border:none;padding:4px 8px;font-family:monospace;">${order.id}</td>
          </tr>
          <tr style="border:none;">
            <td style="border:none;padding:4px 8px;font-weight:bold;">Tanggal:</td>
            <td style="border:none;padding:4px 8px;">${order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : '-'}</td>
          </tr>
          <tr style="border:none;">
            <td style="border:none;padding:4px 8px;font-weight:bold;">Status:</td>
            <td style="border:none;padding:4px 8px;text-transform:capitalize;">${order.status ?? 'pending'}</td>
          </tr>
        </table>
      </div>

      <div class="customer-info">
        <h3 style="margin:0 0 10px 0;color:#7A1316;">Informasi Pelanggan</h3>
        <table style="border:none;width:100%;">
          <tr style="border:none;">
            <td style="border:none;padding:4px 8px;font-weight:bold;">Nama:</td>
            <td style="border:none;padding:4px 8px;">${order.customer_name ?? order.user_id ?? '-'}</td>
          </tr>
          <tr style="border:none;">
            <td style="border:none;padding:4px 8px;font-weight:bold;">Telepon:</td>
            <td style="border:none;padding:4px 8px;">${order.customer_phone ?? '-'}</td>
          </tr>
          <tr style="border:none;">
            <td style="border:none;padding:4px 8px;font-weight:bold;vertical-align:top;">Alamat Lengkap:</td>
            <td style="border:none;padding:4px 8px;white-space:pre-line;">
              ${order.customer_address || '-'}
            </td>
          </tr>
        </table>
      </div>

      <h3 style="color:#7A1316;margin:20px 0 10px 0;">Detail Pesanan</h3>
      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th style="text-align:center;width:80px;">Qty</th>
            <th style="text-align:right;width:120px;">Harga Satuan</th>
            <th style="text-align:right;width:120px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="total-section">
        Total Pembayaran: Rp ${Number(order.total_amount ?? 0).toLocaleString('id-ID')}
      </div>

      ${shippingInfo}

      <div style="margin-top:30px;padding:15px;background:#f8f9fa;border-radius:8px;text-align:center;color:#666;font-size:14px;">
        <p style="margin:0;">Terima kasih telah berbelanja di Regal Paw!</p>
        <p style="margin:5px 0 0 0;">Untuk pertanyaan, hubungi kami di WhatsApp: +62 812-3456-7890</p>
      </div>
    </body>
    </html>
  `;
};

export const printInvoice = (order: Order): void => {
  // Try PDF helper first if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfHelper = (window as any).generateInvoicePdf as ((order: Order) => Promise<void>) | undefined;
  
  if (pdfHelper) {
    pdfHelper(order).catch((error) => {
      console.error('PDF helper failed, falling back to print:', error);
      openPrintWindow(order);
    });
  } else {
    openPrintWindow(order);
  }
};

const openPrintWindow = (order: Order): void => {
  const win = window.open('', '_blank', 'width=900,height=800');
  if (!win) {
    throw new Error('Tidak dapat membuka jendela cetak');
  }

  const html = generateInvoiceHTML(order);
  
  win.document.open();
  win.document.write(html);
  win.document.close();
  
  // Auto-print after content loads
  setTimeout(() => {
    try {
      win.print();
    } catch (e) {
      console.error('Print failed:', e);
    }
  }, 300);
};