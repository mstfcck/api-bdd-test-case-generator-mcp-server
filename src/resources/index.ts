import {
  generatedStaticResources,
  generatedTemplateResources
} from "./generated.js";
import {
  staticResources as builtInStaticResources,
  templateResources as builtInTemplateResources
} from "./static.js";

export const staticResources = [
  ...builtInStaticResources,
  ...generatedStaticResources
] as const;

export const templateResources = [
  ...builtInTemplateResources,
  ...generatedTemplateResources
] as const;
