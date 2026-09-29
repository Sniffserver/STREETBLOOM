import React, { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { NPC, NPCResponse, InteractionChoice, InteractionCommand } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';
import { Send, Heart, Clock, Sparkles, MessageSquare, AlertCircle, Zap, Coins, Award, ShieldAlert, Check } from 'lucide-react';
import { getTranslation } from '../../locales/i18n';
import { soundManager } from '../../audio/soundManager';
import { generateInteractionChoices } from '../../services/npc/spawnService';

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
  sender: 'npc' | 'player' | 'system';
  text: string;
  timestamp: string;
}

export const NPCChatModal: React.FC<NPCChatModalProps> = ({ npc, onClose }) => {
  const {
    profile,
    streets,
    quests,
    settings,
    activeSpawn,
    currentDistrict,
    currentLocation,
    accuracyTier,
    recordNPCInteraction,
    startQuest,
    completeQuest,
    executeInteraction,
  } = useGameStore();

  const t = getTranslation(settings.language);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentScheduleSlot, setCurrentScheduleSlot] = useState(npc.schedule[0]);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'choices' | 'chat'>('choices');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Available structured choices for this character
  const choices: InteractionChoice[] = activeSpawn && activeSpawn.npcId === npc.id && activeSpawn.choices
    ? activeSpawn.choices
    : generateInteractionChoices(npc.id, activeSpawn?.spawnId || `spn-${npc.id}`);

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

  // Execute structured controlled command choice
  const handleExecuteChoice = async (choice: InteractionChoice) => {
    if (executingActionId) return;

    setExecutingActionId(choice.id);
    soundManager.playTap();

    const command: InteractionCommand = {
      interactionId: `int-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      spawnId: activeSpawn?.spawnId || `spn-${npc.id}`,
      actionId: choice.id,
      clientTime: new Date().toISOString(),
      locationEvidence: {
        areaId: currentDistrict,
        accuracyMeters: currentLocation.accuracy || 10,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
    };

    const res = await executeInteraction(command);
    setExecutingActionId(null);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append player action
    setMessages((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        sender: 'player',
        text: choice.title,
        timestamp: time,
      },
      {
        id: `npc-res-${Date.now()}`,
        sender: 'npc',
        text: res.message,
        timestamp: time,
      },
    ]);

    if (res.consequence) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: `⚠️ ${res.consequence}`,
          timestamp: time,
        },
      ]);
    }
  };

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
      <div className="w-full max-w-md h-[90vh] rounded-3xl game-glass-panel border border-amber-500/30 flex flex-col overflow-hidden shadow-2xl bg-[#12151a]">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#181d24] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-2xl shadow-md shrink-0">
              {npc.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{npc.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                  {relationshipLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{npc.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Schedule & Location Sub-bar */}
        <div className="px-3.5 py-1.5 bg-[#151920] border-b border-white/5 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{currentScheduleSlot.locationName}</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono shrink-0">
            {currentScheduleSlot.startHour}:00 - {currentScheduleSlot.endHour}:00
          </span>
        </div>

        {/* Navigation Tabs: Valikud (Choices) vs Vaba dialoog (Chat) */}
        <div className="grid grid-cols-2 bg-[#181d24] border-b border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('choices')}
            className={`py-2 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'choices'
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Valikud & Tehingud ({choices.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-purple-400 text-purple-300 bg-purple-400/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Vaba dialoog
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[88%] ${
                m.sender === 'player'
                  ? 'self-end items-end'
                  : m.sender === 'system'
                  ? 'self-center items-center w-full max-w-full'
                  : 'self-start items-start'
              }`}
            >
              {m.sender === 'system' ? (
                <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] text-center w-full">
                  {m.text}
                </div>
              ) : (
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'player'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-br-none shadow-md'
                      : 'bg-[#1b212a] text-slate-100 rounded-bl-none border border-white/5 shadow-md'
                  }`}
                >
                  {m.text}
                </div>
              )}
              {m.sender !== 'system' && (
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="self-start flex items-center gap-1.5 p-3 rounded-2xl bg-[#1b212a] rounded-bl-none border border-white/5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs text-slate-400">{npc.name} mõtleb...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Interaction Area */}
        {activeTab === 'choices' ? (
          <div className="p-3 bg-[#181d24] border-t border-white/10 flex flex-col gap-2 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Sinu käigud: <strong className="text-amber-400">{profile.actionTurns}/{profile.maxActionTurns}</strong></span>
              <span>Raha: <strong className="text-amber-400">{profile.cash} kr</strong></span>
            </div>

            {choices.map((choice) => {
              const canAffordTurns = profile.actionTurns >= choice.turnCost;
              const canAffordCash = !choice.cashCost || profile.cash >= choice.cashCost;
              const meetsSkill = !choice.requiredSkill || (profile.skills[choice.requiredSkill.skill] || 1) >= choice.requiredSkill.level;
              const isGigLimitReached = choice.category === 'risk_gig' && (profile.dailyRiskGigsPerformedToday || 0) >= (choice.dailyLimit || 3);
              const isEligible = canAffordTurns && canAffordCash && meetsSkill && !isGigLimitReached;

              return (
                <button
                  key={choice.id}
                  onClick={() => handleExecuteChoice(choice)}
                  disabled={!isEligible || executingActionId !== null}
                  className={`w-full p-2.5 rounded-2xl border text-left transition-all ${
                    isEligible
                      ? 'bg-[#13171e] border-amber-500/30 hover:border-amber-400 hover:bg-[#181f2a]'
                      : 'bg-[#12151a] border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white">{choice.title}</span>
                      {choice.category === 'small_job' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold">
                          Kindel töö
                        </span>
                      )}
                      {choice.category === 'trade' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-semibold">
                          Kauplemine
                        </span>
                      )}
                      {choice.category === 'risk_gig' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-semibold">
                          Riskantne ots ({profile.dailyRiskGigsPerformedToday || 0}/{choice.dailyLimit || 3} täna)
                        </span>
                      )}
                      {choice.category === 'story' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-semibold">
                          Lugu & kontakt
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold shrink-0">
                      ⚡ {choice.turnCost} {choice.turnCost === 1 ? 'käik' : 'käiku'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">{choice.description}</p>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                    {choice.cashCost ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                        <Coins className="w-3 h-3" /> Ettemaks -{choice.cashCost} kr
                      </span>
                    ) : null}
                    {choice.cashReward && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Coins className="w-3 h-3" /> Tasu +{choice.cashReward} kr
                      </span>
                    )}
                    {choice.failureLoss ? (
                      <span className="text-rose-300 font-semibold flex items-center gap-0.5">
                        Ebaõnnestumisel -{choice.failureLoss} kr trahv
                      </span>
                    ) : null}
                    {choice.reputationChange && (
                      <span className="text-purple-300 font-semibold flex items-center gap-0.5">
                        <Award className="w-3 h-3" /> +{choice.reputationChange} maine
                      </span>
                    )}
                    {choice.requiredSkill && (
                      <span className="text-cyan-300 font-semibold px-1 rounded bg-cyan-950/60 border border-cyan-500/30">
                        {choice.requiredSkill.skill} {choice.requiredSkill.level}
                      </span>
                    )}
                    {choice.riskPercent ? (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <ShieldAlert className="w-3 h-3" /> {choice.riskPercent}% risk
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-[#181d24] border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.npc.chatPrompt}
              className="flex-1 bg-[#12151a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputVal.trim() || isTyping}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

