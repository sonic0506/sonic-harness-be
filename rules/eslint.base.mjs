// 하네스 공통 ESLint 규칙. 프로젝트에서는 .sonic-harness-be/eslint.base.mjs로 들어가요.
// 설명과 예시는 harness.md에 있어요. 이 프로젝트만의 규칙은 프로젝트 eslint.config.mjs에 둬요.
import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const SRC = 'src/**/*.ts';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  { languageOptions: { globals: globals.node } },

  // 이름 규칙
  {
    files: [SRC],
    plugins: { 'check-file': checkFile },
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      // consistent-type-imports는 쓰지 않아요. 생성자 주입 타입을 import type으로 바꾸면
      // 데코레이터 메타데이터가 사라져 Nest DI가 실패해요.
      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.ts': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/': 'KEBAB_CASE' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        // 데코레이터는 const로도 만들어요: export const Public = () => SetMetadata(...)
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'variable',
          types: ['boolean'],
          modifiers: ['destructured'],
          format: null,
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'can'],
        },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
      ],
    },
  },

  // import 정렬과 TypeScript 세부
  {
    files: [SRC],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      // as는 쓰지 않아요(as const는 괜찮아요).
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
    },
  },
);
