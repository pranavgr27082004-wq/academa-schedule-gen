import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, DoorOpen, GraduationCap, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingStats } from "@/components/LoadingCard";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: teachersCount, isLoading: loadingTeachers } = useQuery({
    queryKey: ["teachers-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: subjectsCount, isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("subjects")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: roomsCount, isLoading: loadingRooms } = useQuery({
    queryKey: ["rooms-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: batchesCount, isLoading: loadingBatches } = useQuery({
    queryKey: ["batches-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("batches")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const isLoading = loadingTeachers || loadingSubjects || loadingRooms || loadingBatches;

  const stats = [
    { title: "Total Teachers", value: teachersCount, icon: Users, color: "text-blue-600" },
    { title: "Total Subjects", value: subjectsCount, icon: BookOpen, color: "text-green-600" },
    { title: "Total Rooms", value: roomsCount, icon: DoorOpen, color: "text-purple-600" },
    { title: "Total Batches", value: batchesCount, icon: GraduationCap, color: "text-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Manage your academic timetable efficiently</p>
        </div>

        {isLoading ? (
          <LoadingStats />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card 
                key={stat.title} 
                className="hover-lift hover:border-primary/40 transition-all animate-slide-up border-border/50 bg-gradient-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover-lift hover:shadow-accent transition-all border-primary/20 bg-gradient-card group animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-primary rounded-xl shadow-md group-hover:shadow-glow transition-shadow">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Manage Data</CardTitle>
                  <CardDescription>Add and edit teachers, subjects, rooms, and batches</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/manage/teachers")}
                className="w-full bg-gradient-primary hover:shadow-glow transition-all"
                size="lg"
              >
                Go to Data Management
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift hover:shadow-accent transition-all border-accent/20 bg-gradient-card group animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-accent to-accent-glow rounded-xl shadow-md group-hover:shadow-accent transition-shadow">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Generate Timetable</CardTitle>
                  <CardDescription>Create an optimized weekly schedule automatically</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/generate")}
                className="w-full bg-gradient-to-r from-accent to-accent-glow text-white hover:shadow-accent transition-all"
                size="lg"
              >
                Generate Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;