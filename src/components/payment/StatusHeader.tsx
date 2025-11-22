import React from 'react';

interface Props {
  Icon: React.ComponentType<any>;
  bgColor: string;
  color: string;
  title: string;
  description?: string;
}

export default function StatusHeader({ Icon, bgColor, color, title, description }: Props) {
  return (
    <div className="flex flex-col items-center mb-6 text-center">
      <div className={`${bgColor} rounded-full p-6 mb-4`}>
        <Icon className={`h-16 w-16 ${color}`} strokeWidth={2} />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">{title}</h1>
        {description && <p className="text-gray-600 text-sm sm:text-base">{description}</p>}
      </div>
    </div>
  );
}
