from fpdf import FPDF
import cv2, os, tempfile, datetime, numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

NAVY = (15, 71, 97)
SLATE = (89, 89, 89)
WHITE = (255, 255, 255)
LIGHT = (248, 250, 252)
RED_BG = (254, 242, 242)
AMB_BG = (255, 251, 235)
GRN_BG = (240, 253, 244)
PAGE_W = 210
MARGIN = 15
CONTENT_W = PAGE_W - 2 * MARGIN


def _tmp_jpg(img_bgr):
    if img_bgr is None or (hasattr(img_bgr, 'size') and img_bgr.size == 0):
        img_bgr = np.full((200, 200, 3), 220, dtype=np.uint8)
    img = np.array(img_bgr).astype(np.uint8)
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.ndim == 3 and img.shape[2] == 1:
        img = cv2.cvtColor(img[:, :, 0], cv2.COLOR_GRAY2BGR)
    fd, path = tempfile.mkstemp(suffix='.jpg')
    os.close(fd)
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    return path


def _s(v):
    if v is None or v == '':
        return '-'
    return str(v).encode('latin-1', 'replace').decode('latin-1')


class DentalReport(FPDF):
    def __init__(self, hosp_name, doc_name, doc_spec):
        super().__init__()
        self.hosp_name = _s(hosp_name)
        self.doc_name = _s(doc_name)
        self.doc_spec = _s(doc_spec)
        self.set_margins(MARGIN, MARGIN, MARGIN)
        self.set_auto_page_break(auto=True, margin=16)

    def header(self):
        return

    def footer(self):
        return


