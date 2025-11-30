# API Spec Test Case Generator - Quick Reference

## Installation

```bash
# Via NPX (recommended)
npx -y @modelcontextprotocol/server-api-bdd-test-case-generator

# Via Docker
docker run --rm -i mcp/api-bdd-test-case-generator
```

## MCP Configuration

### VS Code / Claude Desktop

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "api-bdd-test-case-generator": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-api-bdd-test-case-generator"]
    }
  }
}
```

## Tool: `generate_test_scenarios`

### Operations

| Operation | Description | Required Parameters |
|-----------|-------------|-------------------|
| `load_spec` | Load and validate OpenAPI spec | `specFilePath` |
| `list_endpoints` | List all available endpoints | - |
| `analyze_endpoint` | Deep analysis of specific endpoint | `endpointPath`, `method` |
| `generate_scenarios` | Generate Gherkin scenarios | `scenarioTypes` |
| `export_feature` | Export complete feature file | `outputFormat` |
| `resolve_reference` | Manually resolve a $ref | `reference` |
| `clear_state` | Reset server state | - |

### Scenario Types

- `happy_path` - Successful operations
- `validation_errors` - 400 Bad Request scenarios
- `auth_errors` - 401/403 scenarios
- `not_found` - 404 scenarios
- `server_errors` - 500 scenarios
- `edge_cases` - Boundary values, special characters
- `schema_validation` - Response schema verification
- `integration_flows` - Multi-step scenarios using links
- `security_testing` - Security-specific tests
- `performance_hints` - Mark performance-critical tests

## Workflow Examples

### Minimal Workflow

```typescript
// 1. Load spec
{
  "operation": "load_spec",
  "specFilePath": "/path/to/openapi.yaml"
}

// 2. Analyze endpoint
{
  "operation": "analyze_endpoint",
  "endpointPath": "/resources",
  "method": "POST"
}

// 3. Generate all scenarios
{
  "operation": "generate_scenarios",
  "scenarioTypes": [
    "happy_path",
    "validation_errors",
    "auth_errors",
    "integration_flows"
  ]
}

// 4. Export
{
  "operation": "export_feature",
  "outputFormat": "gherkin"
}
```

### Iterative Workflow (AI-Friendly)

```typescript
// Step 1: Load and validate
{
  "operation": "load_spec",
  "specFilePath": "/path/to/openapi.yaml",
  "analysisStep": 1,
  "totalSteps": 8
}

// Step 2: List endpoints to see what's available
{
  "operation": "list_endpoints",
  "analysisStep": 2,
  "totalSteps": 8
}

// Step 3: Analyze specific endpoint
{
  "operation": "analyze_endpoint",
  "endpointPath": "/resources",
  "method": "POST",
  "analysisStep": 3,
  "totalSteps": 8,
  "additionalContext": "Focus on the create resource endpoint"
}

// Step 4: Review analysis, then generate happy path first
{
  "operation": "generate_scenarios",
  "scenarioTypes": ["happy_path"],
  "analysisStep": 4,
  "totalSteps": 8
}

// Step 5: Add validation scenarios
{
  "operation": "generate_scenarios",
  "scenarioTypes": ["validation_errors"],
  "analysisStep": 5,
  "totalSteps": 8
}

// Step 6: Add auth scenarios
{
  "operation": "generate_scenarios",
  "scenarioTypes": ["auth_errors"],
  "analysisStep": 6,
  "totalSteps": 8
}

// Step 7: Add integration flows
{
  "operation": "generate_scenarios",
  "scenarioTypes": ["integration_flows"],
  "analysisStep": 7,
  "totalSteps": 8
}

// Step 8: Export everything
{
  "operation": "export_feature",
  "outputFormat": "gherkin",
  "includeComments": true,
  "analysisStep": 8,
  "totalSteps": 8
}
```

### Revision Example

```typescript
// Revise previous analysis if findings were incomplete
{
  "operation": "analyze_endpoint",
  "endpointPath": "/resources",
  "method": "POST",
  "analysisStep": 4,
  "totalSteps": 10,
  "isRevision": true,
  "revisesStep": 3,
  "additionalContext": "Need to look deeper at the response links"
}
```

## Response Structure

```typescript
{
  "success": boolean,
  "data": {
    // Operation-specific data
  },
  "progress": {
    "currentStep": number,
    "totalSteps": number,
    "completedOperations": string[],
    "nextSuggestedOperation": string | null
  },
  "warnings": [
    {
      "severity": "low" | "medium" | "high",
      "message": string,
      "location": string
    }
  ],
  "errors": [
    {
      "code": string,
      "message": string,
      "details": string
    }
  ],
  "stateSnapshot": {
    // Current state summary
  }
}
```

## Generated Gherkin Structure

```gherkin
# Metadata comments
# OpenAPI Spec: {title} v{version}
# Endpoint: {method} {path}
# Generated: {timestamp}

@{tags}
Feature: {feature_name}
  {feature_description}
  
  Background:
    Given the API base URL is "{server_url}"
    And I have valid authentication
    And I set headers as needed

  @{scenario_tags}
  Scenario: {scenario_name}
    Given {preconditions}
    When {action}
    Then {assertions}
    
  @{outline_tags}
  Scenario Outline: {outline_name}
    Given {preconditions}
    When {action with <placeholder>}
    Then {assertions}
    
    Examples:
      | placeholder | expected |
      | value1      | result1  |
      | value2      | result2  |
