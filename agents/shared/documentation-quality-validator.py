"""
Documentation Quality Validator for SQLmesh Models

This module provides comprehensive validation of SQLmesh model documentation
to ensure consistency, completeness, and quality across the data platform.
Supports automated quality assessment and improvement recommendations.
"""

import re
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple, Any
import json
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ValidationSeverity(Enum):
    """Severity levels for validation issues."""
    CRITICAL = "critical"     # Must be fixed before deployment
    HIGH = "high"             # Should be fixed soon
    MEDIUM = "medium"         # Should be addressed in next iteration
    LOW = "low"               # Nice to have improvements
    INFO = "info"             # Informational recommendations


class DocumentationType(Enum):
    """Types of documentation being validated."""
    CATALOG_DESCRIPTION = "catalog_description"
    MODEL_HEADER = "model_header"
    INLINE_COMMENTS = "inline_comments"
    METADATA = "metadata"
    LINEAGE = "lineage"


@dataclass
class ValidationIssue:
    """Represents a documentation quality issue."""
    issue_type: str
    severity: ValidationSeverity
    message: str
    line_number: Optional[int] = None
    column_name: Optional[str] = None
    recommendation: str = ""
    fix_suggestion: str = ""
    documentation_reference: str = ""


@dataclass
class ValidationResult:
    """Results of documentation quality validation."""
    model_name: str
    overall_score: float  # 0.0 - 1.0
    category_scores: Dict[str, float] = field(default_factory=dict)
    issues: List[ValidationIssue] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)
    improvement_priority: str = "medium"  # low, medium, high, critical
    last_validated: datetime = field(default_factory=datetime.utcnow)
    validation_metadata: Dict[str, Any] = field(default_factory=dict)


class CatalogDescriptionValidator:
    """Validates catalog descriptions for SQLmesh models."""
    
    def __init__(self):
        self.business_keywords = [
            'for', 'supporting', 'enabling', 'providing', 'to enable', 'used for',
            'helps', 'identifies', 'calculates', 'tracks', 'monitors', 'analyzes'
        ]
        
        self.technical_jargon = [
            'join', 'left join', 'inner join', 'aggregate', 'group by', 'window function',
            'partition by', 'row_number', 'rank', 'etl', 'elt', 'transform', 'cte',
            'with clause', 'subquery', 'union', 'intersect', 'except'
        ]
        
        self.data_source_indicators = [
            'from', 'sourced from', 'combining', 'integrating', 'merging',
            'using data from', 'based on', 'derived from'
        ]
        
        self.frequency_keywords = [
            'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'hourly',
            'real-time', 'real time', 'live', 'streaming', 'batch',
            'on-demand', 'triggered', 'scheduled'
        ]
        
        self.domain_keywords = {
            'customer': ['customer', 'client', 'user', 'account holder'],
            'financial': ['revenue', 'finance', 'accounting', 'billing', 'payment'],
            'operational': ['operations', 'supply chain', 'logistics', 'manufacturing'],
            'marketing': ['campaign', 'marketing', 'lead', 'conversion', 'funnel'],
            'product': ['product', 'feature', 'usage', 'adoption', 'engagement'],
            'hr': ['employee', 'workforce', 'talent', 'performance', 'compensation']
        }
    
    def validate_catalog_description(self, description: str, model_name: str = "") -> List[ValidationIssue]:
        """Validate catalog description against quality standards."""
        issues = []
        
        if not description or not description.strip():
            issues.append(ValidationIssue(
                issue_type="missing_description",
                severity=ValidationSeverity.CRITICAL,
                message="Catalog description is missing or empty",
                recommendation="Add a clear, concise description explaining the model's business purpose",
                fix_suggestion="description 'Business domain data providing key value for primary use cases. Refresh frequency from main sources.'",
                documentation_reference="docs/standards/model-description-guidelines.md#catalog-description-standards"
            ))
            return issues
        
        # Length validation
        char_count = len(description.strip())
        if char_count < 50:
            issues.append(ValidationIssue(
                issue_type="description_too_short",
                severity=ValidationSeverity.HIGH,
                message=f"Description too short ({char_count} chars). Target: 100-150 chars for good context",
                recommendation="Add business context, data sources, and primary use cases",
                fix_suggestion="Expand to include: business domain + value proposition + data sources + refresh frequency"
            ))
        elif char_count > 200:
            issues.append(ValidationIssue(
                issue_type="description_too_long",
                severity=ValidationSeverity.MEDIUM,
                message=f"Description too long ({char_count} chars). Target: 100-150 chars for catalog display",
                recommendation="Simplify and focus on core business value",
                fix_suggestion="Remove implementation details and focus on business purpose"
            ))
        
        # Business context validation
        has_business_context = any(keyword in description.lower() for keyword in self.business_keywords)
        if not has_business_context:
            issues.append(ValidationIssue(
                issue_type="missing_business_context",
                severity=ValidationSeverity.HIGH,
                message="Description lacks business context or purpose",
                recommendation="Explain what business problem this model solves",
                fix_suggestion="Add phrases like 'for customer segmentation', 'supporting financial reporting', or 'enabling operational decisions'"
            ))
        
        # Technical jargon detection
        jargon_found = [term for term in self.technical_jargon if term in description.lower()]
        if len(jargon_found) > 1:
            issues.append(ValidationIssue(
                issue_type="excessive_technical_jargon",
                severity=ValidationSeverity.MEDIUM,
                message=f"Too much technical jargon: {', '.join(jargon_found)}",
                recommendation="Use business language instead of implementation details",
                fix_suggestion="Replace technical terms with business outcomes and value"
            ))
        
        # Data source mention
        has_data_source = any(indicator in description.lower() for indicator in self.data_source_indicators)
        if not has_data_source:
            issues.append(ValidationIssue(
                issue_type="missing_data_sources",
                severity=ValidationSeverity.MEDIUM,
                message="Data sources not mentioned in description",
                recommendation="Include primary data sources for context",
                fix_suggestion="Add 'from CRM and transaction systems' or similar source indication"
            ))
        
        # Update frequency mention
        has_frequency = any(freq in description.lower() for freq in self.frequency_keywords)
        if not has_frequency:
            issues.append(ValidationIssue(
                issue_type="missing_update_frequency",
                severity=ValidationSeverity.MEDIUM,
                message="Update frequency not specified",
                recommendation="Include refresh schedule information",
                fix_suggestion="Add 'Daily refresh', 'Monthly updates', or appropriate frequency"
            ))
        
        # Domain identification
        identified_domain = self._identify_business_domain(description)
        if not identified_domain:
            issues.append(ValidationIssue(
                issue_type="unclear_business_domain",
                severity=ValidationSeverity.LOW,
                message="Business domain not clearly identified",
                recommendation="Clarify which business area this model serves",
                fix_suggestion="Add domain prefix like 'Customer analytics', 'Financial reporting', or 'Operations'"
            ))
        
        return issues
    
    def _identify_business_domain(self, description: str) -> Optional[str]:
        """Identify business domain from description content."""
        description_lower = description.lower()
        
        for domain, keywords in self.domain_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                return domain
        
        return None


