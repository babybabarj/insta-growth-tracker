# Deploy Insta Growth Tracker

Insta Growth Tracker is a Vite React PWA. It is not a native iOS app or IPA. Deploy it to an HTTPS URL, then install it on iPhone from Safari using Add to Home Screen.

## Local Test

```bash
npm install
npm run build
npm run preview
```

Open the preview URL shown in the terminal. The production output is the `dist/` folder.

## Vercel

1. Push this project to GitHub.
2. Open Vercel and choose Add New Project.
3. Import the GitHub repository.
4. Framework preset: Vite.
5. Build command: `npm run build`.
6. Output directory: `dist`.
7. Deploy.
8. Open the deployed HTTPS URL in Safari on iPhone.

## Netlify

Option A: Git deploy

1. Push this project to GitHub.
2. Open Netlify and choose Add New Site.
3. Import the GitHub repository.
4. Build command: `npm run build`.
5. Publish directory: `dist`.
6. Deploy.
7. Open the deployed HTTPS URL in Safari on iPhone.

Option B: Manual drag/drop

1. Run `npm install`.
2. Run `npm run build`.
3. Drag/drop the `dist/` folder into Netlify Deploys.
4. Open the deployed HTTPS URL in Safari on iPhone.

## GitHub Pages

Vercel or Netlify is recommended because the app is currently configured for root-path deployment.

For GitHub Pages project sites, set a Vite base path matching your repository name before building, for example:

```ts
export default defineConfig({
  base: '/your-repo-name/',
  plugins: [react()],
})
```

Then run `npm run build` and deploy `dist/` to GitHub Pages. For a custom domain or user site at the root path, no base path change is usually needed.

## Zip Notes

- Zip the full project folder for source/code backup.
- Zip only the `dist/` folder for manual static hosting uploads.
- A zip file does not install directly on iPhone. iPhone install requires opening the deployed HTTPS link in Safari and using Add to Home Screen.
