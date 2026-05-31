# Insta Growth Tracker Backup Guide

Insta Growth Tracker stores data locally in IndexedDB on the device/browser. There is no backend or cloud sync.

## Export JSON Backup

1. Open the app.
2. Go to More.
3. Open Backup.
4. Tap Export JSON Backup.
5. Save the downloaded `.json` file somewhere safe.

On iPhone, save backups to Files or iCloud Drive so they are not only inside browser downloads.

## Import JSON Backup

1. Open the app.
2. Go to More.
3. Open Backup.
4. Choose the import mode:
   - `replace`: clears current local data and restores from the backup file.
   - `merge`: adds/restores backup records into the current local database.
5. Tap Import JSON Backup and choose the `.json` file.
6. Confirm the import prompt.

## What Is Included

The JSON backup includes:

- App settings and theme
- Daily plans and checklist history
- Reel performance and 24h / 72h / 7d stats
- Screenshot OCR import records and OCR raw text
- Weekly and monthly reviews
- Streak history and rewards
- 90-day idea map
- Content ideas, hooks, captions, hashtags
- Story and carousel trackers
- Audience insights, experiments, remakes, comments
- Profile checklist
- Goals, collabs, inspiration, privacy checks

## How Often To Backup

Export a backup at least weekly, and also before clearing browser data, changing phones, or trying a new deployment URL.

## Important Warning

Local browser data is device/browser-specific. Data saved in Safari on one iPhone is not automatically available in Chrome, another iPhone, or another deployment URL. Keep regular JSON backups.
