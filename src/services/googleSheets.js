import axios from 'axios'

const API_KEY = 'AIzaSyCvvVY2ce4u6UK52_pnsHNjqpbPTyYYMdE'
const SHEET_ID = '1KwDTLieOALN2bJJ-IXyr1BkGSo9ixPnclMoTYxCPX8g'
const SHEET_NAME = 'SLs'

export async function fetchServiceLines() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
    const response = await axios.get(url)

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      throw new Error('No data found in sheet')
    }

    // Parse rows into objects
    const headers = rows[0]
    const data = rows.slice(1).map(row => {
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = row[index] || ''
      })
      return obj
    })

    return data
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error)
    throw new Error(`Failed to load data: ${error.message}`)
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
