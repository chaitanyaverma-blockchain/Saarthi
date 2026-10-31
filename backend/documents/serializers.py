from rest_framework import serializers
from .models import StudyDocument, DocumentChunk, DocumentSummary

class DocumentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentSummary
        fields = ['id', 'summary_type', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']

class StudyDocumentSerializer(serializers.ModelSerializer):
    file_size_formatted = serializers.SerializerMethodField()
    summaries_count = serializers.IntegerField(source='summaries.count', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = StudyDocument
        fields = [
            'id', 'title', 'file_url', 'file_size', 'file_size_formatted',
            'page_count', 'has_text', 'summaries_count', 'uploaded_at'
        ]
        read_only_fields = ['id', 'file_size', 'page_count', 'has_text', 'uploaded_at']

    def get_file_size_formatted(self, obj):
        bytes_val = obj.file_size
        if bytes_val < 1024:
            return f"{bytes_val} B"
        elif bytes_val < 1024 * 1024:
            return f"{bytes_val / 1024:.1f} KB"
        else:
            return f"{bytes_val / (1024 * 1024):.1f} MB"

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return ""

class StudyDocumentDetailSerializer(StudyDocumentSerializer):
    summaries = DocumentSummarySerializer(many=True, read_only=True)

    class Meta(StudyDocumentSerializer.Meta):
        fields = StudyDocumentSerializer.Meta.fields + ['summaries']

