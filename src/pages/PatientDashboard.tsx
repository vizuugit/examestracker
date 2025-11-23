import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BiomarkerTrackingTable } from '@/components/BiomarkerTrackingTable';
import { Skeleton } from '@/components/ui/skeleton';
// Ordenação agora vem do backend via category_order e biomarker_order
import { isLeukocyteType } from '@/utils/leukocyteFormatter';
import { getBiomarkerCategory, normalizeBiomarkerNameAsync } from '@/services/biomarkerCategoryService';

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
      console.log('🔄 [PatientDashboard] Fetching tracking data...');
      
      // ✅ FASE 1: Buscar exames com raw_aws_response
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('id, exam_date, laboratory, raw_aws_response, created_at')
        .eq('patient_id', id)
        .order('exam_date', { ascending: true });

      if (examsError) throw examsError;

      // Separar exames por estrutura (com/sem categorias)
      const examsWithCategories: any[] = [];
      const examsWithoutCategories: any[] = [];

      examsData?.forEach(exam => {
        const rawResponse = exam.raw_aws_response as any;
        if (rawResponse?.categorias && Array.isArray(rawResponse.categorias) && rawResponse.categorias.length > 0) {
          examsWithCategories.push(exam);
        } else {
          examsWithoutCategories.push(exam);
        }
      });

      console.log('📊 [PatientDashboard] Exames com categorias:', examsWithCategories.length);
      console.log('📊 [PatientDashboard] Exames sem categorias (fallback):', examsWithoutCategories.length);

      // ✅ FASE 2: Processar exames com estrutura categorias[]
      const biomarkerMap = new Map<string, any>();
      const examDatesSet = new Set<string>();

      // Lista de biomarcadores excluídos (cabeçalhos)
      const EXCLUDED_BIOMARKERS = [
        'hemograma', 'leucograma', 'plaquetograma', 'eritrograma',
        'série vermelha', 'serie vermelha'
      ];

      // Processar exames novos (com categorias ordenadas do backend)
      examsWithCategories.forEach(exam => {
        const categorias = exam.raw_aws_response.categorias || [];
        const examId = exam.id;
        const examDate = exam.exam_date || exam.created_at;
        const isEstimatedDate = !exam.exam_date;

        examDatesSet.add(`${examId}|${examDate}|${isEstimatedDate ? 'estimated' : 'manual'}`);

        categorias.forEach((categoria: any) => {
          const categoryName = categoria.nome;
          const categoryOrder = categoria.ordem ?? 999;

          categoria.biomarcadores?.forEach((bio: any) => {
            const biomarkerName = bio.nome;
            const biomarkerOrder = bio.ordem ?? 999;
            const key = biomarkerName.toLowerCase().trim();

            // Pular cabeçalhos
            if (EXCLUDED_BIOMARKERS.includes(key)) return;

            // Criar entrada se não existir
            if (!biomarkerMap.has(key)) {
              biomarkerMap.set(key, {
                biomarker_name: biomarkerName,
                unit: bio.unidade,
                reference_min: bio.valor_referencia_min ?? null,
                reference_max: bio.valor_referencia_max ?? null,
                reference_text: bio.valor_referencia_texto ?? null,
                category: categoryName,
                category_order: categoryOrder,
                biomarker_order: biomarkerOrder,
                values: new Map(),
                data_source: 'categorias'
              });
            }

            // Adicionar valor do exame
            const biomarkerData = biomarkerMap.get(key)!;
            biomarkerData.values.set(examId, {
              exam_id: examId,
              exam_date: examDate,
              value: bio.resultado,
              value_numeric: bio.valor_numerico,
              status: bio.status,
              percentValue: bio.percentValue || null,
              manually_corrected: false
            });
          });
        });
      });

      console.log('✅ [PatientDashboard] Biomarcadores processados (categorias):', biomarkerMap.size);

      // ✅ FASE 4: Fallback para exames antigos (sem categorias)
      if (examsWithoutCategories.length > 0) {
        const examIds = examsWithoutCategories.map(e => e.id);
        
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
              created_at
            )
          `)
          .in('exams.id', examIds)
          .order('created_at', { ascending: false, foreignTable: 'exams' });

        if (error) {
          console.error('❌ [Fallback] Erro ao buscar exam_results:', error);
        } else {
          console.log('📦 [Fallback] Processando', data?.length, 'resultados antigos');

          // Normalização para exames antigos
          const customNormalizationPromises = data?.map(async (result: any) => {
            const customMatch = await normalizeBiomarkerNameAsync(result.biomarker_name);
            return { result, customMatch };
          }) || [];

          const resultsWithCustom = await Promise.all(customNormalizationPromises);

          // Processar resultados antigos (mantém lógica atual)
          resultsWithCustom.forEach(({ result, customMatch }) => {
          const originalName = result.biomarker_name;
          
          // 🎯 Usar apenas customMatch do backend
          const tableMatch = customMatch;
          
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

        // Usar serviço centralizado para obter categoria
        const category = getBiomarkerCategory(originalName, result.category);

        // Se biomarcador não existe, criar entrada
        if (!biomarkerMap.has(finalKey)) {
          const hasBothRefs = result.reference_min != null && result.reference_max != null;
          
          biomarkerMap.set(finalKey, {
            biomarker_name: finalDisplayName,
            unit: tableMatch?.unit || result.unit,
            reference_min: result.reference_min ?? null,
            reference_max: result.reference_max ?? null,
            reference_text: hasBothRefs 
              ? `${result.reference_min} - ${result.reference_max}` 
              : null,
            category,
            values: new Map(),
            completeness_score: calculateCompletenessScore(result),
            category_source: tableMatch?.category ? 'normalization_table' : 'database'
          });
        } else {
          // Biomarcador já existe, verificar se devemos atualizar metadados
          const existing = biomarkerMap.get(finalKey)!;
          const newScore = calculateCompletenessScore(result);
          
          // ⚠️ VALIDAÇÃO: Detectar consolidações suspeitas de biomarcadores diferentes
          if (existing.unit && result.unit && existing.unit !== result.unit) {
            console.warn('⚠️ [CONSOLIDAÇÃO SUSPEITA] Biomarcadores com unidades diferentes sendo consolidados:', {
              biomarker: finalKey,
              existingUnit: existing.unit,
              newUnit: result.unit,
              existingValue: Array.from(existing.values.values())[0],
              newValue: result.value,
              originalNames: { existing: existing.biomarker_name, new: originalName }
            });
          }
          
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
        
        // Adicionar valor do resultado
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
      });
        }
      }

      console.log('✅ [PatientDashboard] Total biomarcadores após processamento:', biomarkerMap.size);

      console.log('✅ [PatientDashboard] Total biomarcadores após processamento:', biomarkerMap.size);

      // ✅ FASE 3: Consolidação Inteligente de Leucócitos
      console.log('🔬 [Leucócitos] Iniciando consolidação inteligente...');
      
      // 1. Buscar contagem total de leucócitos (necessário para cálculos)
      const getTotalLeukocytesForExam = (examId: string): number | null => {
        const possibleKeys = ['leucocitos', 'leucocitos global', 'leucócitos', 'leucócitos global'];
        
        for (const key of possibleKeys) {
          const leukocytesInfo = biomarkerMap.get(key);
          if (!leukocytesInfo) continue;
          
          const examValue = leukocytesInfo.values.get(examId);
          if (examValue) {
            const rawValue = examValue.value_numeric || examValue.value;
            const numValue = Number(rawValue);
            if (!isNaN(numValue) && numValue > 0) {
              return numValue;
            }
          }
        }
        return null;
      };

      // 2. Processar cada biomarcador leucócito
      biomarkerMap.forEach((biomarkerData, key) => {
        if (!isLeukocyteType(biomarkerData.biomarker_name)) return;

        console.log('🔬 [Leucócito]', biomarkerData.biomarker_name);

        // 3. Para cada valor de exame deste leucócito
        const consolidatedValues = new Map();

        biomarkerData.values.forEach((valueData: any, examId: string) => {
          const unit = valueData.unit || biomarkerData.unit;
          const isPercent = unit === '%';
          const isAbsolute = unit === '/mm³' || unit === 'mil/mm³' || unit === '/µL' || unit === 'células/mm³';

          // Já foi consolidado?
          if (valueData.value && typeof valueData.value === 'string' && valueData.value.includes('(') && valueData.value.includes('%')) {
            console.log('  ✅ Já consolidado:', valueData.value);
            consolidatedValues.set(examId, valueData);
            return;
          }

          let finalValue = valueData.value;
          let finalValueNumeric = valueData.value_numeric;
          let finalUnit = unit;
          let percentValue = valueData.percentValue;

          // CENÁRIO 1: Tem apenas porcentagem - precisa calcular absoluto
          if (isPercent) {
            const totalLeukocytes = getTotalLeukocytesForExam(examId);
            
            if (totalLeukocytes) {
              const percentNum = Number(valueData.value_numeric || valueData.value);
              if (!isNaN(percentNum)) {
                const absoluteValue = Math.round((percentNum / 100) * totalLeukocytes);
                
                // Consolidar: "4903 (63.1%)"
                finalValue = `${absoluteValue} (${percentNum}%)`;
                finalValueNumeric = absoluteValue;
                finalUnit = '/mm³';
                percentValue = percentNum;

                console.log('  📊 Calculado:', percentNum, '% ×', totalLeukocytes, '=', absoluteValue);
              }
            } else {
              console.warn('  ⚠️ Sem leucócitos totais para calcular absoluto');
            }
          }
          
          // CENÁRIO 2: Tem apenas valor absoluto - manter como está
          else if (isAbsolute) {
            console.log('  ✅ Já absoluto:', finalValue, finalUnit);
          }

          // Atualizar valor consolidado
          consolidatedValues.set(examId, {
            ...valueData,
            value: finalValue,
            value_numeric: finalValueNumeric,
            unit: finalUnit,
            percentValue: percentValue
          });
        });

        // Atualizar o biomarkerMap com valores consolidados
        biomarkerData.values = consolidatedValues;
        if (consolidatedValues.size > 0) {
          const firstValue = Array.from(consolidatedValues.values())[0];
          biomarkerData.unit = firstValue.unit;
        }
      });

      console.log('✅ [Leucócitos] Consolidação concluída');

      // ✅ FASE 5: Converter Map para array e separar organizados de "Outros"
      const allBiomarkers = Array.from(biomarkerMap.values()).map(b => ({
        ...b,
        values: Array.from(b.values.values())
      }));

      const biomarcadoresOrganizados: any[] = [];
      const biomarcadoresSemCategoria: any[] = [];

      allBiomarkers.forEach(bio => {
        const category = bio.category?.toLowerCase().trim();
        
        if (!category || category === 'outros' || category === 'other') {
          biomarcadoresSemCategoria.push(bio);
        } else {
          biomarcadoresOrganizados.push(bio);
        }
      });

      console.log('📊 [PatientDashboard] Organizados:', biomarcadoresOrganizados.length);
      console.log('📋 [PatientDashboard] Não categorizados:', biomarcadoresSemCategoria.length);

      // Ordenar usando ordem do backend
      biomarcadoresOrganizados.sort((a, b) => {
        // Priorizar data_source 'categorias' (backend)
        if (a.data_source !== b.data_source) {
          return a.data_source === 'categorias' ? -1 : 1;
        }
        
        // Ordenar por categoria
        const categoryOrderA = a.category_order ?? 999;
        const categoryOrderB = b.category_order ?? 999;
        if (categoryOrderA !== categoryOrderB) {
          return categoryOrderA - categoryOrderB;
        }

        // Ordenar por biomarcador
        const biomarkerOrderA = a.biomarker_order ?? 999;
        const biomarkerOrderB = b.biomarker_order ?? 999;
        if (biomarkerOrderA !== biomarkerOrderB) {
          return biomarkerOrderA - biomarkerOrderB;
        }

        // Fallback alfabético
        return a.biomarker_name.localeCompare(b.biomarker_name);
      });

      // Ordenar "Outros" alfabeticamente
      biomarcadoresSemCategoria.sort((a, b) => 
        a.biomarker_name.localeCompare(b.biomarker_name)
      );

      return {
        biomarcadoresOrganizados,
        biomarcadoresSemCategoria,
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

        {/* Tabela Principal - Biomarcadores Organizados */}
        {trackingTableData && trackingTableData.biomarcadoresOrganizados.length > 0 && (
          <BiomarkerTrackingTable
            patientId={id!}
            data={trackingTableData.biomarcadoresOrganizados}
            examDates={trackingTableData.examDates}
            patientName={patient?.full_name || ''}
          />
        )}

        {/* Seção "Outros" - Biomarcadores Não Categorizados */}
        {trackingTableData && trackingTableData.biomarcadoresSemCategoria.length > 0 && (
          <div className="mt-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-orange-900 mb-2">
                    📋 Outros Exames (Não Categorizados)
                  </h3>
                  <p className="text-orange-700 text-sm">
                    Biomarcadores que não foram automaticamente classificados pelo sistema. 
                    Eles podem ser exames especializados ou variações não mapeadas.
                  </p>
                </div>
              </div>
              
              <BiomarkerTrackingTable
                patientId={id!}
                data={trackingTableData.biomarcadoresSemCategoria}
                examDates={trackingTableData.examDates}
                patientName={patient?.full_name || ''}
              />
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {trackingTableData && 
         trackingTableData.biomarcadoresOrganizados.length === 0 && 
         trackingTableData.biomarcadoresSemCategoria.length === 0 && (
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
