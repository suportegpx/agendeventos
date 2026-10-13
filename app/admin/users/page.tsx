'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TECNICO');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Estados para o Modal de Edição
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('TECNICO');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error('Erro ao buscar usuários', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário');

      setMessage('Usuário criado com sucesso!');
      setName('');
      setEmail('');
      setPassword('');
      setRole('TECNICO');
      fetchUsers();
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir');
      fetchUsers();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword(''); // Senha fica em branco por segurança (só altera se quiser)
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          password: editPassword,
          role: editRole,
          active: editingUser.active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar');

      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 border-b border-slate-800 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-graphixBlue to-graphixPink"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Graphix Locações & Eventos</span>
            </div>
            <h1 className="text-2xl font-bold">Painel Administrativo - AgendEvento</h1>
            <p className="text-sm text-slate-400">Gerenciamento de Equipe e Hierarquias de Acesso</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/calendar"
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              &larr; Voltar para Agenda
            </a>
            <a
              href="/login"
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-red-400 hover:bg-slate-800 transition-colors"
            >
              Sair
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Novo Usuário */}
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-2xl h-fit shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-white">Cadastrar Novo Usuário</h2>

            {message && (
              <div className="mb-4 p-3 bg-slate-950 border border-slate-800 text-xs rounded-lg text-graphixPink">
                {message}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: João Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="joao@graphix.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Senha Inicial</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nível de Acesso</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                >
                  <option value="TECNICO">Técnico (Montagem / Operação)</option>
                  <option value="COMERCIAL">Comercial (Agenda Eventos)</option>
                  <option value="ADMIN">Administrador (Acesso Total)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-graphixBlue to-graphixPink hover:opacity-90 transition-opacity text-white font-medium py-2.5 rounded-lg text-sm shadow-md disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Criar Usuário'}
              </button>
            </form>
          </div>

          {/* Listagem de Usuários */}
          <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-white">Equipe Cadastrada</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="pb-3">Nome</th>
                    <th className="pb-3">E-mail</th>
                    <th className="pb-3">Cargo</th>
                    <th className="pb-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-white">{u.name}</td>
                      <td className="py-3 text-slate-400">{u.email}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'ADMIN' ? 'bg-purple-950/80 text-purple-300 border border-purple-800' :
                          u.role === 'COMERCIAL' ? 'bg-blue-950/80 text-blue-300 border border-blue-800' :
                          'bg-pink-950/80 text-pink-300 border border-pink-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-900 text-red-300 text-xs font-medium transition-colors"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de Edição de Usuário */}
        {editingUser && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-xl font-bold mb-4 text-white">Editar Usuário</h2>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nova Senha (deixe em branco para não alterar)</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nível de Acesso</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-graphixPink"
                  >
                    <option value="TECNICO">Técnico</option>
                    <option value="COMERCIAL">Comercial</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-graphixBlue to-graphixPink text-white text-xs font-bold shadow hover:opacity-90"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}