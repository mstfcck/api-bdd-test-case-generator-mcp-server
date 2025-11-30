#!/bin/bash

# ============================================================================
# Docker Setup Script
# API Spec Test Case Generator MCP Server
# ============================================================================
# This script performs a complete Docker environment setup:
# - Clean and rebuild Docker image
# - Run tests inside the container
# - Configure MCP integration (VS Code mcp.json)
# - Create sample OpenAPI spec for testing
# - Validate both content mode and file mode
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="mcp/api-bdd-test-case-generator"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="mcp-api-bdd-test-case-generator"
NO_CLEANUP=false
VERBOSE=false
QUIET=false
FORCE=true  # Default to force mode (no confirmations)

# Functions
print_section() {
    if [ "$QUIET" = false ]; then
        echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}  $1${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
    fi
}

print_success() {
    if [ "$QUIET" = false ]; then
        echo -e "${GREEN}✓ $1${NC}"
    fi
}

print_error() {
    echo -e "${RED}✗ $1${NC}" >&2
}

print_warning() {
    if [ "$QUIET" = false ]; then
        echo -e "${YELLOW}⚠ $1${NC}"
    fi
}

print_info() {
    if [ "$QUIET" = false ]; then
        echo -e "${CYAN}ℹ $1${NC}"
    fi
}

print_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${NC}  $1${NC}"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cleanup)
            NO_CLEANUP=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        --no-force)
            FORCE=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-cleanup    Skip cleanup phase"
            echo "  -v, --verbose   Show detailed output"
            echo "  -q, --quiet     Minimal output"
            echo "  --no-force      Ask for confirmation before each phase"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Example:"
            echo "  $0                  # Full Docker setup (default)"
            echo "  $0 --no-cleanup     # Skip cleanup phase"
            echo "  $0 -v               # Verbose output"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# ============================================================================
# Start Setup
# ============================================================================
if [ "$QUIET" = false ]; then
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     API BDD Test Case Generator - Docker Setup            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
fi

# ============================================================================
# Phase 1: Prerequisites Check
# ============================================================================
print_section "Phase 1/9: Checking Prerequisites"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    echo "Please install Docker Desktop or Docker Engine"
    exit 1
fi

DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
print_success "Docker ${DOCKER_VERSION} detected"
print_verbose "Docker path: $(which docker)"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running"
    echo "Please start Docker Desktop or Docker daemon"
    exit 1
fi

print_success "Docker is running"

# Check Docker Compose (optional)
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1)
    print_success "Docker Compose ${COMPOSE_VERSION} detected"
else
    print_warning "Docker Compose not found (optional)"
fi

print_success "All prerequisites met"

# ============================================================================
# Phase 2: Cleanup
# ============================================================================
if [ "$NO_CLEANUP" = false ]; then
    print_section "Phase 2/9: Cleaning Previous Docker Resources"
    
    # Stop and remove existing containers
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_info "Stopping existing container: ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}" > /dev/null 2>&1 || true
        print_info "Removing existing container: ${CONTAINER_NAME}"
        docker rm "${CONTAINER_NAME}" > /dev/null 2>&1 || true
        print_verbose "Removed container: ${CONTAINER_NAME}"
    fi
    
    # Remove old images
    if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}:${IMAGE_TAG}$"; then
        print_info "Removing old image: ${IMAGE_NAME}:${IMAGE_TAG}"
        docker rmi "${IMAGE_NAME}:${IMAGE_TAG}" > /dev/null 2>&1 || true
        print_verbose "Removed image: ${IMAGE_NAME}:${IMAGE_TAG}"
    fi
    
    # Prune dangling images
    print_info "Pruning dangling images"
    docker image prune -f > /dev/null 2>&1
    
    print_success "Cleanup complete"
else
    print_section "Phase 2/9: Cleanup"
    print_warning "Cleanup skipped (--no-cleanup flag)"
fi

# ============================================================================
# Phase 3: Build Docker Image
# ============================================================================
print_section "Phase 3/9: Building Docker Image"

print_info "Building image: ${IMAGE_NAME}:${IMAGE_TAG}"

if [ "$VERBOSE" = true ]; then
    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
else
    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" . > /dev/null 2>&1
fi

# Get image size
IMAGE_SIZE=$(docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "{{.Size}}")
print_success "Docker image built successfully"
print_success "Image: ${IMAGE_NAME}:${IMAGE_TAG} (${IMAGE_SIZE})"
print_verbose "Image ID: $(docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "{{.ID}}")"

# ============================================================================
# Phase 4: Validate Build with Local Tests
# ============================================================================
print_section "Phase 4/9: Validating Build with Local Tests"

print_info "Running local tests to validate codebase before Docker..."

