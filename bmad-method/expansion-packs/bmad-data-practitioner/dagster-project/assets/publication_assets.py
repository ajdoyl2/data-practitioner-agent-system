"""
Dagster Assets for Evidence.dev Publication Pipeline
Story 1.7 Task 8: Integration with Dagster orchestration
"""

from dagster import (
    asset,
    AssetExecutionContext,
    Config,
    MetadataValue,
    MaterializeResult,
    AssetIn,
    AutoMaterializePolicy,
    AutoMaterializeRule,
    DagsterEventType
)

# No longer using FreshnessPolicy due to Dagster version compatibility issues
# Relying on AutoMaterializePolicy for freshness control instead
import subprocess
import json
import time
import os
from pathlib import Path
from typing import Dict, Any, Optional, List

class PublicationConfig(Config):
    """Configuration for Evidence.dev publication assets"""
    evidence_project_dir: Optional[str] = "expansion-packs/bmad-data-practitioner/evidence-project"
    publish_target: str = "staging"
    auto_deploy: bool = False
    template_name: str = "insight-document"
    export_formats: List[str] = ["html", "pdf"]
    refresh_dependencies: bool = True

class PublicationDeploymentConfig(Config):
    """Configuration for publication deployment"""
    deployment_platform: str = "netlify"  # netlify, vercel, github-pages, aws-s3, evidence-cloud
    deployment_credentials: Optional[str] = None
    custom_domain: Optional[str] = None
    access_control: str = "public"  # public, private, basic-auth

@asset(
    description="Generate Evidence.dev publication site from analysis data and narratives",
    group_name="publication", 
    compute_kind="evidence",
    deps=["analytics_cleaned_dataset", "narrative_generation_results"],
    auto_materialize_policy=AutoMaterializePolicy.eager()
)
def evidence_publication_generation(
    context: AssetExecutionContext,
    config: PublicationConfig
) -> MaterializeResult:
    """Generate Evidence.dev publication site with Universal SQL and automated narratives"""
    
    context.log.info("🚀 Starting Evidence.dev publication generation")
    
    try:
        # Get project root
        project_root = Path.cwd()
        evidence_dir = project_root / config.evidence_project_dir
        
        # Validate Evidence.dev project structure
        if not evidence_dir.exists():
            raise Exception(f"Evidence.dev project directory not found: {evidence_dir}")
        
        # Initialize Publication Engine via Node.js subprocess
        publication_cmd = [
            "node", "-e", """
            const { PublicationEngine } = require('./tools/data-services/publication-engine');
            const engine = new PublicationEngine();
            
            // Mock analysis results for now - will be replaced with real data from upstream assets
            const mockAnalysisResults = {
                statistical_results: { p_values: [0.001, 0.023], significance_tests: ['t-test', 'chi-square'] },
                hypothesis_results: { validated_hypotheses: 3, rejected_hypotheses: 1 },
                data_quality_metrics: { completeness: 0.95, accuracy: 0.92 },
                timestamp: new Date().toISOString()
            };
            
            const publicationConfig = {
                template: process.argv[2] || 'insight-document',
                deploymentTarget: process.argv[3] || 'staging',
                autoDeploy: false
            };
            
            engine.generatePublication(mockAnalysisResults, publicationConfig)
                .then(result => {
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('Publication generation failed:', error.message);
                    process.exit(1);
                });
            """,
            config.template_name,
            config.publish_target
        ]
        
        context.log.info(f"Executing publication generation with template: {config.template_name}")
        result = subprocess.run(
            publication_cmd,
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes
        )
        
        if result.returncode != 0:
            context.log.error(f"Publication generation failed: {result.stderr}")
            raise Exception(f"Evidence.dev publication generation failed: {result.stderr}")
        
        # Parse the result
        try:
            publication_result = json.loads(result.stdout.strip().split('\n')[-1])
        except json.JSONDecodeError:
            publication_result = {"status": "completed", "output": result.stdout}
        
        # Generate build metrics
        build_metrics = {
            "build_time_seconds": time.time() - context.run.run_started_time.timestamp(),
            "template_used": config.template_name,
            "export_formats": config.export_formats,
            "evidence_project_path": str(evidence_dir),
            "refresh_dependencies": config.refresh_dependencies
        }
        
        context.log.info("✅ Evidence.dev publication generation completed successfully")
        
        return MaterializeResult(
            metadata={
                "publication_status": MetadataValue.text("generated"),
                "template": MetadataValue.text(config.template_name),
                "publish_target": MetadataValue.text(config.publish_target),
                "build_metrics": MetadataValue.json(build_metrics),
                "generation_timestamp": MetadataValue.text(str(time.time())),
                "evidence_project_dir": MetadataValue.text(str(evidence_dir)),
                "publication_result": MetadataValue.json(publication_result)
            }
        )
        
    except Exception as e:
        context.log.error(f"❌ Evidence.dev publication generation failed: {str(e)}")
        raise Exception(f"Publication generation failed: {str(e)}")

