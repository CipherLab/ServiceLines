import axios from 'axios'

const API_KEY = 'AIzaSyCvvVY2ce4u6UK52_pnsHNjqpbPTyYYMdE'
const SHEET_ID = '1KwDTLieOALN2bJJ-IXyr1BkGSo9ixPnclMoTYxCPX8g'
const SHEET_NAME = 'SLs'

// Parse CSV text into array of objects
function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split('\t').map(h => h.trim())

  return lines.slice(1).map(line => {
    const values = line.split('\t')
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

export async function fetchServiceLines() {
  try {
    // Try loading from local CSV first
    console.log('[ServiceLines] Loading from local CSV file')
    const response = await fetch('/ServiceLines/ServiceLines.csv')

    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.statusText}`)
    }

    const text = await response.text()
    const data = parseCSV(text)

    console.log('[ServiceLines] Loaded', data.length, 'records from CSV')
    console.log('[ServiceLines] Sample record:', data[0])

    return data
  } catch (error) {
    console.error('[ServiceLines] Error loading CSV:', error)

    // Fallback to Google Sheets
    try {
      console.log('[ServiceLines] Falling back to Google Sheets')
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
      const response = await axios.get(url)

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        throw new Error('No data found in sheet')
      }

      const headers = rows[0]
      const data = rows.slice(1).map(row => {
        const obj = {}
        headers.forEach((header, index) => {
          obj[header] = row[index] || ''
        })
        return obj
      })

      console.log('[ServiceLines] Loaded', data.length, 'records from Google Sheets')
      return data
    } catch (sheetsError) {
      console.error('[ServiceLines] Google Sheets error:', sheetsError)
      throw new Error(`Failed to load data: ${sheetsError.message}`)
    }
  }
}

export async function appendServiceLine(rowData) {
  // Note: Writing to Google Sheets requires OAuth authentication
  // For now, this is a placeholder that would need proper setup
  console.log('Would append:', rowData)

  // To implement: Use gapi.client.sheets.spreadsheets.values.append
  // with proper OAuth 2.0 authentication

  return Promise.resolve()
}

export async function fetchDescriptions() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Descriptions?key=${API_KEY}`
    console.log('[Descriptions] Fetching from Google Sheets')

    const response = await axios.get(url)

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      console.log('[Descriptions] No data found in Descriptions sheet')
      return []
    }

    const headers = rows[0]
    const data = rows.slice(1).map(row => {
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = row[index] || ''
      })
      return obj
    })

    // Transform to the expected format
    const descriptions = data.map(row => ({
      pathKey: row.pathKey || '',
      author: row.author || '',
      content: row.content || '',
      timestamp: parseInt(row.timestamp) || Date.now(),
      isFromSheet: true
    }))

    console.log('[Descriptions] Loaded', descriptions.length, 'descriptions from Google Sheets')
    return descriptions
  } catch (error) {
    // If the sheet doesn't exist or there's an error, gracefully return empty array
    if (error.response?.status === 400) {
      console.log('[Descriptions] Descriptions sheet not found (this is OK)')
    } else {
      console.error('[Descriptions] Error fetching descriptions:', error)
    }
    return []
  }
}

export function buildTree(data) {
  const tree = []

  data.forEach(row => {
    const l1 = row['Service Line (L1)']
    const l2 = row['Capability (L2)']
    const l3 = row['Solution Set (L3)']
    const l4 = row['Sub-function (L4)']

    if (!l1 || l1 === '—') return

    let l1Node = tree.find(n => n.name === l1)
    if (!l1Node) {
      l1Node = {
        name: l1,
        children: [],
        description: row['L1 Description'] || '',
        leader: row['Service Line (L1) Leader'] || ''
      }
      tree.push(l1Node)
    }

    if (l2 && l2 !== '—') {
      let l2Node = l1Node.children.find(n => n.name === l2)
      if (!l2Node) {
        l2Node = {
          name: l2,
          children: [],
          description: row['L2 Description'] || '',
          leader: row['Capability (L2) Leader'] || ''
        }
        l1Node.children.push(l2Node)
      }

      if (l3 && l3 !== '—') {
        let l3Node = l2Node.children.find(n => n.name === l3)
        if (!l3Node) {
          l3Node = {
            name: l3,
            children: [],
            description: row['L3 Description'] || '',
            leader: row['Solution Set (L3) Leader'] || ''
          }
          l2Node.children.push(l3Node)
        }

        if (l4 && l4 !== '—') {
          let l4Node = l3Node.children.find(n => n.name === l4)
          if (!l4Node) {
            l4Node = {
              name: l4,
              children: [],
              description: row['L4 Description'] || '',
              leader: row['Sub-function Leader'] || ''
            }
            l3Node.children.push(l4Node)
          }
        }
      }
    }
  })

  return tree
}
