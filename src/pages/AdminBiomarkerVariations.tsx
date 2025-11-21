import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, Search, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BiomarkerVariation {
  id: string;
  biomarker_normalized_name: string;
  variation: string;
  category: string | null;
  unit: string | null;
  active: boolean | null;
  created_at: string | null;
}

export default function AdminBiomarkerVariations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVariation, setNewVariation] = useState({
    biomarker_normalized_name: "",
    variation: "",
    category: "",
    unit: "",
    active: true,
  });

  const queryClient = useQueryClient();

  const { data: variations, isLoading } = useQuery({
    queryKey: ["biomarker-variations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biomarker_variations")
        .select("*")
        .order("biomarker_normalized_name", { ascending: true });

      if (error) throw error;
      return data as BiomarkerVariation[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (variation: typeof newVariation) => {
      const { error } = await supabase
        .from("biomarker_variations")
        .insert([{
          ...variation,
          variation: variation.variation.toLowerCase().trim(),
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biomarker-variations"] });
      toast.success("Variação adicionada com sucesso");
      setIsAddDialogOpen(false);
      setNewVariation({
        biomarker_normalized_name: "",
        variation: "",
        category: "",
        unit: "",
        active: true,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar variação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("biomarker_variations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biomarker-variations"] });
      toast.success("Variação removida com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover variação");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("biomarker_variations")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biomarker-variations"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const filteredVariations = variations?.filter((v) => {
    const query = searchQuery.toLowerCase();
    return (
      v.biomarker_normalized_name.toLowerCase().includes(query) ||
      v.variation.toLowerCase().includes(query) ||
      v.category?.toLowerCase().includes(query)
    );
  });

  const handleAddVariation = () => {
    if (!newVariation.biomarker_normalized_name || !newVariation.variation) {
      toast.error("Nome normalizado e variação são obrigatórios");
      return;
    }
    addMutation.mutate(newVariation);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-zinc-900/50 border-white/10">
        <AlertCircle className="h-4 w-4 text-white" />
        <AlertDescription className="text-white/80">
          As variações customizadas complementam o sistema de normalização padrão. 
          Variações inativas não serão usadas no processo de normalização.
        </AlertDescription>
      </Alert>

      <Card className="bg-zinc-900/50 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Variações Cadastradas</CardTitle>
              <CardDescription className="text-white/60">
                Total: {variations?.length || 0} variações
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-rest-blue hover:bg-rest-cyan">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Variação
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Adicionar Nova Variação</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Adicione uma nova variação/sinônimo de biomarcador
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="normalized-name" className="text-white">Nome Normalizado *</Label>
                    <Input
                      id="normalized-name"
                      placeholder="Ex: Glicemia Jejum"
                      className="bg-black/50 border-white/10 text-white"
                      value={newVariation.biomarker_normalized_name}
                      onChange={(e) =>
                        setNewVariation({ ...newVariation, biomarker_normalized_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="variation" className="text-white">Variação/Sinônimo *</Label>
                    <Input
                      id="variation"
                      placeholder="Ex: glicose, glucose fasting"
                      className="bg-black/50 border-white/10 text-white"
                      value={newVariation.variation}
                      onChange={(e) =>
                        setNewVariation({ ...newVariation, variation: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-white">Categoria</Label>
                    <Input
                      id="category"
                      placeholder="Ex: Glicemia"
                      className="bg-black/50 border-white/10 text-white"
                      value={newVariation.category}
                      onChange={(e) =>
                        setNewVariation({ ...newVariation, category: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit" className="text-white">Unidade</Label>
                    <Input
                      id="unit"
                      placeholder="Ex: mg/dL"
                      className="bg-black/50 border-white/10 text-white"
                      value={newVariation.unit}
                      onChange={(e) =>
                        setNewVariation({ ...newVariation, unit: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newVariation.active}
                      onCheckedChange={(checked) =>
                        setNewVariation({ ...newVariation, active: checked })
                      }
                    />
                    <Label htmlFor="active" className="text-white">Ativa</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-white/10 text-white hover:bg-white/10">
                    Cancelar
                  </Button>
                  <Button onClick={handleAddVariation} disabled={addMutation.isPending} className="bg-rest-blue hover:bg-rest-cyan">
                    {addMutation.isPending ? "Adicionando..." : "Adicionar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Buscar variações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/50 border-white/10 text-white"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-white/60">Carregando...</div>
          ) : filteredVariations?.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              Nenhuma variação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Nome Normalizado</TableHead>
                  <TableHead className="text-white/80">Variação</TableHead>
                  <TableHead className="text-white/80">Categoria</TableHead>
                  <TableHead className="text-white/80">Unidade</TableHead>
                  <TableHead className="text-white/80">Status</TableHead>
                  <TableHead className="text-right text-white/80">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariations?.map((variation) => (
                  <TableRow key={variation.id} className="border-white/10">
                    <TableCell className="font-medium text-white">
                      {variation.biomarker_normalized_name}
                    </TableCell>
                    <TableCell className="text-white">{variation.variation}</TableCell>
                    <TableCell className="text-white">{variation.category || "-"}</TableCell>
                    <TableCell className="text-white">{variation.unit || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={variation.active ?? true}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: variation.id, active: checked })
                          }
                        />
                        <Badge variant={variation.active ? "default" : "secondary"}>
                          {variation.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(variation.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
