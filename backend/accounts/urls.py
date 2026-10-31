from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    ProfilePictureUploadView,
    ChangePasswordView,
    DeleteAccountView,
    AppearancePreferenceView,
    NotificationPreferencesView,
    StudyPreferencesView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/picture/', ProfilePictureUploadView.as_view(), name='profile-picture'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
    path('preferences/appearance/', AppearancePreferenceView.as_view(), name='preferences-appearance'),
    path('preferences/notifications/', NotificationPreferencesView.as_view(), name='preferences-notifications'),
    path('preferences/study/', StudyPreferencesView.as_view(), name='preferences-study'),
]