class ModelHeaderValidator:
    """Validates comprehensive model header documentation."""
    
    def __init__(self):
        self.required_sections = [
            'business_purpose', 'data_sources', 'key_transformations',
            'primary_use_cases', 'refresh_schedule', 'quality_measures'
        ]
        
        self.recommended_sections = [
            'dependencies', 'outputs', 'grain', 'owner', 'notes'
        ]
    
    def validate_model_header(self, header_content: str, model_name: str = "") -> List[ValidationIssue]:
        """Validate comprehensive model header documentation."""
        issues = []
        
        if not header_content or len(header_content.strip()) < 100:
            issues.append(ValidationIssue(
                issue_type="insufficient_header_documentation",
                severity=ValidationSeverity.HIGH,
                message="Model header documentation is missing or insufficient",
                recommendation="Add comprehensive model documentation following template",
                documentation_reference="templates/sqlmesh-model-documentation-template.md"
            ))
            return issues
        
        # Check for required sections
        missing_sections = self._find_missing_sections(header_content, self.required_sections)
        for section in missing_sections:
            issues.append(ValidationIssue(
                issue_type="missing_required_section",
                severity=ValidationSeverity.HIGH,
                message=f"Missing required section: {section}",
                recommendation=f"Add {section} section with appropriate content",
                fix_suggestion=self._get_section_template(section)
            ))
        
        # Check for recommended sections
        missing_recommended = self._find_missing_sections(header_content, self.recommended_sections)
        if len(missing_recommended) > 2:
            issues.append(ValidationIssue(
                issue_type="missing_recommended_sections",
                severity=ValidationSeverity.MEDIUM,
                message=f"Missing recommended sections: {', '.join(missing_recommended)}",
                recommendation="Consider adding recommended sections for better documentation",
                fix_suggestion="Add sections that provide context for your specific model"
            ))
        
        # Validate section quality
        section_quality_issues = self._validate_section_quality(header_content)
        issues.extend(section_quality_issues)
        
        return issues
    
    def _find_missing_sections(self, content: str, required_sections: List[str]) -> List[str]:
        """Find missing documentation sections."""
        content_lower = content.lower()
        missing = []
        
        section_patterns = {
            'business_purpose': ['business purpose', 'purpose:', 'business context'],
            'data_sources': ['data sources', 'sources:', 'dependencies:', 'input:'],
            'key_transformations': ['transformations', 'key logic', 'business logic'],
            'primary_use_cases': ['use cases', 'used by', 'consumers', 'outputs:'],
            'refresh_schedule': ['refresh', 'schedule', 'frequency', 'timing'],
            'quality_measures': ['quality', 'reliability', 'sla', 'monitoring'],
            'dependencies': ['dependencies', 'upstream', 'sources'],
            'outputs': ['outputs', 'downstream', 'consumers', 'used by'],
            'grain': ['grain', 'primary key', 'uniqueness'],
            'owner': ['owner', 'contact', 'team'],
            'notes': ['notes', 'limitations', 'considerations']
        }
        
        for section in required_sections:
            patterns = section_patterns.get(section, [section.replace('_', ' ')])
            if not any(pattern in content_lower for pattern in patterns):
                missing.append(section)
        
        return missing
    
    def _validate_section_quality(self, content: str) -> List[ValidationIssue]:
        """Validate quality of documentation sections."""
        issues = []
        
        # Check for placeholder text
        placeholders = ['[TODO]', '[TBD]', '[PLACEHOLDER]', 'XXX', 'FIXME']
        for placeholder in placeholders:
            if placeholder in content.upper():
                issues.append(ValidationIssue(
                    issue_type="placeholder_text_found",
                    severity=ValidationSeverity.HIGH,
                    message=f"Placeholder text found: {placeholder}",
                    recommendation="Replace placeholder with actual documentation",
                    fix_suggestion="Complete the documentation section with real information"
                ))
        
        # Check for overly technical content
        business_sections = ['business purpose', 'primary use cases']
        for section in business_sections:
            if section in content.lower():
                section_start = content.lower().find(section)
                section_end = content.find('\n\n', section_start) if section_start != -1 else len(content)
                section_text = content[section_start:section_end] if section_start != -1 else ""
                
                technical_terms = ['JOIN', 'SELECT', 'GROUP BY', 'WHERE', 'PARTITION']
                tech_count = sum(1 for term in technical_terms if term in section_text.upper())
                
                if tech_count > 2:
                    issues.append(ValidationIssue(
                        issue_type="technical_content_in_business_section",
                        severity=ValidationSeverity.MEDIUM,
                        message=f"Business section '{section}' contains too much technical detail",
                        recommendation="Focus on business value and outcomes rather than implementation",
                        fix_suggestion="Rewrite section emphasizing business benefits and use cases"
                    ))
        
        return issues
    
    def _get_section_template(self, section: str) -> str:
        """Get template content for missing sections."""
        templates = {
            'business_purpose': 'BUSINESS PURPOSE:\n[Explain the business problem this model solves and its strategic value]',
            'data_sources': 'DATA SOURCES:\n[List primary data sources and their scope/coverage]',
            'key_transformations': 'KEY TRANSFORMATIONS:\n[Highlight important business logic and data transformations]',
            'primary_use_cases': 'PRIMARY USE CASES:\n- [Use case 1]\n- [Use case 2]\n- [Use case 3]',
            'refresh_schedule': 'REFRESH SCHEDULE:\n[Update frequency and timing details]',
            'quality_measures': 'QUALITY MEASURES:\n[Key quality metrics and reliability characteristics]'
        }
        
        return templates.get(section, f'{section.upper()}:\n[Add {section.replace("_", " ")} information]')


