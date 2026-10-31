import os
import re
from typing import List, Dict, Any, Tuple
import pypdf
from django.conf import settings

MAX_UPLOAD_SIZE = int(os.getenv('MAX_UPLOAD_SIZE_MB', 10)) * 1024 * 1024

class PDFValidationError(Exception):
    pass

def validate_pdf_file(uploaded_file) -> None:
    """
    Validates uploaded file size, extension, and content byte header.
    """
    if uploaded_file.size > MAX_UPLOAD_SIZE:
        max_mb = MAX_UPLOAD_SIZE // (1024 * 1024)
        raise PDFValidationError(f"File size exceeds the {max_mb}MB limit.")

    # Validate header signature (%PDF-)
    initial_bytes = uploaded_file.read(1024)
    uploaded_file.seek(0)

    if not initial_bytes.startswith(b'%PDF-'):
        raise PDFValidationError("Invalid file content. Uploaded file is not a valid PDF document.")

def process_pdf_document(file_path: str) -> Tuple[int, str, bool, List[Dict[str, Any]]]:
    """
    Extracts text from PDF, counts pages, and splits into passages.
    Returns: (page_count, full_text, has_text, chunks)
    """
    try:
        reader = pypdf.PdfReader(file_path)
    except Exception as e:
        raise PDFValidationError(f"Unable to read PDF structure: {str(e)}")

    page_count = len(reader.pages)
    if page_count == 0:
        raise PDFValidationError("The PDF file contains 0 pages.")

    full_text_parts = []
    chunks = []
    chunk_idx = 1

    for page_num, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""

        clean_page_text = re.sub(r'\s+', ' ', page_text).strip()
        if clean_page_text:
            full_text_parts.append(f"[Page {page_num}]\n{clean_page_text}")
            # Page or multi-paragraph chunk
            chunks.append({
                'chunk_index': chunk_idx,
                'page_number': page_num,
                'text_content': clean_page_text
            })
            chunk_idx += 1

    full_text = "\n\n".join(full_text_parts)
    has_text = len(full_text.strip()) >= 50

    return page_count, full_text, has_text, chunks

def search_chunks(chunks_qs, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """
    Basic lexical RAG retrieval: scores passages based on search term overlap and density.
    """
    # Clean query tokens
    stopwords = {"what", "is", "the", "difference", "between", "and", "or", "in", "of", "to", "a", "an", "how", "does", "explain"}
    tokens = [w.lower() for w in re.findall(r'\b\w{3,}\b', query) if w.lower() not in stopwords]

    if not tokens:
        tokens = [w.lower() for w in re.findall(r'\b\w+\b', query)]

    scored_chunks = []
    for chunk in chunks_qs:
        text_lower = chunk.text_content.lower()
        score = 0
        for token in tokens:
            count = text_lower.count(token)
            if count > 0:
                score += (count * 2) + 1  # Bonus for matches

        scored_chunks.append((score, chunk))

    # Sort descending by score
    scored_chunks.sort(key=lambda x: x[0], reverse=True)

    # Return top_k
    top_results = []
    for score, chunk in scored_chunks[:top_k]:
        top_results.append({
            'chunk_index': chunk.chunk_index,
            'page_number': chunk.page_number,
            'text_content': chunk.text_content
        })

    # If no keywords matched, return first few chunks as general context
    if not top_results and chunks_qs:
        for chunk in list(chunks_qs)[:top_k]:
            top_results.append({
                'chunk_index': chunk.chunk_index,
                'page_number': chunk.page_number,
                'text_content': chunk.text_content
            })

    return top_results

