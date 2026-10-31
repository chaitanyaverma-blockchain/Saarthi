from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.conf.urls.static import static

def api_root(request):
    if 'text/html' in request.META.get('HTTP_ACCEPT', ''):
        html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAARTHI Backend API</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F7F8F5; color: #202923; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: #FFFFFF; border: 1px solid #E1E7E0; border-radius: 16px; padding: 36px; max-width: 580px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.03); text-align: center; }
        .badge { display: inline-block; padding: 4px 12px; background: #E8F0E9; color: #527B61; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        h1 { margin: 0 0 8px; font-size: 24px; color: #202923; }
        p { color: #65736A; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
        .btn { display: inline-block; background: #527B61; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; }
        .btn:hover { background: #365641; }
        .endpoints { text-align: left; background: #F7F8F5; border-radius: 10px; padding: 16px; margin-top: 24px; font-size: 12px; font-family: monospace; }
        .endpoints li { margin-bottom: 6px; }
        .endpoints a { color: #527B61; text-decoration: none; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">SAARTHI API Server Online</div>
        <h1>Backend is Running Successfully!</h1>
        <p>This is the <strong>Django REST API server</strong> (port 8000). To view and interact with the full <strong>SAARTHI Web Application</strong> (UI, Dashboard, AI Study Assistant, PDF Lab, Quizzes), open the frontend server at:</p>
        <a href="http://localhost:3000" class="btn" target="_blank">Open SAARTHI Web App &rarr; http://localhost:3000</a>
        <div class="endpoints">
            <strong>Active API Endpoints:</strong>
            <ul style="padding-left: 20px; margin: 8px 0 0;">
                <li><a href="/api/health/">GET /api/health/</a> (API Health Check)</li>
                <li><code>/api/accounts/</code> (Authentication, Register, Login)</li>
                <li><code>/api/assistant/</code> (AI Study Assistant & Chats)</li>
                <li><code>/api/documents/</code> (PDF Study Lab & Summaries)</li>
                <li><code>/api/quizzes/</code> (AI Quiz Generator & Tests)</li>
                <li><code>/api/dashboard/</code> (Notes & Analytics)</li>
            </ul>
        </div>
    </div>
</body>
</html>"""
        return HttpResponse(html_content)

    return JsonResponse({
        'status': 'online',
        'application': 'SAARTHI Backend API',
        'version': '1.0.0',
        'frontend_url': 'http://localhost:3000',
        'tagline': 'Your Journey to Smarter Learning',
        'endpoints': {
            'health': '/api/health/',
            'accounts': '/api/accounts/',
            'assistant': '/api/assistant/',
            'documents': '/api/documents/',
            'quizzes': '/api/quizzes/',
            'dashboard': '/api/dashboard/',
        }
    })

def api_health(request):
    return JsonResponse({
        'status': 'healthy',
        'application': 'SAARTHI Backend API',
        'version': '1.0.0',
        'tagline': 'Your Journey to Smarter Learning',
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/health/', api_health, name='api-health'),
    path('api/accounts/', include('accounts.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/assistant/', include('ai_assistant.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/quizzes/', include('quizzes.urls')),
]

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
