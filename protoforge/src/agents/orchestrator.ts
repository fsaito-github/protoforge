import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function forge(featureId: string) {
  // Pre-req: spec exists (produced by PO agent).
  await readFile(join("specs", featureId, "spec.md"), "utf8");

  // Architect
  const planTpl = await readFile(join("src", "agents", "architect", "templates", "plan.md"), "utf8");
  const researchTpl = await readFile(join("src", "agents", "architect", "templates", "research.md"), "utf8");
  const dataModelTpl = await readFile(join("src", "agents", "architect", "templates", "data-model.md"), "utf8");
  const { runArchitect } = await import("./architect/agent.ts");
  const archOut = runArchitect(
    { plan: planTpl, research: researchTpl, dataModel: dataModelTpl },
    { featureId, projectName: "ProtoForge PoC" },
  );
  await writeFile(join("specs", featureId, "plan.md"), archOut.planMd, "utf8");
  await writeFile(join("specs", featureId, "research.md"), archOut.researchMd, "utf8");
  await writeFile(join("specs", featureId, "data-model.md"), archOut.dataModelMd, "utf8");

  // Codegen
  const tasksTpl = await readFile(join("src", "agents", "codegen", "templates", "tasks.md"), "utf8");
  const { runCodegen } = await import("./codegen/agent.ts");
  await runCodegen({
    featureId,
    templateDir: join("templates", "static"),
    outDir: join("pocs", featureId),
    tasksTemplate: tasksTpl,
  });

  // Review
  const reviewTpl = await readFile(join("src", "agents", "review", "templates", "review.md"), "utf8");
  const { runReview } = await import("./review/agent.ts");
  const reviewMd = await runReview({ featureId, template: reviewTpl });
  await writeFile(join("specs", featureId, "review.md"), reviewMd, "utf8");

  // Deploy (instructions)
  const deployTpl = await readFile(join("src", "agents", "deploy", "templates", "deploy.md"), "utf8");
  const { runDeploy } = await import("./deploy/agent.ts");
  const deployMd = await runDeploy({ featureId, template: deployTpl });
  await writeFile(join("specs", featureId, "deploy.md"), deployMd, "utf8");

  return {
    specDir: join("specs", featureId),
    pocDir: join("pocs", featureId),
  };
}
