# API BDD Test Case Generator MCP Server - Technical Reference

> **Project**: API BDD Test Case Generator  
> **Version**: 0.1.0  
> **Architecture**: Clean Architecture with Domain-Driven Design  
> **Purpose**: Generate BDD test scenarios from OpenAPI specifications via MCP protocol

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Complete Data Flow](#complete-data-flow)
4. [Layer-by-Layer Analysis](#layer-by-layer-analysis)
5. [MCP Tools](#mcp-tools)
6. [Use Cases Deep Dive](#use-cases-deep-dive)
7. [Domain Entities](#domain-entities)
8. [Scenario Generation](#scenario-generation)
9. [Export Formats](#export-formats)
10. [State Management](#state-management)
11. [Dependency Injection](#dependency-injection)
12. [Error Handling](#error-handling)

---

## Overview

The API BDD Test Case Generator is an **MCP (Model Context Protocol) server** that automatically generates BDD (Behavior-Driven Development) test scenarios in Gherkin format from OpenAPI 3.0/3.1 specifications.

### Core Capabilities

- ✅ **Load OpenAPI specs** from file paths or content strings
- ✅ **Analyze endpoints** with deep introspection of parameters, request bodies, responses
- ✅ **Generate test scenarios** across 6 scenario types (required fields, all fields, validation errors, auth errors, not found, edge cases)
- ✅ **Export to multiple formats** (Gherkin, JSON, Markdown)
- ✅ **Stateful operation** maintains context across tool invocations
- ✅ **Clean Architecture** ensures testability and maintainability

---

## Architecture

### Clean Architecture Layers

```
┌──────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ MCP Adapter │ Analyzers │ Generators │ Exporters      │  │
│  │ Repositories │ FileSystem │ RefResolver               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    Application Layer                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Use Cases:                                             │  │
│  │ - LoadSpecificationUseCase                             │  │
│  │ - ListEndpointsUseCase                                 │  │
│  │ - AnalyzeEndpointUseCase                               │  │
│  │ - GenerateScenariosUseCase                             │  │
│  │ - ExportFeatureUseCase                                 │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Ports (Interfaces):                                    │  │
│  │ - ISpecificationRepository                             │  │
│  │ - IStateRepository                                     │  │
│  │ - IFileSystem                                          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                       Domain Layer                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Entities:                                              │  │
│  │ - OpenAPISpecification                                 │  │
│  │ - Endpoint                                             │  │
│  │ - TestScenario                                         │  │
│  │ - FeatureFile                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Value Objects:                                         │  │
│  │ - HTTPMethod                                           │  │
│  │ - ScenarioType                                         │  │
│  │ - OperationType                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Domain Services (Interfaces):                          │  │
│  │ - ISpecificationAnalyzer                               │  │
│  │ - IEndpointAnalyzer                                    │  │
│  │ - IScenarioGenerator                                   │  │
│  │ - IFeatureExporter                                     │  │
│  │ - IRefResolver                                         │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Project Structure

```
src/
├── index.ts                    # Entry point
├── di/
│   ├── container.ts            # DI container setup
│   └── types.ts                # DI type constants
├── domain/
│   ├── entities/               # Core business entities
│   │   ├── OpenAPISpecification.ts
│   │   ├── Endpoint.ts
│   │   ├── TestScenario.ts
│   │   └── FeatureFile.ts
│   ├── value-objects/          # Immutable value types
│   │   ├── HTTPMethod.ts
│   │   ├── ScenarioType.ts
│   │   └── OperationType.ts
│   ├── services/               # Domain service interfaces
│   │   ├── ISpecificationAnalyzer.ts
│   │   ├── IEndpointAnalyzer.ts
│   │   ├── IScenarioGenerator.ts
│   │   ├── IFeatureExporter.ts
│   │   └── IRefResolver.ts
│   └── errors/                 # Domain exceptions
│       ├── DomainError.ts
│       ├── ValidationError.ts
│       ├── CircularReferenceError.ts
│       └── SpecificationNotFoundError.ts
├── application/
│   ├── use-cases/              # Application use cases
│   │   ├── LoadSpecificationUseCase.ts
│   │   ├── ListEndpointsUseCase.ts
│   │   ├── AnalyzeEndpointUseCase.ts
│   │   ├── GenerateScenariosUseCase.ts
│   │   └── ExportFeatureUseCase.ts
│   ├── ports/                  # Application interfaces
│   │   ├── ISpecificationRepository.ts
│   │   ├── IStateRepository.ts
│   │   └── IFileSystem.ts
│   └── dtos/                   # Data transfer objects
│       ├── LoadSpecRequest.ts
│       ├── AnalyzeEndpointRequest.ts
│       └── ...
├── infrastructure/
│   ├── mcp/                    # MCP protocol adapter
│   │   ├── McpServerAdapter.ts
│   │   └── RequestValidator.ts
│   ├── analyzers/              # Specification analyzers
│   │   ├── SpecificationAnalyzer.ts
│   │   ├── EndpointAnalyzer.ts
│   │   └── RefResolver.ts
│   ├── generators/             # Scenario generators
│   │   ├── BaseScenarioGenerator.ts
│   │   ├── RequiredFieldsGenerator.ts
│   │   ├── AllGenerators.ts
│   │   └── GeneratorFactory.ts
│   ├── exporters/              # Export formatters
│   │   └── GherkinExporter.ts
│   ├── repositories/           # Data persistence
│   │   ├── InMemorySpecificationRepository.ts
│   │   └── InMemoryStateRepository.ts
│   └── filesystem/             # File I/O
│       └── NodeFileSystem.ts
└── shared/                     # Shared utilities
    └── Logger.ts
```

---

## Complete Data Flow

### High-Level Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM Client (Claude, etc.)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ MCP Protocol (stdio)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Step 1: load_spec                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Input: { filePath: "spec.yaml" }                      │  │
│  │ Process: Load → Parse → Validate → Store             │  │
│  │ Output: { success, specification, pathCount }        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: list_endpoints                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Input: { filter: { method: "POST" } }                │  │
│  │ Process: Retrieve spec → Extract paths → Filter      │  │
│  │ Output: { endpoints: [...] }                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: analyze_endpoint                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Input: { path: "/users", method: "POST" }            │  │
│  │ Process:                                              │  │
│  │   - Create Endpoint entity                            │  │
│  │   - Analyze parameters (path, query, header)         │  │
│  │   - Analyze request body & schemas                   │  │
│  │   - Analyze responses (200, 400, 401, 404...)       │  │
│  │   - Resolve $refs                                     │  │
│  │   - Save to state repository                         │  │
│  │ Output: { analysis, insights }                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: generate_scenarios                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Input: { scenarioTypes: ["required_fields", ...] }   │  │
│  │ Process:                                              │  │
│  │   - Get endpoint context from state                  │  │
│  │   - For each scenario type:                          │  │
│  │     * Create generator (Factory pattern)             │  │
│  │     * Check canGenerate()                            │  │
│  │     * Generate scenarios                             │  │
│  │   - Save scenarios to state                          │  │
│  │ Output: { scenarios: [...], totalCount, grouped }    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: export_feature                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Input: { format: "gherkin", outputPath: "test.feature" } │
│  │ Process:                                              │  │
│  │   - Get scenarios from state                         │  │
│  │   - Create FeatureFile entity                        │  │
│  │   - Export to format (Gherkin/JSON/Markdown)        │  │
│  │   - Write to file (if path provided)                 │  │
│  │ Output: { success, content, filePath, stats }       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Request Flow

```
MCP Client
    │
    │ stdio (JSON-RPC)
    ▼
McpServerAdapter.handleToolCall()
    │
    │ Delegates to appropriate handler
    ▼
Use Case (e.g., AnalyzeEndpointUseCase)
    │
    │ Orchestrates business logic
    ▼
Domain Services (e.g., EndpointAnalyzer)
    │
    │ Operates on domain entities
    ▼
Domain Entities (e.g., Endpoint, OpenAPISpecification)
    │
    │ Encapsulates business rules
    ▼
Repositories (e.g., InMemoryStateRepository)
    │
    │ Persists state
    ▼
Response flows back through layers
    │
    ▼
MCP Client receives JSON response
```

---

## Layer-by-Layer Analysis

### 1. Infrastructure Layer

#### **McpServerAdapter** - MCP Protocol Gateway

```typescript
// Entry point for all MCP requests
class McpServerAdapter {
    // Registers 5 MCP tools
    private registerHandlers(): void {
        // 1. load_spec
        // 2. list_endpoints
        // 3. analyze_endpoint
        // 4. generate_scenarios
        // 5. export_feature
    }
    
    // Routes to appropriate use case
    private server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        // Switch on tool name → delegate to use case
    });
}
```

**Responsibilities:**
- Expose MCP tool schemas
- Validate incoming requests
- Route to use cases
- Format responses
- Handle errors uniformly

#### **SpecificationAnalyzer** - OpenAPI Parser

```typescript
class SpecificationAnalyzer implements ISpecificationAnalyzer {
    async loadFromFile(filePath: string): Promise<OpenAPISpecification> {
        // 1. Read file content
        // 2. Determine format (JSON/YAML)
        // 3. Parse content
        // 4. Create OpenAPISpecification entity
    }
    
    async loadFromContent(content: string, format: 'yaml' | 'json'): Promise<OpenAPISpecification> {
        // 1. Parse content (js-yaml for YAML, JSON.parse for JSON)
        // 2. Validate basic structure
        // 3. Create OpenAPISpecification entity
    }
}
```

**Key Operations:**
- Parse YAML/JSON OpenAPI specs
- Validate OpenAPI version (3.0/3.1 only)
- Validate required fields (openapi, info, paths)
- Create immutable domain entities

#### **EndpointAnalyzer** - Deep Endpoint Inspection

```typescript
class EndpointAnalyzer implements IEndpointAnalyzer {
    analyze(spec: OpenAPISpecification, endpoint: Endpoint): EndpointAnalysis {
        return {
            path: endpoint.getPath(),
            method: endpoint.getMethod(),
            parameters: this.analyzeParameters(),      // Path, query, header params
            requestBody: this.analyzeRequestBody(),    // Content-Type, schema, examples
            responses: this.analyzeResponses(),        // Status codes, schemas
            security: endpoint.getSecurity(),          // Auth requirements
            // ...
        };
    }
}
```

**Analysis Depth:**
- **Parameters**: Resolve references, extract schema constraints (min/max, pattern, enum)
- **Request Body**: Parse content types, resolve nested schemas
- **Responses**: Map status codes to schemas, extract examples
- **Security**: Identify auth requirements (affects scenario generation)

#### **RefResolver** - $ref Resolution

```typescript
class RefResolver implements IRefResolver {
    resolve(ref: string, spec: any): any {
        // Handles: #/components/schemas/User
        // Returns: Resolved schema object
        // Detects: Circular references
    }
    
    resolveSchema(schema: any, spec: any): any {
        // Recursive resolution of nested $refs
        // Example: User → Address → Country
    }
}
```

**Critical for:**
- OpenAPI specs heavily use `$ref` for reusability
- Must handle circular references (e.g., User → Department → User)
- Enables deep schema analysis for test generation

#### **GeneratorFactory** - Scenario Generator Registry

```typescript
class GeneratorFactory {
    private generators: Map<ScenarioType, IScenarioGenerator>;
    
    create(type: ScenarioType): IScenarioGenerator {
        // Returns: RequiredFieldsGenerator | AllFieldsGenerator | ...
    }
    
    private registerDefaultGenerators(): void {
        this.register(new RequiredFieldsGenerator());
        this.register(new AllFieldsGenerator());
        this.register(new ValidationErrorGenerator());
        this.register(new AuthErrorGenerator());
        this.register(new NotFoundGenerator());
        this.register(new EdgeCaseGenerator());
    }
}
```

**Pattern**: Factory + Strategy
- Decouples scenario type from generation logic
- Extensible (add new generators without modifying factory)
- Each generator knows its capabilities (`canGenerate()`)

#### **GherkinExporter** - Multi-Format Export

```typescript
class GherkinExporter implements IFeatureExporter {
    export(featureFile: FeatureFile, format: ExportFormat): string {
        switch (format) {
            case 'gherkin': return this.exportGherkin(featureFile);
            case 'json': return this.exportJSON(featureFile);
            case 'markdown': return this.exportMarkdown(featureFile);
        }
    }
}
```

**Output Formats:**
1. **Gherkin**: Standard BDD format for Cucumber/SpecFlow
2. **JSON**: Machine-readable for further processing
3. **Markdown**: Human-readable documentation

---

### 2. Application Layer

#### **Use Cases** - Orchestration Logic

Each use case follows the pattern:

```typescript
@injectable()
class SomeUseCase {
    constructor(
        @inject(TYPES.Repository) private repo,
        @inject(TYPES.Service) private service,
        @inject(TYPES.Logger) private logger
    ) {}
    
    async execute(request: RequestDTO): Promise<ResponseDTO> {
        this.logger.info('Starting...');
        
        // 1. Validate input
        // 2. Get dependencies from repositories
        // 3. Execute domain logic
        // 4. Save results
        // 5. Return formatted response
        
        this.logger.info('Complete');
        return response;
    }
}
```

**Key Characteristics:**
- Single responsibility per use case
- Depends on abstractions (interfaces), not implementations
- Logging for observability
- Error handling with domain errors
- Transaction boundaries (if needed)

---

### 3. Domain Layer

#### **OpenAPISpecification** - Spec Entity

```typescript
class OpenAPISpecification {
    static create(document: OpenAPIDocument, source: string): OpenAPISpecification {
        // Extract metadata (title, version, servers, security)
        // Return immutable entity
    }
    
    validate(): void {
        // Business rules:
        // - Must have openapi version
        // - Must have info.title and info.version
        // - Must have at least one path
    }
    
    getAllPaths(): string[]
    getPath(path: string): PathItemObject
    getComponents(): ComponentsObject
}
```

**Responsibilities:**
- Encapsulate OpenAPI document
- Expose domain-friendly API
- Enforce business invariants

#### **Endpoint** - Single Endpoint Entity

```typescript
class Endpoint {
    static create(path: string, method: string, operation: OperationObject): Endpoint
    
    getPath(): string
    getMethod(): HTTPMethod
    getOperation(): OperationObject
    getOperationId(): string | undefined
    getSummary(): string | undefined
    getTags(): string[]
    getParameters(): ParameterObject[]
    getRequestBody(): RequestBodyObject | undefined
    getResponses(): ResponsesObject
    getSecurity(): SecurityRequirementObject[]
}
```

**Purpose:**
- Represents a single API endpoint (path + method)
- Aggregates all endpoint metadata
- Used as input for analysis and scenario generation

#### **TestScenario** - BDD Scenario Entity

```typescript
class TestScenario {
    static createScenario(
        name: string,
        type: ScenarioType,
        steps: Step[],
        tags: string[]
    ): TestScenario
    
    static createScenarioOutline(
        name: string,
        type: ScenarioType,
        steps: Step[],
        examples: ExamplesTable,
        tags: string[]
    ): TestScenario
    
    getName(): string
    getType(): ScenarioType
    getSteps(): Step[]
    getTags(): string[]
    getScenarioType(): 'Scenario' | 'Scenario Outline'
}
```

**Step Structure:**
```typescript
interface Step {
    keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
    text: string;
    docString?: string;
    dataTable?: DataTable;
}
```

**Immutability:**
- Once created, scenarios cannot be modified
- Use factory methods for creation
- `addTag()` returns new instance

#### **FeatureFile** - Feature Aggregation

```typescript
class FeatureFile {
    static create(
        feature: FeatureInfo,
        scenarios: TestScenario[],
        metadata: FeatureMetadata
    ): FeatureFile
    
    getFeature(): FeatureInfo
    getScenarios(): TestScenario[]
    getMetadata(): FeatureMetadata
    getScenarioCount(): number
    getTotalStepCount(): number
}
```

**Structure:**
```typescript
interface FeatureInfo {
    name: string;               // "POST /users"
    description?: string;       // "Test scenarios for..."
    tags: string[];             // ["@api", "@generated"]
}

interface FeatureMetadata {
    generatedAt: Date;
    openApiSpec: string;
    openApiVersion: string;
    endpoint: string;
    method: string;
    operationId?: string;
}
```

---

## MCP Tools

### 1. **load_spec** - Load OpenAPI Specification

**Input Schema:**
```json
{
  "filePath": "string (optional)",
  "content": "string (optional)",
  "format": "yaml | json (optional)"
}
```

**Examples:**
```typescript
// From file
{ filePath: "/path/to/openapi.yaml" }

// From content
{
  content: "openapi: 3.0.0\ninfo:\n  title: API...",
  format: "yaml"
}
```

**Output:**
```json
{
  "success": true,
  "specification": {
    "title": "My API",
    "version": "1.0.0",
    "openApiVersion": "3.0.0",
    "servers": ["https://api.example.com"],
    "pathCount": 15
  },
  "loadedAt": "2025-10-26T...",
  "source": "/path/to/spec.yaml"
}
```

**Process:**
1. Validate input (must have filePath OR content)
2. Load specification via SpecificationAnalyzer
3. Validate spec (OpenAPI version, required fields, paths)
4. Save to SpecificationRepository (in-memory singleton)
5. Return metadata summary

---

### 2. **list_endpoints** - List All Endpoints

**Input Schema:**
```json
{
  "filter": {
    "method": "string (optional)",
    "tag": "string (optional)",
    "path": "string (optional)"
  }
}
```

**Examples:**
```typescript
// All endpoints
{}

// Filter by method
{ filter: { method: "POST" } }

// Filter by tag
{ filter: { tag: "users" } }

// Filter by path pattern
{ filter: { path: "/users" } }
```

**Output:**
```json
{
  "success": true,
  "endpoints": [
    {
      "path": "/users",
      "method": "POST",
      "operationId": "createUser",
      "summary": "Create a new user",
      "tags": ["users"]
    },
    {
      "path": "/users/{id}",
      "method": "GET",
      "operationId": "getUser",
      "summary": "Get user by ID",
      "tags": ["users"]
    }
  ],
  "totalCount": 2
}
```

**Process:**
1. Get specification from repository
2. Extract all paths
3. For each path, extract operations (GET, POST, PUT, DELETE, PATCH)
4. Apply filters (method, tag, path)
5. Return filtered list

---

### 3. **analyze_endpoint** - Deep Endpoint Analysis

**Input Schema:**
```json
{
  "path": "string (required)",
  "method": "GET | POST | PUT | PATCH | DELETE (required)"
}
```

**Example:**
```typescript
{
  path: "/users/{id}",
  method: "GET"
}
```

**Output:**
```json
{
  "success": true,
  "analysis": {
    "path": "/users/{id}",
    "method": "GET",
    "operationId": "getUser",
    "summary": "Get user by ID",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "type": "string",
          "constraints": { "pattern": "^[0-9a-f]{24}$" }
        }
      }
    ],
    "requestBody": null,
    "responses": {
      "200": {
        "description": "Success",
        "schema": { "type": "object", "properties": {...} }
      },
      "404": {
        "description": "User not found"
      }
    },
    "security": [{ "bearerAuth": [] }]
  },
  "insights": {
    "hasAuthentication": true,
    "hasRequestBody": false,
    "hasPathParameters": true,
    "hasQueryParameters": false,
    "responseCount": 2
  }
}
```

**Process:**
1. Get specification from repository
2. Validate path exists
3. Validate method exists for path
4. Create Endpoint entity
5. Analyze via EndpointAnalyzer:
   - Resolve all parameters (path/query/header)
   - Analyze request body (if present)
   - Analyze all responses (resolve schemas)
   - Extract security requirements
6. Save analysis to StateRepository
7. Generate insights
8. Return comprehensive analysis

**Critical Details:**
- **Parameter resolution**: Handles `$ref` to shared parameters
- **Schema constraints**: Extracts min/max, pattern, enum, format
- **Nested schemas**: Recursively resolves object properties
- **Security detection**: Affects which scenarios can be generated

---

### 4. **generate_scenarios** - Generate Test Scenarios

**Input Schema:**
```json
{
  "scenarioTypes": ["string[] (optional)"],
  "includeBackground": "boolean (optional)"
}
```

**Scenario Types:**
- `required_fields` - Success with only required fields
- `all_fields` - Success with all fields (required + optional)
- `validation_error` - Invalid data (400 response)
- `auth_error` - Missing/invalid authentication (401 response)
- `not_found` - Non-existent resource (404 response)
- `edge_case` - Edge cases and boundary conditions

**Example:**
```typescript
// Generate all scenario types
{}

// Generate specific types
{
  scenarioTypes: ["required_fields", "validation_error", "auth_error"]
}
```

**Output:**
```json
{
  "success": true,
  "scenarios": [
    {
      "name": "POST /users - Success with required fields",
      "type": "required_fields",
      "scenarioType": "Scenario",
      "stepCount": 4,
      "tags": ["@positive", "@required-fields"]
    },
    {
      "name": "POST /users - Validation error",
      "type": "validation_error",
      "scenarioType": "Scenario",
      "stepCount": 4,
      "tags": ["@negative", "@validation"]
    }
  ],
  "totalCount": 6,
  "groupedByType": {
    "required_fields": 1,
    "all_fields": 1,
    "validation_error": 1,
    "auth_error": 1,
    "not_found": 1,
    "edge_case": 1
  }
}
```

**Process:**
1. Get endpoint context from StateRepository
2. Determine scenario types (default: all 6 types)
3. For each scenario type:
   - Get generator from GeneratorFactory
   - Check `canGenerate(analysis)` (some generators are conditional)
   - Generate scenarios
   - Collect all scenarios
4. Save scenarios to StateRepository
5. Return summary with counts per type

**Generator Logic Examples:**

**RequiredFieldsGenerator:**
```gherkin
Scenario: POST /users - Success with required fields
  Given the API is available
  When I send a POST request to /users with required fields only
  Then the response status should be 200 or 201
  And the response should contain the expected data
```

**AuthErrorGenerator:**
```gherkin
Scenario: POST /users - Authentication required
  Given I am not authenticated
  When I send a POST request to /users
  Then the response status should be 401
  And the response should contain an authentication error
```

**Conditional Generation:**
- `auth_error`: Only if endpoint has security requirements
- `not_found`: Only for GET/PUT/PATCH/DELETE (not POST)

---

### 5. **export_feature** - Export to Gherkin/JSON/Markdown

**Input Schema:**
```json
{
  "format": "gherkin | json | markdown (optional, default: gherkin)",
  "outputPath": "string (optional)",
  "includeComments": "boolean (optional, default: true)"
}
```

**Examples:**
```typescript
// Export to Gherkin (return content only)
{ format: "gherkin" }

// Export to file
{
  format: "gherkin",
  outputPath: "/path/to/users.feature"
}

// Export as JSON
{ format: "json" }
```

**Output:**
```json
{
  "success": true,
  "format": "gherkin",
  "content": "@api @generated\nFeature: POST /users\n...",
  "filePath": "/path/to/users.feature",
  "stats": {
    "featureName": "POST /users",
    "scenarioCount": 6,
    "totalSteps": 24,
    "size": 1234
  }
}
```

**Generated Gherkin Example:**
```gherkin
@api @generated
Feature: POST /users
  Test scenarios for POST /users endpoint

  # Generated: 2025-10-26T10:30:00.000Z
  # OpenAPI Spec: petstore-api
  # OpenAPI Version: 3.0.0
  # Operation ID: createUser

  @positive @required-fields
  Scenario: POST /users - Success with required fields
    Given the API is available
    When I send a POST request to /users with required fields only
    Then the response status should be 200 or 201
    And the response should contain the expected data

  @negative @validation
  Scenario: POST /users - Validation error
    Given the API is available
    When I send a POST request to /users with invalid data
    Then the response status should be 400
    And the response should contain validation errors
```

**Process:**
1. Get scenarios from StateRepository
2. Get endpoint context for metadata
3. Create FeatureFile entity:
   - Feature name: `{METHOD} {PATH}`
   - Feature description
   - Feature tags: `[@api, @generated]`
   - Metadata (generated date, OpenAPI info)
4. Export via GherkinExporter:
   - Gherkin: Format as .feature file
   - JSON: Serialize FeatureFile
   - Markdown: Format as human-readable docs
5. Write to file (if outputPath provided)
6. Return content and stats

---

## Use Cases Deep Dive

### LoadSpecificationUseCase

**Flow:**
```
Input: { filePath: "api.yaml" }
  ↓
Read file via FileSystem
  ↓
Parse YAML/JSON
  ↓
Create OpenAPISpecification entity
  ↓
Validate (openapi version, info, paths)
  ↓
Save to SpecificationRepository
  ↓
Output: { success, specification metadata }
```

**Validation Rules:**
- OpenAPI version must be 3.0.x or 3.1.x
- Must have `info.title` and `info.version`
- Must have at least one path
- YAML/JSON must be valid

---

### AnalyzeEndpointUseCase

**Flow:**
```
Input: { path: "/users", method: "POST" }
  ↓
Get spec from repository
  ↓
Validate path and method exist
  ↓
Create Endpoint entity
  ↓
EndpointAnalyzer.analyze():
  ├─ Analyze parameters (resolve $refs)
  ├─ Analyze request body (resolve schemas)
  ├─ Analyze responses (all status codes)
  └─ Extract security
  ↓
Save EndpointAnalysis to StateRepository
  ↓
Generate insights (boolean flags)
  ↓
Output: { success, analysis, insights }
```

**Analysis Depth:**

**Parameters:**
```typescript
{
  name: "userId",
  in: "path",
  required: true,
  schema: {
    schema: { type: "string", pattern: "^[0-9a-f]{24}$" },
    constraints: {
      type: "string",
      pattern: "^[0-9a-f]{24}$",
      minLength: 24,
      maxLength: 24
    }
  }
}
```

**Request Body:**
```typescript
{
  required: true,
  contentType: "application/json",
  schema: {
    schema: {
      type: "object",
      required: ["email", "name"],
      properties: {
        email: { type: "string", format: "email" },
        name: { type: "string", minLength: 1 }
      }
    },
    constraints: { /* extracted */ }
  }
}
```

**Responses:**
```typescript
Map {
  "200" => {
    statusCode: "200",
    description: "Success",
    schema: { /* resolved User schema */ }
  },
  "400" => {
    statusCode: "400",
    description: "Validation error",
    schema: { /* Error schema */ }
  }
}
```

---

### GenerateScenariosUseCase

**Flow:**
```
Input: { scenarioTypes: ["required_fields", "validation_error"] }
  ↓
Get endpoint context from StateRepository
  ↓
For each scenario type:
  ├─ GeneratorFactory.create(type)
  ├─ Check generator.canGenerate(analysis)
  ├─ generator.generate(analysis) → TestScenario[]
  └─ Collect scenarios
  ↓
Save all scenarios to StateRepository
  ↓
Count scenarios by type
  ↓
Output: { success, scenarios, totalCount, groupedByType }
```

**Generator Selection Logic:**

```typescript
// RequiredFieldsGenerator
canGenerate(analysis): boolean {
    return true; // Always applicable
}

// AuthErrorGenerator
canGenerate(analysis): boolean {
    return analysis.security.length > 0; // Only if auth required
}

// NotFoundGenerator
canGenerate(analysis): boolean {
    return ['GET', 'DELETE', 'PUT', 'PATCH'].includes(analysis.method);
    // Not applicable for POST (creates resources)
}
```

**Scenario Structure:**

```typescript
TestScenario {
    name: "POST /users - Success with required fields",
    type: ScenarioType.REQUIRED_FIELDS,
    scenarioType: "Scenario",
    steps: [
        { keyword: "Given", text: "the API is available" },
        { keyword: "When", text: "I send a POST request to /users with required fields only" },
        { keyword: "Then", text: "the response status should be 200 or 201" },
        { keyword: "And", text: "the response should contain the expected data" }
    ],
    tags: ["@positive", "@required-fields"]
}
```

---

### ExportFeatureUseCase

**Flow:**
```
Input: { format: "gherkin", outputPath: "users.feature" }
  ↓
Get scenarios from StateRepository
  ↓
Get endpoint context for metadata
  ↓
Create FeatureFile entity
  ↓
Export via GherkinExporter:
  ├─ Format feature header
  ├─ Add metadata comments
  └─ Format each scenario
  ↓
Write to file (if outputPath)
  ↓
Output: { success, content, filePath, stats }
```

**Gherkin Output Structure:**

```gherkin
{feature.tags}               # @api @generated
Feature: {feature.name}      # POST /users
  {feature.description}      # Test scenarios for...

  # Metadata comments
  # Generated: {timestamp}
  # OpenAPI Spec: {spec name}
  # OpenAPI Version: {version}

  {scenario.tags}            # @positive @required-fields
  Scenario: {scenario.name}  # Success with required fields
    {step.keyword} {step.text}  # Given the API is available
    {step.keyword} {step.text}  # When I send a POST request...
```

---

## Scenario Generation

### Base Generator Pattern

```typescript
abstract class BaseScenarioGenerator implements IScenarioGenerator {
    abstract getType(): ScenarioType;
    abstract generate(analysis: EndpointAnalysis): TestScenario[];
    
    canGenerate(analysis: EndpointAnalysis): boolean {
        return true; // Override for conditional generation
    }
    
    protected createScenario(
        name: string,
        type: ScenarioType,
        steps: Step[],
        tags: string[]
    ): TestScenario {
        return TestScenario.createScenario(name, type, steps, tags);
    }
    
    // Helper methods for step creation
    protected given(text: string): Step { return { keyword: 'Given', text }; }
    protected when(text: string): Step { return { keyword: 'When', text }; }
    protected then(text: string): Step { return { keyword: 'Then', text }; }
    protected and(text: string): Step { return { keyword: 'And', text }; }
}
```

### Scenario Type Breakdown

#### 1. **Required Fields** (Positive Test)

**When:** Always generated  
**Purpose:** Verify endpoint works with minimal valid data

```gherkin
Scenario: POST /users - Success with required fields
  Given the API is available
  When I send a POST request to /users with required fields only
  Then the response status should be 200 or 201
  And the response should contain the expected data
```

**Tags:** `@positive`, `@required-fields`

---

#### 2. **All Fields** (Positive Test)

**When:** Always generated  
**Purpose:** Verify endpoint works with all possible fields

```gherkin
Scenario: POST /users - Success with all fields
  Given the API is available
  When I send a POST request to /users with all fields
  Then the response status should be 200 or 201
  And the response should contain all expected fields
```

**Tags:** `@positive`, `@all-fields`

---

#### 3. **Validation Error** (Negative Test)

**When:** Always generated  
**Purpose:** Verify proper validation error handling

```gherkin
Scenario: POST /users - Validation error
  Given the API is available
  When I send a POST request to /users with invalid data
  Then the response status should be 400
  And the response should contain validation errors
```

**Tags:** `@negative`, `@validation`

---

#### 4. **Auth Error** (Negative Test)

**When:** Only if `analysis.security.length > 0`  
**Purpose:** Verify authentication is enforced

```gherkin
Scenario: POST /users - Authentication required
  Given I am not authenticated
  When I send a POST request to /users
  Then the response status should be 401
  And the response should contain an authentication error
```

**Tags:** `@negative`, `@auth`

---

#### 5. **Not Found** (Negative Test)

**When:** Only for GET/PUT/PATCH/DELETE (not POST)  
**Purpose:** Verify 404 handling for non-existent resources

```gherkin
Scenario: GET /users/{id} - Resource not found
  Given the API is available
  When I send a GET request to /users/{id} with a non-existent resource ID
  Then the response status should be 404
  And the response should contain a not found error
```

**Tags:** `@negative`, `@not-found`

---

#### 6. **Edge Case** (Boundary Test)

**When:** Always generated  
**Purpose:** Test boundary conditions and edge cases

```gherkin
Scenario: POST /users - Edge cases
  Given the API is available
  When I send a POST request to /users with edge case data
  Then the response should handle the edge case appropriately
```

**Tags:** `@edge-case`

---

## State Management

### In-Memory Repositories

**Design Pattern:** Repository Pattern with Singleton Scope

```typescript
// Managed by InversifyJS DI container
container.bind<IStateRepository>(TYPES.IStateRepository)
    .to(InMemoryStateRepository)
    .inSingletonScope(); // Single instance for entire server lifetime
```

### State Flow Across Tools

```
Tool 1: load_spec
  └─ Saves OpenAPISpecification → SpecificationRepository

Tool 2: list_endpoints
  └─ Reads from SpecificationRepository

Tool 3: analyze_endpoint
  ├─ Reads from SpecificationRepository
  └─ Saves EndpointAnalysis → StateRepository

Tool 4: generate_scenarios
  ├─ Reads EndpointAnalysis from StateRepository
  └─ Saves TestScenario[] → StateRepository

Tool 5: export_feature
  ├─ Reads TestScenario[] from StateRepository
  └─ Reads EndpointAnalysis from StateRepository (for metadata)
```

### State Structure

```typescript
// InMemorySpecificationRepository
{
    specification: OpenAPISpecification | null
}

// InMemoryStateRepository
{
    endpointContext: EndpointAnalysis | null,  // Last analyzed endpoint
    scenarios: TestScenario[]                  // Generated scenarios
}
```

**Important:**
- State persists for the lifetime of the MCP server process
- State is **not** shared between different server instances
- State is **not** persisted to disk
- Restarting the server clears all state

---

## Dependency Injection

### Container Setup

```typescript
export function createContainer(): Container {
    const container = new Container();
    
    // Singletons
    container.bind<Logger>(TYPES.Logger)
        .toConstantValue(new Logger({ level: 'info' }));
    
    container.bind<IRefResolver>(TYPES.IRefResolver)
        .to(RefResolver)
        .inSingletonScope();
    
    container.bind<ISpecificationRepository>(TYPES.ISpecificationRepository)
        .to(InMemorySpecificationRepository)
        .inSingletonScope();
    
    // Transient (new instance per request)
    container.bind<LoadSpecificationUseCase>(TYPES.LoadSpecificationUseCase)
        .to(LoadSpecificationUseCase);
    
    return container;
}
```

### Dependency Graph

```
McpServerAdapter
  ├─ Container (injected at construction)
  └─ Resolves use cases on demand:

LoadSpecificationUseCase
  ├─ ISpecificationAnalyzer (→ SpecificationAnalyzer)
  │   └─ IFileSystem (→ NodeFileSystem)
  ├─ ISpecificationRepository (→ InMemorySpecificationRepository)
  ├─ IFileSystem (→ NodeFileSystem)
  └─ Logger

AnalyzeEndpointUseCase
  ├─ ISpecificationRepository
  ├─ IStateRepository (→ InMemoryStateRepository)
  ├─ IEndpointAnalyzer (→ EndpointAnalyzer)
  │   └─ IRefResolver (→ RefResolver)
  └─ Logger

GenerateScenariosUseCase
  ├─ IStateRepository
  ├─ GeneratorFactory
  │   └─ Creates: RequiredFieldsGenerator, AllFieldsGenerator, ...
  └─ Logger

ExportFeatureUseCase
  ├─ IStateRepository
  ├─ IFeatureExporter (→ GherkinExporter)
  ├─ IFileSystem
  └─ Logger
```

**Benefits:**
- Testability (mock interfaces)
- Flexibility (swap implementations)
- Single Responsibility (each class has one purpose)
- Dependency inversion (depend on abstractions)

---

## Error Handling

### Domain Errors

```typescript
// Base error
class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

// Specific errors
class ValidationError extends DomainError {}
class SpecificationNotFoundError extends DomainError {}
class CircularReferenceError extends DomainError {}
class InvalidReferenceError extends DomainError {}
```

### Error Flow

```
Use Case throws DomainError
  ↓
McpServerAdapter catches error
  ↓
Format error response:
{
  content: [{
    type: "text",
    text: JSON.stringify({
      success: false,
      error: error.message
    })
  }],
  isError: true
}
  ↓
MCP Client receives error
```

### Common Error Scenarios

1. **No specification loaded:**
   ```json
   {
     "success": false,
     "error": "No specification loaded. Please load a specification first."
   }
   ```

2. **Invalid OpenAPI version:**
   ```json
   {
     "success": false,
     "error": "Unsupported OpenAPI version: 2.0. Only 3.0.x and 3.1.x are supported"
   }
   ```

3. **Endpoint not found:**
   ```json
   {
     "success": false,
     "error": "Path not found: /invalid-path"
   }
   ```

4. **No endpoint analyzed:**
   ```json
   {
     "success": false,
     "error": "No endpoint context found. Please analyze an endpoint first."
   }
   ```

---

## Key Design Patterns

### 1. **Clean Architecture**
- **Domain** at the center (entities, value objects)
- **Application** orchestrates (use cases)
- **Infrastructure** implements details (MCP, file I/O, parsers)

### 2. **Dependency Inversion**
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)

### 3. **Repository Pattern**
- Abstract data persistence
- Allows in-memory for development, database for production

### 4. **Factory Pattern**
- GeneratorFactory creates scenario generators
- Decouples scenario type from implementation

### 5. **Strategy Pattern**
- IScenarioGenerator interface
- Multiple implementations (RequiredFieldsGenerator, etc.)
- Selected at runtime based on scenario type

### 6. **Adapter Pattern**
- McpServerAdapter adapts domain logic to MCP protocol
- Clean separation of concerns

---

## Comparison with Sequential Thinking MCP Server

| Aspect | Sequential Thinking | API BDD Generator |
|--------|-------------------|------------------|
| **Purpose** | Chain-of-thought reasoning | BDD test generation |
| **Architecture** | Simple (2 files) | Clean Architecture (5 layers) |
| **State** | Thought history + branches | Spec + endpoint + scenarios |
| **Tools** | 1 tool (`sequentialthinking`) | 5 tools (load, list, analyze, generate, export) |
| **Entities** | ThoughtData | OpenAPISpec, Endpoint, TestScenario, FeatureFile |
| **Generators** | N/A | 6 scenario generators |
| **External Deps** | chalk | js-yaml, openapi-types, inversify |
| **DI** | None | InversifyJS container |
| **Testing** | 26 unit tests | 275 tests (unit + integration) |
| **Output** | JSON thought metadata | Gherkin/JSON/Markdown features |

---

## Typical Usage Session

```typescript
// 1. Load OpenAPI spec
await mcp.call('load_spec', {
    filePath: '/path/to/petstore.yaml'
});

// 2. List all endpoints
const endpoints = await mcp.call('list_endpoints', {});

// 3. Analyze specific endpoint
const analysis = await mcp.call('analyze_endpoint', {
    path: '/pets/{petId}',
    method: 'GET'
});

// 4. Generate scenarios
const scenarios = await mcp.call('generate_scenarios', {
    scenarioTypes: ['required_fields', 'not_found', 'auth_error']
});

// 5. Export to Gherkin file
const feature = await mcp.call('export_feature', {
    format: 'gherkin',
    outputPath: './features/pets.feature'
});
```

**Result: `pets.feature`**
```gherkin
@api @generated
Feature: GET /pets/{petId}
  Test scenarios for GET /pets/{petId} endpoint

  # Generated: 2025-10-26T10:30:00.000Z
  # OpenAPI Spec: Swagger Petstore
  # OpenAPI Version: 3.0.0

  @positive @required-fields
  Scenario: GET /pets/{petId} - Success with required fields
    Given the API is available
    When I send a GET request to /pets/{petId} with required fields only
    Then the response status should be 200 or 201
    And the response should contain the expected data

  @negative @not-found
  Scenario: GET /pets/{petId} - Resource not found
    Given the API is available
    When I send a GET request to /pets/{petId} with a non-existent resource ID
    Then the response status should be 404
    And the response should contain a not found error

  @negative @auth
  Scenario: GET /pets/{petId} - Authentication required
    Given I am not authenticated
    When I send a GET request to /pets/{petId}
    Then the response status should be 401
    And the response should contain an authentication error
```

---

## Conclusion

The API BDD Test Case Generator MCP Server demonstrates a **production-grade Clean Architecture implementation** for automated test generation. Its key strengths include:

✅ **Separation of Concerns**: Clear layer boundaries (domain, application, infrastructure)  
✅ **Extensibility**: Easy to add new scenario generators or export formats  
✅ **Testability**: Dependency injection enables comprehensive testing  
✅ **Maintainability**: Single Responsibility Principle throughout  
✅ **Domain-Driven Design**: Rich domain model with entities and value objects  
✅ **Stateful MCP Server**: Maintains context across multiple tool invocations  
✅ **Type Safety**: Full TypeScript with OpenAPI type definitions  

This architecture serves as an excellent reference for building complex MCP servers that require:
- Multi-step workflows
- Domain modeling
- Stateful operations
- Extensible business logic
- Clean separation between protocol and domain

---

## References

- **MCP Protocol**: https://spec.modelcontextprotocol.io/
- **OpenAPI Specification**: https://spec.openapis.org/oas/v3.1.0
- **Clean Architecture**: Robert C. Martin
- **Gherkin/BDD**: https://cucumber.io/docs/gherkin/
- **InversifyJS**: https://inversify.io/

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-26  
**Author**: Technical Analysis of Clean Architecture Implementation
