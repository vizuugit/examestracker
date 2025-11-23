import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import exLogo from "@/assets/ex-logo.png";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const acceptInviteSchema = z.object({
  fullName: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  specialty: z.string().optional(),
  password: z.string().min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [invitation, setInvitation] = useState<any>(null);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  // Validar token ao carregar
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token inválido ou ausente");
        setValidating(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("invitations")
          .select("*")
          .eq("token", token)
          .single();

        if (fetchError || !data) {
          setError("Convite não encontrado");
          setValidating(false);
          return;
        }

        if (data.status === "accepted") {
          setError("Este convite já foi utilizado");
          setValidating(false);
          return;
        }

        if (data.status === "expired" || new Date(data.expires_at) < new Date()) {
          setError("Este convite expirou");
          setValidating(false);
          return;
        }

        if (data.status === "revoked") {
          setError("Este convite foi revogado");
          setValidating(false);
          return;
        }

        setInvitation(data);
        setValidating(false);

      } catch (err) {
        console.error("Erro ao validar convite:", err);
        setError("Erro ao validar convite");
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleAcceptInvite = async (formData: AcceptInviteFormData) => {
    if (!invitation) return;

    setLoading(true);
    try {
      // Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: formData.fullName,
            specialty: formData.specialty,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      // Atualizar status do convite
      const { error: updateError } = await supabase
        .from("invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          full_name: formData.fullName,
          specialty: formData.specialty,
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("Erro ao atualizar convite:", updateError);
      }

      // Atualizar role do usuário para o invited_role
      if (authData.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: invitation.invited_role })
          .eq("user_id", authData.user.id);

        if (roleError) {
          console.error("Erro ao atualizar role:", roleError);
        }
      }

      // Notificar admin
      try {
        await supabase.functions.invoke("notify-admin-acceptance", {
          body: { invitationId: invitation.id },
        });
      } catch (err) {
        console.error("Erro ao notificar admin:", err);
      }

      // Enviar email de boas-vindas ao profissional
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            professionalName: formData.fullName,
            professionalEmail: invitation.email,
            specialty: formData.specialty,
          },
        });
      } catch (err) {
        console.error("Erro ao enviar email de boas-vindas:", err);
      }

      toast.success("Conta criada com sucesso! Verifique seu email.");
      navigate("/dashboard");

    } catch (err: any) {
      console.error("Erro ao aceitar convite:", err);
      toast.error("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-rest-blue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-rest-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={exLogo} alt="Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Aceitar Convite</h1>
        </div>

        <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">
              {validating ? "Validando convite..." : error ? "Convite Inválido" : "Complete seu Cadastro"}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {validating ? "Aguarde enquanto verificamos seu convite" : 
               error ? "Não foi possível processar este convite" : 
               `Plataforma: Exames | Email: ${invitation?.email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validating ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-rest-blue" />
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                  <XCircle className="h-6 w-6" />
                  <p>{error}</p>
                </div>
                <Button 
                  onClick={() => navigate("/auth")} 
                  className="w-full bg-rest-blue hover:bg-rest-blue/90"
                >
                  Ir para Login
                </Button>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(handleAcceptInvite)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    placeholder="Seu nome completo"
                    className="bg-zinc-800 border-zinc-700 text-white"
                    {...form.register("fullName")}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-white">Especialidade</Label>
                  <Input
                    id="specialty"
                    placeholder="Ex: Cardiologista (opcional)"
                    className="bg-zinc-800 border-zinc-700 text-white"
                    {...form.register("specialty")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="bg-zinc-800 border-zinc-700 text-white"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita sua senha"
                    className="bg-zinc-800 border-zinc-700 text-white"
                    {...form.register("confirmPassword")}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-rest-blue hover:bg-rest-blue/90" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Criar Conta
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptInvite;
