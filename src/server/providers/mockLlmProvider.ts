import type { LlmProvider, LlmQuery, LlmResult } from './types.js'

export class MockLlmProvider implements LlmProvider {
  async chat(query: LlmQuery): Promise<LlmResult> {
    const delay = Math.floor(Math.random() * 500) + 200
    await new Promise((r) => setTimeout(r, delay))

    const lastUserMsg = [...query.messages].reverse().find((m) => m.role === 'user')
    const input = lastUserMsg?.content || ''

    let content: string
    if (input.includes('行程') || input.includes('计划')) {
      content = JSON.stringify({
        destination: '北京',
        startDate: '2025-04-05',
        endDate: '2025-04-06',
        dailyPlans: [
          {
            date: '2025-04-05',
            theme: '历史文化之旅',
            items: [
              { time: '09:00', activity: '故宫博物院', location: '景山前街4号', estimatedCost: 60 },
              { time: '12:00', activity: '午餐：全聚德烤鸭', location: '前门大街30号', estimatedCost: 150 },
              { time: '14:00', activity: '南锣鼓巷漫步', location: '南锣鼓巷', estimatedCost: 0 },
              { time: '17:00', activity: '什刹海日落', location: '什刹海', estimatedCost: 0 },
            ],
          },
        ],
        totalEstimatedCost: 210,
        tips: ['建议提前预约故宫门票', '春天适合户外活动'],
      })
    } else {
      content = '我是周末出行规划助手，可以帮您规划行程。请告诉我您想去哪里、预算多少、和谁一起出行？'
    }

    const promptTokens = Math.ceil(input.length / 4)
    const completionTokens = Math.ceil(content.length / 4)

    return {
      content,
      model: query.model || 'mock-model',
      usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
      latencyMs: delay,
    }
  }
}
