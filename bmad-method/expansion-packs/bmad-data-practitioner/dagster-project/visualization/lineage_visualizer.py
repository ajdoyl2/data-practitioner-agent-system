"""
Asset Lineage Visualization
Generates visual representations of data asset lineage and dependencies
"""

import os
import json
import networkx as nx
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime
import base64
from io import BytesIO

class LineageVisualizer:
    """Generates visual representations of asset lineage"""
    
    def __init__(self, output_dir: str = "./lineage_outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Color scheme for different asset groups
        self.group_colors = {
            'infrastructure': '#FF6B6B',    # Red
            'ingestion': '#4ECDC4',         # Teal
            'analytics': '#45B7D1',         # Blue
            'transformation': '#96CEB4',     # Green
            'publication': '#FECA57',        # Yellow
            'validation': '#FF9FF3',         # Pink
            'monitoring': '#A8E6CF',         # Light Green
            'other': '#D3D3D3'              # Gray
        }
        
        # Node shapes for different compute kinds
        self.compute_shapes = {
            'python': 'o',      # Circle
            'sql': 's',         # Square
            'api': '^',         # Triangle
            'file': 'D',        # Diamond
            'health_check': 'v', # Inverted triangle
            'default': 'o'      # Circle
        }
    
    def create_lineage_graph(self, assets_data: List[Dict[str, Any]], 
                           focus_asset: Optional[str] = None) -> nx.DiGraph:
        """Create NetworkX directed graph from assets data"""
        
        G = nx.DiGraph()
        
        # Add nodes for each asset
        for asset in assets_data:
            asset_key = asset.get('name', asset.get('asset_key', 'unknown'))
            
            G.add_node(asset_key, **{
                'group': asset.get('group_name', 'other'),
                'compute_kind': asset.get('compute_kind', 'default'),
                'description': asset.get('description', ''),
                'file': asset.get('file', ''),
                'last_updated': asset.get('last_updated', ''),
                'status': asset.get('status', 'unknown')
            })
            
            # Add edges for dependencies
            dependencies = asset.get('dependencies', [])
            for dep in dependencies:
                if dep in [a.get('name', a.get('asset_key')) for a in assets_data]:
                    G.add_edge(dep, asset_key)
        
        return G
    
    def generate_lineage_visualization(self, assets_data: List[Dict[str, Any]], 
                                     focus_asset: Optional[str] = None,
                                     output_format: str = 'png',
                                     include_metadata: bool = True) -> str:
        """Generate lineage visualization and return file path"""
        
        G = self.create_lineage_graph(assets_data, focus_asset)
        
        if len(G.nodes()) == 0:
            raise ValueError("No assets found to visualize")
        
        # Create figure and axis
        plt.figure(figsize=(16, 12))
        
        # Use hierarchical layout if there's a clear flow, otherwise use spring layout
        try:
            if focus_asset and focus_asset in G.nodes():
                pos = self._create_focused_layout(G, focus_asset)
            else:
                pos = self._create_hierarchical_layout(G)
        except:
            # Fallback to spring layout
            pos = nx.spring_layout(G, k=3, iterations=50)
        
        # Prepare node colors and shapes
        node_colors = [self.group_colors.get(G.nodes[node].get('group', 'other'), '#D3D3D3') 
                      for node in G.nodes()]
        
        # Draw the graph
        nx.draw_networkx_nodes(G, pos, node_color=node_colors, 
                              node_size=3000, alpha=0.8)
        
        nx.draw_networkx_edges(G, pos, edge_color='gray', 
                              arrows=True, arrowsize=20, arrowstyle='->')
        
        # Add node labels
        labels = {}
        for node in G.nodes():
            # Truncate long names for better display
            display_name = node[:15] + '...' if len(node) > 15 else node
            labels[node] = display_name
        
        nx.draw_networkx_labels(G, pos, labels, font_size=8, font_weight='bold')
        
        # Highlight focus asset if specified
        if focus_asset and focus_asset in G.nodes():
            nx.draw_networkx_nodes(G, pos, nodelist=[focus_asset], 
                                  node_color='red', node_size=3500, alpha=0.6)
        
        # Create legend
        if include_metadata:
            legend_elements = []
            used_groups = set(G.nodes[node].get('group', 'other') for node in G.nodes())
            
            for group in used_groups:
                color = self.group_colors.get(group, '#D3D3D3')
                legend_elements.append(mpatches.Patch(color=color, label=group.title()))
            
            plt.legend(handles=legend_elements, loc='upper left', bbox_to_anchor=(1, 1))
        
        # Set title and remove axes
        title = f"Asset Lineage Visualization"
        if focus_asset:
            title += f" (Focused on: {focus_asset})"
        
        plt.title(title, fontsize=16, fontweight='bold', pad=20)
        plt.axis('off')
        
        # Adjust layout to prevent legend cutoff
        plt.tight_layout()
        
        # Save the visualization
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"lineage_viz_{timestamp}.{output_format}"
        output_path = self.output_dir / filename
        
        plt.savefig(output_path, format=output_format, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(output_path)
    
    def _create_hierarchical_layout(self, G: nx.DiGraph) -> Dict[str, Tuple[float, float]]:
        """Create hierarchical layout based on topological ordering"""
        
        try:
            # Get topological ordering
            topo_order = list(nx.topological_sort(G))
            
            # Group nodes by level
            levels = {}
            for i, node in enumerate(topo_order):
                level = 0
                for pred in G.predecessors(node):
                    if pred in levels:
                        level = max(level, levels[pred] + 1)
                levels[node] = level
            
            # Position nodes
            pos = {}
            level_counts = {}
            
            for node, level in levels.items():
                if level not in level_counts:
                    level_counts[level] = 0
                
                x = level * 3  # Horizontal spacing
                y = level_counts[level] * 2  # Vertical spacing within level
                pos[node] = (x, y)
                level_counts[level] += 1
            
            return pos
            
        except nx.NetworkXError:
            # Graph has cycles, fall back to spring layout
            return nx.spring_layout(G, k=3, iterations=50)
    
    def _create_focused_layout(self, G: nx.DiGraph, focus_asset: str) -> Dict[str, Tuple[float, float]]:
        """Create layout focused on a specific asset"""
        
        # Get subgraph of connected components
        connected_nodes = set()
        
        # Add upstream dependencies
        for node in nx.ancestors(G, focus_asset):
            connected_nodes.add(node)
        
        # Add downstream dependents
        for node in nx.descendants(G, focus_asset):
            connected_nodes.add(node)
        
        # Add focus asset
        connected_nodes.add(focus_asset)
        
        # Create subgraph
        subgraph = G.subgraph(connected_nodes)
        
        # Use shell layout with focus asset at center
        shells = []
        
        # Center shell - focus asset
        shells.append([focus_asset])
        
        # First shell - direct dependencies and dependents
        direct_connected = set()
        for pred in G.predecessors(focus_asset):
            direct_connected.add(pred)
        for succ in G.successors(focus_asset):
            direct_connected.add(succ)
        
        if direct_connected:
            shells.append(list(direct_connected))
        
        # Outer shell - remaining nodes
        remaining = connected_nodes - {focus_asset} - direct_connected
        if remaining:
            shells.append(list(remaining))
        
        return nx.shell_layout(subgraph, shells)
    
    def generate_lineage_summary(self, assets_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics about asset lineage"""
        
        G = self.create_lineage_graph(assets_data)
        
        # Basic graph statistics
        summary = {
            'total_assets': len(G.nodes()),
            'total_dependencies': len(G.edges()),
            'asset_groups': {},
            'compute_kinds': {},
            'lineage_depth': 0,
            'isolated_assets': 0,
            'circular_dependencies': False
        }
        
        # Group statistics
        for node in G.nodes():
            group = G.nodes[node].get('group', 'other')
            summary['asset_groups'][group] = summary['asset_groups'].get(group, 0) + 1
            
            compute_kind = G.nodes[node].get('compute_kind', 'default')
            summary['compute_kinds'][compute_kind] = summary['compute_kinds'].get(compute_kind, 0) + 1
        
        # Calculate lineage depth (longest path)
        try:
            summary['lineage_depth'] = nx.dag_longest_path_length(G)
        except nx.NetworkXError:
            # Graph has cycles
            summary['circular_dependencies'] = True
            summary['lineage_depth'] = "undefined (circular dependencies detected)"
        
        # Count isolated assets (no dependencies or dependents)
        for node in G.nodes():
            if G.degree(node) == 0:
                summary['isolated_assets'] += 1
        
        # Most connected assets
        degree_centrality = nx.degree_centrality(G)
        most_connected = sorted(degree_centrality.items(), key=lambda x: x[1], reverse=True)[:5]
        summary['most_connected_assets'] = [{'asset': asset, 'connections': round(score * len(G.nodes()), 2)} 
                                           for asset, score in most_connected]
        
        # Critical path assets (those with high betweenness centrality)
        try:
            betweenness = nx.betweenness_centrality(G)
            critical_assets = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:5]
            summary['critical_path_assets'] = [{'asset': asset, 'criticality': round(score, 3)} 
                                              for asset, score in critical_assets]
        except:
            summary['critical_path_assets'] = []
        
        return summary
    
    def generate_lineage_report(self, assets_data: List[Dict[str, Any]], 
                               output_format: str = 'html') -> str:
        """Generate comprehensive lineage report"""
        
        # Generate summary
        summary = self.generate_lineage_summary(assets_data)
        
        # Generate visualization
        viz_path = self.generate_lineage_visualization(assets_data, output_format='png')
        
        if output_format == 'html':
            return self._generate_html_report(summary, viz_path, assets_data)
        elif output_format == 'json':
            return self._generate_json_report(summary, viz_path, assets_data)
        else:
            raise ValueError(f"Unsupported output format: {output_format}")
    
    def _generate_html_report(self, summary: Dict[str, Any], viz_path: str, 
                             assets_data: List[Dict[str, Any]]) -> str:
        """Generate HTML report"""
        
        # Convert image to base64 for embedding
        with open(viz_path, 'rb') as img_file:
            img_data = base64.b64encode(img_file.read()).decode()
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Asset Lineage Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .section {{ margin: 20px 0; }}
                .stats {{ display: flex; flex-wrap: wrap; gap: 15px; }}
                .stat-box {{ background-color: #e9f5ff; padding: 15px; border-radius: 5px; flex: 1; min-width: 200px; }}
                .asset-list {{ max-height: 300px; overflow-y: auto; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .visualization {{ text-align: center; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Asset Lineage Report</h1>
                <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="section">
                <h2>Summary Statistics</h2>
                <div class="stats">
                    <div class="stat-box">
                        <h3>Total Assets</h3>
                        <p style="font-size: 24px; margin: 0;">{summary['total_assets']}</p>
                    </div>
                    <div class="stat-box">
                        <h3>Total Dependencies</h3>
                        <p style="font-size: 24px; margin: 0;">{summary['total_dependencies']}</p>
                    </div>
                    <div class="stat-box">
                        <h3>Lineage Depth</h3>
                        <p style="font-size: 24px; margin: 0;">{summary['lineage_depth']}</p>
                    </div>
                    <div class="stat-box">
                        <h3>Isolated Assets</h3>
                        <p style="font-size: 24px; margin: 0;">{summary['isolated_assets']}</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Lineage Visualization</h2>
                <div class="visualization">
                    <img src="data:image/png;base64,{img_data}" alt="Asset Lineage Visualization" style="max-width: 100%; height: auto;">
                </div>
            </div>
            
            <div class="section">
                <h2>Asset Groups Distribution</h2>
                <table>
                    <tr><th>Group</th><th>Count</th></tr>
        """
        
        for group, count in summary['asset_groups'].items():
            html_content += f"<tr><td>{group.title()}</td><td>{count}</td></tr>"
        
        html_content += """
                </table>
            </div>
            
            <div class="section">
                <h2>Most Connected Assets</h2>
                <table>
                    <tr><th>Asset</th><th>Connections</th></tr>
        """
        
        for asset_info in summary.get('most_connected_assets', []):
            html_content += f"<tr><td>{asset_info['asset']}</td><td>{asset_info['connections']}</td></tr>"
        
        html_content += """
                </table>
            </div>
        </body>
        </html>
        """
        
        # Save HTML report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        html_filename = f"lineage_report_{timestamp}.html"
        html_path = self.output_dir / html_filename
        
        with open(html_path, 'w') as f:
            f.write(html_content)
        
        return str(html_path)
    
    def _generate_json_report(self, summary: Dict[str, Any], viz_path: str, 
                             assets_data: List[Dict[str, Any]]) -> str:
        """Generate JSON report"""
        
        report = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'report_type': 'asset_lineage',
                'visualization_path': viz_path
            },
            'summary': summary,
            'assets': assets_data
        }
        
        # Save JSON report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"lineage_report_{timestamp}.json"
        json_path = self.output_dir / json_filename
        
        with open(json_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        return str(json_path)

# CLI interface for standalone usage
if __name__ == "__main__":
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate asset lineage visualization")
    parser.add_argument("assets_file", help="JSON file containing assets data")
    parser.add_argument("--focus", help="Focus on specific asset")
    parser.add_argument("--format", choices=['png', 'svg', 'pdf'], default='png', 
                       help="Output format for visualization")
    parser.add_argument("--report", choices=['html', 'json'], 
                       help="Generate comprehensive report")
    parser.add_argument("--output-dir", default="./lineage_outputs", 
                       help="Output directory")
    
    args = parser.parse_args()
    
    # Load assets data
    with open(args.assets_file, 'r') as f:
        assets_data = json.load(f)
    
    # Create visualizer
    visualizer = LineageVisualizer(args.output_dir)
    
    if args.report:
        # Generate comprehensive report
        report_path = visualizer.generate_lineage_report(assets_data, args.report)
        print(f"Report generated: {report_path}")
    else:
        # Generate just the visualization
        viz_path = visualizer.generate_lineage_visualization(
            assets_data, args.focus, args.format
        )
        print(f"Visualization generated: {viz_path}")