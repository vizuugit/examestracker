import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, UserPlus, Users, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  specialty: z.string().optional(),
  invited_role: z.enum(["admin", "professional"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function AdminInvites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSending, setIsSending] = useState(false);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      full_name: "",
      specialty: "",
      invited_role: "professional",
    },
  });

  // Query para estatísticas
  const { data: stats } = useQuery({
    queryKey: ["invitation-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invitations")
        .select("status");
      
      return {
        total: data?.length || 0,
        pending: data?.filter(i => i.status === 'pending').length || 0,
        accepted: data?.filter(i => i.status === 'accepted').length || 0,
        expired: data?.filter(i => i.status === 'expired').length || 0,
      };
    },
  });

  // Query para listar convites
  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Mutation para enviar convite
  const sendInviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      // 1. Criar convite no banco
      const { data: invitation, error: insertError } = await supabase
        .from("invitations")
        .insert({
          email: data.email,
          full_name: data.full_name,
          specialty: data.specialty,
          invited_role: data.invited_role,
          invited_by: user?.id,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // 2. Chamar edge function para enviar email
      const { error: functionError } = await supabase.functions.invoke("send-invitation", {
        body: { invitationId: invitation.id }
      });
      
      if (functionError) throw functionError;
      
      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["invitation-stats"] });
      toast.success("Convite enviado com sucesso! 📧");
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar convite: " + error.message);
    },
  });

  // Mutation para reenviar convite
  const resendInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      // Buscar convite atual para incrementar contador
      const { data: currentInvite } = await supabase
        .from("invitations")
        .select("resent_count")
        .eq("id", invitationId)
        .single();
      
      // Atualizar contador e data de reenvio
      const { error: updateError } = await supabase
        .from("invitations")
        .update({ 
          resent_count: (currentInvite?.resent_count || 0) + 1,
          last_resent_at: new Date().toISOString(),
        })
        .eq("id", invitationId);
      
      if (updateError) throw updateError;
      
      // Chamar edge function
      const { error: functionError } = await supabase.functions.invoke("send-invitation", {
        body: { invitationId }
      });
      
      if (functionError) throw functionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Convite reenviado com sucesso! 🔄");
    },
    onError: (error: any) => {
      toast.error("Erro ao reenviar convite: " + error.message);
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsSending(true);
    await sendInviteMutation.mutateAsync(data);
    setIsSending(false);
  };

  const handleResend = (invitationId: string) => {
    if (confirm("Deseja realmente reenviar este convite?")) {
      resendInviteMutation.mutate(invitationId);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "⏳ Pendente", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      accepted: { label: "✅ Aceito", className: "bg-green-500/20 text-green-400 border-green-500/30" },
      expired: { label: "❌ Expirado", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Administração</h1>
          <p className="text-white/60">Gerencie convites e usuários do sistema</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Convites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{stats?.pending || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Aceitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{stats?.accepted || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Expirados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{stats?.expired || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Envio */}
        <Card className="bg-zinc-900/50 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Enviar Novo Convite
            </CardTitle>
            <CardDescription className="text-white/60">
              Convide novos profissionais para usar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="profissional@email.com"
                  className="bg-black/50 border-white/10 text-white"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white">Nome Completo</Label>
                <Input
                  id="full_name"
                  {...form.register("full_name")}
                  placeholder="Dr. João Silva"
                  className="bg-black/50 border-white/10 text-white"
                />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-red-400">{form.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-white">Especialidade (Opcional)</Label>
                <Input
                  id="specialty"
                  {...form.register("specialty")}
                  placeholder="Ex: Cardiologia"
                  className="bg-black/50 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invited_role" className="text-white">Tipo de Acesso</Label>
                <Select
                  onValueChange={(value) => form.setValue("invited_role", value as "admin" | "professional")}
                  defaultValue="professional"
                >
                  <SelectTrigger className="bg-black/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="professional">👤 Profissional</SelectItem>
                    <SelectItem value="admin">🔑 Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Button 
                  type="submit" 
                  className="w-full bg-rest-blue hover:bg-rest-cyan"
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tabela de Convites */}
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Convites Enviados</CardTitle>
            <CardDescription className="text-white/60">
              Visualize e gerencie todos os convites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
              <TabsList className="bg-black/50">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending">⏳ Pendentes</TabsTrigger>
                <TabsTrigger value="accepted">✅ Aceitos</TabsTrigger>
                <TabsTrigger value="expired">❌ Expirados</TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : invitations && invitations.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/80">Email</TableHead>
                      <TableHead className="text-white/80">Nome</TableHead>
                      <TableHead className="text-white/80">Role</TableHead>
                      <TableHead className="text-white/80">Status</TableHead>
                      <TableHead className="text-white/80">Enviado em</TableHead>
                      <TableHead className="text-white/80">Expira em</TableHead>
                      <TableHead className="text-white/80">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map(invite => (
                      <TableRow key={invite.id} className="border-white/10">
                        <TableCell className="text-white">{invite.email}</TableCell>
                        <TableCell className="text-white">{invite.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={invite.invited_role === 'admin' ? 'default' : 'secondary'}>
                            {invite.invited_role === 'admin' ? '🔑 Admin' : '👤 Profissional'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(invite.status)}</TableCell>
                        <TableCell className="text-white/60">
                          {format(new Date(invite.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-white/60">
                          {format(new Date(invite.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {invite.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleResend(invite.id)}
                              disabled={resendInviteMutation.isPending}
                              className="border-white/10 text-white hover:bg-white/10"
                            >
                              🔄 Reenviar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                Nenhum convite encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
