import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";

const patientSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  date_of_birth: z.string().optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos").optional().or(z.literal("")),
  medical_conditions: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

const NewPatient = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      const { data: patient, error } = await supabase
        .from("patients")
        .insert({
          professional_id: user?.id,
          full_name: data.full_name,
          date_of_birth: data.date_of_birth || null,
          cpf: data.cpf || null,
          email: data.email || null,
          phone: data.phone || null,
          medical_conditions: data.medical_conditions
            ? data.medical_conditions.split(",").map((c) => c.trim())
            : null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Paciente cadastrado com sucesso!");
      navigate(`/patients/${patient.id}`);
    } catch (error) {
      console.error("Error creating patient:", error);
      toast.error("Erro ao cadastrar paciente");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
      <Navbar showBackButton={true} backButtonPath="/patients" />
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">
            Adicionar Paciente
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 space-y-6">
              <div>
                <Label htmlFor="full_name" className="text-white">
                  Nome Completo *
                </Label>
                <Input
                  id="full_name"
                  placeholder="Nome do paciente"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-red-400 text-sm mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="date_of_birth" className="text-white">
                  Data de Nascimento
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  className="bg-white/10 border-white/20 text-white"
                  {...register("date_of_birth")}
                />
              </div>

              <div>
                <Label htmlFor="cpf" className="text-white">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  placeholder="00000000000"
                  maxLength={11}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  {...register("cpf")}
                />
                {errors.cpf && (
                  <p className="text-red-400 text-sm mt-1">{errors.cpf.message}</p>
                )}
                <p className="text-xs text-white/50 mt-1">Apenas números</p>
              </div>

              <div>
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  placeholder="11999999999"
                  maxLength={11}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
                <p className="text-xs text-white/50 mt-1">Apenas números (DDD + número)</p>
              </div>

              <div>
                <Label htmlFor="medical_conditions" className="text-white">
                  Condições Médicas
                </Label>
                <Textarea
                  id="medical_conditions"
                  placeholder="Ex: Hipertensão, Diabetes"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  {...register("medical_conditions")}
                />
                <p className="text-xs text-white/50 mt-1">
                  Separe múltiplas condições com vírgula
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/patients")}
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
              >
                {isSubmitting ? "Salvando..." : "Salvar Paciente"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewPatient;
