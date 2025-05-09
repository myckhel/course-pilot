from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

# Create PDF document
pdf_path = "sample_lecture.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=letter)
story = []

# Get sample styles
styles = getSampleStyleSheet()
title_style = styles["Title"]
heading_style = styles["Heading1"]
normal_style = styles["Normal"]

# Add title
story.append(Paragraph("Sample Lecture Notes: Introduction to Artificial Intelligence", title_style))
story.append(Paragraph("Dr. Example Professor", normal_style))
story.append(Paragraph("February 2024", normal_style))
story.append(Spacer(1, 20))

# Section 1
story.append(Paragraph("Introduction to AI", heading_style))
story.append(Paragraph(
    "Artificial Intelligence (AI) is the field that aims to create systems capable of performing tasks "
    "that would normally require human intelligence. These include learning, reasoning, problem-solving, "
    "perception, and language understanding.", normal_style))
story.append(Spacer(1, 15))

# Section 2
story.append(Paragraph("Machine Learning Basics", heading_style))
story.append(Paragraph(
    "Machine Learning is a subset of AI focused on algorithms that improve automatically through experience. "
    "The main types are:", normal_style))
story.append(Paragraph("• Supervised Learning: Learning from labeled examples", normal_style))
story.append(Paragraph("• Unsupervised Learning: Finding patterns in unlabeled data", normal_style))
story.append(Paragraph("• Reinforcement Learning: Learning through interactions with an environment", normal_style))
story.append(Spacer(1, 15))

# Section 3
story.append(Paragraph("Natural Language Processing", heading_style))
story.append(Paragraph(
    "Natural Language Processing (NLP) is the ability of computers to understand, interpret, and generate "
    "human language. Key concepts include:", normal_style))
story.append(Paragraph("• Tokenization: Breaking text into meaningful units", normal_style))
story.append(Paragraph("• Word Embeddings: Representing words as vectors in a continuous space", normal_style))
story.append(Paragraph("• Language Models: Systems that predict the likelihood of sequences of words", normal_style))

# Build the PDF
doc.build(story)
print(f"Sample PDF created: {pdf_path}")
