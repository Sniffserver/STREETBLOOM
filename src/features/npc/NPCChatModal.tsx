import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { NPC, NPCResponse } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';
import { Send, Heart, Clock, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { soundManager } from '../../audio/soundManager';

const npcResponseValidationSchema = z.object({
  dialogue: z.string(),
  moodChange: z.number().int().min(-2).max(2).default(0),
  relationshipChange: z.number().int().min(-1).max(2).default(1),
  action: z.enum([
    'none',
    'startQuest',
    'completeQuest',
    'giveItem',
    'revealLocation',
    'triggerEvent',
  ]).default('none'),
  actionPayload: z.record(z.string(), z.unknown()).optional(),
  memoryToStore: z.string().optional(),
  extractedFacts: z.array(z.string()).optional(),
});

interface NPCChatModalProps {
  npc: NPC;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'npc' | 'player';
  text: string;
  timestamp: string;
}

export const NPCChatModal: React.FC<NPCChatModalProps> = ({ npc, onClose }) => {
  const {
    profile,
    streets,
    quests,
    settings,
    recordNPCInteraction,
    startQuest,
    completeQuest,
  } = useGameStore();

  const t = getTranslation(settings.language);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentScheduleSlot, setCurrentScheduleSlot] = useState(npc.schedule[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine current schedule slot
  useEffect(() => {
    const currentHour = new Date().getHours();
    const slot = npc.schedule.find(
      (s) => currentHour >= s.startHour && currentHour < s.endHour
    ) || npc.schedule[0];
    setCurrentScheduleSlot(slot);

    // Initial greeting
    setMessages([
      {
        id: 'msg-greet',
        sender: 'npc',
        text: npc.greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [npc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputVal.trim() || isTyping) return;

    const userText = inputVal.trim();
    setInputVal('');

    const newPlayerMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'player',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newPlayerMsg]);
    setIsTyping(true);
    soundManager.playTap();

    // Prepare derived semantic context for AI NPC
    const recentDiscoveredStreet = streets.filter((s) => s.discovered).slice(-1)[0]?.name || 'Viru tänav';
    const activeQuest = quests.find((q) => q.status === 'active' && q.giverNPCId === npc.id);

    try {
      const response = await fetch('/api/npc/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: npc.id,
          playerMessage: userText,
          context: {
            npc: {
              name: npc.name,
              occupation: npc.occupation,
              district: npc.district,
              personality: npc.personality,
              relationshipLevel: npc.relationshipLevel,
            },
            player: {
              name: profile.name,
              level: profile.level,
              relationshipLevel: npc.relationshipLevel,
            },
            location: {
              district: currentScheduleSlot.locationName,
              placeType: currentScheduleSlot.placeType,
            },
            recentDiscovery: {
              street: recentDiscoveredStreet,
            },
            memories: npc.memories.slice(0, 4),
            activeQuest: activeQuest ? { title: activeQuest.title, id: activeQuest.id } : null,
            language: settings.language,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Server response error');
      }

      const raw = await response.json();
      const data = npcResponseValidationSchema.parse(raw);

      setMessages((prev) => [
        ...prev,
        {
          id: `npc-${Date.now()}`,
          sender: 'npc',
          text: data.dialogue,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Apply validated action & relationship changes
      recordNPCInteraction(
        npc.id,
        data.relationshipChange || 1,
        data.memoryToStore || `Rääkis teemast: "${userText.slice(0, 30)}..."`,
        data.extractedFacts
      );

      if (data.action === 'startQuest' && data.actionPayload?.questId) {
        startQuest(String(data.actionPayload.questId));
      } else if (data.action === 'completeQuest' && data.actionPayload?.questId) {
        completeQuest(String(data.actionPayload.questId));
      }

      soundManager.playCompanionHappy();
    } catch {
      // Offline fallback: Use persistent character offline dialogue bank
      const fallbackList = npc.offlineFallbackDialogue;
      const fallbackText = fallbackList[Math.floor(Math.random() * fallbackList.length)];

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `npc-fallback-${Date.now()}`,
            sender: 'npc',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        recordNPCInteraction(npc.id, 1);
        setIsTyping(false);
      }, 600);
      return;
    } finally {
      setIsTyping(false);
    }
  };

  const relationshipLabel = t.npc.levels[npc.relationshipLevel] || 'Võõras';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <div className="w-full max-w-md h-[88vh] rounded-3xl game-glass-panel border border-purple-500/30 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-slate-900/90 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-md">
              {npc.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{npc.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold">
                  {relationshipLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{npc.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Schedule & Location Sub-bar */}
        <div className="px-3.5 py-1.5 bg-purple-950/30 border-b border-purple-500/10 flex items-center justify-between text-[11px] text-purple-200">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{currentScheduleSlot.locationName}</span>
          </div>
          <span className="text-[10px] text-purple-400 font-mono shrink-0">
            {currentScheduleSlot.startHour}:00 - {currentScheduleSlot.endHour}:00
          </span>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] ${
                m.sender === 'player' ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'player'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-white/5 shadow-md'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isTyping && (
            <div className="self-start flex items-center gap-1.5 p-3 rounded-2xl bg-slate-800/80 rounded-bl-none border border-white/5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span className="text-xs text-slate-400">{npc.name} mõtleb...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.npc.chatPrompt}
            className="flex-1 bg-slate-800/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputVal.trim() || isTyping}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
