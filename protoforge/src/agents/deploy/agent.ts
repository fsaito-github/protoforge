import { spawn } from "node:child_process";

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

async function runAz(args: string[]) {
  // On Windows, `az` is typically a .cmd; use cmd.exe for reliable resolution.
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const p = spawn("cmd.exe", ["/d", "/s", "/c", "az", ...args], { windowsHide: true });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += String(d)));
    p.stderr.on("data", (d) => (stderr += String(d)));
    p.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export async function runDeploy(input: { featureId: string; template: string }) {
  const account = await runAz(["account", "show", "--output", "json", "--only-show-errors"]);
  const loggedIn = account.code === 0;

  const prereqs = [
    "- Azure CLI installed (ok)",
    "- Logged into Azure (`az login`)" + (loggedIn ? " (ok)" : " (missing)"),
    "- Choose target: Static Web Apps vs Storage Static Website (TBD)",
  ].join("\n");

  const nextSteps = loggedIn
    ? [
        "1. Pick a resource group name + region",
        "2. Flesh out Bicep in templates/azure",
        "3. Deploy with `az deployment group create`",
      ].join("\n")
    : ["1. Run `az login`", "2. Re-run `npm run deploy`"].join("\n");

  const status = loggedIn ? "READY_FOR_AZURE_WORK" : "NEEDS_AZ_LOGIN";

  return renderTemplate(input.template, {
    featureId: input.featureId,
    status,
    prereqs,
    nextSteps,
  });
}
