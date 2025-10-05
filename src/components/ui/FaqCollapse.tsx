import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

export default function FaqCollapse({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between p-4 bg-muted/40 hover:bg-muted transition"
        aria-expanded={open}
        aria-controls={`faq-${item.id}`}
      >
        <span className="text-sm font-medium">{item.question}</span>
        <span className="ml-4">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>

      <div id={`faq-${item.id}`} className={`p-4 text-sm ${open ? 'block' : 'hidden'}`}>
        {item.answer}
      </div>
    </div>
  );
}
