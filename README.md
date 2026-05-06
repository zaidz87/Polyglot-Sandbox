# Polyglot Sandbox 🚀

Polyglot Sandbox is a lightweight, fully containerized code execution platform. It serves as a simplified backend similar to systems used by LeetCode or Replit. It securely takes raw, untrusted user code in multiple languages, runs it in strictly isolated ephemeral Docker containers, and returns the standard output and execution time — all while rate limiting users to protect server resources.

---

## 🏛️ Architecture Overview

The system is split into three main components:
1. **The Express API**: Processes incoming HTTP requests, validates payloads, and manages rate limiting.
2. **The Redis Datastore**: Acts as a high-speed memory cache for the API to enforce an IP-based rate limiting window.
3. **The Docker Daemon & Runners**: Orchestrated dynamically by the API to spawn isolated instances strictly engineered to run untrusted code safely.



---

## 🔒 Security Measures: Why Docker?

Running untrusted code supplied by anonymous web users is extremely dangerous without strict isolation. Docker was chosen to build unbreachable boundaries between the user code and the host server.

When a user submits code, it is evaluated securely with the following measures:
- **`--rm` (Ephemeral execution):** The container completely destroys itself the moment the script finishes running. There are no dangling processes or artifacts.
- **`--network=none`:** The runner container cannot fetch external resources, send outbound data, or access local network ports. This prevents DoS attacks or attempts to breach local APIs.
- **`--memory=256m`:** The RAM is hard-capped to 256 megabytes. If a user writes an infinite loop caching variables, the container crashes harmlessly before crashing the host.
- **`--cpus=0.5`:** The container is restricted to half of a CPU thread, avoiding full CPU starvation on the host server.
- **Non-Root Execution:** Inside the Node.js and Python Dockerfiles, we explicitly switch context to a non-root user (`runneruser`), neutralizing privilege escalation zero-day potentials.
- **Read-Only Code Mount:** The source file is mounted out of `/tmp` specifically with the `:ro` flag. The executed code cannot tamper with the file itself.

---

## 🛑 Redis Rate Limiting

To prevent API abuse and DDoS attacks, Redis is utilized as an exceptionally fast, in-memory counter.

**How it works:**
1. A user sends a request. Their IP address is cached using the `ioredis` driver.
2. The endpoint checks the `ratelimit:{CLIENT_IP}` key using Redis `INCR` incrementation.
3. If this is the first request within a 60-second window, an `EXPIRE` command is atomically set.
4. If the IP count breaches exactly **10 requests within a minute**, the API blocks execution and responds directly with a `HTTP 429 Too Many Requests`.

---

## 🔄 The API Lifecycle (`POST /execute`)

Here is exactly what happens linearly when you call the main endpoint:
1. **Validation**: Express accepts the JSON payload checking for valid `nodejs` or `python` fields.
2. **Rate Limit Hook**: Redis cross-references the IP to ensure the limit hasn't been breached.
3. **Temp File Write**: The API creates an MD5 name hash and writes the file temporarily to `/tmp` to prevent race conditions.
4. **Execution Engine Spawn**: The application invokes a non-blocking `spawn()` command executing the Docker runtime sequence.
5. **Collection**: The container starts, executes its payload, returns `stdout` or `stderr`, and completely deletes itself.
6. **Cleanup**: The temporary file on the host `/tmp` directory is wiped via `fs.unlink`.
7. **Response**: The output and calculation of duration are returned back in standard JSON.

---

## 🛠️ Exploring `manage.sh`

A unified Bash automation script handles deployment, orchestration, and cleanup. We utilize detailed bash case structures (`case in ... esac`), strict error tracing (`set -e`), and inline regex variable logic.

