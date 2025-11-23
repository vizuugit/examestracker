import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DashboardUploadZone } from "@/components/DashboardUploadZone";
import { QuickActions } from "@/components/QuickActions";
import { DashboardStats } from "@/components/DashboardStats";
import { RecentExams } from "@/components/RecentExams";
import { AIAccuracyStats } from "@/components/AIAccuracyStats";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user } = useAuth();
  const { roles } = useUserRole();
  const navigate = useNavigate();
  const isAdmin = user?.email === 'andreytorax@gmail.com' || roles?.includes("admin");

  // Query: Estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [examsResult, patientsResult, processingResult] = await Promise.all([
        supabase
          .from("exams")
          .select("id", { count: "exact" })
          .eq("uploaded_by", user.id),
        supabase
          .from("patients")
          .select("id", { count: "exact" })
          .eq("professional_id", user.id),
        supabase
          .from("exams")
          .select("id", { count: "exact" })
          .eq("uploaded_by", user.id)
          .eq("processing_status", "processing"),
      ]);

      const totalExams = examsResult.count || 0;
      const totalPatients = patientsResult.count || 0;
      const processingExams = processingResult.count || 0;

      const successRate =
        totalExams > 0
          ? ((totalExams - processingExams) / totalExams * 100).toFixed(1) + "%"
          : "100%";

      return {
        totalExams,
        totalPatients,
        processingExams,
        successRate,
      };
    },
    enabled: !!user?.id,
  });

  // Query: Exames recentes
  const { data: recentExams } = useQuery({
    queryKey: ["recent-exams", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("exams")
        .select(
          `
          id,
          aws_file_name,
          exam_date,
          processing_status,
          created_at,
          patient_name_extracted,
          patients(
            id,
            full_name
          )
        `
        )
        .eq("uploaded_by", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return (
        data?.map((exam) => ({
          id: exam.id,
          patient_name: exam.patients?.full_name || exam.patient_name_extracted || 'Processando...',
          patient_id: exam.patients?.id || '',
          file_name: exam.aws_file_name,
          exam_date: exam.exam_date,
          processing_status: exam.processing_status,
          created_at: exam.created_at,
        })) || []
      );
    },
    enabled: !!user?.id,
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.some(
        (exam) => exam.processing_status === "processing"
      );
      return hasProcessing ? 10000 : false;
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-zinc-900 to-black">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardUploadZone />
            <DashboardStats stats={stats} />
            <RecentExams exams={recentExams} />
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            <QuickActions />
            
            {/* Revisitar Tour */}
            <Card className="bg-gradient-to-br from-rest-blue/10 to-rest-cyan/5 border-rest-blue/20 hover:border-rest-blue/40 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <Button
                  onClick={() => navigate('/demo')}
                  variant="ghost"
                  className="w-full justify-start p-0 h-auto hover:bg-transparent group"
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className="p-3 rounded-lg bg-rest-blue/20 group-hover:bg-rest-blue/30 transition-colors">
                      <GraduationCap className="w-6 h-6 text-rest-lightblue" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-semibold mb-1 group-hover:text-rest-lightblue transition-colors">
                        Revisitar Tutorial
                      </h3>
                      <p className="text-white/60 text-sm">
                        Veja novamente como usar todas as funcionalidades da plataforma
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
            
            {isAdmin && <AIAccuracyStats />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
