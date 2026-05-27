import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 개발 서버 포트 고정 (선택 사항)
    port: 5173,
    proxy: {
      // 프론트에서 /themes, /times, /reservations 로 시작하는 요청을
      // 타겟(8080)으로 전달하도록 설정합니다.
      '/themes': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/times': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/reservations': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/waitings': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
