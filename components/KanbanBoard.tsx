import React, { useState } from 'react';
import { Lead, Stage } from '../types';
import { MessageCircle, DollarSign, Calendar, MoreHorizontal } from 'lucide-react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface KanbanBoardProps {
    leads: Lead[];
    onLeadUpdate: (leadId: string, newStage: Stage) => void;
    onOpenChat: (lead: Lead) => void;
}

const STAGES: Stage[] = ['New', 'Contacted', 'In Negotiation', 'Won', 'Lost'];

const LeadCard = ({ lead, onOpenChat, isOverlay = false }: { lead: Lead, onOpenChat: (lead: Lead) => void, isOverlay?: boolean }) => (
    <div
        className={`bg-[#0B0B0B] border border-white/5 rounded-lg p-4 shadow-lg group ${isOverlay ? 'cursor-grabbing border-white/20 shadow-2xl scale-105' : 'cursor-grab hover:border-white/10'}`}
    >
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-white/5">
                    {lead.name.charAt(0)}
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-zinc-200 leading-tight">{lead.name}</h4>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[120px]">{lead.business}</p>
                </div>
            </div>
            <button className="text-zinc-600 hover:text-zinc-300 transition-colors">
                <MoreHorizontal size={14} />
            </button>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
            <div className="flex items-center gap-1">
                <DollarSign size={12} className="text-zinc-600" />
                <span className="font-mono text-zinc-400">{lead.budget.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
                <Calendar size={12} className="text-zinc-600" />
                <span>{lead.last_interaction}</span>
            </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${lead.temperature === 'Hot' ? 'bg-red-500/10 text-red-500' :
                lead.temperature === 'Warm' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-blue-500/10 text-blue-500'
                }`}>
                {lead.temperature}
            </span>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenChat(lead);
                }}
                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-bronze-400 transition-colors"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking chat
            >
                <MessageCircle size={14} />
            </button>
        </div>
    </div>
);

const DraggableLead = ({ lead, onOpenChat }: { lead: Lead, onOpenChat: (lead: Lead) => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: { lead }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
            <LeadCard lead={lead} onOpenChat={onOpenChat} />
        </div>
    );
};

const DroppableColumn = ({ stage, leads, onOpenChat }: { stage: Stage, leads: Lead[], onOpenChat: (lead: Lead) => void }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: stage,
    });

    const stageColors: Record<string, string> = {
        'New': 'border-blue-500/20 bg-blue-500/5',
        'Contacted': 'border-yellow-500/20 bg-yellow-500/5',
        'In Negotiation': 'border-purple-500/20 bg-purple-500/5',
        'Won': 'border-emerald-500/20 bg-emerald-500/5',
        'Lost': 'border-red-500/20 bg-red-500/5',
    };

    const titleColors: Record<string, string> = {
        'New': 'text-blue-400',
        'Contacted': 'text-yellow-400',
        'In Negotiation': 'text-purple-400',
        'Won': 'text-emerald-400',
        'Lost': 'text-red-400',
    };

    return (
        <div
            ref={setNodeRef}
            className={`flex-shrink-0 w-80 flex flex-col h-full rounded-xl border transition-colors overflow-hidden ${isOver ? 'bg-white/5 border-white/20' : 'bg-zinc-900/30 border-white/5'}`}
        >
            {/* Column Header */}
            <div className={`p-4 border-b border-white/5 flex items-center justify-between ${stageColors[stage]}`}>
                <h3 className={`font-bold text-sm uppercase tracking-wider ${titleColors[stage]}`}>{stage}</h3>
                <span className="text-xs font-mono text-zinc-500 bg-black/20 px-2 py-1 rounded-md">{leads.length}</span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {leads.map(lead => (
                    <DraggableLead key={lead.id} lead={lead} onOpenChat={onOpenChat} />
                ))}
            </div>
        </div>
    );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onLeadUpdate, onOpenChat }) => {
    const [activeLead, setActiveLead] = useState<Lead | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.lead) {
            setActiveLead(event.active.data.current.lead);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Check if dropped on a column (stage)
            const newStage = over.id as Stage;
            // Verify if it's a valid stage (it should be, as we only made columns droppable)
            if (STAGES.includes(newStage)) {
                onLeadUpdate(active.id as string, newStage);
            }
        }
        setActiveLead(null);
    };

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4 px-4">
                {STAGES.map(stage => (
                    <DroppableColumn
                        key={stage}
                        stage={stage}
                        leads={leads.filter(l => l.stage === stage)}
                        onOpenChat={onOpenChat}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeLead ? <LeadCard lead={activeLead} onOpenChat={onOpenChat} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
};
