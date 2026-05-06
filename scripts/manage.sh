#!/bin/bash
# =======================================================
# Polyglot Sandbox Management CLI
# =======================================================

# Exit immediately if a command exits with a non-zero status
set -e

# ANSI color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# check_prerequisites — verifies required tools are installed
# ---------------------------------------------------------------------------
check_prerequisites() {
  echo -e "${YELLOW}Checking prerequisites...${NC}"
  if ! command -v docker &> /dev/null; then
      echo -e "${RED}Error: Docker is not installed.${NC}"
      exit 1
  fi
  if ! command -v git &> /dev/null; then
      echo -e "${RED}Error: Git is not installed.${NC}"
      exit 1
  fi
  echo -e "${GREEN}Prerequisites met.${NC}"
}

case "$1" in
  setup)
    echo -e "${YELLOW}Running Setup...${NC}"
    check_prerequisites
    echo "Pulling latest base images..."
    docker pull node:20-alpine
    docker pull python:3.12-alpine
    docker pull redis:7-alpine
    docker pull eclipse-temurin:21-jdk-alpine
    docker pull golang:1.22-alpine
    docker pull alpine:3.19
    echo -e "${GREEN}Setup complete.${NC}"
    ;;

  build)
    echo -e "${YELLOW}Building Docker images...${NC}"

    # Tag each image with both :latest and the current git commit for traceability
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || date +%s)

    echo "Building Node.js Runner..."
    docker build -t polyglot-nodejs:latest -t polyglot-nodejs:${GIT_COMMIT} -f containers/nodejs/Dockerfile .

    echo "Building Python Runner..."
    docker build -t polyglot-python:latest -t polyglot-python:${GIT_COMMIT} -f containers/python/Dockerfile .

    echo "Building Java Runner..."
    docker build -t polyglot-java:latest -t polyglot-java:${GIT_COMMIT} -f containers/java/Dockerfile .

    echo "Building Go Runner..."
    docker build -t polyglot-go:latest -t polyglot-go:${GIT_COMMIT} -f containers/go/Dockerfile .

    echo "Building C++ Runner..."
    docker build -t polyglot-cpp:latest -t polyglot-cpp:${GIT_COMMIT} -f containers/cpp/Dockerfile .

    echo "Building API Image..."
    docker build -t polyglot-api:latest -t polyglot-api:${GIT_COMMIT} -f containers/api/Dockerfile .

    echo -e "${GREEN}All images built and tagged with commit ${GIT_COMMIT}.${NC}"
    ;;

  test)
    echo -e "${YELLOW}Starting services and running tests...${NC}"
    docker-compose up -d

    echo "Waiting for API to initialize..."
    sleep 4

    # Register a test user
    echo -e "\n${YELLOW}--- Registering test user ---${NC}"
    curl -s -X POST http://localhost:3000/auth/register \
      -H 'Content-Type: application/json' \
      -d '{"email":"test@sandbox.dev","password":"password123"}'

    # Login and capture token
    echo -e "\n\n${YELLOW}--- Logging in ---${NC}"
    TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
      -H 'Content-Type: application/json' \
      -d '{"email":"test@sandbox.dev","password":"password123"}' \
      | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    echo "Token acquired: ${TOKEN:0:20}..."

    echo -e "\n${YELLOW}--- Testing Python Execution ---${NC}"
    curl -s -X POST http://localhost:3000/execute \
      -H "Authorization: Bearer ${TOKEN}" \
      -H 'Content-Type: application/json' \
      -d '{"language":"python","code":"print(\"Hello from Python!\")"}'

    echo -e "\n\n${YELLOW}--- Testing Node.js Execution ---${NC}"
    curl -s -X POST http://localhost:3000/execute \
      -H "Authorization: Bearer ${TOKEN}" \
      -H 'Content-Type: application/json' \
      -d '{"language":"nodejs","code":"console.log(\"Hello from Node.js!\");"}'

    echo -e "\n\n${YELLOW}--- Testing Go Execution ---${NC}"
    curl -s -X POST http://localhost:3000/execute \
      -H "Authorization: Bearer ${TOKEN}" \
      -H 'Content-Type: application/json' \
      -d '{"language":"go","code":"package main\nimport \"fmt\"\nfunc main(){fmt.Println(\"Hello from Go!\")}"}'

    echo -e "\n\n${GREEN}Tests completed.${NC}"
    ;;

  clean)
    echo -e "${YELLOW}Cleaning up environment...${NC}"
    docker-compose down -v --remove-orphans || true

    echo "Removing dangling execution containers..."
    docker ps -a -q --filter "name=run_" | xargs -r docker rm -f

    echo "Removing project images..."
    docker images -q --filter "reference=polyglot-*" | xargs -r docker rmi -f

    echo "Clearing temporary files in /tmp..."
    rm -f /tmp/*.py /tmp/*.js /tmp/*.go /tmp/*.cpp /tmp/*.java || true

    echo -e "${GREEN}Cleanup finished.${NC}"
    ;;

  logs)
    echo -e "${YELLOW}Tailing Docker Compose logs...${NC}"
    docker-compose logs -f | awk -v RED="${RED}" -v NC="${NC}" '
      /ERROR/ || /CRITICAL/ { print RED $0 NC; next }
      { print $0 }
    '
    ;;

  *)
    echo "Usage: ./manage.sh {setup|build|test|clean|logs}"
    echo "  setup   - Verify prerequisites and pull base Docker images"
    echo "  build   - Build all 5 language runner images + API image"
    echo "  test    - Start infrastructure, register user, and run language tests"
    echo "  clean   - Remove all containers, images, volumes, and temp files"
    echo "  logs    - Tail infrastructure logs with error highlighting"
    exit 1
    ;;
esac
