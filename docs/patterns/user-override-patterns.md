# User Override Patterns for Agent Recommendations

## Overview

This document establishes patterns for allowing users to override, customize, and refine agent recommendations for transformation engine selection and configuration. These patterns ensure user autonomy while maintaining the benefits of intelligent agent guidance.

## Override Architecture

### Override Hierarchy and Precedence

```yaml
override_precedence:
  1_explicit_user_commands:
    priority: "highest"
    description: "Direct user instructions override all agent recommendations"
    examples:
      - "Use SQLmesh regardless of recommendation"
      - "Force dbt for this project"
      - "Never recommend dual-engine approach"
    
  2_project_configuration:
    priority: "high"
    description: "Project-specific override configurations"
    sources:
      - ".agent-config.yml"
      - "pyproject.toml [tool.data-agent]"
      - "package.json data-agent section"
    
  3_user_preferences:
    priority: "medium"
    description: "User preference profiles and settings"
    storage:
      - "~/.data-agent/preferences.yml"
      - "Environment variables"
      - "CLI configuration flags"
    
  4_organizational_policies:
    priority: "medium"
    description: "Company-wide or team-wide policies"
    sources:
      - "Organization configuration repository"
      - "Team policy files"
      - "Compliance requirement specifications"
    
  5_agent_recommendations:
    priority: "baseline"
    description: "Default agent recommendations based on analysis"
    fallback: "Always available as baseline guidance"
```

## Override Pattern Categories

### 1. Engine Selection Override Patterns

#### Force Specific Engine
```yaml
# Pattern: Force Engine Selection
pattern_type: "force_engine_selection"
use_cases:
  - "Organizational standardization requirements"
  - "Team expertise constraints"
  - "Technology stack consistency"
  - "Licensing or compliance requirements"

implementation:
  cli_flag: "--force-engine sqlmesh|dbt|dual"
  config_file:
    engine:
      force: "sqlmesh"
      reason: "Company standard platform"
  
  environment_variable: "DATA_AGENT_FORCE_ENGINE=sqlmesh"
  
  programmatic:
    python: |
      from agents.shared.auto_detection import detect_and_recommend_engine
      
      result = detect_and_recommend_engine(
          project_path="./my_project",
          user_overrides={
              "force_engine": "sqlmesh"
          }
      )

validation:
  - "Verify forced engine is valid option"
  - "Log override reason for audit trail"
  - "Warn about potential suboptimal choice"
  - "Provide fallback recommendations"
```

#### Engine Exclusion Patterns
```yaml
# Pattern: Exclude Specific Engines
pattern_type: "exclude_engines"
use_cases:
  - "Technology restrictions or bans"
  - "Security policy compliance"
  - "Resource or skill limitations"
  - "Vendor relationship constraints"

implementation:
  cli_flag: "--exclude-engines dbt,dual"
  config_file:
    engine:
      exclude:
        - "dual_engine"
        - "experimental_engines"
      reasons:
        dual_engine: "Team too small for complexity"
        experimental: "Production stability required"

  constraint_specification:
    forbidden_technologies:
      - engine: "dbt"
        reason: "License incompatibility"
        effective_date: "2024-01-01"
      - engine: "dual_engine" 
        reason: "Operational complexity"
        review_date: "2024-06-01"

processing_logic: |
  def apply_exclusion_constraints(recommendations, exclusions):
      filtered_recommendations = []
      for rec in recommendations:
          if rec.engine not in exclusions:
              filtered_recommendations.append(rec)
          else:
              rec.add_warning(f"Engine {rec.engine} excluded by policy")
      
      return select_best_alternative(filtered_recommendations)
```

### 2. Requirement and Constraint Override Patterns

