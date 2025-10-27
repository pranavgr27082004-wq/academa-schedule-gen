import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Clock, Coffee } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ManageTimeslots = () => {
  const [open, setOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isBreak, setIsBreak] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timeslotToDelete, setTimeslotToDelete] = useState<any>(null);
  const [affectedEntriesCount, setAffectedEntriesCount] = useState(0);

  const queryClient = useQueryClient();

  const { data: timeslots } = useQuery({
    queryKey: ["timeslots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeslots")
        .select("*")
        .order("day")
        .order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newSlot: any) => {
      const { error } = await supabase.from("timeslots").insert([newSlot]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      toast.success("Time slot created successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to create time slot"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("timeslots").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      toast.success("Time slot updated successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to update time slot"),
  });

  const handleDeleteClick = async (slot: any) => {
    // Check how many timetable entries use this timeslot
    const { data: timetableEntries, error } = await supabase
      .from("timetable")
      .select("id")
      .eq("timeslot_id", slot.id);

    if (error) {
      toast.error("Failed to check timeslot usage");
      return;
    }

    setTimeslotToDelete(slot);
    setAffectedEntriesCount(timetableEntries?.length || 0);
    setDeleteDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete all timetable entries using this timeslot (cascade delete)
      const { error: timetableError } = await supabase
        .from("timetable")
        .delete()
        .eq("timeslot_id", id);

      if (timetableError) throw timetableError;

      // Then delete the timeslot
      const { error } = await supabase.from("timeslots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["timetable-full"] });
      setDeleteDialogOpen(false);
      setTimeslotToDelete(null);
      toast.success("Time slot deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete time slot");
    },
  });

  const resetForm = () => {
    setDay("Monday");
    setStartTime("");
    setEndTime("");
    setIsBreak(false);
    setEditingSlot(null);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate times
    if (startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }

    const slotData = {
      day,
      start_time: startTime,
      end_time: endTime,
      is_break: isBreak,
    };
    
    if (editingSlot) {
      updateMutation.mutate({ id: editingSlot.id, ...slotData });
    } else {
      createMutation.mutate(slotData);
    }
  };

  const handleEdit = (slot: any) => {
    setEditingSlot(slot);
    setDay(slot.day);
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
    setIsBreak(slot.is_break || false);
    setOpen(true);
  };

  // Group timeslots by day
  const timeslotsByDay = DAYS.map(dayName => ({
    day: dayName,
    slots: timeslots?.filter(slot => slot.day === dayName) || [],
  }));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Time Slots</h1>
            <p className="text-muted-foreground mt-1">Configure your weekly schedule time slots</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setOpen(true); }}>
                <Clock className="mr-2 h-4 w-4" />
                Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingSlot ? "Edit Time Slot" : "Add New Time Slot"}</DialogTitle>
                  <DialogDescription>Configure a time period for classes</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="day">Day</Label>
                    <Select value={day} onValueChange={setDay}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Coffee className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="isBreak" className="text-sm font-medium cursor-pointer">
                          Break Period
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          No classes will be scheduled during this time
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="isBreak"
                      checked={isBreak}
                      onCheckedChange={setIsBreak}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingSlot ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timeslotsByDay.map(({ day: dayName, slots }) => (
            <Card key={dayName}>
              <CardHeader>
                <CardTitle className="text-lg">{dayName}</CardTitle>
                <CardDescription>{slots.length} time slot{slots.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No time slots configured</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map(slot => (
                      <div 
                        key={slot.id}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/80 transition-colors ${
                          slot.is_break ? 'bg-orange-100 dark:bg-orange-950' : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {slot.is_break && <Coffee className="h-4 w-4 text-orange-600" />}
                          <div>
                            <div className="text-sm font-medium">
                              {slot.start_time} - {slot.end_time}
                            </div>
                            {slot.is_break && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Break
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(slot)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(slot)}
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Time Slots</CardTitle>
            <CardDescription>Complete list of configured time periods</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeslots?.map((slot) => (
                  <TableRow key={slot.id} className={slot.is_break ? 'bg-orange-50 dark:bg-orange-950/20' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {slot.is_break && <Coffee className="h-4 w-4 text-orange-600" />}
                        {slot.day}
                      </div>
                    </TableCell>
                    <TableCell>{slot.start_time}</TableCell>
                    <TableCell>{slot.end_time}</TableCell>
                    <TableCell>
                      {slot.is_break ? (
                        <Badge variant="secondary" className="text-xs">
                          Break Period
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Class Period
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(slot)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(slot)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Time Slot</AlertDialogTitle>
              <AlertDialogDescription>
                {affectedEntriesCount > 0 ? (
                  <>
                    This time slot ({timeslotToDelete?.day} {timeslotToDelete?.start_time}-{timeslotToDelete?.end_time}) is currently used in <strong>{affectedEntriesCount}</strong> timetable {affectedEntriesCount === 1 ? 'entry' : 'entries'}.
                    <br /><br />
                    Deleting this time slot will also remove all these timetable entries. This action cannot be undone.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete this time slot ({timeslotToDelete?.day} {timeslotToDelete?.start_time}-{timeslotToDelete?.end_time})?
                    <br /><br />
                    This action cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => timeslotToDelete && deleteMutation.mutate(timeslotToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ManageTimeslots;