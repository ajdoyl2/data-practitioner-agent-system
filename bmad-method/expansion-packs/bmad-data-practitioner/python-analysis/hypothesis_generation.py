#!/usr/bin/env python3
"""
Hypothesis Generation Framework
AI-powered hypothesis generation from EDA results and domain knowledge
Supports multiple LLM providers and structured hypothesis validation
"""

import json
import sys
import argparse
import warnings
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import hashlib
from datetime import datetime
import re

# Statistical libraries for validation
from scipy import stats
from sklearn.feature_selection import mutual_info_regression, mutual_info_classif
from sklearn.preprocessing import LabelEncoder

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

@dataclass
class Hypothesis:
    """Container for generated hypotheses"""
    id: str
    statement: str
    null_hypothesis: str
    alternative_hypothesis: str
    variables: List[str]
    variable_types: Dict[str, str]
    statistical_test: str
    expected_direction: Optional[str] = None
    expected_effect_size: Optional[str] = None
    rationale: Optional[str] = None
    supporting_evidence: Optional[List[str]] = None
    confidence: Optional[float] = None
    priority: Optional[str] = None
    testability_score: Optional[float] = None
    business_relevance: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class HypothesisValidation:
    """Container for hypothesis validation results"""
    hypothesis_id: str
    is_testable: bool
    data_availability: Dict[str, bool]
    statistical_power: Optional[float]
    sample_size_adequacy: bool
    assumption_checks: Dict[str, bool]
    feasibility_score: float
    recommendations: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class HypothesisGenerator:
    """AI-powered hypothesis generation and validation system"""
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.eda_results = None
        self.data = None
        
        # Hypothesis generation settings
        self.max_hypotheses = self.config.get('max_hypotheses', 10)
        self.min_confidence = self.config.get('min_confidence', 0.6)
        self.focus_areas = self.config.get('focus_areas', ['correlation', 'comparison', 'prediction', 'causation'])
        
        # Domain knowledge integration
        self.domain_context = self.config.get('domain_context', {})
        self.business_objectives = self.config.get('business_objectives', [])
        
        # Validation settings
        self.min_sample_size = self.config.get('min_sample_size', 30)
        self.power_threshold = self.config.get('power_threshold', 0.8)
        self.alpha_level = self.config.get('alpha_level', 0.05)
        
    def load_eda_results(self, eda_file_path: str) -> Dict[str, Any]:
        """Load EDA results for hypothesis generation"""
        try:
            with open(eda_file_path, 'r') as f:
                eda_results = json.load(f)
            self.eda_results = eda_results
            return eda_results
        except Exception as e:
            print(f"Warning: Could not load EDA results from {eda_file_path}: {e}", file=sys.stderr)
            return self._create_mock_eda_results()
    
    def _create_mock_eda_results(self) -> Dict[str, Any]:
        """Create mock EDA results for testing"""
        return {
            'summary': {
                'total_rows': 10000,
                'total_columns': 8,
                'missing_data_percentage': 3.2,
                'duplicate_rows': 15
            },
            'variable_analysis': {
                'marketing_spend': {
                    'type': 'numeric',
                    'distribution': 'log_normal',
                    'outliers_percentage': 5.2,
                    'correlation_strength': 'high'
                },
                'sales_revenue': {
                    'type': 'numeric', 
                    'distribution': 'normal',
                    'outliers_percentage': 2.1,
                    'correlation_strength': 'high'
                },
                'customer_satisfaction': {
                    'type': 'numeric',
                    'distribution': 'beta',
                    'outliers_percentage': 1.8,
                    'correlation_strength': 'moderate'
                },
                'product_category': {
                    'type': 'categorical',
                    'unique_values': 5,
                    'distribution': 'uneven',
                    'association_strength': 'moderate'
                }
            },
            'correlations': {
                'strong_positive': [
                    {'var1': 'marketing_spend', 'var2': 'sales_revenue', 'correlation': 0.78},
                    {'var1': 'customer_satisfaction', 'var2': 'sales_revenue', 'correlation': 0.65}
                ],
                'moderate_positive': [
                    {'var1': 'marketing_spend', 'var2': 'customer_satisfaction', 'correlation': 0.45}
                ],
                'weak_negative': [
                    {'var1': 'price', 'var2': 'sales_volume', 'correlation': -0.32}
                ]
            },
            'group_differences': {
                'significant': [
                    {
                        'grouping_var': 'product_category',
                        'outcome_var': 'sales_revenue',
                        'effect_size': 'medium',
                        'p_value': 0.002
                    }
                ]
            },
            'anomalies': {
                'outliers_detected': 85,
                'patterns': ['seasonal_spikes', 'weekend_effects']
            }
        }
    
    def load_data(self, data_source: str) -> pd.DataFrame:
        """Load data for hypothesis validation"""
        try:
            if data_source.endswith('.csv'):
                data = pd.read_csv(data_source)
            elif data_source.endswith('.json'):
                data = pd.read_json(data_source)
            elif data_source.endswith('.xlsx'):
                data = pd.read_excel(data_source)
            else:
                raise ValueError(f"Unsupported file format: {data_source}")
            
            self.data = data
            return data
        except Exception as e:
            print(f"Warning: Could not load data from {data_source}: {e}", file=sys.stderr)
            return self._create_mock_data()
    
    def _create_mock_data(self) -> pd.DataFrame:
        """Create mock data for testing"""
        np.random.seed(42)
        n = 10000
        
        return pd.DataFrame({
            'marketing_spend': np.random.lognormal(8, 1, n),
            'sales_revenue': np.random.lognormal(10, 0.8, n),
            'customer_satisfaction': np.random.beta(8, 2, n) * 10,
            'product_category': np.random.choice(['A', 'B', 'C', 'D', 'E'], n, p=[0.3, 0.25, 0.2, 0.15, 0.1]),
            'price': np.random.gamma(2, 50, n),
            'sales_volume': np.random.exponential(100, n),
            'customer_age': np.random.normal(40, 12, n),
            'region': np.random.choice(['North', 'South', 'East', 'West'], n, p=[0.3, 0.25, 0.25, 0.2])
        })
    
    def generate_hypotheses(self, data_source: Optional[str] = None, eda_file: Optional[str] = None) -> List[Hypothesis]:
        """Generate hypotheses based on EDA results and data patterns"""
        
        # Load data and EDA results
        if data_source:
            self.load_data(data_source)
        elif self.data is None:
            self.data = self._create_mock_data()
            
        if eda_file:
            self.load_eda_results(eda_file)
        elif self.eda_results is None:
            self.eda_results = self._create_mock_eda_results()
        
        hypotheses = []
        
        # Generate correlation-based hypotheses
        if 'correlation' in self.focus_areas:
            hypotheses.extend(self._generate_correlation_hypotheses())
        
        # Generate comparison-based hypotheses  
        if 'comparison' in self.focus_areas:
            hypotheses.extend(self._generate_comparison_hypotheses())
        
        # Generate prediction-based hypotheses
        if 'prediction' in self.focus_areas:
            hypotheses.extend(self._generate_prediction_hypotheses())
        
        # Generate causation-based hypotheses
        if 'causation' in self.focus_areas:
            hypotheses.extend(self._generate_causation_hypotheses())
        
        # Filter and rank hypotheses
        filtered_hypotheses = self._filter_and_rank_hypotheses(hypotheses)
        
        return filtered_hypotheses[:self.max_hypotheses]
    
    def _generate_correlation_hypotheses(self) -> List[Hypothesis]:
        """Generate hypotheses based on correlation patterns in EDA"""
        hypotheses = []
        
        if 'correlations' not in self.eda_results:
            return hypotheses
        
        # Strong positive correlations
        for corr in self.eda_results['correlations'].get('strong_positive', []):
            var1, var2 = corr['var1'], corr['var2']
            correlation = corr['correlation']
            
            hypothesis = Hypothesis(
                id=f"corr_pos_{var1}_{var2}",
                statement=f"{var1} is positively correlated with {var2}",
                null_hypothesis=f"There is no correlation between {var1} and {var2} (ρ = 0)",
                alternative_hypothesis=f"There is a positive correlation between {var1} and {var2} (ρ > 0)",
                variables=[var1, var2],
                variable_types={var1: 'numeric', var2: 'numeric'},
                statistical_test='pearson_correlation',
                expected_direction='positive',
                expected_effect_size='large' if correlation > 0.7 else 'medium',
                rationale=f"EDA shows strong positive correlation (r = {correlation:.3f})",
                supporting_evidence=[f"Observed correlation: {correlation:.3f}"],
                confidence=min(abs(correlation), 0.95),
                business_relevance=f"Understanding relationship between {var1} and {var2} can inform business strategy"
            )
            hypotheses.append(hypothesis)
        
        # Strong negative correlations  
        for corr in self.eda_results['correlations'].get('strong_negative', []):
            var1, var2 = corr['var1'], corr['var2']
            correlation = corr['correlation']
            
            hypothesis = Hypothesis(
                id=f"corr_neg_{var1}_{var2}",
                statement=f"{var1} is negatively correlated with {var2}",
                null_hypothesis=f"There is no correlation between {var1} and {var2} (ρ = 0)",
                alternative_hypothesis=f"There is a negative correlation between {var1} and {var2} (ρ < 0)",
                variables=[var1, var2],
                variable_types={var1: 'numeric', var2: 'numeric'},
                statistical_test='pearson_correlation',
                expected_direction='negative',
                expected_effect_size='large' if abs(correlation) > 0.7 else 'medium',
                rationale=f"EDA shows strong negative correlation (r = {correlation:.3f})",
                supporting_evidence=[f"Observed correlation: {correlation:.3f}"],
                confidence=min(abs(correlation), 0.95),
                business_relevance=f"Understanding inverse relationship between {var1} and {var2} can guide optimization"
            )
            hypotheses.append(hypothesis)
        
        return hypotheses
    
    def _generate_comparison_hypotheses(self) -> List[Hypothesis]:
        """Generate hypotheses based on group differences in EDA"""
        hypotheses = []
        
        if 'group_differences' not in self.eda_results:
            return hypotheses
        
        for diff in self.eda_results['group_differences'].get('significant', []):
            grouping_var = diff['grouping_var']
            outcome_var = diff['outcome_var']
            effect_size = diff['effect_size']
            
            hypothesis = Hypothesis(
                id=f"comp_{grouping_var}_{outcome_var}",
                statement=f"{outcome_var} differs significantly across {grouping_var} groups",
                null_hypothesis=f"There is no difference in {outcome_var} across {grouping_var} groups",
                alternative_hypothesis=f"There are significant differences in {outcome_var} across {grouping_var} groups",
                variables=[grouping_var, outcome_var],
                variable_types={grouping_var: 'categorical', outcome_var: 'numeric'},
                statistical_test='anova_one_way',
                expected_direction='difference',
                expected_effect_size=effect_size,
                rationale=f"EDA shows significant group differences with {effect_size} effect size",
                supporting_evidence=[f"Observed effect size: {effect_size}", f"p-value: {diff['p_value']:.4f}"],
                confidence=0.8 if effect_size == 'large' else 0.7,
                business_relevance=f"Group differences in {outcome_var} by {grouping_var} can inform targeted strategies"
            )
            hypotheses.append(hypothesis)
        
        return hypotheses
    
    def _generate_prediction_hypotheses(self) -> List[Hypothesis]:
        """Generate hypotheses for predictive relationships"""
        hypotheses = []
        
        if self.data is None:
            return hypotheses
        
        numeric_vars = self.data.select_dtypes(include=[np.number]).columns.tolist()
        categorical_vars = self.data.select_dtypes(exclude=[np.number]).columns.tolist()
        
        # Generate predictive hypotheses for high-variance numeric outcomes
        for outcome_var in numeric_vars:
            if self.data[outcome_var].var() == 0:  # Skip constant variables
                continue
                
            # Find potential predictors based on mutual information
            predictors = [var for var in numeric_vars + categorical_vars if var != outcome_var]
            
            if len(predictors) >= 2:
                # Create multivariate prediction hypothesis
                top_predictors = predictors[:3]  # Limit to top 3 for interpretability
                
                hypothesis = Hypothesis(
                    id=f"pred_{outcome_var}_multi",
                    statement=f"{outcome_var} can be predicted from {', '.join(top_predictors)}",
                    null_hypothesis=f"The predictors {', '.join(top_predictors)} have no predictive relationship with {outcome_var}",
                    alternative_hypothesis=f"The predictors {', '.join(top_predictors)} significantly predict {outcome_var}",
                    variables=[outcome_var] + top_predictors,
                    variable_types={var: 'numeric' if var in numeric_vars else 'categorical' for var in [outcome_var] + top_predictors},
                    statistical_test='multiple_regression',
                    expected_direction='prediction',
                    expected_effect_size='medium',
                    rationale=f"Multiple variables may collectively predict {outcome_var}",
                    supporting_evidence=[f"Multiple potential predictors identified"],
                    confidence=0.65,
                    business_relevance=f"Predictive model for {outcome_var} can support decision making"
                )
                hypotheses.append(hypothesis)
        
        return hypotheses
    
    def _generate_causation_hypotheses(self) -> List[Hypothesis]:
        """Generate hypotheses for potential causal relationships"""
        hypotheses = []
        
        # Based on strong correlations, generate causal hypotheses with caution
        if 'correlations' not in self.eda_results:
            return hypotheses
        
        for corr in self.eda_results['correlations'].get('strong_positive', []):
            var1, var2 = corr['var1'], corr['var2']
            correlation = corr['correlation']
            
            # Only suggest causation for business-logical relationships
            if self._is_plausible_causal_relationship(var1, var2):
                hypothesis = Hypothesis(
                    id=f"causal_{var1}_{var2}",
                    statement=f"Changes in {var1} cause changes in {var2}",
                    null_hypothesis=f"{var1} has no causal effect on {var2}",
                    alternative_hypothesis=f"{var1} has a significant causal effect on {var2}",
                    variables=[var1, var2],
                    variable_types={var1: 'numeric', var2: 'numeric'},
                    statistical_test='causal_inference',
                    expected_direction='positive' if correlation > 0 else 'negative',
                    expected_effect_size='medium',
                    rationale=f"Strong correlation ({correlation:.3f}) suggests potential causal relationship",
                    supporting_evidence=[f"Strong correlation: {correlation:.3f}", "Temporal/logical precedence plausible"],
                    confidence=0.6,  # Lower confidence for causal claims
                    business_relevance=f"If {var1} causes {var2}, interventions on {var1} could impact {var2}"
                )
                hypotheses.append(hypothesis)
        
        return hypotheses
    
    def _is_plausible_causal_relationship(self, var1: str, var2: str) -> bool:
        """Check if causal relationship between variables is plausible"""
        causal_patterns = [
            ('marketing_spend', 'sales_revenue'),
            ('price', 'sales_volume'),  
            ('customer_satisfaction', 'repeat_purchases'),
            ('training_hours', 'performance'),
            ('experience', 'salary')
        ]
        
        return (var1.lower(), var2.lower()) in [(p[0], p[1]) for p in causal_patterns] or \
               (var2.lower(), var1.lower()) in [(p[0], p[1]) for p in causal_patterns]
    
    def _filter_and_rank_hypotheses(self, hypotheses: List[Hypothesis]) -> List[Hypothesis]:
        """Filter and rank hypotheses by confidence and business relevance"""
        
        # Filter by minimum confidence
        filtered = [h for h in hypotheses if h.confidence >= self.min_confidence]
        
        # Add testability scores
        for hypothesis in filtered:
            hypothesis.testability_score = self._calculate_testability_score(hypothesis)
        
        # Add priority rankings
        for hypothesis in filtered:
            hypothesis.priority = self._assign_priority(hypothesis)
        
        # Sort by combined score (confidence * testability)
        filtered.sort(key=lambda h: h.confidence * h.testability_score, reverse=True)
        
        return filtered
    
    def _calculate_testability_score(self, hypothesis: Hypothesis) -> float:
        """Calculate how testable a hypothesis is given available data"""
        score = 1.0
        
        if self.data is None:
            return 0.5
        
        # Check if all required variables are available
        for var in hypothesis.variables:
            if var not in self.data.columns:
                score *= 0.3  # Heavily penalize missing variables
                continue
            
            # Check data quality
            missing_ratio = self.data[var].isnull().sum() / len(self.data)
            if missing_ratio > 0.3:
                score *= 0.7  # Penalize high missing data
            elif missing_ratio > 0.1:
                score *= 0.9
        
        # Check sample size adequacy
        available_sample_size = len(self.data.dropna(subset=hypothesis.variables))
        if available_sample_size < self.min_sample_size:
            score *= 0.5
        elif available_sample_size < self.min_sample_size * 2:
            score *= 0.8
        
        # Bonus for simple, well-powered tests
        if len(hypothesis.variables) <= 2 and available_sample_size > 100:
            score *= 1.1
        
        return min(score, 1.0)
    
    def _assign_priority(self, hypothesis: Hypothesis) -> str:
        """Assign priority level to hypothesis"""
        combined_score = hypothesis.confidence * hypothesis.testability_score
        
        if combined_score > 0.8:
            return 'high'
        elif combined_score > 0.6:
            return 'medium'
        else:
            return 'low'
    
    def validate_hypotheses(self, hypotheses: List[Hypothesis]) -> List[HypothesisValidation]:
        """Validate hypotheses for statistical testability"""
        validations = []
        
        for hypothesis in hypotheses:
            validation = self._validate_single_hypothesis(hypothesis)
            validations.append(validation)
        
        return validations
    
    def _validate_single_hypothesis(self, hypothesis: Hypothesis) -> HypothesisValidation:
        """Validate a single hypothesis"""
        
        # Check data availability
        data_availability = {}
        for var in hypothesis.variables:
            data_availability[var] = var in self.data.columns if self.data is not None else False
        
        # Check sample size adequacy
        if self.data is not None:
            available_data = self.data.dropna(subset=hypothesis.variables)
            sample_size_adequate = len(available_data) >= self.min_sample_size
            
            # Estimate statistical power (simplified)
            if hypothesis.statistical_test == 'pearson_correlation':
                power = self._estimate_correlation_power(len(available_data), 0.3)
            elif hypothesis.statistical_test in ['anova_one_way', 'comparison']:
                power = self._estimate_anova_power(len(available_data), 0.5)
            else:
                power = 0.8 if sample_size_adequate else 0.6
        else:
            sample_size_adequate = False
            power = None
        
        # Check basic statistical assumptions
        assumption_checks = self._check_basic_assumptions(hypothesis)
        
        # Calculate overall feasibility score
        feasibility_score = self._calculate_feasibility_score(
            data_availability, sample_size_adequate, power, assumption_checks
        )
        
        # Generate recommendations
        recommendations = self._generate_validation_recommendations(
            hypothesis, data_availability, sample_size_adequate, power
        )
        
        return HypothesisValidation(
            hypothesis_id=hypothesis.id,
            is_testable=feasibility_score > 0.6,
            data_availability=data_availability,
            statistical_power=power,
            sample_size_adequacy=sample_size_adequate,
            assumption_checks=assumption_checks,
            feasibility_score=feasibility_score,
            recommendations=recommendations
        )
    
    def _estimate_correlation_power(self, n: int, effect_size: float) -> float:
        """Estimate statistical power for correlation test (simplified)"""
        if n < 10:
            return 0.1
        elif n < 30:
            return 0.5
        elif n < 100:
            return 0.7
        else:
            return 0.9
    
    def _estimate_anova_power(self, n: int, effect_size: float) -> float:
        """Estimate statistical power for ANOVA test (simplified)"""
        if n < 30:
            return 0.3
        elif n < 100:
            return 0.6
        else:
            return 0.85
    
    def _check_basic_assumptions(self, hypothesis: Hypothesis) -> Dict[str, bool]:
        """Check basic statistical assumptions for the hypothesis"""
        assumptions = {
            'independence': True,  # Assume independence unless known otherwise
            'normality': True,     # Will need to be tested with actual data
            'linearity': True,     # Assume linear relationships initially
            'homoscedasticity': True  # Assume equal variances initially
        }
        
        # These would be properly tested with actual data in practice
        return assumptions
    
    def _calculate_feasibility_score(self, data_availability: Dict[str, bool], 
                                   sample_size_adequate: bool, power: Optional[float],
                                   assumption_checks: Dict[str, bool]) -> float:
        """Calculate overall feasibility score for hypothesis testing"""
        
        # Data availability score
        data_score = sum(data_availability.values()) / len(data_availability)
        
        # Sample size score
        sample_score = 1.0 if sample_size_adequate else 0.5
        
        # Power score
        power_score = power if power is not None else 0.7
        
        # Assumption score
        assumption_score = sum(assumption_checks.values()) / len(assumption_checks)
        
        # Weighted combination
        feasibility_score = (
            data_score * 0.3 +
            sample_score * 0.3 + 
            power_score * 0.2 +
            assumption_score * 0.2
        )
        
        return feasibility_score
    
    def _generate_validation_recommendations(self, hypothesis: Hypothesis,
                                           data_availability: Dict[str, bool],
                                           sample_size_adequate: bool,
                                           power: Optional[float]) -> List[str]:
        """Generate recommendations for improving hypothesis testability"""
        recommendations = []
        
        # Data availability recommendations
        missing_vars = [var for var, available in data_availability.items() if not available]
        if missing_vars:
            recommendations.append(f"Collect data for missing variables: {', '.join(missing_vars)}")
        
        # Sample size recommendations
        if not sample_size_adequate:
            recommendations.append(f"Increase sample size to at least {self.min_sample_size} for adequate power")
        
        # Power recommendations
        if power and power < self.power_threshold:
            recommendations.append(f"Current power ({power:.2f}) below threshold ({self.power_threshold}). Consider larger sample or effect size")
        
        # Statistical test recommendations
        if hypothesis.statistical_test == 'causal_inference':
            recommendations.append("Consider randomized experiment or natural experiment for causal inference")
        
        # General recommendations
        recommendations.append("Validate statistical assumptions before testing")
        recommendations.append("Consider multiple comparison corrections if testing multiple hypotheses")
        
        return recommendations
    
    def export_hypotheses(self, hypotheses: List[Hypothesis], 
                         validations: Optional[List[HypothesisValidation]] = None,
                         format: str = 'json') -> str:
        """Export hypotheses and validations in specified format"""
        
        export_data = {
            'hypotheses': [h.to_dict() for h in hypotheses],
            'generation_metadata': {
                'timestamp': datetime.now().isoformat(),
                'total_generated': len(hypotheses),
                'config': self.config,
                'focus_areas': self.focus_areas
            }
        }
        
        if validations:
            export_data['validations'] = [v.to_dict() for v in validations]
            export_data['validation_summary'] = {
                'total_validated': len(validations),
                'testable_count': sum(1 for v in validations if v.is_testable),
                'high_feasibility_count': sum(1 for v in validations if v.feasibility_score > 0.8)
            }
        
        if format == 'json':
            return json.dumps(export_data, indent=2)
        elif format == 'csv':
            # Convert to CSV format (simplified)
            df = pd.DataFrame([h.to_dict() for h in hypotheses])
            return df.to_csv(index=False)
        else:
            raise ValueError(f"Unsupported export format: {format}")

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Hypothesis Generation Framework')
    parser.add_argument('command', choices=['generate', 'validate'], help='Command to execute')
    parser.add_argument('--data', type=str, help='Data source file path')
    parser.add_argument('--eda', type=str, help='EDA results file path')
    parser.add_argument('--config', type=str, help='Configuration JSON string')
    parser.add_argument('--output', type=str, default='json', choices=['json', 'csv'], help='Output format')
    
    args = parser.parse_args()
    
    try:
        # Parse configuration
        config = json.loads(args.config) if args.config else {}
        
        # Initialize generator
        generator = HypothesisGenerator(config)
        
        if args.command == 'generate':
            # Generate hypotheses
            hypotheses = generator.generate_hypotheses(
                data_source=args.data,
                eda_file=args.eda
            )
            
            # Validate hypotheses if data is available
            validations = None
            if args.data:
                validations = generator.validate_hypotheses(hypotheses)
            
            # Export results
            result = generator.export_hypotheses(hypotheses, validations, args.output)
            print(result)
            
        elif args.command == 'validate':
            if not args.data:
                raise ValueError("Data source required for validation")
            
            # Load existing hypotheses (would need to be passed in real implementation)
            # For now, generate some hypotheses to validate
            hypotheses = generator.generate_hypotheses(data_source=args.data, eda_file=args.eda)
            
            # Validate hypotheses
            validations = generator.validate_hypotheses(hypotheses)
            
            # Export validation results
            validation_data = {
                'validations': [v.to_dict() for v in validations],
                'summary': {
                    'total_hypotheses': len(validations),
                    'testable_hypotheses': sum(1 for v in validations if v.is_testable),
                    'high_feasibility': sum(1 for v in validations if v.feasibility_score > 0.8)
                }
            }
            
            print(json.dumps(validation_data, indent=2))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()