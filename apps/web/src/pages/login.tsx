import { createSignal, Show, For } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [errorMsg, setErrorMsg] = createSignal('');
  const [successMsg, setSuccessMsg] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [isForgotPassword, setIsForgotPassword] = createSignal(false);
  const navigate = useNavigate();

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email(),
        password: password()
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
        // Successfully logged in
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email(), {
        redirectTo: window.location.origin + '/login',
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Check your email for the password reset link.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen relative overflow-hidden bg-slate-900">
      {/* Live Rain Background */}
      <div 
        class="absolute inset-0 z-0 animate-slow-pan"
        style="background-image: url('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1920&q=80'); background-size: cover; background-position: center; filter: blur(8px) brightness(0.6) saturate(1.5);"
      ></div>
      {/* Color overlay to enhance the neon look */}
      <div class="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-pink-900/30 mix-blend-overlay"></div>
      
      {/* Main Content Wrapper */}
      <div class="relative z-10 flex w-full max-w-7xl mx-auto my-4 sm:my-8 rounded-3xl overflow-hidden backdrop-blur-md bg-black/20 border border-white/10 shadow-2xl">
        
        {/* Left side - Decorative/Branding */}
        <div class="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 bg-white/5 backdrop-blur-sm border-r border-white/10">
          
          <div class="relative z-10 w-full max-w-lg text-white">
            <div class="backdrop-blur-xl bg-white/10 border border-white/20 p-10 rounded-3xl shadow-2xl">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 text-white mb-8 shadow-inner overflow-hidden border-2 border-white/30 backdrop-blur-md">
                <img src="/jemaw_logo_final_1785499200444.jpg" alt="Jemaw Logo" class="w-full h-full object-cover" />
              </div>
              <h1 class="text-4xl font-extrabold tracking-tight mb-4 text-white drop-shadow-md">
                Bring your groups together.
              </h1>
              <p class="text-lg text-white/90 leading-relaxed drop-shadow">
                Jemaw makes it effortless to coordinate meetups, share memories, and stay connected with your favorite people—all powered by intelligent AI assistance.
              </p>
              
              <div class="mt-10 flex items-center space-x-4">
                <div class="flex -space-x-3">
                  <For each={[1, 2, 3, 4]}>
                    {(i) => (
                      <div class="w-10 h-10 rounded-full border-2 border-purple-500 bg-white/20 flex items-center justify-center backdrop-blur-md overflow-hidden shadow-lg">
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" class="w-full h-full object-cover" />
                      </div>
                    )}
                  </For>
                </div>
                <p class="text-sm font-medium text-white drop-shadow-md">
                  Join thousands of friend groups
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div class="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-16 xl:px-24 py-12 bg-white/10 backdrop-blur-xl dark:bg-slate-900/40">
          <div class="mx-auto w-full max-w-sm">
            
            <div class="mb-10 lg:hidden flex justify-center">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl mb-2 overflow-hidden border border-white/30">
                <img src="/jemaw_logo_final_1785499200444.jpg" alt="Jemaw Logo" class="w-full h-full object-cover" />
              </div>
            </div>

            <div class="text-left mb-10">
              <h2 class="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                {isForgotPassword() ? 'Reset password' : 'Welcome back'}
              </h2>
              <p class="mt-2 text-sm text-white/80 drop-shadow">
                {isForgotPassword() 
                  ? "Enter your email and we'll send you a link to reset your password."
                  : "Enter your credentials to access your account."}
              </p>
            </div>

            <form class="space-y-6" onSubmit={isForgotPassword() ? handleResetPassword : handleLogin}>
              <div class="space-y-5">
                <div>
                  <label for="email" class="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="h-5 w-5 text-white/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email()}
                      onInput={(e) => setEmail(e.currentTarget.value)}
                      required
                      class="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 shadow-sm backdrop-blur-md"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <Show when={!isForgotPassword()}>
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label for="password" class="block text-sm font-medium text-white/90">
                        Password
                      </label>
                      <button type="button" onClick={() => setIsForgotPassword(true)} class="text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-white/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password()}
                        onInput={(e) => setPassword(e.currentTarget.value)}
                        required={!isForgotPassword()}
                        class="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 shadow-sm backdrop-blur-md"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </Show>
              </div>

              <Show when={errorMsg()}>
                <div class="animate-fade-in flex items-center gap-3 p-4 text-sm text-rose-200 border border-rose-500/30 rounded-xl bg-rose-900/40 backdrop-blur-md">
                  <svg class="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>{errorMsg()}</p>
                </div>
              </Show>

              <Show when={successMsg()}>
                <div class="animate-fade-in flex items-center gap-3 p-4 text-sm text-emerald-200 border border-emerald-500/30 rounded-xl bg-emerald-900/40 backdrop-blur-md">
                  <svg class="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <p>{successMsg()}</p>
                </div>
              </Show>

              <div class="pt-2 flex flex-col items-center space-y-4">
                <button
                  type="submit"
                  disabled={loading()}
                  class="flex w-full justify-center rounded-2xl bg-indigo-500/80 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400/50 px-3 py-3.5 text-sm font-semibold leading-6 text-white shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Show
                    when={!loading()}
                    fallback={
                      <div class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isForgotPassword() ? 'Sending...' : 'Signing in...'}
                      </div>
                    }
                  >
                    {isForgotPassword() ? 'Send Reset Link' : 'Sign In'}
                  </Show>
                </button>
                
                <div class="text-sm text-center">
                  <Show
                    when={!isForgotPassword()}
                    fallback={
                      <button type="button" onClick={() => {setIsForgotPassword(false); setErrorMsg(''); setSuccessMsg('');}} class="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
                        Back to login
                      </button>
                    }
                  >
                    <span class="text-white/70">Don't have an account? </span>
                    <A href="/register" class="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
                      Create an account
                    </A>
                  </Show>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
