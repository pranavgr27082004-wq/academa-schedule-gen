import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus, BookOpen } from "lucide-react";

const ManageTeachers = () => {
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["teacher-assignments", selectedTeacher?.id],
    enabled: !!selectedTeacher,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_subject_assignments")
        .select("subject_id")
        .eq("teacher_id", selectedTeacher.id);
      if (error) throw error;
      return data.map(a => a.subject_id);
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      toast.success("Subjects assigned successfully");
      setAssignOpen(false);
    },
    onError: () => toast.error("Failed to assign subjects"),
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setEditingTeacher(null);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, name, email });
    } else {
      createMutation.mutate({ name, email });
    }
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setEmail(teacher.email);
    setOpen(true);
  };

  const handleAssignSubjects = (teacher: any) => {
    setSelectedTeacher(teacher);
    setAssignOpen(true);
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers?.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignSubjects(teacher)}
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          Assign Subjects
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
                          onClick={() => deleteMutation.mutate(teacher.id)}
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

        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Subjects to {selectedTeacher?.name}</DialogTitle>
              <DialogDescription>Select the subjects this teacher will teach</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {subjects?.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={subject.id}
                    checked={selectedSubjects.includes(subject.id) || assignments?.includes(subject.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSubjects([...selectedSubjects, subject.id]);
                      } else {
                        setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                      }
                    }}
                  />
                  <label htmlFor={subject.id} className="text-sm font-medium">
                    {subject.name} ({subject.code})
                  </label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  const allSelected = [...selectedSubjects];
                  assignments?.forEach(id => {
                    if (!allSelected.includes(id)) allSelected.push(id);
                  });
                  assignSubjectsMutation.mutate({
                    teacherId: selectedTeacher.id,
                    subjectIds: allSelected,
                  });
                }}
              >
                Save Assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageTeachers;