import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BiomarkerTrackingTable } from '@/components/BiomarkerTrackingTable';
import { Skeleton } from '@/components/ui/skeleton';
import { categorizeBiomarker } from '@/utils/biomarkerCategories';
import { normalizeBiomarkerWithTable } from '@/utils/biomarkerNormalization';
import { CATEGORY_DISPLAY_ORDER, BIOMARKER_DISPLAY_ORDER, getCategoryOrder, getBiomarkerOrder } from '@/utils/biomarkerDisplayOrder';
import { isLeukocyteType } from '@/utils/leukocyteFormatter';

/**
 * Normaliza e simplifica nomes de biomarcadores
 */
function normalizeAndSimplifyBiomarkerName(name: string): { 
  normalizedKey: string; 
  displayName: string;
} {
  if (!name) return { normalizedKey: "", displayName: "" };
  
  let normalized = name.toLowerCase();
  let displayName = name;
  
  // Simplificar nomes específicos de leucócitos
  if (normalized.includes('neutrófilos bastonetes') || normalized.includes('neutrofilos bastonetes')) {
    displayName = 'Bastonetes';
    normalized = 'bastonetes';
  } else if (normalized.includes('neutrófilos segmentados') || normalized.includes('neutrofilos segmentados')) {
    displayName = 'Segmentados';
    normalized = 'segmentados';
  }
  
  // Remover parênteses e palavras de ruído para normalização
  normalized = normalized.replace(/\([^)]*\)/g, '');
  const noiseWords = ['de', 'da', 'do', 'jejum', 'soro', 'sangue', 'total', '-'];
  const words = normalized.split(/\s+/);
  const filtered = words.filter(w => w.trim() && !noiseWords.includes(w.trim()));
  
  return { 
    normalizedKey: filtered.join(' ').trim(),
    displayName 
  };
}

/**
 * Calcula score de completude do biomarcador
 */
function calculateCompletenessScore(data: any): number {
  let score = 0;
  if (data.value) score += 10;
  if (data.unit) score += 5;
  if (data.reference_min !== null) score += 3;
  if (data.reference_max !== null) score += 3;
  if (data.status) score += 2;
  return score;
}

/**
 * Normaliza nome da categoria para unificar variações
 */
