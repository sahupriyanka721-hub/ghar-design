import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Send,
  Paperclip,
  CheckCheck,
  Star,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { getInteriorProjects, InteriorProject } from '../../data/interiorDesignerStore.js';

interface Message {
  id: string;
  sender: 'DESIGNER' | 'CLIENT';
  text: string;
  time: string;
}

export const InteriorDesignerClients: React.FC = () => {
  const projects = getInteriorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'prj-int-1');
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const [chatThreads, setChatThreads] = useState<Record<string, Message[]>>({
    'prj-int-1': [
      {
        id: '1',
        sender: 'CLIENT',
        text: 'Hi Ar. Pooja, we loved the living room 3D render! Can we check the walnut finish in person?',
        time: 'Yesterday 14:30',
      },
      {
        id: '2',
        sender: 'DESIGNER',
        text: 'Hello Vivek! Yes absolutely. We will bring the physical Turakhia smoked walnut veneer sample on Saturday visit.',
        time: 'Yesterday 14:45',
      },
      {
        id: '3',
        sender: 'CLIENT',
        text: 'Great, see you on Saturday 11 AM.',
        time: 'Yesterday 15:00',
      },
    ],
    'prj-int-2': [
      {
        id: '1',
        sender: 'CLIENT',
        text: 'Good morning Pooja, has the 2D electrical layout been finalized?',
        time: 'Today 10:15',
      },
      {
        id: '2',
        sender: 'DESIGNER',
        text: 'Yes Anandita, 2D electrical drawing v1.4 is uploaded to your Design Center approvals tab.',
        time: 'Today 10:30',
      },
    ],
  });

  const [inputText, setInputText] = useState('');

  const currentMessages = selectedProject ? chatThreads[selectedProject.id] || [] : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedProject) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'DESIGNER',
      text: inputText.trim(),
      time: 'Just now',
    };

    setChatThreads((prev) => ({
      ...prev,
      [selectedProject.id]: [...(prev[selectedProject.id] || []), newMsg],
    }));

    setInputText('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Client Communications & Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Client Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time project chats, quotation coordination, and consultation history with homeowners.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>BuildGhar Verified Homeowners</span>
        </div>
      </div>

      {/* Two Column Layout: Client List & Chat Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left: Client Directory */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-black uppercase text-slate-400 px-2 py-1 mb-2">
              Active Client Projects ({projects.length})
            </div>

            <div className="space-y-2">
              {projects.map((proj) => {
                const isSelected = selectedProjectId === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition border ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-slate-900 text-sm">
                        {proj.customerName}
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-800">
                        {proj.projectId}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-1 truncate">
                      {proj.title}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-mono">
                      <span>{proj.location.split(',')[0]}</span>
                      <span className="text-emerald-700 font-bold">
                        ₹{(proj.totalContractValue / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-navy-950 mt-4">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Dedicated Coordinator Support</span>
            </div>
            Homeowners receive instant in-app alerts and SMS updates when you send a message.
          </div>
        </div>

        {/* Right: Active Chat Conversation */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {selectedProject ? (
            <>
              {/* Chat Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-2xs">
                    {selectedProject.customerName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {selectedProject.customerName}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                      <span>+91 {selectedProject.customerPhone}</span>
                      <span>•</span>
                      <span>{selectedProject.title}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase">
                    Stage: {selectedProject.currentStage.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[380px] bg-slate-50/30">
                {currentMessages.map((msg) => {
                  const isMe = msg.sender === 'DESIGNER';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md p-4 rounded-2xl text-xs shadow-2xs ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <div
                          className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                            isMe ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.time}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-blue-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/50 text-xs">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick Replies:</span>
                {[
                  'Shared 3D render revision',
                  'Site visit scheduled for 11 AM',
                  'Requesting milestone approval',
                  'Veneer samples ready for review',
                ].map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(qr)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 text-[11px] shrink-0 font-medium transition"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message or project update to client..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a project from the left to start communication.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
