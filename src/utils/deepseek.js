const API_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

const SYSTEM_PROMPT = `你是一个日记整理助手。用户会输入今天发生的事情（口语化、碎片化），
你需要将其整理成结构化的日记，使用以下 Markdown 格式：

## 今日工作
- （工作/学习相关内容）

## 想法 / 灵感
（有想法则写，没有则省略此节）

## 知识碎片
- （学到的东西，没有则省略）

## 复盘
### 做到了什么
### 哪里卡住了

时间处理规则：
- 每条原始记录开头有提交时间标记 【HH:MM】，代表该条记录的提交时间
- 如果用户在文本中明确说明了发生时间（如"上午10点"、"下午3点半"、"10:30做了某事"），以用户说的时间为准，转换为24小时制
- 每个整理后的条目，在文字前加上时间标记，格式：\`(HH:MM)\` ，例如：\`- (14:30) 开了个项目会议\`
- 时间仅标注在有明确时间的条目上；如果确实无法判断时间，使用提交时间

要求：
- 保持用户原意，不要过度加工
- 口语内容转为简洁书面语
- 没有提到的章节直接省略，不要补充空内容
- 如果输入内容过少，如实记录，不要发挥补充
- 只输出日记正文，不要输出任何解释性文字、前缀或道歉`

const SYSTEM_PROMPT_UPDATE = `你是一个日记整理助手。用户已有一篇今天的日记（Markdown格式），现在新增了一条原始记录，需要将新记录整合进已有日记。

规则：
- 将新记录内容整合到最合适的章节（今日工作 / 想法·灵感 / 知识碎片 / 复盘）
- 如果合适的章节不存在，在日记末尾新增该章节
- 已有内容不要改动，不要删减，不要改写
- 时间处理：新记录开头有【HH:MM】提交时间；如果用户在记录中明确说了时间，以用户说的为准，转24小时制，格式：\`(HH:MM)\`；无法判断时间则用提交时间
- 只输出完整日记正文（已有内容+新增内容），不要任何解释或前缀`

export async function extractTodosIncremental(rawContent, pendingTodos, apiKey) {
  const hasPending = pendingTodos.length > 0
  const sysMsg = hasPending
    ? '分析日记记录，结合当前待办列表，只返回 JSON 对象：{"add":["新待办"],"complete":["已完成待办原文"]}。add 是记录中出现的新待办（未在当前列表中）；complete 是当前列表中在记录里明确已完成的项（使用列表原文）。没有则返回空数组。只返回 JSON，不要任何其他文字。'
    : '分析日记记录，提取需要行动的待办事项（已完成的除外），只返回 JSON：{"add":["待办1"],"complete":[]}。只返回 JSON，不要任何其他文字。'

  const userMsg = hasPending
    ? `【日记记录】\n${rawContent}\n\n【当前待办】\n${pendingTodos.map(t => `- ${t.text}`).join('\n')}`
    : rawContent

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [
        { role: 'system', content: sysMsg },
        { role: 'user', content: userMsg },
      ],
    }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  const raw = json.choices?.[0]?.message?.content?.trim() || '{}'
  const clean = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
  try {
    const result = JSON.parse(clean)
    return {
      add: Array.isArray(result.add) ? result.add.map(s => String(s).trim()).filter(Boolean) : [],
      complete: Array.isArray(result.complete) ? result.complete.map(s => String(s).trim()).filter(Boolean) : [],
    }
  } catch {
    return { add: [], complete: [] }
  }
}

export async function streamDiary(rawContent, apiKey, { onChunk, onDone, onError }, existingDiary = null) {
  try {
    const isIncremental = existingDiary !== null && existingDiary.trim() !== ''
    const messages = isIncremental
      ? [
          { role: 'system', content: SYSTEM_PROMPT_UPDATE },
          { role: 'user', content: `【已有日记】\n${existingDiary}\n\n【新增记录】\n${rawContent}` },
        ]
      : [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: rawContent },
        ]

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages,
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!response.body) throw new Error('响应体为空')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // 最后一行可能不完整，留到下次

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') {
          reader.cancel()  // 释放底层连接
          onDone()
          return
        }
        try {
          const json = JSON.parse(payload)
          const text = json.choices?.[0]?.delta?.content
          if (text) onChunk(text)
        } catch {
          // 忽略无法解析的行
        }
      }
    }

    onDone()
  } catch (err) {
    onError(err)
  }
}
