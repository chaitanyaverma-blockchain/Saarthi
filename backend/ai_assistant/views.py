from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Conversation, ChatMessage
from .serializers import ConversationListSerializer, ConversationDetailSerializer, ChatMessageSerializer
from core.gemini_service import gemini_service, GeminiError
from core.utils import success_response
from dashboard.models import StudyActivity

class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(user=request.user)
        return success_response(data=ConversationListSerializer(conversations, many=True).data)

    def post(self, request):
        title = request.data.get('title', '').strip() or 'New Study Session'
        conv = Conversation.objects.create(user=request.user, title=title)
        return Response(ConversationListSerializer(conv).data, status=status.HTTP_201_CREATED)

class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Conversation.objects.get(pk=pk, user=user)
        except Conversation.DoesNotExist:
            return None

    def get(self, request, pk):
        conv = self.get_object(pk, request.user)
        if not conv:
            return Response({'success': False, 'message': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)
        return success_response(data=ConversationDetailSerializer(conv).data)

    def patch(self, request, pk):
        conv = self.get_object(pk, request.user)
        if not conv:
            return Response({'success': False, 'message': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)
        title = request.data.get('title', '').strip()
        if not title:
            return Response({'success': False, 'message': 'Title cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        conv.title = title
        conv.save(update_fields=['title', 'updated_at'])
        return success_response(data=ConversationListSerializer(conv).data, message='Conversation renamed successfully.')

    def delete(self, request, pk):
        conv = self.get_object(pk, request.user)
        if not conv:
            return Response({'success': False, 'message': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)
        conv.delete()
        return success_response(message='Conversation deleted successfully.')

class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            conv = Conversation.objects.get(pk=pk, user=request.user)
        except Conversation.DoesNotExist:
            return Response({'success': False, 'message': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

        content = (
            request.data.get('content') or 
            request.data.get('message') or 
            request.data.get('text') or 
            request.data.get('prompt') or 
            ''
        ).strip()
        if not content:
            return Response({'success': False, 'message': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Save user message
        user_msg = ChatMessage.objects.create(
            conversation=conv,
            sender='user',
            content=content
        )

        # 2. Gather conversation history context (last 10 messages)
        history_msgs = conv.messages.order_by('-created_at')[:10]
        history_list = []
        for m in reversed(history_msgs):
            history_list.append({
                'role': 'user' if m.sender == 'user' else 'model',
                'content': m.content
            })

        # 3. Build personalized system instruction if student has study preferences
        u = request.user
        prefs_notes = []
        if getattr(u, 'preferred_language', None) and u.preferred_language != 'English':
            prefs_notes.append(f"Student prefers responses in {u.preferred_language} or conversational bilingual mode.")
        if getattr(u, 'explanation_style', None) == 'simple':
            prefs_notes.append("Student prefers simple explanations: use intuitive analogies, plain language, and step-by-step clarity.")
        elif getattr(u, 'explanation_style', None) == 'detailed':
            prefs_notes.append("Student prefers detailed explanations: provide in-depth rigor, comprehensive coverage, and complete examples.")
        if getattr(u, 'major', None):
            prefs_notes.append(f"Student's field of study is {u.major}.")

        sys_inst = None
        if prefs_notes:
            sys_inst = (
                "You are SAARTHI, an expert academic AI study assistant and mentor for students.\n"
                "Student Learning Profile:\n" + "\n".join(f"- {p}" for p in prefs_notes) + "\n"
                "Explain concepts clearly, use structured Markdown, and provide supportive academic guidance."
            )

        # 4. Call Gemini AI service
        try:
            assistant_reply = gemini_service.chat(messages=history_list, system_instruction=sys_inst)
        except GeminiError as ge:
            user_msg.delete()
            return Response({'success': False, 'message': str(ge)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            user_msg.delete()
            return Response({'success': False, 'message': f'AI generation error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 4. Save assistant reply
        assistant_msg = ChatMessage.objects.create(
            conversation=conv,
            sender='assistant',
            content=assistant_reply
        )

        # 5. Auto-title conversation on first exchange if still default
        if conv.title == 'New Study Session':
            auto_title = content[:35] + ('...' if len(content) > 35 else '')
            conv.title = auto_title
            conv.save(update_fields=['title', 'updated_at'])

        # 6. Record activity in timeline
        StudyActivity.objects.create(
            user=request.user,
            activity_type='assistant',
            title=f'Studied with AI: {conv.title[:40]}',
            description=content[:60]
        )

        return Response({
            'success': True,
            'data': {
                'conversation_id': conv.id,
                'user_message': ChatMessageSerializer(user_msg).data,
                'assistant_message': ChatMessageSerializer(assistant_msg).data,
            }
        }, status=status.HTTP_201_CREATED)
