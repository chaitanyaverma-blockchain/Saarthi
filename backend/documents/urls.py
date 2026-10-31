from django.urls import path
from .views import (
    DocumentListUploadView,
    DocumentDetailDeleteView,
    DocumentSummarizeView,
    DocumentAskView,
)

urlpatterns = [
    path('', DocumentListUploadView.as_view(), name='document-list-upload'),
    path('<int:pk>/', DocumentDetailDeleteView.as_view(), name='document-detail-delete'),
    path('<int:pk>/summarize/', DocumentSummarizeView.as_view(), name='document-summarize'),
    path('<int:pk>/ask/', DocumentAskView.as_view(), name='document-ask'),
]

