import { useState, useEffect } from 'react';
import { Plus, Search, StickyNote, FolderOpen, Sparkles, Trash2, Edit3, X, Check, Loader2, BookOpen } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { api } from '../services/api';

const SUBJECT_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-indigo-500',
];

function getSubjectColor(subject) {
  let hash = 0;
  for (let i = 0; i < (subject || '').length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // AI Assist State in Modal
  const [aiAction, setAiAction] = useState('generate');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchNotes = async (q = searchQuery, subj = selectedSubject) => {
    try {
      setLoading(true);
      let endpoint = '/dashboard/notes/';
      const params = new URLSearchParams();
      if (q.trim()) params.append('q', q.trim());
      if (subj && subj !== 'All') params.append('subject', subj);
      const queryString = params.toString();
      if (queryString) endpoint += `?${queryString}`;

      const res = await api.get(endpoint);
      setNotes(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes(searchQuery, selectedSubject);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSubject]);

  // Extract unique subjects
  const availableSubjects = ['All', ...new Set(notes.map((n) => n.subject).filter(Boolean))];

  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setSubject('');
    setContent('');
    setFormError('');
    setAiError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setSubject(note.subject || '');
    setContent(note.content || '');
    setFormError('');
    setAiError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a note title.');
      return;
    }
    if (!content.trim()) {
      setFormError('Note content cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const payload = {
        title: title.trim(),
        subject: subject.trim() || 'General',
        content: content.trim(),
      };

      if (editingNote) {
        await api.put(`/dashboard/notes/${editingNote.id}/`, payload);
      } else {
        await api.post('/dashboard/notes/', payload);
      }

      handleCloseModal();
      fetchNotes(searchQuery, selectedSubject);
    } catch (err) {
      setFormError(err.message || 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this study note?')) return;

    try {
      await api.delete(`/dashboard/notes/${id}/`);
      if (editingNote && editingNote.id === id) {
        handleCloseModal();
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete note.');
    }
  };

  // AI Assist Note Generation
  const handleAIAssist = async () => {
    if (!title.trim() && !content.trim()) {
      setAiError('Enter a title or some notes first so AI has context.');
      return;
    }

    try {
      setAiGenerating(true);
      setAiError('');

      const res = await api.post('/dashboard/notes/ai-generate/', {
        topic: title.trim() || 'Study Topic',
        subject: subject.trim() || 'General',
        source_text: content.trim(),
        action_type: aiAction,
      });

      if (res?.data?.generated_notes) {
        setContent((prev) => (prev ? `${prev}\n\n${res.data.generated_notes}` : res.data.generated_notes));
      }
    } catch (err) {
      setAiError(err.message || 'AI generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Notes"
        description="Create, organize, and review your AI-enhanced study notes."
        action={
          <Button icon={Plus} onClick={handleOpenCreateModal}>
            New Note
          </Button>
        }
      />

      {/* Search and Subject filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full rounded-btn border border-brand-border bg-brand-surface pl-9 pr-4 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {availableSubjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors whitespace-nowrap ${
                selectedSubject === subj
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-brand-surface text-brand-text-secondary border-brand-border hover:border-brand-primary'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={searchQuery ? 'No notes matched your search' : 'No study notes yet'}
          description={
            searchQuery
              ? `We couldn't find any notes matching "${searchQuery}". Try a different keyword.`
              : 'Create your first note or use AI to generate structured study materials.'
          }
          action={
            <Button icon={Plus} onClick={handleOpenCreateModal}>
              Create Note
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const barColor = getSubjectColor(note.subject);
            return (
              <Card
                key={note.id}
                hover
                onClick={() => handleOpenEditModal(note)}
                className="cursor-pointer flex flex-col justify-between group relative"
              >
                <div>
                  <div className={`w-full h-1.5 ${barColor} rounded-full mb-3`} />
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-brand-text line-clamp-1 group-hover:text-brand-primary transition-colors">
                      {note.title}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      title="Delete note"
                      className="text-brand-text-secondary/40 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 -mr-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Badge variant="default" className="mb-3 text-[11px]">
                    {note.subject || 'General'}
                  </Badge>
                  <p className="text-xs text-brand-text-secondary leading-relaxed line-clamp-4 whitespace-pre-wrap mb-4">
                    {note.content}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-brand-border/60 text-[11px] text-brand-text-secondary">
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 group-hover:text-brand-primary transition-colors">
                    <Edit3 className="w-3 h-3" /> Edit
                  </span>
                </div>
              </Card>
            );
          })}

          {/* New note card shortcut */}
          <Card
            hover
            onClick={handleOpenCreateModal}
            className="cursor-pointer border-dashed border-2 flex flex-col items-center justify-center min-h-[180px] hover:border-brand-primary transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-primary-light flex items-center justify-center mb-2">
              <Plus className="w-5 h-5 text-brand-primary" />
            </div>
            <p className="text-sm font-medium text-brand-text-secondary">Create New Note</p>
          </Card>
        </div>
      )}

      {/* Note Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
              <div>
                <h3 className="text-base font-semibold text-brand-text">
                  {editingNote ? 'Edit Study Note' : 'Create New Note'}
                </h3>
                <p className="text-xs text-brand-text-secondary">
                  Capture key concepts and use Gemini AI to enhance your notes.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNote} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Binary Search Trees & AVL"
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Computer Science, Physics..."
                    className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* AI Assist Box */}
              <div className="rounded-xl border border-brand-primary/30 bg-brand-primary-light/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary">
                    <Sparkles className="w-4 h-4" />
                    <span>Gemini AI Assist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={aiAction}
                      onChange={(e) => setAiAction(e.target.value)}
                      className="text-xs rounded-btn border border-brand-border bg-brand-surface px-2 py-1 text-brand-text focus:outline-none"
                    >
                      <option value="generate">Generate Structured Notes</option>
                      <option value="summarize">Summarize Content</option>
                      <option value="simplify">Simplify for Beginners</option>
                    </select>
                    <button
                      type="button"
                      disabled={aiGenerating}
                      onClick={handleAIAssist}
                      className="flex items-center gap-1 px-3 py-1 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-btn text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Run AI Assist</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {aiError && <p className="text-xs text-red-600 dark:text-red-400">{aiError}</p>}
                <p className="text-[11px] text-brand-text-secondary leading-tight">
                  AI will analyze your title and subject to generate detailed Markdown notes and insert them below for you to review and edit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Content (Markdown supported) *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your notes or let Gemini AI generate them..."
                  rows={9}
                  className="w-full rounded-btn border border-brand-border bg-brand-bg px-3.5 py-2.5 text-sm font-mono text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-border">
                {editingNote ? (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNote(editingNote.id, e)}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium py-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Note</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </span>
                    ) : (
                      'Save Note'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
