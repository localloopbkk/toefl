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