class InlineDocumentationValidator:
    """Validates inline documentation patterns in SQL code."""
    
    def __init__(self):
        self.complex_patterns = [
            r'CASE\s+WHEN.*THEN.*ELSE',  # Complex CASE statements
            r'ROW_NUMBER\(\)\s+OVER',     # Window functions
            r'LAG\(|LEAD\(',             # Window functions
            r'WITH\s+\w+\s+AS',          # CTEs
            r'LEFT\s+JOIN|INNER\s+JOIN|RIGHT\s+JOIN'  # Joins
        ]
        
        self.business_comment_indicators = [
            'business rule', 'business logic', 'calculation',
            'assumption', 'edge case', 'exception', 'validation'
        ]
    
    def validate_inline_documentation(self, sql_content: str, model_name: str = "") -> List[ValidationIssue]:
        """Validate inline documentation in SQL code."""
        issues = []
        lines = sql_content.split('\n')
        
        # Find complex logic without documentation
        complex_undocumented = self._find_undocumented_complexity(sql_content)
        for line_num, complexity_type in complex_undocumented:
            issues.append(ValidationIssue(
                issue_type="undocumented_complex_logic",
                severity=ValidationSeverity.MEDIUM,
                message=f"Complex {complexity_type} without documentation",
                line_number=line_num,
                recommendation="Add comment explaining business logic and purpose",
                fix_suggestion=f"-- BUSINESS RULE: [Explain the {complexity_type} logic and why it's needed]"
            ))
        
        # Check for business context in comments
        comment_quality = self._assess_comment_quality(lines)
        issues.extend(comment_quality)
        
        # Validate CTE documentation
        cte_issues = self._validate_cte_documentation(sql_content)
        issues.extend(cte_issues)
        
        return issues
    
    def _find_undocumented_complexity(self, sql_content: str) -> List[Tuple[int, str]]:
        """Find complex SQL patterns that lack documentation."""
        lines = sql_content.split('\n')
        undocumented = []
        
        for i, line in enumerate(lines, 1):
            line_upper = line.upper().strip()
            
            # Skip if line is already a comment
            if line.strip().startswith('--') or line.strip().startswith('/*'):
                continue
            
            # Check for complex patterns
            for pattern in self.complex_patterns:
                if re.search(pattern, line_upper):
                    # Check if previous few lines contain explanatory comments
                    has_documentation = False
                    for j in range(max(0, i-4), i):
                        if j < len(lines) and ('--' in lines[j] or '/*' in lines[j]):
                            # Check if comment explains business logic
                            comment_text = lines[j].lower()
                            if any(indicator in comment_text for indicator in self.business_comment_indicators):
                                has_documentation = True
                                break
                    
                    if not has_documentation:
                        complexity_type = self._identify_complexity_type(pattern)
                        undocumented.append((i, complexity_type))
        
        return undocumented
    
    def _identify_complexity_type(self, pattern: str) -> str:
        """Identify the type of complexity from regex pattern."""
        pattern_types = {
            r'CASE\s+WHEN.*THEN.*ELSE': 'conditional logic',
            r'ROW_NUMBER\(\)\s+OVER': 'window function',
            r'LAG\(|LEAD\(': 'time-series calculation',
            r'WITH\s+\w+\s+AS': 'CTE transformation',
            r'LEFT\s+JOIN|INNER\s+JOIN|RIGHT\s+JOIN': 'data joining'
        }
        
        for regex, description in pattern_types.items():
            if pattern == regex:
                return description
        
        return 'complex logic'
    
    def _assess_comment_quality(self, lines: List[str]) -> List[ValidationIssue]:
        """Assess quality of existing comments."""
        issues = []
        
        for i, line in enumerate(lines, 1):
            if '--' in line:
                comment_part = line.split('--', 1)[1].strip()
                
                # Check for low-quality comments
                if self._is_low_quality_comment(comment_part):
                    issues.append(ValidationIssue(
                        issue_type="low_quality_comment",
                        severity=ValidationSeverity.LOW,
                        message=f"Comment provides little value: '{comment_part}'",
                        line_number=i,
                        recommendation="Improve comment to explain business logic or reasoning",
                        fix_suggestion="Focus on WHY rather than WHAT - explain business rationale"
                    ))
        
        return issues
    
    def _is_low_quality_comment(self, comment: str) -> bool:
        """Determine if a comment is low quality."""
        comment_lower = comment.lower().strip()
        
        # Comments that just repeat the code
        low_quality_patterns = [
            'select', 'from', 'where', 'group by', 'order by',
            'join', 'inner join', 'left join',
            'count', 'sum', 'avg', 'max', 'min'
        ]
        
        # Very short comments
        if len(comment_lower) < 10:
            return True
        
        # Comments that just describe SQL operations
        if any(pattern in comment_lower for pattern in low_quality_patterns):
            return True
        
        return False
    
    def _validate_cte_documentation(self, sql_content: str) -> List[ValidationIssue]:
        """Validate CTE (Common Table Expression) documentation."""
        issues = []
        
        # Find all CTEs
        cte_pattern = r'WITH\s+(\w+)\s+AS\s*\('
        ctes = re.finditer(cte_pattern, sql_content, re.IGNORECASE)
        
        for cte_match in ctes:
            cte_name = cte_match.group(1)
            cte_start = cte_match.start()
            
            # Find the line number
            lines_before = sql_content[:cte_start].count('\n')
            
            # Check for CTE documentation
            lines = sql_content.split('\n')
            has_cte_doc = False
            
            # Look for CTE documentation in previous 3 lines
            for i in range(max(0, lines_before-3), lines_before+1):
                if i < len(lines):
                    line = lines[i]
                    if ('--' in line or '/*' in line) and any(
                        keyword in line.lower() for keyword in ['section', 'purpose', 'cte', cte_name.lower()]
                    ):
                        has_cte_doc = True
                        break
            
            if not has_cte_doc:
                issues.append(ValidationIssue(
                    issue_type="undocumented_cte",
                    severity=ValidationSeverity.MEDIUM,
                    message=f"CTE '{cte_name}' lacks documentation",
                    line_number=lines_before + 1,
                    recommendation="Add section documentation for CTE purpose and logic",
                    fix_suggestion=f"-- SECTION: {cte_name}\n-- PURPOSE: [Explain what this CTE accomplishes]\n-- INPUT: [Data sources]\n-- OUTPUT: [What this produces]"
                ))
        
        return issues


