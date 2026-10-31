from rest_framework import serializers
from .models import Quiz, QuizQuestion, QuizAttempt, QuizAttemptAnswer

class QuizQuestionStudentSerializer(serializers.ModelSerializer):
    """
    Exposes only question and options. NEVER exposes correct_option or explanation
    during an active quiz attempt!
    """
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d']

class QuizQuestionReviewSerializer(serializers.ModelSerializer):
    """
    Exposes question, options, correct_option, and explanation for post-attempt review.
    """
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'explanation']

class QuizListSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    latest_score = serializers.SerializerMethodField()
    attempts_count = serializers.IntegerField(source='attempts.count', read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'subject', 'topic', 'difficulty', 'question_count', 'attempts_count', 'latest_score', 'created_at']

    def get_latest_score(self, obj):
        latest = obj.attempts.first()
        return latest.percentage if latest else None

class QuizDetailStudentSerializer(serializers.ModelSerializer):
    questions = QuizQuestionStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'subject', 'topic', 'difficulty', 'questions', 'created_at']

class QuizAttemptAnswerSerializer(serializers.ModelSerializer):
    question = QuizQuestionReviewSerializer(read_only=True)
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    correct_option = serializers.CharField(source='question.correct_option', read_only=True)
    explanation = serializers.CharField(source='question.explanation', read_only=True)
    option_a = serializers.CharField(source='question.option_a', read_only=True)
    option_b = serializers.CharField(source='question.option_b', read_only=True)
    option_c = serializers.CharField(source='question.option_c', read_only=True)
    option_d = serializers.CharField(source='question.option_d', read_only=True)

    class Meta:
        model = QuizAttemptAnswer
        fields = [
            'id', 'question', 'question_text', 'correct_option', 'explanation',
            'option_a', 'option_b', 'option_c', 'option_d', 'selected_option', 'is_correct'
        ]

class QuizAttemptResultSerializer(serializers.ModelSerializer):
    quiz_id = serializers.IntegerField(source='quiz.id', read_only=True)
    answers = QuizAttemptAnswerSerializer(many=True, read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    quiz_topic = serializers.CharField(source='quiz.topic', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz_id', 'quiz_title', 'quiz_topic', 'score', 'total_questions', 'percentage', 'completed_at', 'answers']

