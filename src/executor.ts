import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateHash } from './hasher';

interface ExecutionResult {
  output: string;
  executionTime: string;
  status: 'success' | 'error';
}

// ---------------------------------------------------------------------------
// Language configuration map.
// To add a new language: add one entry here + a matching Dockerfile in
// /containers/<language>/ + a build step in manage.sh.
//
// ext             — file extension for the temp source file on the host
// containerFile   — fixed filename inside the container's /code/ directory
//                   (most langs use a generic name; Java MUST be Main.java)
// cmd             — the command array passed as Docker run arguments
// ---------------------------------------------------------------------------
interface LangConfig {
  ext: string;
  containerFile: string;
  cmd: string[];
}

const LANG_CONFIG: Record<string, LangConfig> = {
  python: {
    ext: 'py',
    containerFile: 'main.py',
    cmd: ['python', '/code/main.py'],
  },
  nodejs: {
    ext: 'js',
    containerFile: 'main.js',
    cmd: ['node', '/code/main.js'],
  },
  go: {
    ext: 'go',
    containerFile: 'main.go',
    // go run compiles + executes in one step — no separate build phase needed
    cmd: ['go', 'run', '/code/main.go'],
  },
  cpp: {
    ext: 'cpp',
    containerFile: 'main.cpp',
    // Compile to /tmp/prog (world-writable inside container), then execute
    cmd: ['sh', '-c', 'g++ /code/main.cpp -o /tmp/prog && /tmp/prog'],
  },
  java: {
    ext: 'java',
    // Java enforces filename === public class name.
    // Users must define 'class Main' as the entry point.
    containerFile: 'Main.java',
    cmd: ['sh', '-c', 'cd /code && javac Main.java && java Main'],
  },
};

// Exported so index.ts can use it for validation without duplicating the list
export const SUPPORTED_LANGUAGES = Object.keys(LANG_CONFIG);

/**
 * Writes user code to a uniquely-named temp file, executes it inside an
 * isolated Docker container, captures output, then cleans up the temp file.
 *
 * @param language - One of the keys in LANG_CONFIG
 * @param code     - Raw source code string from the user
 */
export async function executeCode(language: string, code: string): Promise<ExecutionResult> {
  const config = LANG_CONFIG[language];

  // Hash(code + timestamp) guarantees a unique host filename even under concurrent requests
  const fileHash = generateHash(code + Date.now().toString());
  const hostFileName = `${fileHash}.${config.ext}`;
  const hostFilePath = path.join('/tmp', hostFileName);

  try {
    // 1. Write source code to a temporary file on the host (shared /tmp volume)
    await fs.writeFile(hostFilePath, code, { encoding: 'utf-8' });

    const startTime = Date.now();

    // 2. Spawn Docker process and wrap event-based API in a Promise
    return await new Promise<ExecutionResult>((resolve) => {
      const containerName = `run_${fileHash}`;
      const imageTag = `polyglot-${language}:latest`;

      // Mount the unique host file into the container as the fixed containerFile path.
      // :ro ensures the running code cannot modify its own source file.
      const volumeMount = `${hostFilePath}:/code/${config.containerFile}:ro`;

      const dockerArgs = [
        'run',
        '--name',         containerName,
        '--rm',           // Auto-remove container on exit — no manual cleanup needed
        '--network=none', // Zero network access — code cannot make external calls
        '--memory=256m',  // Hard RAM cap — prevents memory-bomb attacks
        '--cpus=0.5',     // CPU limit — prevents starvation of other containers
        '-v',             volumeMount,
        imageTag,
        ...config.cmd,    // Spread the language-specific run command
      ];

      const dockerProcess = spawn('docker', dockerArgs);

      let output = '';
      let errorOutput = '';

      // Stream stdout chunks into a string buffer
      dockerProcess.stdout.on('data', (data) => { output += data.toString(); });

      // Stream stderr chunks separately (compiler errors, runtime tracebacks)
      dockerProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

      // close fires when the Docker process (and container) has fully exited
      dockerProcess.on('close', (code) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

        if (code === 0) {
          resolve({ output: output.trim(), executionTime: duration, status: 'success' });
        } else {
          // Prefer stderr (compiler/runtime error message) over stdout
          resolve({ output: errorOutput.trim() || output.trim(), executionTime: duration, status: 'error' });
        }
      });

      // Handles the case where the docker binary itself cannot be found / started
      dockerProcess.on('error', (err) => {
        resolve({ output: `System spawn error: ${err.message}`, executionTime: '0.0s', status: 'error' });
      });
    });

  } catch (err: any) {
    return { output: `File system error: ${err.message}`, executionTime: '0s', status: 'error' };
  } finally {
    // 3. Always delete the temp file — success, error, or crash
    try {
      await fs.unlink(hostFilePath);
    } catch (cleanupErr) {
      console.error(`[Executor] Failed to cleanup temp file ${hostFilePath}:`, cleanupErr);
    }
  }
}
