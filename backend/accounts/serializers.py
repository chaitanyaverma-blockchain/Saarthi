from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'}, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'confirm_password', 'university', 'major', 'year']
        extra_kwargs = {'university': {'required': False}, 'major': {'required': False}, 'year': {'required': False}}

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate_name(self, value):
        stripped = value.strip()
        if len(stripped) < 2:
            raise serializers.ValidationError("Please provide your full name.")
        return stripped

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': ['Passwords do not match.']})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')
        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'email',
            'bio',
            'university',
            'major',
            'year',
            'profile_picture',
            'preferred_language',
            'theme_preference',
            'explanation_style',
            'preferred_subjects',
            'daily_goal_minutes',
            'study_goal_hours',
            'notifications_enabled',
            'notif_study_reminders',
            'notif_task_reminders',
            'notif_deadline_alerts',
            'notif_goal_progress',
            'notif_quiz_summaries',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        url = obj.profile_picture_url
        if not url:
            return None
        if request and not url.startswith(('http://', 'https://')):
            return request.build_absolute_uri(url)
        return url

    def validate_email(self, value):
        normalized = value.strip().lower()
        user = self.instance
        if user and user.email == normalized:
            return normalized
        if User.objects.filter(email__iexact=normalized).exclude(id=user.id if user else None).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate_name(self, value):
        stripped = value.strip()
        if len(stripped) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters long.")
        return stripped

    def validate_daily_goal_minutes(self, value):
        if value < 10 or value > 1440:
            raise serializers.ValidationError("Daily study goal must be between 10 and 1440 minutes (24 hours).")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})
    confirm_new_password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        user = self.context.get('request').user
        if not user.check_password(attrs.get('current_password')):
            raise serializers.ValidationError({'current_password': 'The current password you provided is incorrect.'})
        
        new_pass = attrs.get('new_password')
        confirm_pass = attrs.get('confirm_new_password')

        if new_pass != confirm_pass:
            raise serializers.ValidationError({'confirm_new_password': 'New passwords do not match.'})
        
        if attrs.get('current_password') == new_pass:
            raise serializers.ValidationError({'new_password': 'Your new password cannot be the same as your current password.'})

        validate_password(new_pass, user)
        return attrs


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})
    confirm_text = serializers.CharField(required=True)

    def validate(self, attrs):
        user = self.context.get('request').user
        if not user.check_password(attrs.get('password')):
            raise serializers.ValidationError({'password': 'Incorrect password. Account deletion requires valid password verification.'})
        if attrs.get('confirm_text') != 'DELETE':
            raise serializers.ValidationError({'confirm_text': "Please type 'DELETE' to confirm account deletion."})
        return attrs
