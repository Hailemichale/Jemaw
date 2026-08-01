import { createSignal, createEffect, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute(props: any) {
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(true);
  const [authenticated, setAuthenticated] = createSignal(false);

  createEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login', { replace: true });
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login', { replace: true });
      }
    });

    return () => authListener.subscription.unsubscribe();
  });

  return (
    <Show when={!loading() && authenticated()}>
      {props.children}
    </Show>
  );
}
