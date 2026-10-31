from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import StudyDocument, DocumentChunk, DocumentSummary
from .serializers import StudyDocumentSerializer, StudyDocumentDetailSerializer, DocumentSummarySerializer
from .services import validate_pdf_file, process_pdf_document, search_chunks, PDFValidationError
from core.gemini_service import gemini_service, GeminiError
from core.utils import success_response
from dashboard.models import StudyActivity

class DocumentListUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        docs = StudyDocument.objects.filter(user=request.user)
        serializer = StudyDocumentSerializer(docs, many=True)
        return success_response(data=serializer.data)

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'success': False, 'message': 'No PDF file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Validate file
        try:
            validate_pdf_file(file_obj)
        except PDFValidationError as ve:
            return Response({'success': False, 'message': str(ve)}, status=status.HTTP_400_BAD_REQUEST)

        title = request.data.get('title', '').strip() or file_obj.name.replace('.pdf', '')

        # 2. Save document record
        doc = StudyDocument.objects.create(
            user=request.user,
            file=file_obj,
            title=title,
            file_size=file_obj.size
        )

        # 3. Process PDF (Extract text & chunks)
        try:
            page_count, full_text, has_text, chunks = process_pdf_document(doc.file.path)
            doc.page_count = page_count
            doc.extracted_text = full_text
            doc.has_text = has_text
            doc.save(update_fields=['page_count', 'extracted_text', 'has_text'])

            # Bulk create chunks
            chunk_objects = [
                DocumentChunk(
                    document=doc,
                    chunk_index=c['chunk_index'],
                    page_number=c['page_number'],
                    text_content=c['text_content']
                ) for c in chunks
            ]
            DocumentChunk.objects.bulk_create(chunk_objects)

        except PDFValidationError as pe:
            doc.delete()
            return Response({'success': False, 'message': str(pe)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            doc.delete()
            return Response({'success': False, 'message': f'Failed to process PDF content: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 4. Record student activity
        StudyActivity.objects.create(
            user=request.user,
            activity_type='pdf',
            title=f'Uploaded PDF: {doc.title[:40]}',
            description=f'{doc.page_count} pages ({doc.file_size // 1024} KB)'
        )

        msg = 'PDF uploaded and processed successfully.'
        if not doc.has_text:
            msg = 'PDF uploaded. Note: This document appears to be a scanned image or empty. Text extraction/OCR is not currently available.'

        return Response({
            'success': True,
            'message': msg,
            'data': StudyDocumentSerializer(doc).data
        }, status=status.HTTP_201_CREATED)

class DocumentDetailDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def get_document(self, pk, user):
        try:
            return StudyDocument.objects.get(pk=pk, user=user)
        except StudyDocument.DoesNotExist:
            return None

    def get(self, request, pk):
        doc = self.get_document(pk, request.user)
        if not doc:
            return Response({'success': False, 'message': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)
        return success_response(data=StudyDocumentDetailSerializer(doc).data)

    def delete(self, request, pk):
        doc = self.get_document(pk, request.user)
        if not doc:
            return Response({'success': False, 'message': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)
        doc.delete()
        return success_response(message='Document deleted successfully.')

class DocumentSummarizeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            doc = StudyDocument.objects.get(pk=pk, user=request.user)
        except StudyDocument.DoesNotExist:
            return Response({'success': False, 'message': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not doc.has_text or not doc.extracted_text.strip():
            return Response({
                'success': False,
                'message': 'Cannot summarize document: No extractable text was found in this PDF (it may be a scanned image).'
            }, status=status.HTTP_400_BAD_REQUEST)

        summary_type = request.data.get('summary_type', 'comprehensive')
        try:
            summary_content = gemini_service.summarize_document(
                text=doc.extracted_text,
                summary_type=summary_type
            )
        except GeminiError as ge:
            return Response({'success': False, 'message': str(ge)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({'success': False, 'message': f'AI Summarization error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        summary_obj = DocumentSummary.objects.create(
            document=doc,
            summary_type=summary_type,
            content=summary_content
        )

        return Response({
            'success': True,
            'message': 'Summary generated successfully.',
            'data': DocumentSummarySerializer(summary_obj).data
        }, status=status.HTTP_201_CREATED)

class DocumentAskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            doc = StudyDocument.objects.get(pk=pk, user=request.user)
        except StudyDocument.DoesNotExist:
            return Response({'success': False, 'message': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not doc.has_text or not doc.extracted_text.strip():
            return Response({
                'success': False,
                'message': 'Cannot query document: No extractable text was found in this PDF.'
            }, status=status.HTTP_400_BAD_REQUEST)

        question = request.data.get('question', '').strip()
        if not question:
            return Response({'success': False, 'message': 'Question cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Retrieve top matching passages via RAG
        chunks_qs = doc.chunks.all()
        matched_chunks = search_chunks(chunks_qs, question, top_k=5)

        # 2. Ask Gemini with grounding
        try:
            answer = gemini_service.answer_from_chunks(question, matched_chunks)
        except GeminiError as ge:
            return Response({'success': False, 'message': str(ge)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({'success': False, 'message': f'AI Q&A error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return success_response(data={
            'document_id': doc.id,
            'question': question,
            'answer': answer,
            'referenced_pages': list(set([c['page_number'] for c in matched_chunks]))
        })

