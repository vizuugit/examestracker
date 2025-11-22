import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import cactoLogo from "@/assets/cacto-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
});

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setResetDialogOpen(false);
      resetForm.reset();
    } catch (error) {
      toast.error("Erro ao enviar email de recuperação");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-rest-blue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-rest-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <BackButton to="/" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={cactoLogo} alt="CACTO Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Acesso Profissional</h1>
          <p className="text-zinc-400 mt-2">Entre com suas credenciais</p>
        </div>

        {/* Login Form */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl transition-all duration-300 ease-in-out hover:shadow-[0_20px_50px_rgba(0,90,156,0.3),0_0_80px_rgba(0,150,255,0.2)] hover:border-rest-blue/50">
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="bg-zinc-800 border-zinc-700 text-white"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-zinc-800 border-zinc-700 text-white"
                {...loginForm.register("password")}
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-rest-blue hover:bg-rest-blue/90 transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100" 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center mt-4">
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-sm text-rest-cyan hover:text-primary transition-colors duration-200 underline-offset-4 hover:underline">
                  Esqueci minha senha
                </button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Recuperar Senha</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Digite seu email para receber um link de recuperação de senha.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-white">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      {...resetForm.register("email")}
                    />
                    {resetForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{resetForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-rest-blue hover:bg-rest-blue/90"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Enviando..." : "Enviar Email de Recuperação"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-zinc-400 mt-4">
            Acesso restrito a profissionais convidados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
