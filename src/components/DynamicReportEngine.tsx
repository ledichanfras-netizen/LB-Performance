import React, { useState, useLayoutEffect, useRef, useEffect, FC } from "react";
import { toJpeg } from "html-to-image";
import { toast } from "react-hot-toast";
import { Printer, Download, BookOpen, ChevronRight, X } from "lucide-react";
import { Athlete } from "../types";

export interface ReportBlock {
  id: string;
  section?: string; // If specified, used for TOC
  forcePageBreak?: boolean; // Force start of a new page
  content: React.ReactNode;
}

interface DynamicReportProps {
  athlete: Athlete;
  reportTitle: string;
  reportSubTitle: string;
  extraStats?: { label: string; value: string | number }[];
  blocks: ReportBlock[];
  onClose: () => void;
  technicalResponsibleName?: string;
  technicalResponsibleCred?: string;
  hideTOC?: boolean;
}

// Fixed Header for every report page with a premium elite look and consistent spacing
export const ReportHeader: FC<{
  title: string;
  subTitle: string;
  athlete: Athlete;
  date: string;
  extraStats?: { label: string; value: string | number }[];
}> = ({ title, subTitle, athlete, date, extraStats }) => (
  <div className="relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 p-5 md:p-6 mb-5 shadow-[0_18px_45px_rgba(6,78,59,0.24)]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_45%)]"></div>
    <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-white/10 blur-3xl"></div>
    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-white/0 via-white/25 to-white/0"></div>

    <div className="relative z-10 w-full">
      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-white/95 flex items-center justify-center p-1 shadow-lg border border-white/40">
          <img
            src="/192x192.png"
            className="w-10 h-10 object-contain"
            alt="Logo"
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-[9px] font-black text-white/80 uppercase tracking-[0.35em] leading-none mb-1">
            Elite Performance Lab
          </h4>
          <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tight leading-none">
            {title}
          </h3>
          <p className="text-[8px] font-black text-white/70 uppercase tracking-[0.4em] mt-1.5 leading-none">
            {subTitle}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 md:gap-5 mt-3 pt-3 border-t border-white/15">
        <div className="flex flex-col">
          <span className="text-[7px] font-black text-white/60 uppercase tracking-[0.3em] mb-0.5">Atleta</span>
          <span className="text-[10px] font-black text-white uppercase italic">{athlete.name}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[7px] font-black text-white/60 uppercase tracking-[0.3em] mb-0.5">Data de Emissão</span>
          <span className="text-[10px] font-black text-white uppercase italic">{date}</span>
        </div>
        {extraStats?.map((stat, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-[7px] font-black text-white/60 uppercase tracking-[0.3em] mb-0.5">{stat.label}</span>
            <span className="text-[10px] font-black text-white uppercase italic">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Fixed Footer for every report page
export const ReportFooter: FC<{
  pageNumber: number;
  totalPages: number;
  technicalResponsibleName?: string;
  technicalResponsibleCred?: string;
}> = ({
  pageNumber,
  totalPages,
  technicalResponsibleName = "Prof. Leandro Barbosa",
  technicalResponsibleCred = "036202-G/PR"
}) => (
  <div className="mt-6 pt-4 border-t border-slate-200/80 flex justify-between items-center bg-white/95 shrink-0 text-left">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
        <img
          src="/192x192.png"
          className="w-5 h-5 object-contain"
          alt="LB"
        />
      </div>
      <div>
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">
          Responsável Técnico
        </p>
        <p className="text-[9px] font-black text-slate-900 uppercase italic leading-none">
          {technicalResponsibleName} ({technicalResponsibleCred})
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.35em] leading-none mb-1">
        Página {pageNumber} de {totalPages}
      </p>
      <div className="flex items-center justify-end gap-2">
        <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
        <p className="text-[6px] font-bold text-slate-400 uppercase tracking-[0.25em] leading-none">
          LB HUB v3.0 • ELITE PERFORMANCE
        </p>
      </div>
    </div>
  </div>
);

export const DynamicReportEngine: FC<DynamicReportProps> = ({
  athlete,
  reportTitle,
  reportSubTitle,
  extraStats,
  blocks,
  onClose,
  technicalResponsibleName,
  technicalResponsibleCred,
  hideTOC = false
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLDivElement>(null);
  
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const [isMeasuring, setIsMeasuring] = useState(true);
  const [paginatedPages, setPaginatedPages] = useState<ReportBlock[][]>([]);
  const [tocSections, setTocSections] = useState<{ name: string; page: number }[]>([]);
  
  const reportDate = new Date().toLocaleDateString("pt-BR");

  // USABLE HEIGHT CALCULATION:
  // A4 Page Height = 297mm.
  // The page uses a premium shell with consistent margins and slightly tighter typography,
  // so the usable content area is intentionally smaller to preserve a clean visual rhythm.
  const maxContentHeight = 640;

  // Measure block heights in a layout effect to get layout-ready pixel sizes
  useLayoutEffect(() => {
    if (!measurerRef.current) return;
    
    const heights: Record<string, number> = {};
    const children = measurerRef.current.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const blockId = child.dataset.blockId;
      if (blockId) {
        // Measure exact height of each block
        heights[blockId] = child.getBoundingClientRect().height;
      }
    }
    
    setMeasuredHeights(heights);
    setIsMeasuring(false);
  }, [blocks]);

  // Once heights are measured, distribute blocks across pages
  useEffect(() => {
    if (isMeasuring || Object.keys(measuredHeights).length === 0) return;

    const computedPages: ReportBlock[][] = [];
    let currentPage: ReportBlock[] = [];
    let currentPageHeight = 0;

    // Filter unique sections for TOC calculation
    const sections: string[] = [];
    blocks.forEach((b) => {
      if (b.section && !sections.includes(b.section)) {
        sections.push(b.section);
      }
    });

    const hasMultipleSections = !hideTOC && sections.length >= 2;
    // Page index offset: if there is an index page, actual content starts on Page 2
    const firstContentPageNum = hasMultipleSections ? 2 : 1;

    blocks.forEach((block) => {
      const blockHeight = measuredHeights[block.id] || 150; // Fallback default height
      
      // space-y-6 adds 24px top margin to every block after the first on the page
      const spacing = currentPage.length > 0 ? 24 : 0;
      const projectedHeight = currentPageHeight + blockHeight + spacing;

      // Start a new page if:
      // 1. Force break is requested
      // 2. Or, adding this block exceeds the maximum content height limit
      const needsNewPage = 
        block.forcePageBreak || 
        (projectedHeight > maxContentHeight && currentPage.length > 0);

      if (needsNewPage) {
        computedPages.push(currentPage);
        currentPage = [block];
        currentPageHeight = blockHeight; // First block on new page, so spacing is 0
      } else {
        currentPage.push(block);
        currentPageHeight = projectedHeight;
      }
    });

    if (currentPage.length > 0) {
      computedPages.push(currentPage);
    }

    // Calculate TOC entries with their page numbers
    const computedToc: { name: string; page: number }[] = [];
    const blockToPageMap: Record<string, number> = {};

    computedPages.forEach((pageBlocks, pageIndex) => {
      const actualPageNum = firstContentPageNum + pageIndex;
      pageBlocks.forEach((block) => {
        blockToPageMap[block.id] = actualPageNum;
        if (block.section && !computedToc.some((t) => t.name === block.section)) {
          computedToc.push({ name: block.section, page: actualPageNum });
        }
      });
    });

    setTocSections(hideTOC ? [] : computedToc);
    setPaginatedPages(computedPages);
  }, [isMeasuring, measuredHeights, blocks, hideTOC]);

  const handlePrint = () => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      toast.error(
        "💡 Para Imprimir / Gerar PDF:\n\nComo você está no visualizador do AI Studio, o navegador bloqueia a impressão nesta janela.\n\nPor favor, abra o aplicativo em uma nova aba clicando no ícone ↗️ (abrir em nova janela) no canto superior direito do AI Studio, e clique em Imprimir por lá!",
        {
          duration: 12000,
          position: "top-center",
          style: {
            maxWidth: "500px",
            background: "#0f172a",
            color: "#ffffff",
            border: "2px solid #10b981",
            fontSize: "14px",
            lineHeight: "1.6",
            padding: "18px",
            borderRadius: "16px",
          }
        }
      );
    } else {
      window.print();
    }
  };

  const handleExportJpeg = async () => {
    if (!reportRef.current) return;
    const toastId = toast.loading("Otimizando e preparando páginas A4 para exportação...");
    try {
      const pages = reportRef.current.querySelectorAll(".report-page");
      const athleteSlug = athlete.name.toLowerCase().replace(/\s+/g, "-");

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const dataUrl = await toJpeg(page, {
          quality: 1.0,
          backgroundColor: "#ffffff",
          pixelRatio: 3, // High scale for clear text and crisp charts
        });
        const link = document.createElement("a");
        link.download = `relatorio-${athleteSlug}-pag-${i + 1}.jpg`;
        link.href = dataUrl;
        link.click();
        await new Promise((r) => setTimeout(r, 450));
      }
      toast.success("Todas as páginas foram geradas com sucesso!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar imagens das páginas.", { id: toastId });
    }
  };

  const totalPages = paginatedPages.length + (tocSections.length >= 2 ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center bg-slate-900/95 backdrop-blur-xl overflow-y-auto p-0 md:p-4 no-scrollbar">
      {/* Hidden measurer container - matches exact width (170mm) of A4 text area for 100% accuracy */}
      <div 
        ref={measurerRef}
        className="absolute pointer-events-none opacity-0"
        style={{ width: "170mm", top: "-9999px", left: "-9999px" }}
      >
        {blocks.map((block) => (
          <div key={block.id} data-block-id={block.id} className="w-full break-inside-avoid mb-6">
            {block.content}
          </div>
        ))}
      </div>

      <div className="max-w-5xl w-full mx-auto md:my-10 h-full md:h-auto font-sans relative">
        {/* Printable/exportable container */}
        <div ref={reportRef} className="print-container bg-slate-150/10 md:bg-transparent">
          
          {/* 1. AUTOMATIC INDEX PAGE (TOC) - Shown only when report has multiple sections */}
          {tocSections.length >= 2 && (
            <div
              className="report-page page-break bg-white text-slate-950 my-10 mx-auto overflow-hidden relative text-left rounded-[28px] border border-slate-200/70"
              style={{ width: "210mm", height: "297mm", padding: "14mm 16mm 14mm 16mm", boxSizing: "border-box" }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.05),transparent_38%)]"></div>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"></div>

              <div className="flex flex-col h-full justify-between relative z-10" style={{ height: "269mm" }}>
                <div>
                  <ReportHeader
                    title={reportTitle}
                    subTitle="ÍNDICE DE SEÇÕES & ESTRUTURA METODOLÓGICA"
                    athlete={athlete}
                    date={reportDate}
                    extraStats={extraStats}
                  />

                  <div className="report-content-stack space-y-6 mt-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                        Índice Geral do Relatório
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Este documento técnico de alta performance está organizado em módulos lógicos indivisíveis. 
                      Abaixo consta a localização exata de cada seção analítica para guiar a tomada de decisão da comissão técnica.
                    </p>

                    <div className="space-y-4 pt-4">
                      {tocSections.map((sec, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/40 hover:bg-emerald-50/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                              {sec.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 font-mono">Pág.</span>
                            <span className="text-xs font-black text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                              {sec.page}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Metodological Disclaimer */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl mt-8">
                      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2">
                        Nota de Confidencialidade e Metodologia
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        As informações contidas neste laudo são geradas por algoritmos cinéticos, testes de força reativa (RSI), avaliações antropométricas e de bioimpedância em laboratório, sob a chancela da LB Elite Performance. Uso estritamente profissional e confidencial.
                      </p>
                    </div>
                  </div>
                </div>

                <ReportFooter 
                  pageNumber={1} 
                  totalPages={totalPages} 
                  technicalResponsibleName={technicalResponsibleName}
                  technicalResponsibleCred={technicalResponsibleCred}
                />
              </div>
            </div>
          )}

          {/* 2. DYNAMICALLY PAGINATED PAGES */}
          {!isMeasuring && paginatedPages.map((pageBlocks, pageIndex) => {
            const pageNum = (tocSections.length >= 2 ? 2 : 1) + pageIndex;
            return (
              <div
                key={pageIndex}
                className="report-page page-break bg-white text-slate-950 my-10 mx-auto overflow-hidden relative text-left rounded-[28px] border border-slate-200/70"
                style={{ width: "210mm", height: "297mm", padding: "14mm 16mm 14mm 16mm", boxSizing: "border-box" }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.05),transparent_38%)]"></div>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"></div>

                <div className="flex flex-col h-full justify-between relative z-10" style={{ height: "269mm" }}>
                  <div className="flex-grow">
                    <ReportHeader
                      title={reportTitle}
                      subTitle={reportSubTitle}
                      athlete={athlete}
                      date={reportDate}
                      extraStats={extraStats}
                    />

                    {/* Content Blocks for this specific page */}
                    <div className="report-content-stack space-y-4">
                      {pageBlocks.map((block) => (
                        <div key={block.id} className="w-full break-inside-avoid report-block-card">
                          {block.content}
                        </div>
                      ))}
                    </div>
                  </div>

                  <ReportFooter 
                    pageNumber={pageNum} 
                    totalPages={totalPages} 
                    technicalResponsibleName={technicalResponsibleName}
                    technicalResponsibleCred={technicalResponsibleCred}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons Row / Controls (no-print) */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 no-print pb-20 px-4 md:px-0 font-sans max-w-5xl w-full mx-auto">
          <button
            onClick={handleExportJpeg}
            className="flex-grow flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer font-sans"
          >
            <Download size={20} /> Baixar Páginas (JPEG)
          </button>
          <button
            onClick={handlePrint}
            className="flex-grow flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95 cursor-pointer font-sans"
          >
            <Printer size={20} /> Imprimir / PDF
          </button>
          <button
            onClick={onClose}
            className="flex-grow flex items-center justify-center gap-2 bg-slate-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 transition-all active:scale-95 cursor-pointer font-sans"
          >
            <X size={20} /> Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
