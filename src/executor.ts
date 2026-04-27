import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateHash } from './hasher';

interface ExecutionResult {
  output: string;
  executionTime: string;
  status: 'success' | 'error';
}

/**
 * Handles the logic required to write user code to a temporary file
 * and execute it securely within a Docker container.
 * 
 * @param language The programming language runner to use ('python' or 'nodejs')
 * @param code The source code to execute
 */
export async function executeCode(language: string, code: string): Promise<ExecutionResult> {
  // We use md5 hashing combined with current timestamp to guarantee unique temporary filenames
  // This prevents race conditions where multiple requests might overwrite the same temp file
  const fileHash = generateHash(code + Date.now().toString());
  const ext = language === 'python' ? 'py' : 'js';
  const fileName = `${fileHash}.${ext}`;
  const filePath = path.join('/tmp', fileName);

  try {
    // 1. Write the code to a temporary file mapped to the /tmp directory
    await fs.writeFile(filePath, code, { encoding: 'utf-8' });

    // Mark the start time to calculate execution duration later
    const startTime = Date.now();

    // 2. Prepare the Docker execution command
    // We launch Docker externally. This relies on the API container
    // having the /var/run/docker.sock mounted.
    return await new Promise<ExecutionResult>((resolve) => {
      // Create a unique container name to avoid conflicts
      const containerName = `run_${fileHash}`;
      
      // Select the previously built image tagged during ./manage.sh build
      const imageTag = `polyglot-${language}:latest`;

      // Docker run arguments explicitly configured for security and isolation
      const dockerArgs = [
        'run',
        '--name', containerName,
        '--rm',                     // Automatically remove container after it exits
        '--network=none',           // Disables all network access for the container
        '--memory=256m',            // Hard limit RAM usage to prevent DoS via memory consumption
        '--cpus=0.5',               // Limit CPU thread usage
        '-v', `${filePath}:/code/script.${ext}:ro`, // Mount the file in read-only mode explicitly
        imageTag,                   // Target runner image
        language === 'python' ? 'python' : 'node', // Command runner
        `/code/script.${ext}`       // Target script to run
      ];

      // Spawn the Docker process
      // We use node's child_process.spawn to handle data streaming non-blockingly
      const dockerProcess = spawn('docker', dockerArgs);

      let output = '';
      let errorOutput = '';

      // Collect standard output
      dockerProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      // Collect standard error
      dockerProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Handle the container termination
      dockerProcess.on('close', (code) => {
        // Calculate the execution time in seconds
        const duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

        if (code === 0) {
          resolve({
            output: output.trim(),
            executionTime: duration,
            status: 'success'
          });
        } else {
          resolve({
            output: errorOutput.trim() || output.trim(),
            executionTime: duration,
            status: 'error'
          });
        }
      });
      
      // Fallback in case Docker spawn fails immediately
      dockerProcess.on('error', (err) => {
        resolve({
          output: `System spawn error: ${err.message}`,
          executionTime: '0.0s',
          status: 'error'
        });
      });
    });

  } catch (err: any) {
    return {
      output: `File system error: ${err.message}`,
      executionTime: '0s',
      status: 'error'
    };
  } finally {
    // 3. Cleanup temp file regardless of success or failure
    try {
      await fs.unlink(filePath);
    } catch (cleanupErr) {
      console.error(`Failed to cleanup temp file ${filePath}:`, cleanupErr);
    }
  }
}
