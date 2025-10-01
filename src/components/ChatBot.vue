<template>
  <div class="chatbot-container">
    <!-- Header -->
    <div class="chatbot-header q-pa-md">
      <div class="text-h5 text-weight-bold">Service Line Advisor</div>
      <div class="text-subtitle2 text-grey-7">
        Describe your business requirements and get intelligent recommendations
      </div>
    </div>

    <q-separator />

    <!-- Input Section -->
    <div class="input-section q-pa-md">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">
            Business Requirements
          </div>
          <q-input
            v-model="requirements"
            type="textarea"
            filled
            placeholder="Example: We need to migrate our legacy CRM system to a modern cloud-based solution, integrate it with our existing ERP system, and implement advanced analytics dashboards for sales forecasting..."
            rows="6"
            counter
            maxlength="2000"
            :disable="isAnalyzing"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn
            label="Clear"
            flat
            color="grey"
            @click="clearAnalysis"
            :disable="isAnalyzing"
          />
          <q-btn
            label="Analyze Requirements"
            color="primary"
            unelevated
            icon="psychology"
            @click="analyzeRequirements"
            :loading="isAnalyzing"
            :disable="!requirements.trim() || isAnalyzing"
          />
        </q-card-actions>
      </q-card>
    </div>

    <!-- Results Section -->
    <div v-if="recommendations.length > 0" class="results-section q-pa-md">
      <div class="text-h6 text-weight-bold q-mb-md">
        Recommended Service Lines
      </div>

      <div class="recommendations-grid">
        <q-card
          v-for="(rec, index) in recommendations"
          :key="index"
          class="recommendation-card"
          flat
          bordered
        >
          <q-card-section class="bg-primary text-white">
            <div class="row items-center justify-between">
              <div class="col">
                <div class="text-overline">Priority {{ index + 1 }}</div>
                <div class="text-h6 text-weight-bold">{{ rec.serviceLine }}</div>
              </div>
              <div class="col-auto">
                <q-chip
                  :label="`${rec.relevanceScore}% Match`"
                  color="white"
                  text-color="primary"
                  class="text-weight-bold"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="service-path q-mb-md">
              <q-icon name="account_tree" size="20px" color="grey-7" class="q-mr-xs" />
              <span class="text-grey-8">{{ rec.fullPath }}</span>
            </div>

            <div class="q-mb-md">
              <div class="text-subtitle2 text-weight-medium q-mb-xs">Why This Service Line?</div>
              <div class="reasoning-text">{{ rec.reasoning }}</div>
            </div>

            <q-separator class="q-my-md" />

            <div class="leader-section">
              <div class="text-subtitle2 text-weight-medium q-mb-sm">Point of Contact</div>
              <div v-if="rec.leaders && rec.leaders.length > 0">
                <div
                  v-for="(leader, idx) in rec.leaders"
                  :key="idx"
                  class="leader-item q-mb-sm"
                >
                  <q-chip
                    :icon="leader.level === 'L1' ? 'person' : leader.level === 'L2' ? 'group' : 'groups'"
                    :color="getLeaderColor(leader.level)"
                    text-color="white"
                    size="sm"
                  >
                    {{ leader.level }}
                  </q-chip>
                  <span class="text-weight-medium">{{ leader.name || 'TBD' }}</span>
                </div>
              </div>
              <div v-else class="text-grey-6 text-italic">
                No leader information available
              </div>
            </div>

            <!-- Additional Context from Descriptions -->
            <div v-if="rec.descriptions && rec.descriptions.length > 0" class="q-mt-md">
              <q-separator class="q-mb-md" />
              <div class="text-subtitle2 text-weight-medium q-mb-sm">
                Team Insights
              </div>
              <q-list dense bordered class="rounded-borders">
                <q-item
                  v-for="(desc, idx) in rec.descriptions.slice(0, 2)"
                  :key="idx"
                  class="description-item"
                >
                  <q-item-section>
                    <q-item-label class="text-caption text-grey-7">
                      {{ desc.author }} - {{ formatDate(desc.timestamp) }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-9">
                      {{ truncateText(desc.content, 150) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-if="rec.descriptions.length > 2" class="text-caption text-grey-6 q-mt-xs">
                + {{ rec.descriptions.length - 2 }} more insights available
              </div>
            </div>
          </q-card-section>

          <q-card-actions>
            <q-btn
              flat
              color="primary"
              label="View Details"
              icon="arrow_forward"
              @click="navigateToServiceLine(rec)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isAnalyzing" class="empty-state q-pa-xl text-center">
      <q-icon name="lightbulb_outline" size="80px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">
        Intelligent Service Line Matching
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm" style="max-width: 600px; margin: 0 auto;">
        Enter your business requirements above, and our intelligent advisor will analyze your needs
        against our entire service catalog to recommend the most relevant teams and points of contact.
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isAnalyzing" class="loading-state q-pa-xl text-center">
      <q-spinner-dots size="60px" color="primary" />
      <div class="text-h6 text-grey-7 q-mt-md">
        Analyzing your requirements...
      </div>
      <div class="text-body2 text-grey-6 q-mt-sm">
        Matching against {{ totalServiceLines }} service lines and their descriptions
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchDescriptions } from '../services/googleSheets'

const props = defineProps({
  serviceData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['navigate-to-path'])

const requirements = ref('')
const recommendations = ref([])
const isAnalyzing = ref(false)
const allDescriptions = ref([])

const totalServiceLines = computed(() => {
  return props.serviceData.length
})

// Load descriptions on mount
onMounted(async () => {
  try {
    allDescriptions.value = await fetchDescriptions()
    console.log('[ChatBot] Loaded', allDescriptions.value.length, 'descriptions for analysis')
  } catch (error) {
    console.error('[ChatBot] Failed to load descriptions:', error)
  }
})

function getLeaderColor(level) {
  const colors = {
    L1: 'deep-purple',
    L2: 'indigo',
    L3: 'blue',
    L4: 'cyan'
  }
  return colors[level] || 'grey'
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

async function analyzeRequirements() {
  if (!requirements.value.trim()) return

  isAnalyzing.value = true
  recommendations.value = []

  try {
    // Simulate some processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 800))

    const matches = analyzeServiceLines(requirements.value.toLowerCase())
    recommendations.value = matches.slice(0, 6) // Top 6 recommendations

    console.log('[ChatBot] Generated', recommendations.value.length, 'recommendations')
  } catch (error) {
    console.error('[ChatBot] Analysis error:', error)
  } finally {
    isAnalyzing.value = false
  }
}

function analyzeServiceLines(requirementsText) {
  // Keywords mapping to service line patterns
  const keywords = {
    // CRM & Business Apps
    crm: ['salesforce', 'customer relationship', 'sales automation', 'lead management'],
    salesforce: ['salesforce', 'sfdc', 'sales cloud', 'service cloud'],
    microsoft: ['dynamics', 'd365', 'microsoft', 'power platform', 'power apps'],
    erp: ['erp', 'enterprise resource', 'financial system', 'accounting system'],

    // Cloud & Infrastructure
    cloud: ['cloud', 'aws', 'azure', 'gcp', 'cloud migration', 'cloud native'],
    azure: ['azure', 'microsoft cloud', 'az-'],
    aws: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
    infrastructure: ['infrastructure', 'devops', 'deployment', 'hosting'],

    // Data & Analytics
    data: ['data', 'analytics', 'reporting', 'dashboard', 'bi', 'business intelligence'],
    analytics: ['analytics', 'insights', 'metrics', 'kpi', 'visualization'],
    migration: ['migration', 'migrate', 'move', 'transfer', 'modernize'],
    etl: ['etl', 'data pipeline', 'data integration', 'data warehouse'],

    // Integration & APIs
    integration: ['integration', 'connect', 'api', 'middleware', 'interface'],
    api: ['api', 'rest', 'web service', 'endpoint', 'microservice'],

    // AI & Automation
    ai: ['ai', 'artificial intelligence', 'machine learning', 'ml model'],
    automation: ['automation', 'workflow', 'process automation', 'rpa'],

    // Testing & Quality
    testing: ['testing', 'qa', 'quality assurance', 'test automation'],
    performance: ['performance', 'load testing', 'optimization', 'speed']
  }

  const matches = []

  // Analyze each row in service data
  props.serviceData.forEach(row => {
    const l1 = row['Service Line (L1)'] || ''
    const l2 = row['Capability (L2)'] || ''
    const l3 = row['Solution Set (L3)'] || ''
    const l4 = row['Sub-function (L4)'] || ''

    if (!l1 || l1 === '—') return

    let score = 0
    let matchedKeywords = []
    let reasoning = []

    // Create searchable text from service line names
    const serviceLineText = `${l1} ${l2} ${l3} ${l4}`.toLowerCase()

    // Check direct name matches (high score)
    if (serviceLineText.includes('salesforce') && requirementsText.includes('salesforce')) {
      score += 30
      matchedKeywords.push('Salesforce')
      reasoning.push('Direct match with Salesforce platform')
    }

    if (serviceLineText.includes('d365') || serviceLineText.includes('dynamics')) {
      if (requirementsText.includes('dynamics') || requirementsText.includes('d365') || requirementsText.includes('microsoft')) {
        score += 30
        matchedKeywords.push('Microsoft Dynamics')
        reasoning.push('Specialized in Microsoft Dynamics 365 platform')
      }
    }

    // Check keyword matches
    Object.entries(keywords).forEach(([key, patterns]) => {
      const hasPatternMatch = patterns.some(pattern =>
        requirementsText.includes(pattern) && serviceLineText.includes(key)
      )

      if (hasPatternMatch) {
        score += 15
        matchedKeywords.push(key)
      }
    })

    // Contextual analysis
    if (requirementsText.includes('crm') || requirementsText.includes('customer')) {
      if (l1.toLowerCase().includes('business') || serviceLineText.includes('salesforce')) {
        score += 20
        reasoning.push('Business Applications teams handle CRM implementations')
      }
    }

    if (requirementsText.includes('cloud') || requirementsText.includes('migration')) {
      if (serviceLineText.includes('cloud') || serviceLineText.includes('infrastructure')) {
        score += 20
        reasoning.push('Expertise in cloud migration and modernization')
      }
    }

    if (requirementsText.includes('data') || requirementsText.includes('analytics')) {
      if (serviceLineText.includes('data') || serviceLineText.includes('analytics')) {
        score += 20
        reasoning.push('Specialized in data solutions and analytics')
      }
    }

    if (requirementsText.includes('integration') || requirementsText.includes('api')) {
      if (serviceLineText.includes('integration') || serviceLineText.includes('api')) {
        score += 20
        reasoning.push('Expert in system integration and API development')
      }
    }

    if (requirementsText.includes('testing') || requirementsText.includes('quality')) {
      if (serviceLineText.includes('test') || serviceLineText.includes('qa')) {
        score += 20
        reasoning.push('Quality assurance and testing expertise')
      }
    }

    if (requirementsText.includes('automation') || requirementsText.includes('ai')) {
      if (serviceLineText.includes('automation') || serviceLineText.includes('ai')) {
        score += 20
        reasoning.push('AI and automation capabilities')
      }
    }

    // Check descriptions for additional context
    const pathKey = buildPathKey([l1, l2, l3, l4].filter(x => x && x !== '—'))
    const relatedDescriptions = allDescriptions.value.filter(desc => desc.pathKey === pathKey)

    relatedDescriptions.forEach(desc => {
      const descText = desc.content.toLowerCase()
      Object.entries(keywords).forEach(([key, patterns]) => {
        patterns.forEach(pattern => {
          if (requirementsText.includes(pattern) && descText.includes(pattern)) {
            score += 5
            reasoning.push(`Team has documented experience with ${pattern}`)
          }
        })
      })
    })

    if (score > 0) {
      // Build full path for display
      const pathParts = [l1, l2, l3, l4].filter(x => x && x !== '—')
      const fullPath = pathParts.join(' > ')

      // Get leaders
      const leaders = []
      if (row['Service Line (L1) Leader']) {
        leaders.push({ level: 'L1', name: row['Service Line (L1) Leader'] })
      }
      if (l2 && l2 !== '—' && row['Capability (L2) Leader']) {
        leaders.push({ level: 'L2', name: row['Capability (L2) Leader'] })
      }
      if (l3 && l3 !== '—' && row['Solution Set (L3) Leader']) {
        leaders.push({ level: 'L3', name: row['Solution Set (L3) Leader'] })
      }
      if (l4 && l4 !== '—' && row['Sub-function Leader']) {
        leaders.push({ level: 'L4', name: row['Sub-function Leader'] })
      }

      // Build reasoning text
      let reasoningText = 'This service line is recommended because: '
      if (reasoning.length > 0) {
        reasoningText += reasoning.join('; ')
      } else {
        reasoningText += 'it matches your requirements based on capabilities and focus areas'
      }

      matches.push({
        serviceLine: pathParts[pathParts.length - 1], // Last part
        fullPath,
        relevanceScore: Math.min(Math.round(score), 99),
        reasoning: reasoningText,
        leaders,
        descriptions: relatedDescriptions,
        pathParts,
        rawRow: row
      })
    }
  })

  // Sort by score and return
  return matches.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

function buildPathKey(parts) {
  return parts.join('__')
}

function clearAnalysis() {
  requirements.value = ''
  recommendations.value = []
}

function navigateToServiceLine(recommendation) {
  // Emit event to navigate to this service line in the Navigate view
  console.log('[ChatBot] Navigate to:', recommendation.pathParts)
  emit('navigate-to-path', recommendation.pathParts)
}
</script>

<style scoped>
.chatbot-container {
  max-width: 1400px;
  margin: 0 auto;
}

.chatbot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.input-section {
  background: #f8f9fa;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.recommendation-card {
  transition: all 0.3s ease;
  border-left: 4px solid #667eea;
}

.recommendation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.service-path {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
}

.reasoning-text {
  color: #424242;
  line-height: 1.6;
  font-size: 0.9rem;
}

.leader-section {
  background: #fafafa;
  padding: 12px;
  border-radius: 8px;
}

.leader-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.description-item {
  background: #f9f9f9;
}

.empty-state {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-state {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
