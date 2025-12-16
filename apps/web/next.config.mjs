import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {  
  reactCompiler: true,
  
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.1.163',
    '192.168.1.163:3000',
  ],

  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;