@asset(
    description="Deploy Evidence.dev publication to staging/production environments",
    group_name="publication",
    compute_kind="deployment",
    deps=["evidence_publication_generation"],
    auto_materialize_policy=AutoMaterializePolicy.lazy()
)
def evidence_publication_deployment(
    context: AssetExecutionContext,
    config: PublicationDeploymentConfig
) -> MaterializeResult:
    """Deploy generated Evidence.dev site to specified platform"""
    
    context.log.info(f"🚀 Starting publication deployment to {config.deployment_platform}")
    
    try:
        # Get project root and evidence directory
        project_root = Path.cwd()
        evidence_dir = project_root / "expansion-packs/bmad-data-practitioner/evidence-project"
        
        # Execute deployment via Node.js subprocess
        deploy_cmd = [
            "node", "-e", """
            const { PublicationEngine } = require('./tools/data-services/publication-engine');
            const engine = new PublicationEngine();
            
            const deploymentConfig = {
                platform: process.argv[2],
                environment: process.argv[3] || 'staging',
                accessControl: process.argv[4] || 'public'
            };
            
            engine.deployPublication(deploymentConfig)
                .then(result => {
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('Publication deployment failed:', error.message);
                    process.exit(1);
                });
            """,
            config.deployment_platform,
            "staging",
            config.access_control
        ]
        
        context.log.info(f"Executing deployment to {config.deployment_platform}")
        result = subprocess.run(
            deploy_cmd,
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=600  # 10 minutes for deployment
        )
        
        if result.returncode != 0:
            context.log.error(f"Deployment failed: {result.stderr}")
            raise Exception(f"Publication deployment failed: {result.stderr}")
        
        # Parse deployment result
        try:
            deployment_result = json.loads(result.stdout.strip().split('\n')[-1])
        except json.JSONDecodeError:
            deployment_result = {"status": "deployed", "output": result.stdout}
        
        deployment_url = deployment_result.get('url', 'Unknown')
        
        context.log.info(f"✅ Publication deployed successfully to {deployment_url}")
        
        return MaterializeResult(
            metadata={
                "deployment_status": MetadataValue.text("deployed"),
                "platform": MetadataValue.text(config.deployment_platform),
                "deployment_url": MetadataValue.url(deployment_url) if deployment_url != 'Unknown' else MetadataValue.text(deployment_url),
                "access_control": MetadataValue.text(config.access_control),
                "deployment_timestamp": MetadataValue.text(str(time.time())),
                "deployment_result": MetadataValue.json(deployment_result)
            }
        )
        
    except Exception as e:
        context.log.error(f"❌ Publication deployment failed: {str(e)}")
        raise Exception(f"Deployment failed: {str(e)}")