#### Budget Constraint Overrides
```yaml
# Pattern: Budget Constraint Override
pattern_type: "budget_constraints"
use_cases:
  - "Startup cost optimization"
  - "Enterprise budget planning"
  - "Department budget limits"
  - "ROI threshold requirements"

implementation:
  detailed_specification:
    budget:
      annual_limit_usd: 50000
      monthly_limit_usd: 5000
      cost_categories:
        - infrastructure: 30000
        - tooling: 10000
        - training: 5000
        - migration: 5000
      
      roi_requirements:
        payback_period_months: 12
        minimum_roi_percent: 25
        
      cost_optimization_priority: "critical"

constraint_application:
  engine_scoring:
    - "Penalize high-cost options"
    - "Boost cost-efficient alternatives" 
    - "Factor in migration costs"
    - "Consider training expenses"
  
  recommendation_adjustment:
    - "Prefer free/open-source options"
    - "Suggest phased implementation"
    - "Recommend cost monitoring"
    - "Provide cost-benefit analysis"

validation_checks:
  - "Verify budget estimates are realistic"
  - "Check against market rates"
  - "Validate ROI calculations"
  - "Flag budget risks and opportunities"
```

#### Timeline Constraint Overrides
```yaml
# Pattern: Timeline Constraint Override  
pattern_type: "timeline_constraints"
use_cases:
  - "Aggressive project deadlines"
  - "Regulatory compliance deadlines"
  - "Business milestone requirements"
  - "Resource availability windows"

implementation:
  timeline_specification:
    constraints:
      max_implementation_weeks: 8
      hard_deadline: "2024-06-30"
      milestone_checkpoints:
        - week: 2
          deliverable: "Tool selection and setup"
        - week: 4
          deliverable: "Initial model migration" 
        - week: 6
          deliverable: "Testing and validation"
        - week: 8
          deliverable: "Production deployment"
    
    resource_availability:
      team_size: 3
      dedicated_hours_per_week: 20
      external_consultant_budget: 15000
      
    risk_tolerance:
      acceptable_feature_reduction: 20%
      parallel_work_streams: true
      overtime_budget_hours: 120

adjustment_strategies:
  rapid_implementation:
    - "Prefer familiar technologies"
    - "Reduce scope to essentials"
    - "Maximize parallel workstreams"
    - "Consider external expertise"
  
  risk_mitigation:
    - "Plan rollback procedures"
    - "Implement in phases"
    - "Increase testing automation"
    - "Prepare contingency plans"
```

### 3. Technical Preference Override Patterns

#### Architecture Preference Overrides
```yaml
# Pattern: Architecture Preference Override
pattern_type: "architecture_preferences"
use_cases:
  - "Microservices vs monolithic preferences"
  - "Cloud-native vs hybrid requirements"
  - "Real-time vs batch processing priorities"
  - "Data governance and compliance needs"

implementation:
  architecture_preferences:
    deployment_model: "cloud_native"
    processing_paradigm: "real_time_preferred"
    data_governance: "strict_compliance"
    scalability_requirements: "auto_scaling"
    
    technical_stack_preferences:
      preferred_languages: ["python", "sql"]
      preferred_cloud_providers: ["aws", "gcp"]
      preferred_data_warehouses: ["snowflake", "bigquery"]
      avoided_technologies: ["proprietary_formats"]
    
    integration_requirements:
      existing_systems:
        - system: "apache_airflow"
          integration_level: "deep"
        - system: "tableau"
          integration_level: "api_only"
      
      api_requirements:
        rest_api_support: "required"
        webhook_support: "preferred"
        graphql_support: "optional"

scoring_adjustments:
  architecture_alignment:
    weight: 0.4
    scoring_logic: |
      def score_architecture_fit(engine, preferences):
          score = 0.0
          
          # Cloud-native preference
          if preferences.deployment_model == "cloud_native":
              cloud_scores = {
                  "sqlmesh": 9.0,
                  "dbt": 8.0, 
                  "dual_engine": 8.5
              }
              score += cloud_scores.get(engine, 5.0) * 0.3
          
          # Real-time processing preference
          if preferences.processing_paradigm == "real_time_preferred":
              realtime_scores = {
                  "sqlmesh": 8.0,
                  "dbt": 5.0,
                  "dual_engine": 7.0
              }
              score += realtime_scores.get(engine, 5.0) * 0.4
          
          # Integration requirements
          integration_score = calculate_integration_compatibility(
              engine, preferences.integration_requirements
          )
          score += integration_score * 0.3
          
          return min(10.0, score)
```

