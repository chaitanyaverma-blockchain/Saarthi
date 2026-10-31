from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Quiz, QuizQuestion, QuizAttempt, QuizAttemptAnswer
from .serializers import (
    QuizListSerializer,
    QuizDetailStudentSerializer,
    QuizAttemptResultSerializer,
)
from documents.models import StudyDocument
from core.gemini_service import gemini_service, GeminiError
from core.utils import success_response
from dashboard.models import StudyActivity

class QuizListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quizzes = Quiz.objects.filter(user=request.user)
        return success_response(data=QuizListSerializer(quizzes, many=True).data)

    def post(self, request):
        topic = request.data.get('topic', '').strip()
        if not topic:
            return Response({'success': False, 'message': 'Quiz topic is required.'}, status=status.HTTP_400_BAD_REQUEST)

        subject = request.data.get('subject', '').strip()
        difficulty = request.data.get('difficulty', 'medium').strip().lower()
        num_questions = request.data.get('num_questions', 5)
        document_id = request.data.get('document_id')

        doc_context = None
        doc_obj = None
        if document_id:
            try:
                doc_obj = StudyDocument.objects.get(pk=document_id, user=request.user)
                doc_context = doc_obj.extracted_text
            except StudyDocument.DoesNotExist:
                return Response({'success': False, 'message': 'Specified document not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        # Generate structured quiz via Gemini
        try:
            quiz_data = gemini_service.generate_quiz(
                topic=topic,
                subject=subject,
                difficulty=difficulty,
                num_questions=num_questions,
                document_context=doc_context
            )
        except GeminiError as ge:
            return Response({'success': False, 'message': str(ge)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({'success': False, 'message': f'Quiz generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save Quiz model
        quiz = Quiz.objects.create(
            user=request.user,
            title=quiz_data.get('title') or f"{topic} Quiz",
            subject=subject or (doc_obj.title if doc_obj else "General"),
            topic=topic,
            difficulty=difficulty,
            document=doc_obj
        )

        # Save Questions
        question_objects = []
        for q in quiz_data.get('questions', []):
            question_objects.append(QuizQuestion(
                quiz=quiz,
                question_text=q['question'],
                option_a=q['option_a'],
                option_b=q['option_b'],
                option_c=q['option_c'],
                option_d=q['option_d'],
                correct_option=q['correct_option'],
                explanation=q.get('explanation', '')
            ))
        QuizQuestion.objects.bulk_create(question_objects)

        # Timeline activity
        StudyActivity.objects.create(
            user=request.user,
            activity_type='quiz',
            title=f'Created Quiz: {quiz.title[:40]}',
            description=f'{len(question_objects)} questions ({difficulty.capitalize()})'
        )

        return Response({
            'success': True,
            'message': 'Quiz generated successfully.',
            'data': QuizDetailStudentSerializer(quiz).data
        }, status=status.HTTP_201_CREATED)

class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_quiz(self, pk, user):
        try:
            return Quiz.objects.get(pk=pk, user=user)
        except Quiz.DoesNotExist:
            return None

    def get(self, request, pk):
        quiz = self.get_quiz(pk, request.user)
        if not quiz:
            return Response({'success': False, 'message': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)
        return success_response(data=QuizDetailStudentSerializer(quiz).data)

    def delete(self, request, pk):
        quiz = self.get_quiz(pk, request.user)
        if not quiz:
            return Response({'success': False, 'message': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)
        quiz.delete()
        return success_response(message='Quiz deleted successfully.')

class QuizSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            quiz = Quiz.objects.get(pk=pk, user=request.user)
        except Quiz.DoesNotExist:
            return Response({'success': False, 'message': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

        student_answers = (
            request.data.get('answers') or 
            request.data.get('student_answers') or 
            request.data.get('responses') or 
            {}
        )
        answers_dict = {}
        if isinstance(student_answers, str):
            try:
                import json
                student_answers = json.loads(student_answers)
            except Exception:
                pass

        if isinstance(student_answers, dict):
            answers_dict = student_answers
        elif isinstance(student_answers, list):
            for item in student_answers:
                if isinstance(item, dict):
                    q_id = item.get('question_id') or item.get('id')
                    sel = item.get('selected_option') or item.get('option') or item.get('answer')
                    if q_id is not None:
                        answers_dict[str(q_id)] = sel
        else:
            answers_dict = {}

        questions = list(quiz.questions.all())
        total_q = len(questions)
        if total_q == 0:
            return Response({'success': False, 'message': 'This quiz has no questions.'}, status=status.HTTP_400_BAD_REQUEST)

        correct_count = 0
        answer_records = []

        for q in questions:
            raw_sel = answers_dict.get(str(q.id), answers_dict.get(q.id, ''))
            selected = str(raw_sel or '').strip().upper()
            correct_clean = str(q.correct_option or '').strip().upper()
            is_correct = bool(selected and selected == correct_clean)
            if is_correct:
                correct_count += 1

            answer_records.append({
                'question': q,
                'selected_option': selected,
                'is_correct': is_correct
            })

        percentage = round((correct_count / total_q) * 100, 1)

        # Save Attempt
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            user=request.user,
            score=correct_count,
            total_questions=total_q,
            percentage=percentage
        )

        for a in answer_records:
            QuizAttemptAnswer.objects.create(
                attempt=attempt,
                question=a['question'],
                selected_option=a['selected_option'],
                is_correct=a['is_correct']
            )

        # Timeline Activity
        StudyActivity.objects.create(
            user=request.user,
            activity_type='quiz',
            title=f'Scored {percentage}% on {quiz.title[:35]}',
            description=f'{correct_count} of {total_q} questions correct'
        )

        return Response({
            'success': True,
            'message': f'Quiz submitted. Your score: {percentage}%',
            'data': QuizAttemptResultSerializer(attempt).data
        }, status=status.HTTP_201_CREATED)

class QuizAttemptsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = QuizAttempt.objects.filter(user=request.user)[:20]
        return success_response(data=QuizAttemptResultSerializer(attempts, many=True).data)

