import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, FileText, ThumbsUp, ThumbsDown, Copy, BookOpen, X,
  Paperclip, StopCircle, Plus, Pin, Trash2, Edit2, Check, Clock, Sparkles
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import api, { BASE_URL } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'

// ── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 4px' }}>
    {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
  </div>
)

// ── Citation pill ─────────────────────────────────────────────────────────────
const CitationCard = ({ citation }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, fontSize: 12, color: '#6C63FF', cursor: 'pointer', marginRight: 6, marginTop: 6 }}
    title={citation.content}
  >
    <BookOpen size={11} />
    {citation.documentTitle} · p.{citation.pageNumber}
  </motion.div>
)

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, onFeedback }) => {
  const isUser = msg.role === 'USER'
  const [copied, setCopied] = useState(false)
  const citations = msg.citations ? (typeof msg.citations === 'string' ? JSON.parse(msg.citations) : msg.citations) : []

  const copyContent = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="fade-in"
      style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: isUser ? 'linear-gradient(135deg, #6C63FF, #9c58f5)' : 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: isUser ? 'white' : 'var(--text-secondary)', fontWeight: 700 }}>
        {isUser ? '👤' : '🤖'}
      </div>

      <div style={{ maxWidth: '80%', minWidth: 100 }}>
        {isUser ? (
          <div className="chat-user">{msg.content}</div>
        ) : (
          <div className="chat-ai">
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>{children}</code>
                    )
                  }
                }}
              >{msg.content}</ReactMarkdown>
            </div>

            {citations.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Sources</p>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {citations.map((c, i) => <CitationCard key={i} citation={c} />)}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button className="btn-icon btn-sm" onClick={copyContent} title="Copy" style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn-icon btn-sm" onClick={() => onFeedback(msg.id, 'UP')} title="Good response" style={{ fontSize: 11, padding: '4px 8px' }}>
                <ThumbsUp size={12} />
              </button>
              <button className="btn-icon btn-sm" onClick={() => onFeedback(msg.id, 'DOWN')} title="Bad response" style={{ fontSize: 11, padding: '4px 8px' }}>
                <ThumbsDown size={12} />
              </button>
            </div>
          </div>
        )}
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'just now'}
        </p>
      </div>
    </motion.div>
  )
}

// ── Streaming bubble (live token-by-token rendering) ─────────────────────────
const StreamingBubble = ({ content }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}
  >
    <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
    <div className="chat-ai" style={{ minWidth: 100 }}>
      {content ? (
        <div className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          <span style={{ display: 'inline-block', width: 2, height: 14, background: '#6C63FF', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} />
        </div>
      ) : <TypingDots />}
    </div>
  </motion.div>
)

const suggestedQuestions = [
  'Summarize this document',
  'What are the key findings?',
  'Explain the main concepts',
  'What are the conclusions?',
  'List the important dates',
]

// ── Core SSE streaming utility ────────────────────────────────────────────────
const createSSEStream = (url, body) => {
  const controller = new AbortController()
  const token = localStorage.getItem('docmind_token')

  const stream = (async function* () {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try { yield JSON.parse(line.slice(6)) } catch { /* ignore */ }
        }
      }
    }
  })()

  return { stream, abort: () => controller.abort() }
}

