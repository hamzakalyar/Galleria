export const config = {
  matcher: ['/admin.html', '/api/upload', '/api/delete'],
};

export default function middleware(request) {
  const authorizationHeader = request.headers.get('authorization');

  if (authorizationHeader) {
    const basicAuth = authorizationHeader.split(' ')[1];
    try {
      const [user, password] = atob(basicAuth).split(':');

      if (user === 'hamza' && password === '01hamza@') {
        // Return nothing to let the request continue normally
        return;
      }
    } catch (e) {
      // Ignore decoding errors and fall through to 401
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
