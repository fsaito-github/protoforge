import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  generateConstitutionMarkdown,
  generateSpecMarkdown,
  runPoInterview,
} from "../agents/po/agent.ts";

const FEATURE_ID = "001-poc-feature";

function usage() {
  console.log(`ProtoForge (incremental)\n\nCommands:\n  init       Create local folders\n  capture    Normalize a Figma JSON payload -> design-spec.json (stub)\n  interview  Run PO interview -> constitution+spec\n  architect  Generate plan/research/data-model\n  generate   Generate tasks.md + PoC output\n  review     Generate review.md\n  deploy     Generate deploy.md (Azure prereqs)\n  forge      Run architect->generate->review->deploy (requires spec.md)\n`);
}

async function ensureDir(p: string) {
  await mkdir(p, { recursive: true });
}

async function cmdInit() {
  await ensureDir("base/memory");
  await ensureDir(join("specs", FEATURE_ID));
  console.log("Created base/memory and specs/" + FEATURE_ID);
}

async function cmdInterview() {
  await cmdInit();

  const constitutionTpl = await readFile(join("src", "agents", "po", "templates", "constitution.md"), "utf8");
  const specTpl = await readFile(join("src", "agents", "po", "templates", "spec.md"), "utf8");

  const answers = await runPoInterview();

  const constitutionPath = join("base", "memory", "constitution.md");
  const specPath = join("specs", FEATURE_ID, "spec.md");

  await writeFile(constitutionPath, generateConstitutionMarkdown(constitutionTpl, answers), "utf8");
  await writeFile(specPath, generateSpecMarkdown(specTpl, FEATURE_ID, answers), "utf8");

  console.log("Wrote " + constitutionPath + " and " + specPath);
}

async function cmdCapture() {
  await cmdInit();

  const inputPath = process.argv[3];
  if (!inputPath) {
    console.error("Usage: capture <path-to-figma-json>");
    process.exit(2);
  }

  const raw = await readFile(inputPath, "utf8");
  const json = JSON.parse(raw) as unknown;

  const { normalizeFigmaToDesignSpec } = await import("../figma/normalizer.ts");
  const spec = normalizeFigmaToDesignSpec(json);

  const outPath = join("specs", FEATURE_ID, "design-spec.json");
  await writeFile(outPath, JSON.stringify(spec, null, 2), "utf8");
  console.log("Wrote " + outPath);
}

async function cmdArchitect() {
  await cmdInit();

  const featureDir = join("specs", FEATURE_ID);

  const planTpl = await readFile(join("src", "agents", "architect", "templates", "plan.md"), "utf8");
  const researchTpl = await readFile(join("src", "agents", "architect", "templates", "research.md"), "utf8");
  const dataModelTpl = await readFile(join("src", "agents", "architect", "templates", "data-model.md"), "utf8");

  const specMd = await readFile(join(featureDir, "spec.md"), "utf8");
  const projectNameMatch = specMd.match(/^#\s*Spec\s+—\s+.*$/m);
  const projectName = projectNameMatch ? "ProtoForge PoC" : "ProtoForge PoC";

  const { runArchitect } = await import("../agents/architect/agent.ts");
  const out = runArchitect(
    { plan: planTpl, research: researchTpl, dataModel: dataModelTpl },
    { featureId: FEATURE_ID, projectName },
  );

  await writeFile(join(featureDir, "plan.md"), out.planMd, "utf8");
  await writeFile(join(featureDir, "research.md"), out.researchMd, "utf8");
  await writeFile(join(featureDir, "data-model.md"), out.dataModelMd, "utf8");

  console.log("Wrote specs/" + FEATURE_ID + "/plan.md, research.md, data-model.md");
}

async function cmdGenerate() {
  await cmdInit();

  const { runCodegen } = await import("../agents/codegen/agent.ts");
  const tasksTpl = await readFile(join("src", "agents", "codegen", "templates", "tasks.md"), "utf8");

  const out = await runCodegen({
    featureId: FEATURE_ID,
    templateDir: join("templates", "static"),
    outDir: join("pocs", FEATURE_ID),
    tasksTemplate: tasksTpl,
  });

  console.log("Wrote " + out.tasksPath + " and generated PoC at " + out.appDir);
}

async function cmdReview() {
  await cmdInit();

  const tpl = await readFile(join("src", "agents", "review", "templates", "review.md"), "utf8");
  const { runReview } = await import("../agents/review/agent.ts");
  const reviewMd = await runReview({ featureId: FEATURE_ID, template: tpl });

  await writeFile(join("specs", FEATURE_ID, "review.md"), reviewMd, "utf8");
  console.log("Wrote specs/" + FEATURE_ID + "/review.md");
}

async function cmdDeploy() {
  await cmdInit();

  const tpl = await readFile(join("src", "agents", "deploy", "templates", "deploy.md"), "utf8");
  const { runDeploy } = await import("../agents/deploy/agent.ts");
  const deployMd = await runDeploy({ featureId: FEATURE_ID, template: tpl });

  await writeFile(join("specs", FEATURE_ID, "deploy.md"), deployMd, "utf8");
  console.log("Wrote specs/" + FEATURE_ID + "/deploy.md");
}

async function cmdForge() {
  await cmdInit();
  const { forge } = await import("../agents/orchestrator.ts");
  const out = await forge(FEATURE_ID);
  console.log("Forge complete: " + out.specDir + " + " + out.pocDir);
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd || cmd === "-h" || cmd === "--help") {
    usage();
    process.exit(0);
  }

  if (cmd === "init") return cmdInit();
  if (cmd === "capture") return cmdCapture();
  if (cmd === "interview") return cmdInterview();
  if (cmd === "architect") return cmdArchitect();
  if (cmd === "generate") return cmdGenerate();
  if (cmd === "review") return cmdReview();
  if (cmd === "deploy") return cmdDeploy();
  if (cmd === "forge") return cmdForge();

  console.error("Unknown command: " + cmd);
  usage();
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
