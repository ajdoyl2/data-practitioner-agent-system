#!/usr/bin/env python3
"""
SQLmesh Bridge Script
Python subprocess wrapper for SQLmesh command execution with JSON communication.
"""

import json
import sys
import subprocess
import os
from pathlib import Path
from typing import Dict, Any, List, Optional

class SQLmeshBridge:
    """Bridge for executing SQLmesh commands and returning JSON responses."""
    
    def __init__(self, project_path: str = None):
        """Initialize SQLmesh bridge with project path."""
        self.project_path = project_path or os.environ.get('SQLMESH_PROJECT_PATH', './sqlmesh-project')
        self.validate_installation()
    
    def validate_installation(self) -> bool:
        """Validate SQLmesh is installed and available."""
        try:
            result = subprocess.run(
                ['sqlmesh', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            self.output_error(f"SQLmesh not found or not installed: {str(e)}")
            return False
    
    def execute_command(self, command: str, args: List[str] = None, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute SQLmesh command and return structured response."""
        try:
            # Build command
            cmd = ['sqlmesh', command]
            
            # Add project path
            cmd.extend(['--paths', self.project_path])
            
            # Add additional arguments
            if args:
                cmd.extend(args)
            
            # Add options as flags
            if options:
                for key, value in options.items():
                    if value is True:
                        cmd.append(f'--{key}')
                    elif value is not False and value is not None:
                        cmd.extend([f'--{key}', str(value)])
            
            # Execute command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout for long operations
                cwd=self.project_path
            )
            
            return {
                'success': result.returncode == 0,
                'command': ' '.join(cmd),
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
            
        except subprocess.TimeoutExpired as e:
            return {
                'success': False,
                'command': ' '.join(cmd),
                'error': 'Command timeout exceeded',
                'timeout': True
            }
        except Exception as e:
            return {
                'success': False,
                'command': command,
                'error': str(e)
            }
    
    def init_project(self, config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Initialize SQLmesh project with configuration."""
        # Create project directory if it doesn't exist
        Path(self.project_path).mkdir(parents=True, exist_ok=True)
        
        # Execute init command
        result = self.execute_command('init', options={'duckdb': True})
        
        # Create custom config if provided
        if config and result['success']:
            config_path = Path(self.project_path) / 'config.yaml'
            # Config will be written by JavaScript wrapper
            result['config_path'] = str(config_path)
        
        return result
    
    def plan(self, environment: str = None, auto_apply: bool = False) -> Dict[str, Any]:
        """Create execution plan for models."""
        options = {}
        if environment:
            options['environment'] = environment
        if auto_apply:
            options['auto-apply'] = True
        
        return self.execute_command('plan', options=options)
    
    def run(self, environment: str = None, model: str = None) -> Dict[str, Any]:
        """Run SQLmesh models."""
        args = []
        if model:
            args.append(model)
        
        options = {}
        if environment:
            options['environment'] = environment
        
        return self.execute_command('run', args=args, options=options)
    
    def test(self, model: str = None) -> Dict[str, Any]:
        """Run SQLmesh tests."""
        args = []
        if model:
            args.append(model)
        
        return self.execute_command('test', args=args)
    
    def audit(self, model: str = None) -> Dict[str, Any]:
        """Run SQLmesh audits."""
        args = []
        if model:
            args.append(model)
        
        return self.execute_command('audit', args=args)
    
    def migrate(self, environment: str = 'prod') -> Dict[str, Any]:
        """Execute blue-green deployment migration."""
        return self.execute_command('migrate', options={'environment': environment})
    
    def diff(self, environment: str = None) -> Dict[str, Any]:
        """Show differences between environments."""
        options = {}
        if environment:
            options['environment'] = environment
        
        return self.execute_command('diff', options=options)
    
    def output_error(self, message: str):
        """Output error in JSON format."""
        print(json.dumps({'success': False, 'error': message}))
        sys.exit(1)
    
    def output_success(self, data: Any):
        """Output success response in JSON format."""
        print(json.dumps({'success': True, 'data': data}))
        sys.exit(0)


def main():
    """Main entry point for bridge script."""
    # Parse command line arguments as JSON
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No command provided'}))
        sys.exit(1)
    
    try:
        # Parse JSON input
        input_data = json.loads(sys.argv[1])
        command = input_data.get('command')
        args = input_data.get('args', [])
        options = input_data.get('options', {})
        project_path = input_data.get('project_path')
        
        # Initialize bridge
        bridge = SQLmeshBridge(project_path)
        
        # Execute command based on type
        if command == 'init':
            result = bridge.init_project(options.get('config'))
        elif command == 'plan':
            result = bridge.plan(options.get('environment'), options.get('auto_apply', False))
        elif command == 'run':
            result = bridge.run(options.get('environment'), args[0] if args else None)
        elif command == 'test':
            result = bridge.test(args[0] if args else None)
        elif command == 'audit':
            result = bridge.audit(args[0] if args else None)
        elif command == 'migrate':
            result = bridge.migrate(options.get('environment', 'prod'))
        elif command == 'diff':
            result = bridge.diff(options.get('environment'))
        else:
            # Generic command execution
            result = bridge.execute_command(command, args, options)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({'success': False, 'error': f'Invalid JSON input: {str(e)}'}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()