#!/usr/bin/env node
// sonic-harness-be: 원본 저장소의 rules/·templates*/를 NestJS 프로젝트에 적용하고 lock.json으로 버전을 관리해요.
// 판단이 필요한 일(충돌 합치기, 규칙 위반 해석, 승인)은 명령어(commands/*.md)에서 Claude가 해요.
//
//   node harness.mjs init                 원본 최신 규칙과 템플릿을 깔고 lock.json을 만들어요
//   node harness.mjs deps                 필요한 패키지와 npm scripts, nest-cli 플러그인을 설치해요
//   node harness.mjs common-codes         공통 코드 feature를 켜요: 템플릿, 패키지, app.module 연결, lock 기록
//   node harness.mjs feature <이름> [--plural <복수형>]  sample-item 뼈대로 새 feature를 만들어요
//   node harness.mjs status               버전, 원본의 새 변경, 프로젝트에서 고친 하네스 파일
//   node harness.mjs update [--apply]     최신 규칙 받기 계획(기본) / 적용
//   node harness.mjs add-templates <경로...> update가 알려 준 새 템플릿 중 고른 것을 복사
//   node harness.mjs template-merged <경로>  바뀐 템플릿을 프로젝트 파일에 합친 뒤 완료 처리
//   node harness.mjs resolve <파일>        충돌 파일을 합친 뒤 완료 처리
//   node harness.mjs check-diff           마지막 점검 뒤 받은 규칙 diff
//   node harness.mjs checked              점검을 끝냈다고 기록
//   node harness.mjs contribute-diff      프로젝트에서 고친 하네스 파일 diff
//   node harness.mjs contribute-start <브랜치> <파일...>
//   node harness.mjs contribute-finish <커밋 메시지>
//   node harness.mjs contribute-push <PR 제목> <PR 본문 파일>
//
// 환경 변수: SONIC_HARNESS_BE_ORIGIN(원본 git URL), SONIC_HARNESS_BE_HOME(원본 clone을 둘 폴더)
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN =
  process.env.SONIC_HARNESS_BE_ORIGIN ??
  'https://github.com/sonic0506/sonic-harness-be.git';
const HOME =
  process.env.SONIC_HARNESS_BE_HOME ?? join(homedir(), '.sonic-harness-be');
const CLONE = join(HOME, 'origin');
const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = process.cwd();
const DIR_NAME = '.sonic-harness-be';
const DIR = join(PROJECT, DIR_NAME);
const LOCK = join(DIR, 'lock.json');
const NOT_MANAGED = new Set(['CHANGELOG.md']); // rules/ 안이지만 프로젝트로 복사하지 않는 파일
const MIGRATIONS = 'src/infra/database/migrations/';

// major를 고정해요. 범위 없이 받으면 npm이 eslint peer 충돌을 내요.
const DEV_DEPS = [
  'eslint@10',
  '@eslint/js@10',
  'typescript-eslint@8',
  'eslint-plugin-boundaries@7',
  'eslint-plugin-check-file@3',
  'eslint-import-resolver-typescript@4',
  'eslint-plugin-simple-import-sort@14',
  '@eslint-community/eslint-plugin-eslint-comments@4',
  '@vitest/eslint-plugin@1',
  'globals@17',
  'prettier@3',
  '@commitlint/cli@21',
  '@commitlint/config-conventional@21',
  'husky@9',
  'lint-staged@17',
  'msw@2',
  'testcontainers@12',
  '@testcontainers/postgresql@12',
  'dependency-cruiser@18',
];
const DEPS = [
  '@nestjs/typeorm@12',
  'typeorm@1',
  'pg@8',
  '@nestjs/swagger@12',
  'class-validator',
  'class-transformer',
  'nestjs-cls@7',
  '@nestjs-cls/transactional@4',
  '@nestjs-cls/transactional-adapter-typeorm@2',
  'nestjs-pino@5',
  'pino-http@11',
  'helmet@8',
  '@nestjs/throttler@6',
  '@nestjs/terminus@12',
  '@nestjs/jwt@12',
  'zod@4',
];
const COMMON_CODES_DEPS = ['@nestjs/cache-manager@12', 'cache-manager@7'];
// Nest 12 기본 lint는 oxlint예요. 하네스는 ESLint로 검사해서 지워요.
const REPLACED_DEPS = ['oxlint', 'oxlint-tsgolint'];
const SCRIPTS = {
  lint: 'eslint .',
  format: 'prettier --write .',
  typecheck: 'tsc --noEmit',
  test: 'vitest run --passWithNoTests',
  'test:cov': 'vitest run --coverage --passWithNoTests',
  'test:e2e': 'nest build && vitest run --config ./vitest.config.e2e.ts',
  start: 'nest start --exec "node --env-file-if-exists=.env"',
  'start:dev': 'nest start --watch --exec "node --env-file-if-exists=.env"',
  'start:prod': 'node dist/main',
  typeorm:
    'node --env-file-if-exists=.env node_modules/typeorm/cli.js -d dist/infra/database/data-source.js',
  'migration:generate': 'nest build && npm run typeorm -- migration:generate',
  'migration:run': 'nest build && npm run typeorm -- migration:run',
  'migration:revert': 'nest build && npm run typeorm -- migration:revert',
  // migration을 모두 적용한 뒤 entity와 차이가 있으면 실패해요(CI).
  'migration:check':
    'nest build && npm run typeorm -- migration:run && npm run typeorm -- migration:generate src/infra/database/migrations/pending --check',
  openapi: 'nest build && node scripts/openapi.mjs',
  'openapi:check': 'nest build && node scripts/openapi.mjs --check',
  'lint:cycles': 'depcruise src --config .dependency-cruiser.cjs',
  prepare: 'husky',
};
const SWAGGER_PLUGIN = {
  name: '@nestjs/swagger',
  options: { introspectComments: true, classValidatorShim: true },
};
// nest new가 만드는 시작 파일. 아직 손대지 않은 프로젝트(app.service.ts가 Hello World)면
// 하네스 템플릿으로 바꾸고 예시 파일과 다른 lint·format 설정을 지워요.
const STARTER_REPLACE = [
  'README.md',
  'src/main.ts',
  'src/app.module.ts',
  'vitest.config.ts',
  'vitest.config.e2e.ts',
];
const STARTER_REMOVE = [
  'src/app.controller.ts',
  'src/app.controller.spec.ts',
  'src/app.service.ts',
  'test/app.e2e-spec.ts',
  '.oxlintrc.json',
  '.prettierrc',
];
// app.module.ts의 imports 배열 안 표시. feature·common-codes 모듈을 이 줄 앞에 더해요.
const MODULE_MARKER = '// feature 모듈은 여기에 더해요';

