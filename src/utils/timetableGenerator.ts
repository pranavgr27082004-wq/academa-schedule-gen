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
  const batchDaySubjects = new Map<string, Map<string, string[]>>(); // batch_id -> day -> [subject_ids in order]
  const teacherDayWorkload = new Map<string, Map<string, number>>(); // teacher_id -> day -> hours_count

  // Initialize tracking maps
  teachers.forEach(t => {
    teacherSlots.set(t.id, new Set());
    teacherDayWorkload.set(t.id, new Map());
  });
  rooms.forEach(r => roomSlots.set(r.id, new Set()));
  batches.forEach(b => {
    batchSlots.set(b.id, new Set());
    batchDaySubjects.set(b.id, new Map());
  });

  // Helper function to check if a slot is available
  const isSlotAvailable = (teacherId: string, batchId: string, roomId: string, timeslotId: string): boolean => {
    return !teacherSlots.get(teacherId)?.has(timeslotId) &&
           !batchSlots.get(batchId)?.has(timeslotId) &&
           !roomSlots.get(roomId)?.has(timeslotId);
  };

  // Helper function to mark slot as occupied
  const occupySlot = (teacherId: string, batchId: string, roomId: string, timeslotId: string, subjectId: string, day: string) => {
    teacherSlots.get(teacherId)?.add(timeslotId);
    batchSlots.get(batchId)?.add(timeslotId);
    roomSlots.get(roomId)?.add(timeslotId);
    
    // Track teacher workload per day
    const teacherWorkload = teacherDayWorkload.get(teacherId);
    if (teacherWorkload) {
      const currentHours = teacherWorkload.get(day) || 0;
      teacherWorkload.set(day, currentHours + 1);
    }
    
    // Track subject order per batch per day
    const batchDays = batchDaySubjects.get(batchId);
    if (batchDays) {
      if (!batchDays.has(day)) {
        batchDays.set(day, []);
      }
      batchDays.get(day)?.push(subjectId);
    }
  };

  // Helper function to check teacher workload (max 6 hours per day recommended)
  const isTeacherOverworked = (teacherId: string, day: string, additionalHours: number = 1): boolean => {
    const teacherWorkload = teacherDayWorkload.get(teacherId);
    if (!teacherWorkload) return false;
    
    const currentHours = teacherWorkload.get(day) || 0;
    const MAX_HOURS_PER_DAY = 6;
    return (currentHours + additionalHours) > MAX_HOURS_PER_DAY;
  };

  // Helper function to check if teacher has a break (at least 1 hour gap in a 4-hour period)
  const teacherNeedsBreak = (teacherId: string, timeslotIndex: number): boolean => {
    const recentSlots = classTimeslots.slice(Math.max(0, timeslotIndex - 3), timeslotIndex);
    let consecutiveCount = 0;
    
    for (let i = recentSlots.length - 1; i >= 0; i--) {
      if (teacherSlots.get(teacherId)?.has(recentSlots[i].id)) {
        consecutiveCount++;
      } else {
        break;
      }
    }
    
    return consecutiveCount >= 3; // 3 consecutive hours = needs break
  };

  // Helper function to check if subject would be consecutive on the same day
  const wouldBeConsecutive = (batchId: string, subjectId: string, day: string): boolean => {
    const batchDays = batchDaySubjects.get(batchId);
    if (!batchDays) return false;
    
    const daySubjects = batchDays.get(day);
    if (!daySubjects || daySubjects.length === 0) return false;
    
    // Check if the last scheduled subject on this day is the same
    return daySubjects[daySubjects.length - 1] === subjectId;
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

  // Separate subjects into labs and theory
  const labSubjects = subjects.filter(s => s.type === 'Lab');
  const theorySubjects = subjects.filter(s => s.type !== 'Lab');

  console.log(`Found ${labSubjects.length} lab subjects and ${theorySubjects.length} theory subjects`);

  // PHASE 1: Schedule all lab subjects first (2-hour continuous blocks)
  // Use round-robin approach to ensure fair distribution
  console.log('\n=== PHASE 1: Scheduling Lab Subjects ===');
  
  for (const batch of batches) {
    for (const subject of labSubjects) {
      // Find teacher for this subject
      const teacherIds = assignments
        .filter(a => a.subject_id === subject.id)
        .map(a => a.teacher_id);
      
      if (teacherIds.length === 0) {
        console.warn(`No teacher assigned for lab subject: ${subject.name}`);
        continue;
      }

      const teacherId = teacherIds[0];

      // Find lab rooms - prefer lab type but allow regular rooms if needed
      let appropriateRooms = rooms.filter(r => r.type === 'Lab');
      
      if (appropriateRooms.length === 0) {
        console.warn(`No dedicated lab rooms found for ${subject.name}, using any available room`);
        appropriateRooms = rooms;
      }

      if (appropriateRooms.length === 0) {
        console.warn(`No rooms available for lab subject: ${subject.name}`);
        continue;
      }

      const blocksNeeded = Math.ceil(subject.hours_per_week / 2);
      let blocksScheduled = 0;
      let hoursScheduled = 0;
      
      console.log(`\nScheduling ${blocksNeeded} 2-hour blocks for ${subject.name} in ${batch.name}`);
      
      // Try to schedule each 2-hour block
      for (let i = 0; i < classTimeslots.length && blocksScheduled < blocksNeeded; i++) {
        const consecutiveSlots = findConsecutiveSlots(i, 2);
        
        if (!consecutiveSlots) {
          continue;
        }

        const day = consecutiveSlots[0].day;
        
        // Check if teacher is overworked on this day
        if (isTeacherOverworked(teacherId, day, 2)) {
          console.log(`  ⏭ Skipping ${day} - teacher ${teacherId} would be overworked (already has ${teacherDayWorkload.get(teacherId)?.get(day) || 0} hours)`);
          continue;
        }
        
        // Check if teacher needs a break
        if (teacherNeedsBreak(teacherId, i)) {
          console.log(`  ⏭ Skipping slot ${i} - teacher ${teacherId} needs a break`);
          continue;
        }
        
        // Try each room to find one that's available for both slots
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
          console.log(`  ⏭ No available room for ${day} ${consecutiveSlots[0].start_time}-${consecutiveSlots[1].end_time}`);
          continue;
        }

        // Schedule both consecutive slots for this lab block
        for (const slot of consecutiveSlots) {
          timetableEntries.push({
            batch_id: batch.id,
            subject_id: subject.id,
            teacher_id: teacherId,
            room_id: selectedRoom.id,
            timeslot_id: slot.id,
          });

          occupySlot(teacherId, batch.id, selectedRoom.id, slot.id, subject.id, day);
          hoursScheduled++;
        }

        blocksScheduled++;
        console.log(`  ✓ Block ${blocksScheduled}/${blocksNeeded}: ${day} ${consecutiveSlots[0].start_time}-${consecutiveSlots[1].end_time} in Room ${selectedRoom.number} (Teacher workload: ${teacherDayWorkload.get(teacherId)?.get(day) || 0}h)`);
        
        // Skip the next slot since we just used it
        i++;
      }
      
      if (blocksScheduled < blocksNeeded) {
        console.warn(`  ⚠ Only scheduled ${blocksScheduled}/${blocksNeeded} blocks (${hoursScheduled}/${subject.hours_per_week} hours) for ${subject.name} in ${batch.name}`);
      } else {
        console.log(`  ✓ Successfully scheduled all ${blocksScheduled} blocks for ${subject.name} in ${batch.name}`);
      }
    }
  }

  // PHASE 2: Schedule all theory subjects with proper distribution
  console.log('\n=== PHASE 2: Scheduling Theory Subjects ===');
  
  for (const batch of batches) {
    for (const subject of theorySubjects) {
      // Find teacher for this subject
      const teacherIds = assignments
        .filter(a => a.subject_id === subject.id)
        .map(a => a.teacher_id);
      
      if (teacherIds.length === 0) {
        console.warn(`No teacher assigned for theory subject: ${subject.name}`);
        continue;
      }

      const teacherId = teacherIds[0];

      // All rooms can be used for theory classes
      const appropriateRooms = rooms;

      if (appropriateRooms.length === 0) {
        console.warn(`No rooms available for theory subject: ${subject.name}`);
        continue;
      }

      let hoursScheduled = 0;
      const scheduledDays = new Map<string, number>();
      
      console.log(`\nScheduling ${subject.hours_per_week} hours for ${subject.name} in ${batch.name}`);
      
      // Multi-pass scheduling to ensure proper distribution
      // Pass 1: One slot per day (maximum distribution)
      // Pass 2: Two slots per day if needed
      // Pass 3: More slots if still needed
      for (let attempt = 0; attempt < 3 && hoursScheduled < subject.hours_per_week; attempt++) {
        for (let i = 0; i < classTimeslots.length && hoursScheduled < subject.hours_per_week; i++) {
          const timeslot = classTimeslots[i];
          const day = timeslot.day;
          
          // CRITICAL: Skip if this would create consecutive classes of the same subject
          if (wouldBeConsecutive(batch.id, subject.id, day)) {
            continue;
          }
          
          // Check if teacher is overworked on this day
          if (isTeacherOverworked(teacherId, day)) {
            continue;
          }
          
          // Check if teacher needs a break
          if (teacherNeedsBreak(teacherId, i)) {
            continue;
          }
          
          // Distribution strategy based on attempt
          const dayCount = scheduledDays.get(day) || 0;
          if (attempt === 0 && dayCount > 0) continue; // Pass 1: max 1 per day
          if (attempt === 1 && dayCount > 1) continue; // Pass 2: max 2 per day
          // Pass 3: no day limit

          // Find an available room for this slot
          let selectedRoom = null;
          for (const room of appropriateRooms) {
            if (isSlotAvailable(teacherId, batch.id, room.id, timeslot.id)) {
              selectedRoom = room;
              break;
            }
          }

          if (!selectedRoom) continue;

          // Schedule this 1-hour theory class
          timetableEntries.push({
            batch_id: batch.id,
            subject_id: subject.id,
            teacher_id: teacherId,
            room_id: selectedRoom.id,
            timeslot_id: timeslot.id,
          });

          occupySlot(teacherId, batch.id, selectedRoom.id, timeslot.id, subject.id, day);
          scheduledDays.set(day, (scheduledDays.get(day) || 0) + 1);
          hoursScheduled++;
          
          console.log(`  ✓ Slot ${hoursScheduled}/${subject.hours_per_week}: ${day} ${timeslot.start_time} in Room ${selectedRoom.number} (Teacher workload: ${teacherDayWorkload.get(teacherId)?.get(day) || 0}h)`);
        }
      }

      if (hoursScheduled < subject.hours_per_week) {
        console.warn(`  ⚠ Only scheduled ${hoursScheduled}/${subject.hours_per_week} hours for ${subject.name} in ${batch.name}`);
      } else {
        console.log(`  ✓ Successfully scheduled all ${hoursScheduled} hours for ${subject.name} in ${batch.name}`);
      }
    }
  }

  if (timetableEntries.length === 0) {
    throw new Error("Could not generate any timetable entries. Please check your data and teacher-subject assignments.");
  }

  console.log(`Generated ${timetableEntries.length} timetable entries successfully`);
  return timetableEntries;
}