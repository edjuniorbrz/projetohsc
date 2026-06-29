import React, { useState, useEffect } from 'react';
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
  Users,
  Edit,
  Trash2,
  X,
  UserCheck,
  Info,
  Filter
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'ANALYST';
  gestorId?: string;
  gestor?: { id: string; name: string; email: string };
  cargo?: string | null;
  isActive: boolean;
}

interface Gestor {
  id: string;
  name: string;
  email: string;
  cargo?: string | null;
  isActive: boolean;
  _count?: { users: number; projects: number };
}

interface SubChapter {
  id: string;
  title: string;
  projectId: string;
  tasks?: Array<{ id: string; title: string; status: string }>;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  gestorId?: string;
  gestor?: { id: string; name: string; email: string; isActive: boolean };
  responsibles?: Array<{ id: string; name: string; email: string; isActive: boolean; cargo?: string | null }>;
  subChapters?: SubChapter[];
  dataInicio?: string | null;
  dataFim?: string | null;
  categoria?: string | null;
}

interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  user: { id: string; name: string };
  filename?: string | null;
  originalName?: string | null;
}

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
  projectId: string;
  project?: Project | null;
  assignees?: Array<{ id: string; name: string; email: string }> | null;
  why?: string | null;
  where?: string | null;
  how?: string | null;
  howMuch?: number | null;
  dataInicioProgramada?: string | null;
  dataInicioReal?: string | null;
  dataPrevistaFinalizar?: string | null;
  dataRealFinalizada?: string | null;
  porcentagemExecucao: number;
  comments?: TaskComment[] | null;
  subChapterId?: string | null;
  subChapter?: { id: string; title: string } | null;
  blockedAt?: string | null;
  blockedReason?: string | null;
  isUrgent: boolean;
  createdAt: string;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'action' | 'kanban' | 'users' | 'gestores'>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Custom states for security & filters
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetForm, setPasswordResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordResetError, setPasswordResetError] = useState('');

  const [filterProject, setFilterProject] = useState('');
  const [filterAnalyst, setFilterAnalyst] = useState('');
  const [filterUrgent, setFilterUrgent] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Auth Form State
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ANALYST'
  });
  
  // Sidebar Submenu State
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);

  // Panel User Modal Form State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ANALYST' as any,
    isActive: true,
    gestorId: '',
    cargo: ''
  });

  // Panel Gestor Modal Form State
  const [isGestorModalOpen, setIsGestorModalOpen] = useState(false);
  const [editingGestor, setEditingGestor] = useState<Gestor | null>(null);
  const [gestorForm, setGestorForm] = useState({
    name: '',
    email: '',
    cargo: '',
    isActive: true
  });

  // App Core State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [gestores, setGestores] = useState<Gestor[]>([]);
  
  // Create Modals/Forms State
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '', 
    gestorId: '',
    dataInicio: '',
    dataFim: '',
    responsibleIds: [] as string[],
    categoria: ''
  });

  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  const [editProjectForm, setEditProjectForm] = useState({
    id: '',
    title: '',
    description: '',
    gestorId: '',
    dataInicio: '',
    dataFim: '',
    responsibleIds: [] as string[],
    categoria: ''
  });

  const [newSubChapterTitle, setNewSubChapterTitle] = useState<{ [projectId: string]: string }>({});
  
  const [newTask, setNewTask] = useState<{
    title: string;
    projectId: string;
    subChapterId: string;
    assigneeIds: string[];
    why: string;
    where: string;
    how: string;
    howMuch: string;
    dataInicioProgramada: string;
    dataPrevistaFinalizar: string;
    isUrgent: boolean;
  }>({ 
    title: '', 
    projectId: '', 
    subChapterId: '',
    assigneeIds: [],
    why: '',
    where: '',
    how: '',
    howMuch: '',
    dataInicioProgramada: '',
    dataPrevistaFinalizar: '',
    isUrgent: false
  });
  
  // UI Enhancements State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', text: 'Bem-vindo ao Portal DEMANDAS TI', time: 'Agora', read: false, type: 'info' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTaskDetailId, setActiveTaskDetailId] = useState<string | null>(null);

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
      fetchGestores();
    }
  }, [isAuthenticated, activeTab]);

  // Keep dropdown open if active tab is under "Cadastros"
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'gestores') {
      setIsCadastrosOpen(true);
    }
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const renderTaskDetails = (t: Task) => {
    return (
      <div style={{ marginTop: '12px', padding: '10px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div><strong>WHY (Por quê?):</strong> <span style={{ color: 'var(--text-main)' }}>{t.why || 'Não cadastrado'}</span></div>
        <div><strong>WHERE (Onde?):</strong> <span style={{ color: 'var(--text-main)' }}>{t.where || 'Não cadastrado'}</span></div>
        <div><strong>HOW (Como?):</strong> <span style={{ color: 'var(--text-main)' }}>{t.how || 'Não cadastrado'}</span></div>
        <div><strong>HOW MUCH (Custo?):</strong> <span style={{ color: 'var(--primary)' }}>{t.howMuch ? `R$ ${t.howMuch.toFixed(2)}` : 'R$ 0,00'}</span></div>
        <div style={{ borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
          <div><strong>WHEN Programado:</strong> {formatDateString(t.dataInicioProgramada)} a {formatDateString(t.dataPrevistaFinalizar)}</div>
          <div><strong>WHEN Real:</strong> {formatDateString(t.dataInicioReal)} a {formatDateString(t.dataRealFinalizada)}</div>
        </div>

        {/* HISTÓRICO DE OBSERVAÇÕES & ARQUIVOS */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '8px', paddingTop: '8px' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💬 Observações & Arquivos ({t.comments?.length || 0})</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '8px', paddingRight: '4px' }}>
            {t.comments && t.comments.length > 0 ? (
              t.comments.map(c => {
                const commentDate = new Date(c.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px', borderLeft: '2px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', opacity: 0.8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.user?.name}</span>
                      <span>{commentDate}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#f3f4f6', whiteSpace: 'pre-line' }}>{c.text}</p>
                    {c.filename && (
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.65rem' }}>📎 Anexo:</span>
                        <a 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownloadAttachment(c.filename as string);
                          }}
                          style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.7rem', fontWeight: 600 }}
                        >
                          {c.originalName || c.filename}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.7rem', fontStyle: 'italic' }}>Nenhuma observação registrada.</p>
            )}
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const textInput = form.elements.namedItem('commentText') as HTMLTextAreaElement;
              const fileInput = form.elements.namedItem('commentFile') as HTMLInputElement;
              handleAddComment(t.id, textInput.value, fileInput.files);
              form.reset();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <textarea
              name="commentText"
              placeholder="Digite sua observação..."
              className="form-input"
              rows={2}
              style={{ fontSize: '0.75rem', padding: '6px', resize: 'none', background: 'rgba(0,0,0,0.3)', margin: 0 }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.7rem' }} className="animate-hover">
                <span>📎 Anexar Arquivo</span>
                <input
                  type="file"
                  name="commentFile"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx', 'zip'];
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const ext = file.name.split('.').pop()?.toLowerCase();
                        if (!ext || !allowedExtensions.includes(ext)) {
                          showToast(`Formato de arquivo não permitido: .${ext}. Apenas PDF, Imagens (PNG, JPG), Word/Excel e ZIP.`);
                          e.target.value = ''; // Clear selected
                          return;
                        }
                      }
                      showToast(`${files.length} arquivo(s) selecionado(s)`);
                    }
                  }}
                />
              </label>
              <button type="submit" className="btn btn-primary" style={{ height: 'auto', padding: '4px 12px', fontSize: '0.7rem', width: 'auto', margin: 0 }}>
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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

  const fetchGestores = async () => {
    try {
      const response = await api.get('/gestores');
      setGestores(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdConsent) {
      showToast('Você precisa aceitar os termos de consentimento de dados (LGPD) para prosseguir.');
      return;
    }
    try {
      const response = await api.post('/auth/login', {
        email: authForm.email,
        password: authForm.password
      });
      const { token, user, needsPasswordReset } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);

      if (needsPasswordReset) {
        setShowPasswordReset(true);
        showToast('Aviso: É necessário redefinir a sua senha inicial.');
      } else {
        setIsAuthenticated(true);
        showToast(`Bem-vindo de volta, ${user.name}!`);
        playNotificationSound();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao realizar login');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordResetForm.newPassword !== passwordResetForm.confirmPassword) {
      setPasswordResetError('As senhas não coincidem.');
      return;
    }
    
    // Front-end password complexity check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(passwordResetForm.newPassword)) {
      setPasswordResetError('A senha deve conter no mínimo 8 caracteres, contendo pelo menos uma letra máuscula, uma letra minúscula, um número e um caractere especial (@$!%*?&#).');
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        newPassword: passwordResetForm.newPassword
      });
      showToast('Senha redefinida com sucesso! Acesso liberado.');
      setShowPasswordReset(false);
      setIsAuthenticated(true);
      playNotificationSound();
    } catch (err: any) {
      setPasswordResetError(err.response?.data?.error || 'Erro ao redefinir a senha.');
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'ANALYST',
      isActive: true,
      gestorId: '',
      cargo: ''
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive !== undefined ? user.isActive : true,
      gestorId: user.gestorId || '',
      cargo: user.cargo || ''
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload: any = {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          isActive: userForm.isActive,
          gestorId: userForm.gestorId || null,
          cargo: userForm.cargo || null
        };
        if (userForm.password) {
          payload.password = userForm.password;
        }
        await api.patch(`/auth/users/${editingUser.id}`, payload);
        showToast('Usuário atualizado com sucesso!');
        addNotification(`Usuário "${userForm.name}" atualizado com sucesso.`, 'success');
      } else {
        await api.post('/auth/register', userForm);
        showToast('Usuário cadastrado com sucesso!');
        addNotification(`Novo usuário cadastrado: "${userForm.name}"`, 'success');
      }
      setIsUserModalOpen(false);
      fetchUsers();
      fetchAnalysts();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      try {
        await api.delete(`/auth/users/${userId}`);
        showToast('Usuário excluído com sucesso!');
        addNotification(`Usuário "${userName}" excluído do sistema.`, 'warning');
        fetchUsers();
        fetchAnalysts();
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Erro ao excluir usuário');
      }
    }
  };

  // Gestor Modals & CRUD
  const openAddGestorModal = () => {
    setEditingGestor(null);
    setGestorForm({
      name: '',
      email: '',
      cargo: '',
      isActive: true
    });
    setIsGestorModalOpen(true);
  };

  const openEditGestorModal = (gestor: Gestor) => {
    setEditingGestor(gestor);
    setGestorForm({
      name: gestor.name,
      email: gestor.email,
      cargo: gestor.cargo || '',
      isActive: gestor.isActive
    });
    setIsGestorModalOpen(true);
  };

  const handleSaveGestor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGestor) {
        await api.patch(`/gestores/${editingGestor.id}`, gestorForm);
        showToast('Gestor atualizado com sucesso!');
        addNotification(`Gestor "${gestorForm.name}" atualizado com sucesso.`, 'success');
      } else {
        await api.post('/gestores', gestorForm);
        showToast('Gestor cadastrado com sucesso!');
        addNotification(`Novo gestor cadastrado: "${gestorForm.name}"`, 'success');
      }
      setIsGestorModalOpen(false);
      fetchGestores();
      fetchUsers();
      fetchProjects();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao salvar gestor');
    }
  };

  const handleDeleteGestor = async (gestorId: string, gestorName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o gestor "${gestorName}"?`)) {
      try {
        await api.delete(`/gestores/${gestorId}`);
        showToast('Gestor excluído com sucesso!');
        addNotification(`Gestor "${gestorName}" excluído do sistema.`, 'warning');
        fetchGestores();
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Erro ao excluir gestor');
      }
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
    if (newProject.responsibleIds.length === 0) {
      showToast('Selecione pelo menos um gestor responsável');
      return;
    }
    try {
      await api.post('/projects', newProject);
      addNotification(`Novo projeto criado: "${newProject.title}"`, 'success');
      setNewProject({ title: '', description: '', gestorId: '', dataInicio: '', dataFim: '', responsibleIds: [], categoria: '' });
      fetchProjects();
      fetchDashboard();
      showToast('Projeto criado com sucesso!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao criar projeto');
    }
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditProjectForm({
      id: proj.id,
      title: proj.title,
      description: proj.description || '',
      gestorId: proj.gestorId || '',
      dataInicio: proj.dataInicio ? proj.dataInicio.substring(0, 10) : '',
      dataFim: proj.dataFim ? proj.dataFim.substring(0, 10) : '',
      responsibleIds: proj.responsibles ? proj.responsibles.map(r => r.id) : [],
      categoria: proj.categoria || ''
    });
    setIsEditProjectModalOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editProjectForm.responsibleIds.length === 0) {
      showToast('Selecione pelo menos um gestor responsável');
      return;
    }
    try {
      await api.patch(`/projects/${editProjectForm.id}`, editProjectForm);
      setIsEditProjectModalOpen(false);
      fetchProjects();
      fetchDashboard();
      showToast('Projeto atualizado com sucesso!');
      addNotification(`Projeto atualizado: "${editProjectForm.title}"`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar projeto');
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${title}"?`)) {
      try {
        await api.delete(`/projects/${id}`);
        fetchProjects();
        fetchDashboard();
        showToast('Projeto excluído com sucesso!');
        addNotification(`Projeto excluído: "${title}"`, 'success');
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Erro ao excluir projeto');
      }
    }
  };

  const handleCreateSubChapter = async (projectId: string) => {
    const title = newSubChapterTitle[projectId];
    if (!title || !title.trim()) {
      showToast('Digite um título para o sub-capítulo');
      return;
    }
    try {
      await api.post(`/projects/${projectId}/subchapters`, { title: title.toUpperCase() });
      setNewSubChapterTitle(prev => ({ ...prev, [projectId]: '' }));
      fetchProjects();
      showToast('Sub-capítulo criado com sucesso!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao criar sub-capítulo');
    }
  };

  const handleDeleteSubChapter = async (subChapterId: string, subChapterTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o sub-capítulo "${subChapterTitle}"? Todas as ações vinculadas a ele serão excluídas!`)) {
      try {
        await api.delete(`/projects/subchapters/${subChapterId}`);
        fetchProjects();
        fetchTasks();
        showToast('Sub-capítulo excluído com sucesso!');
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Erro ao excluir sub-capítulo');
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', newTask);
      addNotification(`Nova tarefa 5W2H cadastrada: "${newTask.title}"`, 'success');
      setNewTask({ 
        title: '', 
        projectId: '', 
        subChapterId: '',
        assigneeIds: [],
        why: '',
        where: '',
        how: '',
        howMuch: '',
        dataInicioProgramada: '',
        dataPrevistaFinalizar: '',
        isUrgent: false
      });
      fetchTasks();
      fetchDashboard();
      showToast('Tarefa 5W2H criada com sucesso!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao criar tarefa');
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a ação "${taskTitle}"?`)) {
      try {
        await api.delete(`/tasks/${taskId}`);
        showToast('Ação excluída com sucesso!');
        addNotification(`Ação "${taskTitle}" excluída.`, 'warning');
        fetchTasks();
        fetchDashboard();
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Esta operação falhou.');
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === targetStatus) return;

    // Regra especial 1: se a tarefa está bloqueada há mais de 7 dias sem justificativa,
    // não permitir mover para fora sem preencher a justificativa
    const daysBlocked = task.blockedAt ? Math.floor((Date.now() - new Date(task.blockedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    if (task.status === 'BLOCKED' && daysBlocked >= 7 && !task.blockedReason && targetStatus !== 'BLOCKED') {
      const reason = window.prompt(`Esta ação está bloqueada há ${daysBlocked} dias. Digite a justificativa obrigatória para desbloquear e mover:`);
      if (!reason || !reason.trim()) {
        showToast('Justificativa obrigatória para mover ações bloqueadas por mais de 7 dias.');
        return;
      }
      try {
        await api.patch(`/tasks/${taskId}/status`, { status: 'BLOCKED', blockedReason: reason.trim() });
      } catch (err) {
        showToast('Erro ao salvar justificativa.');
        return;
      }
    }

    // Regra especial 2: se a tarefa está indo para "BLOCKED", solicitar justificativa imediata
    let blockedReason = '';
    if (targetStatus === 'BLOCKED') {
      const reason = window.prompt('Justificativa para bloquear esta ação (Opcional na entrada, mas obrigatória após 7 dias):');
      if (reason === null) return; // Cancelado
      blockedReason = reason.trim();
    }

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: targetStatus, blockedReason });
      showToast('Tarefa movida com sucesso!');
      fetchTasks();
      fetchDashboard();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao mover tarefa');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, currentStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let nextStatus = 'TODO';
    if (currentStatus === 'TODO') nextStatus = 'DOING';
    else if (currentStatus === 'DOING') nextStatus = 'DONE';
    else if (currentStatus === 'BLOCKED') {
      const daysBlocked = task.blockedAt ? Math.floor((Date.now() - new Date(task.blockedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      if (daysBlocked >= 7 && !task.blockedReason) {
        const reason = window.prompt(`Esta ação está bloqueada há ${daysBlocked} dias. Digite a justificativa obrigatória para desbloquear e retomar:`);
        if (!reason || !reason.trim()) {
          showToast('Justificativa obrigatória para retomar ação.');
          return;
        }
        try {
          await api.patch(`/tasks/${taskId}/status`, { status: 'BLOCKED', blockedReason: reason.trim() });
        } catch (err) {
          showToast('Erro ao salvar justificativa.');
          return;
        }
      }
      nextStatus = 'DOING';
    } else nextStatus = 'TODO';

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      addNotification(`Status da tarefa atualizado para ${nextStatus}`, 'info');
      fetchTasks();
      fetchDashboard();
      showToast('Status da tarefa atualizado!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar status');
    }
  };

  const handleUpdateTaskProgress = async (taskId: string, progressValue: number) => {
    try {
      await api.patch(`/tasks/${taskId}/progress`, { progress: progressValue });
      fetchTasks();
      fetchDashboard();
      showToast(`Progresso da tarefa atualizado para ${progressValue}%`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar progresso');
    }
  };

  const handleClaimTask = async (taskId: string) => {
    try {
      await api.patch(`/tasks/${taskId}/claim`);
      const taskTitle = tasks.find(t => t.id === taskId)?.title;
      addNotification(`Você assumiu a execução da demanda: "${taskTitle}"`, 'success');
      fetchTasks();
      fetchDashboard();
      showToast('Demanda assumida com sucesso!');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao assumir tarefa');
    }
  };

  const handleAddComment = async (taskId: string, text: string, files?: FileList | null) => {
    try {
      if (!files || files.length === 0) {
        const formData = new FormData();
        formData.append('text', text);
        await api.post(`/tasks/${taskId}/comments`, formData);
      } else {
        // Upload first file with text
        const formData = new FormData();
        formData.append('text', text || `Anexo: ${files[0].name}`);
        formData.append('file', files[0]);
        await api.post(`/tasks/${taskId}/comments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Upload remaining files as separate comments
        for (let i = 1; i < files.length; i++) {
          const extraFormData = new FormData();
          extraFormData.append('text', `Anexo adicional: ${files[i].name}`);
          extraFormData.append('file', files[i]);
          await api.post(`/tasks/${taskId}/comments`, extraFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }
      
      showToast('Observação/Anexos registrados com sucesso!');
      fetchTasks();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao registrar observação.');
    }
  };

  const handleDownloadAttachment = async (filename: string) => {
    try {
      const response = await api.get(`/tasks/comments/download/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Encontrar o nome original do arquivo
      const allComments = tasks.flatMap(t => t.comments || []);
      const match = allComments.find(c => c.filename === filename);
      const displayName = match?.originalName || filename;
      
      link.setAttribute('download', displayName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast('Erro ao realizar o download do anexo.');
    }
  };

  const renderProjectCategoryBadge = (categoria?: string | null) => {
    if (!categoria) return null;
    let bg = 'rgba(255,255,255,0.05)';
    let color = 'var(--text-muted)';
    let border = '1px solid var(--border-color)';
    
    if (categoria === 'Jornada Digital') {
      bg = 'rgba(14, 165, 233, 0.08)';
      color = 'var(--primary)';
      border = '1px solid rgba(14, 165, 233, 0.2)';
    } else if (categoria === 'Corporativo') {
      bg = 'rgba(16, 185, 129, 0.08)';
      color = 'var(--accent)';
      border = '1px solid rgba(16, 185, 129, 0.2)';
    } else if (categoria === 'HSC') {
      bg = 'rgba(245, 158, 11, 0.08)';
      color = 'var(--warning)';
      border = '1px solid rgba(245, 158, 11, 0.2)';
    }

    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        padding: '3px 10px', 
        borderRadius: '6px', 
        fontSize: '0.7rem', 
        fontWeight: 700, 
        textTransform: 'uppercase', 
        letterSpacing: '0.5px',
        backgroundColor: bg,
        color: color,
        border: border,
        marginLeft: '10px',
        verticalAlign: 'middle'
      }}>
        {categoria}
      </span>
    );
  };

  const formatDateString = (dateStr?: string | null) => {
    if (!dateStr) return 'Não registrado';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const checkIsOverdue = (task: Task) => {
    if (task.status === 'DONE') return false;
    if (!task.dataPrevistaFinalizar) return false;
    const limitDate = new Date(task.dataPrevistaFinalizar);
    const today = new Date();
    limitDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return limitDate < today;
  };

  const filteredTasks = tasks.filter(t => {
    if (filterProject && t.projectId !== filterProject) return false;
    if (filterAnalyst) {
      const isAssigned = t.assignees?.some(a => a.id === filterAnalyst);
      if (!isAssigned) return false;
    }
    if (filterUrgent === 'URGENT' && !t.isUrgent) return false;
    if (filterUrgent === 'NORMAL' && t.isUrgent) return false;
    
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'OVERDUE') {
        return checkIsOverdue(t);
      } else {
        return t.status === filterStatus;
      }
    }
    return true;
  });

  
  if (isAuthenticated && showPasswordReset) {
    return (
      <div className="password-reset-overlay">
        <div className="password-reset-card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>Redefinição Obrigatória</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '12px' }}>
              Para garantir a segurança do sistema, altere a sua senha inicial de acesso.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '16px', lineHeight: '1.4' }}>
              <strong>Requisitos obrigatórios para a nova senha:</strong>
              <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <li>Mínimo de 8 caracteres</li>
                <li>Pelo menos uma letra maiúscula</li>
                <li>Pelo menos uma letra minúscula</li>
                <li>Pelo menos um número</li>
                <li>Pelo menos um caractere especial (Ex: @, $, !, %, *, ?, &, #)</li>
              </ul>
            </div>
          </div>

          {passwordResetError && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>
              {passwordResetError}
            </div>
          )}

          <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="newPassword">Nova Senha</label>
              <input 
                id="newPassword"
                type="password"
                className="form-input"
                placeholder="Mínimo 8 caracteres, número, maiúscula e especial"
                value={passwordResetForm.newPassword}
                onChange={e => setPasswordResetForm({ ...passwordResetForm, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <input 
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Repita a nova senha"
                value={passwordResetForm.confirmPassword}
                onChange={e => setPasswordResetForm({ ...passwordResetForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              Salvar Nova Senha
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        {toastMessage && <div className="toast">{toastMessage}</div>}
        <div className="card auth-card">
          <div className="auth-header">
            <h1>DEMANDAS <span>TI</span></h1>
            <p>Entre com suas credenciais de TI</p>
          </div>
          
          <form onSubmit={handleLogin}>
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
                autoComplete="current-password" 
                className="form-input" 
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                required 
              />
            </div>

            
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '16px' }}>
              <input 
                id="lgpdConsent"
                name="lgpdConsent"
                type="checkbox" 
                checked={lgpdConsent}
                onChange={e => setLgpdConsent(e.target.checked)}
                required
                style={{ marginTop: '4px', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="lgpdConsent" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', cursor: 'pointer', userSelect: 'none' }}>
                Declaro que li e concordo com os termos de consentimento e privacidade de dados (LGPD) para acesso ao portal corporativo.
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }} disabled={!lgpdConsent}>
              Entrar no Sistema
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
          <span>DEMANDAS TI</span>
        </div>
        
        <div className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </div>

          <div 
            className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FolderPlus size={20} />
            Projetos
          </div>

          <div 
            className={`nav-item ${activeTab === 'action' ? 'active' : ''}`}
            onClick={() => setActiveTab('action')}
          >
            <Plus size={20} style={{ border: '2px solid', borderRadius: '50%', padding: '1px' }} />
            Ação
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            <Kanban size={20} />
            Kanban
          </div>

          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
            <div>
              <div 
                className={`nav-item ${activeTab === 'users' || activeTab === 'gestores' ? 'active' : ''}`}
                onClick={() => setIsCadastrosOpen(!isCadastrosOpen)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={20} />
                  Cadastros
                </div>
                <span style={{ 
                  fontSize: '0.7rem', 
                  transform: isCadastrosOpen ? 'rotate(90deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease',
                  marginRight: '4px',
                  opacity: 0.7
                }}>▶</span>
              </div>

              {isCadastrosOpen && (
                <div className="submenu-container" style={{ 
                  paddingLeft: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  marginTop: '4px',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                  marginLeft: '22px',
                  marginBottom: '8px'
                }}>
                  <div 
                    className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <Users size={16} />
                    Usuários
                  </div>
                  <div 
                    className={`nav-item ${activeTab === 'gestores' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gestores')}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <UserCheck size={16} />
                    Gestores
                  </div>
                </div>
              )}
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
            <h2>Portal DEMANDAS TI</h2>
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
                        <div key={n.id} className={`notification-item ${n.read ? 'read' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`dot ${n.type}`}></span>
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


                {/* SITUACAO GERAL DAS DEMANDAS - VISUAL BREAKDOWN */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Situação Geral das Demandas</h3>
                  <div className="status-breakdown-grid">
                    <div className="status-card">
                      <div className="status-card-label" style={{ color: 'var(--text-muted)' }}>A Fazer</div>
                      <div className="status-card-value" style={{ color: '#9ca3af' }}>
                        {tasks.filter(t => t.status === 'TODO').length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'TODO').length / tasks.length) * 100 : 0}%`, background: '#9ca3af' }}></div>
                      </div>
                    </div>

                    <div className="status-card">
                      <div className="status-card-label" style={{ color: 'var(--warning)' }}>Em Progresso</div>
                      <div className="status-card-value" style={{ color: 'var(--warning)' }}>
                        {tasks.filter(t => t.status === 'DOING').length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'DOING').length / tasks.length) * 100 : 0}%`, background: 'var(--warning)' }}></div>
                      </div>
                    </div>

                    <div className="status-card">
                      <div className="status-card-label" style={{ color: 'var(--danger)' }}>Bloqueado</div>
                      <div className="status-card-value" style={{ color: 'var(--danger)' }}>
                        {tasks.filter(t => t.status === 'BLOCKED').length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'BLOCKED').length / tasks.length) * 100 : 0}%`, background: 'var(--danger)' }}></div>
                      </div>
                    </div>

                    <div className="status-card">
                      <div className="status-card-label" style={{ color: 'var(--accent)' }}>Concluído</div>
                      <div className="status-card-value" style={{ color: 'var(--accent)' }}>
                        {tasks.filter(t => t.status === 'DONE').length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100 : 0}%`, background: 'var(--accent)' }}></div>
                      </div>
                    </div>

                    <div className="status-card">
                      <div className="status-card-label" style={{ color: '#f43f5e' }}>Atrasado</div>
                      <div className="status-card-value" style={{ color: '#f43f5e' }}>
                        {tasks.filter(t => checkIsOverdue(t)).length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => checkIsOverdue(t)).length / tasks.length) * 100 : 0}%`, background: '#f43f5e' }}></div>
                      </div>
                    </div>
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
                                 <div className="gantt-proj-desc">
                                   {proj.description || 'Sem descricao.'}
                                   {proj.responsibles && proj.responsibles.length > 0 
                                      ? ` • Responsáveis: ${proj.responsibles.map(r => r.name).join(', ')}`
                                      : (proj.gestor ? ` • Gestor: ${proj.gestor.name}` : '')}
                                 </div>
                               </div>
                               <div className="gantt-col-prog">
                                 <div className="gantt-progress-bg">
                                   <div className="gantt-progress-bar" style={{ width: `${percent}%` }}></div>
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
                                   className={`gantt-project-bar color-${idx % 3}`}
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
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analista de TI</div>
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


                {/* SITUACAO GERAL DAS DEMANDAS - VISUAL BREAKDOWN */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Situação Geral das Demandas</h3>
                  <div className="status-breakdown-grid">
                    <div className="status-card">
                      <div className="status-card-label" style={{ color: 'var(--text-muted)' }}>A Fazer</div>
                      <div className="status-card-value" style={{ color: '#9ca3af' }}>
                        {tasks.filter(t => t.status === 'TODO').length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'TODO').length / tasks.length) * 100 : 0}%`, background: '#9ca3af' }}></div>
                      </div>
                    </div>

                    <div className="status-card">
                      <div className="status-card-label" style={{ color: 'var(--warning)' }}>Em Progresso</div>
                      <div className="status-card-value" style={{ color: 'var(--warning)' }}>
                        {tasks.filter(t => t.status === 'DOING').length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'DOING').length / tasks.length) * 100 : 0}%`, background: 'var(--warning)' }}></div>
                      </div>
                    </div>

                    <div className="status-card">
                      <div className="status-card-label" style={{ color: 'var(--danger)' }}>Bloqueado</div>
                      <div className="status-card-value" style={{ color: 'var(--danger)' }}>
                        {tasks.filter(t => t.status === 'BLOCKED').length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'BLOCKED').length / tasks.length) * 100 : 0}%`, background: 'var(--danger)' }}></div>
                      </div>
                    </div>

                    <div className="status-card">
                      <div className="status-card-label" style={{ color: 'var(--accent)' }}>Concluído</div>
                      <div className="status-card-value" style={{ color: 'var(--accent)' }}>
                        {tasks.filter(t => t.status === 'DONE').length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100 : 0}%`, background: 'var(--accent)' }}></div>
                      </div>
                    </div>

                    <div className="status-card">
                      <div className="status-card-label" style={{ color: '#f43f5e' }}>Atrasado</div>
                      <div className="status-card-value" style={{ color: '#f43f5e' }}>
                        {tasks.filter(t => checkIsOverdue(t)).length}
                      </div>
                      <div className="status-progress-bg">
                        <div className="status-progress-bar" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => checkIsOverdue(t)).length / tasks.length) * 100 : 0}%`, background: '#f43f5e' }}></div>
                      </div>
                    </div>
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
                        <p style={{ color: 'var(--text-muted)' }}>Nenhum projeto ativo com tarefas atribuídas a você.</p>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontWeight: 600 }}>Pendências e Prazos</h3>
                      <span className="column-badge" style={{ background: 'var(--danger)', color: '#fff' }}>Urgente</span>
                    </div>
                    <div className="document-list">
                      {tasks.filter(t => t.status !== 'DONE' && t.assignees?.some(a => a.id === currentUser?.id)).length > 0 ? (
                        tasks.filter(t => t.status !== 'DONE' && t.assignees?.some(a => a.id === currentUser?.id)).map(t => {
                          const isOverdue = checkIsOverdue(t);
                          return (
                            <div key={t.id} className="document-item animate-hover" style={{ borderLeft: isOverdue ? '3px solid var(--danger)' : (t.status === 'DOING' ? '3px solid var(--warning)' : '3px solid var(--primary)') }}>
                              <div>
                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {t.title} 
                                  {isOverdue && <span style={{ fontSize: '0.75rem', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>ATRASADO</span>}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  Projeto: {projects.find(p => p.id === t.projectId)?.title || 'Carregando...'} • Entrega: {formatDateString(t.dataPrevistaFinalizar)}
                                </div>
                              </div>
                              <span className="column-badge" style={{ background: t.status === 'DOING' ? 'rgba(245,158,11,0.15)' : 'rgba(14,165,233,0.15)', color: t.status === 'DOING' ? 'var(--warning)' : 'var(--primary)' }}>
                                {t.status === 'DOING' ? 'Em Progresso' : 'A Fazer'}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>Todas as suas tarefas foram concluídas!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: AÇÃO (TELA DE CADASTRO E BANCO DE AÇÕES 5W2H) */}
        {activeTab === 'action' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Planejamento de Ações (5W2H)</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Cadastre e gerencie a lista estruturada de ações e cronograma de trabalho.</p>
            </div>

            {/* FORMULARIO DE CADASTRO DE TAREFA 5W2H */}
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') ? (
              <div className="card" style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus className="primary" /> Planejar Nova Ação Estruturada (5W2H)
                </h3>
                <form onSubmit={handleCreateTask}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">WHAT (O que fazer - Título)</label>
                      <input 
                         type="text" 
                         className="form-input" 
                         placeholder="Ex: INSTALAR GERADOR NA ALA DE UTI"
                         value={newTask.title}
                         onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                         required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">WHY (Por que fazer - Justificativa)</label>
                      <input 
                         type="text" 
                         className="form-input" 
                         placeholder="Ex: GARANTIR ENERGIA ININTERRUPTA PARA RESPIRADORES"
                         value={newTask.why}
                         onChange={e => setNewTask({ ...newTask, why: e.target.value })}
                         required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">WHERE (Onde será feito - Setor)</label>
                      <input 
                         type="text" 
                         className="form-input" 
                         placeholder="Ex: ALA DE UTI MÉDICA - 3º ANDAR"
                         value={newTask.where}
                         onChange={e => setNewTask({ ...newTask, where: e.target.value })}
                         required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">HOW (Como fazer - Plano de Ação)</label>
                      <input 
                         type="text" 
                         className="form-input" 
                         placeholder="Ex: CABEAR PELA REDE EXTERNA E TESTAR DISJUNTORES"
                         value={newTask.how}
                         onChange={e => setNewTask({ ...newTask, how: e.target.value })}
                         required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">HOW MUCH (Quanto custará - R$ Opcional)</label>
                      <input 
                         type="number" 
                         className="form-input" 
                         placeholder="Ex: 5000.00"
                         value={newTask.howMuch}
                         onChange={e => setNewTask({ ...newTask, howMuch: e.target.value })}
                       />
                    </div>

                    {/* MULTI ASSIGNEE SELECT FOR EXECUTANTES */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">WHO (Quem fará - Múltiplos Executores)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '110px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                        {analysts.map(analyst => {
                          const isChecked = newTask.assigneeIds.includes(analyst.id);
                          return (
                            <label key={analyst.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }} className="animate-hover">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const nextIds = isChecked
                                    ? newTask.assigneeIds.filter(id => id !== analyst.id)
                                    : [...newTask.assigneeIds, analyst.id];
                                  setNewTask({ ...newTask, assigneeIds: nextIds });
                                }}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '0.65rem', margin: 0 }}>
                                {analyst.name.substring(0,2).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.85rem' }}>{analyst.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Projeto Relacionado</label>
                      <select 
                        className="form-input"
                        value={newTask.projectId}
                        onChange={e => setNewTask({ ...newTask, projectId: e.target.value, subChapterId: '' })}
                      >
                        <option value="">Selecione um projeto...</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Sub-capítulo Relacionado</label>
                      <select 
                        className="form-input"
                        value={newTask.subChapterId}
                        onChange={e => setNewTask({ ...newTask, subChapterId: e.target.value })}
                        disabled={!newTask.projectId}
                        required
                      >
                        <option value="">Selecione um sub-capítulo...</option>
                        {newTask.projectId && projects.find(p => p.id === newTask.projectId)?.subChapters?.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">WHEN (Início Programado)</label>
                      <input 
                         type="date" 
                         className="form-input" 
                         value={newTask.dataInicioProgramada}
                         onChange={e => setNewTask({ ...newTask, dataInicioProgramada: e.target.value })}
                         required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">WHEN (Prazo Limite para Conclusão)</label>
                      <input 
                         type="date" 
                         className="form-input" 
                         value={newTask.dataPrevistaFinalizar}
                         onChange={e => setNewTask({ ...newTask, dataPrevistaFinalizar: e.target.value })}
                         required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ height: '48px', width: 'auto', padding: '0 40px', margin: 0 }}>
                      Salvar e Planejar Ação (5W2H)
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: 'var(--danger)', fontSize: '1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 16px', borderRadius: '8px' }} className="animate-hover">
                      <input 
                        type="checkbox" 
                        checked={newTask.isUrgent}
                        onChange={e => setNewTask({ ...newTask, isUrgent: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--danger)' }}
                      />
                      🚨 Marcar como Urgente
                    </label>
                  </div>
                </form>
              </div>
            ) : (
              <div className="alert-banner" style={{ background: 'rgba(14,165,233,0.04)', color: 'var(--primary)', borderColor: 'rgba(14,165,233,0.1)' }}>
                <Info size={24} />
                <div>
                  <strong>Aviso de Planejamento:</strong> A criação de novas ações estruturadas 5W2H é restrita a perfis de gestão (Gestores de TI e Super Admins). Você pode consultar e participar do andamento das ações na listagem abaixo ou no painel Kanban.
                </div>
              </div>
            )}

            
            {/* FILTER PANEL */}
            <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                <Filter size={18} /> Filtrar Demandas:
              </div>
              
              <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterProject}
                  onChange={e => setFilterProject(e.target.value)}
                >
                  <option value="">Todos os Projetos</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterAnalyst}
                  onChange={e => setFilterAnalyst(e.target.value)}
                >
                  <option value="">Todos os Executores</option>
                  {users.filter(u => u.role === 'ANALYST').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterUrgent}
                  onChange={e => setFilterUrgent(e.target.value)}
                >
                  <option value="ALL">Qualquer Urgência</option>
                  <option value="URGENT">Apenas Urgentes 🚨</option>
                  <option value="NORMAL">Apenas Normais</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">Qualquer Situação</option>
                  <option value="TODO">A Fazer</option>
                  <option value="DOING">Em Progresso</option>
                  <option value="BLOCKED">Bloqueado</option>
                  <option value="DONE">Concluído</option>
                  <option value="OVERDUE">Atrasado ⚠️</option>
                </select>
              </div>

              {(filterProject || filterAnalyst || filterUrgent !== 'ALL' || filterStatus !== 'ALL') && (
                <button 
                  className="btn btn-secondary" 
                  style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: '0.85rem' }}
                  onClick={() => {
                    setFilterProject('');
                    setFilterAnalyst('');
                    setFilterUrgent('ALL');
                    setFilterStatus('ALL');
                  }}
                >
                  Limpar Filtros
                </button>
              )}
            </div>
            {/* BANCO DE AÇÕES CADASTRADAS (TABELA) */}
            <div className="card">
              <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Banco de Ações Planejadas</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '16px' }}>O Que (WHAT)</th>
                      <th style={{ padding: '16px' }}>Por Que (WHY)</th>
                      <th style={{ padding: '16px' }}>Onde (WHERE)</th>
                      <th style={{ padding: '16px' }}>Quem (WHO)</th>
                      <th style={{ padding: '16px' }}>Quando Previsto (WHEN)</th>
                      <th style={{ padding: '16px' }}>Custo (HOW MUCH)</th>
                      <th style={{ padding: '16px' }}>Progresso</th>
                      <th style={{ padding: '16px' }}>Status</th>
                      {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '16px', fontWeight: 700 }}>
                          <div>{t.title}</div>
                          {t.project && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>
                              {t.project.title}
                              {t.subChapter && ` > ${t.subChapter.title}`}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{t.why || '-'}</td>
                        <td style={{ padding: '16px' }}>{t.where || '-'}</td>
                        <td style={{ padding: '16px' }}>
                          {t.assignees && t.assignees.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {t.assignees.map(a => (
                                <span key={a.id} className="column-badge" style={{ background: 'rgba(255,255,255,0.04)' }}>{a.name}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="column-badge" style={{ background: 'rgba(14,165,233,0.15)', color: 'var(--primary)' }}>EM ABERTO</span>
                          )}
                        </td>
                        <td style={{ padding: '16px', fontSize: '0.8rem' }}>
                          {formatDateString(t.dataInicioProgramada)} a {formatDateString(t.dataPrevistaFinalizar)}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>
                          {t.howMuch ? `R$ ${t.howMuch.toFixed(2)}` : 'R$ 0,00'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="gantt-progress-bg" style={{ width: '80px', margin: 0 }}>
                              <div className="gantt-progress-bar" style={{ width: `${t.porcentagemExecucao}%` }}></div>
                            </div>
                            <span>{t.porcentagemExecucao}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="column-badge" style={{ 
                            background: t.status === 'DONE' ? 'rgba(16, 185, 129, 0.15)' : (t.status === 'DOING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)'),
                            color: t.status === 'DONE' ? 'var(--accent)' : (t.status === 'DOING' ? 'var(--warning)' : 'var(--text-muted)')
                          }}>
                            {t.status === 'DONE' ? 'CONCLUÍDO' : (t.status === 'DOING' ? 'OPERANDO' : 'AGUARDANDO')}
                          </span>
                        </td>
                        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button className="icon-btn" onClick={() => handleDeleteTask(t.id, t.title)} style={{ width: '32px', height: '32px', color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: KANBAN BOARD */}
        {activeTab === 'kanban' && (() => {
          // Ordenar as tarefas do mais antigo para o mais recente por data de criacao
          const sortedTasks = [...filteredTasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          return (
            <div>
              <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Quadro Kanban de Execução</h1>
                  <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Arraste os cards com o mouse para alterar o status ou use as ações rápidas.</p>
                </div>
              </div>

              
            {/* FILTER PANEL */}
            <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}>
                <Filter size={18} /> Filtrar Demandas:
              </div>
              
              <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterProject}
                  onChange={e => setFilterProject(e.target.value)}
                >
                  <option value="">Todos os Projetos</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterAnalyst}
                  onChange={e => setFilterAnalyst(e.target.value)}
                >
                  <option value="">Todos os Executores</option>
                  {users.filter(u => u.role === 'ANALYST').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterUrgent}
                  onChange={e => setFilterUrgent(e.target.value)}
                >
                  <option value="ALL">Qualquer Urgência</option>
                  <option value="URGENT">Apenas Urgentes 🚨</option>
                  <option value="NORMAL">Apenas Normais</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">Qualquer Situação</option>
                  <option value="TODO">A Fazer</option>
                  <option value="DOING">Em Progresso</option>
                  <option value="BLOCKED">Bloqueado</option>
                  <option value="DONE">Concluído</option>
                  <option value="OVERDUE">Atrasado ⚠️</option>
                </select>
              </div>

              {(filterProject || filterAnalyst || filterUrgent !== 'ALL' || filterStatus !== 'ALL') && (
                <button 
                  className="btn btn-secondary" 
                  style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: '0.85rem' }}
                  onClick={() => {
                    setFilterProject('');
                    setFilterAnalyst('');
                    setFilterUrgent('ALL');
                    setFilterStatus('ALL');
                  }}
                >
                  Limpar Filtros
                </button>
              )}
            </div>
              <div className="kanban-board">
                {/* COLUNA: A FAZER */}
                <div 
                  className="kanban-column"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'TODO')}
                >
                  <div className="column-header">
                    <div className="column-title"><Clock size={18} className="warning" /> A Fazer</div>
                    <span className="column-badge">{sortedTasks.filter(t => t.status === 'TODO').length}</span>
                  </div>
                  {sortedTasks.filter(t => t.status === 'TODO').map(t => {
                    const isOverdue = checkIsOverdue(t);
                    const isUserAssigned = t.assignees?.some(a => a.id === currentUser?.id);
                    const hasAssignees = t.assignees && t.assignees.length > 0;
                    
                    return (
                      <div 
                        key={t.id} 
                        className="task-card animate-hover" 
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        style={{ 
                          borderLeft: t.isUrgent ? '3px solid var(--danger)' : isOverdue ? '3px solid var(--danger)' : '1px solid var(--border-color)', 
                          outline: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                          cursor: 'grab'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className="confidential-badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                            {(() => {
                              const proj = projects.find(p => p.id === t.projectId);
                              if (!proj) return 'DEMANDA AVULSA';
                              if (t.subChapter) {
                                return (
                                  <span>
                                    {proj.title} {' > '} {t.subChapter.title}
                                    {proj.categoria && <span style={{ opacity: 0.7, fontSize: '0.65rem', color: 'var(--primary)', marginLeft: '6px', fontWeight: 700 }}>({proj.categoria.toUpperCase()})</span>}
                                  </span>
                                );
                              }
                              return (
                                <span>
                                  {proj.title}
                                  {proj.categoria && <span style={{ opacity: 0.7, fontSize: '0.65rem', color: 'var(--primary)', marginLeft: '6px', fontWeight: 700 }}>({proj.categoria.toUpperCase()})</span>}
                                </span>
                              );
                            })()}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {t.isUrgent && <span style={{ fontSize: '0.65rem', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>🚨 URGENTE</span>}
                            {isOverdue && <span style={{ fontSize: '0.65rem', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>ATRASADA</span>}
                          </div>
                        </div>
                        
                        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{t.title}</h4>
                        
                        {hasAssignees ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 650 }}>Executores:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {t.assignees?.map(a => (
                                <span key={a.id} className="column-badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.7rem' }}>
                                  {a.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: '12px', background: 'rgba(14,165,233,0.05)', border: '1px dashed rgba(14,165,233,0.3)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>DEMANDA EM ABERTO</span>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem', height: 'auto', borderRadius: '6px' }}
                              onClick={() => handleClaimTask(t.id)}
                            >
                              Assumir Demanda
                            </button>
                          </div>
                        )}

                        {hasAssignees && !isUserAssigned && (
                          <div style={{ marginTop: '8px' }}>
                            <button 
                              className="btn btn-primary animate-hover" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', borderRadius: '4px', background: 'rgba(14,165,233,0.15)', color: 'var(--primary)', border: '1px solid rgba(14,165,233,0.3)', width: '100%' }}
                              onClick={() => handleClaimTask(t.id)}
                            >
                              ➕ Participar desta Ação
                            </button>
                          </div>
                        )}

                        {hasAssignees && (
                          <div className="gantt-progress-bg" style={{ marginTop: '10px', marginBottom: '0' }}>
                            <div className="gantt-progress-bar" style={{ width: `${t.porcentagemExecucao}%` }}></div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button 
                            className="action-icon" 
                            style={{ fontSize: '0.7rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)' }}
                            onClick={() => setActiveTaskDetailId(activeTaskDetailId === t.id ? null : t.id)}
                          >
                            {activeTaskDetailId === t.id ? 'Fechar Detalhes' : 'Ver 5W2H / Obs'}
                          </button>
                          
                          {isUserAssigned && (
                            <>
                              <button 
                                className="action-icon"
                                style={{ fontSize: '0.7rem', padding: '4px 6px' }}
                                onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                              >
                                Iniciar
                              </button>
                              <button 
                                className="action-icon"
                                style={{ fontSize: '0.7rem', padding: '4px 6px', color: 'var(--warning)' }}
                                onClick={async () => {
                                  const reason = window.prompt('Justificativa de bloqueio (opcional):');
                                  if (reason === null) return;
                                  try {
                                    await api.patch(`/tasks/${t.id}/status`, { status: 'BLOCKED', blockedReason: reason.trim() });
                                    showToast('Tarefa bloqueada!');
                                    fetchTasks();
                                  } catch (err) {
                                    showToast('Erro ao bloquear tarefa.');
                                  }
                                }}
                              >
                                Bloquear
                              </button>
                            </>
                          )}
                        </div>

                        {activeTaskDetailId === t.id && renderTaskDetails(t)}
                      </div>
                    );
                  })}
                </div>

                {/* COLUNA: EM EXECUÇÃO */}
                <div 
                  className="kanban-column"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'DOING')}
                >
                  <div className="column-header">
                    <div className="column-title"><Clock size={18} className="primary" /> Em Progresso</div>
                    <span className="column-badge">{sortedTasks.filter(t => t.status === 'DOING').length}</span>
                  </div>
                  {sortedTasks.filter(t => t.status === 'DOING').map(t => {
                    const isOverdue = checkIsOverdue(t);
                    const isUserAssigned = t.assignees?.some(a => a.id === currentUser?.id);
                    const hasAssignees = t.assignees && t.assignees.length > 0;
                    
                    return (
                      <div 
                        key={t.id} 
                        className="task-card animate-hover" 
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        style={{ 
                          borderLeft: t.isUrgent ? '3px solid var(--danger)' : isOverdue ? '3px solid var(--danger)' : '3px solid var(--warning)', 
                          outline: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                          cursor: 'grab'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className="confidential-badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                            {(() => {
                              const proj = projects.find(p => p.id === t.projectId);
                              if (!proj) return 'PROJETO';
                              if (t.subChapter) {
                                return `${proj.title} > ${t.subChapter.title}`;
                              }
                              return proj.title;
                            })()}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {t.isUrgent && <span style={{ fontSize: '0.65rem', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>🚨 URGENTE</span>}
                            {isOverdue && <span style={{ fontSize: '0.65rem', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>ATRASADA</span>}
                          </div>
                        </div>

                        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{t.title}</h4>
                        
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 650 }}>Executores:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {t.assignees?.map(a => (
                              <span key={a.id} className="column-badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.7rem' }}>
                                {a.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {hasAssignees && !isUserAssigned && (
                          <div style={{ marginTop: '8px' }}>
                            <button 
                              className="btn btn-primary animate-hover" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', borderRadius: '4px', background: 'rgba(14,165,233,0.15)', color: 'var(--primary)', border: '1px solid rgba(14,165,233,0.3)', width: '100%' }}
                              onClick={() => handleClaimTask(t.id)}
                            >
                              ➕ Participar desta Ação
                            </button>
                          </div>
                        )}

                        {isUserAssigned && (
                          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                              type="range" 
                              min="10" 
                              max="95" 
                              step="5"
                              value={t.porcentagemExecucao} 
                              onChange={(e) => handleUpdateTaskProgress(t.id, parseInt(e.target.value))}
                              style={{ flexGrow: 1, height: '4px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8rem', minWidth: '30px', textAlign: 'right' }}>{t.porcentagemExecucao}%</span>
                          </div>
                        )}

                        {!isUserAssigned && hasAssignees && (
                          <div className="gantt-progress-bg" style={{ marginTop: '10px', marginBottom: '0' }}>
                            <div className="gantt-progress-bar" style={{ width: `${t.porcentagemExecucao}%` }}></div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Progresso: {t.porcentagemExecucao}%</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button 
                            className="action-icon" 
                            style={{ fontSize: '0.7rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)' }}
                            onClick={() => setActiveTaskDetailId(activeTaskDetailId === t.id ? null : t.id)}
                          >
                            {activeTaskDetailId === t.id ? 'Fechar Detalhes' : 'Ver 5W2H / Obs'}
                          </button>
                          
                          {isUserAssigned && (
                            <>
                              <button 
                                className="action-icon"
                                style={{ fontSize: '0.7rem', padding: '4px 6px' }}
                                onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                              >
                                Concluir (100%)
                              </button>
                              <button 
                                className="action-icon"
                                style={{ fontSize: '0.7rem', padding: '4px 6px', color: 'var(--warning)' }}
                                onClick={async () => {
                                  const reason = window.prompt('Justificativa de bloqueio (opcional):');
                                  if (reason === null) return;
                                  try {
                                    await api.patch(`/tasks/${t.id}/status`, { status: 'BLOCKED', blockedReason: reason.trim() });
                                    showToast('Tarefa bloqueada!');
                                    fetchTasks();
                                  } catch (err) {
                                    showToast('Erro ao bloquear tarefa.');
                                  }
                                }}
                              >
                                Bloquear
                              </button>
                            </>
                          )}
                        </div>

                        {activeTaskDetailId === t.id && renderTaskDetails(t)}
                      </div>
                    );
                  })}
                </div>

                {/* COLUNA: BLOQUEADOS */}
                <div 
                  className="kanban-column"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'BLOCKED')}
                  style={{ background: 'rgba(239, 68, 68, 0.01)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
                >
                  <div className="column-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.15)' }}>
                    <div className="column-title" style={{ color: 'var(--danger)' }}><ShieldCheck size={18} className="danger" /> Bloqueados</div>
                    <span className="column-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                      {sortedTasks.filter(t => t.status === 'BLOCKED').length}
                    </span>
                  </div>
                  {sortedTasks.filter(t => t.status === 'BLOCKED').map(t => {
                    const daysBlocked = t.blockedAt ? Math.floor((Date.now() - new Date(t.blockedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const needsJustification = daysBlocked >= 7 && !t.blockedReason;
                    const isUserAssigned = t.assignees?.some(a => a.id === currentUser?.id);
                    
                    return (
                      <div 
                        key={t.id} 
                        className="task-card animate-hover" 
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        style={{ 
                          borderLeft: '3px solid var(--danger)', 
                          outline: needsJustification ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                          boxShadow: needsJustification ? '0 0 12px rgba(239, 68, 68, 0.2)' : 'none',
                          cursor: 'grab'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className="confidential-badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                            {(() => {
                              const proj = projects.find(p => p.id === t.projectId);
                              if (!proj) return 'PROJETO';
                              if (t.subChapter) {
                                return `${proj.title} > ${t.subChapter.title}`;
                              }
                              return proj.title;
                            })()}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {t.isUrgent && <span style={{ fontSize: '0.65rem', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>🚨 URGENTE</span>}
                            <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '4px', fontWeight: 850 }}>BLOQUEADA</span>
                          </div>
                        </div>

                        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{t.title}</h4>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 650 }}>Executores:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {t.assignees?.map(a => (
                              <span key={a.id} className="column-badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.7rem' }}>
                                {a.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginTop: '12px' }}>
                          {needsJustification ? (
                            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem', color: '#ff8a8a', fontWeight: 600 }}>
                              ⚠️ Bloqueado há {daysBlocked} dias sem justificativa!
                              <button 
                                className="btn btn-primary animate-hover" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto', borderRadius: '6px', marginTop: '8px', background: 'var(--danger)', border: 'none', width: '100%' }}
                                onClick={async () => {
                                  const reason = window.prompt('Digite a justificativa obrigatória de bloqueio:');
                                  if (reason && reason.trim()) {
                                    try {
                                      await api.patch(`/tasks/${t.id}/status`, { status: 'BLOCKED', blockedReason: reason.trim() });
                                      showToast('Justificativa salva com sucesso!');
                                      fetchTasks();
                                    } catch (err) {
                                      showToast('Erro ao salvar justificativa.');
                                    }
                                  }
                                }}
                              >
                                Inserir Justificativa Obrigatória
                              </button>
                            </div>
                          ) : t.blockedReason ? (
                            <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem' }}>
                              <strong>Justificativa de Bloqueio:</strong> 
                              <p style={{ color: 'var(--text-main)', margin: '4px 0 0 0', fontStyle: 'italic' }}>"{t.blockedReason}"</p>
                              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>Bloqueado há {daysBlocked} dias</span>
                            </div>
                          ) : (
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', fontSize: '0.75rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Sem justificativa registrada.</span>
                              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Bloqueado há {daysBlocked} dias</span>
                              {isUserAssigned && (
                                <button 
                                  className="action-icon" 
                                  style={{ display: 'block', marginTop: '6px', padding: 0, fontSize: '0.7rem', textDecoration: 'underline' }}
                                  onClick={async () => {
                                    const reason = window.prompt('Justificativa de bloqueio:');
                                    if (reason && reason.trim()) {
                                      try {
                                        await api.patch(`/tasks/${t.id}/status`, { status: 'BLOCKED', blockedReason: reason.trim() });
                                        showToast('Justificativa salva com sucesso!');
                                        fetchTasks();
                                      } catch (err) {
                                        showToast('Erro ao salvar justificativa.');
                                      }
                                    }
                                  }}
                                >
                                  Inserir Justificativa
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button 
                            className="action-icon" 
                            style={{ fontSize: '0.7rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)' }}
                            onClick={() => setActiveTaskDetailId(activeTaskDetailId === t.id ? null : t.id)}
                          >
                            {activeTaskDetailId === t.id ? 'Fechar Detalhes' : 'Ver 5W2H / Obs'}
                          </button>
                          
                          {isUserAssigned && (
                            <button 
                              className="action-icon"
                              style={{ fontSize: '0.7rem', padding: '4px 6px' }}
                              onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                            >
                              Retomar
                            </button>
                          )}
                        </div>

                        {activeTaskDetailId === t.id && renderTaskDetails(t)}
                      </div>
                    );
                  })}
                </div>

                {/* COLUNA: CONCLUÍDO */}
                <div 
                  className="kanban-column"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'DONE')}
                >
                  <div className="column-header">
                    <div className="column-title"><CheckCircle size={18} className="accent" /> Concluído</div>
                    <span className="column-badge">{sortedTasks.filter(t => t.status === 'DONE').length}</span>
                  </div>
                  {sortedTasks.filter(t => t.status === 'DONE').map(t => {
                    const isUserAssigned = t.assignees?.some(a => a.id === currentUser?.id);
                    
                    return (
                      <div 
                        key={t.id} 
                        className="task-card animate-hover" 
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        style={{ borderLeft: '3px solid var(--accent)', cursor: 'grab' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className="confidential-badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                            {(() => {
                              const proj = projects.find(p => p.id === t.projectId);
                              if (!proj) return 'PROJETO';
                              if (t.subChapter) {
                                return `${proj.title} > ${t.subChapter.title}`;
                              }
                              return proj.title;
                            })()}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {t.isUrgent && <span style={{ fontSize: '0.65rem', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>🚨 URGENTE</span>}
                          </div>
                        </div>

                        <h4 style={{ fontSize: '1rem', fontWeight: 700, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{t.title}</h4>
                        
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 650 }}>Executores:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {t.assignees?.map(a => (
                              <span key={a.id} className="column-badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.7rem' }}>
                                {a.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="gantt-progress-bg" style={{ marginTop: '10px', marginBottom: '0' }}>
                          <div className="gantt-progress-bar" style={{ width: '100%', background: 'var(--accent)' }}></div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button 
                            className="action-icon" 
                            style={{ fontSize: '0.7rem', padding: '4px 6px', background: 'rgba(255,255,255,0.03)' }}
                            onClick={() => setActiveTaskDetailId(activeTaskDetailId === t.id ? null : t.id)}
                          >
                            {activeTaskDetailId === t.id ? 'Fechar Detalhes' : 'Ver 5W2H / Obs'}
                          </button>
                          
                          {isUserAssigned && (
                            <button 
                              className="action-icon"
                              style={{ fontSize: '0.7rem', padding: '4px 6px' }}
                              onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                            >
                              Reiniciar
                            </button>
                          )}
                        </div>

                        {activeTaskDetailId === t.id && renderTaskDetails(t)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}{/* TAB: PROJETOS */}
        {activeTab === 'projects' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Gestão de Projetos</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Crie e administre as demandas e projetos de TI com cronogramas estruturados.</p>
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
                      placeholder="Ex: IMPLANTAÇÃO DE SERVIDORES DE BANCO DE DADOS"
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
                      placeholder="Descreva detalhadamente o escopo e objetivos desta demanda de TI..."
                      value={newProject.description}
                      onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="projectCategory">Origem / Classificação da Demanda</label>
                    <select
                      id="projectCategory"
                      name="projectCategory"
                      className="form-input"
                      value={newProject.categoria}
                      onChange={e => setNewProject({ ...newProject, categoria: e.target.value })}
                      required
                    >
                      <option value="">Selecione a Origem...</option>
                      <option value="Jornada Digital">Jornada Digital</option>
                      <option value="Corporativo">Corporativo</option>
                      <option value="HSC">HSC</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Data de Início do Projeto</label>
                      <input 
                        type="date"
                        className="form-input"
                        value={newProject.dataInicio}
                        onChange={e => setNewProject({ ...newProject, dataInicio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Data de Término do Projeto</label>
                      <input 
                        type="date"
                        className="form-input"
                        value={newProject.dataFim}
                        onChange={e => setNewProject({ ...newProject, dataFim: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Gestores Responsáveis (Múltiplos)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                      {gestores.filter(g => g.isActive).map(gestor => {
                        const isChecked = newProject.responsibleIds.includes(gestor.id);
                        return (
                          <label key={gestor.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }} className="animate-hover">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const nextIds = isChecked
                                  ? newProject.responsibleIds.filter(id => id !== gestor.id)
                                  : [...newProject.responsibleIds, gestor.id];
                                setNewProject({ ...newProject, responsibleIds: nextIds });
                              }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '0.65rem', margin: 0 }}>
                              {gestor.name.substring(0,2).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.85rem' }}>{gestor.name} {gestor.cargo ? `(${gestor.cargo})` : ''}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: 'auto', marginTop: '10px' }}>
                    Criar Projeto Estrutural
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Projetos Cadastrados</h3>
              <div className="document-list">
                {projects.length > 0 ? (
                  projects.map(p => (
                    <div key={p.id} className="document-item animate-hover" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center' }}>{p.title} {renderProjectCategoryBadge(p.categoria)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {p.description || 'Sem descrição.'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '6px', fontWeight: 600 }}>
                            Cronograma: {formatDateString(p.dataInicio)} a {formatDateString(p.dataFim)}
                            {p.responsibles && p.responsibles.length > 0 && (
                              <span> • Responsáveis: {p.responsibles.map(r => r.name).join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleOpenEditProject(p)}
                                style={{ width: 'auto', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', height: 'auto', borderRadius: '6px' }}
                              >
                                <Edit size={14} /> Editar
                              </button>
                              <button 
                                className="btn btn-danger" 
                                onClick={() => handleDeleteProject(p.id, p.title)}
                                style={{ width: 'auto', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', height: 'auto', borderRadius: '6px', backgroundColor: 'var(--danger)', color: '#fff', border: 'none' }}
                              >
                                <Trash2 size={14} /> Excluir
                              </button>
                            </>
                          )}
                          <span className="column-badge" style={{ background: 'rgba(14,165,233,0.15)', color: 'var(--primary)', margin: 0 }}>
                            {tasks.filter(t => t.projectId === p.id).length} Tarefas
                          </span>
                        </div>
                      </div>

                      {/* Nested Collapsible Subchapters Section */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>SUB-CAPÍTULOS ({p.subChapters?.length || 0})</span>
                          
                          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input 
                                type="text"
                                className="form-input"
                                placeholder="Novo sub-capítulo..."
                                style={{ height: '28px', fontSize: '0.75rem', width: '150px', padding: '0 8px', margin: 0 }}
                                value={newSubChapterTitle[p.id] || ''}
                                onChange={e => setNewSubChapterTitle({ ...newSubChapterTitle, [p.id]: e.target.value })}
                              />
                              <button 
                                className="btn btn-primary"
                                onClick={() => handleCreateSubChapter(p.id)}
                                style={{ height: '28px', width: 'auto', padding: '0 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Plus size={12} /> Add
                              </button>
                            </div>
                          )}
                        </div>

                        {p.subChapters && p.subChapters.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                            {p.subChapters.map(sub => {
                              const subTasks = tasks.filter(t => t.subChapterId === sub.id);
                              return (
                                <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                  <div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{sub.title}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({subTasks.length} ações)</span>
                                  </div>
                                  {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
                                    <button 
                                      onClick={() => handleDeleteSubChapter(sub.id, sub.title)}
                                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                      title="Excluir sub-capítulo"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum sub-capítulo cadastrado.</div>
                        )}
                      </div>
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
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Gestão de Usuários</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Gerencie perfis de acesso, senhas e permissões da equipe de TI.</p>
              </div>
              <button className="btn btn-primary" onClick={openAddUserModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto' }}>
                <Plus size={20} />
                Adicionar Usuário
              </button>
            </div>

            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px' }}>Nome</th>
                      <th style={{ padding: '16px' }}>Cargo/Função</th>
                      <th style={{ padding: '16px' }}>E-mail</th>
                      <th style={{ padding: '16px' }}>Perfil</th>
                      <th style={{ padding: '16px' }}>Status</th>
                      <th style={{ padding: '16px' }}>Gestor Direto</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '16px' }}>{u.cargo || 'Não especificado'}</td>
                        <td style={{ padding: '16px' }}>{u.email}</td>
                        <td style={{ padding: '16px' }}>
                          <span className="column-badge" style={{ 
                            background: u.role === 'SUPER_ADMIN' ? 'rgba(239, 68, 68, 0.15)' : (u.role === 'MANAGER' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(14, 165, 233, 0.15)'),
                            color: u.role === 'SUPER_ADMIN' ? 'var(--danger)' : (u.role === 'MANAGER' ? 'var(--warning)' : 'var(--primary)')
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="dot" style={{ 
                            background: u.isActive ? 'var(--accent)' : 'var(--danger)',
                            boxShadow: u.isActive ? '0 0 6px var(--accent)' : '0 0 6px var(--danger)',
                            marginRight: '8px'
                          }}></span>
                          {u.isActive ? 'Ativo' : 'Inativo'}
                        </td>
                        <td style={{ padding: '16px' }}>{u.gestor?.name || 'Sem gestor vinculado'}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="icon-btn" onClick={() => openEditUserModal(u)} style={{ width: '32px', height: '32px' }}>
                              <Edit size={14} />
                            </button>
                            <button className="icon-btn" onClick={() => handleDeleteUser(u.id, u.name)} style={{ width: '32px', height: '32px', color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: GESTORES */}
        {activeTab === 'gestores' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (
          <div>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Gestão de Lideranças</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Cadastre e gerencie coordenadores e diretores responsáveis pelos fluxos de TI.</p>
              </div>
              <button className="btn btn-primary" onClick={openAddGestorModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto' }}>
                <Plus size={20} />
                Adicionar Gestor
              </button>
            </div>

            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px' }}>Nome</th>
                      <th style={{ padding: '16px' }}>E-mail</th>
                      <th style={{ padding: '16px' }}>Cargo / Função</th>
                      <th style={{ padding: '16px' }}>Status</th>
                      <th style={{ padding: '16px' }}>Carga de Equipe e Projetos</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gestores.map(g => (
                      <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{g.name}</td>
                        <td style={{ padding: '16px' }}>{g.email}</td>
                        <td style={{ padding: '16px' }}>{g.cargo || 'Não especificado'}</td>
                        <td style={{ padding: '16px' }}>
                          <span className="dot" style={{ 
                            background: g.isActive ? 'var(--accent)' : 'var(--danger)',
                            boxShadow: g.isActive ? '0 0 6px var(--accent)' : '0 0 6px var(--danger)',
                            marginRight: '8px'
                          }}></span>
                          {g.isActive ? 'Ativo' : 'Inativo'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="column-badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-main)' }}>
                            {g._count?.users || 0} Colaboradores
                          </span>
                          <span className="column-badge" style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--primary)', marginLeft: '8px' }}>
                            {g._count?.projects || 0} Projetos
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="icon-btn" onClick={() => openEditGestorModal(g)} style={{ width: '32px', height: '32px' }}>
                              <Edit size={14} />
                            </button>
                            <button className="icon-btn" onClick={() => handleDeleteGestor(g.id, g.name)} style={{ width: '32px', height: '32px', color: 'var(--danger)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD/EDIT USER */}
      {isUserModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card card animate-scale" style={{ position: 'relative', background: '#0d111b' }}>
            <button 
              onClick={() => setIsUserModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users className="primary" /> {editingUser ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
            </h3>

            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="userName">Nome Completo</label>
                <input 
                  id="userName"
                  name="userName"
                  type="text" 
                  className="form-input" 
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="userEmail">E-mail Corporativo</label>
                <input 
                  id="userEmail"
                  name="userEmail"
                  type="email" 
                  className="form-input" 
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  required 
                />
              </div>

              {editingUser ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="userPassword">Senha (Deixe em branco para manter)</label>
                  <input 
                    id="userPassword"
                    name="userPassword"
                    type="password" 
                    className="form-input" 
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  💡 <strong>Senha Temporária:</strong> A senha temporária padrão <code>123</code> será gerada para este usuário. Ele será obrigado a redefinir para uma senha forte no primeiro acesso.
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="userCargo">Cargo / Função</label>
                <input 
                  id="userCargo"
                  name="userCargo"
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Analista de TI, Desenvolvedor Backend"
                  value={userForm.cargo}
                  onChange={e => setUserForm({ ...userForm, cargo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="userRole">Nível de Acesso (Perfil)</label>
                <select 
                  id="userRole"
                  name="userRole"
                  className="form-input"
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}
                >
                  <option value="ANALYST">Analista (Execução Operacional)</option>
                  <option value="MANAGER">Gestor de TI (Coordenação)</option>
                  <option value="SUPER_ADMIN">Super Administrador (Controle Total)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="userGestor">Gestor Responsável</label>
                <select
                  id="userGestor"
                  name="userGestor"
                  className="form-input"
                  value={userForm.gestorId}
                  onChange={e => setUserForm({ ...userForm, gestorId: e.target.value })}
                >
                  <option value="">Nenhum (Reporta-se diretamente ao diretor)</option>
                  {gestores.filter(g => g.isActive).map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                <input 
                  id="userActive"
                  name="userActive"
                  type="checkbox"
                  checked={userForm.isActive}
                  onChange={e => setUserForm({ ...userForm, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="userActive" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Conta Ativa</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsUserModalOpen(false)}
                  style={{ width: 'auto' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: 'auto' }}
                >
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT GESTOR */}
      {isGestorModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card card animate-scale" style={{ position: 'relative', background: '#0d111b' }}>
            <button 
              onClick={() => setIsGestorModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck className="primary" /> {editingGestor ? 'Editar Gestor' : 'Adicionar Novo Gestor'}
            </h3>

            <form onSubmit={handleSaveGestor}>
              <div className="form-group">
                <label className="form-label" htmlFor="gestorName">Nome do Gestor</label>
                <input 
                  id="gestorName"
                  name="gestorName"
                  type="text" 
                  className="form-input" 
                  value={gestorForm.name}
                  onChange={e => setGestorForm({ ...gestorForm, name: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gestorEmail">E-mail Corporativo</label>
                <input 
                  id="gestorEmail"
                  name="gestorEmail"
                  type="email" 
                  className="form-input" 
                  value={gestorForm.email}
                  onChange={e => setGestorForm({ ...gestorForm, email: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gestorCargo">Cargo / Função</label>
                <input 
                  id="gestorCargo"
                  name="gestorCargo"
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Diretor Clínico, Coordenador de TI"
                  value={gestorForm.cargo}
                  onChange={e => setGestorForm({ ...gestorForm, cargo: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', marginBottom: '20px' }}>
                <input 
                  id="gestorActive"
                  name="gestorActive"
                  type="checkbox"
                  checked={gestorForm.isActive}
                  onChange={e => setGestorForm({ ...gestorForm, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="gestorActive" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>Gestor Ativo</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsGestorModalOpen(false)}
                  style={{ width: 'auto' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: 'auto' }}
                >
                  Salvar Gestor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROJECT */}
      {isEditProjectModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card card animate-scale" style={{ position: 'relative', background: '#0d111b' }}>
            <button 
              onClick={() => setIsEditProjectModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Edit className="primary" /> Editar Projeto Estrutural
            </h3>

            <form onSubmit={handleUpdateProject}>
              <div className="form-group">
                <label className="form-label">Título do Projeto</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editProjectForm.title}
                  onChange={e => setEditProjectForm({ ...editProjectForm, title: e.target.value.toUpperCase() })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição / Escopo</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  value={editProjectForm.description}
                  onChange={e => setEditProjectForm({ ...editProjectForm, description: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Origem / Classificação da Demanda</label>
                <select
                  className="form-input"
                  value={editProjectForm.categoria}
                  onChange={e => setEditProjectForm({ ...editProjectForm, categoria: e.target.value })}
                  required
                >
                  <option value="">Selecione a Origem...</option>
                  <option value="Jornada Digital">Jornada Digital</option>
                  <option value="Corporativo">Corporativo</option>
                  <option value="HSC">HSC</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Data de Início</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={editProjectForm.dataInicio}
                    onChange={e => setEditProjectForm({ ...editProjectForm, dataInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Data de Término</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={editProjectForm.dataFim}
                    onChange={e => setEditProjectForm({ ...editProjectForm, dataFim: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Gestores Responsáveis (Múltiplos)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                  {gestores.filter(g => g.isActive).map(gestor => {
                    const isChecked = editProjectForm.responsibleIds.includes(gestor.id);
                    return (
                      <label key={gestor.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }} className="animate-hover">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const nextIds = isChecked
                              ? editProjectForm.responsibleIds.filter(id => id !== gestor.id)
                              : [...editProjectForm.responsibleIds, gestor.id];
                            setEditProjectForm({ ...editProjectForm, responsibleIds: nextIds });
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '0.65rem', margin: 0 }}>
                          {gestor.name.substring(0,2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>{gestor.name} {gestor.cargo ? `(${gestor.cargo})` : ''}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditProjectModalOpen(false)}
                  style={{ width: 'auto' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: 'auto' }}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
