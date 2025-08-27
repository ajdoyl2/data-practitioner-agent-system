"""
Publication Monitoring and Alerting System
Story 1.7 Task 8: Monitoring and alerting for publication build failures
"""

from dagster import (
    sensor,
    SensorEvaluationContext,
    DefaultSensorStatus,
    RunRequest,
    SkipReason,
    DagsterEventType,
    job,
    op,
    OpExecutionContext,
    Config
)
import subprocess
import json
import time
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path

class AlertingConfig(Config):
    """Configuration for publication monitoring alerts"""
    alert_channels: List[str] = ["email", "slack"]
    email_recipients: List[str] = []
    slack_webhook_url: Optional[str] = None
    alert_severity_threshold: str = "warning"  # info, warning, error, critical
    enable_performance_alerts: bool = True
    enable_availability_alerts: bool = True

@job(
    name="publication_alert_handler",
    description="Handle publication monitoring alerts and notifications",
    tags={"monitoring": "publication", "story": "1.7"}
)
def publication_alert_handler_job():
    """
    Job for handling publication monitoring alerts
    Processes alerts and sends notifications through configured channels
    """
    
    @op(
        name="process_alert",
        description="Process and route publication alerts"
    )
    def process_alert_op(context: OpExecutionContext, config: AlertingConfig) -> Dict[str, Any]:
        """Process publication alerts and route to appropriate channels"""
        
        # Get alert information from run config
        alert_info = context.run_config.get("ops", {}).get("process_alert", {}).get("alert_data", {})
        
        if not alert_info:
            context.log.warning("No alert data provided")
            return {"status": "skipped", "reason": "no_alert_data"}
        
        alert_type = alert_info.get("alert_type", "unknown")
        severity = alert_info.get("severity", "info")
        message = alert_info.get("message", "Publication monitoring alert")
        
        context.log.info(f"Processing {severity} alert: {alert_type}")
        
        # Filter based on severity threshold
        severity_levels = {"info": 0, "warning": 1, "error": 2, "critical": 3}
        threshold_level = severity_levels.get(config.alert_severity_threshold, 1)
        current_level = severity_levels.get(severity, 0)
        
        if current_level < threshold_level:
            context.log.info(f"Alert severity {severity} below threshold {config.alert_severity_threshold}, skipping")
            return {"status": "filtered", "reason": "below_threshold"}
        
        # Send alerts through configured channels
        alert_results = []
        
        if "email" in config.alert_channels and config.email_recipients:
            email_result = send_email_alert(alert_info, config.email_recipients)
            alert_results.append({"channel": "email", "result": email_result})
        
        if "slack" in config.alert_channels and config.slack_webhook_url:
            slack_result = send_slack_alert(alert_info, config.slack_webhook_url)
            alert_results.append({"channel": "slack", "result": slack_result})
        
        context.log.info(f"Alert processed through {len(alert_results)} channels")
        
        return {
            "status": "processed",
            "alert_type": alert_type,
            "severity": severity,
            "channels_notified": len(alert_results),
            "results": alert_results,
            "timestamp": datetime.now().isoformat()
        }
    
    # Execute alert processing
    process_alert_op()

