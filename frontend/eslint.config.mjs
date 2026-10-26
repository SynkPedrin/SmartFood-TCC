import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
export default tseslint.config(
 { ignores:['.next/**','next-env.d.ts'] },
 js.configs.recommended,
 ...tseslint.configs.recommended,
 { files:['src/**/*.{ts,tsx}'], languageOptions:{globals:{...globals.browser,...globals.node}}, plugins:{'react-hooks':hooks}, rules:{...hooks.configs.recommended.rules,'@typescript-eslint/no-explicit-any':'warn','@typescript-eslint/no-unused-vars':['warn',{argsIgnorePattern:'^_'}],'no-undef':'off'} },
 { files:['*.mjs','*.js','tests/**/*.cjs'], languageOptions:{globals:globals.node} }
)
