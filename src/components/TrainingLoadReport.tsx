import React from "react";
import { 
  TrendingUp, 
  Activity, 
  Gauge, 
  Award,
  Calendar
} from "lucide-react";
import { Athlete, Workout, ExternalSession } from "../types";
import { DynamicReportEngine, ReportBlock } from "./DynamicReportEngine";
import { calculateACWR } from "../utils";

interface TrainingLoadReportProps {
  athlete: Athlete;
  onClose?: () => void;
}

export const TrainingLoadReport: React.FC<TrainingLoadReportProps> = ({ athlete, onClose }) => {
  const workouts: Workout[] = athlete.workouts || [];
  const externalSessions: ExternalSession[] = athlete.externalSessions || [];
  
  const computedAcwr = calculateACWR(workouts, externalSessions);
  const acwr = computedAcwr.ratio;
  const acuteLoad = Math.round(computedAcwr.acute);
  const chronicLoad = Math.round(computedAcwr.chronic);

  // Set default/standard training feedback based on ACWR
  let acwrStatus = "Sobrecarga Saudável";
  let acwrColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
  let feedbackText = "O atleta encontra-se na zona de equilíbrio ótimo ('Sweet Spot', ACWR entre 0.8 e 1.3). Esse índice promove a supercompensação cardiovascular e neuromuscular, maximizando o ganho físico e reduzindo drasticamente as chances de lesões de tecidos moles.";
  let actionText = "Manter o microciclo planejado de treinamento sem restrições de volume ou intensidade. Continuar o monitoramento diário de wellness.";

  if (acwr < 0.8) {
    acwrStatus = "Subtreinamento (Under-trained)";
    acwrColor = "text-amber-600 bg-amber-50 border-amber-100";
    feedbackText = "Índice ACWR abaixo do Sweet Spot recomendado (< 0.8). O atleta está exposto a um destreinamento funcional e perda de robustez física. O risco de lesões aumenta indiretamente quando o atleta for exposto a picos súbitos de intensidade futura.";
    actionText = "Programar aumentos graduais e lineares de carga mecânica e volume nas próximas sessões de campo/quadra para recalibrar a tolerância ao esforço.";
  } else if (acwr > 1.3 && acwr <= 1.5) {
    acwrStatus = "Zona de Alerta (Danger Zone)";
    acwrColor = "text-orange-600 bg-orange-50 border-orange-100";
    feedbackText = "ACWR em zona de transição limítrofe (1.3 - 1.5). O acúmulo de estresse agudo está ligeiramente desequilibrado em relação à capacidade crônica desenvolvida. O sistema neuromuscular do atleta apresenta sinais latentes de fadiga.";
    actionText = "Recomenda-se realizar treinos de intensidade moderada e corte de 15% no volume mecânico total da próxima sessão principal.";
  } else if (acwr > 1.5) {
    acwrStatus = "Zona de Perigo Extremo (Extreme Overload)";
    acwrColor = "text-rose-600 bg-rose-50 border-rose-100";
    feedbackText = "O atleta ultrapassou a 'Zona de Perigo' (ACWR > 1.5). O risco relativo de ocorrência de lesões musculares por estresse mecânico, contraturas severas ou estiramentos ligamentares está multiplicado por até 4 vezes nas próximas 72 horas.";
    actionText = "Prescrever sessão regenerativa (recovery ativo) imediata. Reduzir as demandas pliométricas e sprints de alta velocidade nas próximas duas sessões de campo.";
  }

  // Combine and sort sessions to show recent trends in graph
  const allSessions = [
    ...workouts.filter((w) => w.status === "completed" && w.rpe).map((w) => ({
      date: w.date,
      load: (w.durationMinutes || 0) * (w.rpe || 0),
    })),
    ...externalSessions.map((s) => ({
      date: s.date,
      load: s.load || ((s.durationMinutes || 0) * (s.rpe || 0)),
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentSessionsWithLoad = allSessions.slice(-8).map((s) => ({
    date: new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    load: s.load,
  }));

  const blocks: ReportBlock[] = [
    {
      id: "metodologia",
      section: "Fundamentação Metodológica",
      content: (
        <div className="space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left">
          <div className="flex items-center gap-2 text-emerald-650">
            <Calendar className="w-4.5 h-4.5 text-emerald-600" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-750 font-sans">
              Fundamentação Metodológica do ACWR e PSR
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
            O cálculo do <strong>Acute:Chronic Workload Ratio (ACWR)</strong> é o principal biomarcador cinético utilizado por clubes profissionais de elite em todo o mundo para monitorar o estresse físico e de fadiga. A carga aguda (soma do produto volume x intensidade das sessões dos últimos 7 dias) representa a <strong>Fadiga</strong> do atleta. A carga crônica (média semanal das sessões dos últimos 28 dias) expressa o nível de <strong>Aptidão</strong> (fitness).
          </p>
          <p className="text-xs text-slate-700 leading-relaxed font-semibold font-sans">
            O equilíbrio matemático entre Fadiga e Aptidão (Relação Aguda/Crônica) determina a prontidão mecânica do sistema motor. A literatura em medicina desportiva comprova que manter o ACWR dentro do "Sweet Spot" (0.8 a 1.3) protege o atleta e desenvolve resiliência mecânica sustentável.
          </p>
        </div>
      )
    },
    {
      id: "load_chart_block",
      section: "Tendências de Carga",
      forcePageBreak: true,
      content: (
        <div className="grid grid-cols-12 gap-5 text-left">
          {/* Load trends graph */}
          <div className="col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 font-sans">Visão de Ciclagem</span>
              <p className="text-[10px] font-bold text-slate-500 font-sans">Tendência de Carga nas Últimas Sessões (Unidades Arbitrárias)</p>
            </div>

            {/* Custom SVG line-and-bar load trend chart */}
            <div className="relative w-full py-4 flex items-center justify-center">
              {recentSessionsWithLoad.length > 0 ? (
                <svg className="w-full h-auto max-h-[160px]" viewBox="0 0 500 150">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="55" x2="480" y2="55" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="90" x2="480" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="120" x2="480" y2="120" stroke="#cbd5e1" strokeWidth="1" />

                  {(() => {
                    const maxLoad = Math.max(...recentSessionsWithLoad.map((d) => d.load), 600);
                    const points: string[] = [];
                    const renderedElements: React.ReactNode[] = [];

                    recentSessionsWithLoad.forEach((d, idx) => {
                      const x = 50 + idx * (410 / (recentSessionsWithLoad.length - 1 || 1));
                      // Scale load to graph height (from y=20 to y=120, height = 100)
                      const valPercent = d.load / maxLoad;
                      const y = 120 - valPercent * 90;

                      points.push(`${x},${y}`);

                      // Draw bar for load
                      renderedElements.push(
                        <g key={`bar-${idx}`}>
                          <rect 
                            x={x - 10} 
                            y={y} 
                            width="20" 
                            height={120 - y} 
                            rx="3" 
                            fill="#10b981" 
                            fillOpacity="0.15" 
                            stroke="#10b981"
                            strokeWidth="1.5"
                          />
                          <text x={x} y="136" className="fill-slate-600 font-sans text-[8px] font-black" textAnchor="middle">
                            {d.date}
                          </text>
                          <text x={x} y={y - 6} className="fill-slate-900 font-mono text-[8px] font-black" textAnchor="middle">
                            {d.load}
                          </text>
                        </g>
                      );
                    });

                    // Draw connect line
                    if (points.length > 1) {
                      renderedElements.unshift(
                        <polyline 
                          key="line" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                          strokeDasharray="4 2"
                          points={points.join(" ")} 
                        />
                      );
                    }

                    return renderedElements;
                  })()}
                </svg>
              ) : (
                <div className="py-12 text-center text-slate-400 w-full">
                  <p className="text-[10px] font-bold uppercase font-sans">Sem sessões registradas recentemente para traçar gráfico.</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex gap-4 text-[7.5px] font-black text-slate-400 uppercase tracking-wider justify-center font-mono">
              <span>• BARRAS (CARGA TOTAL / SESSÃO)</span>
              <span>• LINHA DASHED (TENDÊNCIA CINÉTICA)</span>
            </div>
          </div>

          {/* Current indices statistics info */}
          <div className="col-span-4 flex flex-col gap-4">
            {/* Index card ACWR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between flex-grow">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5 font-sans">Relação Operacional</span>
                <h4 className="text-[10.5px] font-black text-slate-900 uppercase font-sans">ACWR do Atleta</h4>
              </div>

              <div className="py-4 text-center">
                <span className="text-4xl font-black text-emerald-600 font-mono italic tracking-tighter leading-none">
                  {acwr > 0 ? acwr.toFixed(2) : "0.00"}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-wider block px-2.5 py-1 rounded-full border mt-2.5 font-sans ${acwrColor}`}>
                  {acwrStatus}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-2.5 text-[8.5px] text-slate-400 font-medium leading-normal font-sans">
                Limite Seguro: <strong className="text-slate-600 font-bold font-sans">0.80 - 1.30</strong>. Zona perigosa de risco exponencial: <strong className="text-slate-600 font-bold font-sans">&gt; 1.50</strong>.
              </div>
            </div>

            {/* Micro and macro metrics */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between font-sans">
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider font-sans">Carga Aguda (7d)</span>
                  <span className="text-[11px] font-black text-slate-800 font-mono italic">{acuteLoad} u.a.</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider font-sans">Carga Crônica (28d)</span>
                  <span className="text-[11px] font-black text-slate-800 font-mono italic">{chronicLoad} u.a.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider font-sans">Média RPE Geral</span>
                  <span className="text-[11px] font-black text-slate-800 font-mono italic">
                    {allSessions.length > 0 
                      ? (allSessions.reduce((sum, s) => sum + s.load, 0) / allSessions.length / 60).toFixed(1)
                      : "0.0"} /10
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "diagnostico_metabolico",
      section: "Análise de Prontidão",
      content: (
        <div className="grid grid-cols-2 gap-5 text-left">
          {/* Interpretacao do LB */}
          <div className="p-5 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Gauge className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[7px] font-black text-emerald-600 block uppercase tracking-wider font-sans">Racional Clínico</span>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase font-sans">Interpretação e Diagnóstico de Ciclagem</h4>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-bold border-t border-slate-100 pt-3 italic font-sans">
                "{feedbackText}"
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-150 flex items-center gap-2 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">
                Indicação Cineto-Muscular: ESTÁVEL
              </p>
            </div>
          </div>

          {/* Ajustes prescritos */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center text-white shrink-0">
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <span className="text-[7px] font-black text-slate-400 block uppercase tracking-wider font-sans">Prescrição do Treinador</span>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase font-sans">Ajustes de Sessão Recomentados</h4>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-bold border-t border-slate-100 pt-3 italic font-sans">
                "{actionText}"
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-150 flex items-center gap-2 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">
                Protocolo: LB ELITE PERFORMANCE
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "metodos_recuperacao",
      section: "Plano de Recuperação",
      forcePageBreak: true,
      content: (
        <div className="space-y-4 text-left font-sans">
          <div className="flex items-center gap-2 mb-1.5">
            <Award className="w-4.5 h-4.5 text-emerald-600" />
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-sans">
              Controle de Carga de Elite e Estratégia de Regeneração
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Visando blindar a estrutura mecânica do atleta contra descompensações funcionais e lesões graves por fadiga excessiva acumulada, a comissão multidisciplinar prescreve as seguintes intervenções científicas complementares ao plano de sessões táticas ordinárias:
          </p>

          <div className="grid grid-cols-2 gap-5 mt-3 font-sans">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h5 className="text-[9.5px] font-black text-slate-900 uppercase mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Método 1: Crioterapia por Imersão (Ice Bath)
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Sessão de imersão de 10-12 minutos a uma temperatura de 10°C a 12°C em até 2 horas pós-treino longo. Reduz citocinas pró-inflamatórias musculares e atenua a percepção subjetiva de dor muscular tardia (DOMS).
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h5 className="text-[9.5px] font-black text-slate-900 uppercase mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Método 2: Nutrição e Ciclagem de Glicogênio
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Ingestão imediata pós-esforço de proporção 3:1 de carboidratos complexos de rápida absorção e proteínas isoladas de alto valor biológico (Whey/Caseína) para restabelecer os estoques musculares e acelerar a síntese proteica.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-6 text-[10px] text-slate-500 font-bold leading-relaxed text-center italic">
            "Este controle é atualizado automaticamente a cada sessão inserida no LB Hub, gerando feedbacks de alerta preventivos em tempo real para a comissão multidisciplinar."
          </div>
        </div>
      )
    }
  ];

  return (
    <DynamicReportEngine
      athlete={athlete}
      reportTitle="CONTROLE DE CARGA ACUMULADA & ACWR"
      reportSubTitle="MONITORAMENTO DIÁRIO DA RELAÇÃO FADIGA-APTIDÃO"
      extraStats={[
        { label: "ACWR ATUAL", value: acwr > 0 ? acwr.toFixed(2) : "0.00" },
        { label: "STATUS ACWR", value: acwrStatus.toUpperCase() }
      ]}
      blocks={blocks}
      onClose={onClose || (() => {})}
    />
  );
};
