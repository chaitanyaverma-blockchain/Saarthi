import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Search,
  BookOpen,
  Trash2,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { api } from '../services/api';

const MAX_FILE_SIZE_MB = 10;
const MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const SUMMARY_TYPES = [
  { id: 'comprehensive', label: 'Comprehensive', desc: 'In-depth breakdown of concepts' },
  { id: 'key_points', label: 'Key Points', desc: 'Bulleted list of core takeaways' },
  { id: 'definitions', label: 'Definitions & Formulas', desc: 'Key terms, rules, and formulas' },
  { id: 'revision', label: 'Quick Exam Revision', desc: 'High-yield points for test prep' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function PDFLabPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'qa' | 'text'

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Summary state
  const [summaryType, setSummaryType] = useState('comprehensive');
  const [summaries, setSummaries] = useState([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [asking, setAsking] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents/');
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/`);
      const fullDoc = res.data || doc;
      setSelectedDoc(fullDoc);
      setSummaries(fullDoc.summaries || []);
      setQaHistory([]);
    } catch (err) {
      console.error('Failed to load document details:', err);
      setSelectedDoc(doc);
    }
  };

  const handleFileValidationAndUpload = async (file) => {
    setUploadError('');
    setUploadSuccess('');

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported. Please select a valid .pdf file.');
      return;
    }

    if (file.size > MAX_BYTES) {
      setUploadError(`File is too large (${formatBytes(file.size)}). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace('.pdf', ''));

      const res = await api.upload('/documents/', formData);
      setUploadSuccess(`"${file.name}" uploaded and processed successfully!`);
      await fetchDocuments();

      if (res?.data) {
        handleSelectDoc(res.data);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload and process PDF.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileValidationAndUpload(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileValidationAndUpload(file);
    }
  };

  const handleDeleteDocument = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document and its study data?')) return;

    try {
      await api.delete(`/documents/${id}/`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc && selectedDoc.id === id) {
        setSelectedDoc(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedDoc) return;

    try {
      setGeneratingSummary(true);
      const res = await api.post(`/documents/${selectedDoc.id}/summarize/`, {
        summary_type: summaryType,
      });

      const newSummary = res.data;
      if (newSummary) {
        setSummaries((prev) => {
          const filtered = prev.filter((s) => s.summary_type !== summaryType);
          return [newSummary, ...filtered];
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to generate summary.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || asking || !selectedDoc) return;

    const qText = question.trim();
    setQuestion('');
    setAsking(true);

    try {
      const res = await api.post(`/documents/${selectedDoc.id}/ask/`, {
        question: qText,
      });

      setQaHistory((prev) => [
        {
          question: qText,
          answer: res.data?.answer,
          pages: res.data?.relevant_pages || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
    } catch (err) {
      alert(err.message || 'Failed to get answer from document.');
    } finally {
      setAsking(false);
    }
  };

  const activeSummaryContent = summaries.find((s) => s.summary_type === summaryType)?.content;

  const handleCopySummary = () => {
    if (activeSummaryContent) {
      navigator.clipboard.writeText(activeSummaryContent);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="PDF Study Lab"
        description="Upload textbooks, research papers, and lecture slides. Ask grounded questions and generate AI study summaries."
        action={
          <Button
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Processing...' : 'Upload PDF'}
          </Button>
        }
      />

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,.pdf"
        className="hidden"
      />

      {/* Status Messages */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError('')} className="text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-green-50 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-900/50 text-xs text-green-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess('')} className="text-green-700 hover:text-green-900 dark:text-emerald-300 dark:hover:text-emerald-100 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* If a document is selected, show the Document Study Lab Workspace */}
      {selectedDoc ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Workspace Nav Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-brand-surface rounded-2xl border border-brand-border">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg border border-brand-border hover:bg-brand-bg text-brand-text-secondary hover:text-brand-text transition-colors"
                title="Back to all documents"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-lg bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-brand-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-brand-text truncate">{selectedDoc.title}</h3>
                <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
                  <span>{selectedDoc.page_count} pages</span>
                  <span>•</span>
                  <span>{formatBytes(selectedDoc.file_size)}</span>
                  {!selectedDoc.has_text && (
                    <Badge variant="warning" className="text-[10px]">
                      Scanned / Image PDF
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Switches */}
            <div className="flex items-center gap-1.5 bg-brand-bg p-1 rounded-btn self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-brand-surface text-brand-primary shadow-xs'
                    : 'text-brand-text-secondary hover:text-brand-text'
                }`}
              >
                AI Summary
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                  activeTab === 'qa'
                    ? 'bg-brand-surface text-brand-primary shadow-xs'
                    : 'text-brand-text-secondary hover:text-brand-text'
                }`}
              >
                Document Q&A
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                  activeTab === 'text'
                    ? 'bg-brand-surface text-brand-primary shadow-xs'
                    : 'text-brand-text-secondary hover:text-brand-text'
                }`}
              >
                Extracted Text
              </button>
            </div>
          </div>

          {/* TAB 1: AI SUMMARY */}
          {activeTab === 'summary' && (
            <Card className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border">
                <div>
                  <h4 className="text-sm font-semibold text-brand-text">Generate AI Summary</h4>
                  <p className="text-xs text-brand-text-secondary">
                    Select a format and let Gemini extract key insights from this document.
                  </p>
                </div>
                <Button
                  size="sm"
                  icon={Sparkles}
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary || !selectedDoc.has_text}
                >
                  {generatingSummary ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                    </span>
                  ) : (
                    'Generate Summary'
                  )}
                </Button>
              </div>

              {/* Summary format buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUMMARY_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSummaryType(t.id)}
                    className={`p-3 rounded-btn border text-left transition-all ${
                      summaryType === t.id
                        ? 'border-brand-primary bg-brand-primary-light/50 text-brand-primary'
                        : 'border-brand-border bg-brand-surface text-brand-text-secondary hover:border-brand-primary/50'
                    }`}
                  >
                    <p className="text-xs font-semibold">{t.label}</p>
                    <p className="text-[10px] text-brand-text-secondary mt-0.5 line-clamp-1">{t.desc}</p>
                  </button>
                ))}
              </div>

              {/* Summary Content View */}
              {generatingSummary ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-3" />
                  <p className="text-sm font-medium text-brand-text">Analyzing document chapters...</p>
                  <p className="text-xs text-brand-text-secondary mt-1">
                    Gemini AI is generating your {summaryType} summary.
                  </p>
                </div>
              ) : activeSummaryContent ? (
                <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-4 relative">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-brand-border">
                    <Badge variant="default" className="capitalize text-xs">
                      {summaryType.replace('_', ' ')} Summary
                    </Badge>
                    <button
                      onClick={handleCopySummary}
                      className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-brand-text"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none text-xs text-brand-text whitespace-pre-wrap leading-relaxed">
                    {activeSummaryContent}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-brand-border rounded-xl">
                  <BookOpen className="w-8 h-8 text-brand-text-secondary/40 mx-auto mb-2" />
                  <p className="text-xs text-brand-text-secondary">
                    No {summaryType.replace('_', ' ')} summary generated yet.
                  </p>
                  <p className="text-[11px] text-brand-text-secondary/70 mt-0.5">
                    Click "Generate Summary" above to create one.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: DOCUMENT Q&A */}
          {activeTab === 'qa' && (
            <Card className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-text">Ask Grounded Questions</h4>
                <p className="text-xs text-brand-text-secondary">
                  Ask any question. Answers are extracted strictly from this document with exact page citations.
                </p>
              </div>

              {/* Question input */}
              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What is the definition of momentum according to chapter 2?"
                  disabled={asking || !selectedDoc.has_text}
                  className="flex-1 rounded-btn border border-brand-border bg-brand-bg px-4 py-2 text-xs text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <Button type="submit" size="sm" disabled={!question.trim() || asking}>
                  {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ask'}
                </Button>
              </form>

              {/* Q&A Stream */}
              <div className="space-y-3 pt-2">
                {asking && (
                  <div className="p-4 rounded-xl bg-brand-bg border border-brand-border flex items-center gap-2 text-xs text-brand-text-secondary">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    <span>Searching relevant document chunks & synthesizing answer...</span>
                  </div>
                )}

                {qaHistory.length === 0 && !asking ? (
                  <div className="text-center py-10 border border-dashed border-brand-border rounded-xl">
                    <HelpCircle className="w-8 h-8 text-brand-text-secondary/40 mx-auto mb-2" />
                    <p className="text-xs text-brand-text-secondary">Ask your first question about this document above.</p>
                  </div>
                ) : (
                  qaHistory.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px]">
                            Q
                          </span>
                          {item.question}
                        </p>
                        <span className="text-[10px] text-brand-text-secondary">{item.timestamp}</span>
                      </div>
                      <div className="text-xs text-brand-text-secondary leading-relaxed pl-5 whitespace-pre-wrap">
                        {item.answer}
                      </div>
                      {item.pages && item.pages.length > 0 && (
                        <div className="flex items-center gap-1.5 pl-5 pt-1">
                          <span className="text-[10px] text-brand-text-secondary font-medium">Citations:</span>
                          {item.pages.map((p) => (
                            <Badge key={p} variant="neutral" className="text-[10px] px-1.5 py-0">
                              Page {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* TAB 3: EXTRACTED TEXT PREVIEW */}
          {activeTab === 'text' && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-brand-text">Extracted Document Text</h4>
                  <p className="text-xs text-brand-text-secondary">
                    Review text parsed by the PyPDF engine.
                  </p>
                </div>
                <Badge variant={selectedDoc.has_text ? 'success' : 'warning'}>
                  {selectedDoc.has_text ? 'Text Extracted' : 'No Text Detected'}
                </Badge>
              </div>
              <div className="max-h-96 overflow-y-auto rounded-xl border border-brand-border bg-brand-bg p-3.5 text-xs font-mono text-brand-text-secondary leading-relaxed whitespace-pre-wrap">
                {selectedDoc.extracted_text || 'No readable text could be extracted from this document.'}
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* Document Library & Upload Overview */
        <div className="space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-brand-primary bg-brand-primary-light/40 scale-[1.01]'
                : 'border-brand-border bg-brand-surface hover:border-brand-primary/60'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-primary-light flex items-center justify-center mx-auto mb-3">
              {uploading ? (
                <Loader2 className="w-7 h-7 text-brand-primary animate-spin" />
              ) : (
                <Upload className="w-7 h-7 text-brand-primary" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-brand-text mb-1">
              {uploading ? 'Processing PDF document...' : 'Drop your study PDF here'}
            </h3>
            <p className="text-xs text-brand-text-secondary mb-3">
              or click to browse from your computer (Max {MAX_FILE_SIZE_MB}MB)
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Search,
                title: 'Grounded Q&A',
                desc: 'Ask direct questions and get answers with exact page number citations.',
              },
              {
                icon: BookOpen,
                title: 'Multi-Format Summaries',
                desc: 'Generate comprehensive notes, bulleted highlights, or exam revision sheets.',
              },
              {
                icon: FileText,
                title: 'PDF Quiz Generator',
                desc: 'Turn any chapter or document directly into interactive multiple-choice tests.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} hover>
                  <div className="w-9 h-9 rounded-lg bg-brand-primary-light flex items-center justify-center mb-2.5">
                    <Icon className="w-4 h-4 text-brand-primary" />
                  </div>
                  <h4 className="text-xs font-semibold text-brand-text mb-1">{feature.title}</h4>
                  <p className="text-xs text-brand-text-secondary leading-relaxed">{feature.desc}</p>
                </Card>
              );
            })}
          </div>

          {/* Uploaded Documents List */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-brand-text">Your Documents</h3>
              <span className="text-xs text-brand-text-secondary">{documents.length} uploaded</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-10 h-10 text-brand-text-secondary/40 mx-auto mb-3" />
                <p className="text-xs text-brand-text-secondary">No documents uploaded yet.</p>
                <p className="text-[11px] text-brand-text-secondary/70 mt-0.5">
                  Upload your textbook, syllabus, or lecture notes to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="flex items-center justify-between py-3 px-2 hover:bg-brand-bg rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-brand-text truncate group-hover:text-brand-primary transition-colors">
                          {doc.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-brand-text-secondary mt-0.5">
                          <span>{doc.page_count} pages</span>
                          <span>•</span>
                          <span>{formatBytes(doc.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="p-1.5 text-brand-text-secondary hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
