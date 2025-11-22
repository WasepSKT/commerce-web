import React from 'react';

type Order = {
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
};

export default function CustomerInfo({ order }: { order?: Order | null }) {
  if (!order) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
        <span className="h-4 w-4 inline-block" aria-hidden />
        Informasi Pelanggan
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Nama:</span>
          <span className="font-medium text-gray-900">{order.customer_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Telepon:</span>
          <span className="font-medium text-gray-900">{order.customer_phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Alamat Lengkap:</span>
          <span className="font-medium text-gray-900 break-words text-right">{order.customer_address}</span>
        </div>
      </div>
    </div>
  );
}
