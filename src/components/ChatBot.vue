<template>
  <div class="chat-container">
    <q-scroll-area class="chat-messages" ref="scrollArea">
      <q-chat-message
        v-for="(msg, index) in messages"
        :key="index"
        :text="[msg.content]"
        :sent="msg.role === 'user'"
        :bg-color="msg.role === 'user' ? 'primary' : 'grey-3'"
        :text-color="msg.role === 'user' ? 'white' : 'black'"
      />
    </q-scroll-area>

    <div class="chat-input q-pa-md">
      <q-input
        v-model="inputMessage"
        placeholder="Ask about service lines for your enterprise application..."
        filled
        dense
        @keyup.enter="sendMessage"
      >
        <template v-slot:append>
          <q-btn
            round
            dense
            flat
            icon="send"
            color="primary"
            @click="sendMessage"
          />
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  treeData: {
    type: Array,
    required: true
  }
})

const messages = ref([
  {
    role: 'assistant',
    content: 'Hello! I can help you identify which service lines would be most relevant for your enterprise application. Tell me about your project and I\'ll guide you to the right teams.'
  }
])

const inputMessage = ref('')
const scrollArea = ref(null)

function sendMessage() {
  if (!inputMessage.value.trim()) return

  messages.value.push({
    role: 'user',
    content: inputMessage.value
  })

  const response = generateResponse(inputMessage.value)
  inputMessage.value = ''

  messages.value.push({
    role: 'assistant',
    content: response
  })

  nextTick(() => {
    if (scrollArea.value) {
      scrollArea.value.setScrollPercentage('vertical', 1)
    }
  })
}

function generateResponse(question) {
  const lowerQ = question.toLowerCase()

  // Search through tree data for relevant matches
  const matches = searchTree(props.treeData, lowerQ)

  if (matches.length > 0) {
    let response = 'Based on your question, I recommend these service lines:\n\n'
    matches.forEach(match => {
      response += `• ${match.path}\n`
      if (match.description) {
        response += `  ${match.description}\n`
      }
    })
    return response
  }

  // Keyword-based fallbacks
  if (lowerQ.includes('salesforce') || lowerQ.includes('crm')) {
    return 'For Salesforce-related projects, I recommend:\n\n• Business Applications > Salesforce > Salesforce Core\n• Business Applications > Salesforce > Salesforce Technical\n\nThese teams specialize in Salesforce implementations and CRM solutions.'
  }

  if (lowerQ.includes('data') || lowerQ.includes('analytics')) {
    return 'For data and analytics projects, consider:\n\n• Data and Digital Services > DDS App Dev and Integration\n\nThis service line can help with data integration, migration, and analytics solutions.'
  }

  if (lowerQ.includes('cloud') || lowerQ.includes('azure') || lowerQ.includes('aws')) {
    return 'For cloud applications, I suggest:\n\n• Business Applications > Cloud Native\n• Data and Digital Services > DDS App Dev and Integration > DDS AD Cloud App Engineering\n\nThese teams have expertise in cloud-native application development.'
  }

  if (lowerQ.includes('microsoft') || lowerQ.includes('d365') || lowerQ.includes('dynamics')) {
    return 'For Microsoft Dynamics 365 projects, check out:\n\n• Business Applications > D365 > Business Central\n• Business Applications > D365 > Customer Engagement\n• Business Applications > D365 > Enterprise\n\nThese teams specialize in various D365 implementations.'
  }

  if (lowerQ.includes('integration') || lowerQ.includes('api')) {
    return 'For integration projects, I recommend:\n\n• Data and Digital Services > DDS App Dev and Integration > DDS AD Enterprise Integration and Mig\n\nThis team handles enterprise integration and API development.'
  }

  return 'I can help you navigate our service lines! Try asking about:\n\n• Specific technologies (Salesforce, D365, data analytics, cloud)\n• Types of projects (integration, custom apps, testing)\n• Business applications you need to work with\n\nOr browse the Navigate and Tree View tabs to explore all available service lines.'
}

function searchTree(nodes, query, path = '') {
  const results = []

  nodes.forEach(node => {
    const currentPath = path ? `${path} > ${node.name}` : node.name
    const nameMatch = node.name.toLowerCase().includes(query)
    const descMatch = node.description && node.description.toLowerCase().includes(query)

    if (nameMatch || descMatch) {
      results.push({
        path: currentPath,
        description: node.description,
        leader: node.leader
      })
    }

    if (node.children && node.children.length > 0) {
      results.push(...searchTree(node.children, query, currentPath))
    }
  })

  return results
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chat-messages {
  flex: 1;
  background: #f5f5f5;
}

.chat-input {
  border-top: 1px solid #e0e0e0;
}
</style>
