# Sequential Thinking MCP Server - Technical Reference

> **Source**: [modelcontextprotocol/servers - sequentialthinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)  
> **Version**: 0.2.0  
> **Purpose**: A detailed tool for dynamic and reflective problem-solving through a structured thinking process

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Core Components](#core-components)
5. [Tool Interface](#tool-interface)
6. [Processing Logic](#processing-logic)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Configuration](#configuration)
10. [Testing Strategy](#testing-strategy)

---

## Overview

The Sequential Thinking MCP server implements a **Chain of Thought (CoT)** reasoning pattern that allows LLMs to break down complex problems into manageable, iterative steps. It provides a single MCP tool called `sequentialthinking` that processes thoughts sequentially while maintaining state across multiple invocations.

### Key Capabilities

- **Dynamic Planning**: Adjust total thought estimates as understanding evolves
- **Revision Support**: Question and revise previous thoughts
- **Branching Logic**: Explore alternative reasoning paths
- **Context Preservation**: Maintain thought history across invocations
- **Hypothesis Generation & Verification**: Iterative solution validation
- **Irrelevant Information Filtering**: Focus on relevant steps

---

## Architecture

### Project Structure

```
src/sequentialthinking/
├── index.ts              # MCP server entry point
├── lib.ts                # Core logic implementation
├── Dockerfile            # Container build configuration
├── package.json          # Dependencies and metadata
├── jest.config.cjs       # Test configuration
└── __tests__/
    └── lib.test.ts       # Comprehensive unit tests
```

### Technology Stack

- **Runtime**: Node.js 22+ (Alpine Linux for Docker)
- **Language**: TypeScript with ESM modules
- **MCP SDK**: `@modelcontextprotocol/sdk` (stdio transport)
- **Formatting**: `chalk` for colored console output
- **Testing**: Jest with ts-jest
- **Build**: TypeScript compiler → `dist/` output

---

## Data Flow

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         LLM Client                              │
│                    (Claude, VS Code, etc.)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ MCP Protocol (stdio)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    MCP Server (index.ts)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Server Initialization                                   │  │
│  │  - Create Server instance                                │  │
│  │  - Register ListToolsRequestSchema handler               │  │
│  │  - Register CallToolRequestSchema handler                │  │
│  │  - Connect StdioServerTransport                          │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          │ Tool Invocation
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│           SequentialThinkingServer (lib.ts)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  processThought(input)                                  │   │
│  │    1. validateThoughtData()                             │   │
│  │    2. Auto-adjust totalThoughts if needed               │   │
│  │    3. Push to thoughtHistory[]                          │   │
│  │    4. Track branches (if applicable)                    │   │
│  │    5. formatThought() & log to stderr                   │   │
│  │    6. Return JSON response                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  State:                                                          │
│  - thoughtHistory: ThoughtData[]                                │
│  - branches: Record<string, ThoughtData[]>                      │
│  - disableThoughtLogging: boolean                               │
└──────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Processing Flow

#### 1. **Input Reception**
```typescript
// LLM sends tool call via MCP
{
  "name": "sequentialthinking",
  "arguments": {
    "thought": "Analyzing the problem...",
    "thoughtNumber": 1,
    "totalThoughts": 5,
    "nextThoughtNeeded": true
  }
}
```

#### 2. **Validation Phase**
```typescript
validateThoughtData(input: unknown): ThoughtData {
  // Type checking
  - thought: must be non-empty string
  - thoughtNumber: must be positive integer
  - totalThoughts: must be positive integer
  - nextThoughtNeeded: must be boolean
  
  // Optional fields
  - isRevision?: boolean
  - revisesThought?: number
  - branchFromThought?: number
  - branchId?: string
  - needsMoreThoughts?: boolean
}
```

#### 3. **State Update**
```typescript
// Auto-adjust total if exceeded
if (thoughtNumber > totalThoughts) {
  totalThoughts = thoughtNumber;
}

// Add to history
thoughtHistory.push(validatedInput);

// Track branches
if (branchFromThought && branchId) {
  branches[branchId].push(validatedInput);
}
```

#### 4. **Logging (Optional)**
```typescript
if (!disableThoughtLogging) {
  formatThought(validatedInput);
  // Output to stderr with colored borders
}
```

#### 5. **Response Generation**
```typescript
return {
  content: [{
    type: "text",
    text: JSON.stringify({
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      branches: ["branch-a"],
      thoughtHistoryLength: 3
    })
  }]
};
```

---

## Core Components

### 1. MCP Server Setup (`index.ts`)

```typescript
// Server initialization
const server = new Server(
  {
    name: "sequential-thinking-server",
    version: "0.2.0",
  },
  {
    capabilities: { tools: {} }
  }
);

// Transport connection
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Key Responsibilities:**
- Initialize MCP server with metadata
- Register request handlers for `ListToolsRequestSchema` and `CallToolRequestSchema`
- Manage stdio transport connection
- Delegate tool calls to `SequentialThinkingServer`

### 2. Sequential Thinking Engine (`lib.ts`)

#### ThoughtData Interface

```typescript
export interface ThoughtData {
  // Required fields
  thought: string;              // Current thinking step content
  thoughtNumber: number;        // Current step number (1-indexed)
  totalThoughts: number;        // Estimated total steps needed
  nextThoughtNeeded: boolean;   // Continue thinking?
  
  // Optional fields for advanced patterns
  isRevision?: boolean;         // Is this revising previous thought?
  revisesThought?: number;      // Which thought to revise
  branchFromThought?: number;   // Branching point
  branchId?: string;            // Branch identifier
  needsMoreThoughts?: boolean;  // Need to extend beyond totalThoughts?
}
```

#### SequentialThinkingServer Class

```typescript
export class SequentialThinkingServer {
  // State management
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};
  private disableThoughtLogging: boolean;
  
  // Constructor
  constructor() {
    this.disableThoughtLogging = 
      (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
  }
  
  // Core methods
  private validateThoughtData(input: unknown): ThoughtData
  private formatThought(thoughtData: ThoughtData): string
  public processThought(input: unknown): ResponseObject
}
```

---

## Tool Interface

### Tool Definition

```typescript
const SEQUENTIAL_THINKING_TOOL: Tool = {
  name: "sequentialthinking",
  description: `A detailed tool for dynamic and reflective problem-solving...`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step"
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed"
      },
      thoughtNumber: {
        type: "integer",
        description: "Current thought number (1, 2, 3...)",
        minimum: 1
      },
      totalThoughts: {
        type: "integer",
        description: "Estimated total thoughts needed (5, 10...)",
        minimum: 1
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking"
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1
      },
      branchId: {
        type: "string",
        description: "Branch identifier"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed"
      }
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
  }
};
```

### Usage Patterns

#### 1. **Linear Thinking**
```typescript
// Thought 1
{
  thought: "Identify the problem",
  thoughtNumber: 1,
  totalThoughts: 3,
  nextThoughtNeeded: true
}

// Thought 2
{
  thought: "Analyze possible solutions",
  thoughtNumber: 2,
  totalThoughts: 3,
  nextThoughtNeeded: true
}

// Thought 3
{
  thought: "Select optimal solution",
  thoughtNumber: 3,
  totalThoughts: 3,
  nextThoughtNeeded: false  // Done!
}
```

#### 2. **Revision Pattern**
```typescript
// Initial thought
{
  thought: "Initial approach seems flawed",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true
}

// Revise previous
{
  thought: "Reconsidering the approach from thought 2",
  thoughtNumber: 3,
  totalThoughts: 5,
  nextThoughtNeeded: true,
  isRevision: true,
  revisesThought: 2
}
```

#### 3. **Branching Pattern**
```typescript
// Main thought
{
  thought: "Two possible approaches identified",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
}

// Branch A
{
  thought: "Exploring approach A",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true,
  branchFromThought: 1,
  branchId: "approach-a"
}

// Branch B
{
  thought: "Exploring approach B",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true,
  branchFromThought: 1,
  branchId: "approach-b"
}
```

#### 4. **Dynamic Extension**
```typescript
// Thought 3 (out of estimated 3)
{
  thought: "Need more analysis",
  thoughtNumber: 3,
  totalThoughts: 3,
  nextThoughtNeeded: true,  // Still need more!
  needsMoreThoughts: true
}

// Thought 4 (auto-adjusts totalThoughts to 4)
{
  thought: "Additional analysis complete",
  thoughtNumber: 4,
  totalThoughts: 3,  // Will be auto-adjusted to 4
  nextThoughtNeeded: false
}
```

---

## Processing Logic

### Validation Logic

```typescript
private validateThoughtData(input: unknown): ThoughtData {
  const data = input as Record<string, unknown>;

  // Required field validation
  if (!data.thought || typeof data.thought !== 'string') {
    throw new Error('Invalid thought: must be a string');
  }
  
  if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
    throw new Error('Invalid thoughtNumber: must be a number');
  }
  
  if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
    throw new Error('Invalid totalThoughts: must be a number');
  }
  
  if (typeof data.nextThoughtNeeded !== 'boolean') {
    throw new Error('Invalid nextThoughtNeeded: must be a boolean');
  }

  // Return validated object
  return {
    thought: data.thought,
    thoughtNumber: data.thoughtNumber,
    totalThoughts: data.totalThoughts,
    nextThoughtNeeded: data.nextThoughtNeeded,
    isRevision: data.isRevision as boolean | undefined,
    revisesThought: data.revisesThought as number | undefined,
    branchFromThought: data.branchFromThought as number | undefined,
    branchId: data.branchId as string | undefined,
    needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
  };
}
```

### Formatting Logic

```typescript
private formatThought(thoughtData: ThoughtData): string {
  const { thoughtNumber, totalThoughts, thought, 
          isRevision, revisesThought, 
          branchFromThought, branchId } = thoughtData;

  let prefix = '';
  let context = '';

  // Determine thought type
  if (isRevision) {
    prefix = chalk.yellow('🔄 Revision');
    context = ` (revising thought ${revisesThought})`;
  } else if (branchFromThought) {
    prefix = chalk.green('🌿 Branch');
    context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
  } else {
    prefix = chalk.blue('💭 Thought');
    context = '';
  }

  // Create formatted box
  const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
  const border = '─'.repeat(Math.max(header.length, thought.length) + 4);

  return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
}
```

**Example Output:**
```
┌──────────────────────────────────────────────┐
│ 💭 Thought 1/5                               │
├──────────────────────────────────────────────┤
│ Analyzing the problem structure             │
└──────────────────────────────────────────────┘
```

### Main Processing Method

```typescript
public processThought(input: unknown): ResponseObject {
  try {
    // 1. Validate input
    const validatedInput = this.validateThoughtData(input);

    // 2. Auto-adjust totalThoughts if needed
    if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
      validatedInput.totalThoughts = validatedInput.thoughtNumber;
    }

    // 3. Update history
    this.thoughtHistory.push(validatedInput);

    // 4. Track branches
    if (validatedInput.branchFromThought && validatedInput.branchId) {
      if (!this.branches[validatedInput.branchId]) {
        this.branches[validatedInput.branchId] = [];
      }
      this.branches[validatedInput.branchId].push(validatedInput);
    }

    // 5. Log (if enabled)
    if (!this.disableThoughtLogging) {
      const formattedThought = this.formatThought(validatedInput);
      console.error(formattedThought);  // stderr for debugging
    }

    // 6. Return success response
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          thoughtNumber: validatedInput.thoughtNumber,
          totalThoughts: validatedInput.totalThoughts,
          nextThoughtNeeded: validatedInput.nextThoughtNeeded,
          branches: Object.keys(this.branches),
          thoughtHistoryLength: this.thoughtHistory.length
        }, null, 2)
      }]
    };
  } catch (error) {
    // Error response
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          status: 'failed'
        }, null, 2)
      }],
      isError: true
    };
  }
}
```

---

## State Management

### Thought History

**Data Structure:**
```typescript
private thoughtHistory: ThoughtData[] = [];
```

**Purpose:**
- Tracks all thoughts in chronological order
- Enables backtracking and revision
- Provides context length for debugging

**Operations:**
```typescript
// Add thought
this.thoughtHistory.push(validatedInput);