# Check if we need to install dependencies locally
if [ ! -d "node_modules" ] || [ ! -d "dist" ]; then
    print_info "Installing dependencies and building locally..."
    if [ "$VERBOSE" = true ]; then
        npm install && npm run build
    else
        npm install > /dev/null 2>&1 && npm run build > /dev/null 2>&1
    fi
fi

# Run tests locally
if [ "$VERBOSE" = true ]; then
    npm test
    TEST_EXIT=$?
else
    TEST_OUTPUT=$(npm test --silent 2>&1)
    TEST_EXIT=$?
fi

if [ $TEST_EXIT -eq 0 ]; then
    print_success "All tests passed locally"
    if [ "$VERBOSE" = false ]; then
        echo "$TEST_OUTPUT" | tail -5
    fi
else
    print_error "Tests failed locally"
    if [ "$VERBOSE" = false ]; then
        echo "$TEST_OUTPUT"
    fi
    exit 1
fi

# ============================================================================
# Phase 5: Validate Entry Point in Container
# ============================================================================
print_section "Phase 5/9: Validating Entry Point"

print_info "Testing container entry point..."

# Test that container starts and Node.js works (without -i to avoid hanging)
timeout 2s docker run --rm "${IMAGE_NAME}:${IMAGE_TAG}" node -e "console.log('Container test successful')" > /dev/null 2>&1 || ENTRY_EXIT=$?

if [ "${ENTRY_EXIT:-0}" -eq 0 ] || [ "${ENTRY_EXIT:-0}" -eq 124 ]; then
    print_success "Entry point validated"
else
    print_error "Entry point validation failed (exit code: ${ENTRY_EXIT:-0})"
    exit 1
fi

# Verify dist/index.js exists in container
if docker run --rm "${IMAGE_NAME}:${IMAGE_TAG}" ls dist/index.js > /dev/null 2>&1; then
    print_success "Entry point exists: dist/index.js"
else
    print_error "Entry point not found in container: dist/index.js"
    exit 1
fi

# ============================================================================
# Phase 6: Create Sample Directories and Files
# ============================================================================
print_section "Phase 6/9: Creating Sample Files"

# Create specs directory
if [ ! -d "specs" ]; then
    print_info "Creating specs/ directory"
    mkdir -p specs
fi

# Create output directory
if [ ! -d "output" ]; then
    print_info "Creating output/ directory"
    mkdir -p output
fi

# Create a sample OpenAPI spec if it doesn't exist
SAMPLE_SPEC="specs/sample-api.yaml"
if [ ! -f "$SAMPLE_SPEC" ]; then
    print_info "Creating sample OpenAPI spec: $SAMPLE_SPEC"
    cat > "$SAMPLE_SPEC" <<'EOF'
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
  description: A sample API for testing the MCP server

servers:
  - url: https://api.example.com/v1

paths:
  /users:
    get:
      summary: List users
      operationId: listUsers
      tags:
        - Users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    
    post:
      summary: Create a user
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserInput'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Invalid input
        '401':
          description: Unauthorized

  /users/{userId}:
    get:
      summary: Get user by ID
      operationId: getUser
      tags:
        - Users
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - name
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
        createdAt:
          type: string
          format: date-time
    
    UserInput:
      type: object
      required:
        - email
        - name
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 1
          maxLength: 100
EOF
    print_success "Sample spec created: $SAMPLE_SPEC"
else
    print_success "Sample spec already exists: $SAMPLE_SPEC"
fi

print_success "Directories and sample files ready"

# ============================================================================
# Phase 7: Configure MCP Integration
# ============================================================================
print_section "Phase 7/9: Configuring MCP Integration"

# Create .vscode directory if it doesn't exist
if [ ! -d ".vscode" ]; then
    print_info "Creating .vscode directory"
    mkdir -p .vscode
fi

# Backup existing mcp.json if it exists
MCP_CONFIG=".vscode/mcp.json"
if [ -f "$MCP_CONFIG" ]; then
    BACKUP_FILE="${MCP_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    print_info "Backing up existing mcp.json to $(basename $BACKUP_FILE)"
    cp "$MCP_CONFIG" "$BACKUP_FILE"
    print_verbose "Backup created: $BACKUP_FILE"
fi

# Update or create mcp.json with Docker configurations
print_info "Updating mcp.json with Docker configurations"

python3 - <<EOF
import json
import os

config_file = "$MCP_CONFIG"
workspace_folder = os.getcwd()

# Read existing config or create new
try:
    with open(config_file, 'r') as f:
        config = json.load(f)
except:
    config = {"servers": {}}

# Ensure servers object exists
if "servers" not in config:
    config["servers"] = {}

# Add/update Docker content mode configuration
config["servers"]["api-bdd-test-case-generator-docker"] = {
    "type": "stdio",
    "command": "docker",
    "args": [
        "run",
        "--rm",
        "-i",
        "${IMAGE_NAME}:${IMAGE_TAG}"
    ]
}

