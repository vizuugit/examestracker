import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BackButton } from '@/components/BackButton';
import { format } from 'date-fns';
import { Search, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function AdminFeedbackReview() {
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar correções de usuários
  const { data: corrections = [] } = useQuery({
    queryKey: ['admin-corrections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corrections')
        .select('*, exams(id, filename, patient_name_extracted)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Buscar biomarcadores ausentes
  const { data: missingBiomarkers = [] } = useQuery({
    queryKey: ['admin-missing-biomarkers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missing_biomarkers')
        .select('*, exams(id, filename, patient_name_extracted)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Buscar biomarcadores rejeitados
  const { data: rejectedBiomarkers = [] } = useQuery({
    queryKey: ['admin-rejected-biomarkers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rejected_biomarkers')
        .select('*, exams(id, filename, patient_name_extracted)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pendingCorrections = corrections.filter(c => !c.admin_notes);
  const pendingMissing = missingBiomarkers.filter(m => m.status === 'pending');
  const pendingRejected = rejectedBiomarkers.filter(r => r.status === 'pending');

  const accuracyRate = corrections.length > 0
    ? ((corrections.length - corrections.filter(c => c.correction_type !== 'name').length) / corrections.length * 100).toFixed(1)
    : '100.0';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Feedback dos Usuários</h1>
            <p className="text-muted-foreground">
              Analise correções, biomarcadores ausentes e rejeitados para melhorar o sistema
            </p>
          </div>
        </div>

        {/* Card Informativo sobre o Fluxo */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              💡 Como usar este sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Revise o feedback:</strong> Analise as correções, biomarcadores ausentes e rejeitados reportados pelos usuários nesta página.
            </p>
            <p>
              <strong>2. Identifique padrões:</strong> Observe quais biomarcadores aparecem com frequência para priorizar as atualizações.
            </p>
            <p>
              <strong>3. Atualize as Variações:</strong> Vá na aba "Variações" (Admin → Convites → Variações) para adicionar novos sinônimos de biomarcadores.
            </p>
            <p>
              <strong>4. Reorganize Categorias:</strong> Use a aba "Categorias" (Admin → Convites → Categorias) para ajustar a estrutura de classificação.
            </p>
            <p className="text-primary font-medium">
              <strong>💡 Dica:</strong> Após fazer alterações nas Variações ou Categorias, atualize manualmente o arquivo JSON na Lambda AWS para sincronizar o sistema.
            </p>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Correções Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCorrections.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Biomarcadores Ausentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingMissing.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Rejeitados p/ Revisar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRejected.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taxa de Acurácia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accuracyRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por biomarcador, paciente ou exame..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="corrections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="corrections">
              Correções ({corrections.length})
            </TabsTrigger>
            <TabsTrigger value="missing">
              Biomarcadores Ausentes ({missingBiomarkers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejeitados ({rejectedBiomarkers.length})
            </TabsTrigger>
          </TabsList>

          {/* Aba: Correções */}
          <TabsContent value="corrections">
            <Card>
              <CardHeader>
                <CardTitle>Correções de Usuários</CardTitle>
                <CardDescription>
                  Revise as correções feitas pelos profissionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Campo</TableHead>
                      <TableHead>Valor AI</TableHead>
                      <TableHead>Valor Corrigido</TableHead>
                      <TableHead>Exame</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrections
                      .filter(c => 
                        !searchTerm || 
                        c.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (c.exams as any)?.patient_name_extracted?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((correction) => (
                        <TableRow key={correction.id}>
                          <TableCell className="text-sm">
                            {format(new Date(correction.created_at!), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">{correction.field_name}</TableCell>
                          <TableCell className="text-muted-foreground">{correction.ai_value || '-'}</TableCell>
                          <TableCell className="text-foreground font-medium">{correction.user_value}</TableCell>
                          <TableCell className="text-sm">{(correction.exams as any)?.filename || 'N/A'}</TableCell>
                          <TableCell>
                            {correction.admin_notes ? (
                              <Badge variant="secondary">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Revisado
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pendente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Biomarcadores Ausentes */}
          <TabsContent value="missing">
            <Card>
              <CardHeader>
                <CardTitle>Biomarcadores Ausentes</CardTitle>
                <CardDescription>
                  Biomarcadores adicionados manualmente pelos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Biomarcador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Categoria Sugerida</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missingBiomarkers
                      .filter(m => 
                        !searchTerm || 
                        m.biomarker_name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((missing) => (
                        <TableRow key={missing.id}>
                          <TableCell className="text-sm">
                            {format(new Date(missing.created_at!), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">{missing.biomarker_name}</TableCell>
                          <TableCell>{missing.value}</TableCell>
                          <TableCell className="text-muted-foreground">{missing.unit || '-'}</TableCell>
                          <TableCell>
                            {missing.suggested_category ? (
                              <Badge variant="outline">{missing.suggested_category}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {missing.status === 'pending' && (
                              <Badge variant="outline">
                                <Plus className="mr-1 h-3 w-3" />
                                Novo
                              </Badge>
                            )}
                            {missing.status === 'reviewed' && (
                              <Badge variant="secondary">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Revisado
                              </Badge>
                            )}
                            {missing.status === 'added_to_spec' && (
                              <Badge variant="default">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Adicionado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Rejeitados */}
          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Biomarcadores Rejeitados</CardTitle>
                <CardDescription>
                  Biomarcadores que o sistema não conseguiu identificar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Nome Original</TableHead>
                      <TableHead>Razão</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Sugestões</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedBiomarkers
                      .filter(r => 
                        !searchTerm || 
                        r.original_name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((rejected) => (
                        <TableRow key={rejected.id}>
                          <TableCell className="text-sm">
                            {format(new Date(rejected.created_at!), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">{rejected.original_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {rejected.rejection_reason}
                          </TableCell>
                          <TableCell>
                            {rejected.similarity_score ? 
                              (Number(rejected.similarity_score) * 100).toFixed(0) + '%' : '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {rejected.suggestions && rejected.suggestions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {rejected.suggestions.slice(0, 2).map((sug, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {sug}
                                  </Badge>
                                ))}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {rejected.status === 'pending' ? (
                              <Badge variant="outline">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Pendente
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Revisado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}