// Get history length
const length = this.thoughtHistory.length;
```

### Branch Tracking

**Data Structure:**
```typescript
private branches: Record<string, ThoughtData[]> = {};
```

**Purpose:**
- Tracks alternative reasoning paths
- Groups related thoughts by branch ID
- Supports parallel exploration

**Operations:**
```typescript
// Create or append to branch
if (validatedInput.branchFromThought && validatedInput.branchId) {
  if (!this.branches[validatedInput.branchId]) {
    this.branches[validatedInput.branchId] = [];
  }
  this.branches[validatedInput.branchId].push(validatedInput);
}

// Get all branch IDs
const branchIds = Object.keys(this.branches);
```

### State Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│  Server Startup                                         │
│  - thoughtHistory = []                                  │
│  - branches = {}                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Process Thought 1                                      │
│  - thoughtHistory = [thought1]                          │
│  - branches = {}                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Process Thought 2 (branch A)                           │
│  - thoughtHistory = [thought1, thought2]                │
│  - branches = { "branch-a": [thought2] }                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Process Thought 3 (branch B)                           │
│  - thoughtHistory = [thought1, thought2, thought3]      │
│  - branches = {                                         │
│      "branch-a": [thought2],                            │
│      "branch-b": [thought3]                             │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
```

**Important Notes:**
- State persists for the lifetime of the server process
- Each MCP client connection maintains its own `SequentialThinkingServer` instance
- State is **not** persisted to disk
- Server restart clears all history

