import { useEffect } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQStructuredDataProps {
  faqs: FAQItem[];
}

const FAQStructuredData: React.FC<FAQStructuredDataProps> = ({ faqs }) => {
  useEffect(() => {
    if (faqs.length === 0) return;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    // Remove existing FAQ structured data
    const existingScript = document.querySelector('script[data-faq-structured-data]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new FAQ structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-faq-structured-data', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-faq-structured-data]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [faqs]);

  return null;
};

export default FAQStructuredData;

