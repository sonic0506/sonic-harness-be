#!/usr/bin/env node
// Stop: Claude가 일을 끝내려 할 때, 이번에 바뀐 src·test 파일이 있으면 typecheck와 관련 단위 테스트를 돌려요.
// 실패하면 exit 2로 끝내지 못하게 하고 결과를 Claude에게 돌려줘요. e2e는 Docker가 필요하고 느려서 여기서 돌리지 않아요.
// 모노레포면 바뀐 파일마다 가장 가까운 lock.json 폴더(앱)를 찾아 앱별로 돌려요.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const session = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
// 이미 한 번 막아서 다시 고치는 중이면 또 막지 않아요(끝없이 반복하지 않게).
if (input.stop_hook_active) process.exit(0);

// dir에서 세션 루트까지 올라가며 rel이 있는 가장 가까운 폴더를 찾아요.
const findUp = (dir, rel) => {
  for (let d = dir; ; d = dirname(d)) {
    if (existsSync(join(d, rel))) return d;
    if (d === session || d === dirname(d)) return null;
  }
};

// src·test 아래 .ts만 봐요(node_modules가 .gitignore에 없어도 출력이 버퍼를 넘지 않게).
const git = (args) =>
  spawnSync('git', args, {
    cwd: session,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
const status = git([
  'status',
  '--porcelain',
  '--untracked-files=all',
  '--',
  ':(glob)**/src/**/*.ts',
  ':(glob)**/test/**/*.ts',
]);
if (status.status !== 0) process.exit(0); // git 저장소가 아니면 바뀐 파일을 알 수 없어요
// porcelain 경로는 저장소 루트 기준이에요.
const top = git(['rev-parse', '--show-toplevel']).stdout.trim();

const apps = new Map(); // 앱 루트 → 그 앱 기준 상대 경로 목록
for (const line of status.stdout.split('\n')) {
  const file = join(
    top,
    line
      .slice(3)
      .trim()
      .replace(/^.* -> /, ''),
  );
  if (!line || !existsSync(file)) continue;
  const app = findUp(dirname(file), '.sonic-harness-be/lock.json');
  if (!app) continue;
  const rel = relative(app, file);
  if (/^(src|test)\/.*\.ts$/.test(rel))
    apps.set(app, [...(apps.get(app) ?? []), rel]);
}

const failures = [];
for (const [app, changed] of apps) {
  // 프로젝트에 설치된 실행 파일만 써요. npx는 없으면 레지스트리에서 받아 실행해서 쓰지 않아요.
  // npm workspaces는 루트로 끌어올려 설치하므로 가까운 node_modules부터 찾아요.
  const binDir = findUp(app, 'node_modules/.bin/vitest');
  if (!binDir || !existsSync(join(binDir, 'node_modules/.bin/tsc'))) continue;
  const run = (name, args) =>
    spawnSync(join(binDir, 'node_modules/.bin', name), args, {
      cwd: app,
      encoding: 'utf8',
      timeout: 150_000,
    });
  const where = app === session ? '' : ` (${relative(session, app)})`;
  const tsc = run('tsc', ['--noEmit']);
  if (tsc.status !== 0)
    failures.push(`typecheck 실패${where}:\n${tsc.stdout}${tsc.stderr}`);
  const srcFiles = changed.filter((f) => f.startsWith('src/'));
  if (srcFiles.length) {
    const test = run('vitest', [
      'related',
      '--run',
      '--passWithNoTests',
      ...srcFiles,
    ]);
    if (test.status !== 0)
      failures.push(
        `관련 단위 테스트 실패${where}:\n${(test.stdout + test.stderr).slice(-4000)}`,
      );
  }
}
if (!failures.length) process.exit(0);
process.stderr.write(
  `끝내기 전에 검증이 실패했어요. 고친 뒤 다시 끝내 주세요(AGENTS.md "완료 보고").\n\n${failures.join('\n\n')}\n`,
);
process.exit(2);
