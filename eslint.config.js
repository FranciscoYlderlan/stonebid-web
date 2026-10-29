import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'src/routes/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      pluginRouter.configs['flat/recommended'],
      pluginQuery.configs['flat/recommended'],
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    // Componentes do shadcn (CLI) e arquivos de rota exportam mais que componentes por design.
    files: ['src/components/ui/**', 'src/routes/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Gerado pela CLI do shadcn: não se edita à mão.
    files: ['src/hooks/use-mobile.ts'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
])
