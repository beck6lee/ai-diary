import { describe, it, expect, vi, beforeEach } from 'vitest'
import { streamDiary } from '../src/utils/deepseek.js'

// 构造模拟 SSE 流
function makeSSEStream(chunks) {
  const lines = chunks
    .map((text) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`)
    .join('')
  const done = 'data: [DONE]\n\n'
  const body = lines + done
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body))
      controller.close()
    },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('streamDiary', () => {
  it('calls onChunk for each text delta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: makeSSEStream(['## 今日工作\n', '- 开会\n']),
    }))

    const chunks = []
    await streamDiary('今天开了个会', 'sk-test', {
      onChunk: (text) => chunks.push(text),
      onDone: vi.fn(),
      onError: vi.fn(),
    })

    expect(chunks).toEqual(['## 今日工作\n', '- 开会\n'])
  })

  it('calls onDone when stream ends normally', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: makeSSEStream(['完成']),
    }))

    const onDone = vi.fn()
    await streamDiary('内容', 'sk-test', {
      onChunk: vi.fn(),
      onDone,
      onError: vi.fn(),
    })

    expect(onDone).toHaveBeenCalledOnce()
  })

  it('calls onError when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }))

    const onError = vi.fn()
    await streamDiary('内容', 'sk-bad-key', {
      onChunk: vi.fn(),
      onDone: vi.fn(),
      onError,
    })

    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].message).toContain('401')
  })

  it('calls onError when fetch throws (network failure)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')))

    const onError = vi.fn()
    await streamDiary('内容', 'sk-test', {
      onChunk: vi.fn(),
      onDone: vi.fn(),
      onError,
    })

    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].message).toBe('Network Error')
  })

  it('correctly handles split-packet SSE (buffer logic)', async () => {
    // 模拟一次 read() 只返回半行，下一次返回另一半
    const encoder = new TextEncoder()
    const part1 = 'data: {"choices":[{"delta":{"con'
    const part2 = 'tent":"hello"}}]}\n\ndata: [DONE]\n\n'
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(part1))
        controller.enqueue(encoder.encode(part2))
        controller.close()
      },
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: stream }))

    const chunks = []
    const onDone = vi.fn()
    await streamDiary('内容', 'sk-test', {
      onChunk: (text) => chunks.push(text),
      onDone,
      onError: vi.fn(),
    })

    expect(chunks).toEqual(['hello'])
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('sends correct Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: makeSSEStream([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    await streamDiary('内容', 'sk-mykey', {
      onChunk: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    })

    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers['Authorization']).toBe('Bearer sk-mykey')
  })
})
