import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Vite 8.1+ (rolldown) has stricter ESM static analysis and fails to resolve
// `export * from ...` re-exports in @fluentui/react. This plugin replaces the
// wildcard re-export in the affected ThemeProvider index with an explicit named
// export so rolldown can resolve it correctly.
const fixFluentUiExports = {
  name: 'fix-fluentui-exports',
  transform(code: string, id: string) {
    if (id.includes('@fluentui/react') && id.includes('ThemeProvider/index.js')) {
      return code.replace(
        "export * from './makeStyles';",
        "export { makeStyles } from './makeStyles';"
      )
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [fixFluentUiExports, react()]
})
