<template>
  <div class="description-thread">
    <div class="thread-header">
      <div class="text-h6">{{ title }}</div>
      <div v-if="leader" class="text-subtitle2 text-grey-7">
        Leader: {{ leader }}
      </div>
    </div>

    <q-separator class="q-my-md" />

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
        :disable="!canPost"
        unelevated
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { fetchDescriptions, saveDescription } from '../services/googleSheets'

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

const sortedMessages = computed(() => {
  return [...messages.value].sort((a, b) => b.timestamp - a.timestamp)
})

const canPost = computed(() => {
  return newMessage.value.author.trim() && newMessage.value.content.trim()
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

async function postMessage() {
  console.log('=== POST MESSAGE START ===')

  if (!canPost.value) {
    console.log('[POST] Cannot post - validation failed')
    return
  }

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
</style>
