"""
Automated Analysis Assets for Dagster
EDA, Hypothesis Generation, Statistical Testing, and Pattern Detection
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

from dagster import (
    asset, AssetExecutionContext, MaterializeResult, MetadataValue,
    Config, AssetIn, DependencyDefinition
)

# Import our analysis tools
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../python-analysis'))

from eda_automation import EDAAutomation
from hypothesis_generation import HypothesisGenerator
from statistical_testing import StatisticalTester
from pattern_detection import PatternDetector


class AnalysisConfig(Config):
    """Configuration for automated analysis"""
    eda_depth: str = "comprehensive"  # minimal, standard, comprehensive
    max_hypotheses: int = 10
    statistical_alpha: float = 0.05
    pattern_analysis_type: str = "comprehensive"
    cache_enabled: bool = True


@asset(
    group_name="automated_analysis",
    description="Automated Exploratory Data Analysis on ingested data",
    compute_kind="python"
)
def eda_analysis(context: AssetExecutionContext, config: AnalysisConfig) -> MaterializeResult:
    """
    Perform automated EDA on the latest ingested data
    Depends on: ingestion_assets.ingested_data
    """
    try:
        # Initialize EDA automation
        eda_engine = EDAAutomation({
            'analysis_depth': config.eda_depth,
            'output_format': 'json',
            'visualization_enabled': True,
            'cache_enabled': config.cache_enabled
        })
        
        # Get data source (in real implementation, this would come from upstream assets)
        data_source = "/tmp/ingested_data.csv"  # Placeholder
        
        context.log.info(f"Starting EDA analysis with depth: {config.eda_depth}")
        
        # Perform EDA analysis
        eda_results = eda_engine.run_eda_analysis(data_source)
        
        # Save results
        output_path = "/tmp/eda_results.json"
        with open(output_path, 'w') as f:
            json.dump(eda_results, f, indent=2)
        
        # Extract metrics for metadata
        summary = eda_results.get('summary', {})
        insights = eda_results.get('insights', {})
        
        context.log.info(f"EDA analysis completed. Found {len(insights)} key insights")
        
        return MaterializeResult(
            metadata={
                "records_analyzed": MetadataValue.int(summary.get('total_rows', 0)),
                "variables_analyzed": MetadataValue.int(summary.get('total_columns', 0)),
                "missing_data_percentage": MetadataValue.float(summary.get('missing_data_percentage', 0)),
                "insights_generated": MetadataValue.int(len(insights)),
                "analysis_depth": MetadataValue.text(config.eda_depth),
                "output_path": MetadataValue.path(output_path)
            }
        )
        
    except Exception as e:
        context.log.error(f"EDA analysis failed: {str(e)}")
        raise


@asset(
    group_name="automated_analysis",
    description="Generate hypotheses based on EDA results",
    compute_kind="python",
    deps=[eda_analysis]
)
def hypothesis_generation(context: AssetExecutionContext, config: AnalysisConfig) -> MaterializeResult:
    """
    Generate testable hypotheses from EDA results
    Depends on: eda_analysis
    """
    try:
        # Initialize hypothesis generator
        generator = HypothesisGenerator({
            'max_hypotheses': config.max_hypotheses,
            'min_confidence': 0.6,
            'focus_areas': ['correlation', 'comparison', 'prediction'],
            'alpha_level': config.statistical_alpha
        })
        
        # Load EDA results
        eda_file = "/tmp/eda_results.json"
        data_source = "/tmp/ingested_data.csv"  # Placeholder
        
        context.log.info(f"Generating up to {config.max_hypotheses} hypotheses from EDA results")
        
        # Generate hypotheses
        hypotheses = generator.generate_hypotheses(
            data_source=data_source,
            eda_file=eda_file
        )
        
        # Validate hypotheses
        validations = generator.validate_hypotheses(hypotheses)
        
        # Export results
        results = generator.export_hypotheses(hypotheses, validations, format='json')
        
        # Save results
        output_path = "/tmp/hypothesis_results.json"
        with open(output_path, 'w') as f:
            f.write(results)
        
        # Calculate metrics
        testable_hypotheses = sum(1 for v in validations if v.is_testable)
        high_priority = sum(1 for h in hypotheses if h.priority == 'high')
        
        context.log.info(f"Generated {len(hypotheses)} hypotheses, {testable_hypotheses} testable")
        
        return MaterializeResult(
            metadata={
                "total_hypotheses": MetadataValue.int(len(hypotheses)),
                "testable_hypotheses": MetadataValue.int(testable_hypotheses),
                "high_priority_hypotheses": MetadataValue.int(high_priority),
                "average_confidence": MetadataValue.float(
                    sum(h.confidence for h in hypotheses) / len(hypotheses) if hypotheses else 0
                ),
                "output_path": MetadataValue.path(output_path)
            }
        )
        
    except Exception as e:
        context.log.error(f"Hypothesis generation failed: {str(e)}")
        raise


@asset(
    group_name="automated_analysis",
    description="Execute statistical tests for generated hypotheses",
    compute_kind="python",
    deps=[hypothesis_generation]
)
def statistical_testing(context: AssetExecutionContext, config: AnalysisConfig) -> MaterializeResult:
    """
    Execute statistical tests for generated hypotheses
    Depends on: hypothesis_generation
    """
    try:
        # Initialize statistical tester
        tester = StatisticalTester(
            alpha=config.statistical_alpha,
            correction_method='benjamini_hochberg'
        )
        
        # Load data and hypotheses
        data_source = "/tmp/ingested_data.csv"  # Placeholder
        hypothesis_file = "/tmp/hypothesis_results.json"
        
        with open(hypothesis_file, 'r') as f:
            hypothesis_data = json.load(f)
        
        hypotheses = hypothesis_data.get('hypotheses', [])
        testable_hypotheses = [h for h in hypotheses if h.get('testability_score', 0) > 0.6]
        
        context.log.info(f"Executing statistical tests for {len(testable_hypotheses)} testable hypotheses")
        
        # Convert hypotheses to test specifications
        test_specifications = []
        for hypothesis in testable_hypotheses:
            test_spec = {
                'test': hypothesis['statistical_test'],
                'variables': hypothesis['variables'],
                'rationale': hypothesis['rationale']
            }
            test_specifications.append(test_spec)
        
        # Load data
        data = tester.load_data(data_source)
        
        # Execute test suite
        test_results = tester.execute_test_suite(data, test_specifications)
        
        # Save results
        output_path = "/tmp/statistical_test_results.json"
        with open(output_path, 'w') as f:
            json.dump(test_results, f, indent=2)
        
        # Calculate metrics
        successful_tests = len([r for r in test_results.get('test_results', []) 
                              if r.get('p_value') is not None])
        significant_results = len([r for r in test_results.get('test_results', []) 
                                 if r.get('p_value', 1.0) < config.statistical_alpha])
        
        context.log.info(f"Completed {successful_tests} tests, {significant_results} significant results")
        
        return MaterializeResult(
            metadata={
                "tests_executed": MetadataValue.int(successful_tests),
                "significant_results": MetadataValue.int(significant_results),
                "alpha_level": MetadataValue.float(config.statistical_alpha),
                "correction_method": MetadataValue.text("benjamini_hochberg"),
                "output_path": MetadataValue.path(output_path)
            }
        )
        
    except Exception as e:
        context.log.error(f"Statistical testing failed: {str(e)}")
        raise


@asset(
    group_name="automated_analysis",
    description="Detect patterns and anomalies in the data",
    compute_kind="python"
)
def pattern_detection(context: AssetExecutionContext, config: AnalysisConfig) -> MaterializeResult:
    """
    Detect patterns and anomalies using multiple methods
    Can run independently or use insights from other analyses
    """
    try:
        # Initialize pattern detector
        detector = PatternDetector({
            'zScoreThreshold': 3.0,
            'iqrMultiplier': 1.5,
            'isolationForestContamination': 0.1,
            'visualizationEnabled': True,
            'cacheEnabled': config.cache_enabled
        })
        
        # Get data source
        data_source = "/tmp/ingested_data.csv"  # Placeholder
        
        context.log.info(f"Starting pattern detection with analysis type: {config.pattern_analysis_type}")
        
        # Perform pattern detection
        pattern_results = detector.detectPatterns(
            dataInput=data_source,
            analysisType=config.pattern_analysis_type
        )
        
        # Save results  
        output_path = "/tmp/pattern_detection_results.json"
        with open(output_path, 'w') as f:
            json.dump(pattern_results, f, indent=2, default=str)
        
        # Extract metrics
        summary = pattern_results.get('summary', {})
        anomalies = pattern_results.get('anomalies', [])
        patterns = pattern_results.get('patterns', {})
        
        total_patterns = sum(len(pattern_list) for pattern_list in patterns.values())
        high_confidence_anomalies = summary.get('high_confidence_anomalies', 0)
        
        context.log.info(f"Pattern detection completed. Found {len(anomalies)} anomalies, {total_patterns} patterns")
        
        return MaterializeResult(
            metadata={
                "total_anomalies": MetadataValue.int(len(anomalies)),
                "high_confidence_anomalies": MetadataValue.int(high_confidence_anomalies),
                "total_patterns": MetadataValue.int(total_patterns),
                "methods_executed": MetadataValue.int(summary.get('total_methods_executed', 0)),
                "success_rate": MetadataValue.float(summary.get('success_rate', 0)),
                "output_path": MetadataValue.path(output_path)
            }
        )
        
    except Exception as e:
        context.log.error(f"Pattern detection failed: {str(e)}")
        raise


@asset(
    group_name="automated_analysis",
    description="Comprehensive analysis report combining all analytical insights",
    compute_kind="python",
    deps=[eda_analysis, hypothesis_generation, statistical_testing, pattern_detection]
)
def comprehensive_analysis_report(context: AssetExecutionContext) -> MaterializeResult:
    """
    Generate comprehensive analysis report combining all insights
    Depends on: eda_analysis, hypothesis_generation, statistical_testing, pattern_detection
    """
    try:
        context.log.info("Generating comprehensive analysis report")
        
        # Load all analysis results
        results = {}
        
        # Load EDA results
        try:
            with open("/tmp/eda_results.json", 'r') as f:
                results['eda'] = json.load(f)
        except FileNotFoundError:
            results['eda'] = {}
        
        # Load hypothesis results
        try:
            with open("/tmp/hypothesis_results.json", 'r') as f:
                results['hypotheses'] = json.load(f)
        except FileNotFoundError:
            results['hypotheses'] = {}
        
        # Load statistical test results
        try:
            with open("/tmp/statistical_test_results.json", 'r') as f:
                results['statistical_tests'] = json.load(f)
        except FileNotFoundError:
            results['statistical_tests'] = {}
        
        # Load pattern detection results
        try:
            with open("/tmp/pattern_detection_results.json", 'r') as f:
                results['pattern_detection'] = json.load(f)
        except FileNotFoundError:
            results['pattern_detection'] = {}
        
        # Generate comprehensive report
        report = {
            'report_metadata': {
                'generated_at': datetime.now().isoformat(),
                'report_type': 'comprehensive_automated_analysis',
                'version': '1.0'
            },
            'executive_summary': _generate_executive_summary(results),
            'analysis_results': results,
            'recommendations': _generate_recommendations(results),
            'next_steps': _generate_next_steps(results)
        }
        
        # Save comprehensive report
        output_path = "/tmp/comprehensive_analysis_report.json"
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        # Generate metrics
        total_insights = len(results.get('eda', {}).get('insights', {}))
        total_hypotheses = len(results.get('hypotheses', {}).get('hypotheses', []))
        significant_tests = len([
            r for r in results.get('statistical_tests', {}).get('test_results', [])
            if r.get('p_value', 1.0) < 0.05
        ])
        total_anomalies = len(results.get('pattern_detection', {}).get('anomalies', []))
        
        context.log.info(f"Comprehensive report generated with {total_insights} insights, "
                        f"{total_hypotheses} hypotheses, {significant_tests} significant tests, "
                        f"{total_anomalies} anomalies")
        
        return MaterializeResult(
            metadata={
                "total_insights": MetadataValue.int(total_insights),
                "total_hypotheses": MetadataValue.int(total_hypotheses),
                "significant_statistical_tests": MetadataValue.int(significant_tests),
                "total_anomalies": MetadataValue.int(total_anomalies),
                "report_sections": MetadataValue.int(len(report)),
                "output_path": MetadataValue.path(output_path)
            }
        )
        
    except Exception as e:
        context.log.error(f"Comprehensive report generation failed: {str(e)}")
        raise


def _generate_executive_summary(results: Dict[str, Any]) -> Dict[str, str]:
    """Generate executive summary from all analysis results"""
    
    # EDA summary
    eda_summary = ""
    if 'eda' in results and results['eda']:
        summary = results['eda'].get('summary', {})
        insights = results['eda'].get('insights', {})
        eda_summary = f"Analyzed {summary.get('total_rows', 0)} records across {summary.get('total_columns', 0)} variables. Generated {len(insights)} key insights."
    
    # Hypothesis summary
    hyp_summary = ""
    if 'hypotheses' in results and results['hypotheses']:
        hypotheses = results['hypotheses'].get('hypotheses', [])
        testable = sum(1 for h in hypotheses if h.get('testability_score', 0) > 0.6)
        hyp_summary = f"Generated {len(hypotheses)} hypotheses, {testable} testable."
    
    # Statistical test summary
    stat_summary = ""
    if 'statistical_tests' in results and results['statistical_tests']:
        test_results = results['statistical_tests'].get('test_results', [])
        significant = sum(1 for r in test_results if r.get('p_value', 1.0) < 0.05)
        stat_summary = f"Executed {len(test_results)} statistical tests, {significant} significant."
    
    # Pattern detection summary
    pattern_summary = ""
    if 'pattern_detection' in results and results['pattern_detection']:
        anomalies = results['pattern_detection'].get('anomalies', [])
        patterns = results['pattern_detection'].get('patterns', {})
        total_patterns = sum(len(p) for p in patterns.values())
        pattern_summary = f"Detected {len(anomalies)} anomalies and {total_patterns} patterns."
    
    return {
        'overview': f"Comprehensive automated analysis completed. {eda_summary} {hyp_summary} {stat_summary} {pattern_summary}",
        'eda_summary': eda_summary,
        'hypothesis_summary': hyp_summary,
        'statistical_summary': stat_summary,
        'pattern_summary': pattern_summary
    }


def _generate_recommendations(results: Dict[str, Any]) -> List[str]:
    """Generate actionable recommendations from analysis results"""
    recommendations = []
    
    # Recommendations from statistical tests
    if 'statistical_tests' in results and results['statistical_tests']:
        test_results = results['statistical_tests'].get('test_results', [])
        significant_tests = [r for r in test_results if r.get('p_value', 1.0) < 0.05]
        
        if significant_tests:
            recommendations.append(f"Investigate {len(significant_tests)} statistically significant findings for business implications")
        
        if len(test_results) > len(significant_tests):
            recommendations.append("Consider power analysis for non-significant results to determine if they represent true null effects")
    
    # Recommendations from pattern detection
    if 'pattern_detection' in results and results['pattern_detection']:
        anomalies = results['pattern_detection'].get('anomalies', [])
        high_conf_anomalies = [a for a in anomalies if a.get('combined_score', 0) > 0.8]
        
        if high_conf_anomalies:
            recommendations.append(f"Investigate {len(high_conf_anomalies)} high-confidence anomalies for data quality or business exceptions")
    
    # General recommendations
    recommendations.append("Validate key findings with domain experts before making business decisions")
    recommendations.append("Consider setting up automated monitoring for detected patterns and anomalies")
    
    return recommendations


def _generate_next_steps(results: Dict[str, Any]) -> List[str]:
    """Generate next steps from analysis results"""
    next_steps = []
    
    # Next steps from hypotheses
    if 'hypotheses' in results and results['hypotheses']:
        hypotheses = results['hypotheses'].get('hypotheses', [])
        high_priority = [h for h in hypotheses if h.get('priority') == 'high']
        
        if high_priority:
            next_steps.append(f"Prioritize testing of {len(high_priority)} high-priority hypotheses")
    
    # Next steps from patterns
    if 'pattern_detection' in results and results['pattern_detection']:
        patterns = results['pattern_detection'].get('patterns', {})
        if patterns.get('temporal_patterns'):
            next_steps.append("Investigate temporal patterns for seasonality and trend analysis")
    
    # General next steps
    next_steps.append("Schedule regular re-analysis to monitor changes in patterns and relationships")
    next_steps.append("Integrate findings into business intelligence dashboards for ongoing monitoring")
    
    return next_steps