// git hook과 CI는 저장소에 하나라서, 모노레포 앱(저장소 루트가 아닌 폴더)에는 두지 않고 루트에 둬요.
// lint-staged.config.mjs는 앱에 둬요(lint-staged가 파일마다 가장 가까운 설정을 써요).
const isRootOnly = (p) =>
  p.startsWith('.husky/') ||
  p.startsWith('.github/') ||
  p === 'commitlint.config.mjs';
const ROOT_ONLY_NOTE =
  '  git 저장소 루트가 아니에요(모노레포 앱). .husky/, commitlint.config.mjs, .github/는 저장소 루트에 두세요:\n' +
  '    루트 package.json에 husky·@commitlint/cli·lint-staged와 scripts.prepare=husky,\n' +
  '    .husky/pre-commit은 npx lint-staged, commit-msg는 npx --no -- commitlint --edit "$1",\n' +
  '    CI는 루트에서 npm ci 뒤 이 앱 폴더에서 lint·test·openapi:check를 돌려요.';
// null: git 저장소가 아님, true: 저장소 루트, false: 저장소 안의 하위 폴더(모노레포 앱)
function isGitRoot() {
  const r = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: PROJECT,
    encoding: 'utf8',
  });
  if (r.status !== 0) return null;
  return realpathSync(r.stdout.trim()) === realpathSync(PROJECT);
}

// ---------- 작은 도구 ----------
const git = (...args) =>
  execFileSync('git', ['-C', CLONE, ...args], { encoding: 'utf8' }).trim();
const sha = (text) => createHash('sha256').update(text).digest('hex');
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};
const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null);
const write = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const readJson = (path) => JSON.parse(read(path) ?? fail(`${path}가 없어요.`));
const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const run = (command, args, options = {}) =>
  spawnSync(command, args, { cwd: PROJECT, stdio: 'inherit', ...options });
// lock.json과 인자는 손으로 바뀔 수 있어서 쓰기 전에 확인해요: 파일 이름은 rules/ 바로 아래 이름만,
// ref는 40자리 커밋 sha만(경로 밖으로 나가거나 git 옵션으로 읽히지 않게).
const safeName = (f) =>
  /^[A-Za-z0-9._-]+$/.test(f) && !f.includes('..')
    ? f
    : fail(`하네스 파일 이름이 올바르지 않아요: ${f}`);
// 템플릿 경로(src/common/auth/roles.ts 같은 프로젝트 기준 상대 경로)
const safePath = (p) =>
  /^[A-Za-z0-9._-][A-Za-z0-9._/-]*$/.test(p) && !p.includes('..')
    ? p
    : fail(`템플릿 경로가 올바르지 않아요: ${p}`);
// 공백은 빼고 비교해요(프로젝트 Prettier가 줄바꿈만 바꾼 경우는 '안 고침'으로 봐요).
const squash = (text) => (text ?? '').replace(/\s+/g, '');
const safeRef = (ref) =>
  /^[0-9a-f]{40}$/.test(ref)
    ? ref
    : fail(`lock.json의 버전이 올바르지 않아요: ${ref}`);
function readLock() {
  if (!existsSync(LOCK)) return null;
  const lock = JSON.parse(readFileSync(LOCK, 'utf8'));
  safeRef(lock.ref);
  safeRef(lock.checkedRef);
  Object.keys(lock.files).forEach(safeName);
  lock.pending.forEach(safeName);
  Object.values(lock.contributing ?? {}).forEach((c) => {
    c.files.forEach(safeName);
    (c.templates ?? []).forEach(safePath);
  });
  return lock;
}
const writeLock = (lock) =>
  writeJson(LOCK, { ...lock, updatedAt: new Date().toISOString() });
const needLock = () =>
  readLock() ??
  fail(
    '이 프로젝트에 하네스가 없어요. /sonic-harness-be:init을 먼저 실행하세요.',
  );

// 원본 clone을 만들거나 최신으로 받아요. 반환: 원본 기본 브랜치의 최신 커밋
function syncOrigin() {
  if (!existsSync(join(CLONE, '.git'))) {
    mkdirSync(HOME, { recursive: true });
    execFileSync('git', ['clone', '--quiet', ORIGIN, CLONE], {
      stdio: 'inherit',
    });
  } else {
    git('fetch', '--quiet', 'origin');
  }
  return safeRef(git('rev-parse', `origin/${defaultBranch()}`));
}
const defaultBranch = () =>
  git('symbolic-ref', '--short', 'refs/remotes/origin/HEAD').replace(
    'origin/',
    '',
  );
const listAt = (ref, dir) =>
  git('ls-tree', '-r', '--name-only', ref, `${dir}/`)
    .split('\n')
    .filter(Boolean)
    .map((p) => p.slice(dir.length + 1));
