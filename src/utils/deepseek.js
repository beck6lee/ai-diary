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

要求：
- 保持用户原意，不要过度加工
- 口语内容转为简洁书面语
- 没有提到的章节直接省略，不要补充空内容
- 如果输入内容过少，如实记录，不要发挥补充
- 只输出日记正文，不要输出任何解释性文字、前缀或道歉`

export async function streamDiary(rawContent, apiKey, { onChunk, onDone, onError }) {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: rawContent },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

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
