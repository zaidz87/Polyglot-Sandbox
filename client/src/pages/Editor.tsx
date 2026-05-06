import { useState, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Language definitions ─────────────────────────────────────────────────────
interface LangDef {
  id: string;
  label: string;
  monacoLang: string;
  icon: string;
  starter: string;
}

const LANGUAGES: LangDef[] = [
  {
    id: 'python', label: 'Python', monacoLang: 'python', icon: '🐍',
    starter: `# Python — Polyglot Sandbox
print("Hello from Python!")

numbers = [1, 2, 3, 4, 5]
print(f"Sum: {sum(numbers)}")
print(f"Squares: {[x**2 for x in numbers]}")
`,
  },
  {
    id: 'nodejs', label: 'Node.js', monacoLang: 'javascript', icon: '⬡',
    starter: `// Node.js — Polyglot Sandbox
console.log("Hello from Node.js!");

const numbers = [1, 2, 3, 4, 5];
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));
console.log("Squares:", numbers.map(x => x ** 2));
`,
  },
  {
    id: 'java', label: 'Java', monacoLang: 'java', icon: '☕',
    starter: `// Java — entry class MUST be named 'Main'
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");

        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int n : numbers) sum += n;
        System.out.println("Sum: " + sum);
    }
}
`,
  },
  {
    id: 'go', label: 'Go', monacoLang: 'go', icon: '🐹',
    starter: `// Go — Polyglot Sandbox
package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")

    numbers := []int{1, 2, 3, 4, 5}
    sum := 0
    for _, n := range numbers {
        sum += n
    }
    fmt.Printf("Sum: %d\\n", sum)
}
`,
  },
  {
    id: 'cpp', label: 'C++', monacoLang: 'cpp', icon: '⚙️',
    starter: `// C++ — Polyglot Sandbox
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from C++!" << std::endl;

    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Sum: " << sum << std::endl;

    return 0;
}
`,
  },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface ExecResult {
  output: string;
  executionTime: string;
  status: 'success' | 'error';
}

export default function Editor() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeLang, setActiveLang] = useState<LangDef>(LANGUAGES[0]);
  const [code, setCode] = useState<string>(LANGUAGES[0].starter);
  const [result, setResult] = useState<ExecResult | null>(null);
  const [running, setRunning] = useState(false);

  // When user picks a new language — switch Monaco lang + load starter code
  const switchLang = useCallback((lang: LangDef) => {
    setActiveLang(lang);
    setCode(lang.starter);
    setResult(null);
  }, []);

  const runCode = async () => {
    if (!token || running) return;
    setRunning(true);
    setResult(null);
    try {
      const { data } = await axios.post<ExecResult>(
        '/execute',
        { language: activeLang.id, code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Request failed';
      setResult({ output: msg, executionTime: '0s', status: 'error' });
    } finally {
      setRunning(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="editor-layout">

      {/* ── LEFT SIDEBAR — language selector ───────────────── */}
      <aside className="editor-sidebar">
        {/* Logo mark */}
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#7effa0,#5b8fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0a0a0f', marginBottom: 16 }}>
          ⬡
        </div>
        <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />

        {LANGUAGES.map(lang => (
          <button
            key={lang.id}
            className={`sidebar-lang-btn ${activeLang.id === lang.id ? 'active' : ''}`}
            onClick={() => switchLang(lang)}
            title={lang.label}
          >
            <span style={{ fontSize: 20 }}>{lang.icon}</span>
            <span className="lang-label">{lang.label.toUpperCase().slice(0, 3)}</span>
          </button>
        ))}
      </aside>

      {/* ── MAIN AREA ───────────────────────────────────────── */}
      <div className="editor-main">

        {/* Top bar */}
        <div className="editor-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Breadcrumb */}
            <span style={{ fontSize: 13, color: '#5a5a7a' }}>polyglot-sandbox</span>
            <span style={{ color: '#3a3a5a' }}>/</span>
            <span style={{ fontSize: 13, color: '#7a7a9a', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{activeLang.icon}</span> {activeLang.label}
            </span>
            {/* Status dot */}
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: running ? '#ff6b9d' : '#7effa0', boxShadow: `0 0 8px ${running ? '#ff6b9d' : '#7effa0'}`, display: 'inline-block', marginLeft: 4 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user && <span style={{ fontSize: 12, color: '#5a5a7a' }}>{user.email}</span>}
            <button className="btn-run" onClick={runCode} disabled={running}>
              {running ? (
                <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Running...</>
              ) : (
                <>▶ Run</>
              )}
            </button>
            <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 12, padding: '6px 14px' }}>
              Log Out
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="editor-center">
          <MonacoEditor
            height="100%"
            language={activeLang.monacoLang}
            value={code}
            onChange={(val) => setCode(val ?? '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderLineHighlight: 'gutter',
              padding: { top: 16, bottom: 16 },
              smoothScrolling: true,
              cursorBlinking: 'phase',
              tabSize: 4,
              wordWrap: 'off',
            }}
          />
        </div>

        {/* Output panel */}
        <div className="output-panel">
          <div className="output-panel-header">
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: result ? (result.status === 'success' ? '#7effa0' : '#ff6b9d') : '#3a3a5a', display: 'inline-block' }} />
            Output
            {result && (
              <>
                <span style={{ marginLeft: 'auto', color: '#3a3a5a' }}>|</span>
                <span style={{ color: result.status === 'success' ? '#7effa0' : '#ff6b9d' }}>
                  {result.status.toUpperCase()}
                </span>
                <span style={{ color: '#3a3a5a' }}>·</span>
                <span style={{ color: '#5b8fff' }}>{result.executionTime}</span>
              </>
            )}
          </div>

          <div className="output-content">
            {!result && !running && (
              <span style={{ color: '#3a3a5a' }}>
                Press <span style={{ color: '#7effa0', fontWeight: 600 }}>▶ Run</span> to execute your code...
              </span>
            )}
            {running && (
              <span style={{ color: '#5b8fff' }}>⟳ Executing in Docker sandbox...</span>
            )}
            {result && (
              <pre style={{
                color: result.status === 'success' ? '#7effa0' : '#ff6b9d',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
              }}>
                {result.output || '(no output)'}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* spin keyframe via style tag */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
