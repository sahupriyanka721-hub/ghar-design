import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  HardHat,
  Compass,
  Paperclip,
  CheckCircle2,
  Clock,
  Filter,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { getExecutionProjects, ExecutionProject } from '../../data/projectExecutionStore.js';
import {
  getArchitectChatMessages,
  sendArchitectChatMessage,
  ArchitectChatMessageItem,
  ChatChannel,
} from '../../data/architectPanelStore.js';
import { formatDate } from '../../lib/utils.js';

export const ArchitectMessages: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeChannel: ChatChannel = useMemo(() => {
    if (tabParam === 'admin') return 'ADMIN';
    if (tabParam === 'consultants') return 'CONTRACTOR';
    return 'CUSTOMER';
  }, [tabParam]);

  const setActiveChannel = (ch: ChatChannel) => {
    const tabMap: Record<ChatChannel, string> = {
      CUSTOMER: 'customers',
      ADMIN: 'admin',
      CONTRACTOR: 'consultants',
      INTERIOR_DESIGNER: 'consultants',
    };
    setSearchParams({ tab: tabMap[ch] });
  };

  const [projects] = useState<ExecutionProject[]>(() => {
    const list = getExecutionProjects();
    if (list.length > 0) return list;
    return [
      {
        id: 'PRJ-2026-ARCH-01',
        requestCode: 'GHR-REQ-2026-0011',
        workOrderNumber: 'GHR-WO-2026-088',
        name: 'Modern Luxury Villa (G+2) - Super Corridor, Indore',
        customerName: 'Sharika Mishra',
        customerPhone: '+91 9876543210',
        propertyAddress: 'Plot 42, Super Corridor, Scheme 151, Indore, MP - 452005',
        city: 'Indore',
      } as any,
    ];
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'PRJ-2026-ARCH-01');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ArchitectChatMessageItem[]>([]);

  // Seed default chat messages if channel is empty
  const ensureChannelMessages = (pid: string, ch: ChatChannel): ArchitectChatMessageItem[] => {
    const existing = getArchitectChatMessages(pid, ch);
    if (existing.length > 0) return existing;

    const defaultMsgList: Record<ChatChannel, ArchitectChatMessageItem[]> = {
      CUSTOMER: [
        {
          id: 'msg-c1',
          projectId: pid,
          channel: 'CUSTOMER',
          senderId: 'CUST-01',
          senderName: 'Sharika Mishra',
          senderRole: 'Homeowner',
          message: 'Hello architect, we really liked the second revision of the floor plan. When can we expect the 3D elevation renders?',
          timestamp: '2026-11-20T10:30:00Z',
          read: true,
        },
        {
          id: 'msg-c2',
          projectId: pid,
          channel: 'CUSTOMER',
          senderId: 'ARCH-SELF',
          senderName: user?.name || 'Apex Architectural Studio',
          senderRole: 'Architect',
          message: 'Thank you Sharika! The 3D model texturing is 75% complete. We will upload the daylight and evening lighting views by tomorrow afternoon.',
          timestamp: '2026-11-20T11:15:00Z',
          read: true,
        },
      ],
      ADMIN: [
        {
          id: 'msg-a1',
          projectId: pid,
          channel: 'ADMIN',
          senderId: 'ADMIN-AUDIT',
          senderName: 'BuildGhar Verification Cell',
          senderRole: 'Compliance Desk',
          message: 'Architectural setback audit passed. Setback ratios conform to Indore Municipal Corporation Master Plan 2021.',
          timestamp: '2026-11-19T14:00:00Z',
          read: true,
        },
      ],
      CONTRACTOR: [
        {
          id: 'msg-k1',
          projectId: pid,
          channel: 'CONTRACTOR',
          senderId: 'CONT-RAJ',
          senderName: 'Rajesh Construction Works',
          senderRole: 'Lead Civil Contractor',
          message: 'Sir, we are preparing the column shuttering for footing C3 and C4. Please confirm the clear cover requirement.',
          timestamp: '2026-11-21T09:00:00Z',
          read: true,
        },
        {
          id: 'msg-k2',
          projectId: pid,
          channel: 'CONTRACTOR',
          senderId: 'ARCH-SELF',
          senderName: user?.name || 'Apex Architectural Studio',
          senderRole: 'Architect',
          message: 'Clear cover must strictly be 40mm for footings and 25mm for columns per IS 456 detailing sheet DSG-IND-03.',
          timestamp: '2026-11-21T09:20:00Z',
          read: true,
        },
      ],
      INTERIOR_DESIGNER: [],
    };

    const toSeed = defaultMsgList[ch] || [];
    toSeed.forEach((m) => sendArchitectChatMessage(m));
    return toSeed;
  };

  const reloadMessages = () => {
    const list = ensureChannelMessages(selectedProjectId, activeChannel);
    setMessages(list);
  };

  useEffect(() => {
    reloadMessages();
    window.addEventListener('storage', reloadMessages);
    return () => window.removeEventListener('storage', reloadMessages);
  }, [selectedProjectId, activeChannel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendArchitectChatMessage({
      projectId: selectedProjectId,
      channel: activeChannel,
      senderId: user?.phone || 'ARCH-AUTH',
      senderName: user?.name || 'Apex Architectural Studio',
      senderRole: 'Architect',
      message: inputText.trim(),
    });

    setInputText('');
    reloadMessages();
  };

  const selectedProj = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          PAGE HEADER & SECTION BADGE (Master Spec Section 9)
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
              <MessageSquare className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-navy-950">
                  9. Communication & Multi-Stakeholder Collaboration
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                  Direct Live Channels
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-channel coordination with Homeowner Clients, Admin Compliance Desk, and Site Contractors.
              </p>
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || (p as any).title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          SECTION 9 SUB-NAVIGATION CHANNELS (9.1 to 9.3)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveChannel('CUSTOMER')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeChannel === 'CUSTOMER'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>9.1 Customer Channel (Homeowner)</span>
          </button>

          <button
            onClick={() => setActiveChannel('ADMIN')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeChannel === 'ADMIN'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>9.2 Admin & Compliance Desk</span>
          </button>

          <button
            onClick={() => setActiveChannel('CONTRACTOR')}
            className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeChannel === 'CONTRACTOR'
                ? 'bg-blue-900 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>9.3 Contractor & Structural Consultant Desk</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CHAT ROOM DESK
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[560px]">
        {/* Chat Room Banner */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900">
              {activeChannel === 'CUSTOMER'
                ? `Homeowner Client: ${selectedProj?.customerName || 'Sharika Mishra'}`
                : activeChannel === 'ADMIN'
                ? 'BuildGhar Admin Quality & Legal Compliance Desk'
                : 'Lead Site Contractor & Structural IS 456 Consultant'}
            </span>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Project: {selectedProj?.name}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
            Encrypted Project Room
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50 text-xs">
          {messages.map((m) => {
            const isMe = m.senderRole === 'Architect';
            return (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-2xl p-4 space-y-1 ${
                  isMe
                    ? 'bg-blue-900 text-white ml-auto rounded-tr-none'
                    : 'bg-white rounded-tl-none border border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className={`font-bold ${isMe ? 'text-blue-200' : 'text-slate-900'}`}>
                    {m.senderName} ({m.senderRole})
                  </span>
                  <span className={`font-mono text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                    {formatDate(m.timestamp)}
                  </span>
                </div>
                <p className="leading-relaxed">{m.message}</p>
              </div>
            );
          })}
        </div>

        {/* Chat Composer */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            placeholder={`Message ${activeChannel.toLowerCase()} channel regarding design, drawings, or site queries...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden"
          />
          <button
            type="submit"
            className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
