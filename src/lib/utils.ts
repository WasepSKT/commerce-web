import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Build a prefilled WhatsApp URL (wa.me) with a message.
 * phone should be in international format without + or spaces, e.g. '6281xxxx'
 */
export function buildWhatsAppUrl(phone: string, message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}