class MetadataValidator:
    """Validates model metadata completeness and quality."""
    
    def __init__(self):
        self.required_metadata = [
            'owner', 'description', 'grain'
        ]
        
        self.recommended_metadata = [
            'cron', 'cluster_by', 'partition_by', 'audits'
        ]
        
        self.business_metadata_fields = [
            'business_domain', 'stakeholders', 'data_classification',
            'cost_center', 'sla_tier'
        ]
    
    def validate_metadata(self, model_config: Dict[str, Any], model_name: str = "") -> List[ValidationIssue]:
        """Validate model metadata completeness and quality."""
        issues = []
        
        # Check required metadata
        for field in self.required_metadata:
            if field not in model_config or not model_config[field]:
                issues.append(ValidationIssue(
                    issue_type="missing_required_metadata",
                    severity=ValidationSeverity.HIGH,
                    message=f"Required metadata field missing: {field}",
                    recommendation=f"Add {field} to model configuration",
                    fix_suggestion=self._get_metadata_example(field)
                ))
        
        # Check recommended metadata
        missing_recommended = [field for field in self.recommended_metadata 
                             if field not in model_config or not model_config[field]]
        
        if len(missing_recommended) > 2:
            issues.append(ValidationIssue(
                issue_type="missing_recommended_metadata",
                severity=ValidationSeverity.MEDIUM,
                message=f"Missing recommended metadata: {', '.join(missing_recommended)}",
                recommendation="Add recommended metadata for better model management",
                fix_suggestion="Consider adding scheduling, partitioning, and audit configurations"
            ))
        
        # Validate business metadata
        meta_dict = model_config.get('meta', {})
        business_metadata_issues = self._validate_business_metadata(meta_dict)
        issues.extend(business_metadata_issues)
        
        # Validate specific field formats
        format_issues = self._validate_metadata_formats(model_config)
        issues.extend(format_issues)
        
        return issues
    
    def _validate_business_metadata(self, meta_dict: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate business metadata fields."""
        issues = []
        
        missing_business_metadata = [field for field in self.business_metadata_fields 
                                   if field not in meta_dict]
        
        if len(missing_business_metadata) > 3:
            issues.append(ValidationIssue(
                issue_type="insufficient_business_metadata",
                severity=ValidationSeverity.MEDIUM,
                message=f"Missing business metadata: {', '.join(missing_business_metadata)}",
                recommendation="Add business metadata for governance and discoverability",
                fix_suggestion="Add meta dictionary with business_domain, stakeholders, and data_classification"
            ))
        
        # Validate data classification if present
        if 'data_classification' in meta_dict:
            valid_classifications = ['public', 'internal', 'confidential', 'restricted']
            classification = meta_dict['data_classification']
            if classification not in valid_classifications:
                issues.append(ValidationIssue(
                    issue_type="invalid_data_classification",
                    severity=ValidationSeverity.HIGH,
                    message=f"Invalid data classification: {classification}",
                    recommendation=f"Use valid classification: {', '.join(valid_classifications)}",
                    fix_suggestion="'data_classification': 'internal'  # or appropriate level"
                ))
        
        return issues
    
    def _validate_metadata_formats(self, model_config: Dict[str, Any]) -> List[ValidationIssue]:
        """Validate metadata field formats."""
        issues = []
        
        # Validate owner format (should be email)
        if 'owner' in model_config:
            owner = model_config['owner']
            if '@' not in owner:
                issues.append(ValidationIssue(
                    issue_type="invalid_owner_format",
                    severity=ValidationSeverity.MEDIUM,
                    message="Owner should be an email address",
                    recommendation="Use email format for owner field",
                    fix_suggestion="owner='team@company.com'"
                ))
        
        # Validate grain format (should be list)
        if 'grain' in model_config:
            grain = model_config['grain']
            if isinstance(grain, str):
                issues.append(ValidationIssue(
                    issue_type="grain_format_issue",
                    severity=ValidationSeverity.LOW,
                    message="Grain should be a list, not string",
                    recommendation="Use list format for grain specification",
                    fix_suggestion="grain=['customer_id', 'date_column']"
                ))
        
        # Validate cron format if present
        if 'cron' in model_config:
            cron = model_config['cron']
            valid_cron_patterns = ['@daily', '@weekly', '@monthly', '@hourly']
            if not any(pattern in cron for pattern in valid_cron_patterns) and not re.match(r'^[0-9\*\-\,\/\s]+$', cron):
                issues.append(ValidationIssue(
                    issue_type="invalid_cron_format",
                    severity=ValidationSeverity.MEDIUM,
                    message="Invalid cron schedule format",
                    recommendation="Use valid cron expression or shorthand (@daily, @weekly, etc.)",
                    fix_suggestion="cron='@daily'  # or '0 6 * * *' for 6 AM daily"
                ))
        
        return issues
    
    def _get_metadata_example(self, field: str) -> str:
        """Get example value for metadata field."""
        examples = {
            'owner': "owner='data-engineering@company.com'",
            'description': "description='Business purpose and key value proposition'",
            'grain': "grain=['primary_key_column']",
            'cron': "cron='@daily'",
            'cluster_by': "cluster_by=['customer_id']",
            'partition_by': "partition_by=['date_column']",
            'audits': "audits=[data_quality_basic, referential_integrity]"
        }
        
        return examples.get(field, f"{field}='[appropriate_value]'")


class DocumentationQualityValidator:
    """Main class for comprehensive documentation quality validation."""
    
    def __init__(self):
        self.catalog_validator = CatalogDescriptionValidator()
        self.header_validator = ModelHeaderValidator()
        self.inline_validator = InlineDocumentationValidator()
        self.metadata_validator = MetadataValidator()
        
        # Quality scoring weights
        self.scoring_weights = {
            'catalog_description': 0.25,
            'model_header': 0.30,
            'inline_documentation': 0.20,
            'metadata_completeness': 0.25
        }
    
    def validate_model_documentation(
        self, 
        model_name: str,
        catalog_description: str = "",
        model_header: str = "",
        sql_content: str = "",
        model_config: Dict[str, Any] = None
    ) -> ValidationResult:
        """Comprehensive validation of model documentation."""
        
        if model_config is None:
            model_config = {}
        
        all_issues = []
        category_scores = {}
        
        # Validate catalog description
        catalog_issues = self.catalog_validator.validate_catalog_description(catalog_description, model_name)
        all_issues.extend(catalog_issues)
        category_scores['catalog_description'] = self._calculate_category_score(catalog_issues, 'catalog')
        
        # Validate model header
        header_issues = self.header_validator.validate_model_header(model_header, model_name)
        all_issues.extend(header_issues)
        category_scores['model_header'] = self._calculate_category_score(header_issues, 'header')
        
        # Validate inline documentation
        if sql_content:
            inline_issues = self.inline_validator.validate_inline_documentation(sql_content, model_name)
            all_issues.extend(inline_issues)
            category_scores['inline_documentation'] = self._calculate_category_score(inline_issues, 'inline')
        else:
            category_scores['inline_documentation'] = 0.5  # Neutral score for missing content
        
        # Validate metadata
        metadata_issues = self.metadata_validator.validate_metadata(model_config, model_name)
        all_issues.extend(metadata_issues)
        category_scores['metadata_completeness'] = self._calculate_category_score(metadata_issues, 'metadata')
        
        # Calculate overall score
        overall_score = sum(
            score * self.scoring_weights[category] 
            for category, score in category_scores.items()
        )
        
        # Identify strengths
        strengths = self._identify_strengths(category_scores, all_issues)
        
        # Determine improvement priority
        improvement_priority = self._determine_improvement_priority(overall_score, all_issues)
        
        # Create validation metadata
        validation_metadata = {
            'total_issues': len(all_issues),
            'critical_issues': len([i for i in all_issues if i.severity == ValidationSeverity.CRITICAL]),
            'high_issues': len([i for i in all_issues if i.severity == ValidationSeverity.HIGH]),
            'medium_issues': len([i for i in all_issues if i.severity == ValidationSeverity.MEDIUM]),
            'low_issues': len([i for i in all_issues if i.severity == ValidationSeverity.LOW]),
            'categories_validated': list(category_scores.keys()),
            'validation_version': '1.0.0'
        }
        
        return ValidationResult(
            model_name=model_name,
            overall_score=overall_score,
            category_scores=category_scores,
            issues=all_issues,
            strengths=strengths,
            improvement_priority=improvement_priority,
            validation_metadata=validation_metadata
        )
    
    def _calculate_category_score(self, issues: List[ValidationIssue], category: str) -> float:
        """Calculate quality score for a documentation category."""
        if not issues:
            return 1.0
        
        # Weight issues by severity
        severity_weights = {
            ValidationSeverity.CRITICAL: 1.0,
            ValidationSeverity.HIGH: 0.8,
            ValidationSeverity.MEDIUM: 0.5,
            ValidationSeverity.LOW: 0.2,
            ValidationSeverity.INFO: 0.1
        }
        
        total_penalty = sum(severity_weights.get(issue.severity, 0.5) for issue in issues)
        
        # Category-specific maximum penalty thresholds
        max_penalties = {
            'catalog': 3.0,
            'header': 5.0,
            'inline': 4.0,
            'metadata': 3.0
        }
        
        max_penalty = max_penalties.get(category, 4.0)
        
        # Calculate score (1.0 = perfect, 0.0 = maximum penalty reached)
        score = max(0.0, 1.0 - (total_penalty / max_penalty))
        
        return score
    
    def _identify_strengths(self, category_scores: Dict[str, float], issues: List[ValidationIssue]) -> List[str]:
        """Identify documentation strengths."""
        strengths = []
        
        # Category-specific strengths
        if category_scores.get('catalog_description', 0) >= 0.8:
            strengths.append("Clear and informative catalog description")
        
        if category_scores.get('model_header', 0) >= 0.8:
            strengths.append("Comprehensive model header documentation")
        
        if category_scores.get('inline_documentation', 0) >= 0.8:
            strengths.append("Good inline code documentation")
        
        if category_scores.get('metadata_completeness', 0) >= 0.8:
            strengths.append("Complete metadata configuration")
        
        # Overall strengths
        if not any(issue.severity == ValidationSeverity.CRITICAL for issue in issues):
            strengths.append("No critical documentation issues")
        
        if len([i for i in issues if i.severity in [ValidationSeverity.HIGH, ValidationSeverity.CRITICAL]]) <= 1:
            strengths.append("Minimal high-priority documentation issues")
        
        return strengths
    
    def _determine_improvement_priority(self, overall_score: float, issues: List[ValidationIssue]) -> str:
        """Determine improvement priority level."""
        critical_issues = [i for i in issues if i.severity == ValidationSeverity.CRITICAL]
        high_issues = [i for i in issues if i.severity == ValidationSeverity.HIGH]
        
        if critical_issues:
            return "critical"
        elif overall_score < 0.5 or len(high_issues) >= 3:
            return "high"
        elif overall_score < 0.7 or len(high_issues) >= 1:
            return "medium"
        else:
            return "low"
    
    def generate_improvement_report(self, validation_result: ValidationResult) -> str:
        """Generate human-readable improvement report."""
        report = f"""
# Documentation Quality Report: {validation_result.model_name}

## Overall Assessment
- **Quality Score**: {validation_result.overall_score:.2f}/1.00
- **Improvement Priority**: {validation_result.improvement_priority.upper()}
- **Last Validated**: {validation_result.last_validated.strftime('%Y-%m-%d %H:%M:%S')}

## Category Scores
"""
        
        for category, score in validation_result.category_scores.items():
            status = "✅" if score >= 0.8 else "⚠️" if score >= 0.6 else "❌"
            report += f"- **{category.replace('_', ' ').title()}**: {score:.2f} {status}\n"
        
        if validation_result.strengths:
            report += f"\n## Strengths\n"
            for strength in validation_result.strengths:
                report += f"- ✅ {strength}\n"
        
        if validation_result.issues:
            report += f"\n## Issues by Priority\n"
            
            # Group issues by severity
            issues_by_severity = {}
            for issue in validation_result.issues:
                severity = issue.severity.value
                if severity not in issues_by_severity:
                    issues_by_severity[severity] = []
                issues_by_severity[severity].append(issue)
            
            # Display issues in order of severity
            severity_order = ['critical', 'high', 'medium', 'low', 'info']
            severity_icons = {
                'critical': '🚨',
                'high': '🔴', 
                'medium': '🟡',
                'low': '🔵',
                'info': 'ℹ️'
            }
            
            for severity in severity_order:
                if severity in issues_by_severity:
                    report += f"\n### {severity_icons[severity]} {severity.title()} Issues\n"
                    for issue in issues_by_severity[severity]:
                        report += f"\n**{issue.issue_type.replace('_', ' ').title()}**\n"
                        report += f"- {issue.message}\n"
                        if issue.line_number:
                            report += f"- Line: {issue.line_number}\n"
                        if issue.recommendation:
                            report += f"- **Fix**: {issue.recommendation}\n"
                        if issue.fix_suggestion:
                            report += f"- **Suggestion**: `{issue.fix_suggestion}`\n"
        
        # Add improvement recommendations
        report += f"\n## Next Steps\n"
        
        priority_actions = {
            'critical': [
                "🚨 Address critical issues immediately before deployment",
                "📋 Add missing required documentation sections",
                "✅ Validate fixes with documentation standards"
            ],
            'high': [
                "🔴 Prioritize high-impact documentation improvements",
                "📝 Focus on business context and value explanation", 
                "🔄 Review and update within 1-2 sprints"
            ],
            'medium': [
                "🟡 Plan documentation improvements for next iteration",
                "📚 Consider adding recommended documentation sections",
                "🎯 Target overall score improvement to >0.75"
            ],
            'low': [
                "🔵 Address low-priority items in maintenance cycles",
                "✨ Polish existing documentation for clarity",
                "📈 Maintain high documentation standards"
            ]
        }
        
        actions = priority_actions.get(validation_result.improvement_priority, priority_actions['medium'])
        for action in actions:
            report += f"- {action}\n"
        
        if validation_result.validation_metadata.get('categories_validated'):
            report += f"\n## Validation Details\n"
            report += f"- **Categories Validated**: {', '.join(validation_result.validation_metadata['categories_validated'])}\n"
            report += f"- **Total Issues Found**: {validation_result.validation_metadata['total_issues']}\n"
            report += f"- **Validation Version**: {validation_result.validation_metadata.get('validation_version', '1.0.0')}\n"
        
        return report
    
    def batch_validate_models(self, models_data: List[Dict[str, Any]]) -> Dict[str, ValidationResult]:
        """Validate multiple models and return aggregated results."""
        results = {}
        
        for model_data in models_data:
            model_name = model_data.get('name', 'unknown_model')
            
            try:
                result = self.validate_model_documentation(
                    model_name=model_name,
                    catalog_description=model_data.get('description', ''),
                    model_header=model_data.get('header_documentation', ''),
                    sql_content=model_data.get('sql_content', ''),
                    model_config=model_data.get('config', {})
                )
                results[model_name] = result
                
            except Exception as e:
                logger.error(f"Validation failed for model {model_name}: {str(e)}")
                
                # Create error result
                results[model_name] = ValidationResult(
                    model_name=model_name,
                    overall_score=0.0,
                    issues=[ValidationIssue(
                        issue_type="validation_error",
                        severity=ValidationSeverity.CRITICAL,
                        message=f"Validation failed: {str(e)}",
                        recommendation="Check model configuration and content format"
                    )]
                )
        
        return results
    
    def generate_summary_report(self, validation_results: Dict[str, ValidationResult]) -> str:
        """Generate summary report for multiple model validations."""
        if not validation_results:
            return "No models validated."
        
        total_models = len(validation_results)
        
        # Calculate summary statistics
        scores = [result.overall_score for result in validation_results.values()]
        avg_score = sum(scores) / len(scores)
        
        priority_counts = {}
        total_issues = 0
        
        for result in validation_results.values():
            priority = result.improvement_priority
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
            total_issues += len(result.issues)
        
        # Generate summary
        report = f"""
# Documentation Quality Summary Report

## Overview
- **Total Models Validated**: {total_models}
- **Average Quality Score**: {avg_score:.2f}/1.00
- **Total Issues Found**: {total_issues}

## Priority Distribution
"""
        
        priority_icons = {'critical': '🚨', 'high': '🔴', 'medium': '🟡', 'low': '🔵'}
        for priority in ['critical', 'high', 'medium', 'low']:
            count = priority_counts.get(priority, 0)
            percentage = (count / total_models) * 100 if total_models > 0 else 0
            icon = priority_icons.get(priority, '📊')
            report += f"- {icon} **{priority.title()}**: {count} models ({percentage:.1f}%)\n"
        
        # Top models by score
        sorted_results = sorted(validation_results.items(), key=lambda x: x[1].overall_score, reverse=True)
        
        report += f"\n## Top Performing Models\n"
        for model_name, result in sorted_results[:5]:
            report += f"- **{model_name}**: {result.overall_score:.2f}\n"
        
        # Models needing attention
        needs_attention = [(name, result) for name, result in sorted_results 
                          if result.improvement_priority in ['critical', 'high']]
        
        if needs_attention:
            report += f"\n## Models Requiring Attention\n"
            for model_name, result in needs_attention[:10]:
                critical_issues = len([i for i in result.issues if i.severity == ValidationSeverity.CRITICAL])
                high_issues = len([i for i in result.issues if i.severity == ValidationSeverity.HIGH])
                report += f"- **{model_name}**: {result.overall_score:.2f} "
                report += f"({critical_issues} critical, {high_issues} high priority issues)\n"
        
        return report


# Example usage and testing
def example_usage():
    """Demonstrate validator usage with example data."""
    
    # Initialize validator
    validator = DocumentationQualityValidator()
    
    # Example model data
    example_model = {
        'name': 'analytics.customer_360_daily',
        'description': 'Customer analytics providing insights for marketing campaigns. Daily refresh from CRM systems.',
        'header_documentation': '''
        BUSINESS PURPOSE:
        Creates comprehensive customer profiles for marketing segmentation and retention analysis.
        
        DATA SOURCES:
        - CRM system (Salesforce)
        - Transaction database
        - Web analytics
        
        PRIMARY USE CASES:
        - Marketing campaign targeting
        - Customer churn prediction
        - Lifetime value analysis
        ''',
        'sql_content': '''
        WITH customer_base AS (
            -- Base customer information
            SELECT 
                customer_id,
                email,
                signup_date
            FROM customers
            WHERE is_active = true
        ),
        
        transaction_summary AS (
            SELECT 
                customer_id,
                SUM(amount) as total_spent,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE transaction_date >= CURRENT_DATE - 365
            GROUP BY customer_id
        )
        
        SELECT 
            c.customer_id,
            c.email,
            COALESCE(t.total_spent, 0) as annual_spend,
            COALESCE(t.transaction_count, 0) as annual_transactions
        FROM customer_base c
        LEFT JOIN transaction_summary t ON c.customer_id = t.customer_id;
        ''',
        'config': {
            'owner': 'data-engineering@company.com',
            'description': 'Customer analytics for marketing campaigns',
            'grain': ['customer_id'],
            'cron': '@daily',
            'meta': {
                'business_domain': 'customer_analytics',
                'data_classification': 'internal'
            }
        }
    }
    
    # Validate the model
    result = validator.validate_model_documentation(
        model_name=example_model['name'],
        catalog_description=example_model['description'],
        model_header=example_model['header_documentation'],
        sql_content=example_model['sql_content'],
        model_config=example_model['config']
    )
    
    # Generate and print report
    report = validator.generate_improvement_report(result)
    print(report)
    
    return result


if __name__ == "__main__":
    # Run example usage
    example_result = example_usage()
    
    print(f"\nExample validation completed!")
    print(f"Overall score: {example_result.overall_score:.2f}")
    print(f"Issues found: {len(example_result.issues)}")
    print(f"Improvement priority: {example_result.improvement_priority}")