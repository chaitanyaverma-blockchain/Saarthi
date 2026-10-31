import os
import io
try:
    from PIL import Image
except ImportError:
    Image = None
from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.authtoken.models import Token
from .serializers import (
    UserRegisterSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer
)
from core.utils import success_response, error_response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        self._seed_starter_data(user)
        token, _ = Token.objects.get_or_create(user=user)
        user_data = UserProfileSerializer(user, context={'request': request}).data
        return Response({
            'success': True,
            'message': 'Account created successfully.',
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_201_CREATED)

    def _seed_starter_data(self, user):
        try:
            from dashboard.models import StudyTask, ScheduleItem, StudyActivity, DailyStudyGoal
            today = timezone.localdate()
            DailyStudyGoal.objects.get_or_create(user=user, date=today, defaults={'target_minutes': 120})
            StudyTask.objects.create(user=user, title='Review Linear Algebra Chapter 5', subject='Mathematics', scheduled_time='9:00 AM', is_completed=True, status='Completed')
            StudyTask.objects.create(user=user, title='Complete Data Structures Assignment', subject='Computer Science', scheduled_time='11:00 AM', is_completed=False, status='In Progress', priority='High')
            StudyTask.objects.create(user=user, title='Read Research Paper on ML Fundamentals', subject='Machine Learning', scheduled_time='2:00 PM', is_completed=False, status='Pending', priority='Medium')
            ScheduleItem.objects.create(user=user, title='Core Computer Science Lecture', time_slot='9:00 AM - 10:30 AM', item_type='lecture')
            ScheduleItem.objects.create(user=user, title='Group Study - Algorithms Review', time_slot='11:00 AM - 12:00 PM', item_type='group')
            ScheduleItem.objects.create(user=user, title='Data Lab Practice Session', time_slot='2:00 PM - 4:00 PM', item_type='lab')
            StudyActivity.objects.create(user=user, activity_type='assistant', title='Joined SAARTHI Student Platform', description='Account created and study space initialized.')
        except Exception:
            pass


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        user_data = UserProfileSerializer(user, context={'request': request}).data
        return Response({
            'success': True,
            'message': 'Logged in successfully.',
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return success_response(message="Logged out successfully.")


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return success_response(data=serializer.data)

    def put(self, request):
        return self._update_profile(request, partial=False)

    def patch(self, request):
        return self._update_profile(request, partial=True)

    def _update_profile(self, request, partial=True):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Keep today's DailyStudyGoal in sync if daily_goal_minutes was modified
        if 'daily_goal_minutes' in serializer.validated_data:
            try:
                from dashboard.models import DailyStudyGoal
                today = timezone.localdate()
                DailyStudyGoal.objects.update_or_create(
                    user=user,
                    date=today,
                    defaults={'target_minutes': serializer.validated_data['daily_goal_minutes']}
                )
            except Exception:
                pass

        return success_response(data=serializer.data, message="Profile updated successfully.")


class ProfilePictureUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        file_obj = (
            request.FILES.get('picture') or 
            request.FILES.get('profile_picture') or 
            request.FILES.get('image') or 
            request.FILES.get('avatar')
        )
        if not file_obj and request.data.get('picture'):
            raw_data = request.data.get('picture')
            if isinstance(raw_data, str) and ';base64,' in raw_data:
                try:
                    import base64
                    format_part, base64_str = raw_data.split(';base64,', 1)
                    ext = 'png' if 'png' in format_part.lower() else ('webp' if 'webp' in format_part.lower() else 'jpg')
                    image_bytes = base64.b64decode(base64_str)
                    file_obj = ContentFile(image_bytes, name=f"profile_{request.user.id}.{ext}")
                except Exception:
                    pass

        if not file_obj:
            return error_response("No image file provided. Please select a valid picture.", status.HTTP_400_BAD_REQUEST)

        # 1. Size check: 5 MB limit
        max_size = 5 * 1024 * 1024
        if file_obj.size > max_size:
            return error_response("Image file size exceeds the 5 MB limit. Please select a smaller photo.", status.HTTP_400_BAD_REQUEST)

        # 2. Extension check
        name_parts = file_obj.name.rsplit('.', 1)
        ext = name_parts[1].lower() if len(name_parts) > 1 else ''
        if ext not in ['jpg', 'jpeg', 'png', 'webp']:
            return error_response("Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.", status.HTTP_400_BAD_REQUEST)

        # 3. Content integrity validation using Pillow (or magic bytes fallback)
        image_bytes = file_obj.read()
        if Image is not None:
            try:
                probe = Image.open(io.BytesIO(image_bytes))
                probe.verify()
            except Exception:
                return error_response("Invalid or corrupted image file.", status.HTTP_400_BAD_REQUEST)
        else:
            # Basic magic bytes check for JPG/PNG/WEBP
            is_png = image_bytes.startswith(b'\x89PNG\r\n\x1a\n')
            is_jpg = image_bytes.startswith(b'\xff\xd8\xff')
            is_webp = len(image_bytes) > 12 and image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP'
            if not (is_png or is_jpg or is_webp):
                return error_response("Invalid or corrupted image file content.", status.HTTP_400_BAD_REQUEST)

        # 4. Optimization & thumbnail resizing (max 1024x1024)
        try:
            if Image is not None:
                img = Image.open(io.BytesIO(image_bytes))
                
                # Format handling
                if ext in ['jpg', 'jpeg']:
                    if img.mode in ('RGBA', 'LA', 'P'):
                        bg = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        bg.paste(img, mask=img.split()[-1] if len(img.split()) == 4 else None)
                        img = bg
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    save_format = 'JPEG'
                elif ext == 'png':
                    if img.mode not in ('RGB', 'RGBA'):
                        img = img.convert('RGBA')
                    save_format = 'PNG'
                elif ext == 'webp':
                    save_format = 'WEBP'
                else:
                    save_format = 'JPEG'

                img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

                out_io = io.BytesIO()
                img.save(out_io, format=save_format, quality=88, optimize=True)
                content_file = ContentFile(out_io.getvalue(), name=f"profile_{request.user.id}.{ext}")
            else:
                content_file = ContentFile(image_bytes, name=f"profile_{request.user.id}.{ext}")

            # 5. Delete previous file if exists
            request.user.delete_profile_picture_file()

            # 6. Save new profile picture
            request.user.profile_picture.save(f"avatar_{request.user.id}.{ext}", content_file, save=True)

            serializer = UserProfileSerializer(request.user, context={'request': request})
            return success_response(data=serializer.data, message="Profile picture uploaded and saved successfully.")

        except Exception as e:
            return error_response(f"Failed to process and save image: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        request.user.delete_profile_picture_file()
        request.user.save()
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return success_response(data=serializer.data, message="Profile picture removed successfully.")


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        new_password = serializer.validated_data['new_password']
        request.user.set_password(new_password)
        request.user.save()

        # Ensure authentication token remains valid or refreshed
        token, _ = Token.objects.get_or_create(user=request.user)

        return success_response(
            data={'token': token.key},
            message="Your password has been changed successfully."
        )


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        # Cleanup files
        user.delete_profile_picture_file()

        # Delete all user documents from disk if any
        try:
            for doc in user.documents.all():
                if doc.file_path and os.path.isfile(doc.file_path):
                    os.remove(doc.file_path)
        except Exception:
            pass

        user.delete()
        return success_response(message="Your SAARTHI account has been permanently deleted.")


class AppearancePreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(data={'theme_preference': request.user.theme_preference})

    def patch(self, request):
        theme = request.data.get('theme_preference')
        if theme not in ['light', 'dark', 'system']:
            return error_response("Invalid theme. Allowed values: light, dark, system.", status.HTTP_400_BAD_REQUEST)
        request.user.theme_preference = theme
        request.user.save(update_fields=['theme_preference', 'updated_at'])
        return success_response(data={'theme_preference': request.user.theme_preference}, message="Theme preference updated.")


class NotificationPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return success_response(data={
            'notifications_enabled': u.notifications_enabled,
            'notif_study_reminders': u.notif_study_reminders,
            'notif_task_reminders': u.notif_task_reminders,
            'notif_deadline_alerts': u.notif_deadline_alerts,
            'notif_goal_progress': u.notif_goal_progress,
            'notif_quiz_summaries': u.notif_quiz_summaries,
        })

    def patch(self, request):
        u = request.user
        fields = ['notifications_enabled', 'notif_study_reminders', 'notif_task_reminders', 'notif_deadline_alerts', 'notif_goal_progress', 'notif_quiz_summaries']
        updated = []
        for f in fields:
            if f in request.data:
                setattr(u, f, bool(request.data[f]))
                updated.append(f)
        if updated:
            updated.append('updated_at')
            u.save(update_fields=updated)
        return success_response(data={
            'notifications_enabled': u.notifications_enabled,
            'notif_study_reminders': u.notif_study_reminders,
            'notif_task_reminders': u.notif_task_reminders,
            'notif_deadline_alerts': u.notif_deadline_alerts,
            'notif_goal_progress': u.notif_goal_progress,
            'notif_quiz_summaries': u.notif_quiz_summaries,
        }, message="Notification preferences updated successfully.")


class StudyPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return success_response(data={
            'preferred_language': u.preferred_language,
            'explanation_style': u.explanation_style,
            'preferred_subjects': u.preferred_subjects,
            'daily_goal_minutes': u.daily_goal_minutes,
        })

    def patch(self, request):
        u = request.user
        updated = []
        if 'preferred_language' in request.data:
            u.preferred_language = str(request.data['preferred_language']).strip()
            updated.append('preferred_language')
        if 'explanation_style' in request.data:
            style = str(request.data['explanation_style']).lower().strip()
            if style in ['simple', 'detailed']:
                u.explanation_style = style
                updated.append('explanation_style')
        if 'preferred_subjects' in request.data:
            u.preferred_subjects = str(request.data['preferred_subjects']).strip()
            updated.append('preferred_subjects')
        if 'daily_goal_minutes' in request.data:
            try:
                mins = int(request.data['daily_goal_minutes'])
                if 10 <= mins <= 1440:
                    u.daily_goal_minutes = mins
                    updated.append('daily_goal_minutes')
                    # Sync today's goal
                    from dashboard.models import DailyStudyGoal
                    today = timezone.localdate()
                    DailyStudyGoal.objects.update_or_create(
                        user=u,
                        date=today,
                        defaults={'target_minutes': mins}
                    )
            except (ValueError, TypeError):
                pass

        if updated:
            updated.append('updated_at')
            u.save(update_fields=updated)

        return success_response(data={
            'preferred_language': u.preferred_language,
            'explanation_style': u.explanation_style,
            'preferred_subjects': u.preferred_subjects,
            'daily_goal_minutes': u.daily_goal_minutes,
        }, message="Study preferences updated successfully.")
