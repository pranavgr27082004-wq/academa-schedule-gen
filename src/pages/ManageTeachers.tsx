import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus, BookOpen, Loader2 } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  hours_per_week: number;
}

interface Batch {
  id: string;
  name: string;
  semester: number;
}

const ManageTeachers = () => {
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [batchAssignOpen, setBatchAssignOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: teachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").order("name");
      if (error) throw error;
      return data as Teacher[];
    },
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("name");
      if (error) throw error;
      return data as Subject[];
    },
  });

  const { data: batches, isLoading: loadingBatches } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("batches").select("*").order("name");
      if (error) throw error;
      return data as Batch[];
    },
  });

  const { data: allAssignments } = useQuery({
    queryKey: ["all-teacher-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_subject_assignments")
        .select("teacher_id, subject_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: allBatchAssignments } = useQuery({
    queryKey: ["all-teacher-batch-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_batch_assignments")
        .select("teacher_id, batch_id");
      if (error) throw error;
      return data;
    },
  });

  // Initialize selectedSubjects when dialog opens
  useEffect(() => {
    if (assignOpen && selectedTeacher) {
      const currentAssignments = allAssignments
        ?.filter(a => a.teacher_id === selectedTeacher.id)
        .map(a => a.subject_id) || [];
      setSelectedSubjects(currentAssignments);
    }
  }, [assignOpen, selectedTeacher, allAssignments]);

  // Initialize selectedBatches when dialog opens
  useEffect(() => {
    if (batchAssignOpen && selectedTeacher) {
      const currentBatchAssignments = allBatchAssignments
        ?.filter(a => a.teacher_id === selectedTeacher.id)
        .map(a => a.batch_id) || [];
      setSelectedBatches(currentBatchAssignments);
    }
  }, [batchAssignOpen, selectedTeacher, allBatchAssignments]);

  const createMutation = useMutation({
    mutationFn: async (newTeacher: { name: string; email: string }) => {
      const { error } = await supabase.from("teachers").insert([newTeacher]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teachers-count"] });
      toast.success("Teacher created successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to create teacher"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("teachers").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher updated successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to update teacher"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teachers-count"] });
      toast.success("Teacher deleted successfully");
    },
    onError: () => toast.error("Failed to delete teacher"),
  });

  const assignSubjectsMutation = useMutation({
    mutationFn: async ({ teacherId, subjectIds }: { teacherId: string; subjectIds: string[] }) => {
      // Delete existing assignments
      await supabase.from("teacher_subject_assignments").delete().eq("teacher_id", teacherId);
      
      // Insert new assignments
      if (subjectIds.length > 0) {
        const assignments = subjectIds.map(subjectId => ({
          teacher_id: teacherId,
          subject_id: subjectId,
        }));
        const { error } = await supabase.from("teacher_subject_assignments").insert(assignments);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-teacher-assignments"] });
      toast.success("Subjects assigned successfully");
      setAssignOpen(false);
      setSelectedSubjects([]);
    },
    onError: () => toast.error("Failed to assign subjects"),
  });

  const assignBatchesMutation = useMutation({
    mutationFn: async ({ teacherId, batchIds }: { teacherId: string; batchIds: string[] }) => {
      // Delete existing batch assignments
      await supabase.from("teacher_batch_assignments").delete().eq("teacher_id", teacherId);
      
      // Insert new batch assignments
      if (batchIds.length > 0) {
        const assignments = batchIds.map(batchId => ({
          teacher_id: teacherId,
          batch_id: batchId,
        }));
        const { error } = await supabase.from("teacher_batch_assignments").insert(assignments);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-teacher-batch-assignments"] });
      toast.success("Batches assigned successfully");
      setBatchAssignOpen(false);
      setSelectedBatches([]);
    },
    onError: () => toast.error("Failed to assign batches"),
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setEditingTeacher(null);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (name.length > 100) {
      toast.error("Name must be less than 100 characters");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, name: name.trim(), email: email.trim() });
    } else {
      createMutation.mutate({ name: name.trim(), email: email.trim() });
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setEmail(teacher.email);
    setOpen(true);
  };

  const handleAssignSubjects = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setAssignOpen(true);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
      deleteMutation.mutate(teacherToDelete.id);
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
    }
  };

  const handleAssignBatches = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setBatchAssignOpen(true);
  };

  const getTeacherSubjects = (teacherId: string) => {
    return allAssignments
      ?.filter(a => a.teacher_id === teacherId)
      .map(a => subjects?.find(s => s.id === a.subject_id))
      .filter(Boolean) || [];
  };

  const getTeacherBatches = (teacherId: string) => {
    return allBatchAssignments
      ?.filter(a => a.teacher_id === teacherId)
      .map(a => batches?.find(b => b.id === a.batch_id))
      .filter(Boolean) || [];
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Teachers</h1>
            <p className="text-muted-foreground mt-1">Add, edit, and assign subjects to teachers</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setOpen(true); }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
                  <DialogDescription>Enter teacher details below</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingTeacher ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teachers List</CardTitle>
            <CardDescription>Manage your teaching staff</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTeachers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !teachers || teachers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No teachers found. Add your first teacher to get started.</p>
                <Button onClick={() => { resetForm(); setOpen(true); }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add First Teacher
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Batches</TableHead>
                    <TableHead>Assigned Subjects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {teachers?.map((teacher) => {
                    const teacherSubjects = getTeacherSubjects(teacher.id);
                    const teacherBatches = getTeacherBatches(teacher.id);
                    return (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacherBatches.length === 0 ? (
                              <span className="text-sm text-muted-foreground">No batches assigned</span>
                            ) : (
                              teacherBatches.map((batch: any) => (
                                <Badge key={batch.id} variant="default">
                                  {batch.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacherSubjects.length === 0 ? (
                              <span className="text-sm text-muted-foreground">No subjects assigned</span>
                            ) : (
                              teacherSubjects.map((subject: any) => (
                                <Badge key={subject.id} variant="secondary">
                                  {subject.code}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignBatches(teacher)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Batches
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignSubjects(teacher)}
                            >
                              <BookOpen className="h-4 w-4 mr-1" />
                              Subjects
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(teacher)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(teacher)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={assignOpen} onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) setSelectedSubjects([]);
        }}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Subjects to {selectedTeacher?.name}</DialogTitle>
              <DialogDescription>
                Select the subjects this teacher will teach. Currently selected: {selectedSubjects.length}
              </DialogDescription>
            </DialogHeader>
            {loadingSubjects ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-3 py-4">
                {subjects?.map((subject) => (
                  <div key={subject.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <Checkbox
                      id={subject.id}
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSubjects([...selectedSubjects, subject.id]);
                        } else {
                          setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label htmlFor={subject.id} className="text-sm font-medium cursor-pointer">
                        {subject.name}
                      </label>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{subject.code}</Badge>
                        <Badge variant="outline" className="text-xs">{subject.type}</Badge>
                        <Badge variant="outline" className="text-xs">{subject.hours_per_week}h/week</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedTeacher) {
                    assignSubjectsMutation.mutate({
                      teacherId: selectedTeacher.id,
                      subjectIds: selectedSubjects,
                    });
                  }
                }}
                disabled={assignSubjectsMutation.isPending}
              >
                {assignSubjectsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={batchAssignOpen} onOpenChange={(open) => {
          setBatchAssignOpen(open);
          if (!open) setSelectedBatches([]);
        }}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Batches to {selectedTeacher?.name}</DialogTitle>
              <DialogDescription>
                Select the batches/sections this teacher handles. Currently selected: {selectedBatches.length}
              </DialogDescription>
            </DialogHeader>
            {loadingBatches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-3 py-4">
                {batches?.map((batch) => (
                  <div key={batch.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <Checkbox
                      id={batch.id}
                      checked={selectedBatches.includes(batch.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBatches([...selectedBatches, batch.id]);
                        } else {
                          setSelectedBatches(selectedBatches.filter(id => id !== batch.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label htmlFor={batch.id} className="text-sm font-medium cursor-pointer">
                        {batch.name}
                      </label>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">Semester {batch.semester}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setBatchAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedTeacher) {
                    assignBatchesMutation.mutate({
                      teacherId: selectedTeacher.id,
                      batchIds: selectedBatches,
                    });
                  }
                }}
                disabled={assignBatchesMutation.isPending}
              >
                {assignBatchesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Batch Assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{teacherToDelete?.name}</strong>? 
                This will also remove all their subject and batch assignments. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ManageTeachers;