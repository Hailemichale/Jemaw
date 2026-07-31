const fs = require('fs');
// Let's simulate what supabase ssr does.

const mockCookies = [
  {
    name: 'sb-faxmgbqzhwiwgsfqhzrw-auth-token',
    value: '{"access_token":"fake","refresh_token":"fake"}'
  }
];

function getSessionFromCookies(cookies) {
  // SSR logic is usually roughly:
  // find cookie. If not found, find chunked cookies.
  const name = 'sb-faxmgbqzhwiwgsfqhzrw-auth-token';
  const exact = cookies.find(c => c.name === name);
  if (exact) return exact.value;
  
  // check chunks
  let chunkedValue = '';
  let i = 0;
  while (true) {
    const chunk = cookies.find(c => c.name === `${name}.${i}`);
    if (!chunk) break;
    chunkedValue += chunk.value;
    i++;
  }
  return chunkedValue || null;
}

console.log(getSessionFromCookies(mockCookies));
