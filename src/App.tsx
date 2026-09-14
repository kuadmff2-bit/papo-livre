import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Paperclip, Send, Smile, MoreHorizontal, Search, Plus, FileText, Download, Link2, Users, MessageCircle, ShieldCheck, X } from 'lucide-react'

type Message = { id: string; author: string; text?: string; time: string; mine?: boolean; file?: { name: string; size: string; type: string; key?: string } }
const initialMessages: Message[] = [
  { id: '1', author: 'Marina', text: 'Gente, criei este cantinho para a gente trocar ideias sem complicação ✨', time: '10:42' },
  { id: '2', author: 'Você', text: 'Amei! Já vou mandar os arquivos da viagem.', time: '10:44', mine: true },
  { id: '3', author: 'Rafa', text: 'Perfeito. O roteiro está ficando muito bom!', time: '10:45' },
  { id: '4', author: 'Você', time: '10:46', mine: true, file: { name: 'roteiro-ferias.xlsx', size: '248 KB', type: 'XLSX' } },
]

export default function App() {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('papo-name') || '')
  const [joined, setJoined] = useState(Boolean(localStorage.getItem('papo-name')))
  const [connected, setConnected] = useState(false)
  const [searching, setSearching] = useState(false)
  const socket = useRef<WebSocket | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!joined) return
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = `${protocol}://${location.host}/api/room/amizade`
    try {
      socket.current = new WebSocket(wsUrl)
      socket.current.onopen = () => setConnected(true)
      socket.current.onclose = () => setConnected(false)
      socket.current.onmessage = (event: MessageEvent) => { const incoming = JSON.parse(String(event.data)) as Message; if (incoming.author !== name) setMessages((prev: Message[]) => [...prev, incoming]) }
    } catch { setConnected(false) }
    return () => socket.current?.close()
  }, [joined, name])

  function enter(event: FormEvent) { event.preventDefault(); if (name.trim()) { localStorage.setItem('papo-name', name.trim()); setJoined(true) } }
  function sendMessage(event?: FormEvent) {
    event?.preventDefault(); const text = draft.trim(); if (!text) return
    const message = { id: crypto.randomUUID(), author: 'Você', text, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), mine: true }
    setMessages((prev: Message[]) => [...prev, message]); setDraft(''); if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ ...message, author: name }))
  }
  async function addFile(file?: File) {
    if (!file) return
    let key = ''
    try {
      const response = await fetch('/api/upload', { method: 'POST', headers: { 'content-type': file.type }, body: file })
      if (response.ok) key = (await response.json() as { key: string }).key
    } catch { }
    const message = { id: crypto.randomUUID(), author: 'Você', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), mine: true, file: { name: file.name, size: `${Math.ceil(file.size / 1024)} KB`, type: file.name.split('.').pop()?.toUpperCase() || 'FILE', key } }
    setMessages((prev: Message[]) => [...prev, message])
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ ...message, author: name }))
  }

  if (!joined) return <main className="welcome"><div className="welcome-card"><div className="brand-mark">✦</div><p className="eyebrow">UMA SALA PARA OS SEUS</p><h1>Papo<br /><em>Livre</em></h1><p className="intro">Converse, compartilhe e fique perto de quem importa. Sem cadastro, sem ruído.</p><form onSubmit={enter}><label>Como quer ser chamado?</label><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" maxLength={30} /><button>Entrar na sala <Send size={16} /></button></form><small><ShieldCheck size={14} /> Seus dados ficam protegidos nesta sala</small></div></main>

   return <main className="app-shell">
    <aside className="sidebar"><div className="side-top"><div className="mini-brand"><span>✦</span> papo livre</div><button className="icon-button" title="Nova sala"><Plus size={19} /></button></div><div className="profile"><div className="avatar you">{name.slice(0, 1).toUpperCase()}</div><div><strong>{name}</strong><span><i className={connected ? 'online' : 'offline'} /> {connected ? 'online agora' : 'modo local'}</span></div><MoreHorizontal size={18} /></div><div className="search"><Search size={16} /><input placeholder="Procurar conversas" onFocus={() => setSearching(true)} /><kbd>⌘ K</kbd></div><div className="section-title">Suas salas <button title="Adicionar sala"><Plus size={15} /></button></div><button className="room active"><div className="room-icon"><Users size={18} /></div><div><strong>Amizade</strong><span>4 participantes</span></div><b>3</b></button><button className="room"><div className="room-icon warm"><MessageCircle size={18} /></div><div><strong>Planos de viagem</strong><span>2 participantes</span></div></button><div className="sidebar-foot"><ShieldCheck size={15} /> <span>Conversas protegidas<br />por padrão</span></div></aside>
    <section className="chat"><header className="chat-header"><div className="room-icon"><Users size={19} /></div><div><h2>Amizade <span className="live-dot" /></h2><p>Marina, Rafa e você</p></div><div className="header-actions"><button className="icon-button" title="Buscar na conversa" onClick={() => setSearching(!searching)}><Search size={19} /></button><button className="icon-button" title="Mais opções"><MoreHorizontal size={20} /></button></div></header>
      <div className="messages"> <div className="date-divider"><span>Hoje, 14 de setembro</span></div>{messages.map((message, index) => <article key={message.id} className={`message-row ${message.mine ? 'mine' : ''}`}><div className={`avatar ${message.mine ? 'you' : index % 2 ? 'rafa' : 'marina'}`}>{message.author === 'Você' ? name.slice(0, 1).toUpperCase() : message.author.slice(0, 1)}</div><div className="message-content"><div className="message-meta"><strong>{message.author}</strong><time>{message.time}</time></div>{message.text && <p className="bubble">{message.text}</p>}{message.file && <div className="file-bubble"><div className="file-icon"><FileText size={20} /></div><div><strong>{message.file.name}</strong><span>{message.file.type} · {message.file.size}</span></div><Download size={17} /></div>}</div></article>)}</div>
      <form className="composer" onSubmit={sendMessage}><input ref={fileInput} type="file" hidden accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => addFile(e.target.files?.[0])} /><button type="button" className="icon-button" title="Anexar arquivo" onClick={() => fileInput.current?.click()}><Paperclip size={20} /></button><input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Escreva uma mensagem..." /><button type="button" className="icon-button" title="Adicionar emoji"><Smile size={20} /></button><button className="send-button" title="Enviar mensagem"><Send size={18} /></button></form>
    </section>
    <aside className="details"><div className="details-title"><span>Detalhes da sala</span><button className="icon-button"><X size={18} /></button></div><div className="room-cover"><div className="cover-symbol">✦</div><h3>Amizade</h3><p>Um lugar leve para combinar a vida.</p><button className="share-button"><Link2 size={16} /> Copiar link da sala</button></div><div className="detail-block"><h4><Users size={15} /> Participantes <span>4</span></h4><div className="member"><div className="avatar marina">M</div><span>Marina <small>criadora</small></span><i className="online" /></div><div className="member"><div className="avatar rafa">R</div><span>Rafa</span><i className="online" /></div><div className="member"><div className="avatar you">{name.slice(0, 1).toUpperCase()}</div><span>{name} <small>você</small></span><i className="online" /></div></div><div className="detail-block"><h4><FileText size={15} /> Arquivos recentes <span>2</span></h4><div className="recent-file"><FileText size={17} /><span>roteiro-ferias.xlsx<small>há 2 min</small></span><Download size={15} /></div><div className="recent-file pdf"><FileText size={17} /><span>reservas.pdf<small>ontem</small></span><Download size={15} /></div></div></aside>
    {searching && <div className="search-toast">Busca rápida ativada <button onClick={() => setSearching(false)}>Fechar</button></div>}
  </main>
}
