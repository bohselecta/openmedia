import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "dist/**", "build/**", "dist-electron/**"],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;