- `./manage.sh setup`: Tests the environment for dependencies (Git/Docker) and pulls foundational Alpine images.
- `./manage.sh build`: Generates the bespoke Docker images needed for the Python runner, the Node runner, and the API image itself. Tags them cleanly with active Git commit hashing.
- `./manage.sh test`: Quietly spins up `docker-compose` and hits the API automatically via `cURL` utilizing test node/python payloads to verify end-to-end functionality.
- `./manage.sh clean`: Wipes the entire infrastructure. Removes all generated images, kills dangling Docker containers, and sweeps temporary files from `/tmp`.
- `./manage.sh logs`: Rapidly streams logs out of docker-compose architecture highlighting generic runtime elements but painting critical syntax errors (`ERROR` and `CRITICAL`) in solid red.

---

## 📁 Project File Structure Breakdown

```
/
├── docker-compose.yml       # Orchestration file linking API container with Redis, mapping volumes globally.
├── package.json             # Express, Typescript, and Redis dependencies.
├── tsconfig.json            # Node.js TypeScript compilation instructions.
├── README.md                # System documentation.
├── /containers
│   ├── /api/Dockerfile      # Builds Node+Docker CLI container wrapper mounting the docker socket.
│   ├── /nodejs/Dockerfile   # Builds the non-root Node.js 20 runner shell.
│   └── /python/Dockerfile   # Builds the non-root Python 3.12 runner shell.
├── /scripts
│   └── manage.sh            # The centralized CLI manager for building, cleaning, and testing.
└── /src
    ├── index.ts             # Express.js endpoint initialization and middleware chaining.
    ├── executor.ts          # Core boundary logic taking payload, writing to file, and executing sub-processes.
    ├── rateLimiter.ts       # Express middleware invoking Redis IP incrementation.
    └── hasher.ts            # Fast md5 compilation utility handling temporary collision reduction.
```

---

## 💻 Local Setup Prerequisites & Running

### Requirements
- **Docker Engine** (or Docker Desktop) installed locally.
- **Node.js** (Only if you manually want to tinker with TS. Docker handles it otherwise).
- **Git** (for version tracking variables).
- Git Bash or WSL (If running under Windows to execute `./scripts/manage.sh`).

### Execution Guide
1. Launch terminal from root project folder.
2. **Setup Base**: Ensure images are available.
   ```bash
   ./scripts/manage.sh setup
   ```
3. **Build Code**:
   ```bash
   ./scripts/manage.sh build
   ```
4. **Boot Up & Test**: Start everything and verify payloads dynamically.
   ```bash
   ./scripts/manage.sh test
   ```
5. **View Outputs**:
   ```bash
   ./scripts/manage.sh logs
   ```
6. **Teardown**:
   ```bash
   ./scripts/manage.sh clean
   ```

---

## 🧠 Lessons Learned & Realized Concepts

Building Polyglot Sandbox required deeply synthesizing several advanced backend concepts:
- **Node.js Child Processes**: Understanding event-driven processes allows execution without blocking the main event loop, utilizing `spawn` to seamlessly pipe stdout independently versus standard `exec` buffers.
- **Docker Isolation via Socket Mounting**: Orchestrating "Docker-out-of-Docker" allows the primary API to dictate limits safely while restricting direct network boundaries via zero-trust execution models.
- **Redis & Distributed Locks**: Managing high throughput requests requires ultra-fast operations; `ioredis` increments protect the thread by avoiding DB locking entirely.
- **Bash Automation Strategy**: By isolating complex orchestration to `.sh` scripting, deployment friction collapses making cross-team staging easier.
- **Event Loop & Blocking**: Preventing the Express thread from hanging during Docker spin-up ensures that even if ten node execution requests are triggered concurrently, the thread continues serving 429 rate limit bounces instantly without freezing.

## 🚀 Future Improvements Roadmap
1. Add more runner languages like **Java**, **Go**, and **C++**.
2. Institute caching with **LRU (Least Recently Used) Eviction** so identical snippets (e.g., standard "Hello World" cases) are pulled from Redis instantly instead of incurring Docker spin-up lag.
3. Build a simple Frontend UI with Monaco Editor or CodeMirror for a web-based IDE feel.
4. Implement **WebSocket** connections for long-running scripts, streaming output progressively rather than waiting for an exit code zero.
5. Setup GitHub Actions for CI/CD to deploy this stack seamlessly out to DigitalOcean Droplets or AWS EC2 instances.
