import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { getExecutionProjects } from '../../data/projectExecutionStore.js';
import {
  getArchitectChatMessages,
  sendArchitectChatMessage,
  ArchitectChatMessageItem,
  ChatChannel,
} from '../../data/architectPanelStore.js';

export const ArchitectMessages: React.FC = () => {
  const { user } = useAuth();
  const [projects] = useState(() => getExecutionProjects());
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'GENERAL');
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('CUSTOMER');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ArchitectChatMessageItem[]>([]);

  const reloadMessages = () => {
    setMessages(getArchitectChatMessages(selectedProjectId, activeChannel));
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
      senderName: user?.name || 'Accredited Architect',
      senderRole: 'Architect',
      message: inputText.trim(),
    });

    setInputText('');
    reloadMessages();
  };

  const selectedProj = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider font-mono">
                Section 9 & 13 Collaboration
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Multi-Channel Realtime Chat
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Project Communication & Multi-Stakeholder Collaboration
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 max-w-2xl mt-1 leading-relaxed">
              Direct, transparent messaging with Homeowners, Platform Admin, Civil Contractors, and Interior Designers for real-time design alignment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="text-slate-900">
                  {p.title || p.code}
                </option>
              ))}
              {projects.length === 0 && (
                <option value="GENERAL" className="text-slate-900">
                  General Consultation Channel
                </option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* Channel Selection Header */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'CUSTOMER', label: 'Homeowner', icon: User },
              { id: 'ADMIN', label: 'BuildGhar Admin', icon: ShieldCheck },
              { id: 'CONTRACTOR', label: 'Civil Contractor', icon: HardHat },
              { id: 'INTERIOR_DESIGNER', label: 'Interior Designer', icon: Compass },
            ].map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeChannel === ch.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Project: <span className="font-bold text-slate-800">{selectedProj?.title || selectedProjectId}</span>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m) => {
            const isMe = m.senderRole === 'Architect';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                  <span className="font-bold text-slate-600">{m.senderName}</span>
                  <span>•</span>
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm shadow-blue-600/20'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium">
                No messages yet on this channel for {selectedProj?.title || 'this project'}.
              </p>
              <p className="text-[11px] text-slate-400">
                Send a message to initiate project coordination.
              </p>
            </div>
          )}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${activeChannel.toLowerCase()} regarding drawings, revisions, or site schedule...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
