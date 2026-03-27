module.exports = {
  "*.{js,jsx,ts,tsx}": ["eslint --fix --no-warn-ignored", "prettier --write"],
  "**/*.ts?(x)": () => "npm run check-types",
  "*.{md,json}": ["prettier --write"],
};
