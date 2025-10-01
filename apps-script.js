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
    // Parse form data
    const params = e.parameter;
    const action = params.action;
    const data = JSON.parse(params.data || '{}');

    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'addServiceLine') {
      return handleAddServiceLine(ss, data);
    } else if (action === 'addDescription') {
      return handleAddDescription(ss, data);
    } else if (action === 'saveMasterDescription') {
      return handleSaveMasterDescription(ss, data);
    } else {
      return createCorsResponse({ success: false, message: 'Unknown action: ' + action });
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createCorsResponse({ success: false, message: 'Error: ' + error.toString() });
  }
}

function handleAddServiceLine(ss, rowData) {
  try {
    const sheet = ss.getSheetByName('SLs');
    if (!sheet) {
      return createCorsResponse({ success: false, message: 'Sheet "SLs" not found' });
    }

    // Get headers from first row
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build row data matching the header order
    const row = headers.map(header => rowData[header] || '');

    // Append the row
    sheet.appendRow(row);

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

function handleSaveMasterDescription(ss, data) {
  try {
    let sheet = ss.getSheetByName('MasterDescriptions');

    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('MasterDescriptions');
      // Add headers
      sheet.appendRow(['pathKey', 'content', 'timestamp', 'messageCount']);
    }

    // Check if a master description already exists for this pathKey
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.pathKey) {
        rowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }

    // Update existing or append new
    if (rowIndex > 0) {
      // Update existing row
      sheet.getRange(rowIndex, 1, 1, 4).setValues([[
        data.pathKey || '',
        data.content || '',
        data.timestamp || Date.now(),
        data.messageCount || 0
      ]]);
    } else {
      // Append new row
      sheet.appendRow([
        data.pathKey || '',
        data.content || '',
        data.timestamp || Date.now(),
        data.messageCount || 0
      ]);
    }

    return createCorsResponse({ success: true, message: 'Master description saved successfully' });
  } catch (error) {
    Logger.log('Error in handleSaveMasterDescription: ' + error.toString());
    return createCorsResponse({ success: false, message: 'Error saving master description: ' + error.toString() });
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

function testSaveMasterDescription() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const testData = {
    pathKey: 'Test Path',
    content: '<div>Test master description HTML content</div>',
    timestamp: Date.now(),
    messageCount: 5
  };

  const result = handleSaveMasterDescription(ss, testData);
  Logger.log(result.getContent());
}
