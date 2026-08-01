import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_teacher",
  title: "Add teacher",
  description: "Create a new teacher record with a name and email.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Teacher full name."),
    email: z.string().trim().min(3).describe("Teacher email address."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, email }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("teachers").insert({ name, email }).select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { teacher: data?.[0] ?? null },
    };
  },
});
