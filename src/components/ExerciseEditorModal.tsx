import React, { FC, useState, useEffect } from "react";
import { X, Save, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { EnrichedExercise } from "../data/exercises";
import { toast } from "react-hot-toast";

interface ExerciseEditorModalProps {
  isOpen: boolean;
  exercise: EnrichedExercise | null; // Null means we're creating a new one
  onClose: () => void;
  onSave: (updated: EnrichedExercise) => void;
}

export const ExerciseEditorModal: FC<ExerciseEditorModalProps> = ({
  isOpen,
  exercise,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<EnrichedExercise>>({});
  const [benefitsText, setBenefitsText] = useState("");
  const [commonErrorsText, setCommonErrorsText] = useState("");
  const [progressionsText, setProgressionsText] = useState("");
  const [regressionsText, setRegressionsText] = useState("");
  const [tagsText, setTagsText] = useState("");

  useEffect(() => {
    if (exercise) {
      setFormData({ ...exercise });
      setBenefitsText((exercise.benefits || []).join("\n"));
      setCommonErrorsText((exercise.commonErrors || []).join("\n"));
      setProgressionsText((exercise.progressions || []).join("\n"));
      setRegressionsText((exercise.regressions || []).join("\n"));
      setTagsText((exercise.tags || []).join(", "));
    } else {
      setFormData({
        name: "",
        category: "MMII",
        muscleGroup: "Geral",
        videoUrl: "",
        defaultReps: "3x10",
        defaultWeight: "BW",
        difficulty: "Intermediário",
        lateralType: "Bilateral",
        physicalQuality: "Geral",
        movementPattern: "",
        equipment: "Halter",
        recommendedRest: "90s",
        recommendedRpe: "8",
        physiologicalGoal: "",
        scientificEvidence: "",
        musclesInvolved: [],
      });
      setBenefitsText("Melhora de força específica\nPrevenção de lesões");
      setCommonErrorsText("Fase excêntrica sem controle");
      setProgressionsText("Aumento de carga");
      setRegressionsText("Menor amplitude");
      setTagsText("#Customizado");
    }
  }, [exercise?.id, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof EnrichedExercise, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("O nome do exercício é obrigatório!");
      return;
    }

    const parseList = (text: string) => {
      return text
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    };

    const parseTags = (text: string) => {
      return text
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    };

    const finalExercise: EnrichedExercise = {
      ...((exercise || {}) as EnrichedExercise),
      id: formData.id || `custom-lib-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: formData.name.trim(),
      category: formData.category || "MMII",
      muscleGroup: formData.muscleGroup || "Geral",
      videoUrl: formData.videoUrl?.trim() || "",
      defaultReps: formData.defaultReps || "3x10",
      defaultWeight: formData.defaultWeight || "BW",
      difficulty: formData.difficulty || "Intermediário",
      lateralType: formData.lateralType || "Bilateral",
      physicalQuality: formData.physicalQuality || "Geral",
      movementPattern: formData.movementPattern || "",
      equipment: formData.equipment || "Geral",
      recommendedRest: formData.recommendedRest || "90s",
      recommendedRpe: formData.recommendedRpe || "8",
      physiologicalGoal: formData.physiologicalGoal || "Foco no desenvolvimento neuromuscular, força e controle de padrão de movimento.",
      scientificEvidence: formData.scientificEvidence || "Diretrizes baseadas em evidências científicas de ciência esportiva.",
      benefits: parseList(benefitsText),
      commonErrors: parseList(commonErrorsText),
      progressions: parseList(progressionsText),
      regressions: parseList(regressionsText),
      musclesInvolved: formData.musclesInvolved?.length ? formData.musclesInvolved : [formData.muscleGroup || "Geral"],
      tags: parseTags(tagsText),
    };

    onSave(finalExercise);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0c111d] border border-slate-850 w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-slate-900 flex items-center justify-between bg-slate-950 shrink-0">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
                <span>{exercise ? "Editar Exercício" : "Novo Exercício Customizado"}</span>
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                {exercise ? "Atualize os metadados técnicos e mídias do exercício" : "Crie um exercício para a biblioteca enriquecida"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-850 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
            
            {/* Seção 1: Identificação Básica */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-slate-900 pb-1">
                1. Informações Básicas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Nome do Exercício *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Agachamento Búlgaro Halter"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Link do Vídeo no YouTube (Opcional)</label>
                  <input
                    type="url"
                    value={formData.videoUrl || ""}
                    onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                    placeholder="Ex: https://www.youtube.com/watch?v=..."
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14] focus:ring-1 focus:ring-[#39FF14]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Categoria</label>
                  <select
                    value={formData.category || "MMII"}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  >
                    <option value="MMII">MMII (Membros Inferiores)</option>
                    <option value="MMSS">MMSS (Membros Superiores)</option>
                    <option value="Potência">Potência</option>
                    <option value="Core">Core</option>
                    <option value="Preventivo">Preventivo</option>
                    <option value="Velocidade">Velocidade</option>
                    <option value="Mobilidade">Mobilidade</option>
                    <option value="Agilidade">Agilidade</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Grupo Muscular Alvo</label>
                  <input
                    type="text"
                    value={formData.muscleGroup || ""}
                    onChange={(e) => handleInputChange("muscleGroup", e.target.value)}
                    placeholder="Ex: Quadríceps, Glúteos"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Lateralidade</label>
                  <select
                    value={formData.lateralType || "Bilateral"}
                    onChange={(e) => handleInputChange("lateralType", e.target.value)}
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  >
                    <option value="Bilateral">Bilateral</option>
                    <option value="Unilateral">Unilateral</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Dificuldade</label>
                  <select
                    value={formData.difficulty || "Intermediário"}
                    onChange={(e) => handleInputChange("difficulty", e.target.value)}
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção 2: Prescrição & Biomecânica */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-slate-900 pb-1">
                2. Detalhes Biomecânicos & Padrão de Prescrição
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Reps/Séries Padrão</label>
                  <input
                    type="text"
                    value={formData.defaultReps || ""}
                    onChange={(e) => handleInputChange("defaultReps", e.target.value)}
                    placeholder="Ex: 3x10 ou 30s"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Carga Padrão</label>
                  <input
                    type="text"
                    value={formData.defaultWeight || ""}
                    onChange={(e) => handleInputChange("defaultWeight", e.target.value)}
                    placeholder="Ex: BW, 15 kg"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Descanso Padrão</label>
                  <input
                    type="text"
                    value={formData.recommendedRest || ""}
                    onChange={(e) => handleInputChange("recommendedRest", e.target.value)}
                    placeholder="Ex: 90s, 2 min"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">PSE Sugerida (1-10)</label>
                  <input
                    type="text"
                    value={formData.recommendedRpe || ""}
                    onChange={(e) => handleInputChange("recommendedRpe", e.target.value)}
                    placeholder="Ex: 8 ou 7-9"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Qualidade Física</label>
                  <input
                    type="text"
                    value={formData.physicalQuality || ""}
                    onChange={(e) => handleInputChange("physicalQuality", e.target.value)}
                    placeholder="Ex: Força Excêntrica"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Padrão de Movimento</label>
                  <input
                    type="text"
                    value={formData.movementPattern || ""}
                    onChange={(e) => handleInputChange("movementPattern", e.target.value)}
                    placeholder="Ex: Empurrar, Agachar"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Equipamento</label>
                  <input
                    type="text"
                    value={formData.equipment || ""}
                    onChange={(e) => handleInputChange("equipment", e.target.value)}
                    placeholder="Ex: Halteres, Barra, BW"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="Ex: #Elite, #Força"
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14]"
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Detalhes Científicos */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-slate-900 pb-1">
                3. Ciência, Benefícios & Execução Técnica (Uma linha por item)
              </h4>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Objetivo Fisiológico / Descrição</label>
                <textarea
                  value={formData.physiologicalGoal || ""}
                  onChange={(e) => handleInputChange("physiologicalGoal", e.target.value)}
                  placeholder="Ex: Foco no aumento de recrutamento de unidades motoras e taxa de desenvolvimento de força..."
                  rows={2}
                  className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-medium outline-none focus:border-[#39FF14] no-scrollbar"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Benefícios e Adaptações (Um por linha)</label>
                  <textarea
                    value={benefitsText}
                    onChange={(e) => setBenefitsText(e.target.value)}
                    placeholder="Melhora de força excêntrica&#10;Melhora do padrão de agachamento"
                    rows={3}
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-[#39FF14] no-scrollbar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Erros Comuns a Evitar (Um por linha)</label>
                  <textarea
                    value={commonErrorsText}
                    onChange={(e) => setCommonErrorsText(e.target.value)}
                    placeholder="Valgo dinâmico acentuado&#10;Falta de controle excêntrico"
                    rows={3}
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-[#39FF14] no-scrollbar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Sugerir Progressões (Uma por linha)</label>
                  <textarea
                    value={progressionsText}
                    onChange={(e) => setProgressionsText(e.target.value)}
                    placeholder="Adicionar carga com colete de peso&#10;Executar em base instável"
                    rows={2}
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-[#39FF14] no-scrollbar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Sugerir Regressões (Uma por linha)</label>
                  <textarea
                    value={regressionsText}
                    onChange={(e) => setRegressionsText(e.target.value)}
                    placeholder="Agachamento búlgaro com apoio das mãos&#10;Reduzir amplitude"
                    rows={2}
                    className="w-full bg-[#161b26] border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-[#39FF14] no-scrollbar"
                  />
                </div>
              </div>
            </div>

          </form>

          {/* Footer Actions */}
          <div className="p-6 bg-[#0c111d] border-t border-slate-900 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl border border-slate-850 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-[#39FF14] hover:bg-[#32e00f] text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#39FF14]/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
