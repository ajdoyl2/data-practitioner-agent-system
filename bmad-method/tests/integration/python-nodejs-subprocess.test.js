/**
 * Python/Node.js Subprocess Communication Test Suite
 * Tests the integration between Node.js and Python components
 */

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const PythonSubprocessManager = require('../../tools/lib/python-subprocess');

describe('Python/Node.js Subprocess Communication', () => {
  let pythonManager;
  let tempDir;

  beforeAll(async () => {
    pythonManager = new PythonSubprocessManager({
      timeout: 10000 // 10 seconds for tests
    });
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bmad-test-'));
  });

  afterAll(async () => {
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('Basic Subprocess Execution', () => {
    test('should execute simple Python code and return result', async () => {
      const code = `
import json
result = {"status": "success", "message": "Hello from Python"}
print(json.dumps(result))
`;
      
      const result = await pythonManager.executeCode(code, { parseJson: true });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        status: 'success',
        message: 'Hello from Python'
      });
      expect(result.duration).toBeGreaterThan(0);
    });

    test('should handle Python script execution with arguments', async () => {
      const scriptPath = path.join(tempDir, 'test_script.py');
      const scriptContent = `
import sys
import json

args = sys.argv[1:]
result = {
    "args_count": len(args),
    "args": args,
    "python_version": sys.version_info[:2]
}
print(json.dumps(result))
`;
      
      await fs.writeFile(scriptPath, scriptContent);
      
      const result = await pythonManager.execute(scriptPath, ['arg1', 'arg2', 'arg3'], {
        parseJson: true
      });
      
      expect(result.success).toBe(true);
      expect(result.data.args_count).toBe(3);
      expect(result.data.args).toEqual(['arg1', 'arg2', 'arg3']);
    });

    test('should handle Python execution with stdin input', async () => {
      const code = `
import json
import sys

# Read input from stdin
try:
    input_data = json.loads(sys.stdin.read())
    result = {
        "received": input_data,
        "processed": input_data.get("value", 0) * 2
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
      
      const inputData = { value: 42, message: "test input" };
      
      const result = await pythonManager.executeCode(code, {
        parseJson: true,
        input: inputData
      });
      
      expect(result.success).toBe(true);
      expect(result.data.received).toEqual(inputData);
      expect(result.data.processed).toBe(84);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle Python syntax errors gracefully', async () => {
      const code = `
# Invalid Python syntax
invalid syntax here
`;
      
      await expect(pythonManager.executeCode(code)).rejects.toThrow();
    });

    test('should handle Python runtime errors with proper error translation', async () => {
      const code = `
import json
# This will cause a runtime error
result = 1 / 0
print(json.dumps({"result": result}))
`;
      
      await expect(pythonManager.executeCode(code)).rejects.toThrow();
    });

    test('should handle timeout for long-running processes', async () => {
      const code = `
import time
import json
# Sleep for longer than timeout
time.sleep(15)
print(json.dumps({"status": "completed"}))
`;
      
      await expect(pythonManager.executeCode(code, { timeout: 2000 })).rejects.toThrow(/timed out|SIGTERM/);
    }, 5000);

    test('should handle missing Python script files', async () => {
      const nonExistentScript = path.join(tempDir, 'does_not_exist.py');
      
      await expect(pythonManager.execute(nonExistentScript)).rejects.toThrow(/not found/);
    });

    test('should handle JSON parsing errors in output', async () => {
      const code = `
# Output invalid JSON
print("This is not JSON")
`;
      
      const result = await pythonManager.executeCode(code, { parseJson: false });
      expect(result.success).toBe(true);
      expect(result.data).toBe('This is not JSON\n');
      
      // Test with parseJson: true should fail
      await expect(pythonManager.executeCode(code, { parseJson: true })).rejects.toThrow(/parse/);
    });
  });

  describe('Process Management and Cleanup', () => {
    test('should properly cleanup temporary files', async () => {
      const initialTempFiles = await fs.readdir(os.tmpdir());
      const tempFilesBefore = initialTempFiles.filter(f => f.startsWith('bmad-temp-')).length;
      
      await pythonManager.executeCode(`print("test")`);
      
      // Give some time for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalTempFiles = await fs.readdir(os.tmpdir());
      const tempFilesAfter = finalTempFiles.filter(f => f.startsWith('bmad-temp-')).length;
      
      expect(tempFilesAfter).toBe(tempFilesBefore);
    });

    test('should handle multiple concurrent Python executions', async () => {
      const executions = Array.from({ length: 5 }, (_, i) => 
        pythonManager.executeCode(`
import json
import time
import random

# Add small random delay to simulate real work
time.sleep(random.uniform(0.1, 0.3))

result = {"execution_id": ${i}, "status": "completed"}
print(json.dumps(result))
`, { parseJson: true })
      );
      
      const results = await Promise.all(executions);
      
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data.execution_id).toBe(index);
        expect(result.data.status).toBe('completed');
      });
    });

    test('should handle process memory limits', async () => {
      // Test that subprocess manager respects memory constraints
      const code = `
import json
# Try to allocate a moderate amount of memory
data = [i for i in range(100000)]  # Should be manageable
result = {"length": len(data), "status": "completed"}
print(json.dumps(result))
`;
      
      const result = await pythonManager.executeCode(code, { parseJson: true });
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(100000);
    });
  });

  describe('Python Environment Validation', () => {
    test('should detect Python availability and version', async () => {
      const availability = await pythonManager.checkAvailability();
      
      expect(availability.available).toBe(true);
      expect(availability.python_version).toBeDefined();
      expect(availability.executable).toBeDefined();
      expect(availability.packages).toBeDefined();
    });

    test('should provide package availability information', async () => {
      const availability = await pythonManager.checkAvailability();
      
      // Check for expected packages (some may not be installed yet)
      expect(typeof availability.packages.pandas).toBe('boolean');
      expect(typeof availability.packages.numpy).toBe('boolean');
      expect(typeof availability.packages.sqlalchemy).toBe('boolean');
    });

    test('should handle Python executable detection', async () => {
      const originalExecutable = pythonManager.pythonExecutable;
      
      // Test with default detection
      const detectedExecutable = pythonManager.detectPythonExecutable();
      expect(detectedExecutable).toBeDefined();
      expect(typeof detectedExecutable).toBe('string');
      
      // Restore original
      pythonManager.pythonExecutable = originalExecutable;
    });
  });

  describe('Data Exchange Formats', () => {
    test('should handle complex nested JSON data structures', async () => {
      const complexData = {
        nested: {
          array: [1, 2, 3, { key: 'value' }],
          object: {
            boolean: true,
            null_value: null,
            number: 42.5
          }
        },
        list: ['string', 123, true, null]
      };
      
      const code = `
import json
import sys

input_data = json.loads(sys.stdin.read())
# Echo back the data with some modifications
output_data = {
    "received": input_data,
    "modifications": {
        "array_length": len(input_data["nested"]["array"]),
        "list_length": len(input_data["list"]),
        "has_nested": "nested" in input_data
    }
}
print(json.dumps(output_data))
`;
      
      const result = await pythonManager.executeCode(code, {
        parseJson: true,
        input: complexData
      });
      
      expect(result.success).toBe(true);
      expect(result.data.received).toEqual(complexData);
      expect(result.data.modifications.array_length).toBe(4);
      expect(result.data.modifications.list_length).toBe(4);
      expect(result.data.modifications.has_nested).toBe(true);
    });

    test('should handle large data payloads', async () => {
      // Create a reasonably large dataset
      const largeData = {
        records: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `record_${i}`,
          data: Array.from({ length: 10 }, (_, j) => `value_${i}_${j}`)
        }))
      };
      
      const code = `
import json
import sys

input_data = json.loads(sys.stdin.read())
result = {
    "record_count": len(input_data["records"]),
    "total_data_items": sum(len(record["data"]) for record in input_data["records"]),
    "first_record_id": input_data["records"][0]["id"],
    "last_record_id": input_data["records"][-1]["id"]
}
print(json.dumps(result))
`;
      
      const result = await pythonManager.executeCode(code, {
        parseJson: true,
        input: largeData,
        timeout: 15000 // Increase timeout for large data
      });
      
      expect(result.success).toBe(true);
      expect(result.data.record_count).toBe(1000);
      expect(result.data.total_data_items).toBe(10000);
      expect(result.data.first_record_id).toBe(0);
      expect(result.data.last_record_id).toBe(999);
    });

    test('should handle Unicode and special characters', async () => {
      const unicodeData = {
        text: 'Hello 世界! 🌍 Café naïve résumé',
        symbols: '©®™€£¥§¶†‡•…‰\u2032\u2033\u2039\u203a\u00ab\u00bb\u201c\u201d\u2018\u2019\u2014\u2013\u2015',
        emoji: '😀😎🎉🚀💡🔥❤️🌟⭐🎯'
      };
      
      const code = `
import json
import sys

input_data = json.loads(sys.stdin.read())
result = {
    "text_length": len(input_data["text"]),
    "symbols_length": len(input_data["symbols"]),
    "emoji_length": len(input_data["emoji"]),
    "echo": input_data
}
print(json.dumps(result, ensure_ascii=False))
`;
      
      const result = await pythonManager.executeCode(code, {
        parseJson: true,
        input: unicodeData
      });
      
      expect(result.success).toBe(true);
      expect(result.data.echo).toEqual(unicodeData);
      expect(result.data.text_length).toBeGreaterThan(0);
      expect(result.data.symbols_length).toBeGreaterThan(0);
      expect(result.data.emoji_length).toBeGreaterThan(0);
    });
  });
});