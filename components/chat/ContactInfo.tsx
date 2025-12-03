// @ts-nocheck
import React from 'react';
import { Lead } from '../../types';
import { User, Phone, MapPin, BrainCircuit, Calendar, X, Tag, FileText } from 'lucide-react';

interface ContactInfoProps {
    lead?: Lead;
    onClose: () => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ lead, onClose }) => {
    if (!lead) return null;

    return (
        <div className="w-80 h-full flex flex-col bg-[#09090b] border-l border-zinc-900 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Contact Info</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0 space-y-8">
                {/* Profile Section */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-bold text-3xl mb-4">
                        {lead.avatar_url ? (
                            <img src={lead.avatar_url} alt={lead.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <span>{lead.business?.charAt(0) || lead.name?.charAt(0) || '?'}</span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-zinc-100 mb-1">{lead.business || lead.name}</h2>
                    <p className="text-sm text-zinc-500 font-mono">{lead.phone}</p>
                </div>

                {/* AI Score Card - Minimalist */}
                <div className="bg-zinc-900/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lead Score</span>
                        <BrainCircuit size={14} className="text-bronze-500" />
                    </div>
                    <div className="flex items-end gap-2 mb-3">
                        <span className="text-3xl font-bold text-zinc-100">{lead.score}</span>
                        <span className="text-sm text-zinc-600 mb-1">/ 100</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-bronze-500 rounded-full"
                            style={{ width: `${lead.score}%` }}
                        ></div>
                    </div>
                </div>

                {/* Details List */}
                <div className="space-y-6">
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <User size={16} className="text-zinc-600 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Contact Name</p>
                                <p className="text-sm font-medium text-zinc-200">{lead.name || 'Unknown'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <Phone size={16} className="text-zinc-600 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Phone</p>
                                <p className="text-sm font-medium text-zinc-200 font-mono">{lead.phone}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <MapPin size={16} className="text-zinc-600 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Location</p>
                                <p className="text-sm font-medium text-zinc-200">{lead.city || 'Unknown'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <Calendar size={16} className="text-zinc-600 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Last Interaction</p>
                                <p className="text-sm font-medium text-zinc-200">{lead.last_interaction}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-900"></div>

                    {/* Status Tags */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Tag size={14} className="text-zinc-600" />
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Tags</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${lead.stage === 'Won' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                lead.stage === 'Lost' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                {lead.stage}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${lead.temperature === 'Hot' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                lead.temperature === 'Warm' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}>
                                {lead.temperature}
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-900"></div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText size={14} className="text-zinc-600" />
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Notes</p>
                            </div>
                            <button className="text-[10px] font-bold text-bronze-500 hover:text-bronze-400 transition-colors uppercase tracking-wide">Edit</button>
                        </div>
                        <div className="bg-zinc-900/30 rounded-lg p-3">
                            <p className="text-xs text-zinc-400 leading-relaxed italic">
                                {lead.notes || "No notes added yet."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
