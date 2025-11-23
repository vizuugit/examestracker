import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, User, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar pacientes
  const { data: patients } = useQuery({
    queryKey: ['global-search-patients', searchQuery, user?.id],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, cpf, email')
        .eq('professional_id', user?.id)
        .or(`full_name.ilike.%${searchQuery}%,cpf.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && searchQuery.length >= 2,
  });

  // Buscar exames
  const { data: exams } = useQuery({
    queryKey: ['global-search-exams', searchQuery, user?.id],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id,
          exam_date,
          laboratory,
          patient_id,
          patients!inner(full_name)
        `)
        .eq('uploaded_by', user?.id)
        .or(`laboratory.ilike.%${searchQuery}%,patients.full_name.ilike.%${searchQuery}%`)
        .order('exam_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && searchQuery.length >= 2,
  });

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Buscar pacientes ou exames..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searchQuery.length < 2 
            ? "Digite ao menos 2 caracteres para buscar..." 
            : "Nenhum resultado encontrado."}
        </CommandEmpty>

        {patients && patients.length > 0 && (
          <>
            <CommandGroup heading="Pacientes">
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  onSelect={() => handleSelect(() => navigate(`/patients/${patient.id}`))}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{patient.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {patient.cpf && `CPF: ${patient.cpf}`}
                      {patient.email && ` • ${patient.email}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {exams && exams.length > 0 && (
          <CommandGroup heading="Exames">
            {exams.map((exam) => (
              <CommandItem
                key={exam.id}
                onSelect={() => handleSelect(() => navigate(`/patients/${exam.patient_id}`))}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {exam.laboratory || 'Laboratório não informado'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {exam.exam_date 
                      ? format(new Date(exam.exam_date), "dd/MM/yyyy", { locale: ptBR })
                      : 'Data não informada'}
                    {' • '}
                    {(exam.patients as any)?.full_name || 'Paciente não identificado'}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};
