import { createSignal, Show } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [birthdate, setBirthdate] = createSignal('');
  const [nationality, setNationality] = createSignal('');
  
  const [errorMsg, setErrorMsg] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const navigate = useNavigate();

  const handleRegister = async (e: Event) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password() !== confirmPassword()) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email(),
        password: password(),
        options: {
          data: {
            full_name: name(),
            birthdate: birthdate(),
            nationality: nationality(),
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // Successful registration
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left side - Dynamic Brand Identity */}
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 flex-col justify-center">
        {/* Animated Gradient Background Elements */}
        <div class="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90"></div>
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        
        {/* Abstract shapes */}
        <div class="absolute top-20 right-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute bottom-20 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        {/* Branding Content */}
        <div class="relative z-10 w-full max-w-lg px-12 text-white">
          <div class="backdrop-blur-xl bg-white/10 border border-white/20 p-10 rounded-3xl shadow-2xl">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 text-white mb-8 shadow-inner overflow-hidden border-2 border-white/30 backdrop-blur-md">
              <img src="/jemaw_logo_final_1785499200444.jpg" alt="Jemaw Logo" class="w-full h-full object-cover" />
            </div>
            <h1 class="text-4xl font-extrabold tracking-tight mb-4">
              Join the community.
            </h1>
            <p class="text-lg text-white/80 leading-relaxed">
              Create your account to start coordinating your groups, managing events, and connecting with friends seamlessly on Jemaw.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div class="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-16 xl:px-24 py-8">
        <div class="mx-auto w-full max-w-md">
          
          <div class="mb-8 lg:hidden flex justify-center">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl mb-2 overflow-hidden border border-gray-100 dark:border-gray-800">
              <img src="/jemaw_logo_final_1785499200444.jpg" alt="Jemaw Logo" class="w-full h-full object-cover" />
            </div>
          </div>

          <div class="mb-8 text-center lg:text-left">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Create an account</h2>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <A href="/login" class="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Sign in instead
              </A>
            </p>
          </div>

          <form onSubmit={handleRegister} class="space-y-4">
            <Show when={errorMsg()}>
              <div class="p-4 bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {errorMsg()}
              </div>
            </Show>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" for="name">
                Full Name
              </label>
              <div class="relative">
                <input
                  id="name"
                  type="text"
                  required
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  class="block w-full rounded-2xl border-0 py-3 pl-4 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" for="birthdate">
                  Date of Birth
                </label>
                <div class="relative">
                  <input
                    id="birthdate"
                    type="date"
                    required
                    value={birthdate()}
                    onInput={(e) => setBirthdate(e.currentTarget.value)}
                    class="block w-full rounded-2xl border-0 py-3 pl-4 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" for="nationality">
                  Nationality
                </label>
                <div class="relative">
                  <input
                    id="nationality"
                    type="text"
                    required
                    value={nationality()}
                    onInput={(e) => setNationality(e.currentTarget.value)}
                    class="block w-full rounded-2xl border-0 py-3 pl-4 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                    placeholder="e.g. American"
                  />
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" for="email">
                Email address
              </label>
              <div class="relative">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm14 2.207l-7 4.2-7-4.2V6h14v.207zM3 14v-5.793l7 4.2 7-4.2V14H3z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  class="block w-full rounded-2xl border-0 py-3 pl-11 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" for="password">
                Password
              </label>
              <div class="relative">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  class="block w-full rounded-2xl border-0 py-3 pl-11 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" for="confirmPassword">
                Confirm Password
              </label>
              <div class="relative">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword()}
                  onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                  class="block w-full rounded-2xl border-0 py-3 pl-11 pr-4 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                disabled={isLoading()}
                class="flex w-full justify-center rounded-2xl bg-indigo-600 px-3 py-3.5 text-sm font-semibold leading-6 text-white shadow-lg hover:bg-indigo-500 hover:shadow-indigo-500/30 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Show
                  when={!isLoading()}
                  fallback={
                    <div class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </div>
                  }
                >
                  Create Account
                </Show>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
