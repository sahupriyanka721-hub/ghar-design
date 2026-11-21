import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Users,
  Building2,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  Star,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  projectsAssigned: number;
}

interface VendorPartner {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  location: string;
  rating: number;
}

export const InteriorDesignerTeam: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([
    {
      id: 'tm-1',
      name: 'Rohan Verma',
      role: 'Senior 3D Visualizer & Render Specialist',
      phone: '9811223344',
      email: 'rohan@mehra-interiors.in',
      projectsAssigned: 3,
    },
    {
      id: 'tm-2',
      name: 'Kavita Joshi',
      role: 'Architectural Draftsman & CAD Lead',
      phone: '9822334455',
      email: 'kavita@mehra-interiors.in',
      projectsAssigned: 2,
    },
    {
      id: 'tm-3',
      name: 'Rakesh Kumar',
      role: 'Site Execution Engineer & Quality Auditor',
      phone: '9833445566',
      email: 'rakesh@mehra-interiors.in',
      projectsAssigned: 2,
    },
    {
      id: 'tm-4',
      name: 'Mohan Sharma',
      role: 'Master Carpentry & Modular Joinery Supervisor',
      phone: '9844556677',
      email: 'mohan@mehra-interiors.in',
      projectsAssigned: 2,
    },
  ]);

  const [vendors] = useState<VendorPartner[]>([
    {
      id: 'vnd-1',
      name: 'BuildGhar Certified Timber & Marine Ply Depot',
      category: 'IS:710 Marine BWP Plywood & Calibration',
      contactPerson: 'Harish Mittal',
      phone: '9811002233',
      location: 'Sohna Road Timber Market, Gurugram',
      rating: 4.9,
    },
    {
      id: 'vnd-2',
      name: 'Hafele & Blum Architectural Hardware Experience Center',
      category: 'Tandem Drawers, Concealed Hinges & Lift-Ups',
      contactPerson: 'Deepak Ahuja',
      phone: '9822113344',
      location: 'DLF Phase 1, Gurugram',
      rating: 4.95,
    },
    {
      id: 'vnd-3',
      name: 'Plus Light Tech & Architectural Channels',
      category: '48V DC Low-Voltage Magnetic Profile Lights',
      contactPerson: 'Sandeep Grover',
      phone: '9833224455',
      location: 'Bhagirath Palace, Delhi',
      rating: 4.8,
    },
    {
      id: 'vnd-4',
      name: 'Turakhia Natural Veneers & Fluted Louvers',
      category: 'Smoked Walnut & Oak Veneers',
      contactPerson: 'Nitin Turakhia',
      phone: '9844335566',
      location: 'Kirti Nagar Furniture Hub, Delhi',
      rating: 4.85,
    },
  ]);

  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const created: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName,
      role: newMemberRole,
      phone: newMemberPhone,
      email: `${newMemberName.toLowerCase().replace(/\s+/g, '')}@mehra-interiors.in`,
      projectsAssigned: 1,
    };
    setTeam([...team, created]);
    setIsAddTeamModalOpen(false);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>Team & Certified Vendors</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Team & Vendor Coordination
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your internal 3D visualizers, CAD draftsmen, site leads, and certified material depots.
          </p>
        </div>

        <button
          onClick={() => setIsAddTeamModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Internal Team Grid */}
      <div>
        <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Internal Team ({team.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-blue-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-black flex items-center justify-center text-sm mb-3">
                  {member.name[0]}
                </div>
                <div className="font-black text-sm text-slate-900">{member.name}</div>
                <div className="text-xs text-blue-700 font-semibold mt-0.5 leading-tight">
                  {member.role}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>+91 {member.phone}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-semibold">
                  Active Projects: {member.projectsAssigned}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Certified Vendor Partners Grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>BuildGhar Certified Material Suppliers & Depots ({vendors.length})</span>
          </h2>
          <div className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pre-negotiated Trade Discounts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-blue-300 transition flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-black uppercase">
                    {vendor.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{vendor.rating}</span>
                  </div>
                </div>

                <h4 className="text-sm font-black text-slate-900 mt-2">{vendor.name}</h4>
                <div className="text-xs text-slate-500 mt-1">{vendor.location}</div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Contact: {vendor.contactPerson}</span>
                <a
                  href={`tel:${vendor.phone}`}
                  className="font-mono font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>+91 {vendor.phone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddTeamModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-blue-800 font-black text-base">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span>Add Team Member</span>
                </div>
                <button
                  onClick={() => setIsAddTeamModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="98XXXXXXXX"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddTeamModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
