import { cp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

export async function runCodegen(input: {
  featureId: string;
  templateDir: string;
  outDir: string;
  tasksTemplate: string;
}) {
  await mkdir(input.outDir, { recursive: true });

  // 1) Write tasks.md into Spec Kit folder
  const tasksMd = renderTemplate(input.tasksTemplate, { featureId: input.featureId });
  await writeFile(join("specs", input.featureId, "tasks.md"), tasksMd, "utf8");

  // 2) Materialize PoC folder (static template for now)
  const appDir = join(input.outDir, "app");
  await mkdir(appDir, { recursive: true });
  await cp(input.templateDir, appDir, { recursive: true });

  await writeFile(
    join(input.outDir, "README.md"),
    `# PoC — ${input.featureId}\n\nRun: open ./app/index.html in a browser.\n`,
    "utf8",
  );

  return { tasksPath: join("specs", input.featureId, "tasks.md"), appDir };
}
