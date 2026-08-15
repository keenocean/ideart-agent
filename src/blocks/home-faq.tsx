import { m } from '@/paraglide/messages.js';
import { CatalogFaq } from '@/components/catalog/catalog-marketing-sections';

export function HomeFAQ() {
  return (
    <CatalogFaq
      title={m['landing.faq.title']()}
      description={m['landing.faq.description']()}
      items={[
        { question: m['landing.faq.q_1'](), answer: m['landing.faq.a_1']() },
        { question: m['landing.faq.q_2'](), answer: m['landing.faq.a_2']() },
        { question: m['landing.faq.q_3'](), answer: m['landing.faq.a_3']() },
        { question: m['landing.faq.q_4'](), answer: m['landing.faq.a_4']() },
        { question: m['landing.faq.q_5'](), answer: m['landing.faq.a_5']() },
        { question: m['landing.faq.q_6'](), answer: m['landing.faq.a_6']() },
      ]}
    />
  );
}
