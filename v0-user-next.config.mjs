/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/fordypningsprosjekt',
        destination: 'https://www.idi.ntnu.no/education/fordypningsprosjekt.php',
      },
    ];
  },
}

export default nextConfig