function normalizeCategoryName(category: string | null): string {
  if (!category) return 'outros';
  
  const normalized = category.toLowerCase().trim();
  
  const categoryMap: Record<string, string> = {
    // Hematológico
    'hemograma': 'hematologico',
    'hematológico': 'hematologico',
    'hematologia': 'hematologico',
    'sangue': 'hematologico',
    'serie vermelha': 'hematologico',
    'série vermelha': 'hematologico',
    'serie branca': 'hematologico',
    'série branca': 'hematologico',
    'eritrograma': 'hematologico',
    'leucograma': 'hematologico',
    'série plaquetária': 'hematologico',
    'serie plaquetaria': 'hematologico',
    
    // Metabólico
    'metabolismo': 'metabolico',
    'metabólico': 'metabolico',
    'lipídico': 'metabolico',
    'lipidico': 'metabolico',
    'perfil lipídico': 'metabolico',
    'perfil lipidico': 'metabolico',
    'glicemia': 'metabolico',
    'bioquímica': 'metabolico',
    'bioquimica': 'metabolico',
    'risco cardiovascular': 'metabolico',
    'fator cardiovascular': 'metabolico',
    'cardiovascular': 'metabolico',
    'glicemia e diabetes': 'metabolico',
    'metabolismo da glicose': 'metabolico',
    
    // Hepático
    'fígado': 'hepatico',
    'figado': 'hepatico',
    'hepático': 'hepatico',
    'hepatico': 'hepatico',
    'função hepática': 'hepatico',
    'funcao hepatica': 'hepatico',
    
    // Renal
    'rim': 'renal',
    'rins': 'renal',
    'função renal': 'renal',
    'funcao renal': 'renal',
    
    // Íons
    'eletrólitos': 'ions',
    'eletrolitos': 'ions',
    'íons': 'ions',
    'ionograma': 'ions',
    
    // Hormonal
    'hormônio': 'hormonal',
    'hormonio': 'hormonal',
    'hormônios': 'hormonal',
    'hormonios': 'hormonal',
    'tireoide': 'hormonal',
    'tireóide': 'hormonal',
    'hormônios sexuais': 'hormonal',
    'hormonios sexuais': 'hormonal',
    'hormônios tireoidianos': 'hormonal',
    'hormonios tireoidianos': 'hormonal',
    'função tireoideana': 'hormonal',
    'funcao tireoideana': 'hormonal',
    
    // Vitaminas e Minerais
    'vitamina': 'vitaminas_minerais',
    'vitaminas': 'vitaminas_minerais',
    'mineral': 'vitaminas_minerais',
    'minerais': 'vitaminas_minerais',
    'ferro': 'vitaminas_minerais',
    'minerais e vitaminas': 'vitaminas_minerais',
    'vitaminas e minerais': 'vitaminas_minerais',
    'metabolismo do ferro': 'vitaminas_minerais',
    'metais': 'vitaminas_minerais',
    'metais pesados': 'vitaminas_minerais',
    
    // Marcadores Inflamatórios
    'inflamação': 'marcadores_inflamatorios',
    'inflamacao': 'marcadores_inflamatorios',
    'inflamatório': 'marcadores_inflamatorios',
    'inflamatorio': 'marcadores_inflamatorios',
    'marcadores inflamatórios': 'marcadores_inflamatorios',
    'marcadores inflamatorios': 'marcadores_inflamatorios',
    'imunologia': 'marcadores_inflamatorios',
    
    // Marcadores Musculares
    'músculo': 'marcadores_musculares',
    'musculo': 'marcadores_musculares',
    'músculos': 'marcadores_musculares',
    'musculos': 'marcadores_musculares',
    'muscular': 'marcadores_musculares',
    'marcadores musculares': 'marcadores_musculares',
    
    // Marcadores Prostáticos
    'próstata': 'marcadores_prostaticos',
    'prostata': 'marcadores_prostaticos',
    'prostático': 'marcadores_prostaticos',
    'prostatico': 'marcadores_prostaticos',
    'marcadores prostáticos': 'marcadores_prostaticos',
    'marcadores prostaticos': 'marcadores_prostaticos'
  };
  
  return categoryMap[normalized] || 'outros';
}

