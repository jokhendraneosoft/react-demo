# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

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

---

## Customize configuration

- **Login and Registration** — Users can register for a new account or log in to an existing one to securely access their personalized task dashboard. Authentication is handled via the backend API (JWT); the app can be adapted to use Firebase Authentication if required.
- **Session and redirect** — Once the user is logged in, authentication information is stored (e.g. in Redux/state and optionally persisted), and the user is redirected to the dashboard.
- **Protected routes** — Users can only access the dashboard and other protected pages if they are authenticated; otherwise they are redirected to the login page.
- **Invalid URLs** — A dedicated page is shown when the given route is incorrect or does not exist (404 / Not Found).
- **Dashboard**
  - Provides an overview of the user’s tasks with important statistics: total number of pending and completed tasks, and percentage completion.
  - Users can view and manage their tasks across different stages: **Backlog**, **To-Do**, **In Progress**, and **Done**. Each task can be edited, deleted, and moved between stages.
  - Drag-and-drop allows users to move tasks between columns representing different stages of the task lifecycle.
- **Elegant user interface** — The app has a clean, visually appealing design so users can interact comfortably. The layout is fully responsive, and Tailwind CSS is used for a modern look and feel with minimal effort.
- **Reusable components** — Throughout the app, reusable components such as modals, loading spinners, and toast notifications ensure consistent design and a smoother user experience.

With these features, the Task Management App helps users stay organized, track their progress, and keep their tasks on schedule. It is suitable for personal use or team collaboration and serves as a practical tool to manage tasks and monitor productivity.

---

## Key Features

1. **Reusable components** — The project uses a component-based architecture with reusable components (e.g. loading spinners, toast messages, dialog modals) to ensure code reusability and maintainability.
2. **Consistent design** — A consistent design language is maintained across the app, using Tailwind CSS for styling and reusable components for UI consistency.
3. **Dynamic and consistent route names** — Routes are defined via a central configuration (e.g. `ROUTE_NAMES` / `paths`) instead of hardcoded values, improving maintainability and scalability and avoiding future naming conflicts.

---

## Best Practices and Guidelines

4. **Maintain consistency** — Code and design should follow a consistent structure across the entire application (naming conventions, component structure, design elements).
5. **Avoid unnecessary console logs** — Use `console.log` only for debugging and remove such calls before committing to avoid cluttering the console in production.
6. **No unnecessary comments** — Avoid leaving unnecessary comments. Use comments sparingly and only to explain complex or non-intuitive logic.
7. **Use `@` to target the root directory for `src`** — In import statements, use the `@` alias to target the `src` folder (e.g. `@/components/Button`) to simplify paths and avoid brittle relative imports.
8. **Dynamically use route names** — Always use `ROUTE_NAMES` (or your route constants) instead of hardcoding paths so routes stay consistent and naming conflicts are avoided.
9. **Reusable components and utilities** — Where possible, create reusable components and utilities (e.g. data formatting, API calls) to reduce duplication and improve maintainability.

