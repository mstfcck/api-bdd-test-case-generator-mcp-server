import { examplePrompts as builtInPrompts } from "./examples.js";
import { generatedPrompts } from "./generated.js";

export const examplePrompts = [...builtInPrompts, ...generatedPrompts] as const;
