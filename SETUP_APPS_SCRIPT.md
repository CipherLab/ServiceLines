# Google Apps Script Setup Guide

This guide will help you set up Google Apps Script to enable writing data to your Google Sheets from the Vue app.

## 🎯 What This Does

- Allows you to add new service lines that save to the "SLs" sheet
- Allows you to post descriptions that save to the "Descriptions" sheet
- Works without OAuth - just a simple web app endpoint

---

## 📋 Step-by-Step Instructions

### 1. Open Your Google Sheet

1. Go to your Google Sheet: `https://docs.google.com/spreadsheets/d/1KwDTLieOALN2bJJ-IXyr1BkGSo9ixPnclMoTYxCPX8g`
2. Make sure you have two sheets:
   - **SLs** - Your main service lines data
   - **Descriptions** - For storing description messages (will be created automatically if it doesn't exist)

### 2. Open Apps Script Editor

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. You'll see a code editor with a default `function myFunction() { }`
3. **Delete all the default code**

### 3. Paste the Apps Script Code

1. Open the file `apps-script.js` in your project root
2. Copy **ALL** the code from that file
3. Paste it into the Apps Script editor
4. Click the **Save** icon (💾) or press `Ctrl+S` / `Cmd+S`
5. Give your project a name (e.g., "ServiceLines API")

### 4. Test the Script (Optional but Recommended)

1. In the Apps Script editor, select `testAddDescription` from the function dropdown
2. Click **Run** (▶️)
3. You may need to authorize the script:
   - Click **Review Permissions**
   - Choose your Google account
   - Click **Advanced** → **Go to ServiceLines API (unsafe)**
   - Click **Allow**
4. Check the "Descriptions" sheet - you should see a test row added
5. You can delete the test row

### 5. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: "Service Lines API v1" (or anything you want)
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. You may need to authorize again - follow the same steps as before
7. **IMPORTANT**: Copy the **Web App URL** that appears
   - It will look like: `https://script.google.com/macros/s/AKfycbxxx.../exec`
   - Keep this URL - you'll need it in the next step!

### 6. Update Your Frontend Code

1. Open `src/services/googleSheets.js` in your Vue app
2. Find this line near the top (around line 9):
   ```javascript
   const APPS_SCRIPT_URL = ''
   ```
3. Paste your Web App URL between the quotes:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxx.../exec'
   ```
4. Save the file

### 7. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Open the app at `http://localhost:5173/ServiceLines/`
3. Navigate to a service line
4. Try adding a description - you should see "Description saved to Google Sheets!"
5. Check your "Descriptions" sheet - the new description should appear
6. Try adding a new service line with the "+ Add New" button
7. Check your "SLs" sheet - the new service line should appear

---

## 🐛 Troubleshooting

### "APPS_SCRIPT_URL not configured" Error

- Make sure you pasted the Web App URL in `src/services/googleSheets.js`
- Make sure the URL is in quotes: `const APPS_SCRIPT_URL = 'https://...'`
- Restart your dev server after making the change

### CORS Errors

- Make sure you deployed as a **Web app** (not API Executable)
- Make sure "Who has access" is set to **Anyone**
- Try redeploying the script

### "Permission Denied" Errors

- Make sure you authorized the script with your Google account
- Make sure "Execute as" is set to **Me** (not "User accessing the web app")

### Data Not Appearing in Sheet

- Check the browser console for error messages (F12)
- Verify the Apps Script URL is correct
- Check the Apps Script logs:
  1. In Apps Script editor, click **View** → **Executions**
  2. Look for recent executions and any error messages

### Need to Redeploy?

If you make changes to the Apps Script:
1. Click **Deploy** → **Manage deployments**
2. Click the **Edit** icon (✏️) next to your deployment
3. Change the version to **New version**
4. Click **Deploy**
5. The URL stays the same - no need to update frontend

---

## 🔒 Security Notes

- The Apps Script runs with **your** permissions
- Anyone with the URL can POST to your sheet
- For production, you should:
  - Add authentication/API key validation in the script
  - Restrict "Who has access" to specific users
  - Add rate limiting
  - Add input validation

---

## ✅ Success!

Once everything is set up:
- ✅ New service lines save to Google Sheets immediately
- ✅ Descriptions sync to Google Sheets in real-time
- ✅ Data persists across all users and devices
- ✅ The "Synced" badge appears on descriptions from the sheet

You're all set! 🎉
