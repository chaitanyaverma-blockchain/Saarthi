import os
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('An email address is required')
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

def user_profile_pic_path(instance, filename):
    ext = filename.split('.')[-1].lower()
    return f"profile_pictures/user_{instance.id}_{instance.email.split('@')[0]}.{ext}"

class User(AbstractUser):
    username = None
    email = models.EmailField('Email Address', unique=True, db_index=True)
    name = models.CharField('Full Name', max_length=150)
    bio = models.TextField('Short Bio', max_length=500, blank=True, default='')
    university = models.CharField(max_length=200, default='Stanford University', blank=True)
    major = models.CharField(max_length=200, default='Computer Science', blank=True)
    year = models.CharField(max_length=50, default='3rd Year', blank=True)

    # Profile Picture
    avatar = models.CharField(max_length=500, null=True, blank=True)
    profile_picture = models.FileField(upload_to=user_profile_pic_path, null=True, blank=True)

    # Preferences
    preferred_language = models.CharField(max_length=30, default='English', blank=True)
    theme_preference = models.CharField(max_length=20, default='system', blank=True)

    # Study Preferences
    explanation_style = models.CharField(max_length=20, default='detailed', blank=True)
    preferred_subjects = models.CharField(max_length=300, blank=True, default='Computer Science, Mathematics, Machine Learning')
    daily_goal_minutes = models.PositiveIntegerField(default=120)
    study_goal_hours = models.PositiveIntegerField(default=20)

    # Notification Preferences
    notifications_enabled = models.BooleanField(default=True)
    notif_study_reminders = models.BooleanField(default=True)
    notif_task_reminders = models.BooleanField(default=True)
    notif_deadline_alerts = models.BooleanField(default=True)
    notif_goal_progress = models.BooleanField(default=True)
    notif_quiz_summaries = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    objects = UserManager()

    @property
    def profile_picture_url(self):
        if self.profile_picture:
            try:
                return self.profile_picture.url
            except Exception:
                pass
        return self.avatar or None

    def delete_profile_picture_file(self):
        if self.profile_picture:
            try:
                if os.path.isfile(self.profile_picture.path):
                    os.remove(self.profile_picture.path)
            except Exception:
                pass
            self.profile_picture = None
            self.avatar = None

    def __str__(self):
        return f"{self.name} ({self.email})"
