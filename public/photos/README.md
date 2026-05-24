# Team photos

Drop your team photos in this folder, then click any avatar in the app to set its filename.

## How it works

1. Save a photo here, e.g. `public/photos/tamar.png`.
2. In the app, click the avatar circle on Tamar's card.
3. Type `tamar.png` and hit Save.

The app resolves bare filenames to `/photos/<filename>` automatically. You can also paste a full URL (`https://...`) or a data URL.

## Tips

- Square images crop best (any size — they're displayed at ~56px).
- Common formats work: `.png`, `.jpg`, `.webp`, `.svg`.
- Keep filenames simple (lowercase, no spaces) — e.g. `tamar.png`, `sarah-cohen.jpg`.
- If you change a filename, just edit the avatar again in the app.

## Where the filename is stored

The filename is stored per-person in browser localStorage. When you export the team plan as JSON, the filenames travel with it — anyone who loads the JSON and has the same files in `public/photos/` will see the same avatars.
