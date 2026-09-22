// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

/**
 * Formatting is NOT checked here — `npm run format:check` owns that, so lint output
 * stays about real problems. `eslint-config-prettier` only switches off the ESLint
 * rules that would otherwise fight Prettier.
 */
module.exports = defineConfig([
  expoConfig,
  prettierConfig,

  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*'],
  },

  // Project-wide TypeScript rules. See AGENTS.md > Conventions.
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  /**
   * Architecture guardrail. See AGENTS.md > Architecture and data flow.
   *
   * The UI layer talks to repositories only. Repositories decide whether an answer
   * comes from dummy data, the API or local storage — that indirection is what lets
   * us swap dummy data for a real backend without touching a single screen, and it
   * is where the K1/K2/K3 offline behaviour will live.
   *
   * If you are here because this rule failed: do not add an eslint-disable. Add or
   * extend a repository in src/repositories/ and call that instead.
   */
  {
    files: ['src/screens/**', 'src/components/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Screens and components must not do network I/O. Use a repository in src/repositories/.',
        },
        {
          name: 'XMLHttpRequest',
          message:
            'Screens and components must not do network I/O. Use a repository in src/repositories/.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/services/**', '**/storage/**', '**/data/**'],
              message:
                'Screens and components must not reach a data source directly. Use a repository in src/repositories/.',
            },
          ],
          paths: [
            {
              name: '@react-native-async-storage/async-storage',
              message: 'Local storage belongs in src/storage/, behind a repository.',
            },
            {
              name: 'expo-sqlite',
              message: 'Local storage belongs in src/storage/, behind a repository.',
            },
          ],
        },
      ],
    },
  },
]);