// ── Main Chat component ───────────────────────────────────────────────────────
export default function Chat() {
  const { chatId } = useParams()
  const [searchParams] = useSearchParams()
  const docParam = searchParams.get('doc')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentChatId, setCurrentChatId] = useState(chatId || null)
  const [selectedDocs, setSelectedDocs] = useState(docParam ? [docParam] : [])
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  // ── ⚡ Reset & fetch full chat history whenever URL chatId changes ───────
  useEffect(() => {
    setCurrentChatId(chatId || null)
    setMessages([]) // Immediately clear previous messages to prevent flickering
    if (!chatId) {
      setSelectedDocs(docParam ? [docParam] : [])
    }
  }, [chatId, docParam])

  // ── Fetch chat data from backend with instant refetch ─────────────────────
  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', currentChatId],
    queryFn: () => api.get(`/chat/${currentChatId}`),
    enabled: !!currentChatId,
    staleTime: 0, // Always fetch fresh messages when opening a chat
  })

  const { data: docsData } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents'),
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    if (chatData?.chat && currentChatId) {
      setMessages(chatData.chat.messages || [])
      setTitleInput(chatData.chat.title || 'New Chat')
      const docIds = chatData.chat.chatDocuments?.map(cd => cd.documentId) || []
      if (docIds.length > 0) setSelectedDocs(docIds)
    }
  }, [chatData, currentChatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // ── Mutations: Feedback, Delete, Update ──────────────────────────────────
  const feedbackMutation = useMutation({
    mutationFn: ({ chatId, messageId, feedback }) => api.post(`/chat/${chatId}/feedback`, { messageId, feedback }),
    onSuccess: () => toast.success('Feedback saved!'),
  })

  const deleteChatMutation = useMutation({
    mutationFn: (id) => api.delete(`/chat/${id}`),
    onSuccess: () => {
      toast.success('Chat deleted')
      queryClient.invalidateQueries(['chats-sidebar'])
      queryClient.invalidateQueries(['analytics'])
      navigate('/chat', { replace: true })
    },
  })

  const updateChatMutation = useMutation({
    mutationFn: ({ id, title, isPinned }) => api.patch(`/chat/${id}`, { title, isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat', currentChatId])
      queryClient.invalidateQueries(['chats-sidebar'])
    },
  })

  const handleFeedback = (messageId, feedback) => {
    if (currentChatId) feedbackMutation.mutate({ chatId: currentChatId, messageId, feedback })
  }

  const handleDeleteChat = () => {
    if (!currentChatId) return
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChatMutation.mutate(currentChatId)
    }
  }

  const handleTogglePin = () => {
    if (!currentChatId || !chatData?.chat) return
    updateChatMutation.mutate({
      id: currentChatId,
      isPinned: !chatData.chat.isPinned,
    })
    toast.success(chatData.chat.isPinned ? 'Unpinned chat' : 'Pinned chat')
  }

  const handleSaveTitle = () => {
    if (!currentChatId || !titleInput.trim()) return
    updateChatMutation.mutate({ id: currentChatId, title: titleInput.trim() })
    setEditingTitle(false)
  }

  // ── Core send handler — zero-latency streaming ────────────────────────────
  const handleSend = useCallback(async (text) => {
    const msg = text || input.trim()
    if (!msg || streaming) return
    setInput('')

    // ⚡ Optimistic: add user message instantly (0ms perceived latency)
    const userMsg = { id: `opt_${Date.now()}`, role: 'USER', content: msg, createdAt: new Date().toISOString() }
    setMessages(m => [...m, userMsg])
    setStreaming(true)
    setStreamingContent('')

    try {
      let endpoint, activeChatId

      if (currentChatId) {
        endpoint = `${BASE_URL}/chat/${currentChatId}/message`
        activeChatId = currentChatId
        const { stream, abort } = createSSEStream(endpoint, { message: msg, documentIds: selectedDocs })
        abortRef.current = abort

        let aiContent = '', aiCitations = [], aiMessageId = null
        for await (const event of stream) {
          if (event.token) { aiContent += event.token; setStreamingContent(aiContent) }
          if (event.done) { aiCitations = event.citations || []; aiMessageId = event.messageId }
          if (event.error) toast.error(event.error)
        }

        setStreaming(false)
        setStreamingContent('')
        setMessages(m => [...m, {
          id: aiMessageId || `ai_${Date.now()}`,
          role: 'ASSISTANT', content: aiContent,
          citations: aiCitations.length > 0 ? JSON.stringify(aiCitations) : null,
          createdAt: new Date().toISOString(),
        }])

      } else {
        // ⚡ New chat: unified /api/chat/send
        const { stream, abort } = createSSEStream(`${BASE_URL}/chat/send`, {
          message: msg, documentIds: selectedDocs,
          title: msg.slice(0, 60),
        })
        abortRef.current = abort

        let aiContent = '', aiCitations = [], aiMessageId = null, newChatId = null

        for await (const event of stream) {
          if (event.type === 'init' && event.chatId) {
            newChatId = event.chatId
            setCurrentChatId(newChatId)
            navigate(`/chat/${newChatId}`, { replace: true })
          }
          if (event.token) { aiContent += event.token; setStreamingContent(aiContent) }
          if (event.done) { aiCitations = event.citations || []; aiMessageId = event.messageId }
          if (event.error) toast.error(event.error)
        }

        setStreaming(false)
        setStreamingContent('')
        activeChatId = newChatId
        setMessages(m => [...m, {
          id: aiMessageId || `ai_${Date.now()}`,
          role: 'ASSISTANT', content: aiContent,
          citations: aiCitations.length > 0 ? JSON.stringify(aiCitations) : null,
          createdAt: new Date().toISOString(),
        }])
      }

      // Refresh cache for chat & sidebar
      queryClient.invalidateQueries(['chats-sidebar'])
      queryClient.invalidateQueries(['analytics'])
      if (activeChatId) queryClient.invalidateQueries(['chat', activeChatId])

    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Send error:', err)
      toast.error(err.message || 'Failed to send message')
      setStreaming(false)
      setStreamingContent('')
      setMessages(m => m.filter(x => x.id !== userMsg.id))
    }
  }, [input, streaming, currentChatId, selectedDocs, navigate, queryClient])

  const handleStop = () => {
    abortRef.current?.()
    setStreaming(false)
    setStreamingContent('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const documents = docsData?.documents || []
  const selectedDocObjects = documents.filter(d => selectedDocs.includes(d.id))
  const isPinned = chatData?.chat?.isPinned || false

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg-primary)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── ChatGPT-like Top Header ── */}
        <div className="header-container" style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--bg-sidebar)', position: 'sticky', top: 0, zIndex: 10 }}>
          
          {/* Left: Chat Title & Document Tags */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {editingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  className="input"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  style={{ fontSize: 14, padding: '4px 8px', height: 32 }}
                />
                <button className="btn-icon btn-sm" onClick={handleSaveTitle} title="Save title"><Check size={14} color="#10b981" /></button>
                <button className="btn-icon btn-sm" onClick={() => setEditingTitle(false)} title="Cancel"><X size={14} /></button>
              </div>
            ) : (
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chatData?.chat?.title || 'New Chat'}
                  </h2>
                  {currentChatId && (
                    <button className="btn-icon btn-sm" onClick={() => { setEditingTitle(true); setTitleInput(chatData?.chat?.title || '') }} title="Rename chat">
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {selectedDocObjects.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                    {selectedDocObjects.map(d => (
                      <span key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6C63FF', background: 'rgba(108,99,255,0.08)', padding: '1px 7px', borderRadius: 6 }}>
                        <FileText size={10} /> {d.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: ChatGPT Action Controls (New Chat, Attach Docs, Pin, Delete) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/chat')} title="Start a fresh chat">
              <Plus size={14} /> New Chat
            </button>

            <button className="btn btn-secondary btn-sm" onClick={() => setShowDocPicker(p => !p)} title="Attach or select PDFs">
              <Paperclip size={13} /> {selectedDocs.length > 0 ? `${selectedDocs.length} doc${selectedDocs.length > 1 ? 's' : ''}` : 'Add Docs'}
            </button>

            {currentChatId && (
              <>
                <button className="btn-icon btn-sm" onClick={handleTogglePin} title={isPinned ? 'Unpin chat' : 'Pin chat'} style={{ color: isPinned ? '#6C63FF' : 'var(--text-muted)' }}>
                  <Pin size={15} />
                </button>

                <button className="btn-icon btn-sm" onClick={handleDeleteChat} title="Delete conversation">
                  <Trash2 size={15} color="#ef4444" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Doc picker drawer */}
        <AnimatePresence>
          {showDocPicker && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div style={{ padding: '12px 24px' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Select documents to chat with:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {documents.filter(d => d.status === 'READY').map(doc => (
                    <button key={doc.id} onClick={() => setSelectedDocs(prev => prev.includes(doc.id) ? prev.filter(x => x !== doc.id) : [...prev, doc.id])}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: `1px solid ${selectedDocs.includes(doc.id) ? '#6C63FF' : 'var(--border)'}`, background: selectedDocs.includes(doc.id) ? 'rgba(108,99,255,0.1)' : 'var(--bg-primary)', cursor: 'pointer', fontSize: 12, color: selectedDocs.includes(doc.id) ? '#6C63FF' : 'var(--text-secondary)', transition: 'all 0.15s' }}
                    >
                      <FileText size={12} /> {doc.title}
                    </button>
                  ))}
                  {documents.filter(d => d.status === 'READY').length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No ready documents. Upload a PDF first.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
          
          {/* Loading state for chat switching */}
          {chatLoading && currentChatId && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>Loading conversation...</p>
            </div>
          )}

          {/* Empty Chat Screen */}
          {messages.length === 0 && !chatLoading && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #6C63FF, #9c58f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 16px 40px rgba(108,99,255,0.3)' }}>
                <span style={{ fontSize: 30 }}>🤖</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Ask anything about your documents</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
                {selectedDocs.length > 0 ? `Ready to answer questions about ${selectedDocObjects.map(d => d.title).join(', ')}` : 'Add documents above or just start chatting'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {suggestedQuestions.map(q => (
                  <button key={q} onClick={() => handleSend(q)}
                    style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {!chatLoading && messages.map(msg => <MessageBubble key={msg.id} msg={msg} onFeedback={handleFeedback} />)}

          {/* Live streaming bubble */}
          {streaming && <StreamingBubble content={streamingContent} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your documents..."
                  disabled={streaming}
                  rows={1}
                  style={{
                    width: '100%', resize: 'none', background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--border)', borderRadius: 14, padding: '12px 16px',
                    fontSize: 14, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
                    outline: 'none', transition: 'border-color 0.2s', maxHeight: 160, overflowY: 'auto',
                    lineHeight: 1.5,
                  }}
                  onFocus={e => e.target.style.borderColor = '#6C63FF'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              {streaming ? (
                <button
                  className="btn btn-secondary"
                  onClick={handleStop}
                  style={{ padding: '12px 16px', borderRadius: 12, flexShrink: 0, color: '#ef4444', borderColor: '#ef4444' }}
                  title="Stop generation"
                >
                  <StopCircle size={18} />
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || streaming}
                  style={{ padding: '12px 16px', borderRadius: 12, flexShrink: 0 }}
                >
                  <Send size={18} />
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              DocMind AI can make mistakes. Always verify important information.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
