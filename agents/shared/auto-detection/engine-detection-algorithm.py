"""
Engine Detection Algorithm for SQLmesh Transformation Engine Selection

This module provides intelligent detection and recommendation algorithms for selecting
the optimal transformation engine (SQLmesh vs dbt vs dual-engine) based on project
characteristics, requirements, and environmental factors.

Key Features:
- Multi-factor analysis for engine recommendation
- Project characteristic evaluation
- Performance and cost impact assessment
- User preference and constraint consideration
- Confidence scoring for recommendations
"""

import os
import re
import json
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any, Union
from pathlib import Path
from datetime import datetime
import yaml

logger = logging.getLogger(__name__)

@dataclass
class ProjectCharacteristics:
    """Project characteristics for engine selection analysis."""
    
    # Project scale metrics
    model_count: int = 0
    total_loc: int = 0
    data_volume_gb_daily: float = 0.0
    team_size: int = 1
    
    # Technical characteristics
    sql_complexity_score: float = 0.0
    python_usage_ratio: float = 0.0
    ml_model_count: int = 0
    real_time_requirements: bool = False
    
    # Existing infrastructure
    current_orchestrator: Optional[str] = None
    cloud_platform: Optional[str] = None
    data_warehouse: Optional[str] = None
    existing_dbt_models: int = 0
    
    # Team characteristics
    team_sql_expertise: float = 5.0  # 1-10 scale
    team_python_expertise: float = 5.0  # 1-10 scale
    team_dbt_experience: float = 5.0  # 1-10 scale
    team_sqlmesh_experience: float = 1.0  # 1-10 scale
    
    # Business requirements
    deployment_frequency: str = "weekly"  # daily, weekly, monthly
    environment_count: int = 3  # dev, staging, prod
    compliance_requirements: List[str] = field(default_factory=list)
    performance_criticality: str = "medium"  # low, medium, high, critical
    
    # Cost constraints
    budget_annual_usd: Optional[float] = None
    cost_optimization_priority: str = "medium"  # low, medium, high, critical

@dataclass
class EngineRecommendation:
    """Engine recommendation with supporting analysis."""
    
    recommended_engine: str  # "sqlmesh", "dbt", "dual_engine"
    confidence_score: float  # 0.0 to 1.0
    reasoning: List[str]
    
    # Detailed scoring breakdown
    technical_score: float
    cost_score: float
    team_readiness_score: float
    risk_score: float
    
    # Implementation guidance
    migration_complexity: str  # "low", "medium", "high", "very_high"
    estimated_implementation_weeks: int
    recommended_phases: List[str]
    
    # Alternative options
    alternative_engines: List[str]
    fallback_recommendation: str
    
    # Warnings and considerations
    warnings: List[str]
    considerations: List[str]

