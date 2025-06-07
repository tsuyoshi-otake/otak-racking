/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'custom-gray': 'rgb(49 55 66)',
        // 新しいホワイトモード用カラーパレット
        light: {
          'bg': {
            'primary': '#FAFBFC',      // メイン背景: わずかに青みがかったオフホワイト
            'secondary': '#F6F8FA',    // セカンダリ背景: より濃いオフホワイト
            'tertiary': '#FFFFFF',     // カード背景: 純白
            'hover': '#F0F3F6',        // ホバー時背景
            'active': '#E8ECF0',       // アクティブ時背景
          },
          'text': {
            'primary': '#1A202C',      // プライマリテキスト: 濃いグレー
            'secondary': '#4A5568',    // セカンダリテキスト: 中間グレー
            'tertiary': '#718096',     // 補助テキスト: 薄いグレー
          },
          'border': {
            'primary': '#E2E8F0',      // プライマリボーダー: 薄いグレー
            'secondary': '#CBD5E0',    // セカンダリボーダー: 中間グレー
            'hover': '#A0AEC0',        // ホバー時ボーダー
          },
          'accent': {
            'DEFAULT': '#3182CE',      // アクセントカラー: 青
            'hover': '#2C5282',        // アクセントホバー: 濃い青
          }
        }
      }
    },
  },
  plugins: [],
}