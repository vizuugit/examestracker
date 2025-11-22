import { Activity, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeroStatsProps {
  patientName: string;
  totalExams: number;
  normalCount: number;
  attentionCount: number;
  healthScore: number;
  lastUpdate: Date;
}

export function HeroStats({
  patientName,
  totalExams,
  normalCount,
  attentionCount,
  healthScore,
  lastUpdate,
}: HeroStatsProps) {
  return (
    <div className="bg-gradient-to-br from-medical-purple-600 via-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl text-white mb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{patientName}</h1>
          <p className="text-purple-200 text-lg">Dashboard de Saúde</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-purple-200 mb-1">Última atualização</div>
          <div className="text-lg font-semibold">
            {format(lastUpdate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Exames */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 transition-all hover:bg-white/15">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm text-purple-100">Total de Exames</span>
          </div>
          <div className="text-3xl font-bold">{totalExams}</div>
        </div>

        {/* Biomarcadores Normais */}
        <div className="bg-green-500/20 backdrop-blur-sm rounded-2xl p-5 border border-green-400/30 transition-all hover:bg-green-500/25">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm text-green-100">Normais</span>
          </div>
          <div className="text-3xl font-bold text-green-100">{normalCount}</div>
        </div>

        {/* Atenção Necessária */}
        <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-5 border border-amber-400/30 transition-all hover:bg-amber-500/25">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm text-amber-100">Atenção</span>
          </div>
          <div className="text-3xl font-bold text-amber-100">{attentionCount}</div>
        </div>

        {/* Score de Saúde */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 transition-all hover:bg-white/15">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm text-purple-100">Score de Saúde</span>
          </div>
          <div className="text-3xl font-bold">{healthScore}/100</div>
          <div className="text-xs text-green-300 mt-1">
            {healthScore >= 80 ? '↗ Excelente' : healthScore >= 60 ? '→ Bom' : '↘ Atenção'}
          </div>
        </div>
      </div>
    </div>
  );
}
