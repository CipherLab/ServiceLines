/**
 * Google Apps Script to handle POST requests for writing to Google Sheets
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any default code
 * 4. Paste this entire file
 * 5. Click "Deploy" > "New deployment"
 * 6. Choose type: "Web app"
 * 7. Set "Execute as": Me
 * 8. Set "Who has access": Anyone
 * 9. Click "Deploy"
 * 10. Copy the Web App URL
 * 11. Paste it into your frontend code (see instructions below)
 *
 * IMPORTANT: After making changes, you must create a NEW VERSION:
 * Deploy > Manage deployments > Edit (pencil icon) > Version: New version > Deploy
 */

// Handle CORS preflight requests
function doGet(e) {
  return createCorsResponse({ success: true, message: 'API is ready' });
}

function doPost(e) {
  try {
    // Parse the incoming request
    const data = JSON.parse(e.postData.contents);
    const action = data.action; // 'addServiceLine' or 'addDescription'

    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'addServiceLine') {
      return handleAddServiceLine(ss, data);
    } else if (action === 'addDescription') {
      return handleAddDescription(ss, data);
    } else {
      return createCorsResponse({ success: false, message: 'Unknown action: ' + action });
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createCorsResponse({ success: false, message: 'Error: ' + error.toString() });
  }
}

function handleAddServiceLine(ss, data) {
  try {
    const sheet = ss.getSheetByName('SLs');
    if (!sheet) {
      return createCorsResponse({ success: false, message: 'Sheet "SLs" not found' });
    }

    // Get headers from first row
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build row data matching the header order
    const rowData = headers.map(header => data.row[header] || '');

    // Append the row
    sheet.appendRow(rowData);

    return createCorsResponse({ success: true, message: 'Service line added successfully' });
  } catch (error) {
    Logger.log('Error in handleAddServiceLine: ' + error.toString());
    return createCorsResponse({ success: false, message: 'Error adding service line: ' + error.toString() });
  }
}

function handleAddDescription(ss, data) {
  try {
    let sheet = ss.getSheetByName('Descriptions');

    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Descriptions');
      // Add headers
      sheet.appendRow(['pathKey', 'author', 'content', 'timestamp']);
    }

    // Append the description
    sheet.appendRow([
      data.pathKey || '',
      data.author || '',
      data.content || '',
      data.timestamp || Date.now()
    ]);

    return createCorsResponse({ success: true, message: 'Description added successfully' });
  } catch (error) {
    Logger.log('Error in handleAddDescription: ' + error.toString());
    return createCorsResponse({ success: false, message: 'Error adding description: ' + error.toString() });
  }
}

function createCorsResponse(responseData) {
  const output = ContentService
    .createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);

  return output;
}

/**
 * Test function - run this to verify the script works
 */
function testAddServiceLine() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const testData = {
    action: 'addServiceLine',
    row: {
      '#': '999',
      'Service Line (L1)': 'Test Service Line',
      'Service Line (L1) Leader': 'Test Leader',
      'Capability (L2)': '—',
      'Capability (L2) Leader': '',
      'Solution Set (L3)': '—',
      'Solution Set (L3) Leader': '',
      'Sub-function (L4)': '—',
      'Sub-function Leader': ''
    }
  };

  const result = handleAddServiceLine(ss, testData);
  Logger.log(result.getContent());
}

function testAddDescription() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const testData = {
    action: 'addDescription',
    pathKey: 'Test Path',
    author: 'Test Author',
    content: 'Test description content',
    timestamp: Date.now()
  };

  const result = handleAddDescription(ss, testData);
  Logger.log(result.getContent());
}
