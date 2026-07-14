# Manual Translation Template Filler (Next.js + TypeScript)

A frontend-only Next.js app for filling Spanish translation DOCX templates manually. The app does not run OCR, does not upload source PDFs, and does not require a Python backend.

Supported templates:
- PCC Jalandhar
- PCC Chandigarh
- Medical
- Birth
- Marriage

## Features

- Template dropdown on the first screen
- Automatic placeholder detection from the selected DOCX file
- Bulk Paste tab for entries like `<<NAME>> = UTSAV MISHRA, <<CERT_NO>> = CD1234567654`
- Empty text fields for each `<<PLACEHOLDER>>`
- Dropdown plus custom text controls for common PCC/Medical values such as title, relation, and PCC type
- MS Word download with placeholders replaced by typed text
- PDF download generated in the browser from the rendered document preview

## Project Structure

```text
Templatepdf/
├─ app/
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ lib/
│  └─ template.ts
├─ public/
│  └─ templates/
│     ├─ BIRTH.docx
│     ├─ MARRIAGE.docx
│     ├─ MEDICAL.docx
│     ├─ pccChandigarh.docx
│     └─ pccjalandhar.docx
├─ package.json
└─ README.md
```

## Template Setup

Place DOCX templates in `public/templates/`. The frontend reads `<<PLACEHOLDER>>` values directly from the selected DOCX file, so no separate mapping file is required.

## Run the App

```bash
cd /Users/utsav/Desktop/Templatepdf
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

## Add a New Template

1. Add the `.docx` file under `public/templates/`.
2. Add one entry to `templateOptions` in `lib/template.ts`.
3. Use placeholders in the `<<NAME>>` format inside the DOCX.

## Notes

- This app runs in Next.js and should be started using `npm run dev` or built using `npm run build`.
- DOCX output keeps the original template file structure and replaces placeholders inside Word XML.
- PDF output is generated from the browser-rendered preview. Inspect the DOCX when exact legal formatting is required.
