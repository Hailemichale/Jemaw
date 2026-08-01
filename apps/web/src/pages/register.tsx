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
    <div class="flex min-h-screen relative overflow-hidden bg-slate-900 font-sans">
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
                Join the community.
              </h1>
              <p class="text-lg text-white/90 leading-relaxed drop-shadow">
                Create your account to start coordinating your groups, managing events, and connecting with friends seamlessly on Jemaw.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div class="flex w-full lg:w-1/2 flex-col justify-center px-8 sm:px-16 xl:px-24 py-12 bg-white/10 backdrop-blur-xl dark:bg-slate-900/40">
          <div class="mx-auto w-full max-w-md">
            
            <div class="mb-8 lg:hidden flex justify-center">
              <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl mb-2 overflow-hidden border border-white/30">
                <img src="/jemaw_logo_final_1785499200444.jpg" alt="Jemaw Logo" class="w-full h-full object-cover" />
              </div>
            </div>

            <div class="mb-8 text-center lg:text-left">
              <h2 class="text-3xl font-bold text-white drop-shadow-md tracking-tight">Create an account</h2>
              <p class="mt-2 text-sm text-white/80 drop-shadow">
                Already have an account?{' '}
                <A href="/login" class="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
                  Sign in instead
                </A>
              </p>
            </div>

            <form onSubmit={handleRegister} class="space-y-4">
              <Show when={errorMsg()}>
                <div class="p-4 bg-rose-900/40 border border-rose-500/30 rounded-2xl text-rose-200 text-sm font-medium animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
                  {errorMsg()}
                </div>
              </Show>

              <div>
                <label class="block text-sm font-semibold text-white/90 mb-1.5" for="name">
                  Full Name
                </label>
                <div class="relative">
                  <input
                    id="name"
                    type="text"
                    required
                    value={name()}
                    onInput={(e) => setName(e.currentTarget.value)}
                    class="block w-full rounded-2xl border border-white/20 py-3 pl-4 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/10 sm:text-sm sm:leading-6 backdrop-blur-md transition-all shadow-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-white/90 mb-1.5" for="birthdate">
                    Date of Birth
                  </label>
                  <div class="relative">
                    <input
                      id="birthdate"
                      type="date"
                      required
                      value={birthdate()}
                      onInput={(e) => setBirthdate(e.currentTarget.value)}
                      class="block w-full rounded-2xl border border-white/20 py-3 pl-4 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/10 sm:text-sm sm:leading-6 backdrop-blur-md transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-white/90 mb-1.5" for="nationality">
                    Nationality
                  </label>
                  <div class="relative">
                    <input
                      id="nationality"
                      type="text"
                      required
                      value={nationality()}
                      onInput={(e) => setNationality(e.currentTarget.value)}
                      class="block w-full rounded-2xl border border-white/20 py-3 pl-4 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/10 sm:text-sm sm:leading-6 backdrop-blur-md transition-all shadow-sm"
                      placeholder="e.g. American"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-white/90 mb-1.5" for="email">
                  Email address
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg class="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm14 2.207l-7 4.2-7-4.2V6h14v.207zM3 14v-5.793l7 4.2 7-4.2V14H3z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email()}
                    onInput={(e) => setEmail(e.currentTarget.value)}
                    class="block w-full rounded-2xl border border-white/20 py-3 pl-11 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/10 sm:text-sm sm:leading-6 backdrop-blur-md transition-all shadow-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-white/90 mb-1.5" for="password">
                  Password
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg class="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    class="block w-full rounded-2xl border border-white/20 py-3 pl-11 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/10 sm:text-sm sm:leading-6 backdrop-blur-md transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-white/90 mb-1.5" for="confirmPassword">
                  Confirm Password
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <svg class="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword()}
                    onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                    class="block w-full rounded-2xl border border-white/20 py-3 pl-11 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/10 sm:text-sm sm:leading-6 backdrop-blur-md transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  disabled={isLoading()}
                  class="flex w-full justify-center rounded-2xl bg-indigo-500/80 hover:bg-indigo-500 border border-indigo-400/50 backdrop-blur-md px-3 py-3.5 text-sm font-semibold leading-6 text-white shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
