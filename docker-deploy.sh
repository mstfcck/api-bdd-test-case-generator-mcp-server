#!/bin/bash

# ============================================================================
# Docker Build and Deployment Script
# API Spec Test Case Generator MCP Server
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="mcp/api-bdd-test-case-generator"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="mcp-api-bdd-test-case-generator"

# Functions
print_section() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Build Docker Image
# ============================================================================
build_image() {
    print_section "Building Docker Image"
    
    if docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .; then
        print_success "Docker image built successfully: ${IMAGE_NAME}:${IMAGE_TAG}"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# ============================================================================
# Run Docker Container
# ============================================================================
run_container() {
    print_section "Running Docker Container"
    
    # Stop existing container if running
    if docker ps -a | grep -q "${CONTAINER_NAME}"; then
        print_warning "Stopping existing container: ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}" 2>/dev/null || true
        docker rm "${CONTAINER_NAME}" 2>/dev/null || true
    fi
    
    # Create directories if they don't exist
    mkdir -p ./specs ./test-output
    
    # Run container
    print_info "Starting container: ${CONTAINER_NAME}"
    docker run -d \
        --name "${CONTAINER_NAME}" \
        --restart unless-stopped \
        -v "$(pwd)/specs:/app/specs:ro" \
        -v "$(pwd)/test-output:/app/output:rw" \
        "${IMAGE_NAME}:${IMAGE_TAG}"
    
    print_success "Container started: ${CONTAINER_NAME}"
}

# ============================================================================
# Run with Docker Compose
# ============================================================================
run_compose() {
    print_section "Starting with Docker Compose"
    
    if docker-compose up -d; then
        print_success "Docker Compose started successfully"
    else
        print_error "Failed to start with Docker Compose"
        exit 1
    fi
}

# ============================================================================
# Stop Container
# ============================================================================
stop_container() {
    print_section "Stopping Container"
    
    if docker stop "${CONTAINER_NAME}" 2>/dev/null; then
        print_success "Container stopped: ${CONTAINER_NAME}"
    else
        print_warning "Container not running: ${CONTAINER_NAME}"
    fi
}

# ============================================================================
# Remove Container
# ============================================================================
remove_container() {
    print_section "Removing Container"
    
    stop_container
    
    if docker rm "${CONTAINER_NAME}" 2>/dev/null; then
        print_success "Container removed: ${CONTAINER_NAME}"
    else
        print_warning "Container does not exist: ${CONTAINER_NAME}"
    fi
}

# ============================================================================
# View Logs
# ============================================================================
view_logs() {
    print_section "Container Logs"
    docker logs -f "${CONTAINER_NAME}"
}

# ============================================================================
# Clean Up
# ============================================================================
cleanup() {
    print_section "Cleaning Up"
    
    # Remove container
    remove_container
    
    # Remove image
    print_info "Removing image: ${IMAGE_NAME}:${IMAGE_TAG}"
    if docker rmi "${IMAGE_NAME}:${IMAGE_TAG}" 2>/dev/null; then
        print_success "Image removed"
    else
        print_warning "Image not found"
    fi
    
    # Prune dangling images
    print_info "Pruning dangling images"
    docker image prune -f
    
    print_success "Cleanup complete"
}

# ============================================================================
# Test Container
# ============================================================================
test_container() {
    print_section "Testing Container"
    
    # Build image
    build_image
    
    # Run test container
    print_info "Running test container"
    docker run --rm -i "${IMAGE_NAME}:${IMAGE_TAG}" node -e "console.log('Container test successful')"
    
    print_success "Container test passed"
}

# ============================================================================
# Push to Registry
# ============================================================================
push_image() {
    print_section "Pushing Image to Registry"
    
    local REGISTRY="${DOCKER_REGISTRY:-docker.io}"
    local FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    
    print_info "Tagging image: ${FULL_IMAGE}"
    docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${FULL_IMAGE}"
    
    print_info "Pushing image: ${FULL_IMAGE}"
    if docker push "${FULL_IMAGE}"; then
        print_success "Image pushed successfully"
    else
        print_error "Failed to push image"
        exit 1
    fi
}

# ============================================================================
# Show Usage
# ============================================================================
show_usage() {
    cat << EOF
${BLUE}API Spec Test Case Generator - Docker Management Script${NC}

${GREEN}Usage:${NC}
    $0 [command]

${GREEN}Commands:${NC}
    build           Build Docker image
    run             Run Docker container
    compose         Start with Docker Compose
    stop            Stop running container
    remove          Remove container
    logs            View container logs
    test            Test container build and run
    cleanup         Clean up containers and images
    push            Push image to registry
    help            Show this help message

${GREEN}Examples:${NC}
    $0 build                    # Build the Docker image
    $0 run                      # Run the container
    $0 compose                  # Start with Docker Compose
    $0 logs                     # View logs
    IMAGE_TAG=v1.0 $0 build     # Build with custom tag

${GREEN}Environment Variables:${NC}
    IMAGE_TAG       Tag for Docker image (default: latest)
    DOCKER_REGISTRY Registry for pushing images (default: docker.io)

EOF
}

# ============================================================================
# Main Script
# ============================================================================
main() {
    case "${1:-help}" in
        build)
            build_image
            ;;
        run)
            build_image
            run_container
            ;;
        compose)
            run_compose
            ;;
        stop)
            stop_container
            ;;
        remove)
            remove_container
            ;;
        logs)
            view_logs
            ;;
        test)
            test_container
            ;;
        cleanup)
            cleanup
            ;;
        push)
            build_image
            push_image
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
