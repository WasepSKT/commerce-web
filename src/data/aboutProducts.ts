import tunaImg from '@/assets/img/Tuna.webp';
import salmonImg from '@/assets/img/salmon.webp';
import oceanfishImg from '@/assets/img/oceanfish.webp';

export interface AboutProduct {
  id: string;
  title: string;
  price: number;
  benefits: string[];
  description: string;
  img: string;
}

export const aboutProducts: AboutProduct[] = [
  {
    id: 'tuna',
    title: 'TUNA',
    price: 25000,
    benefits: ['Protein tinggi', 'Mudah dicerna', 'Sumber vitamin & mineral'],
    description:
      'Produk ini terbuat dari tuna dan hasil sampingan ikan, dipadukan dengan bahan pembentuk gel, serta diperkaya dengan vitamin dan mineral esensial.',
    img: tunaImg,
  },
  {
    id: 'oceanfish',
    title: 'OCEAN FISH',
    price: 25000,
    benefits: ['Rasa laut alami', 'Suplemen energi', 'Cocok untuk sensitif'],
    description:
      'Kaya akan rasa laut yang lezat dan sumber protein berkualitas tinggi untuk kucing Anda. Formulanya ringan dan mudah dicerna, cocok untuk kucing dengan selera sensitif dan membantu menjaga energi harian.',
    img: oceanfishImg,
  },
  {
    id: 'salmon',
    title: 'SALMON',
    price: 25000,
    benefits: ['Omega-3 tinggi', 'Kulit & bulu sehat', 'Kualitas premium'],
    description:
      'Salmon premium dengan kandungan omega-3 yang tinggi untuk mendukung kesehatan kulit dan kilau bulu, serta meningkatkan fungsi jantung dan daya tahan tubuh.',
    img: salmonImg,
  },
];

