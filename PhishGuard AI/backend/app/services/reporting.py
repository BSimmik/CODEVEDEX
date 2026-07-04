import io
import csv
import json
from datetime import datetime
from sqlalchemy.orm import Session

# ReportLab PDF imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.models.models import User, BehaviorMetrics, Simulation, QuizResult, RiskScore, AuditLog

def compile_reporting_data(db: Session) -> dict:
    total_users = db.query(User).count()
    users_with_mfa = db.query(User).filter(User.mfa_enabled == True).count()
    sim_sent = db.query(Simulation).count()
    sim_clicks = db.query(Simulation).filter(Simulation.status == "Clicked").count()
    sim_replies = db.query(Simulation).filter(Simulation.status == "Replied").count()
    
    quiz_taken = db.query(QuizResult).count()
    quiz_passed = db.query(QuizResult).filter(QuizResult.passed == True).count()
    
    # Calculate Org risk score
    latest_org_risk = db.query(RiskScore).filter(RiskScore.scope == "Organization").order_by(RiskScore.calculated_at.desc()).first()
    org_risk = latest_org_risk.score if latest_org_risk else 45.0
    org_level = latest_org_risk.risk_level if latest_org_risk else "Medium"
    
    compliance = {
        "NIST_CSF_PR_AT_1": "Fully Met" if quiz_passed > 0 else "Partially Met",
        "ISO_27001_A_7_2_2": "Met" if users_with_mfa > 0 else "Needs Improvement",
        "OWASP_A01": "Partially Met" if sim_sent > 0 else "Not Met",
        "CIS_Control_14": "Met" if total_users > 0 else "Not Met"
    }

    # Department comparison metrics
    dept_stats = []
    depts = db.query(User.department).distinct().all()
    for (d_name,) in depts:
        if not d_name:
            continue
        d_users = db.query(User).filter(User.department == d_name).all()
        u_ids = [u.id for u in d_users]
        
        clicks = db.query(Simulation).filter(Simulation.user_id.in_(u_ids), Simulation.status == "Clicked").count() if u_ids else 0
        total_sims = db.query(Simulation).filter(Simulation.user_id.in_(u_ids)).count() if u_ids else 0
        click_rate = round((clicks / total_sims) * 100, 1) if total_sims > 0 else 0.0
        
        dept_stats.append({
            "department": d_name,
            "employees": len(d_users),
            "simulations_sent": total_sims,
            "simulation_clicks": clicks,
            "click_rate_pct": click_rate
        })

    data = {
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "total_employees": total_users,
        "mfa_adoption_pct": round((users_with_mfa / total_users) * 100, 1) if total_users > 0 else 0.0,
        "organization_risk_score": org_risk,
        "organization_risk_level": org_level,
        "simulations": {
            "sent": sim_sent,
            "clicked": sim_clicks,
            "replied": sim_replies,
            "click_rate_pct": round((sim_clicks / sim_sent) * 100, 1) if sim_sent > 0 else 0.0,
            "compromise_rate_pct": round((sim_replies / sim_sent) * 100, 1) if sim_sent > 0 else 0.0
        },
        "training": {
            "quizzes_taken": quiz_taken,
            "quizzes_passed": quiz_passed,
            "pass_rate_pct": round((quiz_passed / quiz_taken) * 100, 1) if quiz_taken > 0 else 0.0
        },
        "departments": dept_stats,
        "compliance": compliance,
        "recommendations": [
            "Mandate MFA configuration across all departments to counter Credential Theft campaigns.",
            "Deploy specialized spear-phishing simulation runs targeting HR & Finance teams due to high click-rates.",
            "Automate recurring Phishing Training courses for users failing simulations twice or more."
        ]
    }
    return data

