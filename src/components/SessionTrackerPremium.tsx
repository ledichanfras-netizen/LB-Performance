import React, { FC, useState, useEffect, useMemo, useRef } from "react";
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, Zap, 
  Settings, Check, AlertCircle, ChevronRight, MessageSquare, 
  Smile, Dumbbell, Clock, Timer, Sparkles, Flame, ShieldAlert,
  Sliders, ArrowRight, ArrowLeft, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { Workout, PrescribedExercise, ExerciseSet } from "../types";

// TTS Voice announcer
const speakText = (text: string, enabled: boolean) => {
  if (!enabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // Stop current speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 1.1; // slightly faster for premium athletic pacing
  window.speechSynthesis.speak(utterance);
};

// Gamified motivational quotes
const MOTIVATIONAL_QUOTES = [
  "Excelente! Fibra por fibra, construindo um monstro.",
  "Foco total! Cada série te aproxima do nível Elite.",
  "Sólido! Sua consistência é sua maior vantagem.",
  "Fantástico! Mantenha a velocidade e técnica perfeitas.",
  "Que potência! Biofeedback total no controle.",
  "Execução cirúrgica. Continue quebrando recordes pessoais!",
];

interface SessionTrackerPremiumProps {
  workout: Workout;
  onFinish: (w: Workout) => void;
  onCancel: () => void;
}

export const SessionTrackerPremium: FC<SessionTrackerPremiumProps> = ({
  workout,
  onFinish,
  onCancel
}) => {
  const [session, setSession] = useState<Workout>({
    ...workout,
    status: "in_progress",
    date: workout.date?.split("T")[0] || new Date().toISOString().split("T")[0],
    durationMinutes: workout.durationMinutes || 60,
    exercises: (Array.isArray(workout.exercises) ? workout.exercises : []).map(
      (ex) => ({
        ...ex,
        isSimpleEntry: ex.isSimpleEntry !== undefined ? ex.isSimpleEntry : true,
        painLevel: ex.painLevel || 0,
        performedSets:
          ex.performedSets && ex.performedSets.length > 0
            ? ex.performedSets
            : Array.from({ length: ex.sets || 3 }).map((_, i) => ({
                id: `s-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                reps: parseInt(ex.reps) || 10,
                weight: parseFloat(ex.weight) || 0,
                rpe: 0,
                isCompleted: false // New flag for state tracking
              })),
      }),
    ),
  });

  // UI state managers
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0); // in seconds
  
  // Rest Timer states
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [restDuration, setRestDuration] = useState(90); // default rest is 90s
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [overallRpe, setOverallRpe] = useState(7);
  const [showFinishModal, setShowFinishModal] = useState(false);
  
  // References
  const mainStopwatchRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active workout stats
  const activeEx = session.exercises[currentExerciseIndex];
  const nextEx = session.exercises[currentExerciseIndex + 1];

  // Initialize total stopwatch
  useEffect(() => {
    mainStopwatchRef.current = setInterval(() => {
      setTotalElapsedTime((prev) => prev + 1);
    }, 1000);

    // Initial voice greeting
    setTimeout(() => {
      speakText(`Iniciando treino de alta performance. ${workout.name}. Foco e força!`, isVoiceEnabled);
    }, 1000);

    return () => {
      if (mainStopwatchRef.current) clearInterval(mainStopwatchRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  // Rest Timer ticking logic
  useEffect(() => {
    if (isTimerActive && restSecondsRemaining > 0) {
      restTimerRef.current = setTimeout(() => {
        setRestSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (restSecondsRemaining === 0 && isTimerActive) {
      setIsTimerActive(false);
      speakText("Descanso finalizado. Próxima série!", isVoiceEnabled);
      toast.success("Descanso Concluído! Volte ao treino.", { icon: "💪" });
    }
  }, [restSecondsRemaining, isTimerActive]);

  // Format stopwatch string
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle voice settings
  const toggleVoice = () => {
    const nextState = !isVoiceEnabled;
    setIsVoiceEnabled(nextState);
    toast.success(nextState ? "Áudio Guia Ativado" : "Áudio Guia Silenciado", {
      icon: nextState ? "🔊" : "🔇",
    });
  };

  // Rest timer triggers
  const startRestTimer = (seconds: number) => {
    setRestDuration(seconds);
    setRestSecondsRemaining(seconds);
    setIsTimerActive(true);
    speakText(`Descanso iniciado. ${seconds} segundos de recuperação.`, isVoiceEnabled);
  };

  const stopRestTimer = () => {
    setIsTimerActive(false);
    if (restTimerRef.current) clearTimeout(restTimerRef.current);
  };

  const resetRestTimer = () => {
    setRestSecondsRemaining(restDuration);
    setIsTimerActive(true);
  };

  // Check off a set
  const toggleSetCompletion = (exId: string, setId: string) => {
    let justCompleted = false;
    let willBeAllCompleted = false;

    if (activeEx && activeEx.id === exId && activeEx.performedSets) {
      const targetSet = activeEx.performedSets.find((s) => s.id === setId);
      const isTargetCompletedBefore = targetSet ? (targetSet as any).isCompleted : false;
      const nextCompleted = !isTargetCompletedBefore;
      if (nextCompleted) {
        justCompleted = true;
      }
      
      const allOthersCompleted = activeEx.performedSets
        .filter((s) => s.id !== setId)
        .every((s) => (s as any).isCompleted);
      
      if (allOthersCompleted && nextCompleted) {
        willBeAllCompleted = true;
      }
    }

    setSession((prev) => {
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        
        const updatedSets = (ex.performedSets || []).map((set) => {
          if (set.id === setId) {
            return { ...set, isCompleted: !((set as any).isCompleted) };
          }
          return set;
        });

        return { ...ex, performedSets: updatedSets };
      });

      return { ...prev, exercises: updatedExercises };
    });

    if (justCompleted) {
      // Trigger dynamic motivation toast
      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      toast.success(randomQuote, {
        icon: "⚡",
        duration: 3000
      });

      // Parse configured rest time or fallback to 90s
      const restValue = activeEx?.rest || "90s";
      const secondsMatch = restValue.match(/\d+/);
      const restSecs = secondsMatch ? parseInt(secondsMatch[0]) : 90;

      // Auto start rest timer! Excellent usability UX
      startRestTimer(restSecs);

      // Auto-switching to next exercise if all are completed
      if (willBeAllCompleted) {
        const nextIndex = currentExerciseIndex + 1;
        if (nextIndex < session.exercises.length) {
          setTimeout(() => {
            navigateToExercise(nextIndex);
            toast.success(`Avançando para o próximo exercício: ${session.exercises[nextIndex].name}!`, { icon: "➡️" });
          }, 1500);
        } else {
          setTimeout(() => {
            setShowFinishModal(true);
            toast.success("Todos os exercícios concluídos! Defina sua percepção de esforço (PSE) para finalizar. 🏆", { duration: 5000 });
          }, 1500);
        }
      }
    }
  };

  // Set-level data modifiers
  const updateSetField = (exId: string, setId: string, field: keyof ExerciseSet | "isCompleted", value: any) => {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          performedSets: (ex.performedSets || []).map((s) =>
            s.id === setId ? { ...s, [field]: value } : s
          ),
        };
      }),
    }));
  };

  const adjustSetField = (exId: string, setId: string, field: "weight" | "reps" | "rpe", amount: number) => {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          performedSets: (ex.performedSets || []).map((s) => {
            if (s.id !== setId) return s;
            const current = Number(s[field]) || 0;
            const newVal = Math.max(0, current + amount);
            return { ...s, [field]: newVal };
          }),
        };
      }),
    }));
  };

  // Toggle between single simple input mode or detailed list mode
  const toggleExInputMode = (exId: string) => {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId ? { ...ex, isSimpleEntry: !ex.isSimpleEntry } : ex
      ),
    }));
  };

  const updatePainValue = (exId: string, pain: number) => {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId ? { ...ex, painLevel: pain } : ex
      ),
    }));
    if (pain > 4) {
      toast("Dica: Reduza a amplitude ou carga caso a dor passe de 4.", { icon: "⚠️" });
    }
  };

  // Voice announced transition to next exercise
  const navigateToExercise = (index: number) => {
    if (index < 0 || index >= session.exercises.length) return;
    setCurrentExerciseIndex(index);
    const targetEx = session.exercises[index];
    speakText(`Próximo exercício: ${targetEx.name}. Prescrito: ${targetEx.sets} séries de ${targetEx.reps} repetições.`, isVoiceEnabled);
  };

  const currentSetIndexForActiveEx = useMemo(() => {
    if (!activeEx || !activeEx.performedSets) return 0;
    const firstUncompletedIndex = activeEx.performedSets.findIndex((s: any) => !s.isCompleted);
    return firstUncompletedIndex === -1 ? activeEx.performedSets.length : firstUncompletedIndex;
  }, [activeEx]);

  // Completion calculation
  const totalSetsCount = useMemo(() => {
    return session.exercises.reduce((acc, ex) => acc + (ex.performedSets?.length || 0), 0);
  }, [session.exercises]);

  const completedSetsCount = useMemo(() => {
    return session.exercises.reduce(
      (acc, ex) => acc + (ex.performedSets || []).filter((s: any) => s.isCompleted).length,
      0
    );
  }, [session.exercises]);

  const progressPercent = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  // Finishing the entire session
  const triggerFinish = () => {
    if (completedSetsCount < totalSetsCount * 0.5) {
      const confirmFinish = window.confirm("Você concluiu menos da metade das séries planejadas. Deseja finalizar mesmo assim?");
      if (!confirmFinish) return;
    }

    speakText("Treino concluído com maestria. Parabéns pelo desempenho elite!", isVoiceEnabled);
    
    // Save state
    const elapsedMinutes = Math.max(1, Math.round(totalElapsedTime / 60));
    
    // Auto map values to match standard types
    const completedSession: Workout = {
      ...session,
      status: "completed",
      durationMinutes: elapsedMinutes,
      rpe: overallRpe,
      feedback: feedbackNotes || session.feedback || "Treino concluído com biofeedback de alta performance.",
      totalLoad: session.exercises.reduce((acc, ex) => {
        const setsVal = (ex.performedSets || []).reduce((accSets, s) => accSets + (s.weight * s.reps), 0);
        return acc + setsVal;
      }, 0)
    };

    onFinish(completedSession);
  };

  // Face indicator for RPE scale
  const getRpeEmojiAndInfo = (rpe: number) => {
    if (rpe <= 2) return { emoji: "🟢 😌", text: "Muito Leve / Recuperação" };
    if (rpe <= 4) return { emoji: "🟡 🙂", text: "Moderado / Confortável" };
    if (rpe <= 6) return { emoji: "🟠 😏", text: "Firme / Ritmo Esportivo" };
    if (rpe <= 8) return { emoji: "🔴 🥵", text: "Intenso / Sobrecarga Planejada" };
    return { emoji: "🔥 ☠️", text: "Esforço Máximo / RPE Limiar" };
  };

  const rpeDetails = getRpeEmojiAndInfo(overallRpe);

  return (
    <div className="w-full h-full md:max-w-6xl md:h-[97vh] bg-slate-950 md:border md:border-slate-900 md:rounded-[2.5rem] overflow-hidden shadow-2xl text-slate-100 p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 flex flex-col animate-in fade-in duration-300">
      
      {/* HUD HEADER PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">SESSÃO ELITE EM EXECUÇÃO</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase italic text-white tracking-tight mt-1">{workout.name}</h2>
        </div>

        {/* CLOCKS & TOGGLES */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2 bg-[#0c111d] px-4 py-2 rounded-xl border border-slate-900 shadow-md">
            <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="text-sm font-black text-white font-mono">{formatTime(totalElapsedTime)}</span>
          </div>

          <button
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl border transition-all ${
              isVoiceEnabled 
                ? "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30 shadow-lg shadow-[#39FF14]/5" 
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
            title="Ativar/Desativar áudio guia"
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              if (window.confirm("Deseja realmente sair e descartar o andamento deste treino?")) {
                onCancel();
              }
            }}
            className="p-2.5 bg-red-950/20 hover:bg-red-900 text-red-400 hover:text-white rounded-xl border border-red-900/30 transition-all cursor-pointer"
            title="Sair do Treino"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SESSION PROGRESSION TIMELINE */}
      <div className="space-y-1.5 shrink-0">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-wider px-1">
          <span>PROGRESSO DA SESSÃO</span>
          <span className="text-[#39FF14]">{completedSetsCount} DE {totalSetsCount} SÉRIES ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-950">
          <div 
            className="bg-gradient-to-r from-emerald-500 via-brand-primary to-cyan-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* DETAILED ACTIVE WORKOUT CARD */}
      <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar">
        {activeEx ? (
          <div className="space-y-6">
            
            {/* Exercise Card Header & Info */}
            <div className="p-6 bg-gradient-to-b from-[#0c111d] to-[#05080e] rounded-[2rem] border border-slate-900 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black bg-[#39FF14]/15 border border-[#39FF14]/25 text-[#39FF14] px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeEx.muscleGroup || "GERAL"}
                    </span>
                    {activeEx.performedSets && (
                      <span className="text-[10px] font-black bg-amber-500/15 border border-amber-500/25 text-amber-400 px-3 py-1 rounded-full uppercase tracking-wider">
                        ⚡ Série em execução: {currentSetIndexForActiveEx + 1 > activeEx.performedSets.length ? "Concluída ✨" : `Série ${currentSetIndexForActiveEx + 1} de ${activeEx.performedSets.length}`}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black uppercase italic text-white tracking-tight mt-2.5">
                    {activeEx.name}
                  </h3>
                  {activeEx.notes && (
                    <p className="text-xs text-slate-400 font-semibold mt-2.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 italic">
                      💡 {activeEx.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">PRESCRIÇÃO</span>
                  <span className="text-sm font-black text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-4 py-2 rounded-xl italic">
                    {activeEx.sets}x{activeEx.repsType === "time" ? `${activeEx.reps}s` : activeEx.reps} @ {activeEx.weight}
                  </span>
                </div>
              </div>

              {/* PAIN & DETAILS CONTROLLER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-900 relative z-10">
                <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-900/60">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">MODO DE PREENCHIMENTO</span>
                  <button
                    onClick={() => toggleExInputMode(activeEx.id)}
                    className="text-[10px] font-black uppercase tracking-wider text-[#39FF14] bg-[#39FF14]/10 hover:bg-[#39FF14]/20 px-3 py-1.5 rounded-lg transition-colors border border-brand-primary/20"
                  >
                    {activeEx.isSimpleEntry ? "Modo Detalhado 📊" : "Modo Simplificado ⚡"}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-900/60">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">DOR REATIVA (0-10)</span>
                  <select
                    value={activeEx.painLevel || 0}
                    onChange={(e) => updatePainValue(activeEx.id, parseInt(e.target.value))}
                    className={`text-xs font-black rounded-lg px-2.5 py-1.5 outline-none border transition-all ${
                      (activeEx.painLevel || 0) > 4 
                        ? "bg-red-950/40 border-red-500 text-red-500" 
                        : "bg-slate-950 border-slate-800 text-white"
                    }`}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                      <option key={v} value={v} className="bg-slate-900">{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* REST COUNTDOWN HUB */}
            <div className="p-4 bg-[#0c111d]/60 rounded-2xl border border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Timer className={`w-5 h-5 ${isTimerActive ? "animate-pulse" : ""}`} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">CRONÔMETRO DE DESCANSO</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Automático ao marcar série</p>
                </div>
              </div>

              {/* TIMER CONTROLS */}
              <div className="flex items-center gap-4">
                {isTimerActive ? (
                  <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-900 rounded-xl px-5 py-2">
                    <span className="text-lg font-black text-[#39FF14] font-mono leading-none animate-pulse">
                      {restSecondsRemaining}s
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={stopRestTimer} className="p-1 text-red-400 hover:text-red-300">
                        <Pause className="w-4 h-4" />
                      </button>
                      <button onClick={resetRestTimer} className="p-1 text-slate-400 hover:text-white">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {[60, 90, 120].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => startRestTimer(sec)}
                        className="text-[10px] font-black uppercase tracking-wider bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        +{sec}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SETS EXECUTION MANAGER */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">MÉTRICAS EXECUTADAS</h4>
              
              {activeEx.isSimpleEntry ? (
                // SIMPLE ENTRY FORM FOR EASY COACHING PRE-POPULATION
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0c111d] p-5 rounded-2xl border border-slate-900">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                    <label className="text-[9px] text-slate-500 uppercase font-black block tracking-widest text-center mb-1">REPETIÇÕES</label>
                    <div className="flex items-center justify-between">
                      <button onClick={() => adjustSetField(activeEx.id, activeEx.performedSets?.[0]?.id || "", "reps", -1)} className="text-slate-400 hover:text-white text-base font-bold px-3 py-1 bg-slate-900 rounded-lg">-</button>
                      <input
                        type="number"
                        value={activeEx.performedSets?.[0]?.reps || 0}
                        onChange={(e) => updateSetField(activeEx.id, activeEx.performedSets?.[0]?.id || "", "reps", parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 bg-transparent text-center font-black text-white text-base outline-none"
                      />
                      <button onClick={() => adjustSetField(activeEx.id, activeEx.performedSets?.[0]?.id || "", "reps", 1)} className="text-slate-400 hover:text-white text-base font-bold px-3 py-1 bg-slate-900 rounded-lg">+</button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                    <label className="text-[9px] text-slate-500 uppercase font-black block tracking-widest text-center mb-1">CARGA (KG)</label>
                    <div className="flex items-center justify-between">
                      <button onClick={() => adjustSetField(activeEx.id, activeEx.performedSets?.[0]?.id || "", "weight", -1)} className="text-slate-400 hover:text-white text-base font-bold px-3 py-1 bg-slate-900 rounded-lg">-</button>
                      <input
                        type="number"
                        value={activeEx.performedSets?.[0]?.weight || 0}
                        onChange={(e) => updateSetField(activeEx.id, activeEx.performedSets?.[0]?.id || "", "weight", parseFloat(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 bg-transparent text-center font-black text-white text-base outline-none"
                      />
                      <button onClick={() => adjustSetField(activeEx.id, activeEx.performedSets?.[0]?.id || "", "weight", 1)} className="text-slate-400 hover:text-white text-base font-bold px-3 py-1 bg-slate-900 rounded-lg">+</button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 flex flex-col justify-center">
                    <button
                      onClick={() => {
                        (activeEx.performedSets || []).forEach(set => {
                          updateSetField(activeEx.id, set.id, "isCompleted", true);
                        });
                        toast.success("Todas as séries marcadas como concluídas!");
                        
                        const restValue = activeEx?.rest || "90s";
                        const secondsMatch = restValue.match(/\d+/);
                        const restSecs = secondsMatch ? parseInt(secondsMatch[0]) : 90;
                        startRestTimer(restSecs);

                        const nextIndex = currentExerciseIndex + 1;
                        if (nextIndex < session.exercises.length) {
                          setTimeout(() => {
                            navigateToExercise(nextIndex);
                            toast.success(`Avançando para o próximo exercício: ${session.exercises[nextIndex].name}!`, { icon: "➡️" });
                          }, 1500);
                        } else {
                          setTimeout(() => {
                            setShowFinishModal(true);
                            toast.success("Todos os exercícios concluídos! Defina sua percepção de esforço (PSE) para finalizar. 🏆", { duration: 5000 });
                          }, 1500);
                        }
                      }}
                      className="w-full bg-[#39FF14] hover:bg-[#32e00f] text-slate-950 font-black text-xs uppercase py-3.5 px-4 rounded-xl tracking-wider transition-colors shadow-lg shadow-[#39FF14]/10"
                    >
                      CONCLUIR EXERCÍCIO ✅
                    </button>
                  </div>
                </div>
              ) : (
                // DETAILED ROW BY ROW SET RECORDING
                <div className="space-y-2">
                  {(activeEx.performedSets || []).map((set, index) => {
                    const isCompleted = (set as any).isCompleted;
                    return (
                      <div
                        key={set.id}
                        className={`grid grid-cols-12 gap-3 items-center p-3.5 rounded-xl border transition-all ${
                          isCompleted 
                            ? "bg-[#39FF14]/5 border-[#39FF14]/20 shadow-inner" 
                            : "bg-[#0c111d] border-slate-900"
                        }`}
                      >
                        {/* Checkbox button */}
                        <div className="col-span-2 flex items-center gap-3">
                          <button
                            onClick={() => toggleSetCompletion(activeEx.id, set.id)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              isCompleted 
                                ? "bg-[#39FF14] text-slate-950 border-[#39FF14] shadow-lg shadow-[#39FF14]/20" 
                                : "bg-slate-950 border border-slate-800 text-slate-600 hover:border-slate-500"
                            }`}
                          >
                            <Check className={`w-5 h-5 stroke-[3] transition-transform duration-200 ${isCompleted ? "scale-100" : "scale-0"}`} />
                          </button>
                          <span className={`text-sm font-black uppercase tracking-wider ${isCompleted ? "text-[#39FF14]" : "text-slate-400"}`}>
                            S{index + 1}
                          </span>
                        </div>

                        {/* Weight input */}
                        <div className="col-span-3 flex items-center gap-1.5">
                          <input
                            type="number"
                            value={set.weight || ""}
                            onChange={(e) => updateSetField(activeEx.id, set.id, "weight", parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-[#39FF14] rounded-xl py-3 px-2 text-center font-extrabold text-sm md:text-base text-white transition-all"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase">KG</span>
                        </div>

                        {/* Reps input */}
                        <div className="col-span-3 flex items-center gap-1.5">
                          <input
                            type="number"
                            value={set.reps || ""}
                            onChange={(e) => updateSetField(activeEx.id, set.id, "reps", parseInt(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-[#39FF14] rounded-xl py-3 px-2 text-center font-extrabold text-sm md:text-base text-white transition-all"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase">RPS</span>
                        </div>

                        {/* RPE input */}
                        <div className="col-span-4 flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase shrink-0">PSE</span>
                          <select
                            value={set.rpe || 0}
                            onChange={(e) => updateSetField(activeEx.id, set.id, "rpe", parseInt(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-[#39FF14] rounded-xl py-3 px-2 text-center font-extrabold text-sm md:text-base text-white transition-all"
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            Nenhum exercício carregado neste treino.
          </div>
        )}
      </div>

      {/* FOOTER NAVIGATION & COMPLETION HUB */}
      <div className="border-t border-slate-900 pt-5 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        
        {/* EXERCISES NAVIGATOR */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => navigateToExercise(currentExerciseIndex - 1)}
            disabled={currentExerciseIndex === 0}
            className="flex items-center gap-1 px-4 py-3 bg-[#0c111d] disabled:opacity-30 border border-slate-900 rounded-xl hover:text-white text-xs font-black uppercase tracking-wider transition-all disabled:pointer-events-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Anterior
          </button>

          <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
            {currentExerciseIndex + 1} / {session.exercises.length}
          </span>

          <button
            onClick={() => navigateToExercise(currentExerciseIndex + 1)}
            disabled={currentExerciseIndex === session.exercises.length - 1}
            className="flex items-center gap-1 px-4 py-3 bg-[#0c111d] disabled:opacity-30 border border-slate-900 rounded-xl hover:text-white text-xs font-black uppercase tracking-wider transition-all disabled:pointer-events-none cursor-pointer"
          >
            Próximo <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* FEEDBACK & OVERALL RPE INPUT EXPANSION PANEL */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          
          {/* Post-Workout Assessment Slider */}
          <div className="w-full sm:w-60 bg-[#0c111d] p-3 rounded-2xl border border-slate-900 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
              <span>RPE DA SESSÃO</span>
              <span className="text-amber-400">{overallRpe}/10 {rpeDetails.emoji}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={overallRpe}
              onChange={(e) => setOverallRpe(parseInt(e.target.value))}
              className="w-full accent-brand-primary"
            />
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider text-center block">
              {rpeDetails.text}
            </span>
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="w-full sm:w-auto px-8 py-4.5 bg-[#39FF14] hover:bg-[#32e00f] text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-[#39FF14]/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            FINALIZAR TREINO 🏆
          </button>

          <button
            onClick={onCancel}
            className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-wider px-3.5 py-2 cursor-pointer"
          >
            DESCARTAR
          </button>
        </div>

      </div>

      {/* FINISH/RPE VERIFICATION MODAL OVERLAY */}
      <AnimatePresence>
        {showFinishModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#0c111d] border border-slate-900 rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl relative space-y-6 text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                <div>
                  <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest block">ETAPA FINAL</span>
                  <h3 className="text-xl font-black uppercase italic text-white tracking-tight mt-0.5 font-sans">RESUMO & VALIDAÇÃO DE PSE</h3>
                </div>
                <button
                  onClick={() => setShowFinishModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PSE (RPE) SELECTOR */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                    PSE DA SESSÃO (Escala de Borg CR10)
                  </label>
                  <span className="text-sm font-black text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                    PSE {overallRpe} — {getRpeEmojiAndInfo(overallRpe).emoji}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold select-none leading-relaxed">
                  Classifique a intensidade geral deste treino considerando a percepção subjetiva do seu esforço:
                </p>

                {/* Big touch-friendly buttons for RPE 1-10 */}
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
                    const isSelected = overallRpe === v;
                    let colorClasses = "border-slate-800 hover:border-slate-500 text-slate-300";
                    if (isSelected) {
                      if (v <= 2) colorClasses = "bg-green-500/25 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                      else if (v <= 4) colorClasses = "bg-yellow-500/25 border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
                      else if (v <= 6) colorClasses = "bg-orange-500/25 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]";
                      else if (v <= 8) colorClasses = "bg-red-500/25 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
                      else colorClasses = "bg-purple-500/25 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] font-black";
                    }

                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setOverallRpe(v)}
                        className={`py-3 rounded-xl border text-sm font-black transition-all cursor-pointer ${colorClasses} hover:scale-[1.05]`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>

                <div className="text-center p-2.5 bg-slate-950/60 rounded-xl border border-slate-900/40 select-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {getRpeEmojiAndInfo(overallRpe).text}
                  </span>
                </div>
              </div>

              {/* FEEDBACK NOTES AREA */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  RELATO DE BIOFEEDBACK (OPCIONAL)
                </label>
                <textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full h-24 bg-slate-950 border border-slate-900 rounded-2xl p-3 text-xs text-white outline-none focus:border-[#39FF14] transition-all font-semibold resize-none"
                  placeholder="Ex: Senti um leve cansaço no posterior durante a 3ª série do agachamento. Prontidão excelente para o restante."
                />
              </div>

              {/* SAVE ACTION */}
              <div className="pt-4 border-t border-slate-900 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 py-3.5 border border-slate-800 hover:border-slate-500 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  VOLTAR AO TREINO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFinishModal(false);
                    triggerFinish();
                  }}
                  className="flex-[1.5] py-3.5 bg-[#39FF14] hover:bg-[#32e00f] text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-[#39FF14]/15 cursor-pointer text-center"
                >
                  ENVIAR E CONCLUIR 🏆
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
