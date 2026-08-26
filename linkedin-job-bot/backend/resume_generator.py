import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def generate_pdf_resume(tailored_json: dict, output_path: str):
    """
    Generates a highly professional, single-column, ATS-friendly PDF resume
    where all content flows naturally across pages without clipping.
    """
    # 0.5 in margins (36pt)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Premium Color Palette
    PRIMARY_COLOR = colors.HexColor("#0f172a")    # Slate-900 (Bold headings)
    SECONDARY_COLOR = colors.HexColor("#1e293b")  # Slate-800 (Job Titles)
    TEXT_COLOR = colors.HexColor("#334155")       # Slate-700 (Body text)
    LINE_COLOR = colors.HexColor("#94a3b8")       # Slate-400 (Dividers)
    
    # Typography Styles
    name_style = ParagraphStyle(
        'ATSName',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR,
        alignment=TA_CENTER,
        spaceAfter=3
    )
    
    contact_style = ParagraphStyle(
        'ATSContact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_COLOR,
        alignment=TA_CENTER,
        spaceAfter=8
    )
    
    section_heading = ParagraphStyle(
        'ATSSectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=PRIMARY_COLOR,
        spaceBefore=12,
        spaceAfter=2,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'ATSBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_COLOR,
        alignment=TA_JUSTIFY
    )
    
    bullet_style = ParagraphStyle(
        'ATSBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=TEXT_COLOR,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=2.5
    )

    story = []
    
    # Helper to draw clean divider line
    def draw_section_line():
        line_table = Table([[""]], colWidths=[540], rowHeights=[0.75])
        line_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), LINE_COLOR),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        return line_table

    # --- 1. Header (Name & Contact) ---
    name = tailored_json.get("full_name", "Sooraj Bhaskar Ajith").strip()
    contact = tailored_json.get("contact_info", {})
    phone = contact.get("phone", "+1(437)679-0527")
    email = contact.get("email", "sooraj1119@gmail.com")
    location = contact.get("location", "Toronto, ON, M6K 3G2")
    linkedin = contact.get("linkedin", "linkedin.com/in/sooraj")
    
    contact_parts = [phone, email, location]
    if linkedin:
        contact_parts.append(linkedin)
    contact_text = "   |   ".join(contact_parts)
    
    story.append(Paragraph(name, name_style))
    story.append(Paragraph(contact_text, contact_style))
    
    # --- 2. Summary ---
    summary_text = tailored_json.get("tailored_summary", "")
    if summary_text:
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_heading))
        story.append(draw_section_line())
        story.append(Spacer(1, 4))
        story.append(Paragraph(summary_text, body_style))
        
    # --- 3. Experience ---
    experience = tailored_json.get("experience", [])
    if experience:
        story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_heading))
        story.append(draw_section_line())
        story.append(Spacer(1, 4))
        
        for job in experience:
            job_title = job.get("job_title", "")
            company = job.get("company", "")
            loc = job.get("location", "Toronto, CA")
            dates = job.get("dates", "")
            
            # Company (Left) | Location (Right)
            left_r1 = f"<b>{company}</b>"
            right_r1 = f"<b>{loc}</b>"
            # Title (Left) | Dates (Right)
            left_r2 = f"<i>{job_title}</i>"
            right_r2 = f"<i>{dates}</i>"
            
            job_table = Table(
                [
                    [Paragraph(left_r1, body_style), Paragraph(right_r1, ParagraphStyle('R1', parent=body_style, alignment=TA_RIGHT))],
                    [Paragraph(left_r2, body_style), Paragraph(right_r2, ParagraphStyle('R2', parent=body_style, alignment=TA_RIGHT))]
                ],
                colWidths=[380, 160]
            )
            job_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('TOPPADDING', (0,0), (-1,-1), 1),
                ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ]))
            
            story.append(job_table)
            story.append(Spacer(1, 2))
            
            bullets = job.get("tailored_bullets", [])
            for bullet in bullets:
                story.append(Paragraph(f"&bull; {bullet}", bullet_style))
            story.append(Spacer(1, 6))
            
    # --- 4. Technical Skills ---
    story.append(Paragraph("TECHNICAL SKILLS", section_heading))
    story.append(draw_section_line())
    story.append(Spacer(1, 4))
    
    skills_categories = [
        ("Data & Analytics Tools", "Azure Databricks, Apache Hadoop, PySpark, Power BI, Tableau, SQL Scripting, Python (Machine Learning), Visio"),
        ("API & Integration Tools", "Swagger (OpenAPI), Postman, Figma, Visio"),
        ("DevOps & Automation", "GitHub, Selenium"),
        ("Agile & Project Methodologies", "Scrum, Kanban, SDLC, Jira, Confluence, ServiceNow, Lean Six Sigma")
    ]
    
    for category, skills_list in skills_categories:
        skills_text = f"<b>{category}:</b> {skills_list}"
        story.append(Paragraph(skills_text, body_style))
        story.append(Spacer(1, 1.5))
        
    # --- 5. Education ---
    story.append(Paragraph("EDUCATION", section_heading))
    story.append(draw_section_line())
    story.append(Spacer(1, 4))
    
    education = [
        {"degree": "PostGraduate - Business Insights and Analytics", "school": "University of Guelph - Humber College", "dates": "Graduated with Honors"},
        {"degree": "B. Tech in Electronics and Communication Eng", "school": "Amrita University", "dates": ""}
    ]
    
    for edu in education:
        edu_left = f"<b>{edu['school']}</b> — <i>{edu['degree']}</i>"
        edu_right = f"<i>{edu['dates']}</i>"
        
        edu_table = Table(
            [[Paragraph(edu_left, body_style), Paragraph(edu_right, ParagraphStyle('RE', parent=body_style, alignment=TA_RIGHT))]],
            colWidths=[400, 140]
        )
        edu_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
        ]))
        story.append(edu_table)
    story.append(Spacer(1, 6))

    # --- 6. Certifications & Languages ---
    story.append(Paragraph("CERTIFICATIONS & LANGUAGES", section_heading))
    story.append(draw_section_line())
    story.append(Spacer(1, 4))
    
    certs = "Career Essentials in Business Analysis by Microsoft  |  IBM Data Science Methodology  |  Certification in Business Analytics from TCS"
    story.append(Paragraph(f"<b>Certifications:</b> {certs}", body_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("<b>Languages:</b> English (Native)  |  Malayalam (Native)", body_style))

    # Build PDF
    doc.build(story)

if __name__ == "__main__":
    sample_data = {
        "full_name": "Sooraj Bhaskar Ajith",
        "contact_info": {
            "phone": "+1(437)679-0527",
            "email": "sooraj1119@gmail.com",
            "location": "Toronto, ON",
            "linkedin": "linkedin.com/in/sooraj"
        },
        "tailored_summary": "Test Summary...",
        "experience": [
            {
                "job_title": "Product Owner",
                "company": "TCS",
                "location": "Toronto, CA",
                "dates": "05/2023 - Present",
                "tailored_bullets": ["Bullet 1", "Bullet 2"]
            }
        ]
    }
    generate_pdf_resume(sample_data, "test.pdf")
