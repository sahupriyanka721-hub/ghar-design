import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';

export const Contact: React.FC = () => {
  const { success } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    subject: 'Customer Inquiry',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    success('Thank you! Your message has been received. Our team will contact you within 24 hours.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-xs font-bold uppercase tracking-widest text-gold-600">Get in Touch</h1>
        <h2 className="text-3xl font-bold font-display text-navy-950">We are Here to Assist Your Build</h2>
        <p className="text-slate-600 text-sm">
          Have questions about posting a request, quotation vetting, or joining as an accredited professional?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 space-y-6 bg-navy-950 text-white">
            <h3 className="text-xl font-bold font-display">Contact Information</h3>
            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">GharDesign Corporate Office</div>
                  <div className="text-slate-400">Cyber City, DLF Phase 2, Gurugram, Haryana - 122002</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Toll-Free Helpline</div>
                  <div className="text-slate-400">1800-GHAR-DSG (Mon - Sat, 9:30 AM - 6:30 PM)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Official Email</div>
                  <div className="text-slate-400">support@ghardesign.in</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-gold-50 border-gold-200 text-gold-900 text-xs space-y-2">
            <div className="font-bold">Associate Onboarding Notice:</div>
            <p className="text-[11px] leading-relaxed">
              Contractors and structural engineers seeking accreditation should provide their professional or IEI registration
              numbers in their inquiry message.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="card p-8">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-bold font-display text-navy-950">Message Sent Successfully!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  A GharDesign support manager has been notified and will call you on {formData.phone} shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      className="input-field"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-text">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      className="input-field"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder=""
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-text">City</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      className="input-field"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text">Subject</label>
                  <select
                    className="input-field"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="Customer Inquiry">Customer: Question about my project request</option>
                    <option value="Associate Application">Professional: Apply to join associate network</option>
                    <option value="Payment Inquiry">Billing & Payment assistance</option>
                    <option value="General Feedback">General Feedback / Grievance</option>
                  </select>
                </div>

                <div>
                  <label className="label-text">Message / Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about your query or plot requirements..."
                    className="input-field"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