@sensor(
    job=publication_alert_handler_job,
    default_status=DefaultSensorStatus.STOPPED,
    description="Monitor publication pipeline for failures and performance issues",
    minimum_interval_seconds=60  # Check every minute for failures
)
def publication_failure_sensor(context: SensorEvaluationContext):
    """
    Sensor that monitors publication pipeline runs for failures and performance issues
    Triggers alert handling when issues are detected
    """
    
    try:
        # Check for recent publication pipeline failures
        failure_events = check_publication_failures(context)
        performance_issues = check_performance_issues(context)
        
        all_issues = failure_events + performance_issues
        
        if not all_issues:
            return SkipReason("No publication issues detected")
        
        # Process each issue and generate alert requests
        alert_requests = []
        
        for issue in all_issues:
            alert_severity = determine_alert_severity(issue)
            
            alert_config = {
                "ops": {
                    "process_alert": {
                        "config": {
                            "alert_channels": ["email", "slack"],
                            "email_recipients": get_alert_recipients(),
                            "slack_webhook_url": os.getenv("SLACK_WEBHOOK_URL"),
                            "alert_severity_threshold": "warning"
                        },
                        "alert_data": {
                            "alert_type": issue["type"],
                            "severity": alert_severity,
                            "message": issue["message"],
                            "details": issue.get("details", {}),
                            "timestamp": issue["timestamp"],
                            "run_id": issue.get("run_id"),
                            "asset_key": issue.get("asset_key")
                        }
                    }
                }
            }
            
            tags = {
                "alert_type": issue["type"],
                "severity": alert_severity,
                "story": "1.7",
                "monitoring": "publication",
                "timestamp": issue["timestamp"]
            }
            
            alert_requests.append(RunRequest(
                run_key=f"alert_{issue['type']}_{issue['timestamp']}",
                run_config=alert_config,
                tags=tags
            ))
        
        context.log.info(f"Detected {len(all_issues)} publication issues, generating {len(alert_requests)} alerts")
        
        return alert_requests
        
    except Exception as e:
        context.log.error(f"Error in publication failure sensor: {str(e)}")
        return SkipReason(f"Sensor error: {str(e)}")

def check_publication_failures(context: SensorEvaluationContext) -> List[Dict[str, Any]]:
    """
    Check for publication pipeline failures in recent runs
    """
    
    failures = []
    
    try:
        # Get cursor for last check time
        last_check_str = context.cursor or "{}"
        last_check_dict = json.loads(last_check_str) if last_check_str else {}
        last_failure_check = last_check_dict.get("last_failure_check")
        
        if last_failure_check:
            last_check_time = datetime.fromisoformat(last_failure_check)
        else:
            last_check_time = datetime.now() - timedelta(hours=1)
        
        current_time = datetime.now()
        
        # Mock failure detection (in real implementation, would query Dagster event log)
        # Simulate occasional failures for testing
        import random
        if random.random() < 0.05:  # 5% chance of simulated failure
            failures.append({
                "type": "publication_build_failure",
                "message": "Evidence.dev publication build failed: Template compilation error",
                "timestamp": current_time.isoformat(),
                "run_id": f"mock_run_{int(current_time.timestamp())}",
                "asset_key": "evidence_publication_generation",
                "details": {
                    "error_type": "template_compilation",
                    "template_name": "insight-document",
                    "error_message": "SQL query syntax error in template"
                }
            })
        
        if random.random() < 0.03:  # 3% chance of deployment failure
            failures.append({
                "type": "publication_deployment_failure", 
                "message": "Publication deployment to staging failed",
                "timestamp": current_time.isoformat(),
                "run_id": f"mock_deploy_{int(current_time.timestamp())}",
                "asset_key": "evidence_publication_deployment",
                "details": {
                    "deployment_platform": "netlify",
                    "error_type": "authentication_failure",
                    "error_message": "Invalid deployment credentials"
                }
            })
        
        # Update cursor
        last_check_dict["last_failure_check"] = current_time.isoformat()
        context.update_cursor(json.dumps(last_check_dict))
        
    except Exception as e:
        context.log.error(f"Error checking publication failures: {str(e)}")
    
    return failures

def check_performance_issues(context: SensorEvaluationContext) -> List[Dict[str, Any]]:
    """
    Check for publication performance issues
    """
    
    issues = []
    
    try:
        # Mock performance issue detection
        import random
        current_time = datetime.now()
        
        # Simulate performance degradation
        if random.random() < 0.02:  # 2% chance of performance issue
            issues.append({
                "type": "publication_performance_degradation",
                "message": "Publication site load time exceeds threshold (>3s)",
                "timestamp": current_time.isoformat(),
                "details": {
                    "metric": "load_time",
                    "current_value": 4.2,
                    "threshold": 3.0,
                    "units": "seconds",
                    "site_url": "https://staging.example.com"
                }
            })
        
        if random.random() < 0.01:  # 1% chance of availability issue
            issues.append({
                "type": "publication_availability_issue",
                "message": "Publication site is returning 5xx errors",
                "timestamp": current_time.isoformat(),
                "details": {
                    "metric": "availability",
                    "error_rate": 15.3,
                    "threshold": 5.0,
                    "units": "percent",
                    "site_url": "https://production.example.com"
                }
            })
        
    except Exception as e:
        context.log.error(f"Error checking performance issues: {str(e)}")
    
    return issues

