function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

export type ArchitectInputs = {
  featureId: string;
  projectName: string;
};

export type ArchitectOutputs = {
  planMd: string;
  researchMd: string;
  dataModelMd: string;
};

// Incremental: a deterministic baseline architect that picks the simplest stack.
export function runArchitect(
  templates: { plan: string; research: string; dataModel: string },
  input: ArchitectInputs,
): ArchitectOutputs {
  const vars = {
    featureId: input.featureId,
    stack: "static (HTML/CSS/JS) for PoC speed",
    frontend: "static template",
    backend: "none (optional later: Azure Container App)",
    steps: [
      "- Generate UI from Design Spec into templates/static",
      "- Wire basic interactions and navigation",
      "- Add deploy via Azure Static Web Apps (later)",
    ].join("\n"),
    notes: `- Start with the simplest stack for ${input.projectName}\n- Upgrade to React/Next if needed`,
    entities: "- None (static PoC).",
  };

  return {
    planMd: renderTemplate(templates.plan, vars),
    researchMd: renderTemplate(templates.research, vars),
    dataModelMd: renderTemplate(templates.dataModel, vars),
  };
}
