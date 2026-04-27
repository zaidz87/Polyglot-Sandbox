import express, { Request, Response } from 'express';
import { rateLimiter } from './rateLimiter';
import { executeCode } from './executor';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON requests
// This allows us to access req.body properties
app.use(express.json());

/**
 * Main code execution endpoint.
 * Protected by Redis IP-based rate limiting middleware.
 * Expects JSON payload: { "language": "python" | "nodejs", "code": "..." }
 */
app.post('/execute', rateLimiter, async (req: Request, res: Response) => {
  try {
    const { language, code } = req.body;

    // Validate the input fields
    if (!language || !code) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing language or code in request body' 
      });
    }

    // Support only Python and Node.js according to specifications
    if (language !== 'python' && language !== 'nodejs') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Unsupported language. Allowed: python, nodejs' 
      });
    }

    // Execute the code using the Docker executor
    // executeCode will write the file to /tmp, run Docker, and return the output/time
    const result = await executeCode(language, code);
    
    // Return standard response payload
    res.json(result);
  } catch (error: any) {
    // Top-level error boundary to catch any unexpected system failures
    console.error('Execution Endpoint Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error during execution' 
    });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`[Server] Polyglot API listening on port ${PORT}`);
});
