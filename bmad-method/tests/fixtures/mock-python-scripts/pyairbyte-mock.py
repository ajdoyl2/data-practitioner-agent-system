#!/usr/bin/env python3
"""
Mock PyAirbyte connector for testing
Simulates PyAirbyte operations without requiring actual PyAirbyte installation
"""

import json
import sys
import time
import argparse
from typing import Dict, List, Any, Optional


class MockConnector:
    """
    Mock PyAirbyte connector that simulates data source operations
    """
    
    def __init__(self, source_type: str = 'file'):
        self.source_type = source_type
        self.connected = False
        self.cache_enabled = True
    
    def connect(self, config: Dict[str, Any]) -> Dict[str, str]:
        """
        Simulate connection to data source
        """
        # Simulate connection delay
        time.sleep(0.1)
        
        self.connected = True
        return {
            'status': 'connected',
            'source_type': self.source_type,
            'connection_id': f"{self.source_type}_conn_{int(time.time())}",
            'timestamp': time.time()
        }
    
    def list_streams(self) -> List[Dict[str, Any]]:
        """
        Simulate listing available data streams
        """
        if not self.connected:
            raise RuntimeError("Not connected to data source")
        
        # Mock stream definitions based on source type
        if self.source_type == 'database':
            streams = [
                {'name': 'users', 'namespace': 'public', 'json_schema': {'type': 'object'}},
                {'name': 'orders', 'namespace': 'public', 'json_schema': {'type': 'object'}},
                {'name': 'products', 'namespace': 'public', 'json_schema': {'type': 'object'}}
            ]
        elif self.source_type == 'api':
            streams = [
                {'name': 'customers', 'namespace': None, 'json_schema': {'type': 'object'}},
                {'name': 'transactions', 'namespace': None, 'json_schema': {'type': 'object'}}
            ]
        else:  # file
            streams = [
                {'name': 'data', 'namespace': None, 'json_schema': {'type': 'object'}}
            ]
        
        return streams
    
    def read_stream(self, stream_name: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Simulate reading data from a stream
        """
        if not self.connected:
            raise RuntimeError("Not connected to data source")
        
        # Generate mock data based on stream name
        if stream_name == 'users':
            data = [
                {'id': i, 'name': f'User {i}', 'email': f'user{i}@example.com', 'created_at': time.time() - i * 86400}
                for i in range(1, min(limit or 100, 100) + 1)
            ]
        elif stream_name == 'orders':
            data = [
                {'id': i, 'user_id': (i % 10) + 1, 'value': 10.0 + i, 'amount': 10.0 + i, 'status': 'completed', 'created_at': time.time() - i * 3600}
                for i in range(1, min(limit or 50, 50) + 1)
            ]
        elif stream_name == 'products':
            data = [
                {'id': i, 'name': f'Product {i}', 'price': 5.0 + i * 2, 'category': f'Category {i % 5}'}
                for i in range(1, min(limit or 20, 20) + 1)
            ]
        elif stream_name == 'customers':
            data = [
                {'customer_id': f'cust_{i}', 'company': f'Company {i}', 'industry': f'Industry {i % 3}'}
                for i in range(1, min(limit or 30, 30) + 1)
            ]
        elif stream_name == 'transactions':
            data = [
                {'transaction_id': f'txn_{i}', 'amount': 100.0 + i * 10, 'currency': 'USD', 'timestamp': time.time() - i * 1800}
                for i in range(1, min(limit or 40, 40) + 1)
            ]
        else:  # generic data
            data = [
                {'id': i, 'value': i * 10, 'category': f'cat_{i % 3}', 'timestamp': time.time() - i * 60}
                for i in range(1, min(limit or 25, 25) + 1)
            ]
        
        return data
    
    def get_cache_info(self) -> Dict[str, Any]:
        """
        Simulate cache information
        """
        return {
            'cache_enabled': self.cache_enabled,
            'cache_size_mb': 15.7,
            'cached_streams': ['users', 'orders'] if self.cache_enabled else [],
            'last_updated': time.time() - 3600  # 1 hour ago
        }
    
    def clear_cache(self) -> Dict[str, str]:
        """
        Simulate cache clearing
        """
        return {
            'status': 'cache_cleared',
            'timestamp': time.time()
        }


def main():
    parser = argparse.ArgumentParser(description='Mock PyAirbyte connector for testing')
    parser.add_argument('--source-type', choices=['file', 'database', 'api'], 
                       default='file', help='Type of data source to simulate')
    parser.add_argument('--operation', choices=['connect', 'list_streams', 'read_stream', 'cache_info', 'clear_cache'], 
                       required=True, help='Operation to perform')
    parser.add_argument('--stream-name', help='Stream name for read_stream operation')
    parser.add_argument('--limit', type=int, help='Limit number of records for read_stream')
    parser.add_argument('--config-file', help='Configuration file (JSON)')
    parser.add_argument('--error', choices=['connection', 'permission', 'timeout'], 
                       help='Simulate error condition')
    
    args = parser.parse_args()
    
    try:
        # Simulate errors if requested
        if args.error:
            if args.error == 'connection':
                raise ConnectionError("Failed to connect to data source: Connection refused")
            elif args.error == 'permission':
                raise PermissionError("Access denied: Invalid credentials")
            elif args.error == 'timeout':
                time.sleep(10)  # Simulate timeout
        
        # Read configuration
        config = {}
        if args.config_file:
            with open(args.config_file, 'r') as f:
                config = json.load(f)
        else:
            # Read config from stdin if available
            stdin_input = sys.stdin.read().strip()
            if stdin_input:
                config = json.loads(stdin_input)
        
        # Create mock connector
        connector = MockConnector(args.source_type)
        
        # Perform requested operation
        if args.operation == 'connect':
            result = connector.connect(config)
        elif args.operation == 'list_streams':
            connector.connect(config)  # Auto-connect
            result = {
                'streams': connector.list_streams(),
                'count': len(connector.list_streams())
            }
        elif args.operation == 'read_stream':
            if not args.stream_name:
                raise ValueError("--stream-name required for read_stream operation")
            connector.connect(config)  # Auto-connect
            data = connector.read_stream(args.stream_name, args.limit)
            result = {
                'stream_name': args.stream_name,
                'record_count': len(data),
                'data': data
            }
        elif args.operation == 'cache_info':
            connector.connect(config)  # Auto-connect
            result = connector.get_cache_info()
        elif args.operation == 'clear_cache':
            connector.connect(config)  # Auto-connect
            result = connector.clear_cache()
        else:
            raise ValueError(f"Unknown operation: {args.operation}")
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'error': True,
            'message': str(e),
            'type': type(e).__name__,
            'operation': args.operation,
            'timestamp': time.time()
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()