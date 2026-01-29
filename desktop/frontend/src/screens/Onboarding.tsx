import { useState } from 'react';
import { GraduationCap, Users, BookOpen, Mail, Lock, User, Calendar, Eye, EyeOff, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

type OnboardingStep = 'role' | 'auth';
type AuthMode = 'login' | 'signup';

export default function Onboarding() {
  const { setUserRole, setCurrentScreen } = useApp();
  const { login, signup } = useAuth();
  
  const [step, setStep] = useState<OnboardingStep>('role');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const roles = [
    {
      id: 'student',
      icon: GraduationCap,
      title: 'Student',
      description: 'Learn, collaborate, and achieve your academic goals',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'parent',
      icon: Users,
      title: 'Parent',
      description: 'Monitor your child\'s progress and support their learning',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      id: 'teacher',
      icon: BookOpen,
      title: 'Teacher',
      description: 'Guide students and manage learning resources',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setStep('auth');
  };

  const handleBackToRole = () => {
    setStep('role');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        // Login
        const response = await login(email, password);
        console.log('Login successful:', response);
        
        // Set role and navigate
        setUserRole(response.user.role as any);
        navigateByRole(response.user.role);
      } else {
        // Signup
        if (!name || !age) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }

        const response = await signup(email, password, name, parseInt(age), selectedRole);
        console.log('Signup successful:', response);
        
        // Set role and navigate
        setUserRole(selectedRole as any);
        navigateByRole(selectedRole);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateByRole = (role: string) => {
    if (role === 'student') {
      setCurrentScreen('dashboard');
    } else if (role === 'parent') {
      setCurrentScreen('parent-dashboard');
    } else {
      setCurrentScreen('teacher-dashboard');
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-card dark:bg-gradient-card-dark opacity-30"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-4xl w-full relative z-10 animate-slide-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-card mb-6 shadow-glow animate-pulse-slow">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Welcome to Buddy
            </h1>
            <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
              Your AI-powered learning companion for focused study, collaboration, and academic success
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-center text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
              I am a...
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {roles.map((role, index) => {
                const Icon = role.icon;
                const gradients = {
                  student: 'bg-gradient-primary',
                  parent: 'bg-gradient-success',
                  teacher: 'bg-gradient-accent',
                };
                return (
                  <Card
                    key={role.id}
                    hover
                    onClick={() => handleRoleSelect(role.id)}
                    className="p-8 text-center cursor-pointer border-2 border-transparent hover:border-primary transition-all animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`inline-flex items-center justify-center w-20 h-20 ${gradients[role.id as keyof typeof gradients]} rounded-card mb-4 shadow-soft`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                      {role.title}
                    </h3>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {role.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Auth Step
  const selectedRoleData = roles.find(r => r.id === selectedRole);
  const RoleIcon = selectedRoleData?.icon || BookOpen;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-card dark:bg-gradient-card-dark opacity-30"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full relative z-10 animate-slide-up">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-card mb-4 shadow-soft">
              <RoleIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
              {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {authMode === 'login' 
                ? `Sign in as a ${selectedRoleData?.title.toLowerCase()}`
                : `Join Buddy as a ${selectedRoleData?.title.toLowerCase()}`
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-button">
              <p className="text-sm text-error text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                    Age
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary"
                      placeholder="Enter your age"
                      min="1"
                      max="120"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary"
                  placeholder="Enter your password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {authMode === 'signup' && (
                <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                authMode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-sm text-primary hover:underline"
            >
              {authMode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={handleBackToRole}
              className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary transition-colors"
            >
              ← Choose a different role
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
