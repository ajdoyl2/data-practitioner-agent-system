# Agent Selection Decision Flowchart

## Overview

This document provides visual decision trees and flowcharts for transformation engine selection logic, user override processing, and agent recommendation workflows. These flowcharts serve as both documentation and implementation guides for the intelligent agent system.

## Visual Decision Flow Legend

```
[Decision Node]     - Diamond shape, contains yes/no questions
(Process Node)      - Rectangle shape, contains actions or processes
{Input/Output}      - Parallelogram shape, contains data inputs/outputs
((Start/End))       - Circle shape, contains flow start/end points
```

## Primary Engine Selection Decision Tree

```mermaid
flowchart TD
    Start((Start Engine Selection)) --> ProjectInput{Project Path Provided?}
    
    ProjectInput -->|No| Error[["Error: Invalid Input"]]
    ProjectInput -->|Yes| AnalyzeProject(Analyze Project Characteristics)
    
    AnalyzeProject --> CheckOverrides{User Overrides Provided?}
    
    CheckOverrides -->|Yes| ValidateOverrides(Validate Override Compatibility)
    CheckOverrides -->|No| GenerateScores(Generate Engine Scores)
    
    ValidateOverrides --> OverrideValid{Overrides Valid?}
    OverrideValid -->|No| OverrideError[["Error: Invalid Overrides"]]
    OverrideValid -->|Yes| ApplyOverrides(Apply Override Constraints)
    
    ApplyOverrides --> GenerateScores
    
    GenerateScores --> SQLMeshScore[Calculate SQLMesh Score]
    GenerateScores --> DBTScore[Calculate dbt Score]
    GenerateScores --> DualScore[Calculate Dual Engine Score]
    
    SQLMeshScore --> CompareScores{Compare All Scores}
    DBTScore --> CompareScores
    DualScore --> CompareScores
    
    CompareScores --> SQLMeshWins{SQLMesh Highest?}
    CompareScores --> DBTWins{dbt Highest?}
    CompareScores --> DualWins{Dual Engine Highest?}
    
    SQLMeshWins -->|Yes| CheckSQLMeshConstraints{Meets Constraints?}
    DBTWins -->|Yes| CheckDBTConstraints{Meets Constraints?}
    DualWins -->|Yes| CheckDualConstraints{Meets Constraints?}
    
    CheckSQLMeshConstraints -->|Yes| RecommendSQLMesh[["Recommend: SQLMesh"]]
    CheckSQLMeshConstraints -->|No| FallbackAnalysis(Analyze Fallback Options)
    
    CheckDBTConstraints -->|Yes| RecommendDBT[["Recommend: dbt"]]
    CheckDBTConstraints -->|No| FallbackAnalysis
    
    CheckDualConstraints -->|Yes| RecommendDual[["Recommend: Dual Engine"]]
    CheckDualConstraints -->|No| FallbackAnalysis
    
    FallbackAnalysis --> FallbackChoice{Best Fallback Available?}
    FallbackChoice -->|Yes| RecommendFallback[["Recommend: Fallback Engine"]]
    FallbackChoice -->|No| NoValidOption[["Error: No Valid Engine Option"]]
    
    RecommendSQLMesh --> GenerateReport(Generate Recommendation Report)
    RecommendDBT --> GenerateReport
    RecommendDual --> GenerateReport
    RecommendFallback --> GenerateReport
    
    GenerateReport --> End((Return Recommendation))
```

## Project Characteristic Analysis Flow

```mermaid
flowchart TD
    StartAnalysis((Start Project Analysis)) --> CheckPath{Project Path Exists?}
    
    CheckPath -->|No| PathError[["Error: Path Not Found"]]
    CheckPath -->|Yes| ScanFiles(Scan Project Files)
    
    ScanFiles --> SQLFiles[Count SQL Files]
    ScanFiles --> PythonFiles[Count Python Files]
    ScanFiles --> ConfigFiles[Check Configuration Files]
    
    SQLFiles --> AnalyzeSQL(Analyze SQL Complexity)
    PythonFiles --> AnalyzePython(Analyze Python Usage)
    ConfigFiles --> DetectTools(Detect Existing Tools)
    
    AnalyzeSQL --> ComplexityScore[Calculate Complexity Score]
    AnalyzePython --> PythonRatio[Calculate Python Usage Ratio]
    DetectTools --> ExistingTools[Identify Current Stack]
    
    ComplexityScore --> InferTeamSize(Infer Team Size)
    PythonRatio --> InferTeamSize
    ExistingTools --> InferTeamSize
    
    InferTeamSize --> EstimateVolume(Estimate Data Volume)
    EstimateVolume --> AssessRequirements(Assess Technical Requirements)
    AssessRequirements --> CharacteristicsComplete[["Project Characteristics Complete"]]
```