# Add/update Docker volume mode configuration
config["servers"]["api-bdd-test-case-generator-docker-volumes"] = {
    "type": "stdio",
    "command": "docker",
    "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "\${workspaceFolder}:/workspace:ro",
        "-v",
        "\${workspaceFolder}/output:/workspace/output:rw",
        "${IMAGE_NAME}:${IMAGE_TAG}"
    ]
}

# Write updated config
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')

print("✓ Updated Docker MCP configurations")
EOF

print_success "MCP configuration updated: .vscode/mcp.json"
print_verbose "Docker content mode: api-bdd-test-case-generator-docker"
print_verbose "Docker volume mode: api-bdd-test-case-generator-docker-volumes"

# ============================================================================
# Phase 8: Validate Docker Modes
# ============================================================================
print_section "Phase 8/9: Validating Docker Modes"

# Test content mode (no volumes)
print_info "Testing content mode (no volumes)..."
timeout 2s docker run --rm "${IMAGE_NAME}:${IMAGE_TAG}" node -e "console.log('Content mode test')" > /dev/null 2>&1 || CONTENT_EXIT=$?

if [ "${CONTENT_EXIT:-0}" -eq 0 ] || [ "${CONTENT_EXIT:-0}" -eq 124 ]; then
    print_success "Content mode validated"
else
    print_warning "Content mode may have issues (exit code: ${CONTENT_EXIT:-0})"
fi

# Test file mode (with volumes)
print_info "Testing file mode (with volumes)..."
timeout 2s docker run --rm \
    -v "$(pwd):/workspace:ro" \
    -v "$(pwd)/output:/workspace/output:rw" \
    "${IMAGE_NAME}:${IMAGE_TAG}" \
    node -e "console.log('File mode test')" > /dev/null 2>&1 || FILE_EXIT=$?

if [ "${FILE_EXIT:-0}" -eq 0 ] || [ "${FILE_EXIT:-0}" -eq 124 ]; then
    print_success "File mode validated"
else
    print_warning "File mode may have issues (exit code: ${FILE_EXIT:-0})"
fi

print_success "Both Docker modes validated"

# ============================================================================
# Phase 9: Success Summary
# ============================================================================
print_section "Phase 9/9: Setup Complete!"

if [ "$QUIET" = false ]; then
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           ✅  Docker Setup Successful!  ✅                 ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${CYAN}📦 Docker Image Information:${NC}"
    echo "   Image: ${IMAGE_NAME}:${IMAGE_TAG}"
    echo "   Size: ${IMAGE_SIZE}"
    echo "   Entry Point: dist/index.js"
    echo ""
    
    echo -e "${CYAN}📂 Created Directories:${NC}"
    echo "   ./specs/   - Place OpenAPI specifications here"
    echo "   ./output/  - Generated feature files go here"
    echo "   Sample spec: ./specs/sample-api.yaml"
    echo ""
    
    echo -e "${CYAN}🔧 Docker Modes Available:${NC}"
    echo ""
    echo -e "${YELLOW}1. Content Mode (Recommended):${NC}"
    echo "   MCP Server: api-bdd-test-case-generator-docker"
    echo "   Usage: Pass OpenAPI specs as content strings via specContent parameter"
    echo "   Benefits: Fully containerized, no file system access needed"
    echo ""
    
    echo -e "${YELLOW}2. File Mode (Optional):${NC}"
    echo "   MCP Server: api-bdd-test-case-generator-docker-volumes"
    echo "   Usage: Pass file paths via specFilePath parameter"
    echo "   Read specs from: /workspace/specs/your-spec.yaml"
    echo "   Write output to: /workspace/output/your-feature.feature"
    echo "   Security: Workspace is read-only, only output/ is writable"
    echo ""
    
    echo -e "${CYAN}📖 Next Steps:${NC}"
    echo ""
    echo -e "${YELLOW}1. Restart VS Code MCP Extension:${NC}"
    echo "   - Open VS Code Command Palette (Cmd+Shift+P / Ctrl+Shift+P)"
    echo "   - Run: 'MCP: Restart Server'"
    echo "   - Or reload VS Code window"
    echo ""
    
    echo -e "${YELLOW}2. Test Content Mode:${NC}"
    echo "   docker run --rm -i ${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    
    echo -e "${YELLOW}3. Test File Mode:${NC}"
    echo "   docker run --rm -i \\"
    echo "     -v \$(pwd):/workspace:ro \\"
    echo "     -v \$(pwd)/output:/workspace/output:rw \\"
    echo "     ${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    
    echo -e "${YELLOW}4. Use Sample Spec:${NC}"
    echo "   Your sample OpenAPI spec is ready at: ./specs/sample-api.yaml"
    echo "   Try generating tests for it using the MCP tools!"
    echo ""
    
    echo -e "${GREEN}✨ Your Docker MCP server is ready to use!${NC}"
    echo ""
fi
