from datetime import datetime, date, timedelta
from django.db.models import Q, Sum, Avg, Max, Count
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    StudyTask,
    StudyNote,
    StudyActivity,
    ScheduleItem,
    DailyStudyGoal,
    StudySession,
    TimetableSession,
)
from .serializers import (
    StudyTaskSerializer,
    StudyNoteSerializer,
    StudyActivitySerializer,
    ScheduleItemSerializer,
    DailyStudyGoalSerializer,
    StudySessionSerializer,
    TimetableSessionSerializer,
)
from accounts.serializers import UserProfileSerializer
from core.utils import success_response
from core.gemini_service import gemini_service, GeminiError
from quizzes.models import QuizAttempt, Quiz

def get_time_greeting():
    h = datetime.now().hour
    return "Good Morning" if h < 12 else ("Good Afternoon" if h < 17 else "Good Evening")

# ==========================================
# DASHBOARD OVERVIEW
# ==========================================
class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        today = timezone.now().date()

        tasks_qs = StudyTask.objects.filter(user=u)
        notes_qs = StudyNote.objects.filter(user=u)
        activities_qs = StudyActivity.objects.filter(user=u)
        sessions_qs = StudySession.objects.filter(user=u)
        timetable_qs = TimetableSession.objects.filter(user=u)
        quiz_attempts_qs = QuizAttempt.objects.filter(user=u)

        total_tasks = tasks_qs.count()
        completed_tasks = tasks_qs.filter(is_completed=True).count()
        pending_tasks = total_tasks - completed_tasks

        # Real study time
        total_study_minutes = sessions_qs.aggregate(total=Sum('duration_minutes'))['total'] or 0
        total_study_hours = round(total_study_minutes / 60.0, 1)

        # Today's study time
        today_study_minutes = sessions_qs.filter(session_date=today).aggregate(total=Sum('duration_minutes'))['total'] or 0

        # Daily goal
        goal_obj = DailyStudyGoal.objects.filter(user=u, date=today).first()
        target_minutes = goal_obj.target_minutes if goal_obj else (u.study_goal_hours * 60 if hasattr(u, 'study_goal_hours') else 120)
        goal_percentage = min(100, round((today_study_minutes / target_minutes) * 100)) if target_minutes > 0 else 0

        # Welcome message
        first_name = u.name.split(' ')[0] if u.name else "Student"
        welcome_msg = (
            f"You have {pending_tasks} task{'s' if pending_tasks != 1 else ''} pending. Today's study progress is {today_study_minutes}/{target_minutes} min."
            if pending_tasks > 0 else "All tasks caught up! Keep building your momentum."
        )

        # Today's timetable items
        today_day_name = today.strftime("%A")
        today_timetable = timetable_qs.filter(day_of_week=today_day_name).order_by('start_time')
        # Fallback to schedule items if timetable empty
        schedule_display = TimetableSessionSerializer(today_timetable, many=True).data
        if not schedule_display:
            schedule_display = ScheduleItemSerializer(ScheduleItem.objects.filter(user=u)[:6], many=True).data

        # Latest quiz score
        latest_attempt = quiz_attempts_qs.first()
        latest_quiz_info = None
        if latest_attempt:
            latest_quiz_info = {
                'title': latest_attempt.quiz.title,
                'topic': latest_attempt.quiz.topic,
                'score_percentage': round(latest_attempt.percentage),
                'date': latest_attempt.completed_at.strftime("%b %d, %Y"),
            }

        return success_response(data={
            'user': UserProfileSerializer(u).data,
            'welcome': {
                'greeting': get_time_greeting(),
                'first_name': first_name,
                'date_formatted': datetime.now().strftime("%A, %B %d, %Y"),
                'message': welcome_msg,
                'pending_tasks_count': pending_tasks,
            },
            'stats': {
                'study_hours': total_study_hours,
                'today_study_minutes': today_study_minutes,
                'target_minutes': target_minutes,
                'goal_percentage': goal_percentage,
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
                'notes_created': notes_qs.count(),
                'quizzes_taken': quiz_attempts_qs.count(),
                'latest_quiz': latest_quiz_info,
            },
            'tasks': StudyTaskSerializer(tasks_qs[:8], many=True).data,
            'recent_activities': StudyActivitySerializer(activities_qs[:10], many=True).data,
            'schedule': schedule_display,
        })

