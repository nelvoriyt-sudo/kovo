import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('production worker serves the complete cached shell without network and excludes private APIs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kovo-worker-'));
  try {
    await mkdir(join(directory, 'dist/assets'), { recursive: true });
    const build = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/offline-build.js', import.meta.url))], {
      cwd: directory, encoding: 'utf8', env: { ...process.env, GITHUB_SHA: 'offline-test' },
    });
    assert.equal(build.status, 0, build.stderr);
    const handlers = {}, cache = new Map();
    let networkCalls = 0;
    const context = {
      URL,
      self: { location: { origin: 'https://example.test' }, clients: { claim: async () => {} },
        addEventListener: (name, handler) => { handlers[name] = handler; } },
      caches: {
        open: async () => ({
          addAll: async (urls) => urls.forEach(url => cache.set(url, { body: url })),
          match: async (path, options) => {
            assert.equal(options.ignoreVary, true, 'Static assets must ignore request-origin header variation');
            return cache.get(path);
          },
        }),
        keys: async () => ['kovo-shell-offline-test'], delete: async () => true,
        match: async (request) => cache.get(typeof request === 'string' ? request : new URL(request.url).pathname),
      },
      fetch: async () => { networkCalls++; throw new Error('Network offline'); },
    };
    vm.runInNewContext(await readFile(join(directory, 'dist/sw.js'), 'utf8'), context);
    let pending;
    handlers.install({ waitUntil: promise => { pending = promise; } });
    await pending;
    handlers.activate({ waitUntil: promise => { pending = promise; } });
    await pending;
    for (const path of ['/kovo/', '/kovo/?from=email']) {
      handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: `https://example.test${path}` },
        respondWith: promise => { pending = promise; } });
      assert.equal((await pending).body, '/kovo/index.html');
    }
    handlers.fetch({ request: { method: 'GET', url: 'https://example.test/kovo/icon.svg' },
      respondWith: promise => { pending = promise; } });
    assert.equal((await pending).body, '/kovo/icon.svg');
    for (const url of ['https://project.supabase.co/auth/v1/user', 'https://project.supabase.co/rest/v1/rpc/kovo_read_records']) {
      handlers.fetch({ request: { method: 'GET', url }, respondWith: () => assert.fail('Private API intercepted') });
    }
    assert.equal(networkCalls, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
