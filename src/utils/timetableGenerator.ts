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
  is_break?: boolean;
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
  
  console.log('Starting timetable generation with:', {
    teacherCount: teachers.length,
    subjectCount: subjects.length,
    roomCount: rooms.length,
    batchCount: batches.length,
    timeslotCount: timeslots.length,
    assignmentCount: assignments.length,
  });
  
  // Sort timeslots by day and time for consistent ordering
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedTimeslots = [...timeslots].sort((a, b) => {
    const dayCompare = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayCompare !== 0) return dayCompare;
    return a.start_time.localeCompare(b.start_time);
  });
  
  // Filter out break periods from scheduling
  const classTimeslots = sortedTimeslots.filter(t => !t.is_break);
  
  console.log('Available class timeslots:', classTimeslots.map(t => `${t.day} ${t.start_time}-${t.end_time}`));
  
  // Track occupied slots
  const teacherSlots = new Map<string, Set<string>>();
  const roomSlots = new Map<string, Set<string>>();
  const batchSlots = new Map<string, Set<string>>();

  // Initialize tracking maps
  teachers.forEach(t => teacherSlots.set(t.id, new Set()));
  rooms.forEach(r => roomSlots.set(r.id, new Set()));
  batches.forEach(b => batchSlots.set(b.id, new Set()));

  // Helper function to check if a slot is available
  const isSlotAvailable = (teacherId: string, batchId: string, roomId: string, timeslotId: string): boolean => {
    return !teacherSlots.get(teacherId)?.has(timeslotId) &&
           !batchSlots.get(batchId)?.has(timeslotId) &&
           !roomSlots.get(roomId)?.has(timeslotId);
  };

  // Helper function to mark slot as occupied
  const occupySlot = (teacherId: string, batchId: string, roomId: string, timeslotId: string) => {
    teacherSlots.get(teacherId)?.add(timeslotId);
    batchSlots.get(batchId)?.add(timeslotId);
    roomSlots.get(roomId)?.add(timeslotId);
  };

  // Helper function to find consecutive slots on the same day
  const findConsecutiveSlots = (startIndex: number, count: number): Timeslot[] | null => {
    if (startIndex + count > classTimeslots.length) return null;
    
    const slots = classTimeslots.slice(startIndex, startIndex + count);
    const firstDay = slots[0].day;
    
    // Check if all slots are on the same day
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].day !== firstDay) return null;
    }
    
    // Verify slots are truly consecutive in time
    for (let i = 1; i < slots.length; i++) {
      // The previous slot's end time should match the current slot's start time
      if (slots[i - 1].end_time !== slots[i].start_time) {
        console.log(`Slots not consecutive: ${slots[i-1].end_time} != ${slots[i].start_time}`);
        return null;
      }
    }
    
    return slots;
  };

  // For each batch, schedule all subjects
  for (const batch of batches) {
    for (const subject of subjects) {
      // Find teacher for this subject
      const teacherIds = assignments
        .filter(a => a.subject_id === subject.id)
        .map(a => a.teacher_id);
      
      if (teacherIds.length === 0) {
        console.warn(`No teacher assigned for subject: ${subject.name}`);
        continue;
      }

      // Use first available teacher
      const teacherId = teacherIds[0];

      // Find appropriate room - for labs, prefer lab rooms but allow regular rooms if needed
      let appropriateRooms = rooms.filter(r => {
        if (subject.type === 'Lab') {
          return r.type === 'Lab';
        }
        return true;
      });

      // If no lab rooms available for a lab subject, use any available room
      if (appropriateRooms.length === 0 && subject.type === 'Lab') {
        console.warn(`No lab rooms found for ${subject.name}, will use any available room`);
        appropriateRooms = rooms;
      }

      if (appropriateRooms.length === 0) {
        console.warn(`No rooms available for subject: ${subject.name} (${subject.type})`);
        continue;
      }

      // Schedule required hours
      let hoursScheduled = 0;
      
      // For Lab subjects, schedule in 2-hour continuous blocks
      if (subject.type === 'Lab') {
        const blocksNeeded = Math.ceil(subject.hours_per_week / 2);
        let blocksScheduled = 0;
        
        console.log(`Attempting to schedule ${blocksNeeded} 2-hour lab blocks for ${subject.name} in ${batch.name}`);
        
        for (let i = 0; i < classTimeslots.length && blocksScheduled < blocksNeeded; i++) {
          const consecutiveSlots = findConsecutiveSlots(i, 2);
          
          if (!consecutiveSlots) {
            continue;
          }

          // Check if all 2 slots are available for teacher, batch, and find available room
          let selectedRoom = null;
          for (const room of appropriateRooms) {
            const allSlotsAvailable = consecutiveSlots.every(slot => 
              isSlotAvailable(teacherId, batch.id, room.id, slot.id)
            );
            
            if (allSlotsAvailable) {
              selectedRoom = room;
              break;
            }
          }

          if (!selectedRoom) {
            continue;
          }

          // Schedule both consecutive slots
          for (const slot of consecutiveSlots) {
            timetableEntries.push({
              batch_id: batch.id,
              subject_id: subject.id,
              teacher_id: teacherId,
              room_id: selectedRoom.id,
              timeslot_id: slot.id,
            });

            occupySlot(teacherId, batch.id, selectedRoom.id, slot.id);
            hoursScheduled++;
          }

          blocksScheduled++;
          console.log(`✓ Scheduled 2-hour lab block ${blocksScheduled}/${blocksNeeded} for ${subject.name} in ${batch.name} on ${consecutiveSlots[0].day} at ${consecutiveSlots[0].start_time}-${consecutiveSlots[1].end_time}`);
          
          // Skip the next slot since we just used it
          i++;
        }
        
        if (blocksScheduled < blocksNeeded) {
          console.warn(`⚠ Could only schedule ${blocksScheduled}/${blocksNeeded} lab blocks (${hoursScheduled}/${subject.hours_per_week} hours) for ${subject.name} in ${batch.name}`);
        }
      } else {
        // For regular subjects, schedule ONE hour at a time (not continuous)
        console.log(`Scheduling ${subject.hours_per_week} separate 1-hour slots for ${subject.name} in ${batch.name}`);
        
        for (const timeslot of classTimeslots) {
          if (hoursScheduled >= subject.hours_per_week) break;

          // Find an available room
          let selectedRoom = null;
          for (const room of appropriateRooms) {
            if (isSlotAvailable(teacherId, batch.id, room.id, timeslot.id)) {
              selectedRoom = room;
              break;
            }
          }

          if (!selectedRoom) continue;

          // Schedule this single 1-hour class
          timetableEntries.push({
            batch_id: batch.id,
            subject_id: subject.id,
            teacher_id: teacherId,
            room_id: selectedRoom.id,
            timeslot_id: timeslot.id,
          });

          occupySlot(teacherId, batch.id, selectedRoom.id, timeslot.id);
          hoursScheduled++;
          
          console.log(`✓ Scheduled 1-hour slot ${hoursScheduled}/${subject.hours_per_week} for ${subject.name} in ${batch.name} on ${timeslot.day} at ${timeslot.start_time}`);
        }
      }

      // If we couldn't schedule all hours, log a warning
      if (hoursScheduled < subject.hours_per_week) {
        console.warn(
          `Could only schedule ${hoursScheduled}/${subject.hours_per_week} hours for ${subject.name} in ${batch.name}`
        );
      } else {
        console.log(`Successfully scheduled ${hoursScheduled} hours for ${subject.name} in ${batch.name}`);
      }
    }
  }

  if (timetableEntries.length === 0) {
    throw new Error("Could not generate any timetable entries. Please check your data and teacher-subject assignments.");
  }

  console.log(`Generated ${timetableEntries.length} timetable entries successfully`);
  return timetableEntries;
}