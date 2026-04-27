#!/bin/bash
# =======================================================
# Polyglot Sandbox Management CLI
# =======================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Format variables for highlighting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check prerequisites
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
    echo -e "${GREEN}Setup complete.${NC}"
    ;;
    
  build)
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    # Use standard git commit or timestamp if not in git repo
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || date +%s)
    
    echo "Building Node.js Runner..."
    docker build -t polyglot-nodejs:latest -t polyglot-nodejs:${GIT_COMMIT} -f containers/nodejs/Dockerfile .
    
    echo "Building Python Runner..."
    docker build -t polyglot-python:latest -t polyglot-python:${GIT_COMMIT} -f containers/python/Dockerfile .
    
    echo "Building API Image..."
    docker build -t polyglot-api:latest -t polyglot-api:${GIT_COMMIT} -f containers/api/Dockerfile .
    
    echo -e "${GREEN}Images successfully built and tagged with commit ${GIT_COMMIT}.${NC}"
    ;;
    
  test)
    echo -e "${YELLOW}Starting services and running tests...${NC}"
    # Start the stack detached
    docker-compose up -d
    
    echo "Waiting for API to initialize..."
    sleep 3
    
    echo -e "\n${YELLOW}--- Testing Python Execution ---${NC}"
    curl -s -X POST http://localhost:3000/execute \
      -H 'Content-Type: application/json' \
      -d '{ "language": "python", "code": "print('\''Hello world from Python!'\'')" }'
      
    echo -e "\n\n${YELLOW}--- Testing Node.js Execution ---${NC}"
    curl -s -X POST http://localhost:3000/execute \
      -H 'Content-Type: application/json' \
      -d '{ "language": "nodejs", "code": "console.log('\''Hello world from Node.js!'\'');" }'
      
    echo -e "\n\n${GREEN}Tests completed.${NC}"
    ;;
    
  clean)
    echo -e "${YELLOW}Cleaning up environment...${NC}"
    # Stop and remove compose architecture
    docker-compose down -v --remove-orphans || true
    
    # Remove sandbox runner containers (forcefully)
    echo "Removing dangling execution containers..."
    docker ps -a -q --filter "name=run_" | xargs -r docker rm -f
    
    # Remove polyglot base images
    echo "Removing project images..."
    docker images -q --filter "reference=polyglot-*" | xargs -r docker rmi -f
    
    # Clear temporary files
    echo "Clearing temporary files in /tmp..."
    # Warning: Only clean known patterns to avoid destructive host deletes
    rm -f /tmp/*.py /tmp/*.js || true
    
    echo -e "${GREEN}Cleanup finished.${NC}"
    ;;
    
  logs)
    echo -e "${YELLOW}Tailing Docker Composer logs...${NC}"
    # Tails logs, piping through awk to paint ERROR and CRITICAL keywords in red
    docker-compose logs -f | awk -v RED="${RED}" -v NC="${NC}" '
      /ERROR/ || /CRITICAL/ { print RED $0 NC; next }
      { print $0 }
    '
    ;;
    
  *)
    echo "Usage: ./manage.sh {setup|build|test|clean|logs}"
    echo "  setup   - Verify prerequisites and pull base docker images"
    echo "  build   - Build Docker images tagged with git commit"
    echo "  test    - Start infrastructure and run basic payload tests against API"
    echo "  clean   - Remove all containers, images, volumes, and temporary files"
    echo "  logs    - Tail infrastructure logs with error highlighting"
    exit 1
    ;;
esac
