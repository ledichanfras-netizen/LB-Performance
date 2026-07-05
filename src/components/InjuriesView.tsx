import React, { FC, useState, useMemo } from "react";
import { 
  Activity, 
  Calendar, 
  ShieldAlert, 
  Sparkles, 
  Plus, 
  Trash2, 
  Heart, 
  ClipboardList, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users,
  ShieldCheck,
  User,
  HeartPulse,
  Pencil,
  Check,
  X,
  FileText
} from "lucide-react";
import { Athlete, InjuryEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { formatDate, getSafeDateTime, getLocalDateString } from "../utils";
import { HealthReport } from "./HealthReport";

interface InjuriesViewProps {
  athlete: Athlete;
  onUpdateAthlete: (data: Partial<Athlete>) => void;
  role: "coach" | "athlete";
}

export const InjuriesView: FC<InjuriesViewProps> = ({
  athlete,
  onUpdateAthlete,
  role,
}) => {
  const injuries = useMemo(() => athlete.injuries || [], [athlete.injuries]);

  const [showHealthReport, setShowHealthReport] = useState(false);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInjury, setNewInjury] = useState<Omit<InjuryEntry, "id">>({
    date: getLocalDateString(),
    description: "",
    status: "Ativa",
    location: "Joelho",
    severity: "Leve",
    rehabStage: "Fisioterapia",
    estimatedReturnDate: "",
    notes: "",
  });

  // Editing State
  const [editingInjury, setEditingInjury] = useState<InjuryEntry | null>(null);
  const [confirmDeleteInjury, setConfirmDeleteInjury] = useState<InjuryEntry | null>(null);

  // Filters state
  const [filterStatus, setFilterStatus] = useState<"todos" | "Ativa" | "Observação" | "Recuperada">("todos");

  // Filtered Injuries
  const filteredInjuries = useMemo(() => {
    let list = [...injuries].sort((a, b) => getSafeDateTime(b.date) - getSafeDateTime(a.date));
    if (filterStatus !== "todos") {
      list = list.filter((i) => i.status === filterStatus);
    }
    return list;
  }, [injuries, filterStatus]);

  // General statistics
  const stats = useMemo(() => {
    const total = injuries.length;
    const active = injuries.filter(i => i.status === "Ativa").length;
    const observation = injuries.filter(i => i.status === "Observação").length;
    const recovered = injuries.filter(i => i.status === "Recuperada").length;
    
    // Severity breakdown
    const severeCount = injuries.filter(i => i.severity === "Grave" || i.severity === "Cirúrgica").length;
    
    // Location distribution
    const locations: Record<string, number> = {};
    injuries.forEach(i => {
      const loc = i.location || "Outro";
      locations[loc] = (locations[loc] || 0) + 1;
    });

    return { total, active, observation, recovered, severeCount, locations };
  }, [injuries]);

  // Medical status label for athlete
  const statusGlow = useMemo(() => {
    if (stats.active > 0) {
      return {
        label: "Sob Cuidados Médicos / DM",
        color: "text-red-500 bg-red-500/10 border-red-500/20",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]",
        badge: "● INATIVO / DM",
      };
    } else if (stats.observation > 0) {
      return {
        label: "Liberado sob Restrição / Observação",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
        badge: "● ATENÇÃO / LIMITADO",
      };
    } else {
      return {
        label: "Apto para Atividade Plena",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
        badge: "● LIBERADO TOTAL",
      };
    }
  }, [stats]);

  // Anatomical injury location map configuration
  const allLocations: Array<NonNullable<InjuryEntry['location']>> = [
    "Joelho", "Tornozelo", "Coxa Posterior", "Coxa Anterior", 
    "Panturrilha", "Coluna/Lombar", "Ombro", "Pé/Articulação", "Outro"
  ];

  // Actions
  const handleAddInjury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInjury.description) return;

    const entry: InjuryEntry = {
      ...newInjury,
      id: `inj-${Date.now()}`,
    };

    onUpdateAthlete({
      injuries: [...injuries, entry],
    });

    // Reset Form
    setNewInjury({
      date: getLocalDateString(),
      description: "",
      status: "Ativa",
      location: "Joelho",
      severity: "Leve",
      rehabStage: "Fisioterapia",
      estimatedReturnDate: "",
      notes: "",
    });
    setShowAddForm(false);
  };

  const handleRemoveInjury = (id: string) => {
    onUpdateAthlete({
      injuries: injuries.filter((i) => i.id !== id),
    });
    setConfirmDeleteInjury(null);
  };

  const handleEditInjury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInjury || !editingInjury.description) return;

    onUpdateAthlete({
      injuries: injuries.map((i) => i.id === editingInjury.id ? editingInjury : i),
    });

    setEditingInjury(null);
  };

  const getSeverityColor = (sev: InjuryEntry['severity']) => {
    switch (sev) {
      case "Leve": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Moderada": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Grave": return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "Cirúrgica": return "bg-red-500/10 text-red-400 border-red-500/40";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusColor = (status: InjuryEntry['status']) => {
    switch (status) {
      case "Ativa": return "bg-red-500/20 text-red-500 border-red-500/30";
      case "Observação": return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      case "Recuperada": return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
      default: return "bg-slate-500/25 text-slate-400 border-slate-500/30";
    }
  };

  if (showHealthReport) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-start">
          <button
            onClick={() => setShowHealthReport(false)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <span>← Voltar para o Painel DM</span>
          </button>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-2xl overflow-auto flex justify-center">
          <HealthReport athlete={athlete} onClose={() => setShowHealthReport(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* 1. HERO SECTION & MEDICAL STATUS */}
      <div className="relative p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 backdrop-blur-3xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full -mr-20 -mt-20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full -ml-20 -mb-20 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20 text-[9px] font-black tracking-widest text-red-400 uppercase">
              <HeartPulse className="w-3 h-3 animate-pulse" />
              DEPARTAMENTO MÉDICO & REABILITAÇÃO
            </div>
            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              CONTROLE CLÍNICO DE <span className="text-brand-primary">SAÚDE</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl font-medium leading-relaxed">
              Mapeamento de lesões musculares e articulares estruturado no padrão elite. Centraliza o feedback, minimiza riscos de não-contato e otimiza a comunicação multifocal (atleta, comissão técnica e responsáveis).
            </p>
          </div>

          <div className={`p-6 rounded-2xl border flex flex-col items-center md:items-end justify-center shrink-0 w-full md:w-auto ${statusGlow.color} ${statusGlow.glow} transition-all duration-300 md:max-w-xs`}>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-2">
              Status Clínico do Atleta
            </span>
            <span className="text-lg font-black tracking-tight leading-none text-center md:text-right uppercase">
              {statusGlow.badge}
            </span>
            <span className="text-[9px] font-medium opacity-70 mt-2 text-center md:text-right">
              {statusGlow.label}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ACTIONS FOR COACH: ADD INJURY ENTRY */}
      {role === "coach" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black uppercase text-white italic tracking-tight">
              Ações Clínicas do Gestor
            </h3>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "secondary" : "accent"}
              className="text-[10px] font-black py-3 px-6 tracking-widest uppercase"
            >
              {showAddForm ? "Cancelar Inserção" : "+ REGISTRAR OCORRÊNCIA"}
            </Button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900/60 border border-slate-800 p-6 sm:p-8 rounded-3xl overflow-hidden"
              >
                <form onSubmit={handleAddInjury} className="space-y-6">
                  <h4 className="text-[10px] font-black text-brand-primary tracking-[0.2em] uppercase">
                    REGISTRAR NOVA LESÃO NO HISTÓRICO CLÍNICO ELITE
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">
                        Data da Ocorrência
                      </label>
                      <input
                        type="date"
                        value={newInjury.date}
                        onChange={(e) => setNewInjury({ ...newInjury, date: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-xl p-3.5 text-xs text-white font-black outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">
                        Localização Anatômica
                      </label>
                      <select
                        value={newInjury.location}
                        onChange={(e) => setNewInjury({ ...newInjury, location: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-xl p-3.5 text-xs text-white font-black outline-none"
                      >
                        {allLocations.map(loc => (
                          <option key={loc} value={loc} className="bg-slate-900">{loc}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">
                        Gravidade da Lesão
                      </label>
                      <select
                        value={newInjury.severity}
                        onChange={(e) => setNewInjury({ ...newInjury, severity: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-xl p-3.5 text-xs text-white font-black outline-none"
                      >
                        <option value="Leve" className="bg-slate-900">Leve (1-7 dias)</option>
                        <option value="Moderada" className="bg-slate-900">Moderada (8-28 dias)</option>
                        <option value="Grave" className="bg-slate-900">Grave (&gt;28 dias)</option>
                        <option value="Cirúrgica" className="bg-slate-900">Cirúrgica / Complexo</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">
                        Status Clínico
                      </label>
                      <select
                        value={newInjury.status}
                        onChange={(e) => setNewInjury({ ...newInjury, status: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-xl p-3.5 text-xs text-white font-black outline-none"
                      >
                        <option value="Ativa" className="bg-slate-900">Ativa (Inativo)</option>
                        <option value="Observação" className="bg-slate-900">Observação (Restrito)</option>
                        <option value="Recuperada" className="bg-slate-900">Recuperada (Apto)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">
                        Descrição / Diagnóstico Clínico
                      </label>
                      <input
                        type="text"
                        value={newInjury.description}
                        onChange={(e) => setNewInjury({ ...newInjury, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-xl p-3.5 text-xs text-white font-black outline-none"
                        placeholder="Ex: Entorse de grau II no ligamento colateral medial (LCM)"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">
                        Estágio de Reabilitação
                      </label>
                      <select
                        value={newInjury.rehabStage}
                        onChange={(e) => setNewInjury({ ...newInjury, rehabStage: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-xl p-3.5 text-xs text-white font-black outline-none"
                      >
                        <option value="Fisioterapia" className="bg-slate-900">Fisioterapia Hospitalar/Clínica</option>
                        <option value="Transição Física" className="bg-slate-900">Transição Física (Campo/Academia)</option>
                        <option value="Treino Assistido" className="bg-slate-900">Treino Assistido (Poupando área)</option>
                        <option value="Retorno Pleno" className="bg-slate-900">Retorno Pleno (Competição/Alta Int.)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">
                        Previsão Estimada de Retorno
                      </label>
                      <input
                        type="date"
                        value={newInjury.estimatedReturnDate}
                        onChange={(e) => setNewInjury({ ...newInjury, estimatedReturnDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-xl p-3.5 text-xs text-white font-black outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 px-1">
                        Conduta Clínica e Exercícios de Reforço
                      </label>
                      <textarea
                        value={newInjury.notes}
                        onChange={(e) => setNewInjury({ ...newInjury, notes: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-xl p-3.5 text-xs text-white font-black outline-none h-20 resize-none animate-none"
                        placeholder="Exercícios e medicamentos prescritos, limitações físicas e observações do fisioterapeuta."
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    className="w-full text-[10px] font-black py-4 uppercase tracking-[0.2em]"
                  >
                    Salvar Ocorrência Clíncia e Sincronizar Ficha
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. HISTORY DETAILED TIMELINE */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black uppercase text-white italic tracking-tighter">
              Linha do Tempo de Ocorrências
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
              Histórico médico completo do atleta listado cronologicamente
            </p>
          </div>

          {/* Filtering */}
          <div className="flex flex-wrap gap-2">
            {(["todos", "Ativa", "Observação", "Recuperada"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterStatus(filter)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                  filterStatus === filter
                    ? "bg-brand-primary border-brand-primary text-brand-dark"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {filter === "todos" ? "Todas as Lesões" : filter}
              </button>
            ))}
          </div>
        </div>

        {filteredInjuries.length > 0 ? (
          <div className="space-y-4">
            {filteredInjuries.map((injury) => (
              <div
                key={injury.id}
                className={`p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-6 relative group transition-all hover:bg-slate-900/60`}
              >
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatDate(injury.date)}
                    </span>
                    
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getSeverityColor(injury.severity)}`}>
                      Gravidade: {injury.severity || "Leve"}
                    </span>

                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusColor(injury.status)}`}>
                      Status: {injury.status}
                    </span>

                    {injury.location && (
                      <span className="bg-slate-800/80 text-white border border-slate-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">
                        Área: {injury.location}
                      </span>
                    )}

                    {injury.rehabStage && (
                      <span className="bg-slate-800/80 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">
                        Tratamento: {injury.rehabStage}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-black uppercase italic text-white group-hover:text-brand-primary tracking-tight transition-colors">
                      {injury.description}
                    </h4>
                    
                    {injury.estimatedReturnDate && injury.status !== "Recuperada" && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase italic">
                        <Clock className="w-3.5 h-3.5" />
                        Previsão Estimada de Retorno: {formatDate(injury.estimatedReturnDate)}
                      </div>
                    )}

                    {injury.notes && (
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/50 text-xs text-slate-300 font-medium leading-relaxed mt-2 italic">
                        <span className="text-[10px] font-black text-slate-500 uppercase block mb-1 non-italic tracking-wider">
                          Observações e Conduta Clínica:
                        </span>
                        {injury.notes}
                      </div>
                    )}
                  </div>
                </div>

                {role === "coach" && (
                  <div className="flex flex-row md:flex-col items-center gap-2 self-end sm:self-start md:self-auto shrink-0 mt-3 md:mt-0">
                    <button
                      onClick={() => setEditingInjury({ ...injury })}
                      className="p-2.5 px-4 text-slate-400 hover:text-[#10b981] hover:bg-[#10b981]/15 rounded-xl transition-all flex items-center justify-center gap-2 bg-slate-950/60 border border-slate-800"
                      title="Editar Ocorrência e Status"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Editar</span>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteInjury(injury)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/15 rounded-xl transition-all flex items-center justify-center bg-slate-950/60 border border-slate-800 animate-none shrink-0"
                      title="Excluir Ocorrência"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 font-black uppercase text-[11px] tracking-[0.3em] border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
            Nenhum registro de lesão correspondente aos filtros
          </div>
        )}
      </div>

      {/* 4. STATS BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Geral</span>
            {role === "coach" && (
              <button
                onClick={() => setShowHealthReport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-950/20"
                title="Gerar Relatório de Saúde"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Relatório</span>
              </button>
            )}
          </div>
          <div>
            <span className="text-4xl font-black text-white">{stats.total}</span>
            <span className="text-[9px] font-bold text-slate-400 block mt-1">Lesões registradas no histórico</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Casos Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-4xl font-black text-red-500">{stats.active}</span>
            <span className="text-[9px] font-bold text-slate-400 block mt-1">Lesões em tratamento ativo</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sob Observação</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-4xl font-black text-amber-500">{stats.observation}</span>
            <span className="text-[9px] font-bold text-slate-400 block mt-1">Processo de transição esportiva</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Casos Graves</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-4xl font-black text-orange-400">{stats.severeCount}</span>
            <span className="text-[9px] font-bold text-slate-400 block mt-1">Casos Graves ou com Cirurgia</span>
          </div>
        </div>
      </div>

      {/* 5. SHARING & FEEDBACK REPORTS (TREINADOR, ATLETA, PAIS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Anatomical Distribution Chart (Col 4) */}
        <div className="lg:col-span-4 p-6 sm:p-8 rounded-[2rem] bg-slate-900/50 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-brand-primary tracking-widest flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" />
              MAPA ANATÔMICO DE IMPACTO
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-6 leading-relaxed">
              Mapeamento de prevalência de queixas por articulação / grupamento
            </p>
          </div>

          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {allLocations.map((loc) => {
              const count = stats.locations[loc] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={loc} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className={count > 0 ? "text-white" : "text-slate-500"}>{loc}</span>
                    <span className={count > 0 ? "text-brand-primary" : "text-slate-500"}>
                      {count} {count === 1 ? "caso" : "casos"} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${count > 0 ? "bg-brand-primary" : "bg-slate-800"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customized Clinical Feedback (Col 8) */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-[2rem] bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase text-brand-primary tracking-widest flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              RELATÓRIO MULTIFOCAL ELITE
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
              Orientações, cuidados integrados e conduta sugerida para cada agente envolvido
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Coach Panel */}
            <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-primary">
                  <User className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Como Treinador</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {stats.active > 0 ? (
                    "Ajuste rigorosamente o plano de carga do atleta. Evite treinos de impacto excêntrico para lesões ativas e preserve os grupos articulares afetados mantendo foco compensatório (ex: treinar parte superior)."
                  ) : stats.observation > 0 ? (
                    "Atleta em transição esportiva de campo. Realizar testes de assimetria de força e carga menor antes de liberar para jogos completos. Foco no volume progressivo."
                  ) : (
                    "Plena capacidade performática para o atleta. Monitorar o estresse fisiológico através do painel de Prontidão (Wellness) diário para evitar picos abruptos de fadiga."
                  )}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800 mt-4">
                <span className="text-[9px] font-black text-brand-primary uppercase">Foco de Ajuste: Volume/Carga</span>
              </div>
            </div>

            {/* Athlete Panel */}
            <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Activity className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Como Atleta</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {stats.active > 0 ? (
                    "Respeite o protocolo estabelecido. Aplique gelo local (20 min) após as sessões de reabilitação fisioterápica. Nunca esconda dores da equipe médica/treinador."
                  ) : stats.observation > 0 ? (
                    "Utilize bandagens, protetores ou aquecimento focado na articulação afetada. Reporte qualquer desconforto antes, durante ou após as sessões imediatamente."
                  ) : (
                    "Invista tempo em reforço preventivo (exercícios acessórios, alongamento focado nas áreas mais afetadas anteriormente no histórico clínico pessoal)."
                  )}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800 mt-4">
                <span className="text-[9px] font-black text-blue-400 uppercase">Foco de Ajuste: Disciplina Clínica</span>
              </div>
            </div>

            {/* Parents Panel */}
            <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Users className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Como Pais</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  {stats.active > 0 ? (
                    "Monitore a ingestão hídrica, qualidade do sono e alimentação anti-inflamatória em casa (reduzir ultraprocessados). O descanso físico domiciliar acarreta a cicatrização acelerada."
                  ) : stats.observation > 0 ? (
                    "Fique alerta à sobrecarga escolar combinada com cansaço físico. Garanta que o atleta aplique as compressas e faça repouso ativo nos dias livres."
                  ) : (
                    "Parabenize a consistência preventiva do atleta e apoie os check-ups regulares de saúde. A alimentação e sono de qualidade permanecem os pilares da saúde do atleta."
                  )}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800 mt-4">
                <span className="text-[9px] font-black text-emerald-400 uppercase">Foco de Ajuste: Nutrição & Sono</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 6. EDITING INJURY MODAL */}
      <AnimatePresence>
        {editingInjury && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/85 backdrop-blur-lg overflow-y-auto p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-gradient-to-br from-[#020617] via-slate-950 to-[#020617] border border-white/10 rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setEditingInjury(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#10b981] uppercase">
                  <Pencil className="w-3 h-3 text-[#10b981]" />
                  EDITAR REGISTRO CLÍNICO
                </div>
                <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white mb-1">
                  Editar Ocorrência de Saúde
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Modifique os parâmetros da lesão ou ative a liberação total do atleta para arquivar a alta.
                </p>
              </div>

              {/* QUICK DISCHARGE BUTTON (Liberar Atleta) */}
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Liberar Atleta para Treino Pleno
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-md">
                      Isso redefinirá o status da ocorrência para <strong className="text-emerald-400">Recuperada</strong> e o estágio de tratamento para <strong className="text-emerald-400">Retorno Pleno</strong>, de forma a liberar o atleta para treinar normalmente mantendo o registro em seu histórico clínico.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInjury(prev => prev ? {
                        ...prev,
                        status: 'Recuperada',
                        rehabStage: 'Retorno Pleno',
                        estimatedReturnDate: ''
                      } : null);
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shrink-0 border h-10 w-full sm:w-auto ${
                      editingInjury.status === 'Recuperada'
                        ? "bg-emerald-500 border-emerald-500 text-[#020617]"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {editingInjury.status === 'Recuperada' ? "Atleta Liberado" : "Liberar Agora"}
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditInjury} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 px-1">
                      Data da Ocorrência
                    </label>
                    <input
                      type="date"
                      value={editingInjury.date}
                      onChange={(e) => setEditingInjury({ ...editingInjury, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#10b981] rounded-xl p-3.5 text-xs text-white font-black outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 px-1">
                      Localização Anatômica
                    </label>
                    <select
                      value={editingInjury.location || "Joelho"}
                      onChange={(e) => setEditingInjury({ ...editingInjury, location: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#10b981] rounded-xl p-3.5 text-xs text-white font-black outline-none"
                    >
                      {allLocations.map(loc => (
                        <option key={loc} value={loc} className="bg-slate-900">{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 px-1">
                      Gravidade da Lesão
                    </label>
                    <select
                      value={editingInjury.severity || "Leve"}
                      onChange={(e) => setEditingInjury({ ...editingInjury, severity: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#10b981] rounded-xl p-3.5 text-xs text-white font-black outline-none"
                    >
                      <option value="Leve" className="bg-slate-900">Leve (1-7 dias)</option>
                      <option value="Moderada" className="bg-slate-900">Moderada (8-28 dias)</option>
                      <option value="Grave" className="bg-slate-900">Grave (&gt;28 dias)</option>
                      <option value="Cirúrgica" className="bg-slate-900">Cirúrgica / Complexo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 px-1">
                      Status Clínico
                    </label>
                    <select
                      value={editingInjury.status}
                      onChange={(e) => setEditingInjury({ ...editingInjury, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#10b981] rounded-xl p-3.5 text-xs text-white font-black outline-none"
                    >
                      <option value="Ativa" className="bg-slate-900">Ativa (Inativo)</option>
                      <option value="Observação" className="bg-slate-900">Observação (Restrito)</option>
                      <option value="Recuperada" className="bg-slate-900">Recuperada (Apto)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 px-1">
                      Descrição / Diagnóstico Clínico
                    </label>
                    <input
                      type="text"
                      value={editingInjury.description}
                      onChange={(e) => setEditingInjury({ ...editingInjury, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#10b981] rounded-xl p-3.5 text-xs text-white font-black outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 px-1">
                      Estágio de Reabilitação
                    </label>
                    <select
                      value={editingInjury.rehabStage || "Fisioterapia"}
                      onChange={(e) => setEditingInjury({ ...editingInjury, rehabStage: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#10b981] rounded-xl p-3.5 text-xs text-white font-black outline-none"
                    >
                      <option value="Fisioterapia" className="bg-slate-900">Fisioterapia Hospitalar/Clínica</option>
                      <option value="Transição Física" className="bg-slate-900">Transição Física (Campo/Academia)</option>
                      <option value="Treino Assistido" className="bg-slate-900">Treino Assistido (Poupando área)</option>
                      <option value="Retorno Pleno" className="bg-slate-900">Retorno Pleno (Competição/Alta Int.)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 px-1">
                      Previsão Estimada de Retorno
                    </label>
                    <input
                      type="date"
                      value={editingInjury.estimatedReturnDate || ""}
                      onChange={(e) => setEditingInjury({ ...editingInjury, estimatedReturnDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#10b981] rounded-xl p-3.5 text-xs text-white font-black outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5 px-1">
                      Conduta Clínia e Exercícios de Reforço
                    </label>
                    <textarea
                      value={editingInjury.notes || ""}
                      onChange={(e) => setEditingInjury({ ...editingInjury, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-[#10b981] rounded-xl p-3.5 text-xs text-white font-black outline-none h-20 resize-none animate-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingInjury(null)}
                    className="w-1/3 border border-slate-800 hover:bg-slate-950 rounded-2xl text-[10px] font-black py-4 uppercase tracking-[0.2em] text-slate-400 transition-all active:scale-95"
                  >
                    Descartar Alterações
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-2/3 text-[10px] font-black py-4 uppercase tracking-[0.2em]"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. CUSTOM DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmDeleteInjury && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/85 backdrop-blur-lg overflow-y-auto p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-gradient-to-br from-[#020617] via-slate-950 to-[#020617] border border-red-500/20 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative space-y-6 text-center"
            >
              <button
                type="button"
                onClick={() => setConfirmDeleteInjury(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-2">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest text-red-400 uppercase">
                  CONFIRMAR EXCLUSÃO
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
                  Excluir Ocorrência?
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Você está prestes a excluir definitivamente o registro clínico de <strong className="text-slate-200">"{confirmDeleteInjury.description}"</strong> de {formatDate(confirmDeleteInjury.date)}. Esta ação removerá permanentemente o item do histórico.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteInjury(null)}
                  className="w-1/2 border border-slate-800 hover:bg-slate-950 rounded-2xl text-[10px] font-black py-4 uppercase tracking-[0.15em] text-slate-400 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveInjury(confirmDeleteInjury.id)}
                  className="w-1/2 bg-red-500 border border-red-500 text-white hover:bg-transparent hover:text-red-500 rounded-2xl text-[10px] font-black py-4 uppercase tracking-[0.15em] transition-all active:scale-95 shadow-lg shadow-red-500/10"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Help button mimic to match project Button template inside App.tsx
const Button: FC<{
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent";
  className?: string;
  onClick?: (e: any) => void;
  type?: "button" | "submit";
}> = ({ children, variant = "primary", className = "", onClick, type = "button" }) => {
  const styles = {
    primary: "bg-brand-primary border border-brand-primary text-brand-dark hover:bg-transparent hover:text-brand-primary shadow-lg shadow-brand-primary/10",
    secondary: "bg-transparent border border-slate-800 text-slate-300 hover:bg-slate-950 hover:border-slate-700",
    accent: "bg-red-500 border border-red-500 text-white hover:bg-transparent hover:text-red-500 shadow-lg shadow-red-500/10",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-6 py-3.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest ${styles[variant]} ${className} active:scale-95`}
    >
      {children}
    </button>
  );
};