class ProjectAnalyzer:
    """Analyze project characteristics for engine selection."""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.characteristics = ProjectCharacteristics()
        
    def analyze_project(self) -> ProjectCharacteristics:
        """Comprehensive project analysis for engine selection."""
        
        logger.info(f"Analyzing project at {self.project_path}")
        
        try:
            # Analyze project structure and files
            self._analyze_project_structure()
            self._analyze_sql_files()
            self._analyze_python_files()
            self._analyze_configuration_files()
            self._analyze_existing_tools()
            
            # Infer project characteristics
            self._infer_complexity_metrics()
            self._assess_technical_requirements()
            
            logger.info("Project analysis completed successfully")
            return self.characteristics
            
        except Exception as e:
            logger.error(f"Project analysis failed: {str(e)}")
            raise
    
    def _analyze_project_structure(self):
        """Analyze overall project structure and scale."""
        
        if not self.project_path.exists():
            logger.warning(f"Project path does not exist: {self.project_path}")
            return
        
        # Count files and directories
        sql_files = list(self.project_path.rglob("*.sql"))
        python_files = list(self.project_path.rglob("*.py"))
        yaml_files = list(self.project_path.rglob("*.yml")) + list(self.project_path.rglob("*.yaml"))
        
        self.characteristics.model_count = len(sql_files)
        
        # Calculate total lines of code
        total_loc = 0
        for file_path in sql_files + python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    total_loc += len(f.readlines())
            except Exception as e:
                logger.debug(f"Could not read file {file_path}: {e}")
        
        self.characteristics.total_loc = total_loc
        
        # Analyze directory structure patterns
        directories = [d for d in self.project_path.rglob("*") if d.is_dir()]
        
        # Check for common patterns
        has_models_dir = any("models" in str(d) for d in directories)
        has_tests_dir = any("tests" in str(d) for d in directories)
        has_macros_dir = any("macros" in str(d) for d in directories)
        has_docs_dir = any("docs" in str(d) for d in directories)
        
        # Estimate team size from git history (if available)
        self._estimate_team_size()
        
        logger.info(f"Project structure: {len(sql_files)} SQL files, {len(python_files)} Python files, {total_loc} LOC")
    
    def _analyze_sql_files(self):
        """Analyze SQL files for complexity and patterns."""
        
        sql_files = list(self.project_path.rglob("*.sql"))
        
        if not sql_files:
            return
        
        complexity_indicators = {
            'window_functions': 0,
            'cte_usage': 0,
            'complex_joins': 0,
            'advanced_aggregations': 0,
            'recursive_queries': 0,
            'dynamic_sql': 0
        }
        
        for sql_file in sql_files:
            try:
                with open(sql_file, 'r', encoding='utf-8') as f:
                    content = f.read().upper()
                
                # Analyze SQL complexity patterns
                complexity_indicators['window_functions'] += len(re.findall(r'\b(?:ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE)\b', content))
                complexity_indicators['cte_usage'] += len(re.findall(r'\bWITH\s+\w+\s+AS\s*\(', content))
                complexity_indicators['complex_joins'] += len(re.findall(r'\b(?:LEFT|RIGHT|FULL)\s+(?:OUTER\s+)?JOIN\b', content))
                complexity_indicators['advanced_aggregations'] += len(re.findall(r'\b(?:GROUPING\s+SETS|ROLLUP|CUBE)\b', content))
                complexity_indicators['recursive_queries'] += len(re.findall(r'\bWITH\s+RECURSIVE\b', content))
                complexity_indicators['dynamic_sql'] += content.count('EXECUTE')
                
            except Exception as e:
                logger.debug(f"Could not analyze SQL file {sql_file}: {e}")
        
        # Calculate complexity score (0-10 scale)
        total_files = len(sql_files)
        complexity_score = 0
        
        if total_files > 0:
            avg_complexity = sum(complexity_indicators.values()) / total_files
            complexity_score = min(10.0, avg_complexity / 2)  # Normalize to 0-10
        
        self.characteristics.sql_complexity_score = complexity_score
        
        logger.info(f"SQL analysis: complexity score {complexity_score:.1f}/10")
    
    def _analyze_python_files(self):
        """Analyze Python files for ML/data science patterns."""
        
        python_files = list(self.project_path.rglob("*.py"))
        
        if not python_files:
            self.characteristics.python_usage_ratio = 0.0
            return
        
        ml_indicators = 0
        total_python_loc = 0
        
        ml_libraries = [
            'sklearn', 'tensorflow', 'torch', 'keras', 'xgboost', 'lightgbm',
            'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly'
        ]
        
        for py_file in python_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                lines = content.split('\n')
                total_python_loc += len(lines)
                
                # Check for ML library imports
                for library in ml_libraries:
                    if f'import {library}' in content or f'from {library}' in content:
                        ml_indicators += 1
                        break
                
                # Check for model-related patterns
                if any(pattern in content.lower() for pattern in ['def train_', 'def predict_', 'model.fit', 'model.predict']):
                    self.characteristics.ml_model_count += 1
                
            except Exception as e:
                logger.debug(f"Could not analyze Python file {py_file}: {e}")
        
        # Calculate Python usage ratio
        if self.characteristics.total_loc > 0:
            self.characteristics.python_usage_ratio = total_python_loc / self.characteristics.total_loc
        
        logger.info(f"Python analysis: {self.characteristics.python_usage_ratio:.2f} usage ratio, {self.characteristics.ml_model_count} ML models")
    
    def _analyze_configuration_files(self):
        """Analyze configuration files for existing tool usage."""
        
        config_patterns = {
            'dbt_project.yml': 'dbt',
            'sqlmesh.yml': 'sqlmesh',
            'airflow.cfg': 'airflow',
            'prefect.yml': 'prefect',
            'requirements.txt': 'python',
            'pyproject.toml': 'python',
            'docker-compose.yml': 'docker'
        }
        
        for config_file, tool in config_patterns.items():
            config_path = self.project_path / config_file
            if config_path.exists():
                if tool == 'dbt':
                    self._analyze_dbt_project(config_path)
                elif tool == 'sqlmesh':
                    self._analyze_sqlmesh_project(config_path)
                
                logger.info(f"Found {tool} configuration: {config_file}")
    
    def _analyze_dbt_project(self, dbt_project_path: Path):
        """Analyze existing dbt project configuration."""
        
        try:
            with open(dbt_project_path, 'r') as f:
                dbt_config = yaml.safe_load(f)
            
            # Count dbt models
            models_dir = dbt_project_path.parent / 'models'
            if models_dir.exists():
                dbt_models = list(models_dir.rglob("*.sql"))
                self.characteristics.existing_dbt_models = len(dbt_models)
            
            # Extract configuration insights
            if 'profile' in dbt_config:
                self.characteristics.current_orchestrator = 'dbt'
            
            # Infer team dbt experience from project maturity
            if self.characteristics.existing_dbt_models > 50:
                self.characteristics.team_dbt_experience = 8.0
            elif self.characteristics.existing_dbt_models > 20:
                self.characteristics.team_dbt_experience = 6.0
            elif self.characteristics.existing_dbt_models > 5:
                self.characteristics.team_dbt_experience = 4.0
            
        except Exception as e:
            logger.debug(f"Could not analyze dbt project: {e}")
    
    def _analyze_sqlmesh_project(self, sqlmesh_config_path: Path):
        """Analyze existing SQLmesh project configuration."""
        
        try:
            with open(sqlmesh_config_path, 'r') as f:
                sqlmesh_config = yaml.safe_load(f)
            
            self.characteristics.current_orchestrator = 'sqlmesh'
            
            # Infer SQLmesh experience from configuration sophistication
            if 'environments' in sqlmesh_config:
                self.characteristics.team_sqlmesh_experience = 6.0
            else:
                self.characteristics.team_sqlmesh_experience = 3.0
                
        except Exception as e:
            logger.debug(f"Could not analyze SQLmesh project: {e}")
    
    def _analyze_existing_tools(self):
        """Analyze existing tools and infrastructure."""
        
        # Check for common cloud platforms
        cloud_indicators = {
            'AWS': ['aws_', 's3://', 'redshift', 'emr'],
            'GCP': ['gcp_', 'gs://', 'bigquery', 'dataflow'],
            'Azure': ['azure_', 'abfss://', 'synapse', 'databricks']
        }
        
        # Search for cloud platform indicators in files
        for cloud, indicators in cloud_indicators.items():
            for file_path in self.project_path.rglob("*"):
                if file_path.is_file():
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read().lower()
                        
                        if any(indicator in content for indicator in indicators):
                            self.characteristics.cloud_platform = cloud
                            break
                    except Exception:
                        continue
    
    def _estimate_team_size(self):
        """Estimate team size from git history or project characteristics."""
        
        try:
            # Try to get git contributors
            import subprocess
            result = subprocess.run(
                ['git', 'shortlog', '-sn', '--all'],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                contributors = len(result.stdout.strip().split('\n'))
                self.characteristics.team_size = max(1, contributors)
                logger.info(f"Estimated team size from git: {contributors}")
                return
        except Exception:
            pass
        
        # Fallback: estimate from project complexity
        if self.characteristics.model_count > 100:
            self.characteristics.team_size = 8
        elif self.characteristics.model_count > 50:
            self.characteristics.team_size = 5
        elif self.characteristics.model_count > 20:
            self.characteristics.team_size = 3
        else:
            self.characteristics.team_size = 1
    
    def _infer_complexity_metrics(self):
        """Infer additional complexity metrics from analyzed data."""
        
        # Estimate data volume from model count and complexity
        if self.characteristics.model_count > 0:
            volume_factor = self.characteristics.sql_complexity_score / 10
            base_volume = self.characteristics.model_count * 0.1  # 100MB per model base
            self.characteristics.data_volume_gb_daily = base_volume * (1 + volume_factor)
        
        # Infer deployment frequency from project size
        if self.characteristics.model_count > 100:
            self.characteristics.deployment_frequency = "daily"
        elif self.characteristics.model_count > 20:
            self.characteristics.deployment_frequency = "weekly"
        else:
            self.characteristics.deployment_frequency = "monthly"
    
    def _assess_technical_requirements(self):
        """Assess technical requirements from project patterns."""
        
        # Check for real-time requirements
        real_time_indicators = ['streaming', 'real_time', 'live_', 'kafka', 'pubsub']
        
        for file_path in self.project_path.rglob("*"):
            if file_path.is_file():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                    
                    if any(indicator in content for indicator in real_time_indicators):
                        self.characteristics.real_time_requirements = True
                        break
                except Exception:
                    continue
        
        # Assess performance criticality
        if self.characteristics.data_volume_gb_daily > 100:
            self.characteristics.performance_criticality = "critical"
        elif self.characteristics.data_volume_gb_daily > 10:
            self.characteristics.performance_criticality = "high"
        elif self.characteristics.data_volume_gb_daily > 1:
            self.characteristics.performance_criticality = "medium"
        else:
            self.characteristics.performance_criticality = "low"

class EngineRecommendationEngine:
    """Core recommendation engine for transformation engine selection."""
    
    def __init__(self):
        self.scoring_weights = {
            'technical_fit': 0.35,
            'cost_efficiency': 0.25,
            'team_readiness': 0.25,
            'risk_mitigation': 0.15
        }
        
        self.engine_capabilities = {
            'sqlmesh': {
                'virtual_environments': 10,
                'cost_optimization': 9,
                'python_integration': 8,
                'performance': 9,
                'learning_curve': 6,
                'community_support': 6,
                'enterprise_features': 8
            },
            'dbt': {
                'virtual_environments': 7,
                'cost_optimization': 6,
                'python_integration': 6,
                'performance': 7,
                'learning_curve': 8,
                'community_support': 9,
                'enterprise_features': 7
            },
            'dual_engine': {
                'virtual_environments': 9,
                'cost_optimization': 8,
                'python_integration': 9,
                'performance': 8,
                'learning_curve': 4,
                'community_support': 7,
                'enterprise_features': 9
            }
        }
    
    def recommend_engine(
        self, 
        characteristics: ProjectCharacteristics,
        constraints: Optional[Dict[str, Any]] = None
    ) -> EngineRecommendation:
        """Generate engine recommendation based on project characteristics."""
        
        logger.info("Generating engine recommendation")
        
        # Calculate individual scores for each engine
        engine_scores = {}
        detailed_analysis = {}
        
        for engine in ['sqlmesh', 'dbt', 'dual_engine']:
            scores = self._calculate_engine_scores(engine, characteristics, constraints)
            engine_scores[engine] = self._calculate_weighted_score(scores)
            detailed_analysis[engine] = scores
        
        # Select best engine
        best_engine = max(engine_scores.items(), key=lambda x: x[1])
        recommended_engine = best_engine[0]
        confidence_score = best_engine[1]
        
        # Generate detailed recommendation
        recommendation = self._build_recommendation(
            recommended_engine,
            confidence_score,
            detailed_analysis,
            characteristics,
            constraints
        )
        
        logger.info(f"Recommended engine: {recommended_engine} (confidence: {confidence_score:.2f})")
        return recommendation
    
    def _calculate_engine_scores(
        self, 
        engine: str, 
        characteristics: ProjectCharacteristics,
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, float]:
        """Calculate detailed scores for a specific engine."""
        
        scores = {
            'technical_score': self._calculate_technical_score(engine, characteristics),
            'cost_score': self._calculate_cost_score(engine, characteristics),
            'team_readiness_score': self._calculate_team_readiness_score(engine, characteristics),
            'risk_score': self._calculate_risk_score(engine, characteristics)
        }
        
        # Apply constraints if provided
        if constraints:
            scores = self._apply_constraints(scores, engine, constraints)
        
        return scores
    
    def _calculate_technical_score(self, engine: str, characteristics: ProjectCharacteristics) -> float:
        """Calculate technical fit score for an engine."""
        
        capabilities = self.engine_capabilities[engine]
        score = 0.0
        
        # Python integration requirements
        if characteristics.python_usage_ratio > 0.3:
            score += capabilities['python_integration'] * 0.3
        else:
            score += 8.0 * 0.3  # Neutral score for non-Python projects
        
        # Performance requirements
        perf_weight = {
            'low': 0.1,
            'medium': 0.2,
            'high': 0.3,
            'critical': 0.4
        }.get(characteristics.performance_criticality, 0.2)
        
        score += capabilities['performance'] * perf_weight
        
        # Data volume considerations
        if characteristics.data_volume_gb_daily > 50:
            score += capabilities['virtual_environments'] * 0.2
        else:
            score += 7.0 * 0.2
        
        # Real-time requirements
        if characteristics.real_time_requirements:
            if engine == 'sqlmesh':
                score += 8.0 * 0.2  # SQLmesh handles streaming better
            elif engine == 'dbt':
                score += 5.0 * 0.2  # dbt is primarily batch
            else:
                score += 7.0 * 0.2  # Dual engine provides flexibility
        else:
            score += 7.0 * 0.2
        
        return min(10.0, score)
    
    def _calculate_cost_score(self, engine: str, characteristics: ProjectCharacteristics) -> float:
        """Calculate cost efficiency score for an engine."""
        
        capabilities = self.engine_capabilities[engine]
        base_score = capabilities['cost_optimization']
        
        # Adjust for data volume (higher volume = more cost savings potential)
        if characteristics.data_volume_gb_daily > 100:
            volume_multiplier = 1.2
        elif characteristics.data_volume_gb_daily > 10:
            volume_multiplier = 1.1
        else:
            volume_multiplier = 1.0
        
        # Adjust for cost optimization priority
        priority_multiplier = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.2,
            'critical': 1.4
        }.get(characteristics.cost_optimization_priority, 1.0)
        
        final_score = base_score * volume_multiplier * priority_multiplier
        return min(10.0, final_score)
    
    def _calculate_team_readiness_score(self, engine: str, characteristics: ProjectCharacteristics) -> float:
        """Calculate team readiness score for an engine."""
        
        if engine == 'sqlmesh':
            # SQLmesh readiness based on SQL + Python skills and learning curve
            sql_weight = 0.4
            python_weight = 0.3
            learning_penalty = 0.3
            
            score = (
                characteristics.team_sql_expertise * sql_weight +
                characteristics.team_python_expertise * python_weight -
                (10 - self.engine_capabilities[engine]['learning_curve']) * learning_penalty
            )
            
        elif engine == 'dbt':
            # dbt readiness based on existing experience and SQL skills
            dbt_weight = 0.5
            sql_weight = 0.4
            community_bonus = 0.1
            
            score = (
                characteristics.team_dbt_experience * dbt_weight +
                characteristics.team_sql_expertise * sql_weight +
                self.engine_capabilities[engine]['community_support'] * community_bonus
            )
            
        else:  # dual_engine
            # Dual engine requires high expertise across tools
            complexity_penalty = 0.4
            expertise_requirement = 0.6
            
            avg_expertise = (
                characteristics.team_sql_expertise +
                characteristics.team_python_expertise +
                characteristics.team_dbt_experience
            ) / 3
            
            score = (
                avg_expertise * expertise_requirement -
                (10 - self.engine_capabilities[engine]['learning_curve']) * complexity_penalty
            )
        
        return max(0.0, min(10.0, score))
    
    def _calculate_risk_score(self, engine: str, characteristics: ProjectCharacteristics) -> float:
        """Calculate risk mitigation score for an engine."""
        
        base_risk_score = 8.0  # Start with neutral risk score
        
        # Migration risk assessment
        if characteristics.existing_dbt_models > 0:
            if engine == 'dbt':
                migration_risk = 0  # No migration needed
            elif engine == 'sqlmesh':
                migration_risk = min(characteristics.existing_dbt_models / 20, 3)  # Max 3 point penalty
            else:  # dual_engine
                migration_risk = min(characteristics.existing_dbt_models / 40, 2)  # Max 2 point penalty
        else:
            migration_risk = 0
        
        # Team expertise risk
        if engine == 'sqlmesh' and characteristics.team_sqlmesh_experience < 3:
            expertise_risk = 2
        elif engine == 'dual_engine' and characteristics.team_size < 5:
            expertise_risk = 1.5  # Complex for small teams
        else:
            expertise_risk = 0
        
        # Project complexity risk
        if characteristics.sql_complexity_score > 7 and engine == 'dbt':
            complexity_risk = 1  # dbt might struggle with very complex SQL
        elif characteristics.python_usage_ratio > 0.5 and engine == 'dbt':
            complexity_risk = 1.5  # dbt has limited Python support
        else:
            complexity_risk = 0
        
        # Performance risk
        if characteristics.data_volume_gb_daily > 100:
            if engine == 'dbt':
                performance_risk = 1.5
            else:
                performance_risk = 0.5
        else:
            performance_risk = 0
        
        # Calculate final risk score (higher is better)
        total_risk_penalty = migration_risk + expertise_risk + complexity_risk + performance_risk
        risk_score = base_risk_score - total_risk_penalty
        
        return max(0.0, min(10.0, risk_score))
    
    def _apply_constraints(
        self, 
        scores: Dict[str, float], 
        engine: str, 
        constraints: Dict[str, Any]
    ) -> Dict[str, float]:
        """Apply user-defined constraints to scores."""
        
        # Budget constraints
        if 'max_budget' in constraints:
            if engine == 'dual_engine' and constraints['max_budget'] < 100000:
                scores['cost_score'] *= 0.7  # Dual engine has higher operational costs
        
        # Timeline constraints
        if 'max_implementation_weeks' in constraints:
            if constraints['max_implementation_weeks'] < 8:
                if engine == 'sqlmesh':
                    scores['team_readiness_score'] *= 0.8  # SQLmesh has steeper learning curve
                elif engine == 'dual_engine':
                    scores['team_readiness_score'] *= 0.6  # Dual engine is most complex
        
        # Technology constraints
        if 'forbidden_engines' in constraints:
            if engine in constraints['forbidden_engines']:
                for key in scores:
                    scores[key] = 0.0
        
        # Required features
        if 'required_features' in constraints:
            required = constraints['required_features']
            
            if 'real_time' in required and engine == 'dbt':
                scores['technical_score'] *= 0.5  # dbt is primarily batch
            
            if 'cost_optimization' in required and engine == 'dbt':
                scores['cost_score'] *= 0.8  # dbt has fewer cost optimization features
        
        return scores
    
    def _calculate_weighted_score(self, scores: Dict[str, float]) -> float:
        """Calculate final weighted score for an engine."""
        
        weighted_score = (
            scores['technical_score'] * self.scoring_weights['technical_fit'] +
            scores['cost_score'] * self.scoring_weights['cost_efficiency'] +
            scores['team_readiness_score'] * self.scoring_weights['team_readiness'] +
            scores['risk_score'] * self.scoring_weights['risk_mitigation']
        ) / 10.0  # Normalize to 0-1 scale
        
        return weighted_score
    
    def _build_recommendation(
        self,
        recommended_engine: str,
        confidence_score: float,
        detailed_analysis: Dict[str, Dict[str, float]],
        characteristics: ProjectCharacteristics,
        constraints: Optional[Dict[str, Any]] = None
    ) -> EngineRecommendation:
        """Build comprehensive engine recommendation."""
        
        analysis = detailed_analysis[recommended_engine]
        
        # Generate reasoning
        reasoning = self._generate_reasoning(recommended_engine, analysis, characteristics)
        
        # Estimate implementation complexity and timeline
        migration_complexity = self._assess_migration_complexity(recommended_engine, characteristics)
        implementation_weeks = self._estimate_implementation_timeline(recommended_engine, characteristics)
        
        # Generate recommended phases
        phases = self._generate_implementation_phases(recommended_engine, characteristics)
        
        # Identify alternative engines
        sorted_engines = sorted(
            detailed_analysis.items(),
            key=lambda x: self._calculate_weighted_score(x[1]),
            reverse=True
        )
        
        alternatives = [engine for engine, _ in sorted_engines[1:]]
        fallback = alternatives[0] if alternatives else 'dbt'
        
        # Generate warnings and considerations
        warnings = self._generate_warnings(recommended_engine, characteristics)
        considerations = self._generate_considerations(recommended_engine, characteristics)
        
        return EngineRecommendation(
            recommended_engine=recommended_engine,
            confidence_score=confidence_score,
            reasoning=reasoning,
            technical_score=analysis['technical_score'],
            cost_score=analysis['cost_score'],
            team_readiness_score=analysis['team_readiness_score'],
            risk_score=analysis['risk_score'],
            migration_complexity=migration_complexity,
            estimated_implementation_weeks=implementation_weeks,
            recommended_phases=phases,
            alternative_engines=alternatives,
            fallback_recommendation=fallback,
            warnings=warnings,
            considerations=considerations
        )
    
    def _generate_reasoning(
        self, 
        engine: str, 
        analysis: Dict[str, float], 
        characteristics: ProjectCharacteristics
    ) -> List[str]:
        """Generate human-readable reasoning for the recommendation."""
        
        reasoning = []
        
        # Technical fit reasoning
        if analysis['technical_score'] > 8:
            if engine == 'sqlmesh':
                reasoning.append("SQLmesh provides excellent technical fit with strong Python integration and virtual environment capabilities")
            elif engine == 'dbt':
                reasoning.append("dbt offers solid technical foundation with proven SQL transformation capabilities")
            else:
                reasoning.append("Dual engine approach maximizes technical capabilities across diverse requirements")
        
        # Cost efficiency reasoning
        if analysis['cost_score'] > 8:
            if engine == 'sqlmesh':
                reasoning.append(f"SQLmesh virtual environments can provide 60-80% cost savings for {characteristics.data_volume_gb_daily:.1f}GB daily data volume")
            reasoning.append("Strong cost optimization features align with project requirements")
        
        # Team readiness reasoning
        if analysis['team_readiness_score'] > 7:
            reasoning.append("Team expertise and experience align well with recommended engine capabilities")
        elif analysis['team_readiness_score'] < 5:
            reasoning.append("Significant training investment will be required for successful adoption")
        
        # Risk mitigation reasoning
        if analysis['risk_score'] > 8:
            reasoning.append("Low implementation risk with established migration path")
        elif analysis['risk_score'] < 6:
            reasoning.append("Implementation carries elevated risk requiring careful planning and phased approach")
        
        # Specific project characteristics
        if characteristics.python_usage_ratio > 0.3:
            reasoning.append(f"High Python usage ({characteristics.python_usage_ratio:.1%}) benefits from enhanced Python integration")
        
        if characteristics.existing_dbt_models > 20:
            reasoning.append(f"Existing dbt investment ({characteristics.existing_dbt_models} models) influences migration strategy")
        
        return reasoning
    
    def _assess_migration_complexity(self, engine: str, characteristics: ProjectCharacteristics) -> str:
        """Assess migration complexity for recommended engine."""
        
        complexity_score = 0
        
        # Existing tool migration complexity
        if characteristics.existing_dbt_models > 0:
            if engine == 'dbt':
                complexity_score += 0  # No migration needed
            elif engine == 'sqlmesh':
                complexity_score += min(characteristics.existing_dbt_models / 10, 3)
            else:  # dual_engine
                complexity_score += min(characteristics.existing_dbt_models / 15, 2)
        
        # Technical complexity
        complexity_score += characteristics.sql_complexity_score / 5
        complexity_score += characteristics.python_usage_ratio * 2
        
        # Team readiness impact
        if characteristics.team_size < 3:
            complexity_score += 1
        
        if complexity_score <= 1:
            return "low"
        elif complexity_score <= 2.5:
            return "medium"
        elif complexity_score <= 4:
            return "high"
        else:
            return "very_high"
    
    def _estimate_implementation_timeline(self, engine: str, characteristics: ProjectCharacteristics) -> int:
        """Estimate implementation timeline in weeks."""
        
        base_weeks = {
            'sqlmesh': 8,
            'dbt': 6,
            'dual_engine': 12
        }[engine]
        
        # Adjust for project size
        size_multiplier = 1 + (characteristics.model_count / 100)
        
        # Adjust for complexity
        complexity_multiplier = 1 + (characteristics.sql_complexity_score / 20)
        
        # Adjust for team experience
        if engine == 'sqlmesh' and characteristics.team_sqlmesh_experience < 3:
            experience_multiplier = 1.5
        elif engine == 'dbt' and characteristics.team_dbt_experience < 5:
            experience_multiplier = 1.3
        else:
            experience_multiplier = 1.0
        
        # Adjust for migration
        if characteristics.existing_dbt_models > 0 and engine != 'dbt':
            migration_weeks = min(characteristics.existing_dbt_models / 5, 8)
        else:
            migration_weeks = 0
        
        total_weeks = (base_weeks * size_multiplier * complexity_multiplier * experience_multiplier) + migration_weeks
        
        return max(4, int(total_weeks))
    
    def _generate_implementation_phases(self, engine: str, characteristics: ProjectCharacteristics) -> List[str]:
        """Generate recommended implementation phases."""
        
        phases = []
        
        # Phase 1: Setup and Planning
        phases.append("Phase 1: Environment setup, tool installation, and team training (2-3 weeks)")
        
        # Phase 2: Migration (if needed)
        if characteristics.existing_dbt_models > 0 and engine != 'dbt':
            phases.append("Phase 2: Incremental migration of existing dbt models (3-6 weeks)")
        
        # Phase 3: Core Implementation
        if engine == 'sqlmesh':
            phases.append("Phase 3: Core SQLmesh model development and virtual environment configuration (4-6 weeks)")
        elif engine == 'dbt':
            phases.append("Phase 3: Core dbt model development and testing framework setup (3-4 weeks)")
        else:
            phases.append("Phase 3: Dual engine coordination setup and initial model development (6-8 weeks)")
        
        # Phase 4: Advanced Features
        phases.append("Phase 4: Advanced feature implementation and optimization (2-4 weeks)")
        
        # Phase 5: Production Deployment
        phases.append("Phase 5: Production deployment, monitoring setup, and team handoff (1-2 weeks)")
        
        return phases
    
    def _generate_warnings(self, engine: str, characteristics: ProjectCharacteristics) -> List[str]:
        """Generate warnings for the recommended engine."""
        
        warnings = []
        
        if engine == 'sqlmesh':
            if characteristics.team_sqlmesh_experience < 3:
                warnings.append("Limited team SQLmesh experience may require significant training investment")
            
            if characteristics.team_size < 3:
                warnings.append("Small team size may limit ability to support dual SQL/Python workflows")
        
        elif engine == 'dbt':
            if characteristics.python_usage_ratio > 0.5:
                warnings.append("High Python usage may be constrained by dbt's limited Python support")
            
            if characteristics.data_volume_gb_daily > 100:
                warnings.append("Large data volumes may benefit from more advanced cost optimization features")
        
        else:  # dual_engine
            warnings.append("Dual engine approach significantly increases operational complexity")
            
            if characteristics.team_size < 5:
                warnings.append("Small teams may struggle with dual engine maintenance overhead")
        
        # General warnings
        if characteristics.sql_complexity_score > 8:
            warnings.append("High SQL complexity may require careful validation during implementation")
        
        if characteristics.existing_dbt_models > 50 and engine != 'dbt':
            warnings.append("Large existing dbt investment requires comprehensive migration strategy")
        
        return warnings
    
    def _generate_considerations(self, engine: str, characteristics: ProjectCharacteristics) -> List[str]:
        """Generate additional considerations for the recommended engine."""
        
        considerations = []
        
        # Cost considerations
        if characteristics.data_volume_gb_daily > 50:
            considerations.append("Implement cost monitoring and alerting for large data volumes")
        
        # Performance considerations
        if characteristics.performance_criticality == 'critical':
            considerations.append("Establish performance benchmarks and SLA monitoring")
        
        # Team considerations
        considerations.append("Plan comprehensive training program for team skill development")
        
        if characteristics.team_size > 8:
            considerations.append("Establish clear governance and coordination processes for large team")
        
        # Technical considerations
        if characteristics.ml_model_count > 5:
            considerations.append("Develop ML model deployment and versioning strategy")
        
        if characteristics.real_time_requirements:
            considerations.append("Design streaming data architecture for real-time requirements")
        
        # Migration considerations
        if characteristics.existing_dbt_models > 0:
            considerations.append("Develop detailed migration plan with rollback procedures")
        
        return considerations

