const nextConfig = {
  experimental: {
    cacheComponents: true, // wajib untuk pakai 'use cache' directive
    cacheLife: {
      matches: {
        stale: 10,      // client boleh pakai cache stale sampai 10 detik
        revalidate: 10, // server refresh tiap 10 detik
        expire: 60,     // maksimal umur cache 60 detik
      },
      reference: {
        stale: 300,
        revalidate: 300,
        expire: 3600,
      },
    },
  },
}

export default nextConfig