#### Performance Requirement Overrides
```yaml
# Pattern: Performance Requirement Override
pattern_type: "performance_requirements"
use_cases:
  - "High-frequency trading requirements"
  - "Real-time analytics dashboards"
  - "Large-scale batch processing"
  - "Low-latency API requirements"

implementation:
  performance_specifications:
    latency_requirements:
      p95_query_time_ms: 500
      p99_query_time_ms: 1000
      real_time_processing_delay_ms: 100
    
    throughput_requirements:
      queries_per_second: 1000
      data_ingestion_gb_per_hour: 100
      concurrent_users: 500
    
    scalability_requirements:
      auto_scaling: true
      max_compute_resources: "unlimited"
      geographic_distribution: ["us-east", "eu-west", "asia-pacific"]
    
    availability_requirements:
      uptime_sla: 99.99
      recovery_time_objective_minutes: 5
      recovery_point_objective_minutes: 1

performance_impact_assessment:
  engine_performance_profiles:
    sqlmesh:
      query_performance: "excellent"
      batch_processing: "excellent" 
      real_time_capability: "good"
      scalability: "excellent"
    
    dbt:
      query_performance: "good"
      batch_processing: "excellent"
      real_time_capability: "limited"
      scalability: "good"
    
    dual_engine:
      query_performance: "excellent"
      batch_processing: "excellent"
      real_time_capability: "excellent"
      scalability: "good"

recommendation_adjustment:
  performance_scoring:
    weight: 0.5
    critical_requirements:
      - "Filter out engines not meeting minimums"
      - "Boost engines exceeding requirements"
      - "Consider performance optimization costs"
      - "Factor in monitoring and alerting needs"
```

## Override Implementation Patterns

### Configuration File-Based Overrides

#### Project-Level Configuration
```yaml
# File: .agent-config.yml
version: "1.0"
project_name: "customer_analytics_platform"
team: "data_engineering"

overrides:
  engine_selection:
    preferences:
      primary: "sqlmesh"
      fallback: "dbt"
      excluded: ["dual_engine"]
    
    reasoning: "Team expertise in Python and SQL, cost optimization priority"
    
  constraints:
    budget:
      max_annual_usd: 75000
      cost_optimization_priority: "high"
    
    timeline:
      max_implementation_weeks: 12
      hard_deadline: "2024-09-01"
    
    technical:
      required_features: ["virtual_environments", "python_models"]
      preferred_cloud: "aws"
      existing_infrastructure: ["airflow", "redshift"]

validation:
  require_approval: true
  approval_roles: ["tech_lead", "data_architect"]
  override_expiration: "6_months"
  
metadata:
  created_by: "alice@company.com"
  created_date: "2024-01-15"
  last_updated: "2024-02-20"
  review_schedule: "quarterly"
```

#### User-Level Preference Configuration
```yaml
# File: ~/.data-agent/preferences.yml
user_profile:
  name: "Data Engineer"
  experience_level: "senior"
  specializations: ["sql", "python", "data_modeling"]

default_preferences:
  engine_selection:
    bias_towards: "proven_technologies"
    innovation_tolerance: "medium" 
    learning_curve_tolerance: "high"
  
  project_approach:
    risk_tolerance: "medium"
    documentation_completeness: "high"
    test_coverage_requirement: "90_percent"
  
  notification_preferences:
    override_warnings: true
    recommendation_explanations: "detailed"
    alternative_suggestions: true

override_patterns:
  automatic_overrides:
    - condition: "team_size < 3"
      action: "exclude dual_engine"
      reason: "Insufficient team size for complexity"
    
    - condition: "budget < 25000"
      action: "prefer open_source"
      reason: "Budget optimization"
    
    - condition: "existing_dbt_models > 50"
      action: "bias_towards dbt"
      reason: "Existing investment protection"

learning_preferences:
  save_override_history: true
  learn_from_outcomes: true
  adaptation_speed: "gradual"
```

