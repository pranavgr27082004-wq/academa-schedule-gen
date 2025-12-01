import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { generateOptimizedTimetable } from "@/utils/timetableGenerator";

const GenerateTimetable = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all required data
  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("batches").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: timeslots } = useQuery({
    queryKey: ["timeslots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeslots")
        .select("*")
        .order("day", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 0, // Always fetch fresh data
  });

  const { data: assignments } = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teacher_subject_assignments").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: batchAssignments } = useQuery({
    queryKey: ["teacher-batch-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teacher_batch_assignments").select("*");
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Validate data
      if (!teachers?.length || !subjects?.length || !rooms?.length || !batches?.length || !timeslots?.length) {
        throw new Error("Missing required data. Please ensure you have added teachers, subjects, rooms, and batches.");
      }

      if (!assignments?.length) {
        throw new Error("No teacher-subject assignments found. Please assign subjects to teachers first.");
      }

      if (!batchAssignments?.length) {
        throw new Error("No teacher-batch assignments found. Please assign teachers to batches first.");
      }

      // Clear existing timetable
      await supabase.from("timetable").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Generate new timetable
      const timetableEntries = generateOptimizedTimetable({
        teachers,
        subjects,
        rooms,
        batches,
        timeslots,
        assignments,
        batchAssignments,
      });

      // Insert new timetable
      const { error } = await supabase.from("timetable").insert(timetableEntries);
      if (error) throw error;

      return timetableEntries;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      setProgress(100);
      toast.success("Timetable generated successfully!");
      setTimeout(() => {
        navigate("/view");
      }, 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate timetable");
    },
    onSettled: () => {
      setIsGenerating(false);
      setProgress(0);
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(10);
    
    // Refetch all data to ensure we have the latest timeslots
    await queryClient.invalidateQueries({ queryKey: ["timeslots"] });
    setProgress(30);
    await queryClient.invalidateQueries({ queryKey: ["teachers"] });
    setProgress(40);
    await queryClient.invalidateQueries({ queryKey: ["subjects"] });
    setProgress(50);
    await queryClient.invalidateQueries({ queryKey: ["rooms"] });
    setProgress(60);
    await queryClient.invalidateQueries({ queryKey: ["batches"] });
    setProgress(70);
    await queryClient.invalidateQueries({ queryKey: ["teacher-subject-assignments"] });
    setProgress(75);
    await queryClient.invalidateQueries({ queryKey: ["teacher-batch-assignments"] });
    setProgress(80);
    
    // Wait a bit for queries to refetch
    setTimeout(() => {
      setProgress(90);
      generateMutation.mutate();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Generate Timetable</h1>
          <p className="text-muted-foreground mt-1">Create an optimized weekly schedule automatically</p>
        </div>

        <Card className="border-2 border-accent/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Calendar className="h-8 w-8 text-accent" />
              </div>
              <div>
                <CardTitle className="text-2xl">Automatic Timetable Generation</CardTitle>
                <CardDescription className="mt-2">
                  Our algorithm will create a conflict-free schedule considering all constraints
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-foreground">The system will ensure:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ No teacher is scheduled in multiple rooms at the same time</li>
                  <li>✓ No batch has overlapping classes</li>
                  <li>✓ No room is double-booked</li>
                  <li>✓ Lab subjects are assigned to lab rooms</li>
                  <li>✓ Teachers only teach batches they are assigned to</li>
                  <li>✓ All weekly hours for each subject are allocated</li>
                </ul>
              </div>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-2xl rounded-full animate-pulse" />
                    <Loader2 className="h-16 w-16 animate-spin text-accent relative z-10" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                      Optimizing schedules...
                    </p>
                    <p className="text-sm text-muted-foreground">Analyzing constraints and allocating resources</p>
                  </div>
                  <div className="w-full max-w-xs space-y-2">
                    <Progress value={progress} className="h-3" />
                    <p className="text-xs text-center text-muted-foreground">{progress}% complete</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Before you generate:</p>
                      <p>Make sure you have added teachers, subjects, rooms, batches, and time slots. The system will clear any existing timetable.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleGenerate}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all"
                    size="lg"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Generate Weekly Timetable
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateTimetable;