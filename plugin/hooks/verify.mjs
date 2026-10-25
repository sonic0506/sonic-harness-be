#!/usr/bin/env node
// Stop: Claude가 일을 끝내려 할 때, 이번에 바뀐 src·test 파일이 있으면 typecheck와 관련 단위 테스트를 돌려요.
// 실패하면 exit 2로 끝내지 못하게 하고 결과를 Claude에게 돌려줘요. e2e는 Docker가 필요하고 느려서 여기서 돌리지 않아요.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
// 이미 한 번 막아서 다시 고치는 중이면 또 막지 않아요(끝없이 반복하지 않게).
if (input.stop_hook_active) process.exit(0);
if (!existsSync(join(root, '.sonic-harness-be/lock.json'))) process.exit(0);
// 프로젝트에 설치된 실행 파일만 써요. npx는 없으면 레지스트리에서 받아 실행해서 쓰지 않아요.
const bin = (name) => join(root, 'node_modules/.bin', name);
if (!existsSync(bin('tsc')) || !existsSync(bin('vitest'))) process.exit(0);

// src·test만 봐요(node_modules가 .gitignore에 없어도 출력이 버퍼를 넘지 않게).
const status = spawnSync(
  'git',
  ['status', '--porcelain', '--untracked-files=all', '--', 'src', 'test'],
  { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 },
);
if (status.status !== 0) process.exit(0); // git 저장소가 아니면 바뀐 파일을 알 수 없어요
const changed = status.stdout
  .split('\n')
  .map((line) =>
    line
      .slice(3)
      .trim()
      .replace(/^.* -> /, ''),
  )
  .filter((f) => /^(src|test)\/.*\.ts$/.test(f) && existsSync(join(root, f)));
if (!changed.length) process.exit(0);

const run = (name, args) =>
  spawnSync(bin(name), args, { cwd: root, encoding: 'utf8', timeout: 150_000 });
const failures = [];
const tsc = run('tsc', ['--noEmit']);
if (tsc.status !== 0)
  failures.push(`typecheck 실패:\n${tsc.stdout}${tsc.stderr}`);
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
      `관련 단위 테스트 실패:\n${(test.stdout + test.stderr).slice(-4000)}`,
    );
}
if (!failures.length) process.exit(0);
process.stderr.write(
  `끝내기 전에 검증이 실패했어요. 고친 뒤 다시 끝내 주세요(AGENTS.md "완료 보고").\n\n${failures.join('\n\n')}\n`,
);
process.exit(2);
