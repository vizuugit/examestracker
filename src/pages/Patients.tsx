import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, MoreVertical, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/BackButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useDeletePatient } from "@/hooks/useDeletePatient";

const Patients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [patientToDelete, setPatientToDelete] = useState<any>(null);
  const { deletePatient, isDeleting } = useDeletePatient();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("professional_id", user?.id)
        .order("full_name");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredPatients = patients?.filter((patient) =>
    patient.full_name.toLowerCase().includes(search.toLowerCase()) ||
    patient.cpf?.includes(search)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
      <Navbar showBackButton={true} backButtonPath="/dashboard" />
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Meus Pacientes
              </h1>
              <p className="text-white/70 mt-2">
                Gerencie seus pacientes e seus exames
              </p>
            </div>
            <Button
              onClick={() => navigate("/patients/new")}
              className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white shrink-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Paciente
            </Button>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          {/* Patients Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 bg-white/10" />
              ))}
            </div>
          ) : filteredPatients && filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="relative group">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white hover:bg-white/10"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
                      <DropdownMenuItem 
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="text-white hover:bg-white/10 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setPatientToDelete(patient)}
                        className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:border-rest-blue/50 transition-all cursor-pointer hover-scale"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-rest-blue to-rest-cyan rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {patient.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-rest-lightblue transition-colors">
                          {patient.full_name}
                        </h3>
                        {patient.cpf && (
                          <p className="text-sm text-white/60">CPF: {patient.cpf}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-white/70">
                      {patient.email && (
                        <p>📧 {patient.email}</p>
                      )}
                      {patient.phone && (
                        <p>📱 {patient.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-white/30" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
              </h3>
              <p className="text-white/60 mb-6">
                {search
                  ? "Tente buscar com outros termos"
                  : "Adicione seu primeiro paciente para começar"}
              </p>
              {!search && (
                <Button
                  onClick={() => navigate("/patients/new")}
                  className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-lightblue text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Paciente
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir {patientToDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Esta ação não pode ser desfeita. Todos os exames e dados deste paciente serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (patientToDelete) {
                  deletePatient(patientToDelete.id);
                  setPatientToDelete(null);
                }
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Patients;
