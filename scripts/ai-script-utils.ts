import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  extractReasoningMiddleware,
  type LanguageModel,
  wrapLanguageModel,
} from "ai";
import fs from "fs";
import path from "path";

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  teacher: string;
  status: string;
  link: string;
  programs: string[];
  type: "single" | "duo";
}

export type ModelProvider = "openrouter" | "litellm" | "lmstudio" | "gemini";

function formatTime(ms: number): string {
  if (ms < 60000) {
    return `${Math.floor(ms / 1000)}s`;
  }

  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export function createProgressBar(
  total: number,
  barLength: number = 30,
): {
  update: (current: number) => void;
  complete: () => void;
} {
  const startTime = Date.now();

  function calculateETA(current: number): string {
    if (current === 0) return "calculating...";

    const elapsedMs = Date.now() - startTime;
    const msPerItem = elapsedMs / current;
    const itemsRemaining = total - current;
    const msRemaining = msPerItem * itemsRemaining;

    return formatTime(msRemaining);
  }

  function render(current: number) {
    const percentage = Math.floor((current / total) * 100);
    const filledLength = Math.floor((current / total) * barLength);
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
    const eta = calculateETA(current);
    const elapsed = formatTime(Date.now() - startTime);

    process.stdout.write(
      `\r[${bar}] ${percentage}% | ${current}/${total} | Elapsed: ${elapsed} | ETA: ${eta}`,
    );

    if (current === total) {
      const totalTime = formatTime(Date.now() - startTime);
      process.stdout.write(`\nCompleted in ${totalTime}\n`);
    }
  }

  return {
    update: (current: number) => {
      render(current);
    },
    complete: () => {
      render(total);
    },
  };
}

export function getCliOption(
  optionName: string,
  shortName?: string,
): string | undefined {
  const args = process.argv.slice(2);
  const longForm = `--${optionName}`;
  const shortForm = shortName ? `-${shortName}` : "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === longForm || (shortForm && arg === shortForm)) {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("-")) {
        return nextArg;
      }
      continue;
    }

    if (arg.startsWith(`${longForm}=`)) {
      return arg.slice(longForm.length + 1);
    }

    if (shortForm && arg.startsWith(`${shortForm}=`)) {
      return arg.slice(shortForm.length + 1);
    }
  }

  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRateLimiter(
  requestsPerMinute: number,
): () => Promise<void> {
  const minIntervalMs = Math.ceil(60000 / requestsPerMinute);
  let nextAllowedAt = Date.now();
  let queue: Promise<void> = Promise.resolve();

  return async () => {
    queue = queue.then(async () => {
      const now = Date.now();
      const waitMs = Math.max(0, nextAllowedAt - now);
      if (waitMs > 0) {
        await sleep(waitMs);
      }

      const afterWait = Date.now();
      nextAllowedAt = Math.max(nextAllowedAt, afterWait) + minIntervalMs;
    });

    await queue;
  };
}

export function getConfiguredRequestsPerMinute(
  modelProvider: ModelProvider,
  openRouterDefault: number = 40,
): number {
  const raw = process.env.REQUESTS_PER_MINUTE;
  const fallback = modelProvider === "openrouter" ? openRouterDefault : 0;

  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const rpm = parseInt(raw, 10);
  if (Number.isNaN(rpm) || rpm < 0) {
    throw new Error("REQUESTS_PER_MINUTE must be a non-negative integer.");
  }

  return rpm;
}

export function getMostRecentProjectsFile(): string {
  const dataDir = path.join(__dirname, "..", "data");

  if (!fs.existsSync(dataDir)) {
    throw new Error("Data directory not found. Please run scrape-projects.ts first.");
  }

  const projectFiles = fs
    .readdirSync(dataDir)
    .filter((file) => file.startsWith("projects-") && file.endsWith(".json"))
    .map((file) => path.join(dataDir, file));

  if (projectFiles.length === 0) {
    throw new Error("No project data files found. Please run scrape-projects.ts first.");
  }

  projectFiles.sort((a, b) => {
    return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
  });

  return projectFiles[0];
}

function parseModelProvider(value: string): ModelProvider {
  switch (value) {
    case "openrouter":
    case "litellm":
    case "lmstudio":
    case "gemini":
      return value;
    default:
      throw new Error(
        `Unsupported MODEL_PROVIDER "${value}". Use one of: openrouter, litellm, lmstudio, gemini.`,
      );
  }
}

export function initializeLanguageModel(options?: {
  defaultProvider?: ModelProvider;
  useReasoningExtractionForNonOpenRouter?: boolean;
  log?: (message: string) => void;
}): {
  modelProvider: ModelProvider;
  baseModel: LanguageModel;
  model: LanguageModel;
} {
  const defaultProvider = options?.defaultProvider ?? "openrouter";
  const useReasoningExtractionForNonOpenRouter =
    options?.useReasoningExtractionForNonOpenRouter ?? false;
  const log = options?.log ?? ((message: string) => console.log(message));

  const modelProvider = parseModelProvider(
    process.env.MODEL_PROVIDER || defaultProvider,
  );
  log(`Using model provider: ${modelProvider}`);

  let baseModel: LanguageModel;

  if (modelProvider === "gemini") {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY environment variable is required for Gemini model");
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    baseModel = google("models/gemini-2.0-flash");
  } else if (modelProvider === "lmstudio") {
    const lmstudio = createOpenAICompatible({
      name: "lmstudio",
      baseURL: "http://localhost:1234/v1",
    });
    const modelName = process.env.LMSTUDIO_MODEL || "gemma-3-27b-it";
    baseModel = lmstudio(modelName);
  } else if (modelProvider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY environment variable is required for OpenRouter provider",
      );
    }

    const openRouterModel = process.env.OPENROUTER_MODEL || "stepfun/step-3.5-flash:free";
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    baseModel = openrouter(openRouterModel);
  } else {
    if (!process.env.LITE_LLM_API_KEY) {
      throw new Error("LITE_LLM_API_KEY environment variable is required for LiteLLM provider");
    }

    const liteLlmBaseUrl = process.env.LITE_LLM_BASE_URL || "https://llm.hpc.ntnu.no/v1";
    const liteLlmModel = process.env.LITE_LLM_MODEL || "openai/gpt-oss-120b";
    const liteLlm = createOpenAICompatible({
      name: "litellm",
      baseURL: liteLlmBaseUrl,
      apiKey: process.env.LITE_LLM_API_KEY,
    });
    baseModel = liteLlm(liteLlmModel);
  }

  if (useReasoningExtractionForNonOpenRouter && modelProvider !== "openrouter") {
    const wrappedModel = wrapLanguageModel({
      model: baseModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    });

    return {
      modelProvider,
      baseModel,
      model: wrappedModel,
    };
  }

  return {
    modelProvider,
    baseModel,
    model: baseModel,
  };
}
