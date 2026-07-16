import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBuildMilestonesTool from "./tools/list-build-milestones";
import getReadinessSummaryTool from "./tools/get-readiness-summary";
import getCurrentProgramWeekTool from "./tools/get-current-program-week";

// Direct Supabase issuer — derived from the project ref (a build-time literal
// via Vite), never from SUPABASE_URL (which may be the .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "m2f-mcp",
  title: "M2F — Man to Father",
  version: "0.1.0",
  instructions:
    "Tools for the Man-to-Father app. Read the signed-in user's Build List milestones, Father Readiness score, and current training program week (Forge/Rebuild).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBuildMilestonesTool, getReadinessSummaryTool, getCurrentProgramWeekTool],
});