## User Override Processing Decision Tree

```mermaid
flowchart TD
    StartOverride((Start Override Processing)) --> HasOverrides{Overrides Provided?}
    
    HasOverrides -->|No| UseDefaults[["Use Default Recommendations"]]
    HasOverrides -->|Yes| OverrideType{What Override Type?}
    
    OverrideType -->|Force Engine| ForceEngine(Process Force Engine Override)
    OverrideType -->|Exclude Engines| ExcludeEngines(Process Engine Exclusion)
    OverrideType -->|Budget Constraints| BudgetConstraints(Process Budget Override)
    OverrideType -->|Timeline Constraints| TimelineConstraints(Process Timeline Override)
    OverrideType -->|Technical Preferences| TechPrefs(Process Technical Preferences)
    
    ForceEngine --> ValidateForce{Valid Engine Specified?}
    ValidateForce -->|No| ForceError[["Error: Invalid Engine"]]
    ValidateForce -->|Yes| CheckForceConflict{Conflicts with Exclusions?}
    
    CheckForceConflict -->|Yes| ConflictError[["Error: Force/Exclude Conflict"]]
    CheckForceConflict -->|No| ApplyForce(Apply Forced Selection)
    
    ExcludeEngines --> ValidateExclusions{Valid Exclusion List?}
    ValidateExclusions -->|No| ExclusionError[["Error: Invalid Exclusions"]]
    ValidateExclusions -->|Yes| CheckAllExcluded{All Engines Excluded?}
    
    CheckAllExcluded -->|Yes| NoOptionsError[["Error: No Valid Options"]]
    CheckAllExcluded -->|No| ApplyExclusions(Apply Engine Exclusions)
    
    BudgetConstraints --> ValidateBudget{Budget Values Valid?}
    ValidateBudget -->|No| BudgetError[["Error: Invalid Budget"]]
    ValidateBudget -->|Yes| ApplyBudgetConstraints(Apply Budget Constraints)
    
    TimelineConstraints --> ValidateTimeline{Timeline Values Valid?}
    ValidateTimeline -->|No| TimelineError[["Error: Invalid Timeline"]]
    ValidateTimeline -->|Yes| ApplyTimelineConstraints(Apply Timeline Constraints)
    
    TechPrefs --> ValidateTechPrefs{Technical Preferences Valid?}
    ValidateTechPrefs -->|No| TechPrefError[["Error: Invalid Tech Prefs"]]
    ValidateTechPrefs -->|Yes| ApplyTechPrefs(Apply Technical Preferences)
    
    ApplyForce --> RecalculateScores(Recalculate Engine Scores)
    ApplyExclusions --> RecalculateScores
    ApplyBudgetConstraints --> RecalculateScores
    ApplyTimelineConstraints --> RecalculateScores
    ApplyTechPrefs --> RecalculateScores
    
    RecalculateScores --> OverrideComplete[["Override Processing Complete"]]
```

## Risk Assessment Decision Flow

```mermaid
flowchart TD
    StartRisk((Start Risk Assessment)) --> AnalyzeRisk(Calculate Risk Factors)
    
    AnalyzeRisk --> MigrationRisk[Assess Migration Risk]
    AnalyzeRisk --> TeamRisk[Assess Team Readiness Risk]  
    AnalyzeRisk --> TechRisk[Assess Technical Risk]
    AnalyzeRisk --> CostRisk[Assess Cost Risk]
    
    MigrationRisk --> RiskScore(Calculate Weighted Risk Score)
    TeamRisk --> RiskScore
    TechRisk --> RiskScore
    CostRisk --> RiskScore
    
    RiskScore --> CheckRiskLevel{Risk Level Assessment}
    
    CheckRiskLevel -->|Low Risk < 0.3| LowRisk[["Low Risk - Proceed"]]
    CheckRiskLevel -->|Medium Risk 0.3-0.6| MediumRisk[["Medium Risk - Add Warnings"]]
    CheckRiskLevel -->|High Risk 0.6-0.8| HighRisk[["High Risk - Require Approval"]]
    CheckRiskLevel -->|Critical Risk > 0.8| CriticalRisk[["Critical Risk - Block or Require Admin"]]
    
    MediumRisk --> GenerateWarnings(Generate Risk Warnings)
    HighRisk --> GenerateWarnings
    CriticalRisk --> GenerateWarnings
    
    GenerateWarnings --> SuggestMitigation(Suggest Risk Mitigation)
    SuggestMitigation --> RiskComplete[["Risk Assessment Complete"]]
    
    LowRisk --> RiskComplete
```

