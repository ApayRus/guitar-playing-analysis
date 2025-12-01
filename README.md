# GuitarNotebook

Приложение для анализа игры на гитаре с синхронизацией видео и табулатур.

## Возможности

- 📹 Синхронизация видео с табулатурами
- 🎸 Редактор гитарных позиций (PlayPosition)
- ⏱️ Отметки времени на видео
- 💾 Сохранение данных локально
- 🖥️ Десктопное приложение через Electron

## Запуск

### Веб-версия (разработка)

```bash
npm run dev
```

### Electron (разработка)

```bash
npm run electron:dev
```

Это запустит Vite dev server и Electron одновременно.

### Сборка для Electron

```bash
npm run electron:build
```

Собранные приложения будут в папке `release/`.

**Важно для Linux AppImage:** При первом запуске AppImage может потребоваться запуск с флагом `--no-sandbox`:

```bash
./GuitarNotebook-0.0.0.AppImage --no-sandbox
```

Или настройте систему для поддержки sandbox (рекомендуется для безопасности):

```bash
echo kernel.unprivileged_userns_clone=1 | sudo tee /etc/sysctl.d/00-local-userns.conf
sudo sysctl --system
```

## Структура проекта

- `src/` - исходный код React приложения
- `electron/` - код главного процесса Electron
- `dist/` - собранное веб-приложение
- `dist-electron/` - собранные файлы Electron
- `release/` - готовые установщики приложения

## Использование

### Выбор видеофайла (Electron)

В Electron-версии доступна кнопка 📁 для выбора видеофайла через нативный диалог. Выбранный файл сохраняется и загружается автоматически при следующем запуске.

### Веб-версия

В веб-версии используется файл `/video.mp4` из папки `public/`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
