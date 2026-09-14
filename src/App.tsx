import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Paperclip, Send, Smile, Search, FileText, Download, Link2, Users, ShieldCheck, LogOut } from 'lucide-react'

type SharedFile = { name: string; size: string; type: string; key?: string }
type Message = { id: string; author: string; text?: string; time: string; mine?: boolean; file?: SharedFile }

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('papo-name') || '')
  const [joined, setJoined] = useState(Boolean(localStorage.getItem('papo-name')))
  const [connected, setConnected] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)
  const socket = useRef<WebSocket | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)

  const roomName = 'Papo Livre'
  const roomId = 'geral'

  useEffect(() => {
    if (!joined) return

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = `${protocol}://${location.host}/api/room/${roomId}`
    let ws: WebSocket | null = null

    try {
      ws = new WebSocket(wsUrl)
      socket.current = ws
      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onerror = () => setConnected(false)
      ws.onmessage = (event: MessageEvent) => {
        try {
          const incoming = JSON.parse(String(event.data)) as Message
          if (incoming.author !== name) {
            setMessages(prev => [...prev, { ...incoming, mine: false }])
          }
        } catch {
          // Ignora mensagens inválidas recebidas pela conexão.
        }
      }
    } catch {
      setConnected(false)
    }

    return () => {
      ws?.close()
      socket.current = null
    }
  }, [joined, name])

  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return messages
    return messages.filter(message =>
      message.text?.toLowerCase().includes(term) ||
      message.author.toLowerCase().includes(term) ||
      message.file?.name.toLowerCase().includes(term)
    )
  }, [messages, searchTerm])

  const recentFiles = useMemo(
    () => messages.filter(message => message.file?.key).slice(-5).reverse(),
    [messages]
  )

  function enter(event: FormEvent) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return
    localStorage.setItem('papo-name', cleanName)
    setName(cleanName)
    setJoined(true)
  }

  function leaveRoom() {
    socket.current?.close()
    localStorage.removeItem('papo-name')
    setMessages([])
    setDraft('')
    setSearchTerm('')
    setConnected(false)
    setJoined(false)
  }

  function sendMessage(event?: FormEvent) {
    event?.preventDefault()
    const text = draft.trim()
    if (!text) return

    const message: Message = {
      id: crypto.randomUUID(),
      author: name,
      text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    }

    setMessages(prev => [...prev, message])
    setDraft('')

    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ ...message, mine: false }))
    }
  }

  async function addFile(file?: File) {
    if (!file) return

    let key = ''
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!response.ok) throw new Error('Falha no upload')
      key = (await response.json() as { key: string }).key
    } catch {
      return
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }

    const message: Message = {
      id: crypto.randomUUID(),
      author: name,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
      file: {
        name: file.name,
        size: `${Math.max(1, Math.ceil(file.size / 1024))} KB`,
        type: file.name.split('.').pop()?.toUpperCase() || 'ARQUIVO',
        key,
      },
    }

    setMessages(prev => [...prev, message])
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ ...message, mine: false }))
    }
  }

  async function copyRoomLink() {
    try {
      await navigator.clipboard.writeText(location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  function downloadFile(file?: SharedFile) {
    if (!file?.key) return
    window.open(`/api/file/${encodeURIComponent(file.key)}`, '_blank', 'noopener,noreferrer')
  }

  if (!joined) {
    return (
      <main className="welcome">
        <div className="welcome-card">
          <div className="brand-mark">✦</div>
          <p className="eyebrow">CONVERSE SEM COMPLICAÇÃO</p>
          <h1>Papo<br /><em>Livre</em></h1>
          <p className="intro">Entre com seu nome e comece uma conversa em tempo real.</p>
          <form onSubmit={enter}>
            <label>Como quer ser chamado?</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" maxLength={30} />
            <button>Entrar na sala <Send size={16} /></button>
          </form>
          <small><ShieldCheck size={14} /> Sem conversas ou arquivos de demonstração</small>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="side-top"><div className="mini-brand"><span>✦</span> papo livre</div></div>

        <div className="profile">
          <div className="avatar you">{name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{name}</strong>
            <span><i className={connected ? 'online' : 'offline'} /> {connected ? 'conectado' : 'reconectando...'}</span>
          </div>
          <button className="icon-button" title="Sair" onClick={leaveRoom}><LogOut size={18} /></button>
        </div>

        <div className="search">
          <Search size={16} />
          <input ref={searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar mensagens" />
        </div>

        <div className="section-title">Sala</div>
        <button className="room active">
          <div className="room-icon"><Users size={18} /></div>
          <div><strong>{roomName}</strong><span>{connected ? 'online' : 'conectando'}</span></div>
        </button>

        <div className="sidebar-foot"><ShieldCheck size={15} /> <span>Sala limpa e pronta<br />para conversar</span></div>
      </aside>

      <section className="chat">
        <header className="chat-header">
          <div className="room-icon"><Users size={19} /></div>
          <div><h2>{roomName} {connected && <span className="live-dot" />}</h2><p>{connected ? 'Conversa em tempo real' : 'Tentando conectar...'}</p></div>
          <div className="header-actions">
            <button className="icon-button" title="Buscar na conversa" onClick={() => searchInput.current?.focus()}><Search size={19} /></button>
          </div>
        </header>

        <div className="messages">
          {filteredMessages.length === 0 ? (
            <div className="date-divider"><span>{searchTerm ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem ainda'}</span></div>
          ) : filteredMessages.map(message => (
            <article key={message.id} className={`message-row ${message.mine ? 'mine' : ''}`}>
              <div className={`avatar ${message.mine ? 'you' : 'marina'}`}>{message.author.slice(0, 1).toUpperCase()}</div>
              <div className="message-content">
                <div className="message-meta"><strong>{message.mine ? 'Você' : message.author}</strong><time>{message.time}</time></div>
                {message.text && <p className="bubble">{message.text}</p>}
                {message.file && (
                  <button type="button" className="file-bubble" onClick={() => downloadFile(message.file)} title="Baixar arquivo">
                    <div className="file-icon"><FileText size={20} /></div>
                    <div><strong>{message.file.name}</strong><span>{message.file.type} · {message.file.size}</span></div>
                    <Download size={17} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input ref={fileInput} type="file" hidden accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => addFile(e.target.files?.[0])} />
          <button type="button" className="icon-button" title="Anexar arquivo" onClick={() => fileInput.current?.click()}><Paperclip size={20} /></button>
          <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Escreva uma mensagem..." />
          <button type="button" className="icon-button" title="Adicionar emoji" onClick={() => setDraft(value => `${value}😊`)}><Smile size={20} /></button>
          <button className="send-button" title="Enviar mensagem" disabled={!draft.trim()}><Send size={18} /></button>
        </form>
      </section>

      <aside className="details">
        <div className="details-title"><span>Detalhes da sala</span></div>
        <div className="room-cover">
          <div className="cover-symbol">✦</div>
          <h3>{roomName}</h3>
          <p>Compartilhe o link para conversar com outras pessoas nesta sala.</p>
          <button className="share-button" onClick={copyRoomLink}><Link2 size={16} /> {copied ? 'Link copiado' : 'Copiar link da sala'}</button>
        </div>

        <div className="detail-block">
          <h4><Users size={15} /> Sua sessão</h4>
          <div className="member">
            <div className="avatar you">{name.slice(0, 1).toUpperCase()}</div>
            <span>{name} <small>você</small></span>
            <i className={connected ? 'online' : 'offline'} />
          </div>
        </div>

        <div className="detail-block">
          <h4><FileText size={15} /> Arquivos recentes <span>{recentFiles.length}</span></h4>
          {recentFiles.length === 0 ? (
            <div className="recent-file"><span>Nenhum arquivo enviado</span></div>
          ) : recentFiles.map(message => (
            <button type="button" className="recent-file" key={message.id} onClick={() => downloadFile(message.file)}>
              <FileText size={17} />
              <span>{message.file?.name}<small>{message.time}</small></span>
              <Download size={15} />
            </button>
          ))}
        </div>
      </aside>
    </main>
  )
}
