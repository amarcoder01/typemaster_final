import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  faqs: FAQItem[];
  title?: string;
  className?: string;
}

export function FaqSection({ faqs, title = "Frequently Asked Questions", className }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) return null;

  return (
    <section className={cn("mb-12", className)}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <HelpCircle className="w-6 h-6 text-primary" />
        {title}
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="border border-border/50 rounded-lg overflow-hidden bg-card/30"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-card/50 transition-colors"
            >
              <span className="font-medium pr-4">{faq.question}</span>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200",
                openIndex === index && "rotate-180"
              )} />
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed border-t border-border/30 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// Generate FAQPage structured data for use with useSEO
export function getFaqStructuredData(faqs: FAQItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