---

## Error Handling

### Validation Errors

```typescript
// Example error responses
{
  "content": [{
    "type": "text",
    "text": "{
      \"error\": \"Invalid thought: must be a string\",
      \"status\": \"failed\"
    }"
  }],
  "isError": true
}
```

**Common Validation Errors:**

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `Invalid thought: must be a string` | Missing or non-string `thought` | Provide non-empty string |
| `Invalid thoughtNumber: must be a number` | Missing or non-number `thoughtNumber` | Provide positive integer |
| `Invalid totalThoughts: must be a number` | Missing or non-number `totalThoughts` | Provide positive integer |
| `Invalid nextThoughtNeeded: must be a boolean` | Missing or non-boolean `nextThoughtNeeded` | Provide `true` or `false` |

### Edge Cases Handled

1. **Empty thought string**: Rejected with error
2. **thoughtNumber > totalThoughts**: Auto-adjusts `totalThoughts`
3. **Very long thought strings**: Accepted (tested up to 10,000 chars)
4. **Single thought (1/1)**: Valid terminal case
5. **Missing optional fields**: Safely handled as `undefined`

---

## Configuration

### Environment Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `DISABLE_THOUGHT_LOGGING` | `boolean` | `false` | Disable stderr logging of formatted thoughts |

**Usage:**
```bash
# Disable logging
export DISABLE_THOUGHT_LOGGING=true

# Enable logging (default)
export DISABLE_THOUGHT_LOGGING=false
# or omit the variable entirely
```

