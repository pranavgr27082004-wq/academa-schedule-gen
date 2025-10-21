import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateOptimizedTimetable } from "@/utils/timetableGenerator";

const GenerateTimetable = () => {
  const [isGenerating, setIsGenerating] = useState(false);
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
      const { data, error } = await supabase.from("timeslots").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teacher_subject_assignments").select("*");
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
      });

      // Insert new timetable
      const { error } = await supabase.from("timetable").insert(timetableEntries);
      if (error) throw error;

      return timetableEntries;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
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
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
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
                  <li>✓ All weekly hours for each subject are allocated</li>
                </ul>
              </div>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-accent" />
                  <p className="text-lg font-medium text-foreground">Optimizing schedules...</p>
                  <p className="text-sm text-muted-foreground">This may take a moment</p>
                </div>
              ) : (
                <Button 
                  onClick={handleGenerate}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  size="lg"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Generate Weekly Timetable
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateTimetable;