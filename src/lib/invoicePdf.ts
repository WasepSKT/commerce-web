/*
  NOTE: This helper dynamically imports `html2canvas` and `jspdf` to generate a PDF invoice.
  Install them in your project to enable PDF exports:

  npm install html2canvas jspdf

  The function attaches itself to window.generateInvoicePdf when executed in a browser.
*/
export async function generateInvoicePdf(order: Record<string, unknown>) {
  // dynamic import so the app doesn't break if deps are not installed
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) throw new Error('Not in browser');

  // try to dynamically import libraries
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // build a simple DOM element to render
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, Helvetica, sans-serif';
  // normalize and guard unknown fields
  const idStr = String(order.id ?? '-');
  const createdAtRaw = order.created_at as unknown;
  let createdDate: Date;
  if (createdAtRaw instanceof Date) {
    createdDate = createdAtRaw;
  } else if (typeof createdAtRaw === 'number' || typeof createdAtRaw === 'string') {
    createdDate = new Date(createdAtRaw);
  } else {
    createdDate = new Date();
  }

  const nameStr = String(order.customer_name ?? order.user_id ?? '-');
  const phoneStr = String(order.customer_phone ?? '-');
  const addressStr = String(order.customer_address ?? '-');
  const totalNum = Number((order.total_amount ?? 0) as unknown as number);

  container.innerHTML = `
    <h2>Invoice</h2>
    <p>Order ID: ${idStr}</p>
    <p>Tanggal: ${createdDate.toLocaleString()}</p>
    <p>Nama: ${nameStr}</p>
    <p>Phone: ${phoneStr}</p>
    <p>Alamat: ${addressStr}</p>
    <p>Total: Rp ${totalNum.toLocaleString('id-ID')}</p>
  `;
  document.body.appendChild(container);
  // render
  const canvas = await html2canvas(container as HTMLElement, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`invoice_${order.id}.pdf`);
  document.body.removeChild(container);
}

// attach to window for runtime detection
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).generateInvoicePdf = generateInvoicePdf;
} catch (e) {
  // ignore in non-browser environments
}

export default generateInvoicePdf;
