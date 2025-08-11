// Cross-Language Integration Test Suite
const { spawn } = require('child_process');
const path = require('path');

describe('Python-Node.js Integration', () => {
  const pythonPath = path.join('.venv', 'bin', 'python');
  
  function callPython(script, input) {
    return new Promise((resolve, reject) => {
      const proc = spawn(pythonPath, [script]);
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => stdout += data);
      proc.stderr.on('data', (data) => stderr += data);
      
      if (input) {
        proc.stdin.write(JSON.stringify(input));
        proc.stdin.end();
      }
      
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Exit ${code}: ${stderr}`));
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            resolve(stdout);
          }
        }
      });
    });
  }
  
  test('JSON communication', async () => {
    const input = { test: 'data', number: 42 };
    const result = await callPython('test-scripts/echo.py', input);
    
    expect(result).toHaveProperty('success', true);
    expect(result.data).toEqual(input);
  });
  
  test('Error handling', async () => {
    const input = { error: true };
    
    await expect(
      callPython('test-scripts/error.py', input)
    ).rejects.toThrow();
  });
  
  test('Large data handling', async () => {
    const largeData = { 
      items: Array(1000).fill({ data: 'test' }) 
    };
    
    const result = await callPython('test-scripts/echo.py', largeData);
    expect(result.data.items).toHaveLength(1000);
  });
  
  test('Unicode support', async () => {
    const input = { 
      text: '你好 🚀', 
      emoji: '🎉' 
    };
    
    const result = await callPython('test-scripts/echo.py', input);
    expect(result.data).toEqual(input);
  });
  
  test('Performance benchmark', async () => {
    const start = Date.now();
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(callPython('test-scripts/echo.py', { i }));
    }
    
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // 5 seconds for 10 calls
  });
});