```

## Common Tags

| Tag | Purpose |
|-----|---------|
| `@api` | All API tests |
| `@smoke` | Critical happy path tests |
| `@regression` | Full regression suite |
| `@security` | Security/auth tests |
| `@integration` | Multi-step flows |
| `@validation` | Input validation tests |
| `@edge_case` | Boundary condition tests |
| `@performance` | Performance testing candidates |

## Configuration File

Create `.api-bdd-test-case-generator.config.json`:

```json
{
  "gherkin": {
    "indentation": 2,
    "lineLength": 120
  },
  "scenarios": {
    "generateHappyPath": true,
    "generateValidationErrors": true,
    "generateAuthErrors": true,
    "generateEdgeCases": true,
    "generateIntegrationFlows": true
  },
  "output": {
    "directory": "./features",
    "includeComments": true
  }
}
```

## OpenAPI Support

### Supported Versions
- ✅ OpenAPI 3.0.0
- ✅ OpenAPI 3.0.1
- ✅ OpenAPI 3.0.2
- ✅ OpenAPI 3.0.3
- ✅ OpenAPI 3.1.0

### Supported Features
- ✅ Paths and operations (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- ✅ Parameters (path, query, header, cookie)
- ✅ Request bodies with schemas
- ✅ Responses with schemas
- ✅ $ref resolution (local and external)
- ✅ Security schemes (apiKey, http, oauth2, openIdConnect)
- ✅ Examples
- ✅ Links
- ✅ Callbacks
- ✅ Webhooks (3.1.x)
- ✅ Schema composition (allOf, oneOf, anyOf, not)
- ✅ Discriminators

## Schema Constraints Supported

| Constraint | Type | Example |
|------------|------|---------|
| `required` | All | Fields that must be present |
| `type` | All | string, number, boolean, array, object |
| `enum` | All | Limited set of values |
| `const` | All | Single allowed value |
| `format` | String | email, date, date-time, uri, uuid |
| `pattern` | String | Regex pattern |
| `minLength` / `maxLength` | String | Length bounds |
| `minimum` / `maximum` | Number | Value bounds |
| `minItems` / `maxItems` | Array | Size bounds |
| `uniqueItems` | Array | No duplicates |
| `minProperties` / `maxProperties` | Object | Property count |

## Test Data Generation

The tool automatically generates:

1. **Valid Data**: From examples or schemas
2. **Invalid Data**: Violating each constraint
3. **Edge Cases**: Boundary values (0, MAX, empty, null)
4. **Security Payloads**: SQL injection, XSS, etc.

## Common Use Cases

### 1. New Endpoint Testing
```bash
# Generate comprehensive tests for new endpoint
load_spec → analyze_endpoint → generate_scenarios (all types) → export_feature
```

### 2. Contract Testing
```bash
# Verify implementation matches spec
load_spec → list_endpoints → analyze_endpoint → generate_scenarios (happy_path + validation) → export_feature
```

### 3. Security Audit
```bash
# Focus on security testing
load_spec → analyze_endpoint → generate_scenarios (auth_errors + security_testing) → export_feature
```

### 4. Integration Testing
```bash
# Test related endpoint flows
load_spec → analyze_endpoint → generate_scenarios (integration_flows) → export_feature
```

### 5. Regression Suite
```bash
# Complete test coverage
load_spec → analyze_endpoint → generate_scenarios (all types) → export_feature
```

## Tips & Best Practices

### For AI Assistants

1. **Start Simple**: Load spec → list endpoints → choose one
2. **Iterate**: Analyze → review findings → generate scenarios incrementally
3. **Revise**: Use isRevision if initial analysis was incomplete
4. **Focus**: One endpoint at a time for thorough coverage
5. **Suggest**: Use nextSuggestedOperation from responses

### For Users

1. **Keep Specs Updated**: Ensure OpenAPI spec matches implementation
2. **Add Examples**: Rich examples generate better scenarios
3. **Use Tags**: Organize generated tests with appropriate tags
4. **Review Output**: Generated tests are a starting point, refine as needed
5. **Integrate**: Add generated features to your test automation framework

## Troubleshooting

### Issue: $ref Not Resolved

**Solution**: Ensure referenced component exists in spec or external file is accessible

### Issue: No Scenarios Generated

**Solution**: Check that endpoint has requestBody/responses defined with schemas

### Issue: Invalid Gherkin Syntax

**Solution**: Report as bug - all generated Gherkin should be valid

### Issue: Missing Scenarios

**Solution**: Explicitly request scenario types or use revision to add more

### Issue: Circular Reference Error

**Solution**: Fix circular $refs in OpenAPI spec

## Performance Considerations

- **Large Specs**: Focus on specific endpoints rather than generating all at once
- **Many Scenarios**: Generate incrementally by scenario type
- **External $refs**: May require network access, ensure connectivity
- **Complex Schemas**: Deep nesting may increase generation time

## Extending the Tool

### Custom Templates

Provide custom Gherkin templates in config:

```json
{
  "templates": {
    "happyPath": "custom-happy-path.template",
    "validation": "custom-validation.template"
  }
}
```

### Custom Scenario Types

Add custom scenario generators:

```typescript
// In plugin/
export class CustomScenarioGenerator extends BaseScenarioGenerator {
  generate(analysis: EndpointAnalysis): Scenario[] {
    // Custom logic
  }
}
```

## Resources

- [Full Design Document](./api-bdd-test-case-generator-design.md)
- [Executive Summary](./api-bdd-test-case-generator-summary.md)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)

## Support

- **Issues**: Report bugs on GitHub
- **Questions**: Ask in MCP community
- **Contributions**: PRs welcome!

---

**Quick Start**: `load_spec` → `analyze_endpoint` → `generate_scenarios` → `export_feature` 🚀
