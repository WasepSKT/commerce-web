// Generator untuk Faktur/Nota - format standar Indonesia
interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  name?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  [key: string]: unknown;
}

interface OrderForFaktur {
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

export const generateFakturHTML = (order: OrderForFaktur): string => {
  const items = order.order_items ?? [];
  
  const rowsHtml = items.map((it) => {
    const name = String(it.name ?? it.product_id ?? 'Produk');
    const qty = Number(it.quantity ?? 1);
    const unitPrice = Number(it.price ?? it.unit_price ?? 0);
    const total = qty * unitPrice;
    
    return `
      <tr>
        <td style="border:1px solid #ddd;padding:8px;text-align:left;">${name}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:center;">${qty}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right;">Rp ${unitPrice.toLocaleString('id-ID')}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right;">Rp ${total.toLocaleString('id-ID')}</td>
      </tr>`;
  }).join('');

  const totalAmount = Number(order.total_amount ?? 0);
  const pajak = Math.round(totalAmount * 0.11); // PPN 11%
  const subtotal = totalAmount - pajak;
  
  const currentDate = new Date();
  const fakturDate = order.created_at ? new Date(order.created_at) : currentDate;
  
  return `
    <html>
    <head>
      <title>FAKTUR - ${order.id}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, Helvetica, sans-serif; 
          padding: 20px; 
          line-height: 1.4;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #7A1316;
          padding-bottom: 20px;
        }
        .logo {
          max-width: 250px;
          height: auto;
          margin-bottom: 10px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #7A1316;
          margin: 10px 0;
        }
        .company-info {
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        .faktur-title {
        text-align: center;
          font-size: 20px;
          font-weight: bold;
          color: #7A1316;
          margin: 20px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .faktur-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .faktur-left, .faktur-right {
          width: 48%;
        }
        .info-box {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .info-title {
          font-weight: bold;
          color: #7A1316;
          margin-bottom: 10px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 14px;
        }
        th {
          background-color: #7A1316;
          color: white;
          font-weight: bold;
          padding: 12px 8px;
          text-align: left;
          border: 1px solid #7A1316;
        }
        td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .total-section {
          float: right;
          width: 300px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }
        .total-row.final {
          border-top: 2px solid #7A1316;
          border-bottom: 2px solid #7A1316;
          font-weight: bold;
          font-size: 16px;
          margin-top: 10px;
          padding: 10px 0;
        }
        .footer {
          clear: both;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        /* place signatures below floated totals and split 50/50 */
        .signature-section {
          clear: both; /* ensure below subtotal/total float */
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 60px; /* space from totals */
          align-items: flex-start;
          width: 100%;
          box-sizing: border-box;
        }
        .signature-box {
          box-sizing: border-box;
        }
        /* exact 50/50 columns (minus gap) */
        .signature-left, .signature-right {
          width: calc(50% - 10px);
          min-width: 160px;
        }
        /* left column content aligned left, right column aligned right */
        .signature-left { text-align: left; margin-top: 20px; }
        .signature-right { text-align: right;margin-top: 20px; }
        /* signature line stays inside its column and aligns to start/end */
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 56px;
          padding-top: 6px;
          min-height: 48px;
          display: block;
          width: 70%;
        }
        .signature-left .signature-line { margin-left: 0; margin-right: auto; }
        .signature-right .signature-line { margin-left: auto; margin-right: 0; }
        @media (max-width: 640px) {
          .signature-section { flex-direction: column; gap: 12px; }
          .signature-left, .signature-right { width: 100%; }
          .signature-line { width: 100%; margin-top: 28px; }
        }
        @media print {
          body { padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/regalpaw.png" alt="Regal Paw Logo" class="logo" />
        <div class="company-info">
          Toko Makanan Kucing Premium<br/>
          Ruko Citra Raya Square I Blok B2A NO 17 & 18, Kec. Cikupa, Kab. Tangerang - Banten 15710<br/>
          Telp: (+62) 812 1675 9143 | Email: info@regalpaw.com<br/>
          NPWP: 12.345.678.9-123.000
        </div>
      </div>

      <div class="faktur-title">FAKTUR PENJUALAN</div>
      
      <div class="faktur-info">
        <div class="faktur-left">
          <div class="info-box">
            <div class="info-title">INFORMASI FAKTUR</div>
            <div><strong>No. Faktur:</strong> FKT-${order.id.slice(-8).toUpperCase()}</div>
            <div><strong>Tanggal:</strong> ${fakturDate.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
            <div><strong>Jam:</strong> ${fakturDate.toLocaleTimeString('id-ID')}</div>
            <div><strong>Order ID:</strong> ${order.id}</div>
          </div>
        </div>
        
        <div class="faktur-right">
          <div class="info-box">
            <div class="info-title">KEPADA YTH.</div>
            <div><strong>${order.customer_name ?? order.user_id ?? '-'}</strong></div>
            <div>${order.customer_phone ?? ''}</div>
            <div style="white-space: pre-line; margin-top: 8px;">
              ${order.customer_address ?? '-'}
            </div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 50%;">NAMA BARANG/JASA</th>
            <th style="width: 15%; text-align: center;">QTY</th>
            <th style="width: 20%; text-align: right;">HARGA SATUAN</th>
            <th style="width: 15%; text-align: right;">JUMLAH</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>Rp ${subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div class="total-row">
          <span>PPN 11%:</span>
          <span>Rp ${pajak.toLocaleString('id-ID')}</span>
        </div>
        <div class="total-row final">
          <span>TOTAL BAYAR:</span>
          <span>Rp ${totalAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box signature-left">
          <div>Hormat Kami,</div>
          <div class="signature-line">
            <strong>REGAL PAW</strong><br/>
            Admin
          </div>
        </div>
        <div class="signature-box signature-right">
          <div>Penerima,</div>
          <div class="signature-line">
            <strong>${order.customer_name ?? 'Customer'}</strong><br/>
            Pembeli
          </div>
        </div>
      </div>

      <div class="footer">
        <p><strong>SYARAT & KETENTUAN:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>Barang yang sudah dibeli tidak dapat dikembalikan</li>
          <li>Kerusakan dalam pengiriman bukan tanggung jawab toko</li>
          <li>Komplain maksimal 3x24 jam setelah barang diterima</li>
        </ul>
        <p style="text-align: center; margin-top: 20px;">
          <strong>Terima kasih atas kepercayaan Anda berbelanja di Regal Paw!</strong>
        </p>
      </div>
    </body>
    </html>
  `;
};

export const printFaktur = (order: OrderForFaktur): void => {
  const html = generateFakturHTML(order);
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    throw new Error('Tidak dapat membuka jendela cetak');
  }
  
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Auto print setelah load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
};