### Programmatic Override Patterns

#### Python API Override Interface
```python
from agents.shared.auto_detection import detect_and_recommend_engine
from agents.shared.override_manager import OverrideManager, UserOverride

class ProjectEngineSelector:
    """Enhanced engine selector with comprehensive override support."""
    
    def __init__(self, project_path: str):
        self.project_path = project_path
        self.override_manager = OverrideManager()
    
    def select_engine_with_overrides(
        self, 
        user_overrides: Optional[Dict[str, Any]] = None,
        config_file: Optional[str] = None
    ) -> EngineRecommendation:
        """Select engine with comprehensive override support."""
        
        # Step 1: Load configuration-based overrides
        config_overrides = self._load_config_overrides(config_file)
        
        # Step 2: Apply user preference defaults
        preference_overrides = self._load_user_preferences()
        
        # Step 3: Merge override sources with precedence
        merged_overrides = self._merge_overrides([
            user_overrides or {},
            config_overrides,
            preference_overrides
        ])
        
        # Step 4: Validate override compatibility
        validated_overrides = self._validate_overrides(merged_overrides)
        
        # Step 5: Generate base recommendation
        base_recommendation = detect_and_recommend_engine(
            self.project_path,
            constraints=validated_overrides.get('constraints')
        )
        
        # Step 6: Apply overrides to recommendation
        final_recommendation = self.override_manager.apply_all_overrides(
            base_recommendation,
            validated_overrides
        )
        
        # Step 7: Log override application for audit
        self._log_override_application(base_recommendation, final_recommendation)
        
        return final_recommendation
    
    def create_override_profile(
        self, 
        profile_name: str,
        overrides: Dict[str, Any],
        description: str = None
    ) -> UserOverride:
        """Create reusable override profile."""
        
        profile = UserOverride(
            name=profile_name,
            description=description or f"Override profile: {profile_name}",
            overrides=overrides,
            created_by=self._get_current_user(),
            created_date=datetime.now()
        )
        
        # Validate profile
        validation_result = self._validate_override_profile(profile)
        if not validation_result.is_valid:
            raise ValueError(f"Invalid override profile: {validation_result.errors}")
        
        # Save profile
        self.override_manager.save_override_profile(profile)
        
        return profile
    
    def _load_config_overrides(self, config_file: Optional[str] = None) -> Dict[str, Any]:
        """Load overrides from configuration file."""
        
        config_paths = [
            config_file,
            os.path.join(self.project_path, '.agent-config.yml'),
            os.path.join(self.project_path, 'pyproject.toml'),
            os.path.join(self.project_path, 'package.json')
        ]
        
        for config_path in config_paths:
            if config_path and os.path.exists(config_path):
                try:
                    return self._parse_config_file(config_path)
                except Exception as e:
                    logger.warning(f"Failed to load config from {config_path}: {e}")
        
        return {}
    
    def _merge_overrides(self, override_sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge multiple override sources with precedence rules."""
        
        merged = {}
        
        for overrides in reversed(override_sources):  # Reverse for precedence
            for key, value in overrides.items():
                if key not in merged:
                    merged[key] = value
                elif isinstance(value, dict) and isinstance(merged[key], dict):
                    merged[key] = {**merged[key], **value}
                else:
                    # Higher precedence override wins
                    pass
        
        return merged
    
    def _validate_overrides(self, overrides: Dict[str, Any]) -> Dict[str, Any]:
        """Validate override compatibility and constraints."""
        
        validated = overrides.copy()
        validation_errors = []
        
        # Validate engine constraints
        if 'force_engine' in overrides and 'exclude_engines' in overrides:
            forced = overrides['force_engine']
            excluded = overrides['exclude_engines']
            
            if forced in excluded:
                validation_errors.append(
                    f"Cannot force engine '{forced}' while excluding it"
                )
        
        # Validate budget constraints
        if 'budget_constraints' in overrides:
            budget = overrides['budget_constraints']
            if budget.get('annual_limit_usd', 0) < 0:
                validation_errors.append("Budget limit cannot be negative")
        
        # Validate timeline constraints
        if 'timeline_constraints' in overrides:
            timeline = overrides['timeline_constraints']
            if timeline.get('max_implementation_weeks', 0) < 1:
                validation_errors.append("Implementation timeline too short")
        
        if validation_errors:
            raise ValueError(f"Override validation failed: {validation_errors}")
        
        return validated
    
    def _log_override_application(
        self, 
        base_recommendation: EngineRecommendation,
        final_recommendation: EngineRecommendation
    ):
        """Log override application for audit trail."""
        
        if base_recommendation.recommended_engine != final_recommendation.recommended_engine:
            logger.info(
                f"Engine recommendation overridden: "
                f"{base_recommendation.recommended_engine} → {final_recommendation.recommended_engine}"
            )
        
        override_log = {
            'timestamp': datetime.now().isoformat(),
            'user': self._get_current_user(),
            'project_path': self.project_path,
            'base_engine': base_recommendation.recommended_engine,
            'final_engine': final_recommendation.recommended_engine,
            'base_confidence': base_recommendation.confidence_score,
            'final_confidence': final_recommendation.confidence_score,
            'override_reasons': final_recommendation.reasoning
        }
        
        # Log to audit trail
        self._write_audit_log(override_log)

# Example usage patterns
def example_usage_patterns():
    """Demonstrate common override usage patterns."""
    
    selector = ProjectEngineSelector("./my_project")
    
    # Pattern 1: Force specific engine
    recommendation = selector.select_engine_with_overrides(
        user_overrides={
            'force_engine': 'sqlmesh',
            'reasoning': 'Company standardization requirement'
        }
    )
    
    # Pattern 2: Budget-constrained selection
    recommendation = selector.select_engine_with_overrides(
        user_overrides={
            'budget_constraints': {
                'annual_limit_usd': 30000,
                'cost_optimization_priority': 'critical'
            }
        }
    )
    
    # Pattern 3: Timeline-driven selection
    recommendation = selector.select_engine_with_overrides(
        user_overrides={
            'timeline_constraints': {
                'max_implementation_weeks': 6,
                'hard_deadline': '2024-06-30'
            }
        }
    )
    
    # Pattern 4: Create reusable override profile
    startup_profile = selector.create_override_profile(
        profile_name="startup_constraints",
        overrides={
            'budget_constraints': {'annual_limit_usd': 25000},
            'timeline_constraints': {'max_implementation_weeks': 8},
            'exclude_engines': ['dual_engine'],
            'technical_preferences': {
                'prefer_open_source': True,
                'cloud_native_preferred': True
            }
        },
        description="Standard constraints for startup projects"
    )
```

