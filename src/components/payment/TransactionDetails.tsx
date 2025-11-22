import React from 'react';

export default function TransactionDetails({
  orderId,
  transactionId,
  shippingCourier,
  paymentMethod,
  displayAmount,
}: {
  orderId?: string;
  transactionId?: string;
  shippingCourier?: string;
  paymentMethod?: string;
  displayAmount?: number;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
      {orderId && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Order ID</span>
          <span className="text-sm font-semibold text-gray-900">{orderId}</span>
        </div>
      )}
      {transactionId && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Transaction ID</span>
          <span className="text-sm font-semibold text-gray-900">{transactionId}</span>
        </div>
      )}
      {shippingCourier && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Kurir</span>
          <span className="text-sm font-semibold text-gray-900">{shippingCourier}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Metode Pembayaran</span>
        <span className="text-sm font-semibold text-gray-900">{paymentMethod}</span>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-600">Total Pembayaran</span>
        <span className="text-lg font-bold text-primary">Rp {(displayAmount || 0).toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
}
