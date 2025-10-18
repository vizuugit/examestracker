export interface ExamInsight {
  nome: string;
  categoria: string;
  resultado: string;
  unidade: string;
  referencia_min: number | null;
  referencia_max: number | null;
  status: 'normal' | 'alto' | 'baixo' | 'crítico';
  desvio_percentual: number | null;
  observacao: string | null;
  explicacao_leiga: string | null;
  possiveis_causas_alteracao: string[] | null;
}

export interface ClinicalAnalysis {
  resumo_executivo: string;
  areas_atencao: string[];
  correlacoes_importantes: Array<{
    exames_relacionados: string[];
    interpretacao: string;
    relevancia_clinica: 'baixa' | 'média' | 'alta';
  }>;
  score_saude_geral: number;
  categoria_risco: 'baixo' | 'moderado' | 'alto' | 'crítico';
}

export interface ExamAlert {
  tipo: 'crítico' | 'urgente' | 'atenção' | 'informativo';
  exame: string;
  mensagem: string;
  acao_sugerida: string;
}

export interface ExamTrends {
  melhorias: string[];
  pioras: string[];
  estavel: string[];
}

export interface ExamRecommendation {
  categoria: 'consulta' | 'estilo_vida' | 'medicacao' | 'novo_exame' | 'monitoramento';
  prioridade: 'baixa' | 'média' | 'alta' | 'urgente';
  descricao: string;
}

export interface ExamWithInsights {
  id: string;
  exam_date: string;
  laboratory: string;
  health_score: number | null;
  risk_category: string | null;
  clinical_analysis: ClinicalAnalysis | null;
  alerts: ExamAlert[] | null;
  trends: ExamTrends | null;
  recommendations: ExamRecommendation[] | null;
  total_biomarkers: number | null;
  processing_status: string;
}