### CLI Override Patterns

#### Command Line Interface
```bash
# Basic engine forcing
data-agent recommend --force-engine sqlmesh ./project

# Budget constraints
data-agent recommend --max-budget 50000 --cost-priority high ./project

# Timeline constraints  
data-agent recommend --max-weeks 8 --deadline "2024-06-30" ./project

# Multiple constraints
data-agent recommend \
    --exclude-engines dual_engine \
    --max-budget 30000 \
    --max-weeks 10 \
    --prefer-features virtual_environments,python_models \
    --cloud-preference aws \
    ./project

# Configuration file override
data-agent recommend --config .agent-config.yml ./project

# User preference profile
data-agent recommend --profile startup_constraints ./project

# Interactive override mode
data-agent recommend --interactive ./project

# Override validation mode
data-agent validate-overrides --config .agent-config.yml ./project

# Override history and audit
data-agent override-history --user alice@company.com --days 30
```

## Override Validation and Safety

### Validation Framework

```python
class OverrideValidator:
    """Comprehensive validation framework for user overrides."""
    
    def __init__(self):
        self.validation_rules = self._load_validation_rules()
        self.safety_checks = self._load_safety_checks()
    
    def validate_override_request(self, overrides: Dict[str, Any]) -> ValidationResult:
        """Comprehensive override validation."""
        
        result = ValidationResult()
        
        # Step 1: Schema validation
        schema_result = self._validate_override_schema(overrides)
        result.merge(schema_result)
        
        # Step 2: Logical consistency validation
        consistency_result = self._validate_logical_consistency(overrides)
        result.merge(consistency_result)
        
        # Step 3: Safety and risk validation
        safety_result = self._validate_safety_constraints(overrides)
        result.merge(safety_result)
        
        # Step 4: Business rule validation
        business_result = self._validate_business_rules(overrides)
        result.merge(business_result)
        
        return result
    
    def _validate_override_schema(self, overrides: Dict[str, Any]) -> ValidationResult:
        """Validate override structure and data types."""
        
        result = ValidationResult()
        
        schema = {
            'force_engine': {'type': 'string', 'allowed': ['sqlmesh', 'dbt', 'dual_engine']},
            'exclude_engines': {'type': 'list', 'items': {'type': 'string'}},
            'budget_constraints': {
                'type': 'dict',
                'schema': {
                    'annual_limit_usd': {'type': 'float', 'min': 0},
                    'monthly_limit_usd': {'type': 'float', 'min': 0},
                    'cost_optimization_priority': {
                        'type': 'string',
                        'allowed': ['low', 'medium', 'high', 'critical']
                    }
                }
            },
            'timeline_constraints': {
                'type': 'dict',
                'schema': {
                    'max_implementation_weeks': {'type': 'integer', 'min': 1, 'max': 52},
                    'hard_deadline': {'type': 'string'},  # ISO date format
                    'milestone_checkpoints': {'type': 'list'}
                }
            }
        }
        
        # Validate using schema
        try:
            from cerberus import Validator
            validator = Validator(schema)
            
            if not validator.validate(overrides):
                result.add_errors(validator.errors)
                result.is_valid = False
            
        except ImportError:
            # Fallback validation without cerberus
            result = self._basic_schema_validation(overrides, schema)
        
        return result
    
    def _validate_logical_consistency(self, overrides: Dict[str, Any]) -> ValidationResult:
        """Validate logical consistency of override combinations."""
        
        result = ValidationResult()
        
        # Check force vs exclude conflicts
        forced_engine = overrides.get('force_engine')
        excluded_engines = overrides.get('exclude_engines', [])
        
        if forced_engine and forced_engine in excluded_engines:
            result.add_error(
                f"Cannot force engine '{forced_engine}' while excluding it"
            )
        
        # Check budget vs timeline consistency
        budget = overrides.get('budget_constraints', {})
        timeline = overrides.get('timeline_constraints', {})
        
        if (budget.get('annual_limit_usd', float('inf')) < 25000 and 
            timeline.get('max_implementation_weeks', 52) < 8):
            result.add_warning(
                "Very low budget with aggressive timeline may not be achievable"
            )
        
        # Check technical requirement consistency
        tech_prefs = overrides.get('technical_preferences', {})
        required_features = tech_prefs.get('required_features', [])
        
        if 'real_time_processing' in required_features and forced_engine == 'dbt':
            result.add_warning(
                "dbt has limited real-time processing capabilities"
            )
        
        return result
    
    def _validate_safety_constraints(self, overrides: Dict[str, Any]) -> ValidationResult:
        """Validate safety constraints and risk thresholds."""
        
        result = ValidationResult()
        
        # Check for risky override combinations
        risk_score = 0.0
        
        # Budget risk assessment
        budget = overrides.get('budget_constraints', {})
        if budget.get('annual_limit_usd', float('inf')) < 15000:
            risk_score += 0.3
            result.add_warning("Very low budget may limit implementation options")
        
        # Timeline risk assessment
        timeline = overrides.get('timeline_constraints', {})
        if timeline.get('max_implementation_weeks', 52) < 4:
            risk_score += 0.4
            result.add_warning("Extremely aggressive timeline increases failure risk")
        
        # Technology risk assessment
        if overrides.get('force_engine') and risk_score > 0.3:
            risk_score += 0.2
            result.add_warning("Forcing engine selection with other constraints increases risk")
        
        # Overall risk assessment
        if risk_score > 0.7:
            result.add_error(
                f"Override combination has high risk score ({risk_score:.1f}). "
                f"Consider reducing constraints or accepting higher implementation risk."
            )
        
        return result

@dataclass
class ValidationResult:
    """Validation result container."""
    
    is_valid: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    
    def add_error(self, error: str):
        self.errors.append(error)
        self.is_valid = False
    
    def add_warning(self, warning: str):
        self.warnings.append(warning)
    
    def add_suggestion(self, suggestion: str):
        self.suggestions.append(suggestion)
    
    def merge(self, other: 'ValidationResult'):
        self.is_valid = self.is_valid and other.is_valid
        self.errors.extend(other.errors)
        self.warnings.extend(other.warnings)
        self.suggestions.extend(other.suggestions)
```

