<template>
  <div class="description-thread">
    <div class="thread-header">
      <div class="text-h6">{{ title }}</div>

      <!-- Editable Leader -->
      <div v-if="editingLeader" class="leader-edit-container">
        <q-input
          v-model="editingLeaderName"
          dense
          filled
          autofocus
          label="Leader Name"
          class="leader-edit-input"
          :disable="isSavingLeader"
          :loading="isSavingLeader"
          @keyup.enter="saveLeaderEdit"
          @keyup.esc="cancelLeaderEdit"
        />
        <div class="leader-edit-actions">
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="check"
            color="positive"
            :loading="isSavingLeader"
            :disable="isSavingLeader"
            @click="saveLeaderEdit"
          />
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="close"
            color="negative"
            :disable="isSavingLeader"
            @click="cancelLeaderEdit"
          />
        </div>
      </div>

      <!-- Normal Leader Display -->
      <div v-else-if="leader || !editingLeader" class="text-subtitle2 text-grey-7 leader-display">
        Leader:
        <a v-if="leader" :href="leaderEmail" class="leader-email">{{ leader }}</a>
        <span v-else class="text-grey-5 text-italic">Not assigned</span>
        <q-btn
          flat
          dense
          round
          size="xs"
          icon="edit"
          class="leader-edit-icon"
          @click="startLeaderEdit"
        >
          <q-tooltip>Edit leader</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- AI-Generated Master Description -->
    <q-card
      v-if="sortedMessages.length > 0"
      class="master-description-card q-mb-md"
      flat
      bordered
    >
      <q-card-section class="master-header">
        <div class="master-title-row">
          <div class="master-title-section">
            <q-icon name="auto_awesome" size="sm" color="amber-9" class="q-mr-xs" />
            <span class="text-subtitle1 text-weight-medium">AI-Generated Summary</span>
            <q-badge
              color="amber-6"
              text-color="grey-9"
              label="MASTER"
              class="q-ml-sm"
            />
          </div>
          <q-btn
            flat
            dense
            round
            icon="refresh"
            color="amber-9"
            size="sm"
            @click="regenerateMasterDescription"
            :loading="isGenerating"
            :disable="isGenerating"
          >
            <q-tooltip>Regenerate summary from current descriptions</q-tooltip>
          </q-btn>
        </div>
        <div class="master-meta text-caption text-grey-7 q-mt-xs">
          <span v-if="masterDescription?.timestamp">
            Last updated: {{ formatDate(masterDescription.timestamp) }}
          </span>
          <span class="q-mx-sm">•</span>
          <span>Based on {{ sortedMessages.length }} team input{{ sortedMessages.length !== 1 ? 's' : '' }}</span>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="isGenerating" class="text-center">
        <q-spinner-dots color="amber-9" size="md" />
        <div class="text-caption text-grey-7 q-mt-sm">Analyzing descriptions and generating summary...</div>
      </q-card-section>

      <q-card-section v-else-if="masterDescription?.content" class="master-content">
        <div v-html="masterDescription.content"></div>
      </q-card-section>

      <q-card-section v-else class="text-center text-grey-7">
        <q-icon name="psychology" size="md" color="grey-5" class="q-mb-sm" />
        <div class="text-caption">No summary generated yet. Click refresh to create one.</div>
      </q-card-section>
    </q-card>

    <!-- Chat-like messages -->
    <div class="messages-container" ref="messagesContainer">
      <div
        v-for="(message, index) in sortedMessages"
        :key="index"
        class="message-item"
        :class="{ 'synced-message': message.isFromSheet }"
      >
        <div class="message-header">
          <div class="author-section">
            <span class="message-author">{{ message.author }}</span>
            <q-badge
              v-if="message.isFromSheet"
              color="green-6"
              text-color="white"
              class="sync-badge"
              label="Synced"
            />
            <q-badge
              v-else
              color="grey-6"
              text-color="white"
              class="sync-badge"
              label="Local"
            />
          </div>
          <span class="message-time">{{ formatDate(message.timestamp) }}</span>
        </div>
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>

      <div v-if="sortedMessages.length === 0" class="no-messages">
        No descriptions yet. Be the first to add one!
      </div>
    </div>

    <q-separator class="q-my-md" />

    <!-- Add new message -->
    <div class="add-message">
      <q-input
        v-model="newMessage.author"
        label="Your Name"
        filled
        dense
        class="q-mb-sm"
      />
      <q-input
        v-model="newMessage.content"
        label="Add a description..."
        filled
        dense
        type="textarea"
        rows="3"
        class="q-mb-sm"
      />
      <q-btn
        label="Add"
        color="primary"
        @click="postMessage"
        :disable="!canPost || isPosting"
        :loading="isPosting"
        unelevated
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { fetchDescriptions, saveDescription, fetchMasterDescriptions, saveMasterDescription as saveMasterDescriptionToSheet, updateServiceLine } from '../services/googleSheets'
import { aggregateDescriptions } from '../services/gemini'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  leader: {
    type: String,
    default: ''
  },
  pathKey: {
    type: String,
    required: true
  }
})

