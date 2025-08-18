"""
Transformation Engine Selection Logic for Data Engineer Agent

This module implements the decision algorithm for selecting the optimal
transformation engine (SQLmesh, dbt, or dual-engine) based on project
characteristics and requirements.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class TransformationEngine(Enum):
    """Supported transformation engines."""
    SQLMESH = "sqlmesh"
    DBT = "dbt"
    DUAL_ENGINE = "dual_engine"


class ConfidenceLevel(Enum):
    """Confidence levels for recommendations."""
    HIGH = "high"      # >70%
    MEDIUM = "medium"  # 50-70%
    LOW = "low"        # <50%


@dataclass
class ProjectCharacteristics:
    """Project characteristics used for engine selection."""
    # Cost factors
    monthly_warehouse_cost: float = 0.0
    cost_optimization_priority: int = 1  # 1-5 scale
    
    # Deployment factors
    zero_downtime_required: bool = False
    deployment_frequency: int = 1  # deployments per week
    production_criticality: int = 3  # 1-5 scale
    
    # Team factors
    team_dbt_experience_months: int = 0
    team_sqlmesh_experience_months: int = 0
    team_size: int = 1
    
    # Technical factors
    model_count: int = 0
    python_models_count: int = 0
    complex_transformations: bool = False
    needs_isolation: bool = False
    
    # Project factors
    is_greenfield: bool = True
    existing_dbt_models: int = 0
    migration_tolerance: int = 3  # 1-5 scale (1=risk averse, 5=high tolerance)
    
    # Integration requirements
    bi_tool_integrations: List[str] = None
    orchestrator_requirements: List[str] = None
    data_catalog_integration: bool = False
    
    def __post_init__(self):
        if self.bi_tool_integrations is None:
            self.bi_tool_integrations = []
        if self.orchestrator_requirements is None:
            self.orchestrator_requirements = []


@dataclass
class EngineRecommendation:
    """Engine recommendation with rationale and confidence."""
    engine: TransformationEngine
    confidence: ConfidenceLevel
    score: float
    rationale: List[str]
    considerations: List[str]
    migration_complexity: Optional[str] = None
    estimated_timeline: Optional[str] = None


class EngineSelectionService:
    """Service for selecting optimal transformation engine."""
    
    # Decision weights (must sum to 100)
    WEIGHTS = {
        'cost_optimization': 25,
        'deployment_safety': 20,
        'team_experience': 15,
        'project_complexity': 15,
        'virtual_environment': 10,
        'ecosystem_maturity': 10,
        'python_integration': 5
    }
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def recommend_engine(self, characteristics: ProjectCharacteristics) -> EngineRecommendation:
        """
        Recommend optimal transformation engine based on project characteristics.
        
        Args:
            characteristics: Project characteristics for evaluation
            
        Returns:
            EngineRecommendation with engine choice and rationale
        """
        self.logger.info("Starting engine selection analysis")
        
        # Calculate scores for each engine
        scores = self._calculate_scores(characteristics)
        
        # Determine recommendation
        recommended_engine = max(scores, key=scores.get)
        max_score = scores[recommended_engine]
        
        # Determine confidence level
        confidence = self._calculate_confidence(max_score)
        
        # Generate rationale and considerations
        rationale = self._generate_rationale(characteristics, scores, recommended_engine)
        considerations = self._generate_considerations(characteristics, recommended_engine)
        
        # Estimate migration complexity and timeline
        migration_info = self._estimate_migration(characteristics, recommended_engine)
        
        recommendation = EngineRecommendation(
            engine=TransformationEngine(recommended_engine),
            confidence=confidence,
            score=max_score,
            rationale=rationale,
            considerations=considerations,
            migration_complexity=migration_info.get('complexity'),
            estimated_timeline=migration_info.get('timeline')
        )
        
        self.logger.info(f"Recommendation: {recommended_engine} with {confidence.value} confidence")
        return recommendation
    
    def _calculate_scores(self, chars: ProjectCharacteristics) -> Dict[str, float]:
        """Calculate weighted scores for each engine option."""
        scores = {
            'sqlmesh': 0.0,
            'dbt': 0.0,
            'dual_engine': 0.0
        }
        
        # Cost optimization factor (25% weight)
        cost_scores = self._score_cost_optimization(chars)
        for engine, score in cost_scores.items():
            scores[engine] += score * (self.WEIGHTS['cost_optimization'] / 100)
        
        # Deployment safety factor (20% weight)
        deployment_scores = self._score_deployment_safety(chars)
        for engine, score in deployment_scores.items():
            scores[engine] += score * (self.WEIGHTS['deployment_safety'] / 100)
        
        # Team experience factor (15% weight)
        experience_scores = self._score_team_experience(chars)
        for engine, score in experience_scores.items():
            scores[engine] += score * (self.WEIGHTS['team_experience'] / 100)
        
        # Project complexity factor (15% weight)
        complexity_scores = self._score_project_complexity(chars)
        for engine, score in complexity_scores.items():
            scores[engine] += score * (self.WEIGHTS['project_complexity'] / 100)
        
        # Virtual environment benefits (10% weight)
        virtual_scores = self._score_virtual_environment(chars)
        for engine, score in virtual_scores.items():
            scores[engine] += score * (self.WEIGHTS['virtual_environment'] / 100)
        
        # Ecosystem maturity (10% weight)
        ecosystem_scores = self._score_ecosystem_maturity(chars)
        for engine, score in ecosystem_scores.items():
            scores[engine] += score * (self.WEIGHTS['ecosystem_maturity'] / 100)
        
        # Python integration (5% weight)
        python_scores = self._score_python_integration(chars)
        for engine, score in python_scores.items():
            scores[engine] += score * (self.WEIGHTS['python_integration'] / 100)
        
        return scores
    
    def _score_cost_optimization(self, chars: ProjectCharacteristics) -> Dict[str, float]:
        """Score engines based on cost optimization capabilities."""
        scores = {'sqlmesh': 0, 'dbt': 0, 'dual_engine': 0}
        
        # High warehouse costs favor SQLmesh
        if chars.monthly_warehouse_cost > 15000:
            scores['sqlmesh'] = 100
            scores['dual_engine'] = 60
            scores['dbt'] = 20
        elif chars.monthly_warehouse_cost > 5000:
            scores['sqlmesh'] = 80
            scores['dual_engine'] = 50
            scores['dbt'] = 30
        else:
            scores['sqlmesh'] = 60
            scores['dual_engine'] = 40
            scores['dbt'] = 50
        
        # Cost optimization priority modifier
        if chars.cost_optimization_priority >= 4:
            scores['sqlmesh'] *= 1.2
            scores['dual_engine'] *= 1.1
        
        return scores
    
    def _score_deployment_safety(self, chars: ProjectCharacteristics) -> Dict[str, float]:
        """Score engines based on deployment safety requirements."""
        scores = {'sqlmesh': 0, 'dbt': 0, 'dual_engine': 0}
        
        if chars.zero_downtime_required:
            scores['sqlmesh'] = 100
            scores['dual_engine'] = 75
            scores['dbt'] = 20
        else:
            scores['sqlmesh'] = 80
            scores['dual_engine'] = 60
            scores['dbt'] = 50
        
        # Production criticality modifier
        if chars.production_criticality >= 4:
            scores['sqlmesh'] *= 1.2
            scores['dual_engine'] *= 1.1
        
        # Deployment frequency modifier
        if chars.deployment_frequency > 5:  # More than daily
            scores['sqlmesh'] *= 1.3
            scores['dual_engine'] *= 1.2
        
        return scores
    
    def _score_team_experience(self, chars: ProjectCharacteristics) -> Dict[str, float]:
        """Score engines based on team experience and capabilities."""
        scores = {'sqlmesh': 0, 'dbt': 0, 'dual_engine': 0}
        
        # dbt experience advantage
        if chars.team_dbt_experience_months > 12:
            scores['dbt'] = 100
            scores['dual_engine'] = 80
            scores['sqlmesh'] = 30
        elif chars.team_dbt_experience_months > 6:
            scores['dbt'] = 80
            scores['dual_engine'] = 70
            scores['sqlmesh'] = 40
        else:
            # No strong dbt experience - SQLmesh may be easier to learn fresh
            scores['sqlmesh'] = 70
            scores['dbt'] = 60
            scores['dual_engine'] = 50
        
        # SQLmesh experience bonus
        if chars.team_sqlmesh_experience_months > 3:
            scores['sqlmesh'] += 30
            scores['dual_engine'] += 20
        
        return scores
    
    def _score_project_complexity(self, chars: ProjectCharacteristics) -> Dict[str, float]:
        """Score engines based on project complexity requirements."""
        scores = {'sqlmesh': 0, 'dbt': 0, 'dual_engine': 0}
        
        base_scores = {'sqlmesh': 80, 'dbt': 70, 'dual_engine': 90}
        
        # Model count considerations
        if chars.model_count > 100:
            base_scores['dual_engine'] += 20
            base_scores['sqlmesh'] += 10
        elif chars.model_count > 50:
            base_scores['dual_engine'] += 10
            base_scores['sqlmesh'] += 5
        
        # Complex transformations favor SQLmesh
        if chars.complex_transformations:
            base_scores['sqlmesh'] += 20
            base_scores['dual_engine'] += 10
        
        return base_scores
    
    def _score_virtual_environment(self, chars: ProjectCharacteristics) -> Dict[str, float]:
        """Score engines based on virtual environment benefits."""
        scores = {'sqlmesh': 0, 'dbt': 0, 'dual_engine': 0}
        
        if chars.needs_isolation or chars.monthly_warehouse_cost > 10000:
            scores['sqlmesh'] = 100
            scores['dual_engine'] = 80
            scores['dbt'] = 20
        else:
            scores['sqlmesh'] = 60
            scores['dual_engine'] = 40
            scores['dbt'] = 50
        
        return scores
    
    def _score_ecosystem_maturity(self, chars: ProjectCharacteristics) -> Dict[str, float]:
        """Score engines based on ecosystem maturity requirements."""
        scores = {'sqlmesh': 0, 'dbt': 0, 'dual_engine': 0}
        
        # Base maturity scores
        scores['dbt'] = 100
        scores['dual_engine'] = 80
        scores['sqlmesh'] = 60
        
        # Integration requirements favor dbt
        if chars.data_catalog_integration:
            scores['dbt'] += 20
            scores['dual_engine'] += 10
        
        if len(chars.bi_tool_integrations) > 2:
            scores['dbt'] += 20
            scores['dual_engine'] += 10
        
        return scores
    
    def _score_python_integration(self, chars: ProjectCharacteristics) -> Dict[str, float]:
        """Score engines based on Python integration needs."""
        scores = {'sqlmesh': 0, 'dbt': 0, 'dual_engine': 0}
        
        if chars.python_models_count > 10:
            scores['sqlmesh'] = 100
            scores['dual_engine'] = 80
            scores['dbt'] = 30
        elif chars.python_models_count > 0:
            scores['sqlmesh'] = 80
            scores['dual_engine'] = 60
            scores['dbt'] = 40
        else:
            scores['sqlmesh'] = 50
            scores['dual_engine'] = 50
            scores['dbt'] = 50
        
        return scores
    
    def _calculate_confidence(self, max_score: float) -> ConfidenceLevel:
        """Calculate confidence level based on maximum score."""
        if max_score >= 70:
            return ConfidenceLevel.HIGH
        elif max_score >= 50:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW
    
    def _generate_rationale(
        self, 
        chars: ProjectCharacteristics, 
        scores: Dict[str, float], 
        recommended_engine: str
    ) -> List[str]:
        """Generate rationale for the recommendation."""
        rationale = []
        
        # Cost optimization rationale
        if chars.monthly_warehouse_cost > 10000 and recommended_engine == 'sqlmesh':
            rationale.append(f"High warehouse costs (${chars.monthly_warehouse_cost:,.0f}/month) justify SQLmesh for 15-40% cost reduction")
        
        # Deployment safety rationale
        if chars.zero_downtime_required and recommended_engine == 'sqlmesh':
            rationale.append("Zero-downtime requirement makes SQLmesh blue-green deployment essential")
        
        # Team experience rationale
        if chars.team_dbt_experience_months > 12 and recommended_engine == 'dbt':
            rationale.append(f"Strong dbt experience ({chars.team_dbt_experience_months} months) should be leveraged")
        elif chars.team_dbt_experience_months > 6 and recommended_engine == 'dual_engine':
            rationale.append("Existing dbt experience supports gradual migration via dual-engine approach")
        
        # Technical rationale
        if chars.python_models_count > 5 and recommended_engine in ['sqlmesh', 'dual_engine']:
            rationale.append(f"Python model requirements ({chars.python_models_count} models) favor SQLmesh capabilities")
        
        # Project characteristics rationale
        if chars.is_greenfield and recommended_engine == 'sqlmesh':
            rationale.append("Greenfield project allows adoption of modern SQLmesh approach")
        elif chars.existing_dbt_models > 25 and recommended_engine == 'dual_engine':
            rationale.append(f"Existing dbt investment ({chars.existing_dbt_models} models) supports dual-engine strategy")
        
        return rationale
    
    def _generate_considerations(
        self, 
        chars: ProjectCharacteristics, 
        recommended_engine: str
    ) -> List[str]:
        """Generate important considerations for the recommendation."""
        considerations = []
        
        if recommended_engine == 'sqlmesh':
            if chars.team_dbt_experience_months > 6:
                considerations.append("Team will need SQLmesh training - budget 2-4 weeks learning time")
            if len(chars.bi_tool_integrations) > 1:
                considerations.append("Verify BI tool compatibility with SQLmesh outputs")
            considerations.append("Plan for blue-green deployment infrastructure setup")
        
        elif recommended_engine == 'dbt':
            if chars.monthly_warehouse_cost > 10000:
                considerations.append("Monitor warehouse costs closely - consider SQLmesh if costs grow")
            if chars.zero_downtime_required:
                considerations.append("Implement custom blue-green deployment process")
            if chars.python_models_count > 0:
                considerations.append("Plan external orchestration for Python transformations")
        
        elif recommended_engine == 'dual_engine':
            considerations.append("Establish clear criteria for which engine to use for new models")
            considerations.append("Plan cross-engine dependency management strategy")
            considerations.append("Design unified deployment and monitoring approach")
            considerations.append("Budget additional complexity for maintaining two systems")
        
        return considerations
    
    def _estimate_migration(
        self, 
        chars: ProjectCharacteristics, 
        recommended_engine: str
    ) -> Dict[str, str]:
        """Estimate migration complexity and timeline."""
        if recommended_engine == 'dbt' or chars.existing_dbt_models == 0:
            return {'complexity': 'N/A', 'timeline': 'N/A'}
        
        complexity = 'Low'
        timeline = '1-2 weeks'
        
        if chars.existing_dbt_models > 100:
            complexity = 'High'
            timeline = '3-6 months'
        elif chars.existing_dbt_models > 25:
            complexity = 'Medium'
            timeline = '1-2 months'
        
        # Adjust for other factors
        if chars.python_models_count > 10:
            if complexity == 'Low':
                complexity = 'Medium'
                timeline = '1-2 months'
            elif complexity == 'Medium':
                complexity = 'High'
                timeline = '3-6 months'
        
        return {'complexity': complexity, 'timeline': timeline}


def create_recommendation_report(recommendation: EngineRecommendation) -> str:
    """Create a formatted recommendation report."""
    report = f"""
# Transformation Engine Recommendation Report

## Recommendation: {recommendation.engine.value.upper()}
**Confidence Level**: {recommendation.confidence.value.upper()} ({recommendation.score:.1f}/100)

## Rationale
{chr(10).join(f"• {reason}" for reason in recommendation.rationale)}

## Key Considerations
{chr(10).join(f"• {consideration}" for consideration in recommendation.considerations)}
"""
    
    if recommendation.migration_complexity:
        report += f"""
## Migration Assessment
**Complexity**: {recommendation.migration_complexity}
**Estimated Timeline**: {recommendation.estimated_timeline}
"""
    
    return report


# Example usage and testing
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Example project characteristics
    example_project = ProjectCharacteristics(
        monthly_warehouse_cost=12000,
        cost_optimization_priority=4,
        zero_downtime_required=True,
        team_dbt_experience_months=8,
        model_count=45,
        python_models_count=5,
        existing_dbt_models=30,
        is_greenfield=False
    )
    
    # Create service and get recommendation
    service = EngineSelectionService()
    recommendation = service.recommend_engine(example_project)
    
    # Print report
    print(create_recommendation_report(recommendation))