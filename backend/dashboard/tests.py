from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch
from datetime import date, timedelta
from .models import StudyTask, StudyNote, DailyStudyGoal, StudySession, TimetableSession
from quizzes.models import Quiz, QuizAttempt

User = get_user_model()

class DashboardAndPlannerTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='test@university.edu', password='Password123!', name='Test Student')
        self.token = Token.objects.create(user=self.user)
        self.task = StudyTask.objects.create(
            user=self.user,
            title='Test Task',
            subject='Math',
            priority='High',
            status='Pending',
            due_date=date.today() + timedelta(days=2)
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_overview_requires_auth(self):
        self.client.credentials()  # clear auth
        res = self.client.get('/api/dashboard/overview/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_overview_authorized(self):
        res = self.client.get('/api/dashboard/overview/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('welcome', res.data['data'])
        self.assertIn('stats', res.data['data'])

    def test_task_crud_and_filtering(self):
        # 1. Create Task
        res = self.client.post('/api/dashboard/tasks/', {
            'title': 'Operating Systems Assignment',
            'subject': 'Computer Science',
            'priority': 'High',
            'status': 'In Progress',
            'due_date': str(date.today() + timedelta(days=3)),
            'description': 'Implement round-robin CPU scheduling'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        task_id = res.data['data']['id']
        self.assertEqual(res.data['data']['priority'], 'High')

        # 2. Filter tasks
        list_res = self.client.get('/api/dashboard/tasks/?status=In Progress')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data['data']), 1)

        # 3. Update task
        update_res = self.client.patch(f'/api/dashboard/tasks/{task_id}/', {
            'status': 'Completed',
            'priority': 'Medium'
        })
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertTrue(update_res.data['data']['is_completed'])
        self.assertEqual(update_res.data['data']['status'], 'Completed')

        # 4. Toggle task
        toggle_res = self.client.post(f'/api/dashboard/tasks/{task_id}/toggle/')
        self.assertEqual(toggle_res.status_code, status.HTTP_200_OK)
        self.assertFalse(toggle_res.data['data']['is_completed'])

        # 5. Delete task
        del_res = self.client.delete(f'/api/dashboard/tasks/{task_id}/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(StudyTask.objects.filter(id=task_id).exists())

    def test_daily_goal_and_study_session_recording(self):
        # 1. Set Daily Goal
        goal_res = self.client.post('/api/dashboard/goals/daily/', {
            'target_minutes': 90
        })
        self.assertEqual(goal_res.status_code, status.HTTP_200_OK)
        self.assertEqual(goal_res.data['data']['target_minutes'], 90)

        # 2. Record Study Session
        session_res = self.client.post('/api/dashboard/timer/record/', {
            'subject': 'Physics',
            'duration_minutes': 45,
            'notes': 'Thermodynamics problems'
        })
        self.assertEqual(session_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(session_res.data['data']['today_total_minutes'], 45)
        self.assertEqual(session_res.data['data']['percentage'], 50)

        # 3. Get Goal Progress
        get_goal = self.client.get('/api/dashboard/goals/daily/')
        self.assertEqual(get_goal.status_code, status.HTTP_200_OK)
        self.assertEqual(get_goal.data['data']['completed_minutes'], 45)
        self.assertEqual(get_goal.data['data']['remaining_minutes'], 45)

    def test_timetable_crud(self):
        # 1. Add Timetable Session
        res = self.client.post('/api/dashboard/timetable/', {
            'subject': 'Mathematics',
            'title': 'Calculus III Lecture',
            'day_of_week': 'Monday',
            'start_time': '09:00 AM',
            'end_time': '10:30 AM',
            'session_type': 'lecture'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        item_id = res.data['data']['id']

        # 2. List Timetable by Day
        list_res = self.client.get('/api/dashboard/timetable/?day=Monday')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data['data']), 1)

        # 3. Edit Timetable Session
        edit_res = self.client.patch(f'/api/dashboard/timetable/{item_id}/', {
            'end_time': '11:00 AM'
        })
        self.assertEqual(edit_res.status_code, status.HTTP_200_OK)
        self.assertEqual(edit_res.data['data']['end_time'], '11:00 AM')

        # 4. Delete Timetable Session
        del_res = self.client.delete(f'/api/dashboard/timetable/{item_id}/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(TimetableSession.objects.filter(id=item_id).exists())

    def test_analytics_metrics(self):
        # Create a study session and quiz attempt
        StudySession.objects.create(
            user=self.user,
            subject='Chemistry',
            duration_minutes=60,
            session_date=date.today()
        )
        quiz = Quiz.objects.create(user=self.user, title='Organic Chemistry', topic='Reactions', subject='Chemistry')
        QuizAttempt.objects.create(user=self.user, quiz=quiz, score=4, total_questions=5, percentage=80.0)

        res = self.client.get('/api/dashboard/analytics/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        overview = res.data['data']['overview']
        self.assertEqual(overview['total_study_minutes'], 60)
        self.assertEqual(overview['total_quizzes_attempted'], 1)
        self.assertEqual(overview['average_quiz_score'], 80.0)
        self.assertIn('weekly_activity', res.data['data'])
        self.assertIn('insights', res.data['data'])

    def test_notes_crud_and_search(self):
        # 1. Create Note
        note_res = self.client.post('/api/dashboard/notes/', {
            'title': 'Thermodynamics Laws',
            'subject': 'Physics',
            'content': 'First law relates work and heat.'
        })
        self.assertEqual(note_res.status_code, status.HTTP_201_CREATED)
        note_id = note_res.data['id']

        # 2. Search note
        search_res = self.client.get('/api/dashboard/notes/?q=thermo')
        self.assertEqual(search_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(search_res.data), 1)

        # 3. Update note
        update_res = self.client.put(f'/api/dashboard/notes/{note_id}/', {
            'title': 'Thermodynamics Laws (Updated)',
            'subject': 'Physics',
            'content': 'Extended explanations.'
        })
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)

        # 4. Delete note
        delete_res = self.client.delete(f'/api/dashboard/notes/{note_id}/')
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)