class UserPreferenceOverrideManager:
    """Manage user preference overrides for engine recommendations."""
    
    def __init__(self):
        self.override_patterns = {
            'force_engine': self._handle_force_engine,
            'exclude_engines': self._handle_exclude_engines,
            'prioritize_factors': self._handle_prioritize_factors,
            'budget_constraints': self._handle_budget_constraints,
            'timeline_constraints': self._handle_timeline_constraints
        }
    
    def apply_overrides(
        self, 
        recommendation: EngineRecommendation, 
        overrides: Dict[str, Any]
    ) -> EngineRecommendation:
        """Apply user preference overrides to recommendation."""
        
        modified_recommendation = recommendation
        
        for override_type, override_value in overrides.items():
            if override_type in self.override_patterns:
                handler = self.override_patterns[override_type]
                modified_recommendation = handler(modified_recommendation, override_value)
        
        return modified_recommendation
    
    def _handle_force_engine(self, recommendation: EngineRecommendation, forced_engine: str) -> EngineRecommendation:
        """Handle forced engine selection override."""
        
        if forced_engine in ['sqlmesh', 'dbt', 'dual_engine']:
            recommendation.recommended_engine = forced_engine
            recommendation.confidence_score = 0.5  # Lower confidence for overridden recommendation
            recommendation.reasoning.append(f"Engine forced to {forced_engine} by user override")
            recommendation.warnings.append("Recommendation overridden by user preference")
        
        return recommendation
    
    def _handle_exclude_engines(self, recommendation: EngineRecommendation, excluded_engines: List[str]) -> EngineRecommendation:
        """Handle engine exclusion override."""
        
        if recommendation.recommended_engine in excluded_engines:
            # Select from alternatives
            for alternative in recommendation.alternative_engines:
                if alternative not in excluded_engines:
                    recommendation.recommended_engine = alternative
                    recommendation.confidence_score *= 0.8  # Reduce confidence
                    recommendation.reasoning.append(f"Selected {alternative} after excluding {excluded_engines}")
                    break
        
        return recommendation
    
    def _handle_prioritize_factors(self, recommendation: EngineRecommendation, priorities: Dict[str, float]) -> EngineRecommendation:
        """Handle factor prioritization override."""
        
        # This would require recalculating scores with new weights
        # For now, just add to considerations
        priority_list = [f"{factor}: {weight}" for factor, weight in priorities.items()]
        recommendation.considerations.append(f"User prioritized factors: {', '.join(priority_list)}")
        
        return recommendation
    
    def _handle_budget_constraints(self, recommendation: EngineRecommendation, budget_limit: float) -> EngineRecommendation:
        """Handle budget constraint override."""
        
        if budget_limit < 50000 and recommendation.recommended_engine == 'dual_engine':
            recommendation.warnings.append(f"Dual engine approach may exceed budget limit of ${budget_limit:,.0f}")
            recommendation.considerations.append("Consider phased implementation to manage costs")
        
        return recommendation
    
    def _handle_timeline_constraints(self, recommendation: EngineRecommendation, max_weeks: int) -> EngineRecommendation:
        """Handle timeline constraint override."""
        
        if recommendation.estimated_implementation_weeks > max_weeks:
            recommendation.warnings.append(f"Estimated timeline ({recommendation.estimated_implementation_weeks} weeks) exceeds constraint ({max_weeks} weeks)")
            recommendation.considerations.append("Consider reducing scope or increasing team size to meet timeline")
        
        return recommendation