const $q = useQuasar()
const messagesContainer = ref(null)
const messages = ref([])
const newMessage = ref({
  author: '',
  content: ''
})
const isLoading = ref(false)
const isPosting = ref(false)
const masterDescription = ref(null)
const isGenerating = ref(false)
const editingLeader = ref(false)
const editingLeaderName = ref('')
const isSavingLeader = ref(false)

const sortedMessages = computed(() => {
  return [...messages.value].sort((a, b) => b.timestamp - a.timestamp)
})

const canPost = computed(() => {
  return newMessage.value.author.trim() && newMessage.value.content.trim()
})

const leaderEmail = computed(() => {
  if (!props.leader) return ''

  // Convert "First Last" to "first.last@rsmus.com"
  const name = props.leader.trim().toLowerCase()
  const emailName = name.replace(/\s+/g, '.')
  return `mailto:${emailName}@rsmus.com`
})

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
}

async function loadMessages() {
  if (isLoading.value) {
    console.log('[LOAD] SKIPPING - Already loading')
    return
  }

  isLoading.value = true
  console.log('=== LOAD MESSAGES START ===')
  console.log('[LOAD] PathKey:', props.pathKey)
  console.log('[LOAD] PathKey type:', typeof props.pathKey)
  console.log('[LOAD] PathKey length:', props.pathKey.length)
  console.log('[LOAD] Current messages.value length:', messages.value.length)

  // Debug: List all description keys in localStorage
  console.log('[LOAD] All localStorage keys:')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('descriptions_')) {
      console.log(`  - ${key}:`, localStorage.getItem(key))
    }
  }

  // Load local messages
  const storageKey = `descriptions_${props.pathKey}`
  console.log('[LOAD] Storage key:', storageKey)
  console.log('[LOAD] Storage key length:', storageKey.length)

  const stored = localStorage.getItem(storageKey)
  console.log('[LOAD] Raw localStorage value:', stored)

  let localMessages = []

  if (stored) {
    try {
      localMessages = JSON.parse(stored)
      console.log('[LOAD] Parsed local messages count:', localMessages.length)
      console.log('[LOAD] Local messages:', JSON.stringify(localMessages, null, 2))

      // Mark local messages if not already marked
      localMessages = localMessages.map(msg => ({
        ...msg,
        isFromSheet: msg.isFromSheet || false
      }))
    } catch (e) {
      console.error('[LOAD] Failed to parse stored messages:', e)
      localMessages = []
    }
  } else {
    console.log('[LOAD] No stored messages found in localStorage')
  }

  // Fetch descriptions from Google Sheets
  let sheetDescriptions = []
  try {
    console.log('[LOAD] Fetching from Google Sheets...')
    const allDescriptions = await fetchDescriptions()
    console.log('[LOAD] All descriptions from sheet:', allDescriptions.length)

    // Filter for current pathKey
    sheetDescriptions = allDescriptions.filter(desc => desc.pathKey === props.pathKey)
    console.log(`[LOAD] Found ${sheetDescriptions.length} sheet descriptions for ${props.pathKey}`)
    console.log('[LOAD] Sheet descriptions:', JSON.stringify(sheetDescriptions, null, 2))
  } catch (error) {
    console.error('[LOAD] Failed to load sheet descriptions:', error)
  }

  // Merge messages: Prefer sheet messages, but keep local-only ones
  // Use a Map to deduplicate based on author + content + timestamp
  const messageMap = new Map()

  // Add sheet messages first (they have priority)
  sheetDescriptions.forEach(msg => {
    const key = `${msg.author}|${msg.content}|${msg.timestamp}`
    console.log('[LOAD] Adding sheet message with key:', key)
    messageMap.set(key, msg)
  })

  // Add local messages that aren't duplicates
  localMessages.forEach(msg => {
    const key = `${msg.author}|${msg.content}|${msg.timestamp}`
    if (!messageMap.has(key)) {
      console.log('[LOAD] Adding local message with key:', key)
      messageMap.set(key, msg)
    } else {
      console.log('[LOAD] Skipping duplicate local message:', key)
    }
  })

  messages.value = Array.from(messageMap.values())
  console.log(`[LOAD] Total messages after merge: ${messages.value.length}`)
  console.log('[LOAD] Final messages.value:', JSON.stringify(messages.value, null, 2))

  // Load saved author name
  const savedAuthor = localStorage.getItem('user_name')
  if (savedAuthor) {
    newMessage.value.author = savedAuthor
  }

  // Load master description
  loadMasterDescription()

  isLoading.value = false
  console.log('=== LOAD MESSAGES END ===\n')
}

