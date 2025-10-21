// Simplified timetable generation algorithm
// This is a greedy approach that can be enhanced with genetic algorithms

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  hours_per_week: number;
  type: string;
}

interface Room {
  id: string;
  number: string;
  type: string;
}

interface Batch {
  id: string;
  name: string;
}

interface Timeslot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface Assignment {
  teacher_id: string;
  subject_id: string;
}

interface TimetableEntry {
  batch_id: string;
  subject_id: string;
  teacher_id: string;
  room_id: string;
  timeslot_id: string;
}

interface GenerateParams {
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  batches: Batch[];
  timeslots: Timeslot[];
  assignments: Assignment[];
}

export function generateOptimizedTimetable({
  teachers,
  subjects,
  rooms,
  batches,
  timeslots,
  assignments,
}: GenerateParams): TimetableEntry[] {
  const timetableEntries: TimetableEntry[] = [];
  
  // Track occupied slots
  const teacherSlots = new Map<string, Set<string>>();
  const roomSlots = new Map<string, Set<string>>();
  const batchSlots = new Map<string, Set<string>>();

  // Initialize tracking maps
  teachers.forEach(t => teacherSlots.set(t.id, new Set()));
  rooms.forEach(r => roomSlots.set(r.id, new Set()));
  batches.forEach(b => batchSlots.set(b.id, new Set()));

  // Create a map of teacher -> subjects they can teach
  const teacherSubjects = new Map<string, string[]>();
  assignments.forEach(a => {
    if (!teacherSubjects.has(a.teacher_id)) {
      teacherSubjects.set(a.teacher_id, []);
    }
    teacherSubjects.get(a.teacher_id)!.push(a.subject_id);
  });

  // For each batch, schedule all subjects
  for (const batch of batches) {
    for (const subject of subjects) {
      // Find teacher for this subject
      const teacherIds = assignments
        .filter(a => a.subject_id === subject.id)
        .map(a => a.teacher_id);
      
      if (teacherIds.length === 0) continue;

      // Use first available teacher (can be randomized for variety)
      const teacherId = teacherIds[0];

      // Find appropriate room
      const appropriateRooms = rooms.filter(r => {
        if (subject.type === 'Lab') {
          return r.type === 'Lab';
        }
        return true;
      });

      if (appropriateRooms.length === 0) continue;

      // Schedule required hours
      let hoursScheduled = 0;
      
      for (const timeslot of timeslots) {
        if (hoursScheduled >= subject.hours_per_week) break;

        // Check if this slot is available for teacher, room, and batch
        const teacherAvailable = !teacherSlots.get(teacherId)?.has(timeslot.id);
        const batchAvailable = !batchSlots.get(batch.id)?.has(timeslot.id);

        if (!teacherAvailable || !batchAvailable) continue;

        // Find an available room
        let selectedRoom = null;
        for (const room of appropriateRooms) {
          if (!roomSlots.get(room.id)?.has(timeslot.id)) {
            selectedRoom = room;
            break;
          }
        }

        if (!selectedRoom) continue;

        // Schedule this class
        timetableEntries.push({
          batch_id: batch.id,
          subject_id: subject.id,
          teacher_id: teacherId,
          room_id: selectedRoom.id,
          timeslot_id: timeslot.id,
        });

        // Mark slots as occupied
        teacherSlots.get(teacherId)?.add(timeslot.id);
        roomSlots.get(selectedRoom.id)?.add(timeslot.id);
        batchSlots.get(batch.id)?.add(timeslot.id);

        hoursScheduled++;
      }

      // If we couldn't schedule all hours, that's okay for this simplified version
      if (hoursScheduled < subject.hours_per_week) {
        console.warn(
          `Could only schedule ${hoursScheduled}/${subject.hours_per_week} hours for ${subject.name} in ${batch.name}`
        );
      }
    }
  }

  if (timetableEntries.length === 0) {
    throw new Error("Could not generate any timetable entries. Please check your data and teacher-subject assignments.");
  }

  return timetableEntries;
}