## Fallback Strategy Decision Tree

```mermaid
flowchart TD
    StartFallback((Start Fallback Processing)) --> FallbackTrigger{Why Fallback Needed?}
    
    FallbackTrigger -->|Primary Recommendation Failed| PrimaryFailed(Primary Engine Issues)
    FallbackTrigger -->|Constraints Too Restrictive| ConstraintIssues(Constraint Problems)
    FallbackTrigger -->|User Override Conflicts| OverrideIssues(Override Conflicts)
    FallbackTrigger -->|System Error| SystemError(Technical Problems)
    
    PrimaryFailed --> CheckAlternatives{Alternatives Available?}
    ConstraintIssues --> RelaxConstraints(Suggest Constraint Relaxation)
    OverrideIssues --> ResolveOverrides(Resolve Override Conflicts)
    SystemError --> SafeMode(Enter Safe Mode)
    
    CheckAlternatives -->|Yes| SelectBestAlternative(Select Best Alternative Engine)
    CheckAlternatives -->|No| NoAlternatives[["No Viable Alternatives"]]
    
    SelectBestAlternative --> ValidateAlternative{Alternative Meets Minimum Requirements?}
    ValidateAlternative -->|Yes| RecommendAlternative[["Recommend Alternative Engine"]]
    ValidateAlternative -->|No| CheckNextAlternative{More Alternatives?}
    
    CheckNextAlternative -->|Yes| SelectBestAlternative
    CheckNextAlternative -->|No| NoViableOptions[["No Viable Options Available"]]
    
    RelaxConstraints --> SuggestModifications[["Suggest Constraint Modifications"]]
    ResolveOverrides --> SuggestResolutions[["Suggest Override Resolutions"]]
    SafeMode --> UseDefaultEngine[["Use Default Safe Engine (dbt)"]]
    
    RecommendAlternative --> FallbackComplete[["Fallback Complete"]]
    UseDefaultEngine --> FallbackComplete
    
    NoAlternatives --> ErrorHandling(Initiate Error Handling)
    NoViableOptions --> ErrorHandling
    ErrorHandling --> FallbackFailed[["Fallback Strategy Failed"]]
```

## Feature Flag Integration Flow

```mermaid
flowchart TD
    StartFlags((Start Feature Flag Check)) --> LoadFlags(Load Feature Flag Configuration)
    
    LoadFlags --> CheckEnvironment{What Environment?}
    
    CheckEnvironment -->|Development| DevFlags[Apply Development Overrides]
    CheckEnvironment -->|Staging| StagingFlags[Apply Staging Overrides]
    CheckEnvironment -->|Production| ProdFlags[Apply Production Overrides]
    
    DevFlags --> CheckEngineFlags{Engine Flags}
    StagingFlags --> CheckEngineFlags
    ProdFlags --> CheckEngineFlags
    
    CheckEngineFlags --> SQLMeshEnabled{SQLMesh Enabled?}
    CheckEngineFlags --> DBTEnabled{dbt Enabled?}
    CheckEngineFlags --> DualEnabled{Dual Engine Enabled?}
    
    SQLMeshEnabled -->|No| ExcludeSQLMesh[Exclude SQLMesh from Options]
    SQLMeshEnabled -->|Yes| CheckSQLMeshRollout{In SQLMesh Rollout?}
    
    DBTEnabled -->|No| ExcludeDBT[Exclude dbt from Options]
    DBTEnabled -->|Yes| IncludeDBT[Include dbt in Options]
    
    DualEnabled -->|No| ExcludeDual[Exclude Dual Engine from Options]
    DualEnabled -->|Yes| CheckDualRollout{In Dual Engine Rollout?}
    
    CheckSQLMeshRollout -->|Yes| IncludeSQLMesh[Include SQLMesh in Options]
    CheckSQLMeshRollout -->|No| ExcludeSQLMesh
    
    CheckDualRollout -->|Yes| IncludeDual[Include Dual Engine in Options]
    CheckDualRollout -->|No| ExcludeDual
    
    IncludeSQLMesh --> CheckExperimentalFlags{Experimental Features Enabled?}
    IncludeDBT --> CheckExperimentalFlags
    IncludeDual --> CheckExperimentalFlags
    ExcludeSQLMesh --> CheckExperimentalFlags
    ExcludeDBT --> CheckExperimentalFlags  
    ExcludeDual --> CheckExperimentalFlags
    
    CheckExperimentalFlags -->|Yes| EnableExperimental[Enable Experimental Features]
    CheckExperimentalFlags -->|No| DisableExperimental[Disable Experimental Features]
    
    EnableExperimental --> FlagsComplete[["Feature Flags Applied"]]
    DisableExperimental --> FlagsComplete
```

