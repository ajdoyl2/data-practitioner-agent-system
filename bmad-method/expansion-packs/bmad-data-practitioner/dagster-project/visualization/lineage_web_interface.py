"""
Web Interface for Asset Lineage Visualization
Provides REST API endpoints for interactive lineage exploration
"""

from flask import Flask, jsonify, request, render_template_string, send_file
import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import tempfile
from lineage_visualizer import LineageVisualizer

class LineageWebInterface:
    """Web interface for asset lineage visualization"""
    
    def __init__(self, port: int = 5000, host: str = '0.0.0.0'):
        self.app = Flask(__name__)
        self.port = port
        self.host = host
        self.visualizer = LineageVisualizer()
        self.setup_routes()
        
        # Store for assets data (would typically come from database)
        self.assets_cache = {}
    
    def setup_routes(self):
        """Setup Flask routes for the web interface"""
        
        @self.app.route('/health')
        def health_check():
            """Health check endpoint"""
            return jsonify({
                'status': 'healthy',
                'service': 'lineage-web-interface',
                'version': '1.0.0'
            })
        
        @self.app.route('/')
        def index():
            """Main lineage exploration interface"""
            return render_template_string(self.get_index_template())
        
        @self.app.route('/api/assets')
        def list_assets():
            """List all available assets"""
            try:
                assets = list(self.assets_cache.values()) if self.assets_cache else []
                
                return jsonify({
                    'success': True,
                    'data': {
                        'assets': assets,
                        'total': len(assets)
                    }
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
        
        @self.app.route('/api/assets/<asset_key>/lineage')
        def get_asset_lineage(asset_key):
            """Get lineage for specific asset"""
            try:
                if not self.assets_cache:
                    return jsonify({
                        'success': False,
                        'error': 'No assets loaded'
                    }), 404
                
                # Find the asset
                asset = self.assets_cache.get(asset_key)
                if not asset:
                    return jsonify({
                        'success': False,
                        'error': f'Asset {asset_key} not found'
                    }), 404
                
                # Generate lineage data
                assets_list = list(self.assets_cache.values())
                lineage_summary = self.visualizer.generate_lineage_summary(assets_list)
                
                # Generate focused visualization
                viz_path = self.visualizer.generate_lineage_visualization(
                    assets_list, focus_asset=asset_key
                )
                
                return jsonify({
                    'success': True,
                    'data': {
                        'asset_key': asset_key,
                        'lineage_summary': lineage_summary,
                        'visualization_path': viz_path,
                        'upstream_count': len(asset.get('dependencies', [])),
                        'downstream_count': self._count_downstream_dependencies(asset_key, assets_list)
                    }
                })
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
        
        @self.app.route('/api/lineage/visualization')
        def generate_lineage_visualization():
            """Generate lineage visualization"""
            try:
                focus_asset = request.args.get('focus_asset')
                output_format = request.args.get('format', 'png')
                
                if not self.assets_cache:
                    return jsonify({
                        'success': False,
                        'error': 'No assets loaded'
                    }), 404
                
                assets_list = list(self.assets_cache.values())
                
                viz_path = self.visualizer.generate_lineage_visualization(
                    assets_list, 
                    focus_asset=focus_asset,
                    output_format=output_format
                )
                
                return jsonify({
                    'success': True,
                    'data': {
                        'visualization_path': viz_path,
                        'focus_asset': focus_asset,
                        'format': output_format
                    }
                })
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
        
        @self.app.route('/api/lineage/report')
        def generate_lineage_report():
            """Generate comprehensive lineage report"""
            try:
                output_format = request.args.get('format', 'html')
                
                if not self.assets_cache:
                    return jsonify({
                        'success': False,
                        'error': 'No assets loaded'
                    }), 404
                
                assets_list = list(self.assets_cache.values())
                
                report_path = self.visualizer.generate_lineage_report(
                    assets_list, output_format=output_format
                )
                
                return jsonify({
                    'success': True,
                    'data': {
                        'report_path': report_path,
                        'format': output_format,
                        'download_url': f'/download/report/{os.path.basename(report_path)}'
                    }
                })
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
        
        @self.app.route('/api/lineage/summary')
        def get_lineage_summary():
            """Get overall lineage summary statistics"""
            try:
                if not self.assets_cache:
                    return jsonify({
                        'success': False,
                        'error': 'No assets loaded'
                    }), 404
                
                assets_list = list(self.assets_cache.values())
                summary = self.visualizer.generate_lineage_summary(assets_list)
                
                return jsonify({
                    'success': True,
                    'data': summary
                })
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
        
        @self.app.route('/api/assets/load', methods=['POST'])
        def load_assets():
            """Load assets data from request"""
            try:
                data = request.get_json()
                
                if not data or 'assets' not in data:
                    return jsonify({
                        'success': False,
                        'error': 'Invalid request: assets data required'
                    }), 400
                
                # Clear existing cache and load new assets
                self.assets_cache.clear()
                
                for asset in data['assets']:
                    asset_key = asset.get('name', asset.get('asset_key', 'unknown'))
                    self.assets_cache[asset_key] = asset
                
                return jsonify({
                    'success': True,
                    'data': {
                        'loaded_assets': len(self.assets_cache),
                        'message': f'Successfully loaded {len(self.assets_cache)} assets'
                    }
                })
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
        
        @self.app.route('/download/report/<filename>')
        def download_report(filename):
            """Download generated report"""
            try:
                file_path = self.visualizer.output_dir / filename
                if file_path.exists():
                    return send_file(str(file_path), as_attachment=True)
                else:
                    return jsonify({
                        'success': False,
                        'error': 'File not found'
                    }), 404
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
        
        @self.app.route('/download/visualization/<filename>')
        def download_visualization(filename):
            """Download generated visualization"""
            try:
                file_path = self.visualizer.output_dir / filename
                if file_path.exists():
                    return send_file(str(file_path), as_attachment=True)
                else:
                    return jsonify({
                        'success': False,
                        'error': 'File not found'
                    }), 404
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
    
    def _count_downstream_dependencies(self, asset_key: str, assets_list: List[Dict[str, Any]]) -> int:
        """Count downstream dependencies for an asset"""
        count = 0
        for asset in assets_list:
            dependencies = asset.get('dependencies', [])
            if asset_key in dependencies:
                count += 1
        return count
    
    def get_index_template(self) -> str:
        """Get HTML template for the main interface"""
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Asset Lineage Explorer</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .section {
                    margin: 20px 0;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: #fafafa;
                }
                button {
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 5px;
                }
                button:hover {
                    background-color: #45a049;
                }
                input[type="text"] {
                    padding: 8px;
                    margin: 5px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    width: 200px;
                }
                .result {
                    margin-top: 15px;
                    padding: 10px;
                    background-color: #e8f5e8;
                    border-radius: 4px;
                    border-left: 4px solid #4CAF50;
                }
                .error {
                    background-color: #ffe8e8;
                    border-left: 4px solid #f44336;
                }
                .loading {
                    background-color: #e8f4fd;
                    border-left: 4px solid #2196F3;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 15px 0;
                }
                .stat-card {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #667eea;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔗 Asset Lineage Explorer</h1>
                    <p>Interactive exploration of data asset dependencies and lineage</p>
                </div>
                
                <div class="section">
                    <h2>📊 Lineage Summary</h2>
                    <button onclick="loadSummary()">Load Summary</button>
                    <div id="summaryResult"></div>
                </div>
                
                <div class="section">
                    <h2>🔍 Asset Explorer</h2>
                    <button onclick="loadAssets()">List All Assets</button>
                    <div id="assetsResult"></div>
                </div>
                
                <div class="section">
                    <h2>🎯 Focused Lineage</h2>
                    <input type="text" id="focusAsset" placeholder="Enter asset name">
                    <button onclick="getFocusedLineage()">Get Lineage</button>
                    <div id="lineageResult"></div>
                </div>
                
                <div class="section">
                    <h2>📈 Generate Visualization</h2>
                    <input type="text" id="vizFocusAsset" placeholder="Focus asset (optional)">
                    <select id="vizFormat">
                        <option value="png">PNG</option>
                        <option value="svg">SVG</option>
                        <option value="pdf">PDF</option>
                    </select>
                    <button onclick="generateVisualization()">Generate</button>
                    <div id="vizResult"></div>
                </div>
                
                <div class="section">
                    <h2>📋 Generate Report</h2>
                    <select id="reportFormat">
                        <option value="html">HTML Report</option>
                        <option value="json">JSON Report</option>
                    </select>
                    <button onclick="generateReport()">Generate Report</button>
                    <div id="reportResult"></div>
                </div>
            </div>
            
            <script>
                async function makeRequest(url, options = {}) {
                    try {
                        const response = await fetch(url, options);
                        const data = await response.json();
                        return data;
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
                
                function showResult(elementId, result, isLoading = false) {
                    const element = document.getElementById(elementId);
                    
                    if (isLoading) {
                        element.innerHTML = '<div class="result loading">Loading...</div>';
                        return;
                    }
                    
                    if (result.success) {
                        element.innerHTML = `<div class="result"><pre>${JSON.stringify(result.data, null, 2)}</pre></div>`;
                    } else {
                        element.innerHTML = `<div class="result error">Error: ${result.error}</div>`;
                    }
                }
                
                function showSummaryStats(elementId, summary) {
                    const element = document.getElementById(elementId);
                    
                    const statsHtml = `
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-number">${summary.total_assets}</div>
                                <div>Total Assets</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${summary.total_dependencies}</div>
                                <div>Dependencies</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${summary.lineage_depth}</div>
                                <div>Lineage Depth</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${summary.isolated_assets}</div>
                                <div>Isolated Assets</div>
                            </div>
                        </div>
                        <details>
                            <summary>Full Summary Details</summary>
                            <pre>${JSON.stringify(summary, null, 2)}</pre>
                        </details>
                    `;
                    
                    element.innerHTML = `<div class="result">${statsHtml}</div>`;
                }
                
                async function loadSummary() {
                    showResult('summaryResult', {}, true);
                    const result = await makeRequest('/api/lineage/summary');
                    
                    if (result.success) {
                        showSummaryStats('summaryResult', result.data);
                    } else {
                        showResult('summaryResult', result);
                    }
                }
                
                async function loadAssets() {
                    showResult('assetsResult', {}, true);
                    const result = await makeRequest('/api/assets');
                    showResult('assetsResult', result);
                }
                
                async function getFocusedLineage() {
                    const assetKey = document.getElementById('focusAsset').value;
                    if (!assetKey) {
                        alert('Please enter an asset name');
                        return;
                    }
                    
                    showResult('lineageResult', {}, true);
                    const result = await makeRequest(`/api/assets/${encodeURIComponent(assetKey)}/lineage`);
                    showResult('lineageResult', result);
                }
                
                async function generateVisualization() {
                    const focusAsset = document.getElementById('vizFocusAsset').value;
                    const format = document.getElementById('vizFormat').value;
                    
                    let url = `/api/lineage/visualization?format=${format}`;
                    if (focusAsset) {
                        url += `&focus_asset=${encodeURIComponent(focusAsset)}`;
                    }
                    
                    showResult('vizResult', {}, true);
                    const result = await makeRequest(url);
                    showResult('vizResult', result);
                }
                
                async function generateReport() {
                    const format = document.getElementById('reportFormat').value;
                    
                    showResult('reportResult', {}, true);
                    const result = await makeRequest(`/api/lineage/report?format=${format}`);
                    
                    if (result.success && result.data.download_url) {
                        const downloadLink = `<a href="${result.data.download_url}" target="_blank">Download Report</a>`;
                        result.data.download_link = downloadLink;
                    }
                    
                    showResult('reportResult', result);
                }
                
                // Load summary on page load
                window.onload = function() {
                    // Note: In a real implementation, assets would be loaded from the actual system
                    console.log('Asset Lineage Explorer loaded');
                };
            </script>
        </body>
        </html>
        '''
    
    def start(self):
        """Start the web interface"""
        print(f"🚀 Starting Asset Lineage Web Interface on {self.host}:{self.port}")
        print(f"📊 Open http://{self.host}:{self.port} to explore asset lineage")
        
        self.app.run(host=self.host, port=self.port, debug=False)

# CLI interface for standalone usage
if __name__ == "__main__":
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description="Start asset lineage web interface")
    parser.add_argument("--port", type=int, default=5000, help="Port to run on")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--assets-file", help="JSON file containing initial assets data")
    
    args = parser.parse_args()
    
    # Create web interface
    interface = LineageWebInterface(args.port, args.host)
    
    # Load initial assets if provided
    if args.assets_file:
        with open(args.assets_file, 'r') as f:
            assets_data = json.load(f)
        
        for asset in assets_data:
            asset_key = asset.get('name', asset.get('asset_key', 'unknown'))
            interface.assets_cache[asset_key] = asset
        
        print(f"📥 Loaded {len(interface.assets_cache)} assets from {args.assets_file}")
    
    # Start the interface
    interface.start()