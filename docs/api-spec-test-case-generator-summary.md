# API Spec Test Case Generator - Executive Summary

## Overview

The **API Spec Test Case Generator** is an intelligent MCP server that transforms OpenAPI specifications into comprehensive Gherkin test scenarios. It uses an iterative analysis process (inspired by the sequential-thinking MCP server) to deeply understand API contracts and generate high-quality, maintainable test suites.

## Key Capabilities

### 1. Deep API Analysis
- ✅ Parse OpenAPI 3.0.x and 3.1.x specifications (YAML/JSON)
- ✅ Resolve `$ref` references (local and external)
- ✅ Extract constraints, examples, and relationships
- ✅ Understand security schemes and requirements
- ✅ Map related endpoints via links, callbacks, and webhooks

### 2. Comprehensive Test Generation
- ✅ **Happy Path**: Successful operations with valid data
- ✅ **Validation Errors**: Missing fields, invalid formats, constraint violations
- ✅ **Authentication**: Missing/invalid credentials, insufficient permissions
- ✅ **Edge Cases**: Boundary values, special characters, null handling
- ✅ **Integration Flows**: Multi-step scenarios using response links
- ✅ **Security Testing**: SQL injection, XSS, command injection attempts

### 3. Gherkin Best Practices
- ✅ Clear Feature/Scenario names from operation summaries
- ✅ Background for common setup (auth, base URL)
- ✅ Given-When-Then structure
- ✅ Scenario Outline for data-driven tests
- ✅ Meaningful tags (@smoke, @regression, @security, @integration)
- ✅ Schema validation assertions

## Architecture

```
┌────────────────────────────────────────────────┐
│         MCP Tool: generate_test_scenarios       │
│                                                 │
│  Operations:                                    │
│  • load_spec         - Load & validate OAS     │
│  • list_endpoints    - Show available endpoints│
│  • analyze_endpoint  - Deep endpoint analysis  │
│  • generate_scenarios- Create Gherkin tests    │
│  • export_feature    - Export .feature file    │
└────────────────────────────────────────────────┘
         │                    │                 │
    ┌────▼────┐        ┌─────▼──────┐   ┌─────▼─────┐
    │  Spec   │        │  Scenario  │   │    Ref    │
    │ Analyzer│        │ Generator  │   │ Resolver  │
    └─────────┘        └────────────┘   └───────────┘
```

## Example Usage

### User Request
> "Generate comprehensive test cases for the 'create a new resource' endpoint"

### Server Process

1. **Load Specification** (`load_spec`)
   - Parse `sample-api-3.1.2.yaml`
   - Validate against OAS 3.1 schema
   - Cache parsed spec

2. **Analyze Endpoint** (`analyze_endpoint`)
   - Target: `POST /resources`
   - Extract request schema (Resource with name, email, type)
   - Identify required fields: name, email, type
   - Find constraints: email format, type enum, name minLength
   - Resolve responses: 201 (success), 400 (validation error)
   - Identify examples: Jane Doe, John Smith
   - Map security: api_key OR bearer_auth OR oauth2
   - Find related: GET /resources/{id} via link

3. **Generate Scenarios** (`generate_scenarios`)
   - **Happy Path** (2 scenarios)
     - Successfully create resource with Jane Doe example
     - Successfully create resource with John Smith example
   
   - **Validation Errors** (6 scenarios in Scenario Outline)
     - Missing name
     - Missing email
     - Invalid email format
     - Invalid type (not in enum)
     - Empty name (violates minLength)
     - Wrong data types
   
   - **Auth Errors** (3 scenarios)
     - No API key → 401
     - Invalid API key → 401
     - Expired token → 401
   
   - **Integration Flow** (1 scenario)
     - Create resource → Capture ID → GET resource → Verify match

4. **Export Feature** (`export_feature`)
   - Generate complete `.feature` file
   - Include comments and metadata
   - Apply tags for test organization
   - Validate Gherkin syntax

## Sample Generated Output

```gherkin
@api @resources
Feature: Create a new resource
  As an API client
  I want to create new resources via POST /resources
  So that I can add resources to the system

  Background:
    Given the API base URL is "https://api.sample.com/v1"
    And I have a valid API key
    And I set the "Content-Type" header to "application/json"

  @smoke @happy_path
  Scenario: Successfully create a resource with valid data
    Given I have a request body:
      """json
      {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "isActive": true,
        "type": "type1"
      }
      """
    When I send a POST request to "/resources"
    Then the response status code should be 201
    And the response should match the "Resource" schema
    And the response body should contain:
      | field | value                   |
      | name  | Jane Doe                |
      | email | jane.doe@example.com    |

  @regression @validation
  Scenario Outline: Fail to create resource with invalid data
    Given I have a request body with <field> set to <value>
    When I send a POST request to "/resources"
    Then the response status code should be 400
    And the error message should indicate "<field>" is invalid

    Examples:
      | field  | value          | reason                  |
      | name   | ""             | empty string            |
      | email  | "invalid"      | invalid email format    |
      | type   | "invalid_type" | not in enum             |
```

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: @modelcontextprotocol/sdk
- **Key Libraries**:
  - `js-yaml` - YAML parsing
  - `@apidevtools/json-schema-ref-parser` - $ref resolution
  - `ajv` - JSON Schema validation
  - `@cucumber/gherkin` - Gherkin validation
  - `json-schema-faker` - Test data generation