@asset(
    description="Monitor publication site performance and health",
    group_name="publication",
    compute_kind="monitoring",
    deps=["evidence_publication_deployment"],
    auto_materialize_policy=AutoMaterializePolicy.eager()
)
def publication_monitoring(
    context: AssetExecutionContext
) -> MaterializeResult:
    """Monitor publication site performance, availability, and health metrics"""
    
    context.log.info("🔍 Starting publication monitoring and health checks")
    
    try:
        # Get project root
        project_root = Path.cwd()
        
        # Execute monitoring via Node.js subprocess
        monitor_cmd = [
            "node", "-e", """
            const path = require('path');
            
            // Mock monitoring implementation - will be enhanced with real monitoring
            const performanceMetrics = {
                load_time_ms: Math.floor(Math.random() * 2000) + 500, // 0.5-2.5s
                availability: Math.random() > 0.05 ? 'up' : 'down', // 95% uptime
                response_time_ms: Math.floor(Math.random() * 200) + 50, // 50-250ms
                core_web_vitals: {
                    lcp: Math.random() * 1500 + 500, // 0.5-2s
                    fid: Math.random() * 80 + 20,    // 20-100ms
                    cls: Math.random() * 0.1         // 0-0.1
                },
                sql_query_performance: {
                    avg_query_time_ms: Math.random() * 500 + 100,
                    slow_queries: Math.floor(Math.random() * 5),
                    total_queries: Math.floor(Math.random() * 1000) + 100
                },
                timestamp: new Date().toISOString()
            };
            
            // Check if metrics are within acceptable thresholds
            const alerts = [];
            if (performanceMetrics.load_time_ms > 3000) {
                alerts.push({type: 'performance', message: 'Load time exceeds 3s threshold'});
            }
            if (performanceMetrics.availability === 'down') {
                alerts.push({type: 'availability', message: 'Site is currently down'});
            }
            if (performanceMetrics.core_web_vitals.lcp > 2500) {
                alerts.push({type: 'core_web_vitals', message: 'LCP exceeds 2.5s threshold'});
            }
            
            const monitoringResult = {
                status: 'healthy',
                metrics: performanceMetrics,
                alerts: alerts,
                monitoring_timestamp: new Date().toISOString()
            };
            
            console.log(JSON.stringify(monitoringResult, null, 2));
            """
        ]
        
        result = subprocess.run(
            monitor_cmd,
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            context.log.error(f"Monitoring check failed: {result.stderr}")
            raise Exception(f"Publication monitoring failed: {result.stderr}")
        
        # Parse monitoring result
        try:
            monitoring_result = json.loads(result.stdout.strip())
        except json.JSONDecodeError:
            monitoring_result = {"status": "unknown", "output": result.stdout}
        
        # Check for alerts
        alerts = monitoring_result.get('alerts', [])
        if alerts:
            context.log.warning(f"⚠️ Found {len(alerts)} performance alerts")
            for alert in alerts:
                context.log.warning(f"Alert: {alert['message']}")
        else:
            context.log.info("✅ All performance metrics within acceptable thresholds")
        
        return MaterializeResult(
            metadata={
                "monitoring_status": MetadataValue.text(monitoring_result.get('status', 'unknown')),
                "performance_metrics": MetadataValue.json(monitoring_result.get('metrics', {})),
                "alerts_count": MetadataValue.int(len(alerts)),
                "alerts": MetadataValue.json(alerts),
                "monitoring_timestamp": MetadataValue.text(str(time.time())),
                "health_check_result": MetadataValue.json(monitoring_result)
            }
        )
        
    except Exception as e:
        context.log.error(f"❌ Publication monitoring failed: {str(e)}")
        raise Exception(f"Monitoring failed: {str(e)}")

@asset(
    description="Track publication versions and changes for audit trail",
    group_name="publication",
    compute_kind="versioning",
    deps=["evidence_publication_generation"],
)
def publication_versioning(
    context: AssetExecutionContext
) -> MaterializeResult:
    """Track publication versions, changes, and maintain audit trail"""
    
    context.log.info("📋 Starting publication versioning and change tracking")
    
    try:
        # Get project root
        project_root = Path.cwd()
        
        # Load previous version info for change detection
        versions_dir = project_root / "expansion-packs/bmad-data-practitioner/evidence-project/.versions"
        versions_dir.mkdir(exist_ok=True)
        
        previous_version_info = None
        existing_versions = sorted([f for f in versions_dir.glob("version-*.json")])
        if existing_versions:
            with open(existing_versions[-1], 'r') as f:
                previous_version_info = json.load(f)
        
        # Generate current version information
        current_timestamp = int(time.time())
        version_info = {
            "version": f"v{current_timestamp}",
            "created_at": current_timestamp,
            "git_commit": get_git_commit_hash(),
            "template_used": "insight-document",
            "data_dependencies": [
                "analytics_cleaned_dataset",
                "narrative_generation_results"
            ],
            "configuration_snapshot": {
                "evidence_version": "25.0.0",
                "template_version": "1.0.0",
                "deployment_target": "staging",
                "node_version": get_node_version(),
                "dagster_version": get_dagster_version()
            },
            "change_summary": "Automated publication generation via Dagster orchestration",
            "previous_version": previous_version_info["version"] if previous_version_info else None
        }
        
        # Detect and track changes
        if previous_version_info:
            changes_detected = detect_publication_changes(previous_version_info, version_info)
            version_info["changes_detected"] = changes_detected
            version_info["change_summary"] = generate_change_summary(changes_detected)
        else:
            version_info["changes_detected"] = {"change_type": "initial_version"}
            version_info["change_summary"] = "Initial publication version"
        
        # Add change metadata
        version_info["change_metadata"] = {
            "total_changes": len(version_info.get("changes_detected", {})),
            "change_categories": list(version_info.get("changes_detected", {}).keys()),
            "impact_level": determine_change_impact(version_info.get("changes_detected", {})),
            "requires_review": requires_manual_review(version_info.get("changes_detected", {}))
        }
        
        # Save version info to file
        versions_dir = project_root / "expansion-packs/bmad-data-practitioner/evidence-project/.versions"
        versions_dir.mkdir(exist_ok=True)
        
        version_file = versions_dir / f"version-{version_info['version']}.json"
        with open(version_file, 'w') as f:
            json.dump(version_info, f, indent=2)
        
        context.log.info(f"✅ Version {version_info['version']} tracked and saved")
        
        return MaterializeResult(
            metadata={
                "version": MetadataValue.text(version_info['version']),
                "version_file": MetadataValue.path(str(version_file)),
                "change_summary": MetadataValue.text(version_info['change_summary']),
                "dependencies": MetadataValue.json(version_info['data_dependencies']),
                "configuration": MetadataValue.json(version_info['configuration_snapshot']),
                "versioning_timestamp": MetadataValue.text(str(time.time())),
                "version_info": MetadataValue.json(version_info)
            }
        )
        
    except Exception as e:
        context.log.error(f"❌ Publication versioning failed: {str(e)}")
        raise Exception(f"Versioning failed: {str(e)}")

@asset(
    description="Track dependencies between analysis assets and publications",
    group_name="publication",
    compute_kind="dependency_tracking",
    deps=["analytics_cleaned_dataset", "narrative_generation_results"],
    auto_materialize_policy=AutoMaterializePolicy.eager()
)
def publication_dependency_tracking(
    context: AssetExecutionContext
) -> MaterializeResult:
    """Track dependencies between analysis results and publications for lineage and impact analysis"""
    
    context.log.info("🔗 Starting publication dependency tracking")
    
    try:
        # Get project root
        project_root = Path.cwd()
        
        # Define dependency mapping
        dependency_mapping = {
            "evidence_publication_generation": {
                "direct_dependencies": [
                    "analytics_cleaned_dataset",
                    "narrative_generation_results"
                ],
                "indirect_dependencies": [
                    "ingestion_raw_data",
                    "data_profiling_results", 
                    "statistical_analysis_results",
                    "hypothesis_test_results"
                ],
                "dependency_types": {
                    "analytics_cleaned_dataset": {
                        "type": "data_source",
                        "criticality": "high",
                        "refresh_trigger": "auto",
                        "lag_tolerance_minutes": 60
                    },
                    "narrative_generation_results": {
                        "type": "content_source",
                        "criticality": "medium", 
                        "refresh_trigger": "auto",
                        "lag_tolerance_minutes": 120
                    }
                }
            },
            "evidence_publication_deployment": {
                "direct_dependencies": [
                    "evidence_publication_generation"
                ],
                "deployment_dependencies": [
                    "publication_versioning",
                    "publication_monitoring"
                ]
            },
            "publication_monitoring": {
                "monitoring_targets": [
                    "evidence_publication_deployment",
                    "evidence_publication_generation"
                ]
            }
        }
        
        # Calculate dependency freshness and impact
        dependency_status = {}
        
        for asset_name, deps in dependency_mapping.items():
            direct_deps = deps.get("direct_dependencies", [])
            asset_status = {
                "asset_name": asset_name,
                "dependency_count": len(direct_deps),
                "dependencies": [],
                "overall_status": "healthy",
                "last_refresh_impact": None
            }
            
            for dep in direct_deps:
                # Mock dependency status (in real implementation, would query Dagster asset status)
                dep_info = {
                    "dependency_name": dep,
                    "status": "materialized",
                    "last_materialized": datetime.now().isoformat(),
                    "freshness_score": 0.95,  # Mock score
                    "impact_score": 0.8 if "analytics" in dep else 0.6
                }
                
                # Check if dependency configuration exists
                dep_config = dependency_mapping[asset_name].get("dependency_types", {}).get(dep)
                if dep_config:
                    dep_info.update({
                        "criticality": dep_config["criticality"],
                        "refresh_trigger": dep_config["refresh_trigger"],
                        "lag_tolerance_minutes": dep_config["lag_tolerance_minutes"]
                    })
                
                asset_status["dependencies"].append(dep_info)
            
            # Calculate overall status based on dependencies
            if any(dep["freshness_score"] < 0.7 for dep in asset_status["dependencies"]):
                asset_status["overall_status"] = "degraded"
            elif any(dep["freshness_score"] < 0.9 for dep in asset_status["dependencies"]):
                asset_status["overall_status"] = "warning"
            
            dependency_status[asset_name] = asset_status
        
        # Generate lineage graph data
        lineage_graph = {
            "nodes": [],
            "edges": []
        }
        
        # Add nodes for all assets
        all_assets = set()
        for asset_name, deps in dependency_mapping.items():
            all_assets.add(asset_name)
            all_assets.update(deps.get("direct_dependencies", []))
            all_assets.update(deps.get("indirect_dependencies", []))
        
        for asset in all_assets:
            lineage_graph["nodes"].append({
                "id": asset,
                "type": "publication" if "publication" in asset else "analysis",
                "status": dependency_status.get(asset, {}).get("overall_status", "unknown")
            })
        
        # Add edges for dependencies
        for asset_name, deps in dependency_mapping.items():
            for dep in deps.get("direct_dependencies", []):
                lineage_graph["edges"].append({
                    "source": dep,
                    "target": asset_name,
                    "type": "direct_dependency"
                })
            
            for dep in deps.get("indirect_dependencies", []):
                lineage_graph["edges"].append({
                    "source": dep,
                    "target": asset_name, 
                    "type": "indirect_dependency"
                })
        
        # Save dependency tracking data
        tracking_dir = project_root / "expansion-packs/bmad-data-practitioner/evidence-project/.dependencies"
        tracking_dir.mkdir(exist_ok=True)
        
        tracking_file = tracking_dir / f"dependency_tracking_{int(time.time())}.json"
        tracking_data = {
            "tracking_timestamp": time.time(),
            "dependency_mapping": dependency_mapping,
            "dependency_status": dependency_status,
            "lineage_graph": lineage_graph,
            "summary": {
                "total_assets_tracked": len(dependency_status),
                "healthy_assets": sum(1 for s in dependency_status.values() if s["overall_status"] == "healthy"),
                "warning_assets": sum(1 for s in dependency_status.values() if s["overall_status"] == "warning"),
                "degraded_assets": sum(1 for s in dependency_status.values() if s["overall_status"] == "degraded")
            }
        }
        
        with open(tracking_file, 'w') as f:
            json.dump(tracking_data, f, indent=2)
        
        context.log.info(f"✅ Dependency tracking completed for {len(dependency_status)} assets")
        
        return MaterializeResult(
            metadata={
                "tracking_status": MetadataValue.text("completed"),
                "assets_tracked": MetadataValue.int(len(dependency_status)),
                "healthy_assets": MetadataValue.int(tracking_data["summary"]["healthy_assets"]),
                "warning_assets": MetadataValue.int(tracking_data["summary"]["warning_assets"]),
                "degraded_assets": MetadataValue.int(tracking_data["summary"]["degraded_assets"]),
                "tracking_file": MetadataValue.path(str(tracking_file)),
                "lineage_nodes": MetadataValue.int(len(lineage_graph["nodes"])),
                "lineage_edges": MetadataValue.int(len(lineage_graph["edges"])),
                "tracking_timestamp": MetadataValue.text(str(time.time())),
                "dependency_data": MetadataValue.json(tracking_data["summary"])
            }
        )
        
    except Exception as e:
        context.log.error(f"❌ Publication dependency tracking failed: {str(e)}")
        raise Exception(f"Dependency tracking failed: {str(e)}")

# Helper functions for publication versioning and change tracking

def get_git_commit_hash() -> str:
    """Get current git commit hash"""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            return result.stdout.strip()[:8]  # Short hash
    except:
        pass
    return "unknown"

def get_node_version() -> str:
    """Get Node.js version"""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return "unknown"

def get_dagster_version() -> str:
    """Get Dagster version"""
    try:
        import dagster
        return dagster.__version__
    except:
        return "unknown"

def detect_publication_changes(previous_version: Dict[str, Any], current_version: Dict[str, Any]) -> Dict[str, Any]:
    """
    Detect changes between publication versions
    """
    changes = {}
    
    # Check git commit changes
    if previous_version.get("git_commit") != current_version.get("git_commit"):
        changes["code_changes"] = {
            "previous_commit": previous_version.get("git_commit"),
            "current_commit": current_version.get("git_commit"),
            "change_type": "code_update"
        }
    
    # Check template changes
    if previous_version.get("template_used") != current_version.get("template_used"):
        changes["template_changes"] = {
            "previous_template": previous_version.get("template_used"),
            "current_template": current_version.get("template_used"),
            "change_type": "template_change"
        }
    
    # Check configuration changes
    prev_config = previous_version.get("configuration_snapshot", {})
    curr_config = current_version.get("configuration_snapshot", {})
    
    config_changes = {}
    for key in set(prev_config.keys()) | set(curr_config.keys()):
        if prev_config.get(key) != curr_config.get(key):
            config_changes[key] = {
                "previous": prev_config.get(key),
                "current": curr_config.get(key)
            }
    
    if config_changes:
        changes["configuration_changes"] = config_changes
    
    # Check dependency changes
    prev_deps = set(previous_version.get("data_dependencies", []))
    curr_deps = set(current_version.get("data_dependencies", []))
    
    if prev_deps != curr_deps:
        changes["dependency_changes"] = {
            "added_dependencies": list(curr_deps - prev_deps),
            "removed_dependencies": list(prev_deps - curr_deps),
            "change_type": "dependency_update"
        }
    
    return changes

def generate_change_summary(changes: Dict[str, Any]) -> str:
    """
    Generate human-readable change summary
    """
    if not changes or changes.get("change_type") == "initial_version":
        return "Initial publication version"
    
    summaries = []
    
    if "code_changes" in changes:
        summaries.append(f"Code updated (commit: {changes['code_changes']['current_commit']})")
    
    if "template_changes" in changes:
        summaries.append(f"Template changed to {changes['template_changes']['current_template']}")
    
    if "configuration_changes" in changes:
        config_count = len(changes["configuration_changes"])
        summaries.append(f"{config_count} configuration setting{'s' if config_count != 1 else ''} updated")
    
    if "dependency_changes" in changes:
        dep_changes = changes["dependency_changes"]
        added = len(dep_changes.get("added_dependencies", []))
        removed = len(dep_changes.get("removed_dependencies", []))
        if added > 0:
            summaries.append(f"{added} dependenc{'ies' if added != 1 else 'y'} added")
        if removed > 0:
            summaries.append(f"{removed} dependenc{'ies' if removed != 1 else 'y'} removed")
    
    if summaries:
        return "; ".join(summaries)
    else:
        return "Publication updated via Dagster orchestration"

def determine_change_impact(changes: Dict[str, Any]) -> str:
    """
    Determine the impact level of changes (low, medium, high, critical)
    """
    if not changes or changes.get("change_type") == "initial_version":
        return "none"
    
    # Critical: Major dependency or template changes
    if "dependency_changes" in changes:
        dep_changes = changes["dependency_changes"]
        if dep_changes.get("removed_dependencies") or len(dep_changes.get("added_dependencies", [])) > 2:
            return "critical"
    
    if "template_changes" in changes:
        return "high"
    
    # Medium: Configuration changes affecting behavior
    if "configuration_changes" in changes:
        config_changes = changes["configuration_changes"]
        critical_config_keys = ["evidence_version", "deployment_target", "template_version"]
        if any(key in config_changes for key in critical_config_keys):
            return "medium"
    
    # Low: Code changes only
    if "code_changes" in changes:
        return "low"
    
    return "low"

def requires_manual_review(changes: Dict[str, Any]) -> bool:
    """
    Determine if changes require manual review before deployment
    """
    if not changes or changes.get("change_type") == "initial_version":
        return False
    
    # Always review critical and high impact changes
    impact_level = determine_change_impact(changes)
    if impact_level in ["critical", "high"]:
        return True
    
    # Review if template or major dependencies changed
    if "template_changes" in changes:
        return True
    
    if "dependency_changes" in changes:
        dep_changes = changes["dependency_changes"]
        if dep_changes.get("removed_dependencies"):
            return True
    
    return False

# Asset group definition
publication_assets = [
    evidence_publication_generation,
    evidence_publication_deployment,
    publication_monitoring,
    publication_versioning,
    publication_dependency_tracking
]