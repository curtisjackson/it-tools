# This fork

`curtisjackson/it-tools` is a fork of [sharevb/it-tools](https://github.com/sharevb/it-tools) (branch
`chore/all-my-stuffs`) with tools ported from [Omni-Tools](https://github.com/iib0011/omni-tools) and
[CyberChef](https://github.com/gchq/CyberChef). Their UI follows IT-Tools; only the logic comes from those projects.
`THIRD_PARTY.md` lists what was ported and under which license.

To keep merges from upstream easy, the fork adds files and leaves upstream's files alone wherever it can:

| Fork files | What |
| --- | --- |
| `src/tools/<slug>/` | The new tools, each in its own folder |
| `src/tools/_shared/` | Shared locale strings of the fork (categories Video and Audio, shared component texts) |
| `src/components/media/`, `src/components/BytesInput.vue`, `src/utils/*.ts` | Shared components and helpers of the new tools |
| `src/libs/` | Vendored third-party code, outside lint and formatting (see the `NOTICE` in each folder) |
| `.github/workflows/fork-*.yml`, `scripts/fork/`, `deploy/` | The fork's image, upstream sync and server stack |
| `FORK.md`, `THIRD_PARTY.md` | This file and the list of ported code |

`src/tools/pdf-editor/emscripten-modules.d.ts` is the one fork file that concerns upstream code: EmbedPDF's types
bring in `@types/emscripten`, which would otherwise type the ghostscript modules of upstream's PDF tools without
their `FS` and `callMain`.

The fork removed upstream's Docker, GitHub Pages, release and Vercel workflows, which publish to sharevb's accounts
(`scripts/fork/upstream-deleted.txt`).

## Docker image

`.github/workflows/fork-docker.yml` builds the upstream `Dockerfile` and publishes
`ghcr.io/curtisjackson/it-tools:latest` and `:YYYY.MM.DD-<sha>` (linux/amd64):

- after `ci` passes on a push to `main`;
- every Monday at 03:00 UTC, to pick up fixes of the nginx and node base images;
- by hand, from the Actions tab.

Before publishing, it runs `scripts/fork/smoke.sh` against the image served from `/` and from `/it-tools/`: page
and COOP/COEP headers, the rewritten `<base href>`, a deep link, precompressed assets, the chunks of some tools of
the fork, and the ffmpeg core. The same script checks a running server:

```bash
sh scripts/fork/smoke.sh http://192.168.1.11:9449/
```

Run it read-only like this. Under a subpath, `/etc/nginx/conf.d` must be writable by the nginx user (uid 101),
otherwise `BASE_URL` is ignored:

```bash
docker run -d --read-only --tmpfs /tmp -p 8080:8080 ghcr.io/curtisjackson/it-tools:latest
docker run -d --read-only --tmpfs /tmp --tmpfs /etc/nginx/conf.d:uid=101,gid=101 \
  -e BASE_URL=/it-tools/ -p 8080:8080 ghcr.io/curtisjackson/it-tools:latest
```

The server pulls the image without logging in, so the package must be public: after the first publish, check its
visibility on GitHub (Packages → it-tools → Package settings).

## Server

http://tools.bit2byte.pro/ runs the stack `deploy/compose.yaml` on `cj_serv`, in `/home/cj/dockers/it-tools`
(the folder holds only a copy of that file, which Dockge shows as a stack). The container listens on
`192.168.1.11:9449`, and Nginx Proxy Manager publishes it. Watchtower, in the same stack, pulls a new `:latest`
every night at 04:00 Moscow time.

```bash
# after a change to deploy/compose.yaml
scp deploy/compose.yaml cj_serv:dockers/it-tools/compose.yaml
ssh cj_serv 'cd ~/dockers/it-tools && docker compose up -d'
# update now instead of at 04:00, and check
ssh cj_serv 'cd ~/dockers/it-tools && docker compose pull && docker compose up -d'
sh scripts/fork/smoke.sh http://192.168.1.11:9449/
```

Rollback: put a `YYYY.MM.DD-<sha>` tag instead of `latest` in the server's `compose.yaml` and run
`docker compose up -d`. Watchtower does not update a pinned tag.

## Upstream sync

By hand:

```bash
git checkout main && git pull
git checkout -b sync/upstream
sh scripts/fork/sync-upstream.sh
pnpm install && pnpm typecheck && pnpm test:unit
```

The script fetches `upstream/chore/all-my-stuffs` (it adds the `upstream` remote when missing) and merges it. It
resolves the conflicts that need no thought itself: files the fork deleted stay deleted, and a conflict in
`pnpm-lock.yaml` alone is resolved by regenerating the lockfile. Anything else stops the merge with the list of
files; resolve them, `git commit`, and open a pull request. Exit codes: 0 merged, 2 up to date, 1 conflicts.

After a regenerated lockfile, check that pnpm did not also bump the pinned Node runtime (`devEngines.runtime`) in
`pnpm-lock.yaml`.

Every Monday at 05:00 UTC `.github/workflows/fork-upstream-sync.yml` does the same:

- a clean merge goes to the `sync/upstream` branch, with a pull request whose description has the merge log and the
  results of lint, typecheck, unit tests and build;
- conflicts open an issue "Upstream merge needs a hand" (or comment on the open one).

A pull request opened by a workflow does not start `ci` and e2e: close and reopen it to run them. The workflow needs
"Allow GitHub Actions to create and approve pull requests" in Settings → Actions → General.