## Intelligent Analysis Pipeline

The server follows a 13-step process:

1. ✅ Load & Validate Spec
2. ✅ Identify Target Endpoint
3. ✅ Resolve Request Schema & Parameters
4. ✅ Resolve Response Schemas
5. ✅ Extract Examples & Constraints
6. ✅ Identify Security Requirements
7. ✅ Map Related Endpoints
8. ✅ Generate Happy Path Scenarios
9. ✅ Generate Validation Error Scenarios
10. ✅ Generate Edge Cases
11. ✅ Generate Security Test Scenarios
12. ✅ Generate Integration Flow Scenarios
13. ✅ Review & Refine

Each step builds on previous findings, allowing the AI to revise and refine its understanding iteratively.

## State Management

Like `sequential-thinking`, the server maintains state:

```typescript
{
  specCache: ParsedOpenAPISpec,
  analysisHistory: AnalysisStep[],
  endpointContext: EndpointDetails,
  generatedScenarios: Scenario[],
  schemaRegistry: Map<string, ResolvedSchema>
}
```

This enables:
- Progressive analysis
- Revision of previous steps
- Context preservation across operations
- Intelligent next-step suggestions

## Quality Assurance Features

1. **Gherkin Validation**: Syntax checking using @cucumber/gherkin
2. **Completeness Checking**: Ensure all response codes have scenarios
3. **Coverage Metrics**: Track tested fields, constraints, auth schemes
4. **Duplication Detection**: Avoid redundant scenarios
5. **Consistency Validation**: Uniform step language

## Value Proposition

### For QA Engineers
- ⏱️ **Save Time**: Automate test case creation from specs
- ✅ **Improve Coverage**: Comprehensive scenarios including edge cases
- 📝 **Maintain Quality**: Gherkin best practices built-in
- 🔄 **Stay Current**: Regenerate tests when API changes

### For Backend Developers
- 📋 **Contract Testing**: Verify API matches specification
- 🛡️ **Security Testing**: Automated security test generation
- 📚 **Documentation**: Tests serve as living documentation

### For DevOps Teams
- 🤖 **CI/CD Integration**: Automated test generation in pipelines
- 📊 **Quality Gates**: Coverage metrics for deployment decisions
- 🔍 **Change Detection**: Test only modified endpoints

## Comparison to Sequential-Thinking

| Aspect | Sequential-Thinking | API Spec Test Case Generator |
|--------|-------------------|------------------------------|
| **Purpose** | AI reasoning framework | API test generation |
| **Input** | Thinking steps | OpenAPI specification |
| **Output** | Thinking progress | Gherkin feature files |
| **State** | Thought history | Spec cache + analysis history |
| **Iterations** | Thought refinement | Analysis refinement |
| **Branching** | Alternative reasoning | Alternative scenarios |
| **Tool Count** | 1 tool | 1 tool (multiple operations) |

Both share the **iterative, intelligent approach** philosophy!

## Future Enhancements

### Phase 2
- Multiple output formats (Postman, REST Assured, Pytest)
- AI-enhanced scenario naming
- Test data management
- Contract testing support (Pact, Spring Cloud Contract)

### Phase 3
- Diff-based generation (test only changed endpoints)
- Performance test generation (Gatling, JMeter, K6)
- Visual test reports
- CI/CD pipeline generation

### Advanced
- Machine learning for scenario prioritization
- Semantic analysis for business-focused tests
- Multi-API orchestration testing

## Getting Started

1. **Install**: `npx -y @modelcontextprotocol/server-api-bdd-test-case-generator`
2. **Load Spec**: Point to your OpenAPI YAML/JSON
3. **Select Endpoint**: Choose which endpoint to test
4. **Generate**: Specify scenario types to generate
5. **Export**: Get your `.feature` file ready for test execution

## Conclusion

The **API Spec Test Case Generator** bridges the gap between API specifications and automated testing. By combining deep OpenAPI understanding with Gherkin best practices, it enables teams to:

- **Accelerate** test creation
- **Improve** test coverage
- **Maintain** test quality
- **Adapt** to API changes

All through an intelligent, conversational MCP interface! 🚀

---

**For full details**, see [api-bdd-test-case-generator-design.md](./api-bdd-test-case-generator-design.md)