def _section(pdf, title):
    pdf.ln(2)
    pdf.set_fill_color(*NAVY)
    pdf.set_text_color(*WHITE)
    pdf.set_font('Helvetica', 'B', 10.5)
    pdf.cell(CONTENT_W, 7, f'  {_s(title)}', ln=True, fill=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(1)


def _row(pdf, label, value, label_w=55):
    pdf.set_font('Helvetica', 'B', 8.5)
    pdf.set_fill_color(*LIGHT)
    pdf.set_text_color(*SLATE)
    pdf.cell(label_w, 6, f'  {_s(label)}', border=1, fill=True)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(CONTENT_W - label_w, 6, f'  {_s(value)}', border=1, ln=True)


def _findings(findings_list, class_id):
    return [f for f in (findings_list or []) if f.get('classId') == class_id and f.get('severity') != 'None']


def create_pdf_report(
    hosp_name, doc_name, doc_specialization,
    hosp_phone, hosp_email,
    pat_name, pat_age, pat_phone, pat_notes,
    conf_score, region_counts, class_names,
    findings_list,
    original_image, preprocessed_image, overlay_image,
    doc_complaint='', doc_summary='', doc_teeth='',
    doc_severity='', doc_treatment='', doc_notes='',
    img_quality='No significant technical limitations detected',
    exam_region='Maxillary Left/ Maxillary Anterior/ Maxillary Right\nMandibular Left/ Mandibular Anterior/Mandibular Right\n(Note: These regions should be added in the Desktop app in patient details)',
    ai_model_version='DivulgeAI v3.1',
    comp_phone='', comp_email='',
    output_path='Dental_Report.pdf',
    image_label='',
    image_index='1',
    total_images='1',
    report_id='',
):
    date_str = datetime.datetime.now().strftime('%B %d, %Y')
    time_str = datetime.datetime.now().strftime('%B %d, %Y  %I:%M %p')

    pdf = DentalReport(hosp_name, doc_name, doc_specialization)
    pdf.add_page()

    pdf.set_font('Helvetica', 'B', 13)
    pdf.set_text_color(*NAVY)
    pdf.multi_cell(CONTENT_W, 7, 'AI-Assisted Comprehensive Dental Radiographic Interpretation Report', align='C')
    pdf.set_text_color(0, 0, 0)
    pdf.ln(3)

    _section(pdf, 'Patient Details')
    _row(pdf, 'Patient Name', pat_name or '__________________________')
    _row(pdf, 'Patient ID', report_id or '__________________________')
    _row(pdf, 'Age / Gender', pat_age or '__________________________')
    _row(pdf, 'Date of Birth', '__________________________')
    _row(pdf, 'Examination Date', date_str)

    pdf.ln(3)

    _section(pdf, 'Radiographic Examination Details')
    _row(pdf, 'Imaging Modality', 'Intraoral Radiograph')
    _row(pdf, 'Radiograph Type', 'IOPA')
    _row(pdf, 'Region Examined', exam_region)
    _row(pdf, 'Technical Limitations', 'Technical Limitations: ☐ No significant technical limitations detected\nImage Quality Concerns: ☐ Underexposure ☐ Overexposure ☐ Motion blur ☐ Low contrast ☐ High noise ☐ Overlapping contacts ☐ Distortions ☐ Cone cut')
    _row(pdf, 'Impact on Interpretation:', '☐ No significant impact ☐ Mild limitation (most findings remain interpretable) ☐ Moderate limitation (some regions are difficult to assess) ☐ Severe limitation (repeat imaging recommended)')
    _row(pdf, 'AI Model Version', ai_model_version)
    _row(pdf, 'Analysis Date & Time', time_str)
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*SLATE)
    pdf.multi_cell(CONTENT_W, 5, '(Note: Technical limitation and impact on interpretation will further require coding.)', align='C')
    pdf.set_text_color(0, 0, 0)

    pdf.ln(3)

    _section(pdf, 'Radiographic Images:')
    img_w = (CONTENT_W - 6) / 3
    img_h = img_w * 0.72
    img_y = pdf.get_y()
    labels = ['Original Image', 'AI-Augmented Image', 'AI- Segmented Image']
    paths = []
    try:
        for i, img in enumerate([original_image, preprocessed_image, overlay_image]):
            p = _tmp_jpg(img)
            paths.append(p)
            pdf.image(p, x=MARGIN + i * (img_w + 3), y=img_y, w=img_w, h=img_h)
    finally:
        for p in paths:
            try:
                os.unlink(p)
            except Exception:
                pass
    pdf.set_y(img_y + img_h + 1)
    pdf.set_font('Helvetica', '', 8)
    for i, lbl in enumerate(labels):
        pdf.set_x(MARGIN + i * (img_w + 3))
        pdf.cell(img_w, 5, _s(lbl), align='C')
    pdf.ln(6)

    _section(pdf, 'AI Analysis Summary')
    widths = [CONTENT_W / 3, CONTENT_W / 3, CONTENT_W / 3]
    pdf.set_fill_color(*NAVY)
    pdf.set_text_color(*WHITE)
    pdf.set_font('Helvetica', 'B', 8.5)
    for title, width in zip(['Finding', 'Count', 'AI Confidence'], widths):
        pdf.cell(width, 7, f'  {title}', border=1, fill=True, align='C')
    pdf.ln(7)
    pdf.set_text_color(0, 0, 0)

    summary_map = [
        (2, 'Dental Caries', RED_BG),
        (5, 'Restorations', AMB_BG),
        (4, 'Dental Implants', GRN_BG),
    ]
    has_findings = False
    for cls_id, label, bg in summary_map:
        matching = _findings(findings_list, cls_id)
        if matching:
            has_findings = True
            count = len(matching)
            avg_conf = round(sum(f.get('confidence', 0) for f in matching) / count, 1)
        else:
            count = 0
            avg_conf = '-'
        pdf.set_fill_color(*bg)
        pdf.set_font('Helvetica', '', 8.5)
        pdf.cell(widths[0], 6, f'  {_s(label)}', border=1, fill=True)
        pdf.cell(widths[1], 6, f'  {count}', border=1, fill=True, align='C')
        pdf.cell(widths[2], 6, f'  {avg_conf if avg_conf == "-" else f"{avg_conf}%"}', border=1, fill=True, align='C', ln=True)

    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*SLATE)
    pdf.cell(0, 5, f'AI Model Confidence Score: {conf_score}%  |  Model: {ai_model_version}', ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(3)

    _section(pdf, 'Patient Information')
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 6, 'What did AI find?', ln=True)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(0, 0, 0)
    if has_findings:
        finding_parts = []
        for cls_id, label, _bg in summary_map:
            matching = _findings(findings_list, cls_id)
            if matching:
                fdis = ', '.join(f'FDI {f["fdiNumber"]}' for f in matching if f.get('fdiNumber'))
                finding_parts.append(f'{label} detected' + (f' at {fdis}' if fdis else '') + f' ({len(matching)} region{"s" if len(matching) > 1 else ""}).')
        ai_finding_text = '  '.join(finding_parts) if finding_parts else 'No abnormalities were detected in the radiographic images.'
    else:
        ai_finding_text = 'No abnormalities were detected in the radiographic images.'
    pdf.set_fill_color(*LIGHT)
    pdf.multi_cell(CONTENT_W, 6, f'  {_s(ai_finding_text)}', border=1, fill=True)
    pdf.ln(2)

    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 6, 'Why does it matter?', ln=True)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(0, 0, 0)
    matter_text = (
        'Routine monitoring is recommended. Preventive dental care and regular check-ups help maintain optimal oral health.'
        if not has_findings else
        'Early detection of dental pathologies enables timely intervention, preventing progression to more complex conditions. Untreated caries can lead to pulpal involvement, periapical pathology, and eventual tooth loss. Prompt restorative treatment and patient education are recommended.'
    )
    pdf.set_fill_color(*LIGHT)
    pdf.multi_cell(CONTENT_W, 6, f'  {_s(matter_text)}', border=1, fill=True)
    pdf.ln(3)

    _section(pdf, "Doctor's Clinical Assessment")
    def clinical_row(label, value):
        _row(pdf, label, value or '-')

    clinical_row('Chief Complaint', doc_complaint or 'Routine radiographic examination')
    clinical_row('Findings Summary', doc_summary or '-')
    clinical_row('Affected Teeth', doc_teeth or '-')
    clinical_row('Overall Severity', doc_severity or '-')
    clinical_row('Treatment Plan', doc_treatment or '-')
    clinical_row("Doctor's Notes", doc_notes or '-')

    pdf.ln(4)
    _section(pdf, 'Disclaimer:')
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(*SLATE)
    pdf.multi_cell(
        CONTENT_W,
        6,
        'This report is generated by an artificial intelligence-based radiographic analysis system and is intended to assist dental professionals. Radiographic findings should always be correlated with clinical examination, patient history, and professional judgment. Final diagnosis and treatment decisions remain the responsibility of the treating dental practitioner.',
        border=1,
        fill=True,
    )
    pdf.set_text_color(0, 0, 0)

    pdf.output(output_path)
    return output_path
