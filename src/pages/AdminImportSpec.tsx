import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import spec from '@/data/biomarker-specification-v2.json';

interface ImportResult {
  success: boolean;
  version?: string;
  date?: string;
  stats?: {
    categories: number;
    overrides: number;
    variations: number;
  };
  error?: string;
}

export default function AdminImportSpec() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    try {
      setImporting(true);
      setProgress(10);
      setResult(null);

      toast.loading('Iniciando importação...', { id: 'import' });

      setProgress(30);
      const { data, error } = await supabase.functions.invoke('import-biomarker-spec', {
        body: { spec },
      });

      setProgress(90);

      if (error) throw error;

      setProgress(100);
      setResult(data as ImportResult);

      if (data.success) {
        toast.success('Importação concluída com sucesso!', { id: 'import' });
      } else {
        toast.error(`Erro na importação: ${data.error}`, { id: 'import' });
      }
    } catch (error: any) {
      console.error('Erro ao importar especificação:', error);
      toast.error('Erro ao importar especificação', { id: 'import' });
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Importar Especificação de Biomarcadores</h1>
            <p className="text-white/60">Sincronizar dados com a Lambda AWS</p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Arquivo de Especificação
            </CardTitle>
            <CardDescription className="text-white/60">
              biomarker-specification-v2.json
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-white/60">Versão</p>
                <p className="text-lg font-semibold">{spec.versao}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Data de Atualização</p>
                <p className="text-lg font-semibold">{spec.data_atualizacao}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Categorias</p>
                <p className="text-lg font-semibold">{spec.total_categorias}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Biomarcadores</p>
                <p className="text-lg font-semibold">{spec.total_biomarcadores}</p>
              </div>
            </div>

            {/* Warning */}
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                <strong>ATENÇÃO:</strong> Esta ação irá substituir todos os dados existentes nas tabelas:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>category_display_order</li>
                  <li>biomarker_category_overrides</li>
                  <li>biomarker_variations</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Import Button */}
            <div className="space-y-4">
              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {importing ? '🔄 Importando...' : '📥 Iniciar Importação'}
              </Button>

              {/* Progress */}
              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-white/60 text-center">
                    Processando... {progress}%
                  </p>
                </div>
              )}
            </div>

            {/* Result */}
            {result && (
              <Alert className={result.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}>
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-200">
                      <strong>Importação Concluída!</strong>
                      {result.stats && (
                        <div className="mt-3 space-y-1">
                          <p>✅ Categorias importadas: {result.stats.categories}</p>
                          <p>✅ Overrides importados: {result.stats.overrides}</p>
                          <p>✅ Variações importadas: {result.stats.variations}</p>
                        </div>
                      )}
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-200">
                      <strong>Erro na Importação:</strong>
                      <p className="mt-2">{result.error}</p>
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-white/80">
            <p>
              <strong>1. Limpeza:</strong> Remove todos os dados existentes das tabelas administrativas.
            </p>
            <p>
              <strong>2. Categorias:</strong> Importa {spec.total_categorias} categorias com suas ordens de exibição.
            </p>
            <p>
              <strong>3. Overrides:</strong> Importa {spec.total_biomarcadores} biomarcadores com suas categorias e ordens.
            </p>
            <p>
              <strong>4. Variações:</strong> Importa todos os sinônimos de cada biomarcador para normalização de nomes.
            </p>
            <p className="text-primary">
              <strong>💡 Dica:</strong> Após a importação, você pode modificar ou adicionar dados manualmente pelas páginas administrativas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
