from django.db import models
from django.conf import settings
from django.utils import timezone

class StudyTask(models.Model):
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    subject = models.CharField(max_length=100)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    due_date = models.DateField(null=True, blank=True)
    scheduled_time = models.CharField(max_length=50, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['is_completed', 'due_date', '-created_at']

    def save(self, *args, **kwargs):
        if self.status == 'Completed':
            self.is_completed = True
        elif self.is_completed and self.status == 'Pending':
            self.status = 'Completed'
        elif not self.is_completed and self.status == 'Completed':
            self.status = 'Pending'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.subject}) - {self.status}"

class DailyStudyGoal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_goals')
    date = models.DateField(default=timezone.now)
    target_minutes = models.PositiveIntegerField(default=120)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.email} - {self.date}: {self.target_minutes}m goal"

class StudySession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='study_sessions')
    subject = models.CharField(max_length=100)
    task = models.ForeignKey(StudyTask, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    duration_minutes = models.PositiveIntegerField()
    notes = models.TextField(blank=True, default='')
    session_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.subject} ({self.duration_minutes}m) on {self.session_date}"

class TimetableSession(models.Model):
    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]
    SESSION_TYPES = [
        ('lecture', 'Lecture'),
        ('study', 'Self Study'),
        ('lab', 'Lab Session'),
        ('assignment', 'Assignment'),
        ('revision', 'Revision'),
        ('group', 'Study Group'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='timetable_sessions')
    subject = models.CharField(max_length=100)
    title = models.CharField(max_length=255, blank=True)
    day_of_week = models.CharField(max_length=20, choices=DAY_CHOICES)
    start_time = models.CharField(max_length=20)
    end_time = models.CharField(max_length=20)
    session_type = models.CharField(max_length=50, choices=SESSION_TYPES, default='study')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.day_of_week}: {self.subject} ({self.start_time}-{self.end_time})"

class StudyNote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    content = models.TextField(blank=True)
    color = models.CharField(max_length=50, default='bg-emerald-50', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class StudyActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, default='notes')
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"

class ScheduleItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=255)
    time_slot = models.CharField(max_length=100)
    item_type = models.CharField(max_length=50, default='lecture')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.title}"
