import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  MessageSquare,
  Loader2,
  Check,
  X,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { api } from '../services/api';

const suggestions = [
  { icon: Lightbulb, text: 'Explain the concept of recursion in simple terms' },
  { icon: BookOpen, text: 'Summarize the key differences between SQL and NoSQL' },
  { icon: HelpCircle, text: 'What are Newton\'s Three Laws of Motion with real-world examples?' },
  { icon: Lightbulb, text: 'Mujhe Time Complexity aur Big-O notation simple Hindi me samjhao' },
];

export default function AIAssistantPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Rename state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoadingConv(true);
      const res = await api.get('/assistant/conversations/');
      const list = res.data || [];
      setConversations(list);

      if (list.length > 0) {
        // Load the first conversation if none selected
        if (!activeConvId || !list.some((c) => c.id === activeConvId)) {
          selectConversation(list[0].id);
        }
      } else {
        // Auto-create a first session
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setErrorMsg('Could not load chat history. Ensure backend is running.');
    } finally {
      setLoadingConv(false);
    }
  };

  const selectConversation = async (id) => {
    try {
      setActiveConvId(id);
      setErrorMsg('');
      const res = await api.get(`/assistant/conversations/${id}/`);
      if (res.data) {
        setActiveConv(res.data);
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
      setErrorMsg('Failed to load selected chat.');
    }
  };

  const handleNewChat = async () => {
    try {
      setErrorMsg('');
      const res = await api.post('/assistant/conversations/', {
        title: 'New Study Session',
      });
      const newConv = res.data || res;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setActiveConv({ ...newConv, messages: [] });
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
      setErrorMsg('Failed to start a new chat session.');
    }
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await api.delete(`/assistant/conversations/${id}/`);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);

      if (activeConvId === id) {
        if (updated.length > 0) {
          selectConversation(updated[0].id);
        } else {
          setActiveConvId(null);
          setActiveConv(null);
          setMessages([]);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to delete conversation.');
    }
  };

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (id, e) => {
    e?.stopPropagation();
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await api.patch(`/assistant/conversations/${id}/`, { title: editTitle.trim() });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c))
      );
      if (activeConv && activeConv.id === id) {
        setActiveConv((prev) => ({ ...prev, title: editTitle.trim() }));
      }
      setEditingId(null);
    } catch (err) {
      alert(err.message || 'Failed to rename conversation.');
    }
  };

  const handleSendMessage = async (textToSend = inputText) => {
    const text = (textToSend || '').trim();
    if (!text || sending) return;

    let targetConvId = activeConvId;

    // If no active conversation, create one first
    if (!targetConvId) {
      try {
        const res = await api.post('/assistant/conversations/', {
          title: text.slice(0, 35) + '...',
        });
        const created = res.data?.data || res.data || res;
        targetConvId = created.id;
        setActiveConvId(created.id);
        setConversations((prev) => [created, ...prev]);
      } catch (err) {
        setErrorMsg('Could not initialize conversation.');
        return;
      }
    }

    // Optimistically add student message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');
    setSending(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/assistant/conversations/${targetConvId}/messages/`, {
        content: text,
        message: text,
        prompt: text,
      });

      const responseData = res.data?.data || res.data || {};
      const aiMsg = responseData.assistant_message;

      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg]);
      }

      // Update active title if was default
      if (responseData.conversation_title) {
        setConversations((prev) =>
          prev.map((c) => (c.id === targetConvId ? { ...c, title: responseData.conversation_title } : c))
        );
        setActiveConv((prev) => (prev ? { ...prev, title: responseData.conversation_title } : prev));
      }
    } catch (err) {
      console.error('Send message error:', err);
      // Remove optimistic temporary message so chat stays in clean alternating state
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setInputText(text); // Preserve user's input so they can retry easily
      setErrorMsg(err.message || 'Gemini AI response failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-3 flex items-center justify-between">
        <PageHeader
          title="AI Study Assistant"
          description="Ask questions, get step-by-step explanations, and master any subject."
        />
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={sidebarOpen ? PanelLeftClose : PanelLeftOpen}
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            {sidebarOpen ? 'Hide History' : 'Show History'}
          </Button>
          <Button size="sm" icon={Plus} onClick={handleNewChat}>
            New Chat
          </Button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="flex-1 flex overflow-hidden p-0 border border-brand-border">
        {/* Left Sidebar: Conversation History */}
        {sidebarOpen && (
          <div className="w-64 sm:w-72 border-r border-brand-border bg-brand-bg/50 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-brand-border flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-text uppercase tracking-wider">
                Study Chats
              </span>
              <button
                onClick={handleNewChat}
                className="p-1 rounded-md text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary-light transition-colors"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConv ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-brand-text-secondary text-center py-6">No previous chats.</p>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const isEditing = conv.id === editingId;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => !isEditing && selectConversation(conv.id)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-btn text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-brand-surface font-medium text-brand-primary shadow-xs border border-brand-border'
                          : 'text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id, e);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="w-full bg-brand-bg px-1 py-0.5 rounded text-xs text-brand-text outline-none border border-brand-primary"
                          />
                        ) : (
                          <span className="truncate">{conv.title || 'Untitled Chat'}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        {isEditing ? (
                          <button
                            onClick={(e) => handleSaveRename(conv.id, e)}
                            className="p-1 hover:text-green-600 dark:hover:text-green-400"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="p-1 hover:text-brand-primary"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="p-1 hover:text-red-600 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Main Chat Area */}
        <div className="flex-1 flex flex-col bg-brand-surface overflow-hidden">
          {errorMsg && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg('')} className="p-0.5 hover:text-red-900 dark:hover:text-red-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[360px] text-center max-w-lg mx-auto py-8">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary-light flex items-center justify-center mb-4 shadow-xs">
                  <Bot className="w-7 h-7 text-brand-primary" />
                </div>
                <h3 className="text-base font-semibold text-brand-text mb-1">
                  Namaste! How can SAARTHI help you study today?
                </h3>
                <p className="text-xs text-brand-text-secondary mb-6 leading-relaxed">
                  Ask questions in English, Hindi, or Hinglish. I can clarify complex formulas, explain concepts step-by-step, or help you solve tricky homework problems.
                </p>

                {/* Suggestions */}
                <div className="flex flex-col gap-2 w-full">
                  {suggestions.map((suggestion) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={suggestion.text}
                        onClick={() => handleSendMessage(suggestion.text)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-btn border border-brand-border bg-brand-bg/50 hover:bg-brand-primary-light/60 hover:border-brand-primary/40 text-left transition-all duration-150 group text-xs text-brand-text-secondary hover:text-brand-text"
                      >
                        <Icon className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-primary flex-shrink-0" />
                        <span className="truncate">{suggestion.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'user' || msg.sender === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-brand-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-brand-primary text-white rounded-br-xs shadow-xs'
                          : 'bg-brand-bg text-brand-text border border-brand-border rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <span
                        className={`block text-[10px] mt-1.5 ${
                          isUser ? 'text-white/70 text-right' : 'text-brand-text-secondary'
                        }`}
                      >
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex gap-3 mr-auto max-w-3xl">
                <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-brand-primary animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-bl-xs px-4 py-3 bg-brand-bg border border-brand-border text-xs text-brand-text-secondary flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  <span>SAARTHI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-brand-border p-3 sm:p-4 bg-brand-surface">
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask SAARTHI anything... (Press Enter to send, Shift+Enter for new line)"
                rows={1}
                className="flex-1 rounded-btn border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none max-h-32 min-h-[42px]"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || sending}
                className="w-10 h-10 rounded-btn bg-brand-primary text-white flex items-center justify-center hover:bg-brand-primary-hover transition-all duration-150 flex-shrink-0 disabled:opacity-50"
                title="Send Message"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-brand-text-secondary text-center mt-2">
              Powered by Google Gemini. Verify critical academic calculations.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