## Implementation Timeline Decision Flow

```mermaid
flowchart TD
    StartTimeline((Start Timeline Estimation)) --> GatherInputs(Gather Project Inputs)
    
    GatherInputs --> ProjectSize[Assess Project Size]
    GatherInputs --> TeamSize[Assess Team Size]
    GatherInputs --> Complexity[Assess Complexity]
    GatherInputs --> ExistingInfra[Assess Existing Infrastructure]
    
    ProjectSize --> BaselineTime[Calculate Baseline Timeline]
    TeamSize --> BaselineTime
    Complexity --> BaselineTime
    ExistingInfra --> BaselineTime
    
    BaselineTime --> CheckEngine{Recommended Engine?}
    
    CheckEngine -->|SQLMesh| SQLMeshTimeline[SQLMesh Implementation Timeline]
    CheckEngine -->|dbt| DBTTimeline[dbt Implementation Timeline]
    CheckEngine -->|Dual Engine| DualTimeline[Dual Engine Implementation Timeline]
    
    SQLMeshTimeline --> CheckTeamExperience{Team SQLMesh Experience?}
    DBTTimeline --> CheckDBTExperience{Team dbt Experience?}
    DualTimeline --> CheckDualCapability{Team Dual Engine Capability?}
    
    CheckTeamExperience -->|High| SQLMeshFast[8-12 weeks]
    CheckTeamExperience -->|Medium| SQLMeshMedium[12-16 weeks]
    CheckTeamExperience -->|Low| SQLMeshSlow[16-20 weeks]
    
    CheckDBTExperience -->|High| DBTFast[6-10 weeks]
    CheckDBTExperience -->|Medium| DBTMedium[10-14 weeks]
    CheckDBTExperience -->|Low| DBTSlow[14-18 weeks]
    
    CheckDualCapability -->|High| DualFast[12-16 weeks]
    CheckDualCapability -->|Medium| DualMedium[16-20 weeks]
    CheckDualCapability -->|Low| DualSlow[20-24 weeks]
    
    SQLMeshFast --> CheckMigration{Migration Required?}
    SQLMeshMedium --> CheckMigration
    SQLMeshSlow --> CheckMigration
    DBTFast --> CheckMigration
    DBTMedium --> CheckMigration
    DBTSlow --> CheckMigration
    DualFast --> CheckMigration
    DualMedium --> CheckMigration
    DualSlow --> CheckMigration
    
    CheckMigration -->|Yes| AddMigrationTime[Add Migration Time]
    CheckMigration -->|No| FinalizeTimeline[Finalize Timeline]
    
    AddMigrationTime --> CheckMigrationSize{Migration Size?}
    CheckMigrationSize -->|Small < 20 models| Add2Weeks[Add 2 weeks]
    CheckMigrationSize -->|Medium 20-50 models| Add4Weeks[Add 4 weeks]
    CheckMigrationSize -->|Large > 50 models| Add8Weeks[Add 6-8 weeks]
    
    Add2Weeks --> FinalizeTimeline
    Add4Weeks --> FinalizeTimeline
    Add8Weeks --> FinalizeTimeline
    
    FinalizeTimeline --> TimelineComplete[["Timeline Estimation Complete"]]
```

## Error Handling and Recovery Flow

