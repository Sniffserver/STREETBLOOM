import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  ShoppingBag,
  Swords,
  Shield,
  Footprints,
  Heart,
  Award,
  Sparkles,
  Zap,
  Target,
  Compass,
  Flame,
  Radio,
  Music,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import {
  SimulatedNPCInstance,
  CombatPlayerAction,
  CombatTurnResult,
} from '../../types/game';
import { getArchetypeDefinition } from '../../game/npc/NPCArchetypes';
import { FACTIONS, getStandingLabel } from '../../game/npc/NPCFaction';
import { NPCTrade } from '../../game/npc/NPCTrade';
import { NPCDialogueService } from '../../services/ai/npc/NPCDialogueService';
import { NPCQuestGenerator } from '../../game/quests/NPCQuestGenerator';
import { PriceEngine } from '../../game/trading/PriceEngine';
import { FICTIONAL_CONTRABAND_CATALOG } from '../../game/trading/ShopInventory';
import { soundManager } from '../../audio/soundManager';
import { gameEngine } from '../../game/engine/gameEngine';

interface SimulatedNPCModalProps {
  npc: SimulatedNPCInstance;
  onClose: () => void;
}

export const SimulatedNPCModal: React.FC<SimulatedNPCModalProps> = ({ npc, onClose }) => {
  const {
    profile,
    inventory,
    companion,
    worldTime,
    factionReputation,
    playerCombatHp,
    executeCombatTurn,
    executeNPCTrade,
    interactWithSimulatedNPC,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'talk' | 'trade' | 'combat'>('talk');
  const [currentDialogue, setCurrentDialogue] = useState<string>(() => {
    const def = getArchetypeDefinition(npc.archetype);
    return def.sampleDialogue[0] || 'Tere tulemast!';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [combatResult, setCombatResult] = useState<CombatTurnResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timing Bar State for Reaction Combat (Point 16)
  const [timingActive, setTimingActive] = useState(false);
  const [timingPos, setTimingPos] = useState(0); // 0 to 100
  const timingRef = useRef<number | null>(null);

  const def = getArchetypeDefinition(npc.archetype);
  const faction = FACTIONS[def.faction] || FACTIONS.LOCALS;
  const factionRep = factionReputation[def.faction] || 0;
  const factionStanding = getStandingLabel(factionRep);

  // Animate timing slider when in combat tab
  useEffect(() => {
    if (activeTab !== 'combat' || (combatResult && combatResult.isCombatOver)) {
      setTimingActive(false);
      return;
    }

    setTimingActive(true);
    let direction = 1;
    let current = 0;

    const interval = setInterval(() => {
      current += direction * 3.5;
      if (current >= 100) {
        current = 100;
        direction = -1;
      } else if (current <= 0) {
        current = 0;
        direction = 1;
      }
      setTimingPos(current);
    }, 25);

    return () => clearInterval(interval);
  }, [activeTab, combatResult]);

  const handleAction = async (actionLabel: string, actionCategory: 'TALK' | 'ASK' | 'LEAVE' | 'INTIMIDATE' | 'JOIN' | 'QUEST') => {
    soundManager.playTap();

    if (actionCategory === 'LEAVE') {
      interactWithSimulatedNPC(npc.id, 'LEAVE');
      onClose();
      return;
    }

    setIsGenerating(true);
    const aiResult = await NPCDialogueService.generateResponse({
      npc,
      worldTime,
      district: npc.district,
      relationshipPoints: 10,
      playerInput: actionLabel,
    });
    setIsGenerating(false);

    setCurrentDialogue(aiResult.dialogue);

    if (aiResult.suggestedAction === 'START_QUEST') {
      const quest = NPCQuestGenerator.createQuestFromNPC(
        npc,
        npc.district,
        aiResult.questTitleHint
      );
      useGameStore.getState().startQuest(quest.id);
      setToastMessage(`📜 Uus ülesanne loodud: "${quest.title}"`);
    }

    const res = interactWithSimulatedNPC(npc.id, actionCategory === 'ASK' ? 'ASK' : 'TALK');
    if (res.promoted && res.promotedNPC) {
      setToastMessage(`🎉 ${res.promotedNPC.name} sai sinu püsivaks sõbraks!`);
    }
  };

  const handleBuyItem = (itemId: string) => {
    soundManager.playTap();
    const res = executeNPCTrade(npc.id, itemId);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTimedAttack = () => {
    soundManager.playTap();
    // Timing precision: 50 is center. Distance from 50 (0 to 50)
    const distFromCenter = Math.abs(timingPos - 50);
    const precision = Math.max(0, 1 - distFromCenter / 50); // 1.0 = perfect center

    const res = executeCombatTurn(npc.id, 'attack');
    setCombatResult(res);
  };

  const handleCombatAction = (action: CombatPlayerAction) => {
    soundManager.playTap();
    const res = executeCombatTurn(npc.id, action);
    setCombatResult(res);
  };

  // Archetype-specific interaction actions (Point 15)
  const renderArchetypeActionButtons = () => {
    switch (npc.archetype) {
      case 'CIVILIAN':
      case 'TOURIST':
      case 'STUDENT':
        return (
          <>
            <button
              onClick={() => handleAction('Räägi ilmast ja linnast', 'TALK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <MessageSquare size={14} />
              Räägi tegelasega (+3 suhe)
            </button>
            <button
              onClick={() => handleAction('Küsi ümbruse ja saladuste kohta', 'ASK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-xs flex items-center justify-center gap-2 border border-gray-700 transition active:scale-95"
            >
              <Compass size={14} className="text-amber-400" />
              Uuri piirkonna kohta
            </button>
          </>
        );

      case 'WORKER':
      case 'NIGHT_WORKER':
        return (
          <>
            <button
              onClick={() => handleAction('Tere jõudu! Kuidas tööpäev läheb?', 'TALK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <MessageSquare size={14} />
              Tervita töömeest (+3 suhe)
            </button>
            <button
              onClick={() => handleAction('Kas tead otseteed või kohalikke objekte?', 'ASK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-xs flex items-center justify-center gap-2 border border-gray-700 transition active:scale-95"
            >
              <Compass size={14} className="text-amber-400" />
              Küsi teejuhatust
            </button>
          </>
        );

      case 'STREET_TOUGH':
      case 'SECURITY':
        return (
          <>
            <button
              onClick={() => handleAction('Rahune, ma lihtsalt jalutan siin.', 'TALK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <MessageSquare size={14} />
              Räägi rahulikult
            </button>
            <button
              onClick={() => handleAction('Vaata ette, ma tunnen kohalikke!', 'INTIMIDATE')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-bold text-xs flex items-center justify-center gap-2 border border-purple-600/40 transition active:scale-95"
            >
              <Flame size={14} className="text-purple-400" />
              Hirmuta / Kehtesta autoriteet
            </button>
            <button
              onClick={() => setActiveTab('combat')}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Swords size={14} />
              Võitle (Fight)
            </button>
          </>
        );

      case 'RAVER':
        return (
          <>
            <button
              onClick={() => handleAction('Mis biit siin mängib?', 'TALK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Music size={14} />
              Liitu rütmiga & vestle
            </button>
            <button
              onClick={() => handleAction('Kus järgmine reiv toimub?', 'ASK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 font-bold text-xs flex items-center justify-center gap-2 border border-indigo-600/40 transition active:scale-95"
            >
              <Radio size={14} className="text-indigo-400" />
              Uuri põrandaaluseid pidusid
            </button>
          </>
        );

      default:
        return (
          <>
            <button
              onClick={() => handleAction('Tere!', 'TALK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <MessageSquare size={14} />
              Vestle
            </button>
            <button
              onClick={() => handleAction('Räägi piirkonna saladustest', 'ASK')}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-xs flex items-center justify-center gap-2 border border-gray-700 transition active:scale-95"
            >
              <Zap size={14} className="text-amber-400" />
              Uuri saladusi
            </button>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#12161c] border border-amber-500/40 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header with Archetype & Faction Badge */}
        <div className="p-4 bg-gradient-to-r from-[#181d24] via-[#1a222d] to-[#181d24] border-b border-gray-800 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-gray-800/80 text-gray-300 hover:text-white hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
              {npc.avatar}
            </div>
            <div className="min-w-0 pr-8">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate">{npc.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {npc.distanceToPlayerMeters}m
                </span>
              </div>
              <p className="text-xs text-amber-200/80 truncate">{npc.title}</p>

              {/* Faction & Relationship indicator */}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                  style={{
                    backgroundColor: `${faction.color}20`,
                    color: faction.color,
                    borderColor: `${faction.color}50`,
                  }}
                >
                  <span>{faction.icon}</span>
                  <span>{faction.name.split(' ')[0]}</span>
                </span>
                <span className="text-[10px] text-gray-400">
                  Maine: <span className="text-emerald-400 font-medium">{factionStanding.label}</span>
                </span>
              </div>

              {/* Daily Goal & Routine Activity Badge */}
              {(() => {
                const routine = gameEngine.resolveNPCRoutine(npc.id);
                if (!routine) return null;
                return (
                  <div className="mt-2 p-1.5 rounded-lg bg-slate-900/90 border border-amber-500/30 text-[10px] text-slate-300">
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <span>🕒 Päeva eesmärk:</span> {routine.title}
                    </div>
                    <div className="text-[9px] text-slate-400">{routine.description}</div>
                    {routine.interruption !== 'NONE' && (
                      <div className="mt-1 text-[9px] font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        ⚡ {routine.interruptionText}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 pt-2 border-t border-gray-800/60">
            <button
              onClick={() => setActiveTab('talk')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'talk'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <MessageSquare size={14} />
              Suhtle
            </button>

            {def.tradeInventoryIds && def.tradeInventoryIds.length > 0 && (
              <button
                onClick={() => setActiveTab('trade')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'trade'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <ShoppingBag size={14} />
                Pood ({def.tradeInventoryIds.length})
              </button>
            )}

            {def.canInitiateCombat && (
              <button
                onClick={() => setActiveTab('combat')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'combat'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-800/80 text-red-400 hover:bg-gray-700'
                }`}
              >
                <Swords size={14} />
                Võitlus
              </button>
            )}
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-300 flex items-center gap-2 animate-pulse">
            <Sparkles size={14} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: TALK & DIALOGUE */}
          {activeTab === 'talk' && (
            <div className="space-y-4">
              <div className="bg-[#181e26] border border-gray-800 rounded-2xl p-3.5 relative">
                <div className="flex items-center justify-between mb-2 text-amber-400 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} />
                    <span>{npc.name} ütleb:</span>
                  </div>
                  {isGenerating && <span className="text-[10px] text-slate-400 animate-pulse">Mõtleb...</span>}
                </div>
                <p className="text-sm text-gray-200 leading-relaxed italic whitespace-pre-line">
                  "{currentDialogue}"
                </p>
              </div>

              {/* Archetype Action Buttons */}
              <div className="space-y-2 pt-1">
                {renderArchetypeActionButtons()}

                <button
                  onClick={() => handleAction('Lahku', 'LEAVE')}
                  className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-gray-800 text-gray-400 font-medium text-xs flex items-center justify-center gap-2 transition mt-2"
                >
                  <Footprints size={14} />
                  Jäta hüvasti ja lahku
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TRADE (Fictional Goods & Dynamic Pricing) */}
          {activeTab === 'trade' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span>
                  Sinu sularaha: <strong className="text-amber-400">{profile.cash} kr</strong>
                </span>
                <span>
                  Maine staatus: <strong className="text-emerald-400">{factionStanding.label}</strong>
                </span>
              </div>

              {def.tradeInventoryIds?.map((itemId) => {
                const item = FICTIONAL_CONTRABAND_CATALOG[itemId];
                if (!item) return null;
                const calc = NPCTrade.calculatePrice(itemId, npc, 1, factionRep);
                if (!calc) return null;

                const canAfford = profile.cash >= calc.finalPrice;

                return (
                  <div
                    key={itemId}
                    className="bg-[#181e26] border border-gray-800 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-gray-700 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 border border-gray-700">
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{item.description}</p>
                      <div className="flex items-center gap-2 text-[10px] mt-0.5">
                        <span className="text-amber-400 font-bold">{calc.finalPrice} kr</span>
                        {calc.discountPercent > 0 && (
                          <span className="text-gray-500 line-through">{calc.basePrice} kr</span>
                        )}
                        <span className="text-gray-500">Laos: {calc.stockCount} tk</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyItem(itemId)}
                      disabled={!canAfford || !calc.inStock}
                      className={`py-1.5 px-3 rounded-xl font-bold text-xs shrink-0 transition ${
                        !calc.inStock
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {!calc.inStock ? 'Otsas' : 'Osta'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: TIMING REACTION COMBAT MINI-GAME */}
          {activeTab === 'combat' && (
            <div className="space-y-4">
              {/* HP Bars */}
              <div className="bg-[#181e26] border border-red-950/60 rounded-2xl p-3.5 space-y-3">
                {/* NPC HP */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-red-300 flex items-center gap-1">
                      <span>{npc.avatar}</span> {npc.name}
                    </span>
                    <span className="text-gray-400 font-mono">
                      {npc.currentHp} / {npc.maxHp} HP
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{
                        width: `${Math.max(0, Math.min(100, (npc.currentHp / npc.maxHp) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Player HP */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Heart size={12} /> Sinu elud
                    </span>
                    <span className="text-gray-400 font-mono">
                      {playerCombatHp.current} / {playerCombatHp.max} HP
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${Math.max(0, Math.min(100, (playerCombatHp.current / playerCombatHp.max) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Reaction Timing Zone Meter */}
              {(!combatResult || !combatResult.isCombatOver) && (
                <div className="bg-[#14181f] border border-amber-500/30 rounded-2xl p-3 text-center space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold px-1">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Target size={13} /> Ajastuse tsoon (Timing Zone)
                    </span>
                    <span className="text-[10px] text-slate-400">Vajuta Ründa rohelises alas</span>
                  </div>

                  {/* Timing Track */}
                  <div className="relative w-full h-7 bg-slate-900 rounded-full overflow-hidden border border-white/10 flex items-center">
                    {/* Normal Hit Zone (40% to 60%) */}
                    <div className="absolute left-[38%] right-[38%] h-full bg-emerald-500/40 border-x border-emerald-400/60" />
                    {/* Critical Sweet Spot (46% to 54%) */}
                    <div className="absolute left-[46%] right-[46%] h-full bg-amber-400/80 flex items-center justify-center text-[9px] font-bold text-black">
                      CRIT
                    </div>

                    {/* Moving Needle */}
                    <div
                      className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-lg shadow-white/80 transition-all"
                      style={{ left: `calc(${timingPos}% - 5px)` }}
                    />
                  </div>
                </div>
              )}

              {/* Combat Result Log */}
              {combatResult && (
                <div className="bg-[#14181f] border border-gray-800 rounded-xl p-3 text-xs space-y-1 font-mono">
                  {combatResult.combatLog.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.includes('Võit')
                          ? 'text-emerald-400 font-bold'
                          : log.includes('otsa')
                          ? 'text-red-400 font-bold'
                          : 'text-gray-300'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {(!combatResult || !combatResult.isCombatOver) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleTimedAttack}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                  >
                    <Swords size={15} />
                    Ründa (Timed Strike)
                  </button>

                  <button
                    onClick={() => handleCombatAction('defend')}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                  >
                    <Shield size={15} />
                    Kaitse (Defend)
                  </button>

                  <button
                    onClick={() => handleAction('Räägi tegelasega rahulikult', 'TALK')}
                    className="py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400/40 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <MessageSquare size={14} />
                    Räägi (De-escalate)
                  </button>

                  <button
                    onClick={() => handleAction('Andsin 5 kr altkäemaksu', 'ASK')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    🪙 Altkäemaks (5 kr)
                  </button>

                  <button
                    onClick={() => handleCombatAction('item')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                  >
                    <Heart size={14} />
                    Ravi (+15 HP)
                  </button>

                  <button
                    onClick={() => handleCombatAction('run')}
                    className="py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-700 active:scale-95 transition"
                  >
                    <Footprints size={14} />
                    Põgene (Run)
                  </button>
                </div>
              )}

              {combatResult && combatResult.isCombatOver && (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-lg transition"
                >
                  Sulge võitlusaken
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
