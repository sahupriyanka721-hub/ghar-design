import React from 'react';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display text-navy-950">Terms and Conditions</h1>
        <p className="text-xs text-slate-500">Effective Date: October 2026 • GharDesign Technologies India Pvt. Ltd.</p>
      </div>

      <div className="card p-8 space-y-6 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">1. Platform Nature and Role</h2>
          <p>
            GharDesign operates as an online technological intermediary connecting homeowners ("Customers") with accredited
            third-party engineering consultants, structural designers, and civil contractors ("Associate Professionals").
            GharDesign does not directly author engineering blueprints or perform manual construction labor unless specifically
            stipulated under a managed construction contract.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">2. Quotation Request Fee</h2>
          <p>
            Customers agree to pay a nominal quotation request fee (standard ₹499 inclusive of applicable taxes) upon submitting
            a detailed property inquiry. This fee covers administrative scope assessment, matching with vetted local professionals,
            and administrative quality review of received quotations before publishing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">3. Non-Cheapest Principle</h2>
          <p>
            The platform does not automate or recommend selections solely based on lowest quoted price. Homeowners are provided
            transparent itemized bills of quantities (BOQs), qualifications, and deliverable commitments to make informed judgments.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">4. Professional Accreditation</h2>
          <p>
            Associate professionals must hold valid credentials and licenses with relevant regulatory bodies. Structural engineers must hold
            chartered certification (IEI). In the event of fraudulent credential submission by any applicant, GharDesign terminates
            platform access immediately and reports the occurrence to relevant regulatory bodies.
          </p>
        </section>
      </div>
    </div>
  );
};

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display text-navy-950">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last updated: October 2026</p>
      </div>

      <div className="card p-8 space-y-6 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">1. Customer Data Protection</h2>
          <p>
            We respect your privacy. Unlike lead-generation websites, GharDesign does not broadcast or sell your personal mobile number
            to third-party telemarketers or material suppliers. Professionals assigned to your request receive anonymized plot dimensions
            and project requirements until a formal quotation is approved and selected.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">2. Information We Collect</h2>
          <p>
            We collect your phone number (verified via OTP), plot dimensions, city, locality, and property blueprints or photographs
            voluntarily uploaded by you to prepare quotations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">3. Storage & Encryption</h2>
          <p>
            All passwords, OTP tokens, and payment transactions are encrypted using industry-standard hashing algorithms (HMAC SHA-256)
            and SSL/TLS transport layer security.
          </p>
        </section>
      </div>
    </div>
  );
};

export const RefundPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display text-navy-950">Cancellation and Refund Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: October 2026</p>
      </div>

      <div className="card p-8 space-y-6 text-xs text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">1. Quotation Request Fee Refund</h2>
          <p>
            The ₹499 quotation request fee is fully refundable if GharDesign is unable to deliver at least two (2) verified,
            compliant quotations from associate professionals within 7 business days of request assignment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">2. Customer Request Cancellation</h2>
          <p>
            If a customer decides to cancel their project request before any professional has been assigned or has commenced work,
            a full refund of the fee can be claimed through our support desk. If professionals have already begun drafting BOQs,
            the fee is non-refundable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-navy-950">3. Service Booking Advance Refunds</h2>
          <p>
            Refunds on service advance payments depend strictly on the cancellation terms declared in the chosen professional's
            approved quotation document. GharDesign enforces milestone escrow protection to resolve legitimate disputes.
          </p>
        </section>
      </div>
    </div>
  );
};