def generate_pdf_report(data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        name="DocTitle",
        parent=styles["Title"],
        textColor=colors.HexColor("#0f172a"),
        fontSize=24,
        leading=28,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        name="Header1",
        parent=styles["Heading1"],
        textColor=colors.HexColor("#1e293b"),
        fontSize=16,
        leading=20,
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        name="BodyTextCustom",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        spaceAfter=8
    )

    bold_style = ParagraphStyle(
        name="BodyBoldCustom",
        parent=body_style,
        fontName="Helvetica-Bold"
    )

    # Cover Header
    story.append(Paragraph("PhishGuard AI - Cybersecurity Assessment Report", title_style))
    story.append(Paragraph(f"Generated on: {data['timestamp']} | Scope: Organization-wide", body_style))
    story.append(Spacer(1, 15))

    # Executive Summary Section
    story.append(Paragraph("Executive Summary", h1_style))
    summary_text = (
        f"This security report evaluates the current phishing awareness and vulnerability profiles across the organization. "
        f"A total of <b>{data['total_employees']}</b> employees are monitored, presenting an overall organization-wide risk score of "
        f"<b>{data['organization_risk_score']}</b> (Level: <b>{data['organization_risk_level']}</b>). Current Multi-Factor Authentication "
        f"adoption sits at <b>{data['mfa_adoption_pct']}%</b>."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 10))

    # Simulation results
    story.append(Paragraph("Safe Phishing Simulations Metrics", h1_style))
    sim_stats = [
        ["Metric Category", "Value Count / Percentage"],
        ["Simulations Dispatched", str(data["simulations"]["sent"])],
        ["Simulations Clicks", str(data["simulations"]["clicked"])],
        ["Simulations Replies", str(data["simulations"]["replied"])],
        ["Click Rate (%)", f"{data['simulations']['click_rate_pct']}%"],
        ["Compromise Rate (%)", f"{data['simulations']['compromise_rate_pct']}%"]
    ]
    t_sim = Table(sim_stats, colWidths=[200, 150])
    t_sim.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    story.append(t_sim)
    story.append(Spacer(1, 15))

    # Training Progress
    story.append(Paragraph("Training & Quiz Performance Summary", h1_style))
    train_stats = [
        ["Training Metric", "Data Value"],
        ["Total Quizzes Attempted", str(data["training"]["quizzes_taken"])],
        ["Quizzes Passed", str(data["training"]["quizzes_passed"])],
        ["Passing Rate", f"{data['training']['pass_rate_pct']}%"]
    ]
    t_train = Table(train_stats, colWidths=[200, 150])
    t_train.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    story.append(t_train)
    story.append(Spacer(1, 15))

    # Compliance Mapping
    story.append(Paragraph("Compliance Mapping Status", h1_style))
    comp_data = [
        ["Framework Standard Control", "Scope Description", "Compliance Status"],
        ["NIST CSF PR.AT-1", "Security awareness training completed", data["compliance"]["NIST_CSF_PR_AT_1"]],
        ["ISO/IEC 27001 A.7.2.2", "MFA configuration & access management", data["compliance"]["ISO_27001_A_7_2_2"]],
        ["OWASP Top 10 Awareness", "Mitigation policies against phishing/theft", data["compliance"]["OWASP_A01"]],
        ["CIS Critical Control 14", "Security training & employee awareness programs", data["compliance"]["CIS_Control_14"]]
    ]
    t_comp = Table(comp_data, colWidths=[150, 200, 100])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 15))

    # Recommendations
    story.append(Paragraph("Security Recommendations", h1_style))
    for rec in data["recommendations"]:
        story.append(Paragraph(f"• {rec}", body_style))

    doc.build(story)
    return buffer.getvalue()

def generate_csv_report(data: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Metadata
    writer.writerow(["PHISHGUARD AI SECURITY REPORT"])
    writer.writerow(["Timestamp", data["timestamp"]])
    writer.writerow([])
    
    # Overview
    writer.writerow(["METRIC CATEGORY", "VALUE"])
    writer.writerow(["Total monitored employees", data["total_employees"]])
    writer.writerow(["MFA adoption rate (%)", data["mfa_adoption_pct"]])
    writer.writerow(["Organization risk score", data["organization_risk_score"]])
    writer.writerow(["Organization risk level", data["organization_risk_level"]])
    writer.writerow([])
    
    # Simulations
    writer.writerow(["SIMULATION METRICS", "VALUE"])
    writer.writerow(["Sent", data["simulations"]["sent"]])
    writer.writerow(["Clicked", data["simulations"]["clicked"]])
    writer.writerow(["Replied", data["simulations"]["replied"]])
    writer.writerow(["Click rate (%)", data["simulations"]["click_rate_pct"]])
    writer.writerow([])
    
    # Departments
    writer.writerow(["DEPARTMENT STATS", "EMPLOYEES", "SENT", "CLICKED", "CLICK RATE (%)"])
    for d in data["departments"]:
        writer.writerow([d["department"], d["employees"], d["simulations_sent"], d["simulation_clicks"], d["click_rate_pct"]])
    writer.writerow([])

    # Compliance
    writer.writerow(["COMPLIANCE CODE", "STATUS"])
    for k, v in data["compliance"].items():
        writer.writerow([k, v])
        
    return output.getvalue()
