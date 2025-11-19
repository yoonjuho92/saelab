import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface PromptTemplate {
  system: string;
  user: string;
}

interface Prompts {
  _common: {
    base_system: string;
  };
  create_logline: PromptTemplate;
  create_from_logline_w_gulino: PromptTemplate;
  create_from_logline_w_vogel: PromptTemplate;
  create_from_logline_w_snider: PromptTemplate;
  extract_plot_point: PromptTemplate;
  extract_structure: PromptTemplate;
  create_from_logline: PromptTemplate;
  revise_story_structure: PromptTemplate;
  extract_character: PromptTemplate;
  revise_story_with_character: PromptTemplate;
}

let prompts: Prompts | null = null;

export function loadPrompts(): Prompts {
  // In development, always reload to pick up changes
  if (process.env.NODE_ENV === "development") {
    prompts = null;
  }

  if (prompts) return prompts;

  const promptsPath = path.join(process.cwd(), "lib", "prompts.yaml");
  const fileContents = fs.readFileSync(promptsPath, "utf8");
  prompts = yaml.load(fileContents) as Prompts;

  return prompts;
}

export function getPrompt(
  promptName: keyof Omit<Prompts, "_common">
): PromptTemplate {
  const allPrompts = loadPrompts();
  const prompt = allPrompts[promptName];

  if (!prompt) {
    throw new Error(
      `Prompt "${promptName}" not found. Available prompts: ${Object.keys(
        allPrompts
      ).join(", ")}`
    );
  }

  return prompt;
}

export function formatPrompt(
  promptName: keyof Omit<Prompts, "_common">,
  variables: Record<string, string>
): { system: string; user: string } {
  const prompt = getPrompt(promptName);

  if (!prompt.user || !prompt.system) {
    throw new Error(
      `Prompt "${promptName}" is missing required fields. System: ${!!prompt.system}, User: ${!!prompt.user}`
    );
  }

  let formattedUser = prompt.user;
  for (const [key, value] of Object.entries(variables)) {
    formattedUser = formattedUser.replace(
      new RegExp(`\\{${key}\\}`, "g"),
      value
    );
  }

  return {
    system: prompt.system,
    user: formattedUser,
  };
}