# ==========================================
# STUDY TASKS APIs
# ==========================================
class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = StudyTask.objects.filter(user=request.user)
        status_param = request.query_params.get('status', '').strip()
        priority_param = request.query_params.get('priority', '').strip()
        subject_param = request.query_params.get('subject', '').strip()
        query = request.query_params.get('q', '').strip()
        sort_by = request.query_params.get('sort', '').strip()

        today = timezone.now().date()

        if status_param == 'Pending':
            qs = qs.filter(status='Pending', is_completed=False)
        elif status_param == 'In Progress':
            qs = qs.filter(status='In Progress', is_completed=False)
        elif status_param == 'Completed':
            qs = qs.filter(Q(status='Completed') | Q(is_completed=True))
        elif status_param == 'overdue':
            qs = qs.filter(due_date__lt=today, is_completed=False)
        elif status_param == 'today':
            qs = qs.filter(due_date=today)
        elif status_param == 'upcoming':
            qs = qs.filter(due_date__gt=today, is_completed=False)

        if priority_param and priority_param != 'All':
            qs = qs.filter(priority__iexact=priority_param)

        if subject_param and subject_param != 'All':
            qs = qs.filter(subject__iexact=subject_param)

        if query:
            qs = qs.filter(Q(title__icontains=query) | Q(description__icontains=query))

        # Sorting
        if sort_by == 'due_date':
            qs = qs.order_by('due_date', '-created_at')
        elif sort_by == '-due_date':
            qs = qs.order_by('-due_date', '-created_at')
        elif sort_by == 'priority':
            # High -> Medium -> Low
            qs = qs.order_by('priority', '-created_at')
        else:
            qs = qs.order_by('is_completed', 'due_date', '-created_at')

        return success_response(data=StudyTaskSerializer(qs, many=True).data)

    def post(self, request):
        title = request.data.get('title', '').strip()
        if not title:
            return Response({'success': False, 'message': 'Task title is required.'}, status=status.HTTP_400_BAD_REQUEST)

        subject = request.data.get('subject', '').strip() or 'General'
        description = request.data.get('description', '').strip()
        priority = request.data.get('priority', 'Medium')
        if priority not in ['Low', 'Medium', 'High']:
            priority = 'Medium'

        status_val = request.data.get('status', 'Pending')
        if status_val not in ['Pending', 'In Progress', 'Completed']:
            status_val = 'Pending'

        due_date = request.data.get('due_date') or None
        if due_date == '':
            due_date = None

        task = StudyTask.objects.create(
            user=request.user,
            title=title,
            description=description,
            subject=subject,
            priority=priority,
            status=status_val,
            due_date=due_date,
            is_completed=(status_val == 'Completed')
        )

        StudyActivity.objects.create(
            user=request.user,
            activity_type='task',
            title=f'Created Task: {task.title[:35]}',
            description=f'{task.subject} • {task.priority} Priority'
        )

        return Response({
            'success': True,
            'message': 'Task created successfully.',
            'data': StudyTaskSerializer(task).data
        }, status=status.HTTP_201_CREATED)

class TaskDetailUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return StudyTask.objects.get(pk=pk, user=user)
        except StudyTask.DoesNotExist:
            return None

    def get(self, request, pk):
        task = self.get_object(pk, request.user)
        if not task:
            return Response({'success': False, 'message': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
        return success_response(data=StudyTaskSerializer(task).data)

    def put(self, request, pk):
        return self.patch(request, pk)

    def patch(self, request, pk):
        task = self.get_object(pk, request.user)
        if not task:
            return Response({'success': False, 'message': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'title' in request.data:
            title = request.data.get('title', '').strip()
            if not title:
                return Response({'success': False, 'message': 'Title cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            task.title = title

        if 'description' in request.data:
            task.description = request.data.get('description', '').strip()

        if 'subject' in request.data:
            task.subject = request.data.get('subject', '').strip() or 'General'

        if 'priority' in request.data:
            p = request.data.get('priority')
            if p in ['Low', 'Medium', 'High']:
                task.priority = p

        if 'status' in request.data:
            s = request.data.get('status')
            if s in ['Pending', 'In Progress', 'Completed']:
                task.status = s
                task.is_completed = (s == 'Completed')

        if 'due_date' in request.data:
            due = request.data.get('due_date')
            task.due_date = due if due else None

        if 'is_completed' in request.data:
            task.is_completed = bool(request.data.get('is_completed'))
            task.status = 'Completed' if task.is_completed else 'Pending'

        task.save()
        return success_response(data=StudyTaskSerializer(task).data, message='Task updated successfully.')

    def delete(self, request, pk):
        task = self.get_object(pk, request.user)
        if not task:
            return Response({'success': False, 'message': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return success_response(message='Task deleted successfully.')

class TaskToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            task = StudyTask.objects.get(pk=pk, user=request.user)
        except StudyTask.DoesNotExist:
            return Response({'success': False, 'message': 'Task not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        task.is_completed = not task.is_completed
        task.status = 'Completed' if task.is_completed else 'Pending'
        task.save()

        if task.is_completed:
            StudyActivity.objects.create(
                user=request.user,
                activity_type='task',
                title=f'Completed Task: {task.title[:35]}',
                description=f'{task.subject}'
            )

        return success_response(data=StudyTaskSerializer(task).data, message="Task status updated.")

# ==========================================
# DAILY STUDY GOAL & TIMER APIs
# ==========================================
class DailyGoalView(APIView):
    permission_classes = [IsAuthenticated]

    def get_date(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            try:
                return datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                pass
        return timezone.now().date()

    def get(self, request):
        target_date = self.get_date(request)
        u = request.user

        goal = DailyStudyGoal.objects.filter(user=u, date=target_date).first()
        target_minutes = goal.target_minutes if goal else 120

        # Calculate actual recorded study minutes for target date
        completed_minutes = StudySession.objects.filter(
            user=u, session_date=target_date
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        remaining_minutes = max(0, target_minutes - completed_minutes)
        percentage = min(100, round((completed_minutes / target_minutes) * 100)) if target_minutes > 0 else 0

        return success_response(data={
            'date': str(target_date),
            'target_minutes': target_minutes,
            'completed_minutes': completed_minutes,
            'remaining_minutes': remaining_minutes,
            'percentage': percentage,
            'is_completed': completed_minutes >= target_minutes,
        })

    def post(self, request):
        target_minutes = request.data.get('target_minutes')
        try:
            target_minutes = int(target_minutes)
            if target_minutes <= 0 or target_minutes > 1440:
                raise ValueError()
        except (TypeError, ValueError):
            return Response({'success': False, 'message': 'Daily target must be between 1 and 1440 minutes.'}, status=status.HTTP_400_BAD_REQUEST)

        date_str = request.data.get('date')
        target_date = timezone.now().date()
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                pass

        goal, _ = DailyStudyGoal.objects.update_or_create(
            user=request.user,
            date=target_date,
            defaults={'target_minutes': target_minutes}
        )

        completed_minutes = StudySession.objects.filter(
            user=request.user, session_date=target_date
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        return success_response(data={
            'date': str(target_date),
            'target_minutes': goal.target_minutes,
            'completed_minutes': completed_minutes,
            'remaining_minutes': max(0, goal.target_minutes - completed_minutes),
            'percentage': min(100, round((completed_minutes / goal.target_minutes) * 100)) if goal.target_minutes > 0 else 0,
        }, message='Daily study goal updated.')

class RecordStudySessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        duration = request.data.get('duration_minutes')
        try:
            duration = int(duration)
            if duration <= 0:
                return Response({'success': False, 'message': 'Study duration must be at least 1 minute.'}, status=status.HTTP_400_BAD_REQUEST)
            if duration > 1440:
                return Response({'success': False, 'message': 'Study duration cannot exceed 24 hours.'}, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({'success': False, 'message': 'Invalid duration in minutes.'}, status=status.HTTP_400_BAD_REQUEST)

        subject = request.data.get('subject', '').strip() or 'General'
        notes = request.data.get('notes', '').strip()
        task_id = request.data.get('task_id')

        task = None
        if task_id:
            try:
                task = StudyTask.objects.get(pk=task_id, user=request.user)
            except StudyTask.DoesNotExist:
                task = None

        today = timezone.now().date()

        session = StudySession.objects.create(
            user=request.user,
            subject=subject,
            task=task,
            duration_minutes=duration,
            notes=notes,
            session_date=today
        )

        # Log timeline activity
        StudyActivity.objects.create(
            user=request.user,
            activity_type='study',
            title=f'Studied {subject}: {duration} min',
            description=f'Completed study session{f" on {task.title}" if task else ""}'
        )

        # Calculate updated today goal progress
        goal = DailyStudyGoal.objects.filter(user=request.user, date=today).first()
        target_minutes = goal.target_minutes if goal else 120
        total_today = StudySession.objects.filter(user=request.user, session_date=today).aggregate(total=Sum('duration_minutes'))['total'] or 0

        return Response({
            'success': True,
            'message': f'Recorded {duration} minutes of study for {subject}!',
            'data': {
                'session': StudySessionSerializer(session).data,
                'today_total_minutes': total_today,
                'target_minutes': target_minutes,
                'percentage': min(100, round((total_today / target_minutes) * 100)) if target_minutes > 0 else 0,
            }
        }, status=status.HTTP_201_CREATED)

# ==========================================
# TIMETABLE APIs
# ==========================================
class TimetableListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = TimetableSession.objects.filter(user=request.user)
        day_param = request.query_params.get('day', '').strip()
        if day_param:
            sessions = sessions.filter(day_of_week__iexact=day_param)
        return success_response(data=TimetableSessionSerializer(sessions, many=True).data)

    def post(self, request):
        serializer = TimetableSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        session = serializer.save(user=request.user)
        return Response({
            'success': True,
            'message': 'Timetable session added.',
            'data': TimetableSessionSerializer(session).data
        }, status=status.HTTP_201_CREATED)

class TimetableDetailUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return TimetableSession.objects.get(pk=pk, user=user)
        except TimetableSession.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self.get_object(pk, request.user)
        if not item:
            return Response({'success': False, 'message': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        return success_response(data=TimetableSessionSerializer(item).data)

    def put(self, request, pk):
        return self.patch(request, pk)

    def patch(self, request, pk):
        item = self.get_object(pk, request.user)
        if not item:
            return Response({'success': False, 'message': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TimetableSessionSerializer(item, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return success_response(data=serializer.data, message='Session updated.')

    def delete(self, request, pk):
        item = self.get_object(pk, request.user)
        if not item:
            return Response({'success': False, 'message': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return success_response(message='Session deleted.')

# ==========================================
# ANALYTICS API (GENUINE METRICS)
# ==========================================
class AnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        today = timezone.now().date()

        sessions_qs = StudySession.objects.filter(user=u)
        tasks_qs = StudyTask.objects.filter(user=u)
        quizzes_qs = QuizAttempt.objects.filter(user=u)

        # 1. Total Metrics
        total_study_minutes = sessions_qs.aggregate(total=Sum('duration_minutes'))['total'] or 0
        total_study_hours = round(total_study_minutes / 60.0, 1)

        total_tasks = tasks_qs.count()
        completed_tasks = tasks_qs.filter(is_completed=True).count()
        pending_tasks = tasks_qs.filter(is_completed=False).count()
        overdue_tasks = tasks_qs.filter(due_date__lt=today, is_completed=False).count()
        completion_rate = round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0

        total_quizzes = quizzes_qs.count()
        avg_quiz_score = round(quizzes_qs.aggregate(avg=Avg('percentage'))['avg'] or 0, 1)
        highest_quiz_score = round(quizzes_qs.aggregate(mx=Max('percentage'))['mx'] or 0, 1)
        total_sessions = sessions_qs.count()

        # 2. Weekly Study Activity (Last 7 Days)
        weekly_activity = []
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            day_label = day_date.strftime("%a")
            day_mins = sessions_qs.filter(session_date=day_date).aggregate(total=Sum('duration_minutes'))['total'] or 0
            day_quizzes = quizzes_qs.filter(completed_at__date=day_date).count()
            weekly_activity.append({
                'day': day_label,
                'date': str(day_date),
                'minutes': day_mins,
                'hours': round(day_mins / 60.0, 1),
                'quizzes': day_quizzes,
            })

        # 3. Monthly Activity (Last 4 Weeks)
        monthly_activity = []
        for w in range(3, -1, -1):
            week_start = today - timedelta(days=(w * 7) + 6)
            week_end = today - timedelta(days=w * 7)
            w_mins = sessions_qs.filter(session_date__range=[week_start, week_end]).aggregate(total=Sum('duration_minutes'))['total'] or 0
            w_score = quizzes_qs.filter(completed_at__date__range=[week_start, week_end]).aggregate(avg=Avg('percentage'))['avg'] or 0
            monthly_activity.append({
                'week': f"Week {4 - w}",
                'hours': round(w_mins / 60.0, 1),
                'score': round(w_score, 1),
            })

        # 4. Subject-Wise Quiz Performance
        subject_quiz_map = {}
        for attempt in quizzes_qs.select_related('quiz'):
            subj = attempt.quiz.subject or 'General'
            if subj not in subject_quiz_map:
                subject_quiz_map[subj] = {'total_score': 0, 'count': 0}
            subject_quiz_map[subj]['total_score'] += attempt.percentage
            subject_quiz_map[subj]['count'] += 1

        subject_performance = [
            {
                'subject': s,
                'avg_score': round(d['total_score'] / d['count'], 1),
                'attempts': d['count']
            }
            for s, d in subject_quiz_map.items()
        ]

        # 5. Task Priorities Breakdown
        priority_breakdown = {
            'High': tasks_qs.filter(priority='High').count(),
            'Medium': tasks_qs.filter(priority='Medium').count(),
            'Low': tasks_qs.filter(priority='Low').count(),
        }

        # 6. Productivity Insights
        most_productive_day = "No sessions yet"
        best_day_mins = 0
        day_sums = sessions_qs.values('session_date').annotate(total=Sum('duration_minutes')).order_by('-total')
        if day_sums.exists():
            top = day_sums[0]
            top_date = top['session_date']
            best_day_mins = top['total']
            most_productive_day = f"{top_date.strftime('%A, %b %d')} ({best_day_mins} min)"

        this_week_mins = sum(d['minutes'] for d in weekly_activity)
        this_week_hours = round(this_week_mins / 60.0, 1)

        # Most studied subject
        top_subject = "General"
        subj_sums = sessions_qs.values('subject').annotate(total=Sum('duration_minutes')).order_by('-total')
        if subj_sums.exists():
            top_subject = subj_sums[0]['subject']

        # Quiz trend
        trend_status = "No quizzes yet"
        if total_quizzes >= 2:
            first_half = quizzes_qs.order_by('completed_at')[:total_quizzes//2]
            second_half = quizzes_qs.order_by('completed_at')[total_quizzes//2:]
            avg1 = first_half.aggregate(avg=Avg('percentage'))['avg'] or 0
            avg2 = second_half.aggregate(avg=Avg('percentage'))['avg'] or 0
            diff = avg2 - avg1
            if diff > 5:
                trend_status = f"+{round(diff, 1)}% improvement (Upward trend)"
            elif diff < -5:
                trend_status = f"{round(diff, 1)}% vs earlier (Needs practice)"
            else:
                trend_status = "Steady performance"
        elif total_quizzes == 1:
            trend_status = "1 quiz completed"

        return success_response(data={
            'overview': {
                'total_study_hours': total_study_hours,
                'total_study_minutes': total_study_minutes,
                'total_completed_tasks': completed_tasks,
                'total_pending_tasks': pending_tasks,
                'total_overdue_tasks': overdue_tasks,
                'total_tasks': total_tasks,
                'completion_rate_percentage': completion_rate,
                'total_quizzes_attempted': total_quizzes,
                'average_quiz_score': avg_quiz_score,
                'highest_quiz_score': highest_quiz_score,
                'total_sessions_completed': total_sessions,
            },
            'weekly_activity': weekly_activity,
            'monthly_activity': monthly_activity,
            'subject_performance': subject_performance,
            'priority_breakdown': priority_breakdown,
            'insights': {
                'most_productive_day': most_productive_day,
                'total_study_time_this_week': f"{this_week_hours} hrs",
                'top_subject': top_subject,
                'quiz_trend': trend_status,
                'recommendation': (
                    "Focus on completing overdue tasks and spend 30 minutes in PDF Study Lab to reinforce core concepts."
                    if overdue_tasks > 0 else
                    "Great consistency! Try generating an advanced quiz on your top subject to test mastery."
                ),
            }
        })

# ==========================================
# STUDY NOTES APIs (PRESERVED & ENHANCED)
# ==========================================
class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = StudyNote.objects.filter(user=self.request.user)
        query = self.request.query_params.get('q', '').strip()
        subject = self.request.query_params.get('subject', '').strip()

        if query:
            qs = qs.filter(Q(title__icontains=query) | Q(content__icontains=query))
        if subject and subject != 'All' and subject != 'All Subjects':
            qs = qs.filter(subject__iexact=subject)

        return qs

    def perform_create(self, serializer):
        note = serializer.save(user=self.request.user)
        StudyActivity.objects.create(
            user=self.request.user,
            activity_type='notes',
            title=f'Created Note: {note.title[:35]}',
            description=note.subject
        )

class NoteDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudyNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudyNote.objects.filter(user=self.request.user)

class AINoteGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = request.data.get('topic', '').strip()
        if not topic:
            return Response({'success': False, 'message': 'Topic is required for generating notes.'}, status=status.HTTP_400_BAD_REQUEST)

        subject = request.data.get('subject', '').strip()
        source_text = request.data.get('source_text', '').strip()
        action_type = request.data.get('action_type', 'generate').strip().lower()

        try:
            result = gemini_service.generate_notes(
                topic=topic,
                subject=subject,
                source_text=source_text,
                action_type=action_type
            )
            return success_response(data=result)
        except GeminiError as ge:
            return Response({'success': False, 'message': str(ge)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({'success': False, 'message': f'AI Note generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
