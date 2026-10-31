import io
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch
from .models import StudyDocument, DocumentChunk

User = get_user_model()

class DocumentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(email='alice@univ.edu', password='Password123!', name='Alice')
        self.token_a = Token.objects.create(user=self.user_a)

        self.user_b = User.objects.create_user(email='bob@univ.edu', password='Password123!', name='Bob')
        self.token_b = Token.objects.create(user=self.user_b)

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')

    def test_upload_invalid_file_rejected(self):
        # A text file renamed to .pdf should fail the content byte inspection (%PDF-)
        fake_pdf = SimpleUploadedFile("fake.pdf", b"This is plain text, not a PDF.", content_type="application/pdf")
        res = self.client.post('/api/documents/', {'file': fake_pdf}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['success'])

    @patch('documents.views.process_pdf_document')
    def test_valid_pdf_upload_and_extraction(self, mock_process):
        mock_process.return_value = (
            5, # 5 pages
            "Extracted computer networking content about TCP and UDP protocols...",
            True, # has_text
            [{'chunk_index': 1, 'page_number': 1, 'text_content': 'TCP is connection oriented. UDP is connectionless.'}]
        )

        valid_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        pdf_file = SimpleUploadedFile("networks.pdf", valid_pdf_bytes, content_type="application/pdf")

        res = self.client.post('/api/documents/', {'file': pdf_file, 'title': 'Computer Networks'}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        doc_data = res.data['data']
        self.assertEqual(doc_data['title'], 'Computer Networks')
        self.assertEqual(doc_data['page_count'], 5)

        # Verify chunks created
        doc = StudyDocument.objects.get(id=doc_data['id'])
        self.assertEqual(doc.chunks.count(), 1)

    def test_document_user_isolation(self):
        doc = StudyDocument.objects.create(
            user=self.user_a,
            title='Secret Research',
            extracted_text='Confidential machine learning notes'
        )

        # User B should receive 404
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b.key}')
        res = self.client.get(f'/api/documents/{doc.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # User B cannot delete
        res = self.client.delete(f'/api/documents/{doc.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

