/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permetti al widget di chiamare da fitsolutions.it
  async headers() {
    return [
      {
        source: '/api/chat',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
