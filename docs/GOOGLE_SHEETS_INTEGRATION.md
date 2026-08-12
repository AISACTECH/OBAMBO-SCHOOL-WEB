# Google Sheets integration

The Google Sheets integration is intentionally one-way:

```text
Google Sheet -> validation preview -> approved sync -> PostgreSQL -> student portal
```

The existing CSV importer remains available as a fallback.

## Required server configuration

Set these variables in the server environment:

```dotenv
GOOGLE_SHEETS_SYNC_ENABLED=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.example/api/admin/google-sheets/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=<64 hexadecimal characters>
```

The redirect URI must exactly match the URI registered for the Google OAuth web client. Enable the Google Sheets API and Google Drive API in the same Google Cloud project.

The default scope is read-only for Sheets plus the identity scopes needed to show the connected Google account:

- `openid`
- `email`
- `https://www.googleapis.com/auth/spreadsheets.readonly`

The application does not request full Drive access. Do not put client secrets or refresh tokens in the browser or repository.

## Workbook format

The first supported worksheet is `Performance`. The first row is the header row. Required headers are:

```text
Admission Number, Term, Year, Exam, Subject, Marks, Grade
```

Optional headers are:

```text
Student Name, Form, Stream, Points, Comment
```

Admission number is the identity key. Student name and form are checked against school records when supplied. Passwords, birth certificate numbers and other authentication secrets must never be placed in the workbook.

## Administrator flow

1. Open **School Control Center → Google Sheets**.
2. Connect the official Google account.
3. Enter the spreadsheet URL, worksheet name and range, for example `A1:M`.
4. Run **Preview Sheet**.
5. Correct invalid rows in Google Sheets.
6. Select **Approve and Sync**.
7. Review the result import history and rollback record.

The current implementation performs an explicit preview and approval. Automatic Drive watch notifications and scheduled reconciliation should be added only after the manual flow is used successfully in production.