## Best Practices and Guidelines

### Override Usage Guidelines

```yaml
override_best_practices:
  when_to_use_overrides:
    appropriate_scenarios:
      - "Organizational policy requirements"
      - "Technical constraints not detected by agent"
      - "Resource or timeline limitations"
      - "Risk tolerance adjustments"
    
    avoid_overriding_when:
      - "Agent recommendation is only slightly different"
      - "Override is based on incomplete information"
      - "Personal preference without business justification"
      - "Overriding safety recommendations without understanding risks"
  
  override_documentation:
    required_information:
      - "Business justification for override"
      - "Technical rationale if applicable"
      - "Risk assessment and mitigation"
      - "Success criteria and metrics"
    
    recommended_format:
      reasoning: "Clear explanation of why override is needed"
      alternatives_considered: "Other options that were evaluated"
      risks_accepted: "Known risks being accepted with override"
      review_schedule: "When to reassess override decision"
  
  governance_and_approval:
    approval_requirements:
      low_risk: "Team lead approval"
      medium_risk: "Engineering manager approval"
      high_risk: "Architecture review board approval"
    
    audit_requirements:
      - "All overrides logged with timestamp and user"
      - "Quarterly review of override effectiveness"
      - "Annual review of override patterns and policies"
```

### Common Override Anti-Patterns

