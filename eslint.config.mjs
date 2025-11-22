import nextConfig from "eslint-config-next"

/**
 * ESLint flat configuration.
 *
 * `eslint-config-next` already bundles the recommended rules for React,
 * Next.js and TypeScript. We simply spread the presets and add our own
 * ignore list for build artifacts.
 */
const config = [
  ...nextConfig,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "dist/**", "coverage/**"],
  },
]

export default config
