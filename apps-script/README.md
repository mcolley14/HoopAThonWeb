# Signup backend (Google Sheet)

Signups from the site land as rows in a Google Sheet, through a small Apps Script web app. Free, and it never sleeps between events.

## One-time setup

1. Create a new Google Sheet (e.g. "Hoop-A-Thon Signups").
2. In the Sheet: **Extensions → Apps Script**. Replace the default code with the contents of `Code.gs` and save.
3. **Deploy → New deployment**, type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorize when asked. Google will warn the app is unverified; choose **Advanced → Go to (project name)**. It only gets access to this one spreadsheet.
5. Copy the **Web app URL** (ends in `/exec`) into `signupEndpoint` in `config.js`.

The `Individuals` and `Teams` tabs are created on the first signup.

## Updating the script

Edit the code, then **Deploy → Manage deployments → edit (pencil) → Version: New version**. This keeps the same URL, so `config.js` doesn't change.

## What it does

- `POST` saves an individual or team signup. Validation mirrors the site's.
- `GET` returns `{ participants: N }`: individual rows plus the sum of team sizes. The site's counter reads this.
- A hidden `website` field catches basic spam bots.
- Values starting with `=`, `+`, `-` or `@` are stored as text so they can't run as formulas.
