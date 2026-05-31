# Final Delivery: Insta Growth Tracker

## App

- App name: Insta Growth Tracker
- Short PWA name: Insta Tracker
- Profile display: @twinklesaysso, Twinkle Says So
- App type: Progressive Web App

## Features Included

- Redesigned mobile-first white/pink interface
- Polished Today screen with streak hero and 7-day reward path
- Cleaner grouped Review, Library, and More screens
- Mobile-first PWA layout
- Bottom navigation
- Local IndexedDB storage with Dexie
- Daily checklist and planner
- Quick Create Plan wizard
- 90-day idea map
- Reel performance log with 24h / 72h / 7d tracking
- Screenshot OCR analytics import with manual review
- Weekly and monthly reviews
- Streak and reward system
- Content library, hooks, captions, hashtags
- Audience insights, experiments, remakes, comments
- Profile conversion checklist
- Goals, collabs, inspiration, child privacy checks
- JSON backup/import and CSV export
- PWA manifest and service worker

## Run Locally

```bash
npm install
npm run build
npm run preview
```

## Deploy

Deploy the `dist/` folder to a static host.

Recommended:

- Vercel: Build command `npm run build`, output directory `dist`
- Netlify: Build command `npm run build`, publish directory `dist`

GitHub Pages can work, but project pages may require a custom Vite `base` path before building.

## Install On iPhone

1. Open the deployed HTTPS app link in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Rename if needed: Insta Growth Tracker.
5. Tap Add.
6. Open from the Home Screen.

## Backup Data

Use More -> Backup -> Export JSON Backup regularly. Save the file to iCloud Drive or Files.

To restore, use More -> Backup -> Import JSON Backup.

## Delivery Files

- Source/code package: `release/insta-growth-tracker-source.zip`
- Deployable production package: `release/insta-growth-tracker-dist.zip`
- Screenshot folder: `screenshots/insta-growth-tracker/`
- Screenshot zip: `screenshots/insta-growth-tracker-screenshots.zip`
- Production build folder: `dist/`
- Deployment guide: `README_DEPLOY.md`
- iPhone install guide: `IPHONE_INSTALL.md`
- Backup guide: `BACKUP_GUIDE.md`
- UI redesign summary: `UI_REDESIGN_SUMMARY.md`

## Known Limitations

- This is a PWA, not a native iOS app.
- It cannot be installed by tapping a zip file on WhatsApp.
- It must be opened from an HTTPS link and added to Home Screen in Safari.
- Data is stored locally on the device/browser.
- There is no backend/cloud sync.
- Instagram API is not integrated unless separately built later.
- Screenshot OCR may need manual review before saving numbers.
