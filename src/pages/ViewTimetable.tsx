import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ViewTimetable = () => {
  const [filterType, setFilterType] = useState<"batch" | "teacher" | "room">("batch");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch timetable with all related data
  const { data: timetableData } = useQuery({
    queryKey: ["timetable-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable")
        .select(`
          *,
          batch:batches(name),
          subject:subjects(name, code, type),
          teacher:teachers(name),
          room:rooms(number),
          timeslot:timeslots(day, start_time, end_time, is_break)
        `);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all timeslots to build the timetable structure
  const { data: allTimeslots } = useQuery({
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
  });

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("batches").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*");
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

  // Filter timetable data
  const filteredData = timetableData?.filter(entry => {
    if (selectedFilter === "all") return true;
    
    switch (filterType) {
      case "batch":
        return entry.batch_id === selectedFilter;
      case "teacher":
        return entry.teacher_id === selectedFilter;
      case "room":
        return entry.room_id === selectedFilter;
      default:
        return true;
    }
  });

  // Organize data by days and time slots from database
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Get unique days that have timeslots
  const uniqueDays = [...new Set(allTimeslots?.map(t => t.day) || [])].sort(
    (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
  );

  // Get timeslots grouped by time (across all days)
  const uniqueTimeSlots = [...new Set(allTimeslots?.map(t => `${t.start_time}-${t.end_time}`) || [])].sort();

  const getTimeslotInfo = (day: string, timeRange: string) => {
    const [startTime] = timeRange.split('-');
    return allTimeslots?.find(t => t.day === day && t.start_time === startTime);
  };

  const getClassForSlot = (day: string, timeRange: string) => {
    const [startTime] = timeRange.split('-');
    return filteredData?.find(entry => 
      entry.timeslot.day === day && entry.timeslot.start_time === startTime
    );
  };

  const exportToPDF = () => {
    window.print();
  };

  const deleteTimetableMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("timetable")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable-full"] });
      toast.success("Timetable deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete timetable");
    },
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">View Timetable</h1>
          <p className="text-muted-foreground mt-1">View and export your generated schedule</p>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Filter Type</label>
            <Select value={filterType} onValueChange={(value: any) => {
              setFilterType(value);
              setSelectedFilter("all");
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="batch">Filter by Batch</SelectItem>
                <SelectItem value="teacher">Filter by Teacher</SelectItem>
                <SelectItem value="room">Filter by Room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Select {filterType}</label>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterType === "batch" && batches?.map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                ))}
                {filterType === "teacher" && teachers?.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                ))}
                {filterType === "room" && rooms?.map(room => (
                  <SelectItem key={room.id} value={room.id}>Room {room.number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={exportToPDF} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export to PDF
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Timetable
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Timetable</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the entire timetable? This action cannot be undone.
                  You will need to generate a new timetable from scratch.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTimetableMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              {selectedFilter === "all" 
                ? "Showing complete timetable" 
                : `Filtered by ${filterType}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left font-semibold">Time</th>
                    {uniqueDays.map(day => (
                      <th key={day} className="border border-border p-3 text-left font-semibold">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uniqueTimeSlots.map(timeRange => (
                    <tr key={timeRange}>
                      <td className="border border-border p-3 font-medium bg-muted/50">
                        {timeRange}
                      </td>
                      {uniqueDays.map(day => {
                        const timeslotInfo = getTimeslotInfo(day, timeRange);
                        const classEntry = getClassForSlot(day, timeRange);
                        
                        return (
                          <td key={`${day}-${timeRange}`} className="border border-border p-2">
                            {timeslotInfo?.is_break ? (
                              <div className="p-3 rounded-lg text-sm bg-orange-100 border-l-4 border-orange-500">
                                <div className="font-semibold text-foreground text-center">☕ Break</div>
                              </div>
                            ) : classEntry ? (
                              <div className={`p-3 rounded-lg text-sm ${
                                classEntry.subject.type === 'Lab' 
                                  ? 'bg-purple-100 border-l-4 border-purple-500' 
                                  : 'bg-blue-100 border-l-4 border-blue-500'
                              }`}>
                                <div className="font-semibold text-foreground">{classEntry.subject.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {classEntry.teacher.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Room {classEntry.room.number}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {classEntry.batch.name}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 text-center text-muted-foreground text-sm">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewTimetable;