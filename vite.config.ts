import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // تأكد من أن هذا هو عنوان IP والمنفذ الفعلي للـ API الخلفي
        target: 'http://45.61.150.204:8000', 
        changeOrigin: true, // مهم لتغيير رأس Origin إلى عنوان الـ API المستهدف
        // لا نحتاج إلى 'rewrite' هنا لأن الـ API الخلفي يتوقع '/api' في المسار.
        // الطلب من React إلى '/api/min_gift' سيتم توجيهه مباشرة إلى 
        // 'http://45.61.150.204:8000/api/min_gift'
      },
    },
  },
});