### MCP Configuration

#### NPX Installation

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }
  }
}
```

#### Docker Installation

```json
{
  "servers": {
    "sequential-thinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/sequentialthinking"
      ]
    }
  }
}
```

**Docker Build:**
```bash
docker build -t mcp/sequentialthinking -f src/sequentialthinking/Dockerfile .
```

---

## Testing Strategy

### Test Coverage

The project includes comprehensive unit tests in `__tests__/lib.test.ts`:

#### Test Categories

1. **Validation Tests** (11 tests)
   - Missing required fields
   - Invalid data types
   - Empty strings
   - Type coercion prevention

2. **Valid Input Tests** (4 tests)
   - Basic valid thought
   - Optional fields handling
   - Multiple thoughts tracking
   - Auto-adjustment of totalThoughts

3. **Branching Tests** (2 tests)
   - Branch tracking
   - Multiple thoughts in same branch

4. **Edge Cases** (3 tests)
   - Empty thought string
   - Very long strings (10,000 chars)
   - Single thought scenario (1/1)

5. **Response Format Tests** (3 tests)
   - Success response structure
   - Error response structure
   - Valid JSON output

6. **Logging Tests** (3 tests)
   - Regular thoughts
   - Revision thoughts
   - Branch thoughts

**Total Test Count**: 26 tests

### Test Execution

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Jest Configuration

```javascript
// jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { useESM: true }
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk)/)',  // Transform chalk (ESM module)
  ],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/__tests__/**',
    '!**/dist/**',
  ],
}
```

---

## Key Design Patterns

### 1. **Chain of Thought (CoT) Pattern**

The server implements a structured CoT approach where each thought builds on previous ones:

```
Thought 1: Problem Identification
    ↓
Thought 2: Analysis
    ↓
Thought 3: Solution Hypothesis
    ↓
Thought 4: Verification
    ↓
Thought 5: Final Answer
```

### 2. **State Machine Pattern**

Each thought represents a state transition:

```
State 1 → [Process] → State 2 → [Process] → State 3 → ... → Final State
   ↓                      ↓                      ↓
History              History                History
```

### 3. **Builder Pattern**

Thoughts are built incrementally with optional refinements:

```typescript
// Base thought
{ thought: "...", thoughtNumber: 1, totalThoughts: 5 }

// Enhanced with revision
{ ...baseThought, isRevision: true, revisesThought: 1 }

// Enhanced with branching
{ ...baseThought, branchFromThought: 1, branchId: "branch-a" }
```

### 4. **Observer Pattern**

Optional logging observers thought processing:

```typescript
if (!this.disableThoughtLogging) {
  const formattedThought = this.formatThought(validatedInput);
  console.error(formattedThought);  // Observer
}
```

---

## Best Practices for Implementation

### For LLM Developers

1. **Start with Clear Estimates**
   ```typescript
   { thoughtNumber: 1, totalThoughts: 5, ... }
   ```

2. **Use Revisions for Course Correction**
   ```typescript
   { isRevision: true, revisesThought: 2, ... }
   ```

3. **Branch for Parallel Exploration**
   ```typescript
   { branchFromThought: 1, branchId: "approach-a", ... }
   ```

4. **Signal Completion Clearly**
   ```typescript
   { nextThoughtNeeded: false, ... }
   ```

5. **Extend Dynamically When Needed**
   ```typescript
   { needsMoreThoughts: true, ... }
   // totalThoughts will auto-adjust
   ```

### For Server Integration

1. **Enable Logging During Development**
   ```bash
   unset DISABLE_THOUGHT_LOGGING
   ```

2. **Disable Logging in Production**
   ```bash
   export DISABLE_THOUGHT_LOGGING=true
   ```

3. **Monitor stderr for Debugging**
   ```bash
   your-mcp-client 2> thoughts.log
   ```

4. **Use Docker for Isolation**
   ```bash
   docker run --rm -i mcp/sequentialthinking
   ```

---

## Comparison with Other Patterns

| Feature | Sequential Thinking | Simple Prompt | ReAct | Tree of Thoughts |
|---------|-------------------|---------------|-------|------------------|
| **Multi-step** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **State Tracking** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **Revisions** | ✅ Yes | ❌ No | ⚠️ Limited | ✅ Yes |
| **Branching** | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Dynamic Extension** | ✅ Yes | ❌ No | ⚠️ Limited | ⚠️ Limited |
| **Implementation Complexity** | 🟢 Low | 🟢 Very Low | 🟡 Medium | 🔴 High |

---

## Conclusion

The Sequential Thinking MCP server provides a **lightweight yet powerful framework** for implementing Chain of Thought reasoning in LLM applications. Its key strengths include:

- ✅ **Simplicity**: Single tool with clear interface
- ✅ **Flexibility**: Support for linear, revision, and branching patterns
- ✅ **Stateful**: Maintains context across invocations
- ✅ **Observable**: Optional logging for debugging
- ✅ **Production-Ready**: Docker support, comprehensive tests
- ✅ **Well-Documented**: Clear examples and patterns

This design makes it an excellent reference for building similar MCP servers that require structured, iterative reasoning capabilities.

---

## References

- **Source Repository**: https://github.com/modelcontextprotocol/servers
- **MCP Protocol**: https://spec.modelcontextprotocol.io/
- **NPM Package**: `@modelcontextprotocol/server-sequential-thinking`
- **Docker Image**: `mcp/sequentialthinking`
- **License**: MIT License

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-26  
**Author**: Technical Analysis of Official Implementation
