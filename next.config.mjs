/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @imgly/background-removal ships wasm + onnx assets it resolves at runtime.
  // Leaving it unbundled on the server side avoids webpack trying to inline them.
  serverExternalPackages: ['@imgly/background-removal'],
  async headers() {
    return [
      {
        // SharedArrayBuffer is required for the multi-threaded ONNX backend
        // used by background removal. Without these two headers the runtime
        // silently falls back to the (much slower) single-threaded path.
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },
};

export default nextConfig;
