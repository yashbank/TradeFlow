import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Gantt Dispatch DnD & Visual Feedback Suite", () => {
  const ganttPath = path.resolve(process.cwd(), "src/components/dashboard/GanttDispatchView.tsx");
  const dashboardPath = path.resolve(process.cwd(), "src/components/dashboard/OwnerPictorialDashboard.tsx");
  const jobsActionPath = path.resolve(process.cwd(), "src/actions/jobs.ts");

  const ganttCode = fs.readFileSync(ganttPath, "utf8");
  const dashboardCode = fs.readFileSync(dashboardPath, "utf8");
  const jobsActionCode = fs.readFileSync(jobsActionPath, "utf8");

  it("001. Enforces use client as the first line of GanttDispatchView", () => {
    const firstLine = ganttCode.trim().split("\n")[0].trim();
    expect(firstLine).toBe("'use client';");
  });

  it("002. Verifies draggable attribute on job bars in Gantt chart and unscheduled pool", () => {
    expect(ganttCode).toMatch(/draggable=\{true\}|draggable/);
    const draggableOccurrences = (ganttCode.match(/draggable=\{true\}|draggable/g) || []).length;
    expect(draggableOccurrences).toBeGreaterThanOrEqual(2);
  });

  it("003. Verifies onDragStart, onDragOver, onDrop, onDragLeave, onDragEnd handlers exist", () => {
    expect(ganttCode).toContain("onDragStart");
    expect(ganttCode).toContain("onDragOver");
    expect(ganttCode).toContain("onDrop");
    expect(ganttCode).toContain("onDragLeave");
    expect(ganttCode).toContain("onDragEnd");
  });

  it("004. Verifies visual feedback (opacity reduction on drag, drop target highlight, drop badge)", () => {
    expect(ganttCode).toContain("opacity-40");
    expect(ganttCode).toContain("isDropTarget");
    expect(ganttCode).toContain("ring-2");
    expect(ganttCode).toContain("Drop to assign");
  });

  it("005. Verifies server action rescheduleJobAction call with optimistic update and rollback", () => {
    expect(ganttCode).toContain("rescheduleJobAction");
    expect(ganttCode).toContain("toast.success");
    expect(ganttCode).toContain("toast.error");
    expect(ganttCode).toContain("setLocalJobs(prevJobs)");
  });

  it("006. Verifies bidirectional unscheduled jobs pool with drag to schedule and drop to unschedule", () => {
    expect(ganttCode).toContain("handleUnscheduledDrop");
    expect(ganttCode).toContain("handleUnscheduledDragOver");
    expect(ganttCode).toContain("Unscheduled Jobs Pool");
  });

  it("007. Verifies strict dark mode compliance: all bg-white must have dark:bg-* pair", () => {
    const lines = ganttCode.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("bg-white") && !line.includes("dark:bg-")) {
        if (!line.trim().startsWith("*") && !line.trim().startsWith("//")) {
          throw new Error(`Line ${i + 1} has bg-white without dark:bg-* pair: ${line}`);
        }
      }
    }
  });

  it("008. Verifies GanttDispatchView is imported and rendered in OwnerPictorialDashboard", () => {
    expect(dashboardCode).toContain("import { GanttDispatchView } from '@/components/dashboard/GanttDispatchView';");
    expect(dashboardCode).toMatch(/<GanttDispatchView\s+jobs=\{jobs\}\s+teamMembers=\{teamMembers\}\s*\/>/);
  });

  it("009. Verifies Gantt tab or section exists in OwnerPictorialDashboard", () => {
    expect(dashboardCode).toContain("Weekly Gantt Board");
    expect(dashboardCode).toContain("dispatchTab");
  });

  it("010. Verifies rescheduleJobAction supports start, end, and assigned technician persistence", () => {
    expect(jobsActionCode).toContain("export async function rescheduleJobAction(");
    expect(jobsActionCode).toContain("newAssignedToUserId");
    expect(jobsActionCode).toContain("assigned_to_user_id");
  });
});
