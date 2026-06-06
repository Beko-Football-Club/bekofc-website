import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bekofc.com',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true, // /fr/ explicit, not bare /
      redirectToDefaultLocale: true,
    },
  },
  build: {
    format: 'directory',
  },
});
