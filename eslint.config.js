import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Disable rules that are too strict for this project
      '@typescript-eslint/no-explicit-any': 'off',           // Allow any type
      '@typescript-eslint/ban-ts-comment': 'off',            // Allow @ts-nocheck
      '@typescript-eslint/no-unused-vars': ['warn', {        // Warn instead of error for unused vars
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_|^err|^error',
      }],
      'react-hooks/exhaustive-deps': 'warn',                 // Warn instead of error
    },
  },
)
