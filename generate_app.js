const fs = require('fs');

const appContent = `import React, { useState, useEffect } from 'react';
import api from './services/api';
import { 
  LayoutDashboard, 
  Kanban, 
  FolderPlus, 
  LogOut, 
  Plus, 
  CheckCircle,
  Clock,
  ShieldCheck,
  Bell,
  Calendar,
  Users
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'ANALYST';
}

interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
}

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DOING' | 'DONE';
  projectId: string;
  assigneeId?: string;
  assignee?: { id: string; name: string; email: string };
}

interface DashboardStats {
  type: 'MACRO' | 'MICRO';
  totalProjects?: number;
  totalTasks?: number;
  analystWorkload?: Array<{
    id: string;
    name: string;
    taskCount: number;
  }>;
  kpis?: {
    total: number;
    todo: number;
    doing: number;
    done: number;
  };
  assignedProjects?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'projects' | 'users'>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ANALYST'
  });
  
  // Panel User Form
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ANALYST'
  });

  // App Core State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Create Modals/Forms State
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', projectId: '', assigneeId: '' });
  
  // UI Enhancements State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', text: 'Bem-vindo ao Portal de Projetos TI & Hospitalar', time: 'Agora', read: false, type: 'info' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        if (storedUser === 'undefined') throw new Error('Invalid user');
        const parsed = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
      fetchProjects();
      fetchTasks();
      fetchAnalysts();
      fetchUsers();
    }
  }, [isAuthenticated, activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.value = 587.33; // D5
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.error('Falha ao reproduzir som de notificacao:', e);
    }
  };

  const addNotification = (text: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newNotif: NotificationItem = {
      id: Date.now().toString(),
      text,
      time: 'Agora',
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
    playNotificationSound();
  };

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/projects/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalysts = async () => {
    try {
      const response = await api.get('/auth/analysts');
      setAnalysts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', {
        email: authForm.email,
        password: authForm.password
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      setIsAuthenticated(true);
      showToast(\`Bem-vindo de volta, \${user.name}!\`);
      playNotificationSound();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao realizar login');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', authForm);
      showToast('Conta criada com sucesso! Faca login para continuar.');
      setIsRegistering(false);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao realizar cadastro');
    }
  };

  const handleCreateUserFromPanel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUserForm);
      showToast('Usuário registrado com sucesso no sistema!');
      setNewUserForm({ name: '', email: '', password: '', role: 'ANALYST' });
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao registrar usuário');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      addNotification(\`Novo projeto criado: "\${newProject.title}"\`, 'success');
      setNewProject({ title: '', description: '' });
      fetchProjects();
      fetchDashboard();
      showToast('Projeto criado com sucesso!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao criar projeto');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/tasks', newTask);
      addNotification(\`Nova tarefa designada: "\${newTask.title}"\`, 'success');
      const assignedUser = analysts.find(a => a.id === response.data.assigneeId) || (response.data.assigneeId === currentUser?.id ? currentUser : null);
      
      const createdTask: Task = {
        id: response.data.id,
        title: response.data.title,
        status: 'TODO',
        projectId: response.data.projectId,
        assigneeId: response.data.assigneeId,
        assignee: assignedUser ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email } : undefined
      };
      setTasks([...tasks, createdTask]);
      setNewTask({ title: '', projectId: '', assigneeId: '' });
      fetchDashboard();
      showToast('Tarefa designada com sucesso!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao criar tarefa');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, currentStatus: 'TODO' | 'DOING' | 'DONE') => {
    let nextStatus: 'TODO' | 'DOING' | 'DONE' = 'TODO';
    if (currentStatus === 'TODO') nextStatus = 'DOING';
    else if (currentStatus === 'DOING') nextStatus = 'DONE';
    else nextStatus = 'TODO';

    try {
      await api.patch(\`/tasks/\${taskId}/status\`, { status: nextStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      const title = tasks.find(t => t.id === taskId)?.title;
      addNotification(\`Status da tarefa "\${title}" atualizado para \${nextStatus}\`, 'info');
      fetchDashboard();
      showToast('Status da tarefa atualizado!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar status');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        {toastMessage && <div className="toast">{toastMessage}</div>}
        <div className="card auth-card">
          <div className="auth-header">
            <h1>Portal <span>Hospitalar & TI</span></h1>
            <p>{isRegistering ? 'Crie seu perfil de acesso' : 'Entre com suas credenciais de TI'}</p>
          </div>
          
          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            {isRegistering && (
              <div className="form-group">
                <label className="form-label" htmlFor="name">Nome Completo</label>
                <input 
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name" 
                  className="form-input" 
                  value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                  required 
                />
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail Corporativo</label>
              <input 
                id="email"
                name="email"
                type="email"
                autoComplete="email" 
                className="form-input" 
                value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <input 
                id="password"
                name="password"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"} 
                className="form-input" 
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                required 
              />
            </div>

            {isRegistering && (
              <div className="form-group">
                <label className="form-label" htmlFor="role">Perfil de Acesso</label>
                <select 
                  id="role"
                  name="role"
                  className="form-input"
                  value={authForm.role}
                  onChange={e => setAuthForm({ ...authForm, role: e.target.value as any })}
                >
                  <option value="ANALYST">Analista (Visao Pessoal / Micro)</option>
                  <option value="MANAGER">Coordenador / Gestor (Visao Geral / Macro)</option>
                  <option value="SUPER_ADMIN">Super Admin (Acesso Total)</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              {isRegistering ? 'Registrar Perfil' : 'Entrar no Sistema'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ marginTop: '12px' }}
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Voltar para o Login' : 'Criar uma Nova Conta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {toastMessage && <div className="toast">{toastMessage}</div>}
      
      <div className="sidebar">
        <div className="sidebar-brand">
          <ShieldCheck size={24} className="primary" />
          <span>Gestao TI</span>
        </div>
        
        <div className="nav-menu">
          <div 
            className={\`nav-item \${activeTab === 'dashboard' ? 'active' : ''}\`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </div>
          
          <div 
            className={\`nav-item \${activeTab === 'kanban' ? 'active' : ''}\`}
            onClick={() => setActiveTab('kanban')}
          >
            <Kanban size={20} />
            Kanban
          </div>
          
          <div 
            className={\`nav-item \${activeTab === 'projects' ? 'active' : ''}\`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderPlus size={20} />
            Projetos
          </div>

          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
            <div 
              className={\`nav-item \${activeTab === 'users' ? 'active' : ''}\`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={20} />
              Usuários
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {(currentUser?.name || 'US').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currentUser?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser?.role}</div>
            </div>
          </div>
          
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>

      <div className="main-content">
        
        {/* PREMIUM TOP HEADER */}
        <div className="premium-header">
          <div className="header-info">
            <div className="breadcrumbs">Painel / {activeTab.toUpperCase()}</div>
            <h2>Sistema Integrado de TI & Demandas Clinicas</h2>
          </div>
          
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bell-badge">{notifications.filter(n => !n.read).length}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: 600 }}>Central de Avisos</h4>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => {
                        setNotifications(notifications.map(n => ({ ...n, read: true })));
                      }}
                    >
                      Lidas
                    </button>
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className={\`notification-item \${n.read ? 'read' : ''}\`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={\`dot \${n.type}\`}></span>
                            <p style={{ fontSize: '0.85rem', flexGrow: 1, color: 'var(--text-main)' }}>{n.text}</p>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '4px' }}>{n.time}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>Nenhum aviso pendente.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
                Painel Geral {dashboardData?.type === 'MACRO' ? '(Visao Macro - Gestao)' : '(Visao Micro - Analista)'}
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Monitore o andamento de projetos e a carga de trabalho operacional.
              </p>
            </div>

            {dashboardData?.type === 'MACRO' ? (
              <div>
                <div className="dashboard-grid">
                  <div className="card">
                    <div className="kpi-title">Projetos Ativos</div>
                    <div className="kpi-value">{dashboardData.totalProjects}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title">Tarefas Totais</div>
                    <div className="kpi-value">{dashboardData.totalTasks}</div>
                  </div>
                </div>

                {/* GANTT TIMELINE CHART */}
                {projects.length > 0 && (
                  <div className="card" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar className="primary" size={20} /> Cronograma de Projetos Estruturais (Gantt)
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mes Vigente - Planejamento a Longo Prazo</span>
                    </div>
                    
                    <div className="gantt-container">
                      <div className="gantt-header">
                        <div className="gantt-col-name">Projeto</div>
                        <div className="gantt-col-prog">Progresso das Demandas</div>
                        <div className="gantt-week">Semana 1</div>
                        <div className="gantt-week">Semana 2</div>
                        <div className="gantt-week">Semana 3</div>
                        <div className="gantt-week">Semana 4</div>
                      </div>
                      
                      <div className="gantt-body">
                        {projects.map((proj, idx) => {
                          const projTasks = tasks.filter(t => t.projectId === proj.id);
                          const total = projTasks.length;
                          const done = projTasks.filter(t => t.status === 'DONE').length;
                          const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                          
                          const startWeek = (idx % 2) + 1;
                          const durationWeeks = idx % 2 === 0 ? 3 : 2;
                          const endWeek = startWeek + durationWeeks - 1;
                          
                          return (
                            <div key={proj.id} className="gantt-row">
                              <div className="gantt-col-name">
                                <div className="gantt-proj-title">{proj.title}</div>
                                <div className="gantt-proj-desc">{proj.description || 'Sem descricao vinculada.'}</div>
                              </div>
                              <div className="gantt-col-prog">
                                <div className="gantt-progress-bg">
                                  <div className="gantt-progress-bar" style={{ width: \`\${percent}%\` }}></div>
                                </div>
                                <span className="gantt-progress-text">{percent}% ({done}/{total} tarefas)</span>
                              </div>
                              <div className="gantt-weeks-span">
                                <div className="gantt-timeline-grid">
                                  <div className="gantt-grid-cell"></div>
                                  <div className="gantt-grid-cell"></div>
                                  <div className="gantt-grid-cell"></div>
                                  <div className="gantt-grid-cell"></div>
                                </div>
                                <div 
                                  className={\`gantt-project-bar color-\${idx % 3}\`}
                                  style={{ 
                                    gridColumnStart: startWeek, 
                                    gridColumnEnd: endWeek + 1
                                  }}
                                >
                                  <span className="gantt-bar-label">{percent === 100 ? 'Concluido' : 'Em Andamento'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="card" style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Carga de Trabalho (Por Analista)</h3>
                  <div className="document-list">
                    {dashboardData.analystWorkload && dashboardData.analystWorkload.length > 0 ? (
                      dashboardData.analystWorkload.map(a => (
                        <div key={a.id} className="document-item animate-hover">
                          <div>
                            <div style={{ fontWeight: 600 }}>{a.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analista de TI / Hospitalar</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="column-badge" style={{ background: a.taskCount > 3 ? 'var(--danger)' : 'rgba(255,255,255,0.08)' }}>
                              {a.taskCount} tarefas designadas
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>Nenhum analista cadastrado no sistema ainda.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="dashboard-grid">
                  <div className="card">
                    <div className="kpi-title">Minhas Tarefas</div>
                    <div className="kpi-value">{dashboardData?.kpis?.total || 0}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title">Em Execucao</div>
                    <div className="kpi-value">{dashboardData?.kpis?.doing || 0}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title">Concluidas</div>
                    <div className="kpi-value">{dashboardData?.kpis?.done || 0}</div>
                  </div>
                </div>

                <div className="micro-dashboard-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Projetos que Participo</h3>
                    <div className="document-list">
                      {dashboardData?.assignedProjects && dashboardData.assignedProjects.length > 0 ? (
                        dashboardData.assignedProjects.map(p => (
                          <div key={p.id} className="document-item animate-hover">
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{p.description}</div>
                            </div>
                            <span className="confidential-badge" style={{ background: 'rgba(14,165,233,0.15)', color: 'var(--primary)', borderColor: 'rgba(14,165,233,0.3)' }}>Ativo</span>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>Nenhum projeto ativo com tarefas atribuidas a voce.</p>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontWeight: 600 }}>Pendencias e Prazos</h3>
                      <span className="column-badge" style={{ background: 'var(--danger)', color: '#fff' }}>Urgente</span>
                    </div>
                    <div className="document-list">
                      {tasks.filter(t => t.status !== 'DONE').length > 0 ? (
                        tasks.filter(t => t.status !== 'DONE').map(t => (
                          <div key={t.id} className="document-item animate-hover" style={{ borderLeft: t.status === 'DOING' ? '3px solid var(--warning)' : '3px solid var(--primary)' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{t.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Projeto: {projects.find(p => p.id === t.projectId)?.title || 'Carregando...'}
                              </div>
                            </div>
                            <span className="column-badge" style={{ background: t.status === 'DOING' ? 'rgba(245,158,11,0.15)' : 'rgba(14,165,233,0.15)', color: t.status === 'DOING' ? 'var(--warning)' : 'var(--primary)' }}>
                              {t.status === 'DOING' ? 'Em Progresso' : 'A Fazer'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>Todas as suas tarefas foram concluidas!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: KANBAN BOARD */}
        {activeTab === 'kanban' && (
          <div>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Quadro Kanban</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Gerencie o status de suas tarefas diarias com facilidade.</p>
              </div>
            </div>

            {/* FORMULARIO DE TAREFA LIBERADO PARA TODOS (Conforme solicitado) */}
            <div className="card" style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus className="primary" /> Registrar Nova Tarefa
              </h3>
              <form onSubmit={handleCreateTask} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '16px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Titulo da Tarefa</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: Ajustar prontuario ala cardiaca"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Projeto Relacionado</label>
                  <select 
                    className="form-input"
                    value={newTask.projectId}
                    onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                    required
                  >
                    <option value="">Selecione um projeto...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Atribuir a (Opcional)</label>
                  <select 
                    className="form-input"
                    value={newTask.assigneeId}
                    onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}
                  >
                    <option value="">Nao atribuido</option>
                    <option value={currentUser?.id}>{currentUser?.name} (Voce)</option>
                    {analysts.map(analyst => (
                      <option key={analyst.id} value={analyst.id}>{analyst.name}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>
                  Adicionar
                </button>
              </form>
            </div>

            <div className="kanban-board">
              <div className="kanban-column">
                <div className="column-header">
                  <div className="column-title"><Clock size={18} className="warning" /> A Fazer</div>
                  <span className="column-badge">{tasks.filter(t => t.status === 'TODO').length}</span>
                </div>
                {tasks.filter(t => t.status === 'TODO').map(t => (
                  <div key={t.id} className="task-card">
                    <h4>{t.title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Resp: {t.assignee?.name || 'Sem designacao'}
                    </div>
                    <div className="task-actions">
                      <button className="action-icon" onClick={() => handleUpdateTaskStatus(t.id, t.status)}>
                        Avancar status
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="kanban-column">
                <div className="column-header">
                  <div className="column-title"><Clock size={18} className="primary" /> Em Progresso</div>
                  <span className="column-badge">{tasks.filter(t => t.status === 'DOING').length}</span>
                </div>
                {tasks.filter(t => t.status === 'DOING').map(t => (
                  <div key={t.id} className="task-card">
                    <h4>{t.title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Resp: {t.assignee?.name || 'Sem designacao'}
                    </div>
                    <div className="task-actions">
                      <button className="action-icon" onClick={() => handleUpdateTaskStatus(t.id, t.status)}>
                        Concluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="kanban-column">
                <div className="column-header">
                  <div className="column-title"><CheckCircle size={18} className="accent" /> Concluido</div>
                  <span className="column-badge">{tasks.filter(t => t.status === 'DONE').length}</span>
                </div>
                {tasks.filter(t => t.status === 'DONE').map(t => (
                  <div key={t.id} className="task-card">
                    <h4 style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{t.title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Resp: {t.assignee?.name || 'Sem designacao'}
                    </div>
                    <div className="task-actions">
                      <button className="action-icon" onClick={() => handleUpdateTaskStatus(t.id, t.status)}>
                        Reiniciar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROJETOS */}
        {activeTab === 'projects' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Gestão de Projetos</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Crie e administre os projetos hospitalares e de TI.</p>
            </div>

            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
              <div className="card" style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FolderPlus className="primary" /> Novo Projeto Estrutural
                </h3>
                <form onSubmit={handleCreateProject}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="projectTitle">Título do Projeto</label>
                    <input 
                      id="projectTitle"
                      name="projectTitle"
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: Implantação de Servidores Ala Hospitalar B"
                      value={newProject.title}
                      onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="projectDesc">Descrição / Escopo</label>
                    <textarea 
                      id="projectDesc"
                      name="projectDesc"
                      className="form-input" 
                      rows={3} 
                      placeholder="Descreva detalhadamente o escopo e objetivos deste projeto hospitalar..."
                      value={newProject.description}
                      onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                    Criar Projeto
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Projetos Cadastrados</h3>
              <div className="document-list">
                {projects.length > 0 ? (
                  projects.map(p => (
                    <div key={p.id} className="document-item animate-hover">
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{p.description || 'Sem descrição.'}</div>
                      </div>
                      <span className="column-badge" style={{ background: 'rgba(14,165,233,0.15)', color: 'var(--primary)' }}>
                        {tasks.filter(t => t.projectId === p.id).length} Tarefas
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Nenhum projeto cadastrado no sistema.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: USUÁRIOS */}
        {activeTab === 'users' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Gestão de Usuários</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Cadastre novos usuários e visualize a equipe atual.</p>
            </div>

            <div className="card" style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users className="primary" /> Cadastrar Novo Usuário
              </h3>
              <form onSubmit={handleCreateUserFromPanel} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="newUserName">Nome Completo</label>
                  <input 
                    id="newUserName"
                    name="newUserName"
                    type="text"
                    className="form-input" 
                    value={newUserForm.name}
                    onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    required 
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="newUserEmail">E-mail Corporativo</label>
                  <input 
                    id="newUserEmail"
                    name="newUserEmail"
                    type="email"
                    className="form-input" 
                    value={newUserForm.email}
                    onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    required 
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="newUserPassword">Senha Inicial</label>
                  <input 
                    id="newUserPassword"
                    name="newUserPassword"
                    type="password"
                    className="form-input" 
                    value={newUserForm.password}
                    onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    required 
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="newUserRole">Perfil de Acesso</label>
                  <select 
                    id="newUserRole"
                    name="newUserRole"
                    className="form-input"
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                  >
                    <option value="ANALYST">Analista</option>
                    <option value="MANAGER">Gestor</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1', width: 'auto', justifySelf: 'start', marginTop: '10px' }}>
                  Criar Conta de Usuário
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Equipe Cadastrada</h3>
              <div className="document-list">
                {users.length > 0 ? (
                  users.map(u => (
                    <div key={u.id} className="document-item animate-hover">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{u.email}</div>
                        </div>
                      </div>
                      <span className="column-badge" style={{ background: u.role === 'SUPER_ADMIN' ? 'rgba(239,68,68,0.15)' : 'rgba(14,165,233,0.15)', color: u.role === 'SUPER_ADMIN' ? 'var(--danger)' : 'var(--primary)' }}>
                        {u.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Nenhum usuário listado.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
`;
fs.writeFileSync('frontend/src/App.tsx', appContent);
