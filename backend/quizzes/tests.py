from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch
from .models import Quiz, QuizQuestion, QuizAttempt

User = get_user_model()

class QuizTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='student@univ.edu', password='Password123!', name='Student')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    @patch('core.gemini_service.gemini_service.generate_quiz')
    def test_generate_and_take_quiz(self, mock_gen):
        mock_gen.return_value = {
            'title': 'Binary Trees Quiz',
            'questions': [
                {
                    'question': 'What is the maximum number of nodes at level L in a binary tree?',
                    'option_a': '2^L',
                    'option_b': '2^(L-1)',
                    'option_c': 'L^2',
                    'option_d': '2L',
                    'correct_option': 'B',
                    'explanation': 'At level L (1-indexed), max nodes is 2^(L-1).'
                },
                {
                    'question': 'Which traversal visits root node last?',
                    'option_a': 'Preorder',
                    'option_b': 'Inorder',
                    'option_c': 'Postorder',
                    'option_d': 'Level order',
                    'correct_option': 'C',
                    'explanation': 'Postorder traverses left, right, then root.'
                }
            ]
        }

        # 1. Generate Quiz
        res = self.client.post('/api/quizzes/', {'topic': 'Binary Trees', 'subject': 'CS'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        quiz_id = res.data['data']['id']
        questions = res.data['data']['questions']
        self.assertEqual(len(questions), 2)

        # 2. Verify correct_option is NOT exposed in student view!
        self.assertNotIn('correct_option', questions[0])
        self.assertNotIn('explanation', questions[0])

        # 3. Submit 1 correct ('B') and 1 incorrect ('A')
        q1_id = questions[0]['id']
        q2_id = questions[1]['id']
        answers_payload = {
            'answers': {
                str(q1_id): 'B',
                str(q2_id): 'A',
            }
        }
        submit_res = self.client.post(f'/api/quizzes/{quiz_id}/submit/', answers_payload, format='json')
        self.assertEqual(submit_res.status_code, status.HTTP_201_CREATED)
        result_data = submit_res.data['data']

        # 4. Score verified server-side
        self.assertEqual(result_data['score'], 1)
        self.assertEqual(result_data['total_questions'], 2)
        self.assertEqual(result_data['percentage'], 50.0)

        # 5. Explanations now revealed
        self.assertIn('answers', result_data)
        self.assertEqual(len(result_data['answers']), 2)
        self.assertTrue(result_data['answers'][0]['is_correct'])
        self.assertFalse(result_data['answers'][1]['is_correct'])

