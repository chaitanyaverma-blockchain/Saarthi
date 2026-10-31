from rest_framework import serializers
from .models import (
    StudyTask,
    StudyNote,
    StudyActivity,
    ScheduleItem,
    DailyStudyGoal,
    StudySession,
    TimetableSession,
)

class StudyTaskSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = StudyTask
        fields = [
            'id', 'title', 'description', 'subject', 'priority', 'status',
            'due_date', 'scheduled_time', 'is_completed', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        from datetime import datetime, date
        if obj.due_date and not obj.is_completed:
            due = obj.due_date
            if isinstance(due, str):
                try:
                    due = datetime.strptime(due, '%Y-%m-%d').date()
                except ValueError:
                    return False
            elif isinstance(due, datetime):
                due = due.date()
            return due < timezone.now().date()
        return False

class DailyStudyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyStudyGoal
        fields = ['id', 'date', 'target_minutes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StudySessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = StudySession
        fields = [
            'id', 'subject', 'task', 'task_title',
            'duration_minutes', 'notes', 'session_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class TimetableSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimetableSession
        fields = [
            'id', 'subject', 'title', 'day_of_week',
            'start_time', 'end_time', 'session_type',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        start = data.get('start_time', getattr(self.instance, 'start_time', '') if self.instance else '').strip()
        end = data.get('end_time', getattr(self.instance, 'end_time', '') if self.instance else '').strip()
        if not start or not end:
            raise serializers.ValidationError("Both start time and end time are required.")
        return data

class StudyNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyNote
        fields = ['id', 'title', 'subject', 'content', 'color', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StudyActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyActivity
        fields = ['id', 'activity_type', 'title', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class ScheduleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleItem
        fields = ['id', 'title', 'time_slot', 'item_type', 'created_at']
        read_only_fields = ['id', 'created_at']
