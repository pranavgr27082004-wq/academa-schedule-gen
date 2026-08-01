import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_records",
  title: "List scheduling records",
  description:
    "List rows from a scheduling table: teachers, subjects, rooms, batches, or timeslots.",
  inputSchema: {
    table: z
      .enum(["teachers", "subjects", "rooms", "batches", "timeslots"])
      .describe("Which scheduling table to read."),
    limit: z.number().int().min(1).max(200).default(100).describe("Max rows to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from(table).select("*").limit(limit ?? 100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { table, rows: data ?? [] },
    };
  },
});
