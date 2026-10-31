from django.urls import path
from .views import (
    DashboardOverviewView,
    TaskListCreateView,
    TaskDetailUpdateDeleteView,
    TaskToggleView,
    DailyGoalView,
    RecordStudySessionView,
    TimetableListCreateView,
    TimetableDetailUpdateDeleteView,
    AnalyticsOverviewView,
    NoteListCreateView,
    NoteDetailUpdateDeleteView,
    AINoteGenerateView,
)

urlpatterns = [
    # Dashboard & Analytics
    path('overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('analytics/', AnalyticsOverviewView.as_view(), name='analytics-overview'),

    # Study Planner: Tasks
    path('tasks/', TaskListCreateView.as_view(), name='task-list-create'),
    path('tasks/<int:pk>/', TaskDetailUpdateDeleteView.as_view(), name='task-detail-update-delete'),
    path('tasks/<int:pk>/toggle/', TaskToggleView.as_view(), name='task-toggle'),

    # Study Planner: Daily Goals & Timer
    path('goals/daily/', DailyGoalView.as_view(), name='daily-goal'),
    path('timer/record/', RecordStudySessionView.as_view(), name='record-study-session'),

    # Study Planner: Timetable
    path('timetable/', TimetableListCreateView.as_view(), name='timetable-list-create'),
    path('timetable/<int:pk>/', TimetableDetailUpdateDeleteView.as_view(), name='timetable-detail-update-delete'),

    # My Notes
    path('notes/', NoteListCreateView.as_view(), name='note-list-create'),
    path('notes/<int:pk>/', NoteDetailUpdateDeleteView.as_view(), name='note-detail-update-delete'),
    path('notes/ai-generate/', AINoteGenerateView.as_view(), name='note-ai-generate'),
]