def detect_and_recommend_engine(
    project_path: str,
    constraints: Optional[Dict[str, Any]] = None,
    user_overrides: Optional[Dict[str, Any]] = None
) -> EngineRecommendation:
    """
    Main entry point for engine detection and recommendation.
    
    Args:
        project_path: Path to the project to analyze
        constraints: Optional constraints to apply to recommendation
        user_overrides: Optional user preference overrides
    
    Returns:
        EngineRecommendation with detailed analysis and guidance
    """
    
    logger.info(f"Starting engine detection and recommendation for {project_path}")
    
    try:
        # Step 1: Analyze project characteristics
        analyzer = ProjectAnalyzer(project_path)
        characteristics = analyzer.analyze_project()
        
        # Step 2: Generate engine recommendation
        engine = EngineRecommendationEngine()
        recommendation = engine.recommend_engine(characteristics, constraints)
        
        # Step 3: Apply user overrides if provided
        if user_overrides:
            override_manager = UserPreferenceOverrideManager()
            recommendation = override_manager.apply_overrides(recommendation, user_overrides)
        
        logger.info("Engine recommendation completed successfully")
        return recommendation
        
    except Exception as e:
        logger.error(f"Engine recommendation failed: {str(e)}")
        raise

if __name__ == "__main__":
    # Example usage and testing
    import sys
    
    if len(sys.argv) > 1:
        project_path = sys.argv[1]
    else:
        project_path = "."
    
    # Generate recommendation
    recommendation = detect_and_recommend_engine(project_path)
    
    # Print results
    print(f"\n🎯 Recommended Engine: {recommendation.recommended_engine}")
    print(f"📊 Confidence Score: {recommendation.confidence_score:.2%}")
    print(f"⏱️  Implementation Timeline: {recommendation.estimated_implementation_weeks} weeks")
    print(f"🔧 Migration Complexity: {recommendation.migration_complexity}")
    
    print(f"\n📋 Key Reasoning:")
    for reason in recommendation.reasoning:
        print(f"  • {reason}")
    
    if recommendation.warnings:
        print(f"\n⚠️  Warnings:")
        for warning in recommendation.warnings:
            print(f"  • {warning}")
    
    if recommendation.considerations:
        print(f"\n💡 Considerations:")
        for consideration in recommendation.considerations:
            print(f"  • {consideration}")
    
    print(f"\n🔄 Alternative Engines: {', '.join(recommendation.alternative_engines)}")
    print(f"🛡️  Fallback Recommendation: {recommendation.fallback_recommendation}")