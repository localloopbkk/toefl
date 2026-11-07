# TOEFL Listening Lab

A static, GitHub Pages-ready audio playlist containing the supplied Student Practice Tests 1–2 and Teacher Practice Tests 1–5.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload everything in this folder, including `audio/`, to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then click **Save**.

GitHub will provide the public URL after deployment finishes.

## Use locally

Open `index.html` in a modern browser. If your browser blocks local audio paths, run a simple local server in this folder, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Rebuild the playlist manifest

If you add or remove audio files, run:

```bash
node generate-manifest.mjs
```

## Listening-time tracking

The progress card shows today's listening time, the current week (Monday through Sunday), lifetime hours, and progress toward 200 hours. Dates use the device's local timezone. All playlist audio counts, including speaking practice. Replays count again. Playback at 2× counts one minute per actual minute spent listening, not two minutes of track content.

The tracker credits advancing audio only while playback is active. Pauses, buffering, seeks and skipped sections are excluded; muted/zero-volume playback is excluded too. It samples media advancement against a monotonic clock and flushes before player-controlled skips, speed changes and track switches. Background playback continues counting. Records are saved at least once per second during playback and on pauses or page exit; an abrupt browser crash may lose the last second. OS volume and whether a person is listening cannot be detected.

Records stay in this browser's local storage, across visits, with independent session records to avoid overwriting records from other tabs. They do not sync between browsers or devices, and clearing site data removes them. Export CSV downloads daily seconds and hours, including the current session. If storage is blocked or full, a message prompts you to export the in-memory records before leaving.

Run timing and calendar tests with `node --test listening.test.cjs`.
