#!/usr/bin/env python3
"""
EDA Automation Script for BMad Data Practitioner
Automated Exploratory Data Analysis using pandas-profiling, Sweetviz, and AutoViz
"""

import json
import os
import sys
import pandas as pd
import traceback
from pathlib import Path
from typing import Dict, Any, Optional
import warnings

# Suppress warnings to clean up output
warnings.filterwarnings('ignore')

class EDAAutomation:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.tool = config.get('tool')
        self.data_config = config.get('data_config', {})
        self.tool_config = config.get('tool_config', {})
        self.output_formats = config.get('output_formats', ['html', 'json'])
        self.cache_path = Path(config.get('cache_path', '.cache/eda-reports'))
        self.sampling = config.get('sampling', {})
        
        # Ensure cache directory exists
        self.cache_path.mkdir(parents=True, exist_ok=True)
        
    def load_data(self) -> pd.DataFrame:
        """Load data from various sources with sampling if needed"""
        try:
            data_source = self.data_config.get('source')
            source_type = self.data_config.get('type', 'csv')
            
            # Load data based on source type
            if source_type == 'csv':
                if self.sampling.get('enabled', False):
                    # Use sampling for large files
                    sample_size = self.sampling.get('sample_size', 10000)
                    df = pd.read_csv(data_source, nrows=sample_size)
                else:
                    df = pd.read_csv(data_source)
            elif source_type == 'parquet':
                df = pd.read_parquet(data_source)
                if self.sampling.get('enabled', False):
                    sample_size = self.sampling.get('sample_size', 10000)
                    df = df.sample(n=min(sample_size, len(df)), random_state=42)
            elif source_type == 'duckdb':
                # Handle DuckDB queries
                import duckdb
                conn = duckdb.connect(self.data_config.get('database_path', ':memory:'))
                query = self.data_config.get('query', f'SELECT * FROM {data_source}')
                if self.sampling.get('enabled', False):
                    sample_size = self.sampling.get('sample_size', 10000)
                    query = f'{query} LIMIT {sample_size}'
                df = conn.execute(query).df()
                conn.close()
            else:
                raise ValueError(f"Unsupported data source type: {source_type}")
            
            return df
            
        except Exception as e:
            raise Exception(f"Failed to load data: {str(e)}")
    
    def run_pandas_profiling(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Run pandas-profiling analysis"""
        try:
            from ydata_profiling import ProfileReport
            
            # Configure profiling report
            config = {
                'title': self.tool_config.get('title', 'BMad Data Analysis Report'),
                'explorative': self.tool_config.get('explorative', True),
                'minimal': False
            }
            
            # Generate profile report
            profile = ProfileReport(df, **config)
            
            # Save reports
            output_files = {}
            
            if 'html' in self.output_formats:
                html_path = self.cache_path / f'pandas_profiling_report_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.html'
                profile.to_file(html_path)
                output_files['html'] = str(html_path)
            
            if 'json' in self.output_formats:
                json_path = self.cache_path / f'pandas_profiling_report_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.json'
                profile.to_file(json_path)
                output_files['json'] = str(json_path)
            
            # Extract key insights
            insights = {
                'dataset_info': {
                    'n_rows': len(df),
                    'n_columns': len(df.columns),
                    'memory_size': df.memory_usage(deep=True).sum(),
                    'missing_cells': df.isnull().sum().sum(),
                    'missing_percentage': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
                },
                'correlations': [],
                'warnings': [],
                'summary': {}
            }
            
            # Extract correlations (for numeric columns)
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 1:
                corr_matrix = df[numeric_cols].corr()
                high_correlations = []
                for i in range(len(corr_matrix.columns)):
                    for j in range(i+1, len(corr_matrix.columns)):
                        corr_val = corr_matrix.iloc[i, j]
                        if abs(corr_val) > 0.7:  # High correlation threshold
                            high_correlations.append({
                                'variable_1': corr_matrix.columns[i],
                                'variable_2': corr_matrix.columns[j],
                                'correlation': corr_val
                            })
                insights['correlations'] = high_correlations
            
            # Check for data quality issues
            warnings = []
            for col in df.columns:
                missing_pct = (df[col].isnull().sum() / len(df)) * 100
                if missing_pct > 50:
                    warnings.append({
                        'type': 'high_missing_data',
                        'column': col,
                        'missing_percentage': missing_pct
                    })
                
                if df[col].dtype == 'object':
                    unique_pct = (df[col].nunique() / len(df)) * 100
                    if unique_pct > 95:
                        warnings.append({
                            'type': 'high_cardinality',
                            'column': col,
                            'unique_percentage': unique_pct
                        })
            
            insights['warnings'] = warnings
            
            return {
                'success': True,
                'tool': 'pandas_profiling',
                'output_files': output_files,
                'insights': insights
            }
            
        except ImportError:
            return {
                'success': False,
                'error': 'pandas-profiling (ydata-profiling) not installed. Run: pip install ydata-profiling'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'pandas-profiling analysis failed: {str(e)}'
            }
    
    def run_sweetviz(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Run Sweetviz analysis"""
        try:
            import sweetviz as sv
            
            # Configure Sweetviz report
            target_feat = self.tool_config.get('target_feat')
            
            if target_feat and target_feat in df.columns:
                report = sv.analyze(df, target_feat=target_feat)
            else:
                report = sv.analyze(df)
            
            # Save report
            output_files = {}
            html_path = self.cache_path / f'sweetviz_report_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.html'
            report.show_html(str(html_path))
            output_files['html'] = str(html_path)
            
            # Extract insights
            insights = {
                'dataset_info': {
                    'n_rows': len(df),
                    'n_columns': len(df.columns)
                },
                'associations': {}
            }
            
            # Calculate associations for numeric columns
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 1:
                associations = {}
                corr_matrix = df[numeric_cols].corr()
                for col1 in numeric_cols:
                    associations[col1] = {}
                    for col2 in numeric_cols:
                        if col1 != col2:
                            associations[col1][col2] = corr_matrix.loc[col1, col2]
                insights['associations'] = associations
            
            return {
                'success': True,
                'tool': 'sweetviz',
                'output_files': output_files,
                'insights': insights
            }
            
        except ImportError:
            return {
                'success': False,
                'error': 'Sweetviz not installed. Run: pip install sweetviz'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Sweetviz analysis failed: {str(e)}'
            }
    
    def run_autoviz(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Run AutoViz analysis"""
        try:
            from autoviz.AutoViz_Class import AutoViz_Class
            
            # Configure AutoViz
            max_rows = self.tool_config.get('max_rows', 150000)
            max_cols = self.tool_config.get('max_cols', 30)
            
            # Sample data if needed
            if len(df) > max_rows:
                df = df.sample(n=max_rows, random_state=42)
            
            if len(df.columns) > max_cols:
                # Keep most important columns (numeric + target if specified)
                numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
                object_cols = df.select_dtypes(include=['object']).columns.tolist()
                
                # Balance numeric and categorical columns
                selected_cols = numeric_cols[:max_cols//2] + object_cols[:max_cols//2]
                df = df[selected_cols[:max_cols]]
            
            # Initialize AutoViz
            av = AutoViz_Class()
            
            # Create output directory for plots
            plots_dir = self.cache_path / f'autoviz_plots_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}'
            plots_dir.mkdir(exist_ok=True)
            
            # Generate visualizations
            dft = av.AutoViz(
                filename="",
                sep=",",
                depVar="",
                dfte=df,
                header=0,
                verbose=0,
                lowess=False,
                chart_format="png",
                max_rows_analyzed=max_rows,
                max_cols_analyzed=max_cols,
                save_plot_dir=str(plots_dir)
            )
            
            # List generated plot files
            plot_files = list(plots_dir.glob("*.png"))
            
            insights = {
                'dataset_info': {
                    'n_rows': len(df),
                    'n_columns': len(df.columns),
                    'plots_generated': len(plot_files)
                },
                'recommended_plots': [
                    'distribution_plots' if any('dist' in str(f) for f in plot_files) else None,
                    'correlation_plots' if any('corr' in str(f) for f in plot_files) else None,
                    'scatter_plots' if any('scatter' in str(f) for f in plot_files) else None,
                    'violin_plots' if any('violin' in str(f) for f in plot_files) else None
                ],
                'plot_files': [str(f) for f in plot_files]
            }
            
            # Remove None values
            insights['recommended_plots'] = [p for p in insights['recommended_plots'] if p is not None]
            
            return {
                'success': True,
                'tool': 'autoviz',
                'output_files': {'plots_directory': str(plots_dir)},
                'insights': insights
            }
            
        except ImportError:
            return {
                'success': False,
                'error': 'AutoViz not installed. Run: pip install autoviz'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'AutoViz analysis failed: {str(e)}'
            }
    
    def run_analysis(self) -> Dict[str, Any]:
        """Run the specified EDA tool analysis"""
        try:
            # Load data
            df = self.load_data()
            
            if df.empty:
                return {
                    'success': False,
                    'error': 'Loaded dataset is empty'
                }
            
            # Run the specified tool
            if self.tool == 'pandas_profiling':
                result = self.run_pandas_profiling(df)
            elif self.tool == 'sweetviz':
                result = self.run_sweetviz(df)
            elif self.tool == 'autoviz':
                result = self.run_autoviz(df)
            else:
                return {
                    'success': False,
                    'error': f'Unsupported EDA tool: {self.tool}'
                }
            
            # Add dataset metadata
            if result.get('success'):
                result['dataset_metadata'] = {
                    'source': self.data_config.get('source'),
                    'type': self.data_config.get('type'),
                    'shape': df.shape,
                    'columns': df.columns.tolist(),
                    'dtypes': df.dtypes.to_dict(),
                    'sampling_applied': self.sampling.get('enabled', False),
                    'sample_size': len(df) if self.sampling.get('enabled', False) else None
                }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'EDA analysis failed: {str(e)}',
                'traceback': traceback.format_exc()
            }

def main():
    try:
        # Get configuration from environment variable
        config_json = os.environ.get('EDA_CONFIG')
        if not config_json:
            print(json.dumps({
                'success': False,
                'error': 'EDA_CONFIG environment variable not set'
            }))
            sys.exit(1)
        
        # Parse configuration
        config = json.loads(config_json)
        
        # Initialize and run EDA automation
        eda = EDAAutomation(config)
        result = eda.run_analysis()
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON configuration: {str(e)}'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'traceback': traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()