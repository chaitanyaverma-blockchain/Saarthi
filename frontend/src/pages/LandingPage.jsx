import { useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  FileText,
  StickyNote,
  HelpCircle,
  CalendarDays,
  BarChart3,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Target,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';

const features = [
  {
    icon: Bot,
    title: 'AI Study Assistant',
    description: 'Get instant explanations, solve doubts, and deepen your understanding of any topic with AI-powered conversations.',
  },
  {
    icon: FileText,
    title: 'PDF Study Lab',
    description: 'Upload study materials and let AI help you extract key concepts, summaries, and insights from your documents.',
  },
  {
    icon: StickyNote,
    title: 'Smart Notes',
    description: 'Create, organize, and manage your study notes with AI-assisted generation and intelligent categorization.',
  },
  {
    icon: HelpCircle,
    title: 'Quiz Generator',
    description: 'Auto-generate quizzes from your study materials to test your knowledge and identify areas for improvement.',
  },
  {
    icon: CalendarDays,
    title: 'Study Planner',
    description: 'Plan your study schedule, set goals, and track deadlines to stay organized throughout the semester.',
  },
  {
    icon: BarChart3,
    title: 'Learning Analytics',
    description: 'Track your study habits, quiz scores, and progress over time with detailed visual analytics.',
  },
];

const steps = [
  {
    icon: BookOpen,
    step: '01',
    title: 'Upload Your Materials',
    description: 'Add your PDFs, textbooks, and lecture notes to build your personal study library.',
  },
  {
    icon: Lightbulb,
    step: '02',
    title: 'Learn with AI',
    description: 'Ask questions, generate notes, and take quizzes. SAARTHI adapts to your learning style.',
  },
  {
    icon: Target,
    step: '03',
    title: 'Track Your Progress',
    description: 'Monitor your learning journey with analytics and stay on track with the study planner.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-brand-surface/80 backdrop-blur-sm border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Log In
            </Button>
            <Button size="sm" onClick={() => navigate('/signup')} icon={ArrowRight}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary-light text-brand-primary text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
          AI-Powered Learning Platform
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-text leading-tight max-w-3xl mx-auto">
          Your Journey to{' '}
          <span className="text-brand-primary">Smarter Learning</span>
        </h1>
        <p className="text-brand-text-secondary text-base sm:text-lg max-w-2xl mx-auto mt-5 leading-relaxed">
          SAARTHI helps students understand topics, study from PDFs, generate notes,
          take quizzes, and track progress — all powered by AI.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Button size="lg" onClick={() => navigate('/signup')} icon={ArrowRight}>
            Start Learning Free
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
            I Already Have an Account
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-text">
            Everything You Need to Study Smarter
          </h2>
          <p className="text-brand-text-secondary mt-3 max-w-xl mx-auto">
            Six powerful tools designed to enhance every aspect of your learning journey.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-brand-surface border border-brand-border rounded-card p-6 shadow-card hover:shadow-card-hover transition-all duration-150"
              >
                <div className="w-11 h-11 rounded-lg bg-brand-primary-light flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="text-base font-semibold text-brand-text mb-2">{feature.title}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-text">
            How SAARTHI Works
          </h2>
          <p className="text-brand-text-secondary mt-3 max-w-xl mx-auto">
            Get started in three simple steps.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                  Step {step.step}
                </span>
                <h3 className="text-lg font-semibold text-brand-text mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-brand-primary rounded-card p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Transform Your Learning?</h2>
          <p className="text-white/80 max-w-lg mx-auto mb-6">
            Join thousands of students who are already studying smarter with SAARTHI.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white hover:text-brand-primary"
            onClick={() => navigate('/signup')}
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-brand-text-secondary">
            © {new Date().getFullYear()} SAARTHI. Built for students, by students.
          </p>
        </div>
      </footer>
    </div>
  );
}
