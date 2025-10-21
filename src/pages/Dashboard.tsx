import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, DoorOpen, GraduationCap, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: teachersCount } = useQuery({
    queryKey: ["teachers-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: subjectsCount } = useQuery({
    queryKey: ["subjects-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("subjects")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: roomsCount } = useQuery({
    queryKey: ["rooms-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("rooms")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: batchesCount } = useQuery({
    queryKey: ["batches-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("batches")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const stats = [
    { title: "Total Teachers", value: teachersCount, icon: Users, color: "text-blue-600" },
    { title: "Total Subjects", value: subjectsCount, icon: BookOpen, color: "text-green-600" },
    { title: "Total Rooms", value: roomsCount, icon: DoorOpen, color: "text-purple-600" },
    { title: "Total Batches", value: batchesCount, icon: GraduationCap, color: "text-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your academic timetable efficiently</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition-all border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Manage Data</CardTitle>
                  <CardDescription>Add and edit teachers, subjects, rooms, and batches</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/manage/teachers")}
                className="w-full"
                size="lg"
              >
                Go to Data Management
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all border-2 border-accent/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle>Generate Timetable</CardTitle>
                  <CardDescription>Create an optimized weekly schedule automatically</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/generate")}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
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