```yaml
override_anti_patterns:
  over_constraining:
    problem: "Too many simultaneous constraints that conflict"
    symptoms:
      - "No valid recommendations possible"
      - "All engines excluded by constraints"
      - "Impossible budget/timeline combinations"
    solution: "Prioritize constraints and accept trade-offs"
  
  micro_management:
    problem: "Over-specifying technical details unnecessarily"
    symptoms:
      - "Forcing specific implementation details"
      - "Overriding based on personal preferences"
      - "Not trusting agent expertise in areas of competence"
    solution: "Focus on business requirements, let agent optimize technical details"
  
  outdated_preferences:
    problem: "Using old preferences that no longer apply"
    symptoms:
      - "Preferences based on obsolete technology assessments"
      - "Team skill assessments that haven't been updated"
      - "Budget constraints from previous fiscal year"
    solution: "Regular review and update of preference profiles"
  
  inconsistent_overrides:
    problem: "Different override patterns for similar projects"
    symptoms:
      - "Same team using different constraints for similar projects"
      - "Conflicting organizational policies in different departments"
      - "Override decisions not documented or shared"
    solution: "Establish organizational override standards and templates"
```

This comprehensive guide provides robust patterns for user override capabilities while maintaining the benefits of intelligent agent recommendations and ensuring system safety and consistency.