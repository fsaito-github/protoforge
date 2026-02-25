import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export type PoInterviewAnswers = {
  projectName: string;
  context: string;
  targetUsers: string;
  mustHave: string;
  outOfScope: string;
  successCriteria: string;
};

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

function bulletsFromCsv(csv: string) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `- ${s}`)
    .join("\n");
}

export async function runPoInterview(): Promise<PoInterviewAnswers> {
  const rl = createInterface({ input, output });
  try {
    const projectName = (await rl.question("Project/app name: ")).trim() || "ProtoForge PoC";
    const context = (await rl.question("Problem/context (1-2 lines): ")).trim() || "(TBD)";
    const targetUsers = (await rl.question("Target users: ")).trim() || "(TBD)";
    const mustHave = (await rl.question("Must-have features (comma-separated): ")).trim() || "";
    const outOfScope = (await rl.question("Out of scope: ")).trim() || "(TBD)";
    const successCriteria = (await rl.question("Success criteria: ")).trim() || "(TBD)";

    return { projectName, context, targetUsers, mustHave, outOfScope, successCriteria };
  } finally {
    rl.close();
  }
}

export function generateConstitutionMarkdown(template: string, a: PoInterviewAnswers) {
  return renderTemplate(template, {
    projectName: a.projectName,
    outOfScope: a.outOfScope,
    successCriteria: a.successCriteria,
  });
}

export function generateSpecMarkdown(template: string, featureId: string, a: PoInterviewAnswers) {
  const mustHaveBullets = a.mustHave ? bulletsFromCsv(a.mustHave) : "- (TBD)";

  const userStories = [
    `- As a user, I can access the main screen for ${a.projectName}`,
    mustHaveBullets,
  ].join("\n");

  const acceptance = [
    "- Given the app is running, when I open it, then I see the main screen",
    "- Given I click the primary CTA, when the action completes, then I see feedback",
  ].join("\n");

  return renderTemplate(template, {
    featureId,
    context: a.context,
    targetUsers: a.targetUsers,
    userStories,
    acceptance,
  });
}
