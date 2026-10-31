import os
from django.db import models
from django.conf import settings

def user_document_upload_path(instance, filename):
    return f"documents/user_{instance.user.id}/{filename}"

class StudyDocument(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to=user_document_upload_path)
    title = models.CharField(max_length=255)
    file_size = models.IntegerField(default=0)  # bytes
    page_count = models.IntegerField(default=0)
    has_text = models.BooleanField(default=True)
    extracted_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} ({self.user.email})"

    def delete(self, *args, **kwargs):
        # Clean up storage file on document deletion
        if self.file and os.path.isfile(self.file.path):
            try:
                os.remove(self.file.path)
            except Exception:
                pass
        super().delete(*args, **kwargs)

class DocumentChunk(models.Model):
    document = models.ForeignKey(StudyDocument, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    page_number = models.IntegerField(default=1)
    text_content = models.TextField()

    class Meta:
        ordering = ['chunk_index']

    def __str__(self):
        return f"Doc {self.document.id} - Chunk {self.chunk_index} (P.{self.page_number})"

class DocumentSummary(models.Model):
    document = models.ForeignKey(StudyDocument, on_delete=models.CASCADE, related_name='summaries')
    summary_type = models.CharField(max_length=50, default='comprehensive')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Summary ({self.summary_type}) for {self.document.title}"

