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

interface OrderForReceipt {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  user_id?: string;
  total_amount?: number;
  order_items?: OrderItem[];
}

export const printXPrinterReceipt = (order: OrderForReceipt): void => {
  // create a compact receipt layout suitable for thermal/x-printer style
  const win = window.open('', '_blank', 'width=400,height=700');
  if (!win) {
    throw new Error('Tidak dapat membuka jendela cetak');
  }
  
  const items = (order.order_items ?? []) as Array<Record<string, unknown>>;
  console.debug('Printing receipt for order items', items);

  // Build item rows, supporting nested product objects and alternate field names
  const itemRows = items
    .map((it) => {
      // handle nested product object (it.product?.name)
      const prodObj = (it['product'] && typeof it['product'] === 'object') ? (it['product'] as Record<string, unknown>) : null;
      const name = String(
        it['name'] ?? prodObj?.['name'] ?? prodObj?.['title'] ?? it['product_name'] ?? it['title'] ?? ''
      );
      const qty = Number(it['quantity'] ?? it['qty'] ?? prodObj?.['quantity'] ?? 1);
      const unit = Number(it['price'] ?? prodObj?.['price'] ?? it['unit_price'] ?? 0);
      const weight = it['weight'] ?? it['weight_grams'] ?? prodObj?.['weight'] ?? null;
      const total = unit * qty;
      const weightHtml = weight ? `<div class="small">Berat: ${String(weight)}</div>` : '';
      return `
        <tr>
          <td style="padding:4px;border-bottom:1px dashed #000">
            <div>${name}</div>
            ${weightHtml}
          </td>
          <td style="padding:4px;border-bottom:1px dashed #000;text-align:center">${qty}</td>
          <td style="padding:4px;border-bottom:1px dashed #000;text-align:right">Rp ${unit.toLocaleString('id-ID')}</td>
          <td style="padding:4px;border-bottom:1px dashed #000;text-align:right">Rp ${total.toLocaleString('id-ID')}</td>
        </tr>`;
    })
    .join('');

  // If there are no item rows, provide a fallback row so the receipt is never empty
  const finalItemRows = itemRows || `<tr><td style="padding:4px">(Tidak ada item)</td><td style="padding:4px;text-align:center">-</td><td style="padding:4px;text-align:right">-</td><td style="padding:4px;text-align:right">-</td></tr>`;

  const logoUrl = '/regalpaw.png'; // black/white logo in public/
  const barcode = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(String(order.id))}" alt="barcode" />`;

  const html = `
    <html>
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
  /* Use exact A6 paper size: 105mm x 148mm */
  @page { size: 105mm 148mm; margin: 6mm; }
  html, body { width: 105mm; height: 148mm; padding: 0; margin: 0; }
  body{font-family: Arial, Helvetica, sans-serif; font-size:12px; padding:0; margin:0; color:#000}
  /* Content area equals A6 minus 2*margin (6mm) */
  .receipt { width: calc(105mm - 12mm); height: calc(148mm - 12mm); max-width: calc(105mm - 12mm); box-sizing:border-box; padding:6mm; overflow: hidden; }
        .header{display:flex; justify-content:space-between; align-items:center; gap:8px}
        .logo img{max-height:36px; filter:grayscale(1)}
        .barcode img{max-height:60px}
        .seller{font-weight:700; font-size:14px}
        .address{font-size:10px; color:#333}
        hr{border:none;border-top:1px dashed #333;margin:8px 0}
        table{width:100%; border-collapse:collapse; font-size:11px}
        th,td{padding:4px}
        th{font-weight:600; font-size:11px}
        .items td{vertical-align:top}
        .small{font-size:10px;color:#444}
        .footer{margin-top:6px; font-size:11px}
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo"><img src="${logoUrl}" alt="logo"/></div>
          <div style="flex:1"></div>
          <div class="barcode">${barcode}</div>
        </div>

        <div style="margin-top:6px">
          <div class="seller">Regal Paw</div>
          <div class="address">Ruko Citra Raya Square I Blok B2A NO 17 & 18, Kec. Cikupa, Kab. Tangerang - Banten 15710 — Telp: (+62) 812 1675 9143</div>
        </div>

        <hr/>

        <div>
          <div style="font-weight:700">Penerima</div>
          <div>${order.customer_name ?? order.user_id ?? '-'}</div>
          <div class="small">${order.customer_phone ?? '-'}</div>
          <div class="small" style="margin-top:2px;white-space:pre-line;">
            ${order.customer_address || '-'}
          </div>
        </div>

        <hr/>

        <table class="items">
          <thead>
            <tr><th style="text-align:left;">Produk</th><th style="text-align:center;width:28mm">Qty</th><th style="text-align:right;width:28mm">Harga</th><th style="text-align:right;width:28mm">Total</th></tr>
          </thead>
          <tbody>
            ${finalItemRows}
          </tbody>
        </table>

        <hr/>

        <div class="footer">
          <div style="display:flex;justify-content:space-between"><div>Order ID</div><div class="font-mono">${order.id}</div></div>
          <div style="display:flex;justify-content:space-between;margin-top:6px"><div>Total</div><div>Rp ${Number(order.total_amount ?? 0).toLocaleString('id-ID')}</div></div>
          <div class="small" style="margin-top:8px">Terima kasih telah berbelanja di Regal Paw</div>
        </div>
      </div>
      <script>
        // Scale receipt to fit A6 page if content is taller than page
        (function(){
          function mmToPx(mm){ return mm * (96/25.4); }
          var availHeightPx = mmToPx(148 - 12); // page height minus margins (mm->px)
          var availWidthPx = mmToPx(105 - 12);
          var receipt = document.querySelector('.receipt');
          if(!receipt) return;
          var contentH = receipt.scrollHeight;
          var contentW = receipt.scrollWidth;
          if(contentH > availHeightPx || contentW > availWidthPx){
            var scale = Math.min(availWidthPx / contentW, availHeightPx / contentH);
            if(scale < 1){
              receipt.style.transformOrigin = 'top left';
              receipt.style.transform = 'scale(' + scale + ')';
              // keep the document width equal to page width to avoid extra pages
              document.body.style.width = (availWidthPx) + 'px';
            }
          }
        })();
      </script>
    </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => { 
    try { 
      win.print(); 
    } catch (e) { 
      console.error(e); 
    } 
  }, 300);
};