export default function PatientDashboard() {
  const { id } = useParams();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: trackingTableData, isLoading: trackingLoading } = useQuery({
    queryKey: ['patient-tracking-table', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          id,
          biomarker_name,
          value,
          value_numeric,
          unit,
          reference_min,
          reference_max,
          status,
          category,
          manually_corrected,
          exams!inner (
            id,
            exam_date,
            laboratory,
            patient_id,
            created_at
          )
        `)
        .eq('exams.patient_id', id)
        .order('exam_date', { ascending: true, foreignTable: 'exams' })
        .order('created_at', { ascending: false, foreignTable: 'exams' });
      
      if (error) throw error;

      // Estruturar dados por biomarcador com deduplicação e consolidação de leucócitos
      const biomarkerMap = new Map<string, any>();
      const examDatesSet = new Set<string>();
      
      // Mapa temporário para consolidar valores por data (para leucócitos)
      const leukocytesByDate = new Map<string, Map<string, { absolute: any, percent: any }>>();

        // Lista de biomarcadores a serem excluídos (títulos/cabeçalhos do laudo)
        const EXCLUDED_BIOMARKERS = [
          'hemograma',
          'leucograma',
          'plaquetograma',
          'eritrograma',
          'série vermelha',
          'serie vermelha'
        ];

        data?.forEach((result: any) => {
          const originalName = result.biomarker_name;
          
          // Sempre usar tableMatch se existir (fonte única de verdade)
          const tableMatch = normalizeBiomarkerWithTable(originalName);
          
          let finalKey: string;
          let finalDisplayName: string;
          
          if (tableMatch) {
            // Se tem tableMatch, simplificar o nome normalizado
            const { normalizedKey, displayName } = normalizeAndSimplifyBiomarkerName(tableMatch.normalizedName);
            finalKey = normalizedKey;
            finalDisplayName = displayName;
          } else {
            // Caso contrário, simplificar o nome original
            const { normalizedKey, displayName } = normalizeAndSimplifyBiomarkerName(originalName);
            finalKey = normalizedKey;
            finalDisplayName = displayName;
          }
          
          // Pular biomarcadores que são apenas títulos
          if (EXCLUDED_BIOMARKERS.includes(finalKey)) {
            return;
          }
        
        const examId = result.exams.id;
        const examDate = result.exams.exam_date || result.exams.created_at;
        const isEstimatedDate = !result.exams.exam_date;
        
        examDatesSet.add(`${examId}|${examDate}|${isEstimatedDate ? 'estimated' : 'manual'}`);

        // Normalizar categoria
        let category: string;
        if (tableMatch?.category) {
          category = tableMatch.category;
        } else {
          const rawCategory = result.category || categorizeBiomarker(originalName);
          category = normalizeCategoryName(rawCategory);
        }

        // Detectar se é leucócito para consolidar por data
        const isLeukocyte = isLeukocyteType(originalName);
        
        if (isLeukocyte) {
          // Criar chave única por data e biomarcador
          const dateKey = examDate || examId;
          if (!leukocytesByDate.has(dateKey)) {
            leukocytesByDate.set(dateKey, new Map());
          }
          const dateMap = leukocytesByDate.get(dateKey)!;
          
          if (!dateMap.has(finalKey)) {
            dateMap.set(finalKey, { absolute: null, percent: null });
          }
          
          const leukocyteData = dateMap.get(finalKey)!;
          
          // Armazenar valor absoluto ou percentual
          if (result.unit === '%') {
            leukocyteData.percent = result;
          } else if (result.unit === '/mm³' || result.unit === 'mil/mm³' || result.unit === '/µL') {
            leukocyteData.absolute = result;
          }
        }

        // Se biomarcador não existe, criar entrada
        if (!biomarkerMap.has(finalKey)) {
          biomarkerMap.set(finalKey, {
            biomarker_name: finalDisplayName,
            unit: tableMatch?.unit || result.unit,
            reference_min: result.reference_min,
            reference_max: result.reference_max,
            category,
            values: new Map(),
            completeness_score: calculateCompletenessScore(result),
            category_source: tableMatch?.category ? 'normalization_table' : 'database'
          });
        } else {
          // Biomarcador já existe, verificar se devemos atualizar metadados
          const existing = biomarkerMap.get(finalKey)!;
          const newScore = calculateCompletenessScore(result);
          
          if (tableMatch?.category && existing.category_source !== 'normalization_table') {
            existing.category = category;
            existing.category_source = 'normalization_table';
          }
          
          if (newScore > existing.completeness_score) {
            existing.biomarker_name = finalDisplayName;
            existing.unit = result.unit || existing.unit;
            existing.reference_min = result.reference_min ?? existing.reference_min;
            existing.reference_max = result.reference_max ?? existing.reference_max;
            existing.completeness_score = newScore;
          }
        }

        const biomarkerData = biomarkerMap.get(finalKey)!;
        
        // Para não-leucócitos ou casos onde não consolidamos, adicionar diretamente
        if (!isLeukocyte) {
          if (!biomarkerData.values.has(examId)) {
            biomarkerData.values.set(examId, {
              result_id: result.id,
              exam_id: examId,
              exam_date: examDate,
              value: result.value,
              value_numeric: result.value_numeric,
              status: result.status,
              manually_corrected: result.manually_corrected || false,
            });
          }
        }
      });
      
      // Segunda passagem: consolidar leucócitos por data E calcular valores absolutos faltantes
      leukocytesByDate.forEach((dateMap, dateKey) => {
        // 1️⃣ Buscar contagem de leucócitos para esta data
        let totalLeukocytes: number | null = null;
        
        const leukocytesKey = 'leucocitos';
        const leukocytesInfo = biomarkerMap.get(leukocytesKey);
        
        if (leukocytesInfo) {
          for (const [examId, valueData] of leukocytesInfo.values) {
            const examDate = valueData.exam_date;
            const valueExamKey = examDate || examId;
            
            // Buscar por dateKey E aceitar value se value_numeric for null
            if (valueExamKey === dateKey) {
              const rawValue = valueData.value_numeric || valueData.value;
              if (rawValue) {
                totalLeukocytes = Number(rawValue);
                if (!isNaN(totalLeukocytes) && totalLeukocytes > 0) {
                  break; // Encontrou valor válido
                }
              }
            }
          }
        }
        
        // 2️⃣ Consolidar cada tipo de leucócito
        dateMap.forEach((leukocyteData, biomarkerKey) => {
          const biomarkerInfo = biomarkerMap.get(biomarkerKey);
          if (!biomarkerInfo) return;
          
          const { absolute, percent } = leukocyteData;
          
          // 3️⃣ NOVO: Calcular valor absoluto se ausente
          let calculatedAbsolute = absolute;
          let originalPercent = percent; // ✅ Preservar percentual original
          
          if (!absolute && percent && totalLeukocytes) {
            const percentValue = Number(percent.value_numeric || percent.value);
            
            if (!isNaN(percentValue) && percentValue >= 0) {
              const absoluteValue = Math.round((percentValue / 100) * totalLeukocytes);
              
              // Criar objeto "result" sintético com valor calculado
              calculatedAbsolute = {
                ...percent,
                value: String(absoluteValue),
                value_numeric: absoluteValue,
                unit: '/mm³'
              };
            }
          }
          
          // 4️⃣ Priorizar valor absoluto (calculado ou original)
          const primaryResult = calculatedAbsolute || percent;
          if (!primaryResult) return;
          
          const examId = primaryResult.exams.id;
          const examDate = primaryResult.exams.exam_date || primaryResult.exams.created_at;
          
          // Adicionar valor consolidado
          biomarkerInfo.values.set(examId, {
            result_id: primaryResult.id,
            exam_id: examId,
            exam_date: examDate,
            value: calculatedAbsolute?.value || percent?.value,
            value_numeric: calculatedAbsolute?.value_numeric || percent?.value_numeric,
            percentValue: originalPercent ? (originalPercent.value_numeric || originalPercent.value) : null, // ✅ Usar percentual preservado
            status: primaryResult.status,
            manually_corrected: primaryResult.manually_corrected || false,
          });
          
          // Forçar unidade para /mm³ se houver valor absoluto
          if (calculatedAbsolute) {
            biomarkerInfo.unit = '/mm³';
          }
        });
      });

      // Converter Map para array e agrupar por categoria
      const biomarkers = Array.from(biomarkerMap.values()).map(b => ({
        ...b,
        values: Array.from(b.values.values())
      }));

      // Ordenar por categoria e depois por ordem específica ou nome
      biomarkers.sort((a, b) => {
        // Primeiro, ordenar por categoria
        if (a.category !== b.category) {
          const categoryOrderA = getCategoryOrder(a.category);
          const categoryOrderB = getCategoryOrder(b.category);
          if (categoryOrderA !== categoryOrderB) {
            return categoryOrderA - categoryOrderB;
          }
          // Se não estão na ordem definida, usar alfabética
          return a.category.localeCompare(b.category);
        }
        
        // Dentro da mesma categoria, usar ordem de exibição customizada
        const biomarkerOrderA = getBiomarkerOrder(a.category, a.biomarker_name);
        const biomarkerOrderB = getBiomarkerOrder(b.category, b.biomarker_name);
        
        if (biomarkerOrderA !== biomarkerOrderB) {
          return biomarkerOrderA - biomarkerOrderB;
        }
        
        // Se ambos não estão na ordem ou têm a mesma ordem, usar alfabética
        return a.biomarker_name.localeCompare(b.biomarker_name);
      });

      return {
        biomarkers,
        examDates: Array.from(examDatesSet).sort()
      };
    }
  });

  const isLoading = patientLoading || trackingLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
      <Navbar showBackButton={true} backButtonPath="/patients" />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tabela de Acompanhamento */}
        {trackingTableData && trackingTableData.biomarkers.length > 0 && (
          <BiomarkerTrackingTable
            patientId={id!}
            data={trackingTableData.biomarkers}
            examDates={trackingTableData.examDates}
            patientName={patient?.full_name || ''}
          />
        )}

        {/* Estado Vazio */}
        {trackingTableData && trackingTableData.biomarkers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="p-6 rounded-2xl bg-gray-50 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Activity className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Nenhum exame encontrado
            </h3>
            <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
              Adicione exames ao paciente para visualizar o histórico de biomarcadores
            </p>
            <Button
              onClick={() => window.location.href = `/patients/${id}`}
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg"
            >
              Adicionar Primeiro Exame
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