const showAt = (ref, path) => {
  try {
    return execFileSync('git', ['-C', CLONE, 'show', `${ref}:${path}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
};
const managedAt = (ref) =>
  listAt(ref, 'rules')
    .filter((f) => !NOT_MANAGED.has(f))
    .map(safeName);
const newCommits = (from, to) =>
  git(
    'log',
    '--oneline',
    `${from}..${to}`,
    '--',
    'rules',
    'templates',
    'templates.feature',
    'templates.feature-service',
    'templates.common-codes',
  );
// 공통 templates/ 위에 공통 코드를 켜면 templates.common-codes/를 겹쳐요. 같은 경로면 겹친 파일이 이겨요.
// migration은 적용한 뒤 바꾸지 않는 파일이라 update 대상에서 빼요(common-codes가 한 번만 복사해요).
// 반환: Map<프로젝트 경로, 원본 경로>
const templatesAt = (ref, commonCodes) => {
  const map = new Map(
    listAt(ref, 'templates').map((p) => [p, `templates/${p}`]),
  );
  if (commonCodes)
    for (const p of listAt(ref, 'templates.common-codes'))
      map.set(p, `templates.common-codes/${p}`);
  for (const p of map.keys()) if (p.startsWith(MIGRATIONS)) map.delete(p);
  return map;
};

const packageJson = () =>
  JSON.parse(
    read(join(PROJECT, 'package.json')) ??
      fail('package.json이 없어요. 프로젝트 루트에서 실행하세요.'),
  );
const installed = () => {
  const pkg = packageJson();
  return { ...pkg.dependencies, ...pkg.devDependencies };
};
// 'x.y.z' 비교: 원본 플러그인이 더 새것일 때만 업데이트를 알려요.
const isNewer = (a, b = '0') => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  const i = x.findIndex((n, k) => n !== (y[k] ?? 0));
  return i >= 0 && x[i] > (y[i] ?? 0);
};
const specName = (spec) => spec.replace(/(.)@[^@/]+$/, '$1'); // '@a/b@5' → '@a/b'

// 모노레포 앱이면 git hook 패키지는 루트에 둬요(앱에 설치하거나 없다고 권하지 않아요).
const ROOT_ONLY_DEPS = [
  '@commitlint/cli',
  '@commitlint/config-conventional',
  'husky',
  'lint-staged',
];
const devDeps = () =>
  isGitRoot() === false
    ? DEV_DEPS.filter((spec) => !ROOT_ONLY_DEPS.includes(specName(spec)))
    : DEV_DEPS;

// 하네스가 쓰는 패키지 중 package.json에 없는 것. 규칙이 새 ESLint 플러그인을 쓰게 되면 update가 알려 줘요.
function missingPackages(commonCodes) {
  const all = installed();
  const missing = (list) => list.filter((spec) => !(specName(spec) in all));
  return {
    dev: missing(devDeps()),
    prod: missing([...DEPS, ...(commonCodes ? COMMON_CODES_DEPS : [])]),
  };
}

function needNest() {
  if (!('@nestjs/core' in installed()))
    fail('NestJS 프로젝트가 아니에요(package.json에 @nestjs/core가 없어요).');
}

// 프로젝트 파일에 없는 줄만 끝에 덧붙여요(.gitignore처럼 줄 단위로 합칠 수 있는 파일). 반환: 덧붙였는지
function appendMissingLines(path, template) {
  const text = read(path) ?? '';
  // '/dist'와 'dist/'는 'dist'와 같은 줄로 봐요.
  const key = (l) => l.trim().replace(/^\//, '').replace(/\/$/, '');
  const have = new Set(text.split('\n').map(key));
  const missing = template
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !have.has(key(l)));
  if (!missing.length) return false;
  const sep = text.endsWith('\n') || !text ? '' : '\n';
  writeFileSync(
    path,
    `${text}${sep}\n# sonic-harness-be\n${missing.join('\n')}\n`,
  );
  return true;
}

// app.module.ts의 표시 줄 앞에 모듈을 더하고 import 순서는 eslint --fix가 맞춰요.
function registerModule(moduleName, importPath) {
  const path = join(PROJECT, 'src/app.module.ts');
  const text = read(path) ?? '';
  if (text.includes(`${moduleName},`)) return true;
  if (!text.includes(MODULE_MARKER)) return false;
  const lastImport = [...text.matchAll(/^import [^;]+;$/gms)].at(-1);
  const at = lastImport.index + lastImport[0].length;
  const withImport = `${text.slice(0, at)}\nimport { ${moduleName} } from '${importPath}';${text.slice(at)}`;
  writeFileSync(
    path,
    withImport.replace(
      new RegExp(`^(\\s*)${MODULE_MARKER}`, 'm'),
      `$1${moduleName},\n$1${MODULE_MARKER}`,
    ),
  );
  run('npx', ['eslint', '--fix', 'src/app.module.ts'], { stdio: 'ignore' });
  return true;
}

// ---------- 명령 ----------
const commands = {
  init() {
    if (readLock())
      fail(
        '이미 하네스가 있어요. 최신으로 받으려면 /sonic-harness-be:update를 쓰세요.',
      );
    needNest();
    const ref = syncOrigin();
    const files = {};
    for (const f of managedAt(ref)) {
      const text = showAt(ref, `rules/${f}`);
      write(join(DIR, f), text);
      files[f] = sha(text);
    }
    const isStarter = (
      read(join(PROJECT, 'src/app.service.ts')) ?? ''
    ).includes('Hello World!');
    const copied = [];
    const skipped = [];
    const replaced = [];
    const merged = [];
    const monorepoApp = isGitRoot() === false;
    for (const [f, src] of templatesAt(ref, false)) {
      const dest = join(PROJECT, f);
      if (monorepoApp && isRootOnly(f)) continue;
      if (f === '.gitignore' && existsSync(dest)) {
        if (appendMissingLines(dest, showAt(ref, src))) merged.push(f);
        continue;
      }
      if (existsSync(dest) && !(isStarter && STARTER_REPLACE.includes(f))) {
        skipped.push(f);
        continue;
      }
      (existsSync(dest) ? replaced : copied).push(f);
      write(dest, showAt(ref, src));
    }
    const removed = isStarter
      ? STARTER_REMOVE.filter((f) => existsSync(join(PROJECT, f)))
      : [];
    for (const f of removed) unlinkSync(join(PROJECT, f));
    // tsconfig: strict 묶음을 extends하고, 그 값을 덮어쓰는 nest new 기본값(strict, strictPropertyInitialization)은 빼요.
    const tsPath = join(PROJECT, 'tsconfig.json');
    const ts = readJson(tsPath);
    delete ts.compilerOptions?.strict;
    delete ts.compilerOptions?.strictPropertyInitialization;
    // @/ 별칭은 strict 묶음에도 있지만 ${configDir}를 못 읽는 도구(dependency-cruiser)가 있어 프로젝트에도 적어요.
    ts.compilerOptions = {
      ...ts.compilerOptions,
      paths: { '@/*': ['./src/*'] },
    };
    writeJson(tsPath, {
      ...ts,
      extends: `./${DIR_NAME}/tsconfig.strict.json`,
    });
    // CI lint job이 prettier --check를 해요. 고친 tsconfig를 프로젝트 형식으로 맞춰요.
    run('npx', ['prettier', '--write', 'tsconfig.json'], { stdio: 'ignore' });
    writeLock({
      origin: ORIGIN,
      ref,
      checkedRef: ref,
      files,
      pending: [],
      commonCodes: false, // common-codes 명령이 true로 바꿔요
      templates: [...templatesAt(ref, false).keys()], // 이미 본 템플릿. update는 이 밖의 새 템플릿만 알려 줘요
    });
    console.log(`✓ 하네스 ${ref.slice(0, 7)}를 적용했어요.`);
    console.log(`  ${DIR_NAME}/: ${Object.keys(files).join(', ')}`);
    console.log(`  복사한 템플릿: ${copied.join(', ') || '없음'}`);
    if (isStarter) {
      console.log(
        `  nest new 시작 파일을 템플릿으로 바꿨어요: ${replaced.join(', ') || '없음'}`,
      );
      console.log(
        `  nest new 예시 파일을 지웠어요: ${removed.join(', ') || '없음'}`,
      );
    }
    if (merged.length)
      console.log(`  없는 줄만 덧붙인 템플릿: ${merged.join(', ')}`);
    console.log(`  이미 있어서 건너뛴 템플릿: ${skipped.join(', ') || '없음'}`);
    if (monorepoApp) console.log(ROOT_ONLY_NOTE);
  },

  deps() {
    needNest();
    const lock = needLock();
    const npm = (...args) => {
      if (run('npm', args).status !== 0) fail(`npm ${args.join(' ')} 실패`);
    };
    const old = REPLACED_DEPS.filter((name) => name in installed());
    if (old.length) npm('rm', ...old);
    npm('i', '-D', ...devDeps());
    npm('i', ...DEPS, ...(lock.commonCodes ? COMMON_CODES_DEPS : []));
    // 모노레포 앱이면 husky는 루트 prepare가 맡아요.
    const gitRoot = isGitRoot();
    npm(
      'pkg',
      'set',
      ...Object.entries(SCRIPTS)
        .filter(([name]) => gitRoot !== false || name !== 'prepare')
        .map(([name, cmd]) => `scripts.${name}=${cmd}`),
    );
    // Swagger 문서는 Nest CLI 플러그인이 DTO와 JSDoc 주석으로 만들어요.
    const nestCliPath = join(PROJECT, 'nest-cli.json');
    const nestCli = read(nestCliPath) ? readJson(nestCliPath) : {};
    nestCli.compilerOptions ??= {};
    const plugins = (nestCli.compilerOptions.plugins ?? []).filter(
      (p) => (typeof p === 'string' ? p : p.name) !== SWAGGER_PLUGIN.name,
    );
    nestCli.compilerOptions.plugins = [...plugins, SWAGGER_PLUGIN];
    writeJson(nestCliPath, nestCli);
    // 고친 JSON을 프로젝트 Prettier 형식으로 맞춰요(CI lint job의 prettier --check).
    run(
      'npx',
      ['prettier', '--write', 'package.json', 'nest-cli.json', 'tsconfig.json'],
      {
        stdio: 'ignore',
      },
    );
    if (gitRoot) run('npx', ['husky'], { stdio: 'ignore' });
    else if (gitRoot === false) console.log(ROOT_ONLY_NOTE);
    else
      console.log(
        '  git 저장소가 아니라 husky는 건너뛰었어요. git init 후 npx husky를 실행하세요.',
      );
    if (old.length) console.log(`  지운 패키지: ${old.join(', ')}`);
    console.log('✓ 패키지, scripts, nest-cli Swagger 플러그인을 설치했어요.');
  },

  // 공통 코드 feature를 켜요. 이미 있는 파일은 기본 템플릿 그대로일 때만 바꿔요(프로젝트에서 고친 파일은 남겨요).
  'common-codes'() {
    const lock = needLock();
    syncOrigin();
    const base = templatesAt(lock.ref, false);
    const migrationDir = join(PROJECT, MIGRATIONS);
    const existingMigrations = existsSync(migrationDir)
      ? readdirSync(migrationDir)
      : [];
    const copied = [];
    const skipped = [];
    for (const p of listAt(lock.ref, 'templates.common-codes')) {
      const text = showAt(lock.ref, `templates.common-codes/${p}`);
      if (p.startsWith(MIGRATIONS)) {
        // 이미 넣었으면 건너뛰고, 처음이면 지금 시각으로 이름을 바꿔 프로젝트 migration 뒤에 오게 해요.
        const suffix = p.replace(/^.*\/\d+-/, '-');
        if (existingMigrations.some((f) => f.endsWith(suffix))) {
          skipped.push(p);
          continue;
        }
        const now = String(Date.now());
        const dest = p.replace(/\/\d+-/, `/${now}-`);
        write(join(PROJECT, dest), text.replaceAll(/\d{13}/g, now));
        copied.push(dest);
        continue;
      }
      const local = read(join(PROJECT, p));
      const baseText = base.has(p) ? showAt(lock.ref, base.get(p)) : null;
      if (local !== null && squash(local) !== squash(baseText)) {
        skipped.push(p);
        continue;
      }
      write(join(PROJECT, p), text);
      copied.push(p);
    }
    if (run('npm', ['i', ...COMMON_CODES_DEPS]).status !== 0)
      fail(`npm i ${COMMON_CODES_DEPS.join(' ')} 실패`);
    const isRegistered = registerModule(
      'CommonCodesModule',
      './modules/common-codes/index.js',
    );
    writeLock({
      ...lock,
      commonCodes: true,
      templates: [...templatesAt(lock.ref, true).keys()],
    });
    console.log('✓ 공통 코드 feature를 켰어요.');
    console.log(`  복사: ${copied.join(', ') || '없음'}`);
    console.log(
      `  이미 있거나 프로젝트에서 고친 파일이라 건너뜀(직접 합쳐요): ${skipped.join(', ') || '없음'}`,
    );
    console.log(`  설치: ${COMMON_CODES_DEPS.join(', ')}`);
    if (!isRegistered)
      console.log(
        '  직접 할 일: src/app.module.ts의 imports에 CommonCodesModule(./modules/common-codes/index.js)을 더해요',
      );
  },

  // sample-item 뼈대를 새 이름으로 바꿔 만들어요.
  // ponytail: 복수형은 단순 규칙(y→ies, s/x/ch/sh→es, 나머지 s)이에요. 불규칙(person)은 --plural로 줘요.
  feature(name, ...options) {
    const lock = needLock();
    const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
    if (!KEBAB.test(name ?? ''))
      fail(
        '사용법: feature <kebab-case 단수 이름> [--plural <복수형>] [--no-entity]  예: feature order-item',
      );
    const pluralAt = options.indexOf('--plural');
    // --no-entity: DB 테이블 없이 controller·service만(다른 feature를 조합하는 로그인 같은 기능)
    const isNoEntity = options.includes('--no-entity');
    const source = isNoEntity
      ? 'templates.feature-service'
      : 'templates.feature';
    const plural =
      pluralAt >= 0 && options[pluralAt + 1]
        ? options[pluralAt + 1]
        : `${name.replace(/([^aeiou])y$/, '$1ie').replace(/(s|x|ch|sh)$/, '$1e')}s`;
    if (!KEBAB.test(plural)) fail(`복수형이 kebab-case가 아니에요: ${plural}`);
    const dir = `src/modules/${name}`;
    if (existsSync(join(PROJECT, dir))) fail(`${dir}가 이미 있어요.`);
    syncOrigin();
    const pascal = name
      .split('-')
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join('');
    const camel = pascal[0].toLowerCase() + pascal.slice(1);
    const table = plural.replaceAll('-', '_');
    const replacements = [
      ['sample-items', plural],
      ['sample_items', table],
      ['SAMPLE_ITEM', name.replaceAll('-', '_').toUpperCase()],
      ['SampleItem', pascal],
      ['sampleItem', camel],
      ['sample-item', name],
    ];
    const rename = (text) =>
      replacements.reduce((t, [from, to]) => t.replaceAll(from, to), text);
    const files = listAt(lock.ref, source).map((p) => [p, rename(p)]);
    if (!files.length)
      fail(
        `이 프로젝트의 하네스 버전에 ${source}가 없어요. /sonic-harness-be:update로 먼저 받으세요.`,
      );
    for (const [, dest] of files)
      if (existsSync(join(PROJECT, dest))) fail(`${dest}가 이미 있어요.`);
    for (const [p, dest] of files)
      write(join(PROJECT, dest), rename(showAt(lock.ref, `${source}/${p}`)));
    // 이름이 바뀌면 줄 길이와 import 정렬 순서도 바뀌어요(sample-item → category).
    const created = files
      .map(([, dest]) => dest)
      .filter((f) => f.endsWith('.ts'));
    run('npx', ['prettier', '--write', ...created], { stdio: 'ignore' });
    run('npx', ['eslint', '--fix', ...created], { stdio: 'ignore' });
    const isRegistered = registerModule(
      `${pascal}Module`,
      `./modules/${name}/index.js`,
    );
    console.log(
      `✓ ${name} feature를 만들었어요 (경로 /v1/${plural}${isNoEntity ? '' : `, 테이블 ${table}`}).`,
    );
    console.log(files.map(([, dest]) => `  ${dest}`).join('\n'));
    console.log(
      isRegistered
        ? `  src/app.module.ts에 ${pascal}Module을 더했어요.`
        : `  직접 할 일: src/app.module.ts의 imports에 ${pascal}Module(./modules/${name}/index.js)을 더해요`,
    );
    console.log(
      isNoEntity
        ? '  다음: dto와 service를 채우고, 다른 feature는 그 index.ts의 service로 불러요.'
        : `  다음: entity를 정한 뒤 npm run migration:generate -- ${MIGRATIONS}add-${plural}`,
    );
  },

  status() {
    const lock = needLock();
    const latest = syncOrigin();
    console.log(`원본: ${lock.origin}`);
    console.log(`적용 버전: ${lock.ref.slice(0, 7)} (${lock.updatedAt})`);
    console.log(
      lock.commonCodes
        ? '공통 코드: 사용'
        : '공통 코드: 사용 안 함 (켜려면 /sonic-harness-be:init common-codes)',
    );
    const log = newCommits(lock.ref, latest);
    console.log(
      log
        ? `원본의 새 변경 (update로 받을 수 있어요):\n${log.replace(/^/gm, '  ')}`
        : '원본의 새 변경: 없음 (최신)',
    );
    const changed = Object.entries(lock.files).filter(
      ([f, h]) => sha(read(join(DIR, f)) ?? '') !== h,
    );
    const prOf = (f) =>
      Object.values(lock.contributing ?? {}).find((c) => c.files.includes(f))
        ?.pr ?? null;
    const describe = ([f]) =>
      `  ${f}${prOf(f) ? ` (PR 진행 중: ${prOf(f)})` : ' (아직 올리지 않음)'}`;
    console.log(
      changed.length
        ? `프로젝트에서 고친 하네스 파일:\n${changed.map(describe).join('\n')}`
        : '프로젝트에서 고친 하네스 파일: 없음',
    );
    if (lock.pending.length)
      console.log(
        `합치는 중인 파일: ${lock.pending.join(', ')} (resolve 필요)`,
      );
    if (lock.templateMerges?.length)
      console.log(
        `합치는 중인 템플릿: ${lock.templateMerges.join(', ')} (template-merged 필요)`,
      );
    if (lock.checkedRef !== lock.ref)
      console.log(
        '받았지만 아직 점검하지 않은 규칙 변경이 있어요 (/sonic-harness-be:check).',
      );
    const here = JSON.parse(
      read(join(PLUGIN_ROOT, '.claude-plugin/plugin.json')) ?? '{}',
    ).version;
    const there = JSON.parse(
      showAt(latest, 'plugin/.claude-plugin/plugin.json') ?? '{}',
    ).version;
    console.log(
      `플러그인: ${here ?? '?'}${there && isNewer(there, here) ? ` → ${there} 있음 (/plugin에서 sonic-harness-be 업데이트)` : ' (최신)'}`,
    );
  },

  update(flag) {
    const lock = needLock();
    if (lock.pending.length)
      fail(
        `합치는 중인 파일이 있어요: ${lock.pending.join(', ')}. 먼저 resolve하세요.`,
      );
    const latest = syncOrigin();
    const plan = [];
    for (const f of new Set([
      ...managedAt(latest),
      ...Object.keys(lock.files),
    ])) {
      const incoming = showAt(latest, `rules/${f}`);
      const local = read(join(DIR, f));
      const base = lock.files[f];
      if (incoming === null) plan.push({ f, action: 'removed-upstream' });
      else if (base === undefined)
        plan.push({ f, action: local === null ? 'add' : 'conflict' });
      else if (sha(incoming) === base) plan.push({ f, action: 'up-to-date' });
      else if (local !== null && sha(local) === sha(incoming))
        plan.push({ f, action: 'same' });
      else if (local === null || sha(local) === base)
        plan.push({ f, action: 'overwrite' });
      else plan.push({ f, action: 'conflict' });
    }
    const label = {
      'up-to-date': '최신',
      same: '이미 같음',
      overwrite: '갱신',
      add: '새 파일',
      conflict: '충돌 (프로젝트와 원본이 둘 다 고침)',
      'removed-upstream': '원본에서 삭제됨 (그대로 둠)',
    };
    console.log(`${lock.ref.slice(0, 7)} → ${latest.slice(0, 7)}`);
    for (const { f, action } of plan) console.log(`  ${label[action]}: ${f}`);
    // 원본에 새로 생긴 템플릿 중 프로젝트에 없는 것. 이미 본(거절한) 템플릿은 다시 묻지 않아요.
    const { commonCodes } = lock;
    const seen = new Set(
      lock.templates ?? templatesAt(lock.ref, commonCodes).keys(),
    );
    const newTemplates = [...templatesAt(latest, commonCodes).keys()].filter(
      (p) => !seen.has(p) && !existsSync(join(PROJECT, p)),
    );
    // 원본에서 바뀐 템플릿 중 프로젝트에 있는 것. 안 고쳤으면 새 원본으로 바꾸고, 고쳤으면 합치기를 요청해요.
    const oldTemplates = templatesAt(lock.ref, commonCodes);
    const changedTemplates = [...templatesAt(latest, commonCodes)]
      .filter(([p]) => oldTemplates.has(p) && existsSync(join(PROJECT, p)))
      .map(([p, src]) => ({
        p,
        from: oldTemplates.get(p),
        to: src,
        before: showAt(lock.ref, oldTemplates.get(p)),
        after: showAt(latest, src),
        local: read(join(PROJECT, p)),
      }))
      .filter((t) => squash(t.before) !== squash(t.after))
      .map((t) => ({
        ...t,
        state:
          squash(t.local) === squash(t.after)
            ? 'same'
            : squash(t.local) === squash(t.before)
              ? 'clean'
              : 'modified',
      }));
    const templateLabel = {
      same: '이미 같음',
      clean: '갱신 (프로젝트에서 안 고침)',
      modified: '합치기 필요 (프로젝트에서도 고침)',
    };
    // 바뀌거나 새로 받을 템플릿이 import하는 새 템플릿은 빼면 빌드가 깨져서 '필수'로 표시해요.
    const required = new Map();
    const incoming = [
      ...changedTemplates
        .filter((t) => t.state !== 'same')
        .map((t) => [t.p, t.after]),
      ...newTemplates.map((p) => [
        p,
        showAt(latest, templatesAt(latest, commonCodes).get(p)),
      ]),
    ];
    for (const [from, text] of incoming)
      for (const [, spec] of (text ?? '').matchAll(
        /from '(@\/[^']+|\.[^']*)'/g,
      )) {
        const target = (
          spec.startsWith('@/')
            ? `src/${spec.slice(2)}`
            : posix.join(posix.dirname(from), spec)
        ).replace(/\.js$/, '');
        for (const p of newTemplates)
          if (
            p !== from &&
            [`${target}.ts`, `${target}/`].some((b) => p.startsWith(b)) &&
            !required.has(p)
          )
            required.set(p, from);
      }
    if (newTemplates.length)
      console.log(
        `새 템플릿 (프로젝트에 없음, 고르면 add-templates로 복사해요):\n${newTemplates.map((p) => `  ${p}${required.has(p) ? ` (필수: ${required.get(p)}가 불러와요)` : ''}`).join('\n')}`,
      );
    if (changedTemplates.length)
      console.log(
        `원본에서 바뀐 템플릿:\n${changedTemplates.map((t) => `  ${templateLabel[t.state]}: ${t.p}`).join('\n')}`,
      );
    const { dev, prod } = missingPackages(commonCodes);
    if (dev.length || prod.length)
      console.log(
        `하네스가 쓰는데 프로젝트에 없는 패키지 (적용 뒤 설치해요):\n${[dev.length && `  npm i -D ${dev.join(' ')}`, prod.length && `  npm i ${prod.join(' ')}`].filter(Boolean).join('\n')}`,
      );
    const log = newCommits(lock.ref, latest);
    if (log) console.log(`변경 기록:\n${log.replace(/^/gm, '  ')}`);
    if (flag !== '--apply')
      return console.log('\n(계획만 보여 줬어요. 적용하려면 --apply)');
    lock.templates = [...templatesAt(latest, commonCodes).keys()];

    const pending = [];
    for (const { f, action } of plan) {
      const text = showAt(latest, `rules/${f}`);
      if (['overwrite', 'add', 'same'].includes(action)) {
        write(join(DIR, f), text);
        lock.files[f] = sha(text);
      } else if (action === 'conflict') {
        write(join(DIR, `${f}.incoming`), text);
        write(join(DIR, `${f}.base`), showAt(lock.ref, `rules/${f}`) ?? '');
        pending.push(f);
      }
    }
    // PR이 합쳐져 원본과 같아진 파일은 'PR 진행 중' 기록에서 지워요.
    const contributing = Object.fromEntries(
      Object.entries(lock.contributing ?? {}).filter(
        ([, c]) =>
          c.files.some(
            (f) => sha(read(join(DIR, f)) ?? '') !== lock.files[f],
          ) ||
          (c.templates ?? []).some(
            (p) =>
              squash(read(join(PROJECT, p))) !==
              squash(showAt(latest, templatesAt(latest, commonCodes).get(p))),
          ),
      ),
    );
    const templateMerges = new Set(lock.templateMerges ?? []);
    for (const t of changedTemplates) {
      if (t.state === 'clean') write(join(PROJECT, t.p), t.after);
      if (t.state !== 'modified') continue;
      templateMerges.add(t.p);
      console.log(`\n— ${t.p}: 원본에서 바뀐 내용 (프로젝트 파일에 합쳐요)`);
      console.log(
        git('diff', '--no-color', lock.ref, latest, '--', t.from, t.to),
      );
    }
    writeLock({
      ...lock,
      ref: latest,
      pending,
      contributing,
      templateMerges: [...templateMerges],
    });
    console.log(`\n✓ ${latest.slice(0, 7)}로 갱신했어요.`);
    if (templateMerges.size)
      console.log(
        `  합칠 템플릿 ${templateMerges.size}개: 위 diff를 프로젝트 파일에 반영한 뒤 template-merged <경로>`,
      );
    if (pending.length)
      console.log(
        `  충돌 ${pending.length}개: ${DIR_NAME}/<파일>(프로젝트), <파일>.base(이전 원본), <파일>.incoming(새 원본)을 합친 뒤 resolve <파일>`,
      );
  },

  'template-merged'(p) {
    const lock = needLock();
    if (!(lock.templateMerges ?? []).includes(p))
      fail(
        `${p}는 합치는 중인 템플릿이 아니에요. 대기 중: ${(lock.templateMerges ?? []).join(', ') || '없음'}`,
      );
    writeLock({
      ...lock,
      templateMerges: lock.templateMerges.filter((t) => t !== p),
    });
    console.log(`✓ ${p} 템플릿 합치기를 끝냈어요.`);
  },

  'add-templates'(...paths) {
    const lock = needLock();
    if (!paths.length) fail('사용법: add-templates <경로...>');
    syncOrigin();
    // 원본 템플릿 목록에 있는 경로만 받아요(경로 밖으로 나가지 않게).
    const available = templatesAt(lock.ref, lock.commonCodes);
    for (const p of paths) {
      if (!available.has(p)) fail(`원본 템플릿이 아니에요: ${p}`);
      if (existsSync(join(PROJECT, p))) {
        console.log(`  건너뜀(이미 있음): ${p}`);
        continue;
      }
      write(join(PROJECT, p), showAt(lock.ref, available.get(p)));
      console.log(`  복사: ${p}`);
    }
    console.log('✓ 템플릿을 복사했어요.');
  },

  resolve(f) {
    safeName(f ?? '');
    const lock = needLock();
    if (!lock.pending.includes(f))
      fail(
        `${f}는 합치는 중인 파일이 아니에요. 대기 중: ${lock.pending.join(', ') || '없음'}`,
      );
    // 기준은 새 원본이에요. 프로젝트에 남긴 차이는 '프로젝트에서 고친 파일'로 보여요.
    lock.files[f] = sha(read(join(DIR, `${f}.incoming`)));
    unlinkSync(join(DIR, `${f}.incoming`));
    unlinkSync(join(DIR, `${f}.base`));
    lock.pending = lock.pending.filter((p) => p !== f);
    writeLock(lock);
    console.log(
      `✓ ${f} 합치기를 끝냈어요.${lock.pending.length ? ` 남은 파일: ${lock.pending.join(', ')}` : ''}`,
    );
  },

  // update를 여러 번 해도 마지막 점검(checkedRef) 뒤 받은 변경을 모두 보여 줘요.
  'check-diff'() {
    const lock = needLock();
    syncOrigin();
    if (lock.checkedRef === lock.ref)
      return console.log('마지막 점검 뒤 받은 규칙 변경이 없어요.');
    const range = `${lock.checkedRef}..${lock.ref}`;
    console.log(
      `점검할 규칙 변경: ${lock.checkedRef.slice(0, 7)} → ${lock.ref.slice(0, 7)}\n`,
    );
    console.log(git('log', '--format=- %s', range, '--', 'rules'));
    console.log(git('diff', range, '--', 'rules'));
  },

  checked() {
    const lock = needLock();
    writeLock({ ...lock, checkedRef: lock.ref });
    console.log(`✓ ${lock.ref.slice(0, 7)}까지 점검했다고 기록했어요.`);
  },

  'contribute-diff'() {
    const lock = needLock();
    syncOrigin();
    const main = `origin/${defaultBranch()}`;
    let found = false;
    const show = (src, base, local, label) => {
      found = true;
      const tmp = join(HOME, 'tmp', src);
      write(tmp, base);
      const r = spawnSync(
        'git',
        ['diff', '--no-index', '--no-color', tmp, local],
        { encoding: 'utf8' },
      );
      console.log(
        r.stdout
          .replaceAll(tmp, `/원본/${src}`)
          .replaceAll(local, `/프로젝트/${label}`),
      );
      if (showAt(main, src) !== base)
        console.log(
          `⚠ ${label}는 원본에서도 바뀌었어요. 먼저 /sonic-harness-be:update로 받으세요.\n`,
        );
    };
    for (const [f, h] of Object.entries(lock.files)) {
      const local = join(DIR, f);
      if (sha(read(local) ?? '') !== h)
        show(`rules/${f}`, showAt(lock.ref, `rules/${f}`) ?? '', local, f);
    }
    // 템플릿은 프로젝트 파일이라 많이 고쳐요. 공통으로 쓸 만한 변경만 골라서 올려요.
    for (const [p, src] of templatesAt(lock.ref, lock.commonCodes)) {
      const local = join(PROJECT, p);
      const base = showAt(lock.ref, src) ?? '';
      if (existsSync(local) && squash(read(local)) !== squash(base))
        show(src, base, local, `${p} (템플릿)`);
    }
    if (!found) console.log('프로젝트에서 고친 하네스 파일이 없어요.');
  },

  'contribute-start'(branch, ...files) {
    const lock = needLock();
    if (!branch || !files.length)
      fail('사용법: contribute-start <브랜치> <파일...>');
    if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith('-'))
      fail(`브랜치 이름이 올바르지 않아요: ${branch}`);
    syncOrigin();
    const main = `origin/${defaultBranch()}`;
    if (git('status', '--porcelain'))
      fail(`원본 clone(${CLONE})에 커밋하지 않은 변경이 있어요.`);
    // 규칙 파일(.sonic-harness-be/<이름>)과 템플릿(프로젝트 기준 경로)을 함께 받아요.
    const available = templatesAt(lock.ref, lock.commonCodes);
    const moves = files.map((f) => {
      if (f in lock.files)
        return { f, src: `rules/${safeName(f)}`, local: join(DIR, f) };
      if (available.has(safePath(f)))
        return {
          f,
          src: available.get(f),
          local: join(PROJECT, f),
          isTemplate: true,
        };
      return fail(`${f}는 하네스 파일이나 템플릿이 아니에요.`);
    });
    for (const { f, src } of moves)
      if (showAt(main, src) !== showAt(lock.ref, src))
        fail(
          `${f}는 원본에서도 바뀌었어요. /sonic-harness-be:update로 먼저 받으세요.`,
        );
    // 프로젝트 파일을 먼저 같은 Prettier 설정으로 맞춰요. 그래야 PR이 합쳐진 뒤 update에서 '이미 같음'이 돼요.
    run('npx', ['prettier', '--write', ...moves.map((m) => m.local)], {
      stdio: 'ignore',
    });
    git('checkout', '--quiet', '-B', branch, main);
    for (const m of moves) write(join(CLONE, m.src), read(m.local));
    // status가 이 파일을 'PR 진행 중'으로 보여 주게 기록해요. update로 원본과 같아지면 지워져요.
    writeLock({
      ...lock,
      contributing: {
        ...lock.contributing,
        [branch]: {
          files: moves.filter((m) => !m.isTemplate).map((m) => m.f),
          templates: moves.filter((m) => m.isTemplate).map((m) => m.f),
        },
      },
    });
    console.log(
      `✓ 원본 clone에 ${branch} 브랜치를 만들고 ${moves.map((m) => m.src).join(', ')}를 옮겼어요.`,
    );
    console.log(`  원본 clone: ${CLONE}`);
    console.log(
      '  lint 규칙을 바꿨다면 tests/lint-samples에 bad/good 샘플을, rules/CHANGELOG.md에 한 줄을 추가하세요.',
    );
  },

  'contribute-finish'(message) {
    if (!message) fail('사용법: contribute-finish <커밋 메시지>');
    if (!existsSync(join(CLONE, 'node_modules')))
      spawnSync('npm', ['ci'], { cwd: CLONE, stdio: 'inherit' });
    // 프로젝트에서 넘어온 파일을 원본 형식에 맞추고, 원본 저장소 자체 lint도 통과해야 해요.
    spawnSync('npx', ['prettier', '--write', 'rules', 'tests', 'evals'], {
      cwd: CLONE,
      stdio: 'ignore',
    });
    // 템플릿은 templates*/의 prettier 설정을 못 읽어서 하네스 설정으로 따로 맞춰요.
    spawnSync('npm', ['run', 'format:templates'], {
      cwd: CLONE,
      stdio: 'ignore',
    });
    const lint = spawnSync('npx', ['eslint', '.'], {
      cwd: CLONE,
      encoding: 'utf8',
    });
    if (lint.status !== 0)
      fail(`원본 저장소 lint가 실패했어요.\n${lint.stdout}`);
    const test = spawnSync('npm', ['run', 'test:lint'], {
      cwd: CLONE,
      encoding: 'utf8',
    });
    console.log(
      test.stdout
        .split('\n')
        .filter((l) => /✗|기대|실제|샘플이/.test(l))
        .join('\n'),
    );
    if (test.status !== 0)
      fail(
        'lint 샘플 테스트가 실패했어요. 원본 clone에서 고친 뒤 다시 실행하세요.',
      );
    git('add', '-A');
    git('commit', '--quiet', '-m', message);
    console.log(`✓ 커밋했어요: ${git('log', '--oneline', '-1')}`);
    console.log(git('diff', '--stat', `origin/${defaultBranch()}..HEAD`));
  },

  'contribute-push'(title, bodyFile) {
    if (!title || !bodyFile)
      fail('사용법: contribute-push <PR 제목> <PR 본문 파일>');
    const lock = needLock();
    const branch = git('branch', '--show-current');
    const remember = (where) => {
      if (lock.contributing?.[branch]) lock.contributing[branch].pr = where;
      writeLock(lock);
    };
    git('push', '--quiet', '-u', 'origin', branch);
    if (!/github\.com/.test(git('remote', 'get-url', 'origin'))) {
      remember(`브랜치 ${branch}`);
      return console.log(
        `✓ ${branch}를 push했어요(GitHub 원본이 아니라 PR은 만들지 않았어요).`,
      );
    }
    const pr = spawnSync(
      'gh',
      [
        'pr',
        'create',
        '--title',
        title,
        '--body-file',
        bodyFile,
        '--head',
        branch,
      ],
      { cwd: CLONE, encoding: 'utf8' },
    );
    if (pr.status !== 0) fail(pr.stderr);
    remember(pr.stdout.trim());
    console.log(`✓ PR을 만들었어요: ${pr.stdout.trim()}`);
  },
};

const [cmd, ...args] = process.argv.slice(2);
(commands[cmd] ?? (() => fail(`명령: ${Object.keys(commands).join(', ')}`)))(
  ...args,
);