def determine_alert_severity(issue: Dict[str, Any]) -> str:
    """
    Determine alert severity based on issue type and details
    """
    
    issue_type = issue.get("type", "")
    
    # Critical issues
    if "failure" in issue_type and "production" in issue.get("message", ""):
        return "critical"
    
    # High priority issues
    if any(keyword in issue_type for keyword in ["failure", "error", "unavailable"]):
        return "error"
    
    # Performance degradation
    if "performance" in issue_type or "slow" in issue.get("message", ""):
        return "warning"
    
    # Default
    return "info"

def get_alert_recipients() -> List[str]:
    """
    Get list of email recipients for alerts from environment or configuration
    """
    
    recipients_env = os.getenv("PUBLICATION_ALERT_RECIPIENTS", "")
    if recipients_env:
        return [email.strip() for email in recipients_env.split(",")]
    
    # Default recipients (would be loaded from configuration)
    return ["devops@example.com", "data-team@example.com"]

def send_email_alert(alert_info: Dict[str, Any], recipients: List[str]) -> Dict[str, Any]:
    """
    Send alert via email (mock implementation)
    """
    
    try:
        # Mock email sending
        alert_type = alert_info.get("alert_type", "unknown")
        severity = alert_info.get("severity", "info")
        message = alert_info.get("message", "")
        
        email_body = f"""
        Publication Alert - {severity.upper()}
        
        Alert Type: {alert_type}
        Severity: {severity}
        Message: {message}
        
        Timestamp: {alert_info.get('timestamp')}
        Run ID: {alert_info.get('run_id', 'N/A')}
        
        Details: {json.dumps(alert_info.get('details', {}), indent=2)}
        """
        
        # In real implementation, would use email service (SendGrid, SES, SMTP)
        print(f"[EMAIL ALERT] Sending to {len(recipients)} recipients:")
        print(email_body)
        
        return {
            "status": "sent",
            "recipients": len(recipients),
            "method": "email"
        }
        
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "method": "email"
        }

def send_slack_alert(alert_info: Dict[str, Any], webhook_url: str) -> Dict[str, Any]:
    """
    Send alert via Slack webhook (mock implementation)
    """
    
    try:
        # Mock Slack webhook
        alert_type = alert_info.get("alert_type", "unknown")
        severity = alert_info.get("severity", "info")
        message = alert_info.get("message", "")
        
        # Choose emoji based on severity
        severity_emojis = {
            "info": "ℹ️",
            "warning": "⚠️", 
            "error": "❌",
            "critical": "🚨"
        }
        
        emoji = severity_emojis.get(severity, "ℹ️")
        
        slack_payload = {
            "text": f"{emoji} Publication Alert - {severity.upper()}",
            "attachments": [
                {
                    "color": "danger" if severity in ["error", "critical"] else "warning",
                    "fields": [
                        {
                            "title": "Alert Type",
                            "value": alert_type,
                            "short": True
                        },
                        {
                            "title": "Severity", 
                            "value": severity.upper(),
                            "short": True
                        },
                        {
                            "title": "Message",
                            "value": message,
                            "short": False
                        }
                    ],
                    "footer": "Data Practitioner Agent System",
                    "ts": int(datetime.now().timestamp())
                }
            ]
        }
        
        # In real implementation, would POST to webhook_url
        print(f"[SLACK ALERT] Sending to webhook: {webhook_url}")
        print(json.dumps(slack_payload, indent=2))
        
        return {
            "status": "sent",
            "webhook_url": webhook_url,
            "method": "slack"
        }
        
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "method": "slack"
        }