import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_timetable",
  title: "Get timetable",
  description:
    "Read the generated weekly timetable with subject, teacher, room, batch and time slot details. Optionally filter by batch name, teacher name, or day.",
  inputSchema: {
    batch: z.string().trim().optional().describe("Filter to a batch name (case-insensitive)."),
    teacher: z.string().trim().optional().describe("Filter to a teacher name (case-insensitive)."),
    day: z.string().trim().optional().describe("Filter to a day, e.g. Monday."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ batch, teacher, day }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("timetable")
      .select(
        "id, subjects(name, code, type), teachers(name, email), rooms(number, type), batches(name, semester), timeslots(day, start_time, end_time)",
      );
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = (data ?? [])
      .map((row: any) => ({
        subject: row.subjects?.name ?? null,
        subject_code: row.subjects?.code ?? null,
        teacher: row.teachers?.name ?? null,
        room: row.rooms?.number ?? null,
        batch: row.batches?.name ?? null,
        semester: row.batches?.semester ?? null,
        day: row.timeslots?.day ?? null,
        start_time: row.timeslots?.start_time ?? null,
        end_time: row.timeslots?.end_time ?? null,
      }))
      .filter(
        (r) =>
          (!batch || (r.batch ?? "").toLowerCase().includes(batch.toLowerCase())) &&
          (!teacher || (r.teacher ?? "").toLowerCase().includes(teacher.toLowerCase())) &&
          (!day || (r.day ?? "").toLowerCase() === day.toLowerCase()),
      )
      .sort((a, b) => `${a.day}${a.start_time}`.localeCompare(`${b.day}${b.start_time}`));

    return {
      content: [{ type: "text", text: JSON.stringify(rows) }],
      structuredContent: { entries: rows },
    };
  },
});