```mermaid
flowchart TD
    StartError((Error Detected)) --> ClassifyError{Error Classification}
    
    ClassifyError -->|System Error| SystemErrorPath(System Error Handling)
    ClassifyError -->|User Input Error| UserErrorPath(User Input Error Handling)
    ClassifyError -->|Configuration Error| ConfigErrorPath(Configuration Error Handling)
    ClassifyError -->|Resource Error| ResourceErrorPath(Resource Error Handling)
    
    SystemErrorPath --> LogError[Log Error Details]
    UserErrorPath --> ValidateInput[Validate User Input]
    ConfigErrorPath --> CheckConfig[Check Configuration Validity]
    ResourceErrorPath --> CheckResources[Check Resource Availability]
    
    LogError --> AttemptRecovery{Recovery Possible?}
    ValidateInput --> ProvideGuidance[Provide Input Guidance]
    CheckConfig --> SuggestConfigFix[Suggest Configuration Fix]
    CheckResources --> WaitOrFallback{Wait or Fallback?}
    
    AttemptRecovery -->|Yes| ExecuteRecovery[Execute Recovery Procedure]
    AttemptRecovery -->|No| InitiateFallback[Initiate Fallback Strategy]
    
    ExecuteRecovery --> RecoverySuccess{Recovery Successful?}
    RecoverySuccess -->|Yes| ContinueExecution[Continue Normal Execution]
    RecoverySuccess -->|No| InitiateFallback
    
    InitiateFallback --> SafeModeCheck{Safe Mode Available?}
    SafeModeCheck -->|Yes| EnterSafeMode[Enter Safe Mode with Default Engine]
    SafeModeCheck -->|No| GracefulFailure[Graceful Failure with Error Report]
    
    ProvideGuidance --> UserCorrects{User Corrects Input?}
    UserCorrects -->|Yes| ContinueExecution
    UserCorrects -->|No| GracefulFailure
    
    SuggestConfigFix --> ConfigFixed{Configuration Fixed?}
    ConfigFixed -->|Yes| ContinueExecution
    ConfigFixed -->|No| UseDefaultConfig[Use Default Configuration]
    
    WaitOrFallback -->|Wait| RetryAfterDelay[Retry After Delay]
    WaitOrFallback -->|Fallback| UseAlternativeResource[Use Alternative Resource]
    
    RetryAfterDelay --> CheckResources
    UseAlternativeResource --> ContinueExecution
    UseDefaultConfig --> ContinueExecution
    EnterSafeMode --> ContinueExecution
    
    ContinueExecution --> SuccessfulRecovery[["Successful Recovery"]]
    GracefulFailure --> ErrorReported[["Error Reported to User"]]
```

## Agent Coordination Decision Flow

```mermaid
flowchart TD
    StartCoordination((Start Agent Coordination)) --> IdentifyAgents{Identify Required Agents}
    
    IdentifyAgents --> DataEngineerNeeded{Data Engineer Agent Needed?}
    IdentifyAgents --> DataArchitectNeeded{Data Architect Agent Needed?}
    IdentifyAgents --> DataQANeeded{Data QA Agent Needed?}
    
    DataEngineerNeeded -->|Yes| ActivateDataEngineer[Activate Data Engineer Agent]
    DataArchitectNeeded -->|Yes| ActivateDataArchitect[Activate Data Architect Agent]
    DataQANeeded -->|Yes| ActivateDataQA[Activate Data QA Agent]
    
    ActivateDataEngineer --> DataEngineerTasks[Assign Engine Selection Tasks]
    ActivateDataArchitect --> DataArchitectTasks[Assign Cost Optimization Tasks]
    ActivateDataQA --> DataQATasks[Assign Validation Tasks]
    
    DataEngineerTasks --> CoordinationNeeded{Cross-Agent Coordination Needed?}
    DataArchitectTasks --> CoordinationNeeded
    DataQATasks --> CoordinationNeeded
    
    CoordinationNeeded -->|Yes| EstablishCoordination[Establish Communication Channels]
    CoordinationNeeded -->|No| IndependentExecution[Execute Independently]
    
    EstablishCoordination --> DefineHandoffs[Define Agent Handoffs]
    DefineHandoffs --> ShareContext[Share Context Between Agents]
    ShareContext --> CoordinatedExecution[Execute with Coordination]
    
    CoordinatedExecution --> ValidateResults[Validate Cross-Agent Results]
    IndependentExecution --> ValidateResults
    
    ValidateResults --> ConsistentResults{Results Consistent?}
    ConsistentResults -->|Yes| ConsolidateRecommendations[Consolidate Final Recommendations]
    ConsistentResults -->|No| ResolveConflicts[Resolve Agent Conflicts]
    
    ResolveConflicts --> ConflictResolution{Resolution Successful?}
    ConflictResolution -->|Yes| ConsolidateRecommendations
    ConflictResolution -->|No| EscalateConflict[Escalate to Human Review]
    
    ConsolidateRecommendations --> CoordinationComplete[["Agent Coordination Complete"]]
    EscalateConflict --> ManualReview[["Manual Review Required"]]
```

