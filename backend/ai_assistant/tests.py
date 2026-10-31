from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch
from .models import Conversation, ChatMessage

User = get_user_model()

class AIAssistantTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(email='student.a@univ.edu', password='Password123!', name='Student A')
        self.token_a = Token.objects.create(user=self.user_a)

        self.user_b = User.objects.create_user(email='student.b@univ.edu', password='Password123!', name='Student B')
        self.token_b = Token.objects.create(user=self.user_b)

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')
        self.conv = Conversation.objects.create(user=self.user_a, title='Operating Systems')

    def test_list_conversations(self):
        res = self.client.get('/api/assistant/conversations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['data']), 1)
        self.assertEqual(res.data['data'][0]['title'], 'Operating Systems')

    def test_create_conversation(self):
        res = self.client.post('/api/assistant/conversations/', {'title': 'Compiler Design'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'Compiler Design')

    def test_user_data_isolation(self):
        # User B should not see or access User A's conversation
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b.key}')
        res = self.client.get(f'/api/assistant/conversations/{self.conv.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # User B sending message to User A's conversation is rejected
        res = self.client.post(f'/api/assistant/conversations/{self.conv.id}/messages/', {'content': 'Hacked?'})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_rename_and_delete_conversation(self):
        # Rename
        res = self.client.patch(f'/api/assistant/conversations/{self.conv.id}/', {'title': 'OS Revision'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.conv.refresh_from_db()
        self.assertEqual(self.conv.title, 'OS Revision')

        # Delete
        res = self.client.delete(f'/api/assistant/conversations/{self.conv.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Conversation.objects.filter(id=self.conv.id).exists())

    @patch('core.gemini_service.gemini_service.chat')
    def test_send_message_with_ai_reply(self, mock_chat):
        mock_chat.return_value = "A deadlock occurs when processes are unable to proceed because each holds a resource the other needs."
        res = self.client.post(f'/api/assistant/conversations/{self.conv.id}/messages/', {'content': 'What is deadlock?'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_message', res.data['data'])
        self.assertIn('assistant_message', res.data['data'])
        self.assertEqual(res.data['data']['assistant_message']['content'], mock_chat.return_value)

