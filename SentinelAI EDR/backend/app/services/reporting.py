from sqlalchemy.orm import Session
from ..models.models import Endpoint, Alert, Incident
from ..repositories.repositories import EndpointRepository, AlertRepository, IncidentRepository
import csv
import json
import io
from datetime import datetime

class ReportingEngine:
    @staticmethod
    def compile_report_data(db: Session) -> dict:
        """
        Gathers system telemetry and compiles statistics for all sections of the report.
        """
        # Endpoints
        endpoints = db.query(Endpoint).all()
        total_endpoints = len(endpoints)
        healthy_endpoints = sum(1 for e in endpoints if e.health_status == "Healthy")
        warning_endpoints = sum(1 for e in endpoints if e.health_status == "Warning")
        critical_endpoints = sum(1 for e in endpoints if e.health_status == "Critical")
        
        endpoint_list = [
            {
                "id": e.id,
                "hostname": e.hostname,
                "ip": e.ip_address,
                "os": f"{e.os_name} {e.os_version or ''}",
                "status": e.status,
                "health": e.health_status,
                "score": e.posture_score
            }
            for e in endpoints
        ]

        # Alerts
        alerts = db.query(Alert).all()
        total_alerts = len(alerts)
        severity_dist = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Informational": 0}
        type_dist = {}
        for a in alerts:
            severity_dist[a.severity] = severity_dist.get(a.severity, 0) + 1
            type_dist[a.alert_type] = type_dist.get(a.alert_type, 0) + 1

        # Incidents
        incidents = db.query(Incident).all()
        total_incidents = len(incidents)
        status_dist = {"Open": 0, "Investigating": 0, "Contained": 0, "Resolved": 0, "Closed": 0}
        for i in incidents:
            status_dist[i.status] = status_dist.get(i.status, 0) + 1

        # Calculate average posture
        avg_posture = int(sum(e.posture_score for e in endpoints) / total_endpoints) if total_endpoints > 0 else 100

        # Formulate executive summaries and recommendations
        risk_level = "Low"
        if avg_posture < 60 or critical_endpoints > 0:
            risk_level = "Critical"
        elif avg_posture < 80 or severity_dist.get("High", 0) > 2:
            risk_level = "High"
        elif avg_posture < 90 or severity_dist.get("Medium", 0) > 5:
            risk_level = "Medium"

        exec_summary = (
            f"During this operational audit, SentinelAI EDR scanned {total_endpoints} active endpoints. "
            f"The environment maintains an average security posture score of {avg_posture}/100, which indicates a '{risk_level}' overall risk profile. "
            f"We identified {total_alerts} security alerts, of which {severity_dist.get('Critical', 0)} are classified as Critical severity."
        )

        recommendations = [
            "Upgrade out-of-date OS versions detected in the endpoint inventory.",
            "Deploy global endpoint agent configurations to scan critical system hosts.",
            "Review rulesets to alert on PowerShell execution pathways (-EncodedCommand).",
            "Establish active SOC triaging on all open incident tickets immediately."
        ]
        if critical_endpoints > 0:
            recommendations.insert(0, "Isolate the critical status endpoints from the core subnet immediately.")

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "executive_summary": exec_summary,
            "endpoint_inventory": {
                "total": total_endpoints,
                "healthy": healthy_endpoints,
                "warning": warning_endpoints,
                "critical": critical_endpoints,
                "list": endpoint_list
            },
            "threat_analysis": {
                "total_alerts": total_alerts,
                "severity_distribution": severity_dist,
                "type_distribution": type_dist
            },
            "incident_review": {
                "total_incidents": total_incidents,
                "status_distribution": status_dist
            },
            "risk_assessment": {
                "average_posture_score": avg_posture,
                "calculated_risk_level": risk_level
            },
            "recommendations": recommendations
        }

    @classmethod
    def generate_json(cls, db: Session) -> str:
        data = cls.compile_report_data(db)
        return json.dumps(data, indent=2)

    @classmethod
    def generate_csv(cls, db: Session) -> str:
        data = cls.compile_report_data(db)
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write general report summary
        writer.writerow(["SentinelAI EDR Security Report"])
        writer.writerow(["Generated At", data["timestamp"]])
        writer.writerow(["Risk Level", data["risk_assessment"]["calculated_risk_level"]])
        writer.writerow(["Average Posture Score", data["risk_assessment"]["average_posture_score"]])
        writer.writerow([])
        
        # Write Endpoint Inventory
        writer.writerow(["--- Endpoint Inventory ---"])
        writer.writerow(["Hostname", "IP Address", "OS", "Health Status", "Posture Score"])
        for e in data["endpoint_inventory"]["list"]:
            writer.writerow([e["hostname"], e["ip"], e["os"], e["health"], e["score"]])
            
        writer.writerow([])
        
        # Write Alert statistics
        writer.writerow(["--- Alert Distribution ---"])
        writer.writerow(["Severity", "Count"])
        for sev, count in data["threat_analysis"]["severity_distribution"].items():
            writer.writerow([sev, count])
            
        return output.getvalue()

    @classmethod
    def generate_html(cls, db: Session) -> str:
        data = cls.compile_report_data(db)
        
        endpoint_rows = ""
        for e in data["endpoint_inventory"]["list"]:
            badge_color = "green" if e["health"] == "Healthy" else ("yellow" if e["health"] == "Warning" else "red")
            endpoint_rows += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{e["hostname"]}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{e["ip"]}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{e["os"]}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><span style="color: {badge_color}; font-weight: bold;">{e["health"]}</span></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">{e["score"]}/100</td>
            </tr>
            """

        recommendation_list = ""
        for rec in data["recommendations"]:
            recommendation_list += f"<li style='margin-bottom: 8px;'>{rec}</li>"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>SentinelAI EDR - Security Audit Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }}
                h1 {{ color: #1e293b; border-bottom: 2px solid #334155; padding-bottom: 10px; }}
                h2 {{ color: #334155; margin-top: 30px; }}
                .summary-box {{ background-color: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 5px solid #0f172a; margin-bottom: 20px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
                th {{ background-color: #1e293b; color: white; padding: 10px; text-align: left; }}
                ul {{ padding-left: 20px; }}
            </style>
        </head>
        <body>
            <h1>SentinelAI EDR - Security Audit Report</h1>
            <p><strong>Generated on:</strong> {data["timestamp"]}</p>
            
            <div class="summary-box">
                <h2>Executive Summary</h2>
                <p>{data["executive_summary"]}</p>
                <p><strong>Risk Profile:</strong> {data["risk_assessment"]["calculated_risk_level"]} (Average Posture Score: {data["risk_assessment"]["average_posture_score"]}/100)</p>
            </div>

            <h2>Endpoint Health & Inventory</h2>
            <p>Scanning logged <strong>{data["endpoint_inventory"]["total"]}</strong> endpoints: {data["endpoint_inventory"]["healthy"]} healthy, {data["endpoint_inventory"]["warning"]} warning, {data["endpoint_inventory"]["critical"]} critical.</p>
            <table>
                <thead>
                    <tr>
                        <th>Hostname</th>
                        <th>IP Address</th>
                        <th>OS Version</th>
                        <th>Health Status</th>
                        <th>Security Posture</th>
                    </tr>
                </thead>
                <tbody>
                    {endpoint_rows}
                </tbody>
            </table>

            <h2>Threat & Incident Metrics</h2>
            <ul>
                <li>Total Alerts Captured: {data["threat_analysis"]["total_alerts"]}</li>
                <li>Critical Alerts: {data["threat_analysis"]["severity_distribution"].get("Critical", 0)}</li>
                <li>High Alerts: {data["threat_analysis"]["severity_distribution"].get("High", 0)}</li>
                <li>Total Active Incidents Under Triage: {data["incident_review"]["total_incidents"]}</li>
            </ul>

            <h2>Remediation Recommendations</h2>
            <ol>
                {recommendation_list}
            </ol>
        </body>
        </html>
        """
        return html_content