## Decision Tree Implementation Guide

### Code Integration Points

Each decision flow maps to specific implementation points in the codebase:

1. **Primary Engine Selection** → `agents/shared/auto-detection/engine-detection-algorithm.py::detect_and_recommend_engine()`
2. **Project Analysis** → `agents/shared/auto-detection/engine-detection-algorithm.py::ProjectAnalyzer`
3. **User Override Processing** → `docs/patterns/user-override-patterns.md` implementation
4. **Risk Assessment** → `agents/shared/auto-detection/engine-detection-algorithm.py::EngineRecommendationEngine._calculate_risk_score()`
5. **Fallback Strategy** → `agents/shared/error-handling/fallback-strategies.py`
6. **Feature Flags** → `config/feature-flags/transformation-engine-flags.yaml`

### Testing Decision Trees

Each decision path should be tested with representative scenarios:

```python
# Example test cases for decision tree validation
def test_engine_selection_decision_tree():
    """Test primary engine selection flow."""
    
    # Test Path: SQLMesh wins with valid constraints
    characteristics = create_sqlmesh_favorable_characteristics()
    recommendation = detect_and_recommend_engine("./test_project", characteristics)
    assert recommendation.recommended_engine == "sqlmesh"
    
    # Test Path: Fallback due to constraints
    restrictive_constraints = {"exclude_engines": ["sqlmesh", "dual_engine"]}
    recommendation = detect_and_recommend_engine("./test_project", restrictive_constraints)
    assert recommendation.recommended_engine == "dbt"  # Fallback
    
    # Test Path: No valid options error
    impossible_constraints = {"exclude_engines": ["sqlmesh", "dbt", "dual_engine"]}
    with pytest.raises(ValueError, match="No valid engine option"):
        detect_and_recommend_engine("./test_project", impossible_constraints)

def test_override_processing_decision_tree():
    """Test user override processing flow."""
    
    # Test Path: Valid force override
    overrides = {"force_engine": "sqlmesh"}
    result = process_user_overrides(overrides)
    assert result.is_valid
    assert result.applied_overrides["forced_engine"] == "sqlmesh"
    
    # Test Path: Conflict error
    conflicting_overrides = {
        "force_engine": "sqlmesh",
        "exclude_engines": ["sqlmesh"]
    }
    result = process_user_overrides(conflicting_overrides)
    assert not result.is_valid
    assert "conflict" in result.error_message.lower()

def test_risk_assessment_decision_tree():
    """Test risk assessment flow."""
    
    # Test Path: Low risk scenario
    low_risk_characteristics = create_low_risk_characteristics()
    risk_assessment = assess_recommendation_risk(low_risk_characteristics)
    assert risk_assessment.risk_level == "low"
    assert risk_assessment.risk_score < 0.3
    
    # Test Path: High risk scenario requiring approval
    high_risk_characteristics = create_high_risk_characteristics()
    risk_assessment = assess_recommendation_risk(high_risk_characteristics)
    assert risk_assessment.risk_level == "high"
    assert risk_assessment.requires_approval
```

### Decision Tree Maintenance

These decision trees should be updated when:

1. **New engines are added** → Update primary selection flow
2. **New override types are supported** → Update override processing flow
3. **Risk factors change** → Update risk assessment flow
4. **Feature flags evolve** → Update feature flag integration flow
5. **Agent coordination patterns change** → Update coordination flow

### Visual Representation Tools

The Mermaid diagrams in this document can be rendered using:

- **GitHub/GitLab** → Native Mermaid rendering
- **VS Code** → Mermaid Preview extension
- **Documentation Sites** → MkDocs with Mermaid plugin
- **Presentation Tools** → Export to SVG/PNG for slides

### Decision Tree Metrics

Track decision tree effectiveness with metrics:

```yaml
decision_tree_metrics:
  path_coverage:
    primary_selection: "Percentage of selection paths exercised"
    override_processing: "Percentage of override paths tested"
    risk_assessment: "Percentage of risk scenarios covered"
    
  decision_accuracy:
    correct_engine_selections: "Percentage of optimal selections"
    override_conflict_detection: "Percentage of conflicts caught"
    risk_score_accuracy: "Correlation with actual outcomes"
    
  performance_metrics:
    decision_latency: "Time to complete decision flows"
    memory_usage: "Resource consumption during processing"
    error_rate: "Percentage of flows resulting in errors"
```

This comprehensive decision flowchart documentation provides clear visual guidance for implementing and maintaining the intelligent transformation engine selection system.