function saveMessages() {
  console.log('=== SAVE MESSAGES START ===')
  console.log('[SAVE] PathKey:', props.pathKey)

  const storageKey = `descriptions_${props.pathKey}`
  console.log('[SAVE] Storage key:', storageKey)
  console.log('[SAVE] Total messages.value length:', messages.value.length)
  console.log('[SAVE] All messages.value:', JSON.stringify(messages.value, null, 2))

  // Only save local messages to localStorage
  const localMessages = messages.value.filter(msg => !msg.isFromSheet)
  console.log('[SAVE] Filtered local messages count:', localMessages.length)
  console.log('[SAVE] Local messages to save:', JSON.stringify(localMessages, null, 2))

  localStorage.setItem(storageKey, JSON.stringify(localMessages))
  console.log('[SAVE] Saved to localStorage')

  // Verify it was saved
  const verification = localStorage.getItem(storageKey)
  console.log('[SAVE] Verification read:', verification)
  console.log('=== SAVE MESSAGES END ===\n')
}

async function loadMasterDescription() {
  console.log('[MASTER] Loading master description for pathKey:', props.pathKey)

  // First try to load from Google Sheets
  try {
    const allMasterDescriptions = await fetchMasterDescriptions()
    console.log('[MASTER] All master descriptions from sheet:', allMasterDescriptions)
    console.log('[MASTER] Looking for pathKey:', props.pathKey)

    const sheetMaster = allMasterDescriptions.find(desc => desc.pathKey === props.pathKey)
    console.log('[MASTER] Found match:', sheetMaster)

    if (sheetMaster) {
      masterDescription.value = sheetMaster
      console.log('[MASTER] Loaded master description from Google Sheets')

      // Also save to localStorage as backup
      const storageKey = `master_description_${props.pathKey}`
      localStorage.setItem(storageKey, JSON.stringify(sheetMaster))
      return
    }
  } catch (error) {
    console.error('[MASTER] Failed to load from Google Sheets:', error)
  }

  // Fallback to localStorage
  const storageKey = `master_description_${props.pathKey}`
  const stored = localStorage.getItem(storageKey)

  if (stored) {
    try {
      masterDescription.value = JSON.parse(stored)
      console.log('[MASTER] Loaded master description from localStorage')
    } catch (e) {
      console.error('[MASTER] Failed to parse master description:', e)
      masterDescription.value = null
    }
  } else {
    masterDescription.value = null
    console.log('[MASTER] No master description found')
  }
}

async function saveMasterDescription() {
  console.log('[MASTER] Saving master description for pathKey:', props.pathKey)

  // Save to localStorage immediately
  const storageKey = `master_description_${props.pathKey}`
  localStorage.setItem(storageKey, JSON.stringify(masterDescription.value))
  console.log('[MASTER] Saved to localStorage')

  // Try to save to Google Sheets
  try {
    await saveMasterDescriptionToSheet(
      props.pathKey,
      masterDescription.value.content,
      masterDescription.value.timestamp,
      masterDescription.value.messageCount
    )
    console.log('[MASTER] Saved to Google Sheets successfully')
  } catch (error) {
    console.error('[MASTER] Failed to save to Google Sheets:', error)
    // Not throwing error - localStorage save already succeeded
  }
}

function extractKeywords(text) {
  // Remove common words and extract meaningful keywords
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it',
    'they', 'we', 'you', 'he', 'she', 'i', 'me', 'my', 'our', 'their', 'its'
  ])

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))

  // Count word frequency
  const wordCount = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  return wordCount
}

function findCommonThemes(messages) {
  const allKeywords = {}

  messages.forEach(msg => {
    const keywords = extractKeywords(msg.content)
    Object.entries(keywords).forEach(([word, count]) => {
      allKeywords[word] = (allKeywords[word] || 0) + count
    })
  })

  // Sort by frequency and return top keywords
  return Object.entries(allKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}

function extractBulletPoints(messages) {
  const points = []
  const seen = new Set()

  messages.forEach(msg => {
    const content = msg.content.trim()

    // Split into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)

    sentences.forEach(sentence => {
      const cleaned = sentence.trim()
      const normalized = cleaned.toLowerCase()

      // Avoid duplicates
      if (!seen.has(normalized) && cleaned.length > 30) {
        points.push({
          text: cleaned,
          author: msg.author,
          priority: cleaned.length + (msg.isFromSheet ? 10 : 0) // Prioritize synced messages
        })
        seen.add(normalized)
      }
    })
  })

  // Sort by priority and return top points
  return points.sort((a, b) => b.priority - a.priority).slice(0, 8)
}

function generateSummaryContent(messages) {
  if (messages.length === 0) {
    return '<p class="text-grey-7"><em>No descriptions available to summarize.</em></p>'
  }

  const themes = findCommonThemes(messages)
  const bulletPoints = extractBulletPoints(messages)

  let html = '<div class="summary-content">'

  // Overview section
  html += '<div class="summary-section">'
  html += '<div class="summary-section-title">Overview</div>'
  html += '<p>This summary synthesizes <strong>' + messages.length + ' team contribution' + (messages.length !== 1 ? 's' : '') + '</strong> '
  html += 'to provide a comprehensive understanding of this service line.</p>'
  html += '</div>'

  // Key themes
  if (themes.length > 0) {
    html += '<div class="summary-section">'
    html += '<div class="summary-section-title">Key Focus Areas</div>'
    html += '<div class="theme-tags">'
    themes.slice(0, 10).forEach(theme => {
      html += '<span class="theme-tag">' + theme + '</span>'
    })
    html += '</div>'
    html += '</div>'
  }

  // Key insights from team
  if (bulletPoints.length > 0) {
    html += '<div class="summary-section">'
    html += '<div class="summary-section-title">Key Insights</div>'
    html += '<ul class="insights-list">'
    bulletPoints.forEach(point => {
      html += '<li>' + point.text
      if (point.text.slice(-1) !== '.') html += '.'
      html += ' <span class="insight-author">— ' + point.author + '</span></li>'
    })
    html += '</ul>'
    html += '</div>'
  }

  // Contributors
  const contributors = [...new Set(messages.map(m => m.author))]
  html += '<div class="summary-section">'
  html += '<div class="summary-section-title">Contributors</div>'
  html += '<p class="contributors-list">' + contributors.join(', ') + '</p>'
  html += '</div>'

  html += '</div>'

  return html
}

async function regenerateMasterDescription() {
  console.log('=== REGENERATE MASTER DESCRIPTION ===')

  if (messages.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No descriptions available to generate summary'
    })
    return
  }

  isGenerating.value = true

  try {
    // Use Gemini to generate AI-powered summary
    const content = await aggregateDescriptions(messages.value, props.title)

    masterDescription.value = {
      content,
      timestamp: Date.now(),
      messageCount: messages.value.length
    }

    await saveMasterDescription()

    $q.notify({
      type: 'positive',
      message: 'AI summary generated and synced to Google Sheets!',
      icon: 'auto_awesome'
    })

    console.log('[MASTER] Generated new master description using Gemini')
  } catch (error) {
    console.error('[MASTER] Failed to generate:', error)

    // Fallback to local generation if Gemini fails
    console.log('[MASTER] Falling back to local generation')
    const content = generateSummaryContent(messages.value)

    masterDescription.value = {
      content,
      timestamp: Date.now(),
      messageCount: messages.value.length
    }

    await saveMasterDescription()

    $q.notify({
      type: 'warning',
      message: 'Generated local summary (AI service unavailable)',
      caption: error.message
    })
  } finally {
    isGenerating.value = false
  }
}

function startLeaderEdit() {
  editingLeader.value = true
  editingLeaderName.value = props.leader || ''
}

function cancelLeaderEdit() {
  editingLeader.value = false
  editingLeaderName.value = ''
}

async function saveLeaderEdit() {
  const newLeader = editingLeaderName.value.trim()

  isSavingLeader.value = true

  try {
    // Determine the level based on pathKey structure
    const pathParts = props.pathKey.split('__')
    const level = pathParts.length - 1

    // Update in Google Sheets
    await updateServiceLine(
      level,
      'leader',
      props.leader || '',
      newLeader,
      pathParts.map((name, idx) => ({ name, level: idx }))
    )

    $q.notify({
      type: 'positive',
      message: 'Leader name updated and synced to Google Sheets!',
      icon: 'check_circle'
    })

    console.log('[DescriptionThread] Updated leader successfully')

    cancelLeaderEdit()

    // Reload the page to show updated data
    setTimeout(() => {
      window.location.reload()
    }, 500)
  } catch (error) {
    console.error('[DescriptionThread] Error updating leader:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to update leader name: ' + error.message
    })
    isSavingLeader.value = false
  }
}

async function postMessage() {
  console.log('=== POST MESSAGE START ===')

  if (!canPost.value) {
    console.log('[POST] Cannot post - validation failed')
    return
  }

  isPosting.value = true

  try {
    const message = {
      author: newMessage.value.author.trim(),
      content: newMessage.value.content.trim(),
      timestamp: Date.now(),
      isFromSheet: false
    }

    console.log('[POST] New message object:', JSON.stringify(message, null, 2))
    console.log('[POST] Current messages.value length before push:', messages.value.length)

    // Add to local messages immediately
    messages.value.push(message)

    console.log('[POST] messages.value length after push:', messages.value.length)
    console.log('[POST] All messages after push:', JSON.stringify(messages.value, null, 2))

    // Save to localStorage
    saveMessages()

    // Save author name for future use
    localStorage.setItem('user_name', message.author)
    console.log('[POST] Saved author name:', message.author)

    // Try to save to Google Sheets
    try {
      await saveDescription(props.pathKey, message.author, message.content, message.timestamp)

      // Mark as synced
      message.isFromSheet = true

      $q.notify({
        type: 'positive',
        message: 'Description saved to Google Sheets!'
      })

      console.log('[POST] Successfully saved to Google Sheets')
    } catch (error) {
      console.error('[POST] Failed to save to Google Sheets:', error)

      $q.notify({
        type: 'warning',
        message: 'Description saved locally but failed to sync to Google Sheets',
        timeout: 5000
      })
    }

    // Clear content but keep author name
    newMessage.value.content = ''

    console.log('=== POST MESSAGE END ===\n')
  } finally {
    isPosting.value = false
  }
}

// Load messages when component mounts or pathKey changes
onMounted(() => {
  console.log('[LIFECYCLE] Component mounted, pathKey:', props.pathKey)
  loadMessages()
})

watch(() => props.pathKey, (newKey, oldKey) => {
  console.log('[LIFECYCLE] PathKey changed from', oldKey, 'to', newKey)
  loadMessages()
})
</script>

<style scoped>
.description-thread {
  padding: 16px;
}

.thread-header {
  margin-bottom: 8px;
}

.leader-email {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.leader-email:hover {
  color: #1565c0;
  text-decoration: underline;
}

.leader-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.leader-edit-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.leader-display:hover .leader-edit-icon {
  opacity: 0.7;
}

.leader-edit-icon:hover {
  opacity: 1 !important;
}

.leader-edit-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.leader-edit-input {
  flex: 1;
  max-width: 300px;
}

.leader-edit-actions {
  display: flex;
  gap: 4px;
}

.messages-container {
  max-height: 400px;
  overflow-y: auto;
}

.message-item {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.message-item.synced-message {
  background: #e8f5e9;
  border-left: 3px solid #4caf50;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-author {
  font-weight: 600;
  color: #1976d2;
}

.sync-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
}

.message-time {
  font-size: 0.875rem;
  color: #666;
}

.message-content {
  color: #333;
  line-height: 1.5;
  white-space: pre-wrap;
}

.no-messages {
  text-align: center;
  color: #999;
  padding: 32px;
  font-style: italic;
}

.add-message {
  margin-top: 16px;
}

/* Master Description Styles */
.master-description-card {
  background: linear-gradient(135deg, #fffbea 0%, #fff9e6 100%);
  border: 2px solid #ffd54f;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.15);
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all 0.3s ease;
}

.master-description-card:hover {
  box-shadow: 0 6px 16px rgba(255, 193, 7, 0.25);
}

.master-header {
  background: rgba(255, 248, 225, 0.6);
  padding: 12px 16px !important;
}

.master-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.master-title-section {
  display: flex;
  align-items: center;
}

.master-meta {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.master-content {
  padding: 16px !important;
  line-height: 1.6;
}

/* Summary Content Styles */
.summary-content {
  color: #424242;
}

.summary-section {
  margin-bottom: 20px;
}

.summary-section:last-child {
  margin-bottom: 0;
}

.summary-section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f57f17;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
}

.summary-section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  background: #ffd54f;
  margin-right: 8px;
  border-radius: 2px;
}

.summary-section p {
  margin: 0;
  color: #616161;
}

.theme-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.theme-tag {
  background: #fff;
  border: 1px solid #ffd54f;
  color: #f57f17;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: lowercase;
  transition: all 0.2s ease;
}

.theme-tag:hover {
  background: #fff8e1;
  transform: translateY(-1px);
}

.insights-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
  color: #424242;
}

.insights-list li {
  margin-bottom: 12px;
  line-height: 1.6;
}

.insights-list li:last-child {
  margin-bottom: 0;
}

.insight-author {
  color: #9e9e9e;
  font-size: 0.9rem;
  font-style: italic;
  font-weight: 500;
}

.contributors-list {
  color: #616161;
  font-style: italic;
}
</style>
