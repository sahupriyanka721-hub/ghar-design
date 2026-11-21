import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Why does GharDesign charge a ₹499 quotation request fee?',
      a: 'Preparing a genuine construction or civil quotation requires a professional to calculate precise quantities, structural considerations, and local municipal bylaws. The nominal fee filters out non-serious inquiries and spam, guaranteeing that accredited contractors and engineers commit dedicated technical hours to your project.',
    },
    {
      q: 'Does GharDesign automatically pick the cheapest quotation?',
      a: 'Never. In civil engineering and construction, the cheapest estimate is almost always misleading and often leads to structural compromises (inferior cement grade, lighter gauge steel, inadequate curing, or hidden extra costs). We present itemized comparisons so you can evaluate experience, material grades, milestone terms, and inclusions transparently.',
    },
    {
      q: 'How are associate professionals selected and assigned to my request?',
      a: 'Once your request is submitted and the fee verified, our in-house engineering administrators inspect your property dimensions, city, and required scope. The request is assigned to 2 to 4 vetted professionals licensed to operate in your jurisdiction. Professionals cannot see other quotes.',
    },
    {
      q: 'What happens if assigned professionals do not respond before the deadline?',
      a: 'Our administrative team actively monitors assignment deadlines. If an associate is unresponsive, the administrator reassigns the project to another top-rated professional in our network or extends the collection window with your consent. If no suitable quote can be published, your request fee is eligible for refund.',
    },
    {
      q: 'Are professional quotations legally binding?',
      a: 'Published quotations remain valid until the expiration date explicitly stated in the quotation document (typically 15 to 30 days). Once you accept a quotation and confirm your booking, both parties agree to the itemized deliverables, milestone payment schedule, and terms outlined.',
    },
    {
      q: 'How are my payments protected?',
      a: 'All digital payments are processed through Razorpay with 256-bit encryption. Booking advance funds are tied to predefined milestone sign-offs, safeguarding both homeowner and contractor.',
    },
    {
      q: 'Can I request design revisions after receiving a quotation?',
      a: 'Every quotation explicitly discloses the number of included revisions (typically 2 to 3 iterations for 2D plans and 3D elevations). Extra revisions beyond the agreed allotment can be requested directly according to the professional’s stated revision schedule.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-xs font-bold uppercase tracking-widest text-gold-600">Got Questions?</h1>
        <h2 className="text-3xl font-bold font-display text-navy-950">Frequently Asked Questions</h2>
        <p className="text-slate-600 text-sm">
          Everything you need to know about the GharDesign marketplace model, quotation process, and guarantees.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="card overflow-hidden transition">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <span className="font-bold text-sm text-navy-950 font-display">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gold-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
