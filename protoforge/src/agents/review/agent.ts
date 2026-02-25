import { readFile } from "node:fs/promises";

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

async function exists(path: string) {
  try {
    await readFile(path, "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function runReview(input: { featureId: string; template: string }) {
  const f = input.featureId;

  const checks: Array<{ name: string; ok: boolean }> = [
    { name: "base/memory/constitution.md exists", ok: await exists("base/memory/constitution.md") },
    { name: `specs/${f}/spec.md exists`, ok: await exists(`specs/${f}/spec.md`) },
    { name: `specs/${f}/plan.md exists`, ok: await exists(`specs/${f}/plan.md`) },
    { name: `specs/${f}/tasks.md exists`, ok: await exists(`specs/${f}/tasks.md`) },
    { name: `pocs/${f}/app/index.html exists`, ok: await exists(`pocs/${f}/app/index.html`) },
  ];

  const okCount = checks.filter((c) => c.ok).length;
  const summary = okCount === checks.length ? "All baseline checks passed." : "Some checks failed.";

  const checksMd = checks.map((c) => `- ${c.ok ? "[x]" : "[ ]"} ${c.name}`).join("\n");

  return renderTemplate(input.template, {
    featureId: f,
    summary,
    checks: checksMd,
    notes: "Incremental review only (no visual diff yet).",
  });
}
