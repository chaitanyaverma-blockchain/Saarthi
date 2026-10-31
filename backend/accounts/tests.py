import io
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

User = get_user_model()

try:
    from PIL import Image
    def create_test_image(format='PNG', size=(100, 100), color=(82, 123, 97)):
        image_io = io.BytesIO()
        image = Image.new('RGB', size, color=color)
        image.save(image_io, format=format)
        image_io.seek(0)
        return image_io
except ImportError:
    Image = None
    def create_test_image(format='PNG', size=(100, 100), color=(82, 123, 97)):
        # 1x1 valid PNG binary payload
        png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\r\x98m\xb2\x00\x00\x00\x00IEND\xaeB`\x82'
        return io.BytesIO(png_bytes)

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.valid_user_data = {
            'name': 'Alex Johnson',
            'email': 'alex.johnson@university.edu',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'university': 'Stanford University',
            'major': 'Computer Science',
            'year': '3rd Year'
        }

    def test_signup_successful(self):
        res = self.client.post('/api/accounts/register/', self.valid_user_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data.get('success'))
        self.assertIn('token', res.data)
        user = User.objects.get(email='alex.johnson@university.edu')
        self.assertTrue(user.check_password('SecurePassword123!'))

    def test_duplicate_email_fails(self):
        self.client.post('/api/accounts/register/', self.valid_user_data, format='json')
        dup = self.valid_user_data.copy()
        dup['email'] = 'ALEX.JOHNSON@UNIVERSITY.EDU'
        res = self.client.post('/api/accounts/register/', dup, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_successful(self):
        self.client.post('/api/accounts/register/', self.valid_user_data, format='json')
        res = self.client.post('/api/accounts/login/', {'email': 'alex.johnson@university.edu', 'password': 'SecurePassword123!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)

    def test_logout(self):
        reg = self.client.post('/api/accounts/register/', self.valid_user_data, format='json')
        token = reg.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/accounts/logout/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(key=token).exists())


class ProfileManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='testuser@university.edu',
            password='InitialPassword123!',
            name='Test Student',
            university='MIT',
            major='Electrical Engineering',
            year='2nd Year'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_get_profile(self):
        res = self.client.get('/api/accounts/profile/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['name'], 'Test Student')
        self.assertEqual(res.data['data']['email'], 'testuser@university.edu')

    def test_update_profile(self):
        payload = {
            'name': 'Updated Name',
            'bio': 'Passionate AI and Robotics researcher.',
            'university': 'Harvard University',
            'preferred_language': 'Hindi',
            'daily_goal_minutes': 180,
        }
        res = self.client.patch('/api/accounts/profile/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, 'Updated Name')
        self.assertEqual(self.user.bio, 'Passionate AI and Robotics researcher.')
        self.assertEqual(self.user.preferred_language, 'Hindi')
        self.assertEqual(self.user.daily_goal_minutes, 180)

    def test_profile_picture_upload_and_delete(self):
        img_io = create_test_image(format='PNG')
        uploaded = SimpleUploadedFile("avatar.png", img_io.read(), content_type="image/png")
        res = self.client.post('/api/accounts/profile/picture/', {'picture': uploaded}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(bool(self.user.profile_picture))
        self.assertIn('/media/profile_pictures/', self.user.profile_picture_url)

        # Delete profile picture
        del_res = self.client.delete('/api/accounts/profile/picture/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(bool(self.user.profile_picture))
        self.assertIsNone(self.user.profile_picture_url)

    def test_profile_picture_invalid_file_rejected(self):
        fake_file = SimpleUploadedFile("document.pdf", b"%PDF-1.4...", content_type="application/pdf")
        res = self.client.post('/api/accounts/profile/picture/', {'picture': fake_file}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_success_and_failure(self):
        # 1. Incorrect current password
        bad_res = self.client.post('/api/accounts/change-password/', {
            'current_password': 'WrongPassword!',
            'new_password': 'BrandNewPassword123!',
            'confirm_new_password': 'BrandNewPassword123!',
        }, format='json')
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Mismatched confirmation
        mismatch_res = self.client.post('/api/accounts/change-password/', {
            'current_password': 'InitialPassword123!',
            'new_password': 'BrandNewPassword123!',
            'confirm_new_password': 'DifferentPassword123!',
        }, format='json')
        self.assertEqual(mismatch_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Successful change
        good_res = self.client.post('/api/accounts/change-password/', {
            'current_password': 'InitialPassword123!',
            'new_password': 'BrandNewPassword123!',
            'confirm_new_password': 'BrandNewPassword123!',
        }, format='json')
        self.assertEqual(good_res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('BrandNewPassword123!'))

    def test_appearance_preferences(self):
        res = self.client.patch('/api/accounts/preferences/appearance/', {'theme_preference': 'dark'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.theme_preference, 'dark')

    def test_notification_preferences(self):
        res = self.client.patch('/api/accounts/preferences/notifications/', {
            'notif_study_reminders': False,
            'notif_quiz_summaries': True,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.notif_study_reminders)
        self.assertTrue(self.user.notif_quiz_summaries)

    def test_study_preferences(self):
        res = self.client.patch('/api/accounts/preferences/study/', {
            'preferred_language': 'Hindi',
            'explanation_style': 'simple',
            'preferred_subjects': 'Discrete Math, Operating Systems',
            'daily_goal_minutes': 90,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_language, 'Hindi')
        self.assertEqual(self.user.explanation_style, 'simple')
        self.assertEqual(self.user.daily_goal_minutes, 90)

    def test_delete_account(self):
        res = self.client.post('/api/accounts/delete-account/', {
            'password': 'InitialPassword123!',
            'confirm_text': 'DELETE'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(email='testuser@university.edu').exists())
