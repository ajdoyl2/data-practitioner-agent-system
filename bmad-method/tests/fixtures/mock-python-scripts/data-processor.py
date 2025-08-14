#!/usr/bin/env python3
"""
Mock data processor script for testing Python/Node.js integration
Simulates data processing operations that would be used in the data practitioner expansion pack
"""

import json
import sys
import time
import argparse
from typing import Dict, List, Any


def process_data(data: Dict[str, Any], operation: str = 'transform') -> Dict[str, Any]:
    """
    Mock data processing function
    """
    if operation == 'transform':
        return {
            'original_data': data,
            'transformed': {
                'record_count': len(data.get('records', [])),
                'timestamp': time.time(),
                'operation': operation
            }
        }
    elif operation == 'validate':
        return {
            'valid': True,
            'validation_results': {
                'schema_valid': True,
                'data_quality_score': 0.95,
                'missing_fields': [],
                'timestamp': time.time()
            }
        }
    elif operation == 'aggregate':
        records = data.get('records', [])
        return {
            'aggregation': {
                'total_records': len(records),
                'numeric_sum': sum(r.get('value', 0) for r in records if isinstance(r.get('value'), (int, float))),
                'categories': list(set(r.get('category') for r in records if r.get('category'))),
                'timestamp': time.time()
            }
        }
    else:
        raise ValueError(f"Unknown operation: {operation}")


def simulate_error(error_type: str):
    """
    Simulate different types of errors for testing error handling
    """
    if error_type == 'runtime':
        raise RuntimeError("Simulated runtime error for testing")
    elif error_type == 'value':
        raise ValueError("Simulated value error for testing")
    elif error_type == 'timeout':
        time.sleep(30)  # Simulate long-running operation
    elif error_type == 'memory':
        # Simulate memory-intensive operation (but controlled)
        data = [i for i in range(10000)]
        return {"memory_test": len(data)}
    else:
        raise Exception(f"Unknown error type: {error_type}")


def main():
    parser = argparse.ArgumentParser(description='Mock data processor for testing')
    parser.add_argument('--operation', choices=['transform', 'validate', 'aggregate'], 
                       default='transform', help='Operation to perform')
    parser.add_argument('--error', choices=['runtime', 'value', 'timeout', 'memory'], 
                       help='Simulate error condition')
    parser.add_argument('--input-file', help='Read input from file instead of stdin')
    parser.add_argument('--delay', type=float, default=0, help='Add processing delay in seconds')
    
    args = parser.parse_args()
    
    try:
        # Add processing delay if specified
        if args.delay > 0:
            time.sleep(args.delay)
        
        # Simulate error if requested
        if args.error:
            result = simulate_error(args.error)
            if result:  # Some errors return data (like memory test)
                print(json.dumps(result))
            return
        
        # Read input data
        if args.input_file:
            with open(args.input_file, 'r') as f:
                input_data = json.load(f)
        else:
            # Read from stdin
            input_text = sys.stdin.read().strip()
            if input_text:
                input_data = json.loads(input_text)
            else:
                input_data = {'records': []}
        
        # Process data
        result = process_data(input_data, args.operation)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': True,
            'message': str(e),
            'type': type(e).__name__,
            'timestamp': time.time()
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()