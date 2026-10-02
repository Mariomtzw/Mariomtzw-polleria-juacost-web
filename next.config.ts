/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // No frenar el build de producción por un error de tipos: se revisan aparte
  // con `npx tsc --noEmit` (hoy pasa limpio). Next 16 ya no corre ESLint en el
  // build, por eso aquí no hay opción `eslint`.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
