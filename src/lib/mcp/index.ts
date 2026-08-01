import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRecordsTool from "./tools/list-records";
import getTimetableTool from "./tools/get-timetable";
import addTeacherTool from "./tools/add-teacher";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "academa-schedule-gen",
  title: "academa-schedule-gen",
  version: "0.1.0",
  instructions:
    "Tools for the Academa Scheduler timetable app. Use `list_records` to read teachers, subjects, rooms, batches, or time slots; `get_timetable` to read the generated weekly schedule (filterable by batch, teacher, or day); and `add_teacher` to create a teacher. Timetable generation itself happens in the app UI.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRecordsTool, getTimetableTool, addTeacherTool],
});
