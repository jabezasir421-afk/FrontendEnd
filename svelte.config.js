import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $lib: 'src/lib',
      $components: 'src/lib/components',
      $api: 'src/lib/api',
      $types: 'src/lib/types',
      $stores: 'src/lib/stores',
      $schemas: 'src/lib/schemas'
    }
  }
};

export default config;
