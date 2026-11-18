module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'plugin:eslint-comments/recommended',
    // Turns off the rules that only concern formatting; formatting itself is not enforced by lint
    'prettier',
  ],
  rules: {
    // Data from the API is typed loosely in many places: worth tightening, not a reason to fail
    '@typescript-eslint/no-explicit-any': 'off',
    // Dialogs and sheets close on a click outside them, and on Escape: keep these as reminders
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/media-has-caption': 'warn',
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/interactive-supports-focus': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/no-var-requires': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
}