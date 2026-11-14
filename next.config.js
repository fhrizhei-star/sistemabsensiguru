/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['framer-motion', 'lucide-react'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/user/index',
        destination: '/user',
        permanent: false,
      },
      {
        source: '/user/index.html',
        destination: '/user',
        permanent: false,
      },
      {
        source: '/admin/index',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/admin/index.html',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/user/kartu.html',
        destination: '/user/kartu',
        permanent: false,
      },
      {
        source: '/user/riwayat.html',
        destination: '/user/riwayat',
        permanent: false,
      },
      {
        source: '/user/izin.html',
        destination: '/user/izin',
        permanent: false,
      },
      {
        source: '/user/lkb.html',
        destination: '/user/lkb',
        permanent: false,
      },
      {
        source: '/admin/guru.html',
        destination: '/admin/guru',
        permanent: false,
      },
      {
        source: '/admin/jadwal.html',
        destination: '/admin/jadwal',
        permanent: false,
      },
      {
        source: '/admin/rekap.html',
        destination: '/admin/rekap',
        permanent: false,
      },
      {
        source: '/admin/izin.html',
        destination: '/admin/izin',
        permanent: false,
      },
      {
        source: '/admin/setting.html',
        destination: '/admin/setting',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
