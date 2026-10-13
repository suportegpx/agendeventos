'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  role: string;
}

interface EventItem {
  id: number;
  title: string;
  location: string;
  startDatetime: string;
  endDatetime: string;
  setupStartDatetime?: string;
  status: string;
  notes?: string;
  client?: { companyName: string };
  staffAssignments: { user: { id: number; name: string; role: string } }[];
  comments: { id: number; comment: string; user: { name: string }; createdAt: string }[];
}

export default function CalendarPage() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [newComment, setNewComment] = useState('');

  // Estados de Controle de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editEventId, setEditEventId] = useState<number | null>(null);

  // Estados do formulário de novo / editar evento
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [setupStartDatetime, setSetupStartDatetime] = useState('');
  const [status, setStatus] = useState('pendente');
  const [notes, setNotes] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('agend_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchEvents(parsedUser);
    fetchTechnicians();
  }, []);

  const fetchEvents = async (currentUser: User) => {
    try {
      const res = await fetch(`/api/events?userId=${currentUser.id}&role=${currentUser.role}`);
      const data = await res.json();
      if (res.ok) setEvents(data);
    } catch (err) {
      console.error('Erro ao buscar eventos', err);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setTechnicians(data.filter((u: any) => u.role === 'TECNICO' || u.role === 'ADMIN'));
      }
    } catch (err) {
      console.error('Erro ao buscar técnicos', err);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditEventId(null);
    setTitle('');
    setClientName('');
    setLocation('');
    setStartDatetime('');
    setEndDatetime('');
    setSetupStartDatetime('');
    setStatus('pendente');
    setNotes('');
    setSelectedStaff([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ev: EventItem) => {
    setIsEditing(true);
    setEditEventId(ev.id);
    setTitle(ev.title);
    setClientName(ev.client?.companyName || '');
    setLocation(ev.location);
    setStartDatetime(ev.startDatetime ? ev.startDatetime.slice(0, 16) : '');
    setEndDatetime(ev.endDatetime ? ev.endDatetime.slice(0, 16) : '');
    setSetupStartDatetime(ev.setupStartDatetime ? ev.setupStartDatetime.slice(0, 16) : '');
    setStatus(ev.status);
    setNotes(ev.notes || '');
    setSelectedStaff(ev.staffAssignments ? ev.staffAssignments.map((s) => s.user.id) : []);
    setSelectedEvent(null); // fecha o modal de detalhes
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/events';
      const method = isEditing ? 'PUT' : 'POST';
      const bodyData = {
        ...(isEditing && { id: editEventId }),
        title,
        clientName,
        location,
        startDatetime,
        endDatetime,
        setupStartDatetime,
        status,
        notes,
        staffIds: selectedStaff,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error('Erro ao salvar evento');

      setIsModalOpen(false);
      if (user) fetchEvents(user);
    } catch (err) {
      alert('Erro ao salvar evento.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (eventId: number) => {
    if (!newComment.trim() || !user) return;
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, comment: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        if (user) fetchEvents(user);
        const updated = events.find((ev) => ev.id === eventId);
        if (updated) setSelectedEvent(updated);
      }
    } catch (err) {
      console.error('Erro ao comentar', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agend_user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-graphixBlue to-graphixPink"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Graphix Locações & Eventos</span>
            </div>
            <h1 className="text-2xl font-bold">Agenda de Eventos & Operações</h1>
            <p className="text-sm text-slate-400">
              Logado como: <strong className="text-white">{user?.name}</strong> ({user?.role})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <a
                href="/admin/users"
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Painel Admin
              </a>
            )}
            {(user?.role === 'ADMIN' || user?.role === 'COMERCIAL') && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-graphixBlue to-graphixPink text-white text-xs font-bold shadow-lg hover:opacity-90 transition-opacity"
              >
                + Novo Evento
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-red-400 hover:bg-slate-800 transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Lista de Eventos (Cards / Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setSelectedEvent(ev)}
              className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl cursor-pointer hover:border-graphixPink/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white">{ev.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-graphixBlue/30 text-blue-300 border border-graphixBlue/50">
                    {ev.status}
                  </span>
                </div>

                {ev.client && (
                  <p className="text-xs text-graphixPink font-semibold mb-2">Cliente: {ev.client.companyName}</p>
                )}

                <p className="text-xs text-slate-400 mb-4">📍 {ev.location}</p>

                <div className="space-y-1 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 mb-4">
                  <p>🕒 <strong>Início Evento:</strong> {new Date(ev.startDatetime).toLocaleString('pt-BR')}</p>
                  {ev.setupStartDatetime && (
                    <p className="text-amber-400">🛠️ <strong>Montagem:</strong> {new Date(ev.setupStartDatetime).toLocaleString('pt-BR')}</p>
                  )}
                </div>

                {/* Técnicos Escalados */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Equipe Escalada:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.staffAssignments && ev.staffAssignments.length > 0 ? (
                      ev.staffAssignments.map((st, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200">
                          {st.user.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">Nenhum técnico escalado ainda.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-indigo-400 font-medium pt-3 border-t border-slate-800/80 flex justify-between items-center">
                <span>💬 {ev.comments.length} comentário(s)</span>
                <span>Ver detalhes &rarr;</span>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="col-span-full text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <p className="text-slate-400 text-sm">Nenhum evento cadastrado no momento.</p>
            </div>
          )}
        </div>

        {/* Modal de Cadastro / Edição de Evento */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-white">
                {isEditing ? 'Editar Evento' : 'Cadastrar Novo Evento'}
              </h2>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Título do Evento</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Formação Direito - UFMG"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Empresa / Cliente</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Local / Endereço Completo</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="Rua, Número, Bairro - Cidade"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">🛠️ Início da Montagem</label>
                    <div className="relative flex items-center">
                      <input
                        type="datetime-local"
                        value={setupStartDatetime}
                        onChange={(e) => setSetupStartDatetime(e.target.value)}
                        onClick={(e) => {
                          try {
                            (e.target as HTMLInputElement).showPicker();
                          } catch (err) {}
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-graphixPink cursor-pointer pr-10"
                      />
                      <span className="absolute right-3 pointer-events-none text-slate-400">📅</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">📅 Início do Evento *</label>
                    <div className="relative flex items-center">
                      <input
                        type="datetime-local"
                        value={startDatetime}
                        onChange={(e) => setStartDatetime(e.target.value)}
                        required
                        onClick={(e) => {
                          try {
                            (e.target as HTMLInputElement).showPicker();
                          } catch (err) {}
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-graphixPink cursor-pointer pr-10"
                      />
                      <span className="absolute right-3 pointer-events-none text-slate-400">📅</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">🏁 Fim do Evento *</label>
                  <div className="relative flex items-center">
                    <input
                      type="datetime-local"
                      value={endDatetime}
                      onChange={(e) => setEndDatetime(e.target.value)}
                      required
                      onClick={(e) => {
                        try {
                          (e.target as HTMLInputElement).showPicker();
                        } catch (err) {}
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-graphixPink cursor-pointer pr-10"
                    />
                    <span className="absolute right-3 pointer-events-none text-slate-400">📅</span>
                  </div>
                </div>

                {isEditing && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Status do Evento</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                )}

                {/* Escala de Técnicos */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Escalar Técnicos / Operadores</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-36 overflow-y-auto space-y-2">
                    {technicians.map((tech) => (
                      <label key={tech.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          value={tech.id}
                          checked={selectedStaff.includes(tech.id)}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            setSelectedStaff(
                              e.target.checked
                                ? [...selectedStaff, id]
                                : selectedStaff.filter((i) => i !== id)
                            );
                          }}
                          className="rounded bg-slate-900 border-slate-700 text-graphixPink focus:ring-0"
                        />
                        {tech.name} <span className="text-slate-500">({tech.role})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Observações / Equipamentos</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                    placeholder="Ex: Levar painel LED 5x3, cabos extras..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-graphixBlue to-graphixPink text-white text-xs font-bold shadow hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : isEditing ? 'Atualizar Evento' : 'Salvar Evento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Detalhes do Evento & Comentários */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedEvent.title}</h2>
                  {selectedEvent.client && (
                    <p className="text-xs text-graphixPink font-semibold">Cliente: {selectedEvent.client.companyName}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 mb-6 overflow-y-auto pr-1">
                <p>📍 <strong>Local:</strong> {selectedEvent.location}</p>
                <p>🕒 <strong>Início:</strong> {new Date(selectedEvent.startDatetime).toLocaleString('pt-BR')}</p>
                {selectedEvent.setupStartDatetime && (
                  <p className="text-amber-400">🛠️ <strong>Montagem:</strong> {new Date(selectedEvent.setupStartDatetime).toLocaleString('pt-BR')}</p>
                )}
                {selectedEvent.notes && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-1">Observações:</strong>
                    <p className="text-slate-400">{selectedEvent.notes}</p>
                  </div>
                )}

                {/* Comentários / Comunicação */}
                <div className="border-t border-slate-800 pt-4 mt-4">
                  <h3 className="font-bold text-white mb-3">Comunicação e Notas da Equipe</h3>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                    {selectedEvent.comments.map((c) => (
                      <div key={c.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-graphixPink">{c.user.name}</span>
                          <span className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="text-slate-300">{c.comment}</p>
                      </div>
                    ))}
                    {selectedEvent.comments.length === 0 && (
                      <p className="text-slate-500 italic">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                    )}
                  </div>

                  {/* Input para adicionar comentário */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Adicionar comentário ou status..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-graphixPink"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(selectedEvent.id)}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                {(user?.role === 'ADMIN' || user?.role === 'COMERCIAL') && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedEvent)}
                    className="px-4 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition-colors"
                  >
                    ✏️ Editar Evento
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 ml-auto"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}