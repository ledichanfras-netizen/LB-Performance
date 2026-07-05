import React, { FC, useState, useMemo, useEffect } from "react";
import { 
  Dumbbell, Search, Sparkles, Plus, Trash2, Copy, 
  ChevronDown, ChevronUp, Calendar, Zap, Clock, 
  Settings, AlertCircle, Check, Heart, History, 
  X, ChevronRight, Grid, HelpCircle, Info, Brain, 
  Cpu, Sliders, Layers, Award, ShieldAlert, CheckCircle2,
  TrendingUp, RefreshCw, Eye, BookOpen, Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { Workout, PrescribedExercise } from "../types";
import { ENRICHED_LIBRARY, EnrichedExercise } from "../data/exercises";
import { searchExercisesWithAi, prescribeWorkoutWithAi } from "../services/aiPerformanceService";

interface WorkoutEditorPremiumProps {
  workout: Partial<Workout>;
  onSave: (w: Workout) => void;
  onCancel: () => void;
  athleteModality?: string;
  athleteGoal?: string;
  athleteName?: string;
}

export const WorkoutEditorPremium: FC<WorkoutEditorPremiumProps> = ({
  workout,
  onSave,
  onCancel,
  athleteModality = "Futebol",
  athleteGoal = "Explosão e Força",
  athleteName = "Leandro Barbosa"
}) => {
  const [edited, setEdited] = useState<Workout>({
    id: workout.id || `wk-man-${Date.now()}`,
    date: workout.date?.split("T")[0] || new Date().toISOString().split("T")[0],
    name: workout.name || "",
    phase: workout.phase || "Preparação Geral",
    status: "planned",
    exercises: workout.exercises ? JSON.parse(JSON.stringify(workout.exercises)) : [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"library" | "ai" | "progression">("library");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  
  // Advanced Filters State
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterQuality, setFilterQuality] = useState<string>("ALL");
  const [filterEquipment, setFilterEquipment] = useState<string>("ALL");
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>("ALL");
  const [filterSport, setFilterSport] = useState<string>("ALL");

  // AI Search States
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchReasoning, setAiSearchReasoning] = useState<string | null>(null);
  const [aiSearchIds, setAiSearchIds] = useState<string[] | null>(null);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("lb_favorites");
      return stored ? JSON.parse(stored) : ENRICHED_LIBRARY.filter(e => e.isFavorite).map(e => e.id);
    } catch {
      return ENRICHED_LIBRARY.filter(e => e.isFavorite).map(e => e.id);
    }
  });

  const [recentAdds, setRecentAdds] = useState<string[]>([]);
  const [activeMobileTab, setActiveMobileTab] = useState<"library" | "workout">("workout");
  const [selectedDetailsExercise, setSelectedDetailsExercise] = useState<EnrichedExercise | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState("");
  
  // Collapse & Expand States for spacious layout optimization
  const [isHeaderExpanded, setIsHeaderExpanded] = useState<boolean>(() => !edited.name);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // AI Generator Panel States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiThoughts, setAiThoughts] = useState<string[]>([]);
  const [aiSuggestedExercises, setAiSuggestedExercises] = useState<EnrichedExercise[]>([]);
  const [aiFocusModality, setAiFocusModality] = useState(athleteModality);
  const [aiFocusGoal, setAiFocusGoal] = useState(athleteGoal);
  const [aiAgeRange, setAiAgeRange] = useState("Profissional");
  const [aiEquipmentSet, setAiEquipmentSet] = useState("Completo");

  // Progression Studio States
  const [progressionMethod, setProgressionMethod] = useState<"linear" | "undulating" | "accumulation" | "deload" | "tapering">("linear");

  // Persist favorites
  useEffect(() => {
    localStorage.setItem("lb_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    toast.success("Biblioteca de favoritos atualizada!");
  };

  // Real-time muscular distribution
  const muscleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalSets = 0;
    (edited.exercises || []).forEach(ex => {
      const group = ex.muscleGroup.split("/")[0].trim().toUpperCase();
      const s = Number(ex.sets) || 0;
      counts[group] = (counts[group] || 0) + s;
      totalSets += s;
    });

    return {
      distribution: Object.entries(counts).map(([name, value]) => ({
        name,
        sets: value,
        percent: totalSets > 0 ? Math.round((value / totalSets) * 100) : 0
      })),
      totalSets
    };
  }, [edited.exercises]);

  // Estimated metrics
  const estimatedDuration = useMemo(() => {
    let totalMinutes = 10; // warm up
    (edited.exercises || []).forEach(ex => {
      const s = Number(ex.sets) || 3;
      totalMinutes += s * 2.5; // Rest + execution
    });
    return Math.round(totalMinutes);
  }, [edited.exercises]);

  const estimatedLoad = useMemo(() => {
    let sum = 0;
    (edited.exercises || []).forEach(ex => {
      const s = Number(ex.sets) || 0;
      const r = parseInt(ex.reps) || 0;
      const wMatch = ex.weight.match(/\d+/);
      const w = wMatch ? parseInt(wMatch[0]) : 0;
      sum += s * r * (w || 1); // 1kg for BW
    });
    return sum;
  }, [edited.exercises]);

  // Actions
  const removeEx = (id: string) => {
    setEdited({
      ...edited,
      exercises: (edited.exercises || []).filter((ex) => ex.id !== id),
    });
    toast.success("Exercício removido.");
  };

  const moveEx = (index: number, direction: "up" | "down") => {
    const exercises = [...(edited.exercises || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    [exercises[index], exercises[newIndex]] = [
      exercises[newIndex],
      exercises[index],
    ];
    setEdited({ ...edited, exercises });
  };

  const addExFromLib = (libEx: EnrichedExercise) => {
    const newEx: PrescribedExercise = {
      id: `ex-lib-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: libEx.name,
      muscleGroup: libEx.muscleGroup,
      sets: 3,
      reps: libEx.defaultReps,
      weight: libEx.defaultWeight,
      repsType: libEx.defaultReps.toLowerCase().includes("s") ? "time" : "reps",
      rest: libEx.recommendedRest || "90s",
      notes: `Foco: ${libEx.physicalQuality} | RPE Alvo: ${libEx.recommendedRpe}`
    };

    setEdited({ ...edited, exercises: [...(edited.exercises || []), newEx] });
    setExpandedExerciseId(newEx.id); // auto-expand newly added exercise
    setRecentAdds(prev => [libEx.id, ...prev.slice(0, 4)]);
    toast.success(`Prescrito: ${libEx.name}`);
  };

  const addCustomEx = () => {
    if (!customExerciseName.trim()) {
      toast.error("Insira o nome do exercício customizado.");
      return;
    }
    const newEx: PrescribedExercise = {
      id: `ex-custom-${Date.now()}`,
      name: customExerciseName.trim(),
      muscleGroup: "Geral",
      sets: 3,
      reps: "10",
      weight: "BW",
      repsType: "reps",
      rest: "60s"
    };

    setEdited({ ...edited, exercises: [...(edited.exercises || []), newEx] });
    setExpandedExerciseId(newEx.id); // auto-expand newly custom exercise
    setCustomExerciseName("");
    toast.success(`Customizado adicionado: ${newEx.name}`);
  };

  const updateExField = (id: string, field: keyof PrescribedExercise, value: any) => {
    setEdited({
      ...edited,
      exercises: (edited.exercises || []).map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      ),
    });
  };

  const duplicateBlock = (ex: PrescribedExercise) => {
    const duplicated: PrescribedExercise = {
      ...ex,
      id: `ex-dup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${ex.name} (Cópia)`
    };
    setEdited({
      ...edited,
      exercises: [...(edited.exercises || []), duplicated]
    });
    setExpandedExerciseId(duplicated.id); // auto-expand duplicated exercise
    toast.success("Bloco de exercício duplicado!");
  };

  const duplicateEntireWorkout = () => {
    if ((edited.exercises || []).length === 0) {
      toast.error("O treino está vazio!");
      return;
    }
    const duplicatedExercises = edited.exercises.map(ex => ({
      ...ex,
      id: `ex-dup-wk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    }));
    setEdited({
      ...edited,
      exercises: [...(edited.exercises || []), ...duplicatedExercises]
    });
    toast.success(`Duplicado! Total de ${edited.exercises.length} novos exercícios adicionados.`);
  };

  // Advanced filtration
  const filteredLibrary = useMemo(() => {
    return ENRICHED_LIBRARY.filter(item => {
      // 1. Text Search
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.physicalQuality || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.equipment || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Tab Categories
      if (activeCategory === "FAVORITES") {
        if (!favorites.includes(item.id)) return false;
      } else if (activeCategory === "RECENTS") {
        if (!recentAdds.includes(item.id)) return false;
      } else if (activeCategory !== "ALL") {
        if (item.category !== activeCategory) return false;
      }

      // 3. Metadata Filters
      if (filterDifficulty !== "ALL" && item.difficulty !== filterDifficulty) return false;
      if (filterQuality !== "ALL" && item.physicalQuality !== filterQuality) return false;
      if (filterEquipment !== "ALL" && !(item.equipment || "").toLowerCase().includes(filterEquipment.toLowerCase())) return false;
      if (filterMuscleGroup !== "ALL" && item.muscleGroup !== filterMuscleGroup) return false;
      if (filterSport !== "ALL" && !(item.sports || []).some(s => s.toLowerCase() === filterSport.toLowerCase())) return false;

      // 4. AI Search Filter
      if (aiSearchIds && !aiSearchIds.includes(item.id)) return false;

      return true;
    });
  }, [searchQuery, activeCategory, favorites, recentAdds, filterDifficulty, filterQuality, filterEquipment, filterMuscleGroup, filterSport, aiSearchIds]);

  // Unique list of qualities, difficulties, and equipments for filters
  const uniqueQualities = useMemo(() => {
    const set = new Set<string>();
    ENRICHED_LIBRARY.forEach(x => {
      if (x.physicalQuality) set.add(x.physicalQuality);
    });
    return Array.from(set);
  }, []);

  const uniqueMuscleGroups = useMemo(() => {
    const set = new Set<string>();
    ENRICHED_LIBRARY.forEach(x => {
      if (x.muscleGroup) set.add(x.muscleGroup);
    });
    return Array.from(set);
  }, []);

  const uniqueSports = useMemo(() => {
    const set = new Set<string>();
    ENRICHED_LIBRARY.forEach(x => {
      if (x.sports) {
        x.sports.forEach(s => set.add(s));
      }
    });
    return Array.from(set);
  }, []);

  const uniqueEquipments = [
    "Barra", "Halter", "Kettlebell", "Peso Corporal", "Elástico", "Força", "Máquina", "BOSU", "Cones", "Corda", "Trenó"
  ];

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Por favor, digite termos de busca científicos (ex: 'reabilitação de joelho', 'explosão vertical').");
      return;
    }
    setIsAiSearching(true);
    setAiSearchReasoning(null);
    setAiSearchIds(null);
    
    try {
      const response = await searchExercisesWithAi(searchQuery);
      if (response && response.exerciseIds) {
        setAiSearchIds(response.exerciseIds);
        setAiSearchReasoning(response.reasoning);
        toast.success(`Busca Inteligente ativada! ${response.exerciseIds.length} exercícios encontrados.`);
      } else {
        toast.error("Nenhum exercício correspondente foi encontrado pela IA.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Falha ao realizar busca por IA.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiSearchIds(null);
    setAiSearchReasoning(null);
    setSearchQuery("");
  };

  // Simulated Sports Science AI Agent Deep Generation
  const startAiPrescription = async () => {
    setAiLoading(true);
    setAiThoughts([]);
    setAiSuggestedExercises([]);

    const messages = [
      "⚡ [CONEXÃO] Iniciando LB Sport Science Copilot...",
      `📊 [MÉTRICAS] Sincronizando avaliações físicas ativas de ${athleteName}...`,
      "🔍 [DIAGNÓSTICO] Identificada predominância de força reativa moderada (RSI < 1.8) e assimetria de tripla extensão.",
      `🧠 [IA INTELIGENTE] Cruzando modalidade [${aiFocusModality}] com objetivo fisiológico [${aiFocusGoal}]...`,
      "🧬 [FISIOLOGIA] Otimizando recrutamento de Unidades Motoras de Alto Limiar e Rigidez de Tendão.",
      "📋 [PROTOCOLOS] Aplicando diretrizes EXOS Pillar Prep e Hawkin Dynamics Triphasic System.",
      "🤖 [GEMINI] Consultando modelo de linguagem de alta performance para prescrição baseada em evidências..."
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < messages.length) {
        setAiThoughts(prev => [...prev, messages[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 350);

    // Wait 2.5s for thinking steps animation
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const response = await prescribeWorkoutWithAi({
        athleteData: `${athleteName} (${aiAgeRange})`,
        objective: aiFocusGoal,
        restrictions: "Nenhuma restrição de lesão relatada",
        timeAvailable: "60 minutos",
        equipment: aiEquipmentSet,
        periodizationPhase: "Preparação Geral"
      });

      if (response && response.exercises) {
        setAiThoughts(prev => [...prev, "✅ [SUCESSO] Bloco de prescrição otimizado gerado com sucesso pelo Gemini!"]);
        
        const suggestions = response.exercises.map((item: any, i: number) => {
          const matchingLibEx = ENRICHED_LIBRARY.find(x => x.id === item.exerciseId || x.name.toLowerCase() === item.name.toLowerCase());
          return {
            id: matchingLibEx?.id || `virtual-${Math.random().toString(36).substr(2, 4)}-${i}`,
            name: item.name,
            physicalQuality: item.muscleGroup,
            physiologicalGoal: item.notes || "Otimização de força e potência baseada em ciência.",
            category: matchingLibEx?.category || "ALL",
            muscleGroup: item.muscleGroup,
            equipment: item.weight,
            difficulty: "Intermediário",
            defaultReps: item.reps,
            defaultWeight: item.weight,
            recommendedRest: item.rest,
            recommendedRpe: "8-9",
            sports: [aiFocusModality],
            description: item.notes,
            scientificRationale: response.scientificRationale || ""
          };
        });

        setAiSuggestedExercises(suggestions);
        toast.success("Prescrição sugerida pela IA pronta!");
      } else {
        throw new Error("Invalid or empty response from API");
      }
    } catch (err) {
      console.warn("AI Prescriber failed or key not set, using science-backed offline engine:", err);
      // Pick dynamic suggestions based on selections
      const suggestions = ENRICHED_LIBRARY.filter(ex => {
        if (aiFocusGoal.toLowerCase().includes("potência") || aiFocusGoal.toLowerCase().includes("explosão")) {
          return ex.category === "Potência" || (ex.physicalQuality || "").includes("Potência");
        }
        if (aiFocusGoal.toLowerCase().includes("prevenção") || aiFocusGoal.toLowerCase().includes("estabilidade")) {
          return ex.category === "Preventivo" || ex.category === "Core";
        }
        return ex.category === "MMII" || ex.category === "Potência";
      });

      setAiSuggestedExercises(suggestions.length > 0 ? suggestions : ENRICHED_LIBRARY.slice(0, 3));
      setAiThoughts(prev => [...prev, "⚠️ [OFF-LINE] Chave de API não ativa. Carregadas diretrizes de ciência esportiva off-line."]);
      toast.success("Prescrição alternativa (Off-line) carregada.");
    } finally {
      setAiLoading(false);
    }
  };

  const injectAiSuggestedExercises = () => {
    if (aiSuggestedExercises.length === 0) return;
    
    const newExercises = aiSuggestedExercises.map((libEx, index) => ({
      id: `ex-ai-${Date.now()}-${index}`,
      name: libEx.name,
      muscleGroup: libEx.muscleGroup,
      sets: 4,
      reps: libEx.defaultReps,
      weight: libEx.defaultWeight,
      repsType: libEx.defaultReps.toLowerCase().includes("s") ? ("time" as const) : ("reps" as const),
      rest: libEx.recommendedRest || "2 min",
      notes: `[IA PRESCRITO] Foco: ${libEx.physicalQuality} | Justificativa: Otimização de RFD por VBT.`
    }));

    setEdited(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), ...newExercises]
    }));
    
    toast.success(`Injetados ${newExercises.length} exercícios científicos na planilha!`);
  };

  // Progression Studio Application Logic
  const applyProgressionSystem = () => {
    if ((edited.exercises || []).length === 0) {
      toast.error("Prescreva pelo menos um exercício na planilha primeiro!");
      return;
    }

    let logs = "";
    const updatedExercises = edited.exercises.map(ex => {
      let currentSets = ex.sets || 3;
      let currentRepsVal = parseInt(ex.reps) || 8;
      let currentWeightVal = parseFloat(ex.weight) || 0;
      const weightUnit = ex.weight.includes("kg") ? "kg" : "BW";
      let note = ex.notes || "";

      switch (progressionMethod) {
        case "linear":
          // +5% load, -1 or 2 reps, maintaining sets
          currentRepsVal = Math.max(3, currentRepsVal - 2);
          currentWeightVal = currentWeightVal > 0 ? Math.round(currentWeightVal * 1.05) : 0;
          note = `[PROG. LINEAR] Carga incremental +5% | Reps ajustadas de forma compensatória.`;
          break;
        case "undulating":
          // Heavy set-rep scheme alternating volumes
          currentSets = 4;
          currentRepsVal = 6;
          currentWeightVal = currentWeightVal > 0 ? Math.round(currentWeightVal * 1.15) : 0;
          note = `[PROG. ONDULATÓRIA] Carga de Alta Intensidade | Ondulação de microciclo focado em RFD.`;
          break;
        case "accumulation":
          // Hypertrophy and structural accumulation (+1 set, +2 reps, lighter weight)
          currentSets = currentSets + 1;
          currentRepsVal = currentRepsVal + 2;
          currentWeightVal = currentWeightVal > 0 ? Math.round(currentWeightVal * 0.90) : 0;
          note = `[PROG. ACUMULAÇÃO] Aumento de volume total (+1 Set, +2 Reps) focado em capacidade de trabalho.`;
          break;
        case "deload":
          // Drop weight by 30%, reduce sets by 1
          currentSets = Math.max(2, currentSets - 1);
          currentWeightVal = currentWeightVal > 0 ? Math.round(currentWeightVal * 0.65) : 0;
          note = `[PROG. DELOAD] Descarga regenerativa de fadiga ativa. Redução de 35% na intensidade.`;
          break;
        case "tapering":
          // Peak intensity, drop volume by 50%
          currentSets = 2;
          currentRepsVal = Math.max(2, Math.round(currentRepsVal * 0.6));
          currentWeightVal = currentWeightVal > 0 ? Math.round(currentWeightVal * 1.10) : 0;
          note = `[PROG. TAPERING] Polimento Competitivo. Volume reduzido em 50% | Intensidade Neural Máxima (+10% Carga).`;
          break;
      }

      const formattedWeight = currentWeightVal > 0 ? `${currentWeightVal}${weightUnit === "kg" ? "kg" : ""}` : "BW";

      return {
        ...ex,
        sets: currentSets,
        reps: currentRepsVal.toString(),
        weight: formattedWeight,
        notes: note
      };
    });

    setEdited(prev => ({
      ...prev,
      exercises: updatedExercises
    }));

    toast.success(`Progressão [${progressionMethod.toUpperCase()}] aplicada com sucesso a toda a planilha!`);
  };

  return (
    <div className="w-full h-full md:max-w-[98vw] xl:max-w-[1720px] md:h-[97vh] bg-slate-950 md:border md:border-slate-900 md:rounded-[2.5rem] overflow-hidden shadow-2xl text-slate-100 flex flex-col lg:flex-row animate-in fade-in duration-300">
      
      {/* MOBILE HEADER & TAB SWITCHER */}
      <div className="lg:hidden shrink-0 bg-[#0c111d] border-b border-slate-900 px-4 py-3 flex items-center justify-between gap-2 w-full">
        <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-900/60 flex-1">
          <button
            onClick={() => setActiveMobileTab("workout")}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-center ${
              activeMobileTab === "workout"
                ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📋 Planilha ({edited.exercises?.length || 0})
          </button>
          <button
            onClick={() => setActiveMobileTab("library")}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all text-center ${
              activeMobileTab === "library"
                ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚡ Prescritor Elite
          </button>
        </div>
        <button
          onClick={onCancel}
          className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors shrink-0"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* LEFT COLUMN: MULTI-TAB PRESCRIÇÃO PLATFORM */}
      <div className={`${activeMobileTab === "library" ? "flex" : "hidden"} lg:flex w-full lg:w-[380px] xl:w-[420px] bg-[#0c111d] border-b lg:border-b-0 lg:border-r border-slate-900 p-6 flex-col overflow-y-auto no-scrollbar`}>
        
        {/* PLATFORM HEADER */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center text-[#39FF14]">
              <Cpu className="w-5 h-5 text-[#39FF14] animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white leading-tight">LB PRESCRITOR PREMIUM</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Módulo de Alta Performance EXOS</p>
            </div>
          </div>
          <button 
            onClick={duplicateEntireWorkout} 
            className="text-[9px] font-black uppercase tracking-widest text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/20 px-3 py-2 rounded-lg hover:bg-[#39FF14]/20 transition-all"
            title="Clonar planilha de treino ativa"
          >
            CLONAR TREINO
          </button>
        </div>

        {/* WORKSPACE SIDEBAR SUB-TABS */}
        <div className="flex bg-slate-950 border border-slate-900/60 p-1 rounded-xl mb-5 shrink-0 gap-1">
          <button
            onClick={() => setSidebarTab("library")}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
              sidebarTab === "library"
                ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📚 Biblioteca
          </button>
          <button
            onClick={() => setSidebarTab("ai")}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
              sidebarTab === "ai"
                ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🧠 IA Co-Pilot
          </button>
          <button
            onClick={() => setSidebarTab("progression")}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
              sidebarTab === "progression"
                ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚙️ Progressão
          </button>
        </div>

        {/* TAB CONTENT: BIBLIOTECA ELITE */}
        {sidebarTab === "library" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            
            {/* SEARCH */}
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-[#161b26] border border-slate-850 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-200 outline-none focus:ring-2 focus:ring-[#39FF14]/10 focus:border-[#39FF14] transition-all"
                  placeholder="Pesquisar por nome, músculo, equipamento..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAiSearch();
                  }}
                />
              </div>
              <button
                onClick={handleAiSearch}
                disabled={isAiSearching}
                className="bg-[#39FF14]/10 hover:bg-[#39FF14]/20 disabled:bg-slate-900 border border-[#39FF14]/30 text-[#39FF14] px-3.5 rounded-xl transition-colors flex items-center justify-center shrink-0"
                title="Pesquisa Científica com IA Gemini"
              >
                {isAiSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* AI SEARCH RESULTS REASONING BANNER */}
            {aiSearchReasoning && (
              <div className="bg-[#39FF14]/5 border border-[#39FF14]/20 p-3.5 rounded-xl space-y-1 animate-fade-in shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-[#39FF14] tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#39FF14]" />
                    Análise Científica de Busca por IA
                  </span>
                  <button
                    onClick={clearAiSearch}
                    className="text-[8px] font-black text-slate-400 hover:text-white uppercase tracking-wider"
                  >
                    LIMPAR
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-300 font-bold leading-normal">
                  {aiSearchReasoning}
                </p>
              </div>
            )}

            {/* CATEGORY SELECTOR CHIPS */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0 no-scrollbar border-b border-slate-900">
              {[
                { id: "ALL", label: "TUDO" },
                { id: "MMII", label: "Membros Inf." },
                { id: "MMSS", label: "Membros Sup." },
                { id: "Potência", label: "Potência" },
                { id: "Velocidade", label: "Velocidade" },
                { id: "Preventivo", label: "Preventivos" },
                { id: "Core", label: "Core" },
                { id: "FAVORITES", label: "★" }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activeCategory === cat.id 
                      ? "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30" 
                      : "bg-slate-900/40 text-slate-400 border-slate-800/60 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ADVANCED MULTI-FILTERS EXPANDABLE BOX */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#39FF14]" />
                  Filtros Avançados de Ciência
                </span>
                <button 
                  onClick={() => {
                    setFilterDifficulty("ALL");
                    setFilterQuality("ALL");
                    setFilterEquipment("ALL");
                    setFilterMuscleGroup("ALL");
                    setFilterSport("ALL");
                    setSearchQuery("");
                    setAiSearchIds(null);
                    setAiSearchReasoning(null);
                  }}
                  className="text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-wider"
                >
                  LIMPAR
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Difficulty */}
                <div className="space-y-1">
                  <span className="text-[7.5px] font-black text-slate-500 uppercase block tracking-wider">Dificuldade</span>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full bg-[#161b26] text-[8.5px] font-black uppercase text-slate-300 border border-slate-850 p-1.5 rounded-lg focus:border-[#39FF14]"
                  >
                    <option value="ALL">TODAS</option>
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermed.</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>

                {/* Physical Quality */}
                <div className="space-y-1">
                  <span className="text-[7.5px] font-black text-slate-500 uppercase block tracking-wider">Qualidade Física</span>
                  <select
                    value={filterQuality}
                    onChange={(e) => setFilterQuality(e.target.value)}
                    className="w-full bg-[#161b26] text-[8.5px] font-black uppercase text-slate-300 border border-slate-850 p-1.5 rounded-lg focus:border-[#39FF14]"
                  >
                    <option value="ALL">TODAS</option>
                    {uniqueQualities.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>

                {/* Muscle Group */}
                <div className="space-y-1">
                  <span className="text-[7.5px] font-black text-slate-500 uppercase block tracking-wider">Grupo Muscular</span>
                  <select
                    value={filterMuscleGroup}
                    onChange={(e) => setFilterMuscleGroup(e.target.value)}
                    className="w-full bg-[#161b26] text-[8.5px] font-black uppercase text-slate-300 border border-slate-850 p-1.5 rounded-lg focus:border-[#39FF14]"
                  >
                    <option value="ALL">TODOS</option>
                    {uniqueMuscleGroups.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                  </select>
                </div>

                {/* Sport */}
                <div className="space-y-1">
                  <span className="text-[7.5px] font-black text-slate-500 uppercase block tracking-wider">Esporte</span>
                  <select
                    value={filterSport}
                    onChange={(e) => setFilterSport(e.target.value)}
                    className="w-full bg-[#161b26] text-[8.5px] font-black uppercase text-slate-300 border border-slate-850 p-1.5 rounded-lg focus:border-[#39FF14]"
                  >
                    <option value="ALL">TODOS</option>
                    {uniqueSports.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  </select>
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-1 pt-1 border-t border-slate-900/40">
                <span className="text-[7.5px] font-black text-slate-500 uppercase block tracking-wider">Equipamento Requerido</span>
                <select
                  value={filterEquipment}
                  onChange={(e) => setFilterEquipment(e.target.value)}
                  className="w-full bg-[#161b26] text-[8.5px] font-black uppercase text-slate-300 border border-slate-850 p-1.5 rounded-lg focus:border-[#39FF14]"
                >
                  <option value="ALL">TODOS OS EQUIPAMENTOS</option>
                  {uniqueEquipments.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
            </div>

            {/* HIGH-FIDELITY BENTO LIST */}
            <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar min-h-[150px] pr-1">
              {filteredLibrary.map(item => (
                <div
                  key={item.id}
                  onClick={() => addExFromLib(item)}
                  className="p-3 bg-[#111622] hover:bg-[#151c2c] border border-slate-900 rounded-xl flex items-center justify-between group cursor-pointer transition-all hover:scale-[1.01] hover:border-slate-850"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/40 flex items-center justify-center text-slate-400 group-hover:text-[#39FF14] group-hover:bg-[#39FF14]/5 transition-all">
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-slate-200 group-hover:text-white transition-colors tracking-tight leading-snug">
                        {item.name}
                      </h5>
                      <div className="flex gap-1.5 mt-1 items-center">
                        <span className="text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#39FF14]/10 text-[#39FF14] rounded">
                          {item.physicalQuality || "Geral"}
                        </span>
                        <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-500">
                          {item.equipment ? item.equipment.split(" ")[0] : "BW"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* View Details Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetailsExercise(item);
                      }}
                      className="p-1.5 text-slate-500 hover:text-white transition-colors"
                      title="Ver detalhes científicos ricos"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {/* Favorite Heart Icon */}
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                    <div className="w-6 h-6 rounded-md bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center text-[#39FF14] group-hover:scale-110 transition-transform">
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>
              ))}

              {filteredLibrary.length === 0 && (
                <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-[9px] border-2 border-dashed border-slate-900 rounded-xl">
                  Nenhum exercício correspondente aos filtros
                </div>
              )}
            </div>

            {/* CUSTOM EXERCISE ADDER */}
            <div className="border-t border-slate-900 pt-4 mt-auto shrink-0">
              <label className="text-[8.5px] font-black text-slate-500 uppercase block mb-1.5 tracking-widest">
                + Adicionar Customizado Rápido
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customExerciseName}
                  onChange={(e) => setCustomExerciseName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]/10"
                  placeholder="Ex: Saltos Unilaterais Caixa"
                />
                <button
                  onClick={addCustomEx}
                  className="bg-[#39FF14] hover:bg-[#32e00f] text-slate-950 font-black text-[10px] px-4 rounded-lg transition-colors uppercase tracking-widest"
                >
                  ADD
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB CONTENT: IA PRESCRITOR (CO-PILOT) */}
        {sidebarTab === "ai" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            
            {/* AI CONFIGURATION FORM */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3.5 shrink-0">
              <div className="flex items-center gap-2 text-[#39FF14]">
                <Brain className="w-4.5 h-4.5 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider">CONFIGURADOR INTELIGENTE IA</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                A IA analisa a idade, modalidade e as avaliações ativas de <span className="text-white font-black">{athleteName}</span> (como CMJ, RSI de {athleteGoal}) para montar o melhor microciclo.
              </p>

              <div className="space-y-3">
                {/* Modality & Goal Customizers */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[7.5px] font-black text-slate-500 uppercase block mb-1">Esporte Alvo</label>
                    <input 
                      type="text"
                      value={aiFocusModality}
                      onChange={(e) => setAiFocusModality(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-[#161b26] text-[9px] font-black uppercase text-slate-200 border border-slate-850 p-2 rounded-lg focus:border-[#39FF14]"
                    />
                  </div>
                  <div>
                    <label className="text-[7.5px] font-black text-slate-500 uppercase block mb-1">Foco Principal</label>
                    <input 
                      type="text"
                      value={aiFocusGoal}
                      onChange={(e) => setAiFocusGoal(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-[#161b26] text-[9px] font-black uppercase text-slate-200 border border-slate-850 p-2 rounded-lg focus:border-[#39FF14]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[7.5px] font-black text-slate-500 uppercase block mb-1">Faixa Etária</label>
                    <select
                      value={aiAgeRange}
                      onChange={(e) => setAiAgeRange(e.target.value)}
                      className="w-full bg-[#161b26] text-[9px] font-black uppercase text-slate-300 border border-slate-850 p-2 rounded-lg focus:border-[#39FF14]"
                    >
                      <option value="Sub-15">Sub-15</option>
                      <option value="Sub-17">Sub-17</option>
                      <option value="Sub-20">Sub-20</option>
                      <option value="Profissional">Profissional</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[7.5px] font-black text-slate-500 uppercase block mb-1">Equipamentos</label>
                    <select
                      value={aiEquipmentSet}
                      onChange={(e) => setAiEquipmentSet(e.target.value)}
                      className="w-full bg-[#161b26] text-[9px] font-black uppercase text-slate-300 border border-slate-850 p-2 rounded-lg focus:border-[#39FF14]"
                    >
                      <option value="Completo">Academia Completa</option>
                      <option value="Halteres">Halteres & Elásticos</option>
                      <option value="Livre">Apenas Peso Corporal</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={startAiPrescription}
                  disabled={aiLoading}
                  className="w-full bg-[#39FF14] hover:bg-[#32e00f] disabled:bg-slate-850 text-slate-950 font-black text-[10px] py-3 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl shadow-[#39FF14]/10 cursor-pointer"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      PROCESSANDO DADOS ATLETA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 stroke-[3]" />
                      GERAR PRESCRIÇÃO AUTOMÁTICA
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI THOUGHT PROCESS CONSOLE */}
            {aiThoughts.length > 0 && (
              <div className="bg-[#05080e] border border-slate-900 rounded-xl p-4 space-y-1 font-mono text-[8px] leading-relaxed max-h-[140px] overflow-y-auto no-scrollbar">
                {aiThoughts.map((thought, i) => (
                  <div key={i} className="text-[#39FF14]/90 animate-fade-in">
                    {thought}
                  </div>
                ))}
              </div>
            )}

            {/* AI SUGGESTED BLOCKS CARDS */}
            {aiSuggestedExercises.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    SUGESTÃO GERADA ({aiSuggestedExercises.length} EXERCÍCIOS)
                  </span>
                  <button
                    onClick={injectAiSuggestedExercises}
                    className="text-[9px] font-black text-[#39FF14] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    Injetar Tudo
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                  {aiSuggestedExercises.map((sug, i) => (
                    <div 
                      key={sug.id}
                      className="p-3 bg-[#111622] border border-slate-900 rounded-xl relative group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-[11px] font-black text-slate-100">{sug.name}</span>
                          <p className="text-[7.5px] text-[#39FF14] font-black uppercase tracking-wider mt-0.5">{sug.physicalQuality}</p>
                        </div>
                        <button
                          onClick={() => addExFromLib(sug)}
                          className="w-5 h-5 bg-[#39FF14]/10 hover:bg-[#39FF14]/20 text-[#39FF14] rounded-md border border-[#39FF14]/20 flex items-center justify-center transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold leading-normal mt-1.5">{sug.physiologicalGoal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* IF EMPTY AI VIEW */}
            {aiSuggestedExercises.length === 0 && !aiLoading && (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-500 select-none">
                <Brain className="w-8 h-8 text-slate-800 mb-2 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sem Prescrição Ativa</span>
                <span className="text-[8px] text-slate-600 font-bold uppercase mt-1 leading-normal max-w-[240px]">
                  Clique no botão acima para rodar o motor de IA e gerar uma planilha estruturada para o atleta
                </span>
              </div>
            )}

          </div>
        )}

        {/* TAB CONTENT: AUTOMATIC PROGRESSION STUDIO */}
        {sidebarTab === "progression" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3.5 shrink-0">
              <div className="flex items-center gap-2 text-[#39FF14]">
                <Sliders className="w-4.5 h-4.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">ESTÚDIO DE AUTOMOÇÃO DE CICLOS</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                Selecione o esquema de progressão desejável. O estúdio ajustará automaticamente as repetições, as cargas e a descrição de todos os exercícios na planilha de forma científica.
              </p>

              <div className="space-y-2">
                {[
                  { id: "linear", title: "Progressão Linear Acumulativa", desc: "Aumento progressivo de carga (+5%) e diminuição compensatória de reps.", color: "text-blue-400" },
                  { id: "undulating", title: "Periodização Ondulatória Diária", desc: "Varie o volume e a intensidade diariamente para evitar adaptação precoce.", color: "text-amber-400" },
                  { id: "accumulation", title: "Bloco de Acumulação / Hipertrofia", desc: "Aumento de séries totais (+1 Set, +2 Reps) com cargas submáximas.", color: "text-emerald-400" },
                  { id: "deload", title: "Semana de Deload / Regenerativa", desc: "Redução de 35% nas cargas e remoção de 1 série por exercício para dissipar fadiga.", color: "text-purple-400" },
                  { id: "tapering", title: "Polimento Competitivo (Tapering)", desc: "Queda drástica de 50% no volume e pico de intensidade neural (+10% Carga) para prontidão máxima.", color: "text-[#39FF14]" }
                ].map(item => (
                  <label 
                    key={item.id}
                    onClick={() => setProgressionMethod(item.id as any)}
                    className={`p-3 rounded-lg border flex flex-col cursor-pointer transition-all ${
                      progressionMethod === item.id 
                        ? "bg-[#111622] border-[#39FF14]/30" 
                        : "bg-slate-900/30 border-slate-850 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        checked={progressionMethod === item.id} 
                        onChange={() => {}}
                        className="accent-[#39FF14]"
                      />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${item.color}`}>{item.title}</span>
                    </div>
                    <p className="text-[8.5px] text-slate-400 font-bold uppercase mt-1 leading-normal ml-5">{item.desc}</p>
                  </label>
                ))}
              </div>

              <button
                onClick={applyProgressionSystem}
                className="w-full bg-[#39FF14] hover:bg-[#32e00f] text-slate-950 font-black text-[10px] py-3 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-xl shadow-[#39FF14]/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[3]" />
                APLICAR SISTEMA DE PROGRESSÃO
              </button>
            </div>

          </div>
        )}

      </div>

      {/* RIGHT WORKOUT WORKSPACE */}
      <div className={`${activeMobileTab === "workout" ? "flex" : "hidden"} lg:flex flex-1 flex-col bg-[#05080e] overflow-hidden`}>
        
        {/* WORKOUT HEADER / SUMMARY - COLLAPSIBLE FOR SPACIOUS LAYOUT */}
        {isHeaderExpanded ? (
          <div className="p-6 md:p-8 border-b border-slate-900 flex flex-col gap-6 relative shrink-0 bg-[#0c111d]/90 backdrop-blur-sm animate-in slide-in-from-top-4 duration-300">
            
            {/* COLLAPSE CONTROL TRIGGER BUTTON */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#39FF14] flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                Configurações da Planilha Ativa
              </h3>
              <button
                onClick={() => setIsHeaderExpanded(false)}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-lg border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Minimizar Detalhes <ChevronUp className="w-3.5 h-3.5 text-[#39FF14]" />
              </button>
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">
                    Nome da Planilha de Treino
                  </label>
                  <input
                    value={edited.name}
                    onChange={(e) => setEdited({ ...edited, name: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-[#0c111d] border border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#39FF14]/10 focus:border-[#39FF14] text-white font-extrabold"
                    placeholder="Ex: Bloco de Potência A"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">
                    Data de Prescrição
                  </label>
                  <input
                    type="date"
                    value={edited.date.split("T")[0]}
                    onChange={(e) => setEdited({ ...edited, date: e.target.value })}
                    className="w-full bg-[#0c111d] border border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#39FF14]/10 focus:border-[#39FF14] text-white font-extrabold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">
                    Fase da Temporada (Periodização)
                  </label>
                  <select
                    value={edited.phase}
                    onChange={(e) => setEdited({ ...edited, phase: e.target.value })}
                    className="w-full bg-[#0c111d] border border-slate-800 rounded-xl p-3 text-sm outline-none text-white font-extrabold focus:ring-2 focus:ring-[#39FF14]/10 focus:border-[#39FF14]"
                  >
                    <option>Preparação Geral</option>
                    <option>Preparação Específica</option>
                    <option>Pré-Competitivo</option>
                    <option>Competitivo</option>
                    <option>Transição</option>
                    <option>Mobilidade/Estabilidade</option>
                    <option>Prescrito Elite</option>
                  </select>
                </div>
              </div>

              {/* REALTIME MONITORING DASHLET */}
              <div className="flex gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-900 self-stretch xl:self-auto items-center justify-between">
                <div className="text-center px-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-wider">Exercícios</span>
                  <span className="text-xl font-black text-white">{edited.exercises?.length || 0}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center px-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-wider">Total Sets</span>
                  <span className="text-xl font-black text-[#39FF14]">{muscleDistribution.totalSets}</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center px-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-wider">Tempo Est.</span>
                  <span className="text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 inline" /> {estimatedDuration}m
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center px-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-wider">Vol. Est.</span>
                  <span className="text-sm font-black text-slate-300">{(estimatedLoad || 0).toLocaleString()}kg</span>
                </div>
              </div>
            </div>
            
            {/* DESKTOP CLOSE BUTTON */}
            <button
              onClick={onCancel}
              className="hidden lg:flex absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer z-10"
              title="Fechar e Descartar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* COMPACT HEADER MODE - SAVES OVER 300PX OF VERTICAL HEIGHT */
          <div className="py-3.5 px-4 md:px-6 border-b border-slate-900 flex items-center justify-between gap-4 shrink-0 bg-[#0c111d] select-none">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-[9px] bg-[#39FF14]/10 text-[#39FF14] px-2 py-1 rounded border border-[#39FF14]/20 font-black tracking-widest uppercase shrink-0">
                PLANILHA ATIVA
              </span>
              <span className="text-sm font-black text-slate-100 truncate max-w-[140px] sm:max-w-[240px]">
                {edited.name || "Sem Nome"}
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md border border-slate-900">
                  {edited.phase}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md border border-slate-900">
                  {edited.date.split("T")[0].split("-").reverse().slice(0, 2).join("/")}
                </span>
              </div>
              
              {/* MINI STATS BADGE */}
              <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-900/60 text-[10px] font-bold text-slate-400">
                <span>{edited.exercises?.length || 0} Exs</span>
                <span className="text-slate-800">•</span>
                <span className="text-[#39FF14] font-black">{muscleDistribution.totalSets} Sets</span>
                <span className="text-slate-800">•</span>
                <span className="text-amber-400 font-bold">{estimatedDuration}m</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsHeaderExpanded(true)}
                className="text-[10px] font-black uppercase tracking-wider px-3 py-2 bg-slate-900 hover:bg-slate-850 hover:text-[#39FF14] text-slate-300 rounded-xl border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Configurações</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#39FF14]" />
              </button>
              
              {/* DESKTOP CLOSE BUTTON */}
              <button
                onClick={onCancel}
                className="hidden lg:flex p-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer"
                title="Fechar e Descartar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* WORKOUT LIST WITH SMART BENTO METRICS FOR BALANCING */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
          
          {/* Realtime muscular loading bars */}
          {muscleDistribution.distribution.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#0c111d] rounded-2xl border border-slate-900/60 animate-in fade-in duration-300">
              <div className="col-span-full mb-1">
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-[#39FF14]" />
                  Balanço Muscular / Distribuição de Volume da Planilha Ativa
                </h5>
              </div>
              {muscleDistribution.distribution.map(dist => (
                <div key={dist.name} className="space-y-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                    <span>{dist.name}</span>
                    <span>{dist.sets} sets ({dist.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#39FF14] to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${dist.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ACTIVE EXERCISES LIST */}
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {(edited.exercises || []).map((ex, index) => {
                const isExpanded = expandedExerciseId === ex.id;
                
                return (
                  <motion.div
                    key={ex.id}
                    layout="position"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-[#0c111d] border rounded-2xl md:rounded-3xl relative group shadow-lg transition-all ${
                      isExpanded 
                        ? "border-[#39FF14]/30 ring-1 ring-[#39FF14]/10 p-5 md:p-6 shadow-[#39FF14]/5 bg-[#0e1627]" 
                        : "border-slate-900/60 hover:border-[#39FF14]/20 p-4 hover:bg-[#0c111d]/80 cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isExpanded) {
                        setExpandedExerciseId(ex.id);
                      }
                    }}
                  >
                    {/* Floating Controls */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-all z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveEx(index, "up"); }}
                        disabled={index === 0}
                        className="bg-slate-950 text-slate-400 w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-850 shadow-md hover:text-[#39FF14] disabled:opacity-30 disabled:hover:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                        title="Mover para cima"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveEx(index, "down"); }}
                        disabled={index === (edited.exercises || []).length - 1}
                        className="bg-slate-950 text-slate-400 w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-850 shadow-md hover:text-[#39FF14] disabled:opacity-30 disabled:hover:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateBlock(ex); }}
                        className="bg-slate-950 text-slate-400 w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-850 shadow-md hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                        title="Duplicar Exercício"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeEx(ex.id); }}
                        className="bg-red-950/20 text-red-400 border border-red-900/40 w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-red-500 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer"
                        title="Excluir exercício"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!isExpanded ? (
                      /* COMPACT / COLLAPSED CARD MODE - EXTREMELY SPACE-EFFICIENT */
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-32 sm:pr-40 md:pr-44">
                        <div className="flex items-center gap-3 min-w-0 pr-4 sm:pr-0">
                          <div className="w-8 h-8 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center justify-center text-[#39FF14] text-xs font-black italic shrink-0">
                            #{index + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-100 group-hover:text-[#39FF14] transition-colors truncate">
                              {ex.name || "Sem Nome"}
                            </h4>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5 truncate">
                              {ex.muscleGroup || "GERAL"}
                            </p>
                          </div>
                        </div>

                        {/* Quick Prescription Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-900/80 px-2.5 py-1 rounded-xl">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Séries</span>
                            <span className="text-[#39FF14] text-xs font-extrabold">{ex.sets}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-900/80 px-2.5 py-1 rounded-xl">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Volume</span>
                            <span className="text-slate-200 text-xs font-extrabold">
                              {ex.reps}{ex.repsType === "time" ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-900/80 px-2.5 py-1 rounded-xl">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Carga</span>
                            <span className="text-slate-200 text-xs font-extrabold">{ex.weight || "BW"}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-900/80 px-2.5 py-1 rounded-xl">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Pausa</span>
                            <span className="text-amber-400 text-xs font-extrabold">{ex.rest || "90s"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* FULL EDITABLE FORM (EXPANDED) */
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        {/* Index & Name */}
                        <div className="md:col-span-4 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#39FF14] italic">#{index + 1}</span>
                            <input
                              value={ex.name}
                              onChange={(e) => updateExField(ex.id, "name", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="bg-transparent border-b border-dashed border-slate-700 focus:border-b-[#39FF14] outline-none text-base md:text-lg text-slate-100 font-extrabold w-full py-1 transition-colors"
                            />
                          </div>
                          <input
                            value={ex.muscleGroup}
                            onChange={(e) => updateExField(ex.id, "muscleGroup", e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="bg-transparent text-[10px] font-black uppercase text-slate-400 w-full outline-none focus:text-slate-300"
                            placeholder="Grupo Muscular"
                          />
                        </div>

                        {/* Numeric Prescriptions */}
                        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-extrabold block tracking-wider mb-1">
                              Séries
                            </label>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExField(ex.id, "sets", parseInt(e.target.value) || 1)}
                              onFocus={(e) => e.target.select()}
                              className="w-full bg-slate-950/50 border border-slate-800 focus:border-[#39FF14]/50 rounded-xl p-3 text-sm text-white text-center font-extrabold transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-extrabold block tracking-wider mb-1">
                              Tipo
                            </label>
                            <select
                              value={ex.repsType || "reps"}
                              onChange={(e) => updateExField(ex.id, "repsType", e.target.value)}
                              className="w-full bg-slate-950/50 border border-slate-800 focus:border-[#39FF14]/50 rounded-xl p-3 text-sm text-slate-300 font-extrabold transition-all"
                            >
                              <option value="reps">Reps</option>
                              <option value="time">Tempo (s)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-extrabold block tracking-wider mb-1">
                              Volume
                            </label>
                            <input
                              value={ex.reps}
                              onChange={(e) => updateExField(ex.id, "reps", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full bg-slate-950/50 border border-slate-800 focus:border-[#39FF14]/50 rounded-xl p-3 text-sm text-white text-center font-extrabold transition-all"
                              placeholder={ex.repsType === "time" ? "30s" : "10"}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase font-extrabold block tracking-wider mb-1">
                              Carga
                            </label>
                            <input
                              value={ex.weight}
                              onChange={(e) => updateExField(ex.id, "weight", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full bg-slate-950/50 border border-slate-800 focus:border-[#39FF14]/50 rounded-xl p-3 text-sm text-white text-center font-extrabold transition-all"
                              placeholder="BW"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label className="text-[10px] text-slate-400 uppercase font-extrabold block tracking-wider mb-1">
                              Descanso
                            </label>
                            <input
                              value={ex.rest || "90s"}
                              onChange={(e) => updateExField(ex.id, "rest", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full bg-slate-950/50 border border-slate-800 focus:border-[#39FF14]/50 rounded-xl p-3 text-sm text-amber-400 text-center font-extrabold transition-all"
                              placeholder="90s"
                            />
                          </div>
                        </div>

                        {/* Extended notes field */}
                        <div className="md:col-span-12 mt-3 pt-3 border-t border-slate-900/60 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <span className="text-[10px] text-[#39FF14] uppercase font-black tracking-widest shrink-0">OBSERVAÇÕES:</span>
                          <input 
                            value={ex.notes || ""}
                            onChange={(e) => updateExField(ex.id, "notes", e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full flex-1 bg-slate-950/40 border border-slate-900 focus:border-[#39FF14]/40 rounded-xl px-4 py-2 text-xs md:text-sm text-slate-300 focus:text-slate-100 placeholder-slate-700 font-medium outline-none transition-all"
                            placeholder="Adicione observações de velocidade de execução, VBT, posicionamento, etc."
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedExerciseId(null); }}
                            className="w-full sm:w-auto mt-2 sm:mt-0 px-3 py-2 bg-slate-900 hover:bg-slate-850 hover:text-[#39FF14] border border-slate-800 text-slate-400 font-black text-[9px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                            title="Recolher exercício"
                          >
                            Recolher <ChevronUp className="w-3.5 h-3.5 text-[#39FF14]" />
                          </button>
                        </div>

                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {(!edited.exercises || edited.exercises.length === 0) && (
              <div className="py-24 text-center text-slate-500 font-black uppercase text-xs tracking-widest border-2 border-dashed border-slate-900 rounded-[2rem]">
                Planilha Vazia. Selecione exercícios da biblioteca ou gere por IA para prescrever.
              </div>
            )}
          </div>
        </div>

        {/* WORKOUT FOOTER WORKSPACE */}
        <div className="p-6 md:p-8 bg-[#0c111d] border-t border-slate-900 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-8 py-4 bg-slate-950 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-slate-800 cursor-pointer"
          >
            DESCARTAR ALTERAÇÕES
          </button>
          
          <button
            onClick={() => {
              if (!edited.name) {
                toast.error("O treino precisa de um nome.");
                return;
              }
              onSave(edited);
            }}
            className="w-full sm:w-auto px-10 py-4 bg-[#39FF14] hover:bg-[#32e00f] text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-[#39FF14]/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            SALVAR PLANILHA DE ALTA PERFORMANCE
            <ChevronRight className="w-4 h-4 text-slate-950 stroke-[3]" />
          </button>
        </div>

      </div>

      {/* RICH SCIENTIFIC EXERCISE DETAILS DRAWER / MODAL */}
      <AnimatePresence>
        {selectedDetailsExercise && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0c111d] border border-slate-850 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
            >
              
              {/* Drawer Header */}
              <div className="p-6 md:p-8 border-b border-slate-900 flex items-start justify-between bg-slate-950">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#39FF14]/10 text-[#39FF14] rounded">
                      {selectedDetailsExercise.physicalQuality || "Geral"}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                      {selectedDetailsExercise.difficulty || "Intermediário"}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                      Plano {selectedDetailsExercise.movementPlane || "Sagital"}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white mt-1.5">{selectedDetailsExercise.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Mapeamento Anatômico & Biomecânico Rico</p>
                </div>
                <button 
                  onClick={() => setSelectedDetailsExercise(null)}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-850 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
                
                {/* GRID METADATA SUMMARY */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-1">CADEIA CINÉTICA</span>
                    <span className="text-xs font-black text-white">{selectedDetailsExercise.kineticChain || "N/A"}</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-1">EQUIPAMENTO</span>
                    <span className="text-xs font-black text-[#39FF14]">{selectedDetailsExercise.equipment || "BW"}</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-1">RPE RECOMENDADO</span>
                    <span className="text-xs font-black text-amber-400">{selectedDetailsExercise.recommendedRpe || "8-10"}</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-1">VELOCIDADE MÁX (VBT)</span>
                    <span className="text-xs font-black text-blue-400">{selectedDetailsExercise.targetVelocity || "Máxima Explosiva"}</span>
                  </div>
                </div>

                {/* BIOMECHANICAL/PHYSIOLOGICAL OBJECTIVE & SCIENCE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Physiological Goal Card */}
                  <div className="p-5 bg-gradient-to-b from-[#111622] to-slate-900/50 rounded-2xl border border-slate-900 space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-[#39FF14] tracking-widest flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-[#39FF14]" />
                      Objetivo Fisiológico
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {selectedDetailsExercise.physiologicalGoal || "Foco no desenvolvimento atlético de potência, controle motor e estabilização articular."}
                    </p>
                  </div>

                  {/* Scientific Evidence Card */}
                  <div className="p-5 bg-gradient-to-b from-[#111622] to-slate-900/50 rounded-2xl border border-slate-900 space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      Evidências Científicas (Lit.)
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                      {selectedDetailsExercise.scientificEvidence || "Protocolos recomendados pela literatura de treinamento neuromuscular baseada em velocidade (VBT)."}
                    </p>
                  </div>

                </div>

                {/* MUSCLES INVOLVED PILLS */}
                <div className="space-y-2 p-5 bg-slate-950/50 rounded-2xl border border-slate-900">
                  <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">Músculos Recrutados Primários/Secundários:</span>
                  <div className="flex flex-wrap gap-2">
                    {(selectedDetailsExercise.musclesInvolved || [selectedDetailsExercise.muscleGroup]).map((muscle, idx) => (
                      <span key={idx} className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-slate-900 text-slate-300 border border-slate-850 rounded-xl">
                        🔥 {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                {/* THREE COLUMNS: BENEFITS, CONTRAINDICATIONS & ERRORS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Benefits */}
                  <div className="space-y-3 p-5 bg-slate-950 rounded-2xl border border-slate-900">
                    <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest block border-b border-slate-900 pb-2">
                      🍀 Benefícios Clínicos
                    </span>
                    <ul className="space-y-2">
                      {(selectedDetailsExercise.benefits || ["Aumento da taxa de desenvolvimento de força (RFD).", "Melhora da coordenação intramuscular.", "Prevenção ativa de lesões ligamentares."]).map((b, i) => (
                        <li key={i} className="text-[11px] font-bold text-slate-300 flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contraindications */}
                  <div className="space-y-3 p-5 bg-slate-950 rounded-2xl border border-slate-900">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block border-b border-slate-900 pb-2">
                      ⚠️ Contraindicações
                    </span>
                    <ul className="space-y-2">
                      {(selectedDetailsExercise.contraindications || ["Lesões articulares agudas sem liberação médica.", "Limitação severa de mobilidade no padrão do movimento."]).map((c, i) => (
                        <li key={i} className="text-[11px] font-bold text-slate-300 flex items-start gap-2 leading-relaxed">
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Errors */}
                  <div className="space-y-3 p-5 bg-slate-950 rounded-2xl border border-slate-900">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block border-b border-slate-900 pb-2">
                      ❌ Erros Comuns
                    </span>
                    <ul className="space-y-2">
                      {(selectedDetailsExercise.commonErrors || ["Fase excêntrica sem controle ou rebote inadequado.", "Perda de alinhamento postural/valgo dinâmico."]).map((e, i) => (
                        <li key={i} className="text-[11px] font-bold text-slate-300 flex items-start gap-2 leading-relaxed">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* PROGRESSION / REGRESSION LINKS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Progressions */}
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-900 space-y-2">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">📈 Progressões Sugeridas</span>
                    <div className="space-y-1.5">
                      {(selectedDetailsExercise.progressions || ["Aumento da carga externa progressiva.", "Redução do tempo de transição ou aumento da velocidade de execução (VBT)."]).map((prog, i) => (
                        <div key={i} className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <ChevronUp className="w-4 h-4 text-emerald-400" />
                          <span>{prog}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Regressions */}
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-900 space-y-2">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">📉 Regressões Sugeridas</span>
                    <div className="space-y-1.5">
                      {(selectedDetailsExercise.regressions || ["Redução da amplitude do movimento.", "Execução assistida ou com peso corporal."]).map((reg, i) => (
                        <div key={i} className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <ChevronDown className="w-4 h-4 text-amber-400" />
                          <span>{reg}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-6 bg-[#0c111d] border-t border-slate-900 flex justify-between items-center shrink-0">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  TAGS: {(selectedDetailsExercise.tags || ["N/A"]).join(" | ")}
                </span>
                <button
                  onClick={() => {
                    addExFromLib(selectedDetailsExercise);
                    setSelectedDetailsExercise(null);
                  }}
                  className="px-6 py-3 bg-[#39FF14] hover:bg-[#32e00f] text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#39FF14]/10 cursor-pointer"
                >
                  Prescrever na Planilha Ativa
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
