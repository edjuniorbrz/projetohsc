import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import api from './services/api';
import { LayoutDashboard, Kanban, FolderPlus, FileLock, Upload, Download, LogOut, Plus, AlertTriangle, CheckCircle, FileText, Clock, ShieldCheck, Bell, Calendar, ShieldAlert } from 'lucide-react';
function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentUser, setCurrentUser] = useState(null);
    // Auth Form State
    const [isRegistering, setIsRegistering] = useState(false);
    const [authForm, setAuthForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'ANALYST'
    });
    // App Core State
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [analysts, setAnalysts] = useState([]);
    // Create Modals/Forms State
    const [newProject, setNewProject] = useState({ title: '', description: '' });
    const [newTask, setNewTask] = useState({ title: '', projectId: '', assigneeId: '' });
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadConfidential, setUploadConfidential] = useState(false);
    const [uploadTaskId, setUploadTaskId] = useState('');
    // UI Enhancements State
    const [notifications, setNotifications] = useState([
        { id: '1', text: 'Bem-vindo ao Portal de Projetos TI & Hospitalar', time: 'Agora', read: false, type: 'info' },
        { id: '2', text: 'Banco de dados central sincronizado via Prisma', time: '5m atras', read: false, type: 'success' },
        { id: '3', text: 'Conformidade LGPD e HIPAA ativa para todos os anexos', time: '10m atras', read: true, type: 'info' }
    ]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLgpdModal, setShowLgpdModal] = useState(false);
    const [blockedDoc, setBlockedDoc] = useState(null);
    // Alert/Toast State
    const [toastMessage, setToastMessage] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            try {
                if (storedUser === 'undefined')
                    throw new Error('Invalid user');
                const parsed = JSON.parse(storedUser);
                setIsAuthenticated(true);
                setCurrentUser(parsed);
            }
            catch (e) {
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
            fetchDocuments();
        }
    }, [isAuthenticated, activeTab]);
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 5000);
    };
    const playNotificationSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.value = 880; // A5
            gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.12);
            gain2.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.17);
            gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
            osc2.start(audioCtx.currentTime + 0.12);
            osc2.stop(audioCtx.currentTime + 0.4);
        }
        catch (e) {
            console.error('Falha ao reproduzir som de notificacao:', e);
        }
    };
    const addNotification = (text, type = 'info') => {
        const newNotif = {
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
        }
        catch (err) {
            console.error(err);
        }
    };
    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(Array.isArray(response.data) ? response.data : []);
        }
        catch (err) {
            console.error(err);
        }
    };
    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks');
            setTasks(Array.isArray(response.data) ? response.data : []);
        }
        catch (err) {
            console.error(err);
        }
    };
    const fetchAnalysts = async () => {
        try {
            const response = await api.get('/auth/analysts');
            setAnalysts(Array.isArray(response.data) ? response.data : []);
        }
        catch (err) {
            console.error(err);
        }
    };
    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents');
            setDocuments(Array.isArray(response.data) ? response.data : []);
        }
        catch (err) {
            console.error(err);
        }
    };
    const handleLogin = async (e) => {
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
            showToast(`Bem-vindo de volta, ${user.name}!`);
            playNotificationSound();
        }
        catch (err) {
            showToast(err.response?.data?.error || 'Erro ao realizar login');
        }
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', authForm);
            showToast('Conta criada com sucesso! Faca login para continuar.');
            setIsRegistering(false);
        }
        catch (err) {
            showToast(err.response?.data?.error || 'Erro ao realizar cadastro');
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
    };
    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            addNotification(`Novo projeto criado: "${newProject.title}"`, 'success');
            setNewProject({ title: '', description: '' });
            fetchProjects();
            fetchDashboard();
            showToast('Projeto criado com sucesso!');
        }
        catch (err) {
            showToast(err.response?.data?.error || 'Erro ao criar projeto');
        }
    };
    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/tasks', newTask);
            addNotification(`Nova tarefa designada: "${newTask.title}"`, 'success');
            const assignedUser = analysts.find(a => a.id === response.data.assigneeId) || (response.data.assigneeId === currentUser?.id ? currentUser : null);
            const createdTask = {
                id: response.data.id,
                title: response.data.title,
                status: 'TODO',
                projectId: response.data.projectId,
                assigneeId: response.data.assigneeId,
                assignee: assignedUser ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email } : undefined,
                documents: []
            };
            setTasks([...tasks, createdTask]);
            setNewTask({ title: '', projectId: '', assigneeId: '' });
            fetchDashboard();
            showToast('Tarefa designada com sucesso!');
        }
        catch (err) {
            showToast(err.response?.data?.error || 'Erro ao criar tarefa');
        }
    };
    const handleUpdateTaskStatus = async (taskId, currentStatus) => {
        let nextStatus = 'TODO';
        if (currentStatus === 'TODO')
            nextStatus = 'DOING';
        else if (currentStatus === 'DOING')
            nextStatus = 'DONE';
        else
            nextStatus = 'TODO';
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
            addNotification(`Status da tarefa "${tasks.find(t => t.id === taskId)?.title}" atualizado para ${nextStatus}`, 'info');
            fetchDashboard();
            showToast('Status da tarefa atualizado!');
        }
        catch (err) {
            showToast(err.response?.data?.error || 'Erro ao atualizar status');
        }
    };
    const handleUploadDocument = async (e) => {
        e.preventDefault();
        if (!uploadFile || !uploadTaskId) {
            showToast('Selecione um arquivo e uma tarefa correspondente.');
            return;
        }
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('taskId', uploadTaskId);
        formData.append('isConfidential', String(uploadConfidential));
        try {
            const response = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newDoc = {
                id: response.data.id,
                originalName: response.data.originalName,
                isConfidential: response.data.isConfidential,
                taskId: response.data.taskId
            };
            setDocuments([...documents, newDoc]);
            addNotification(`Documento "${newDoc.originalName}" anexado com sucesso.`, 'info');
            setUploadFile(null);
            setUploadTaskId('');
            setUploadConfidential(false);
            showToast('Documento anexado com sucesso!');
        }
        catch (err) {
            showToast(err.response?.data?.error || 'Erro ao enviar documento');
        }
    };
    const handleDownloadDocument = async (doc) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('Download concluido.');
        }
        catch (err) {
            if (err.response?.status === 403) {
                setBlockedDoc(doc);
                setShowLgpdModal(true);
            }
            else {
                showToast('Erro ao baixar documento.');
            }
        }
    };
    if (!isAuthenticated) {
        return (_jsxs("div", { className: "auth-container", children: [toastMessage && _jsx("div", { className: "toast", children: toastMessage }), _jsxs("div", { className: "card auth-card", children: [_jsxs("div", { className: "auth-header", children: [_jsxs("h1", { children: ["Portal ", _jsx("span", { children: "Hospitalar & TI" })] }), _jsx("p", { children: isRegistering ? 'Crie seu perfil de acesso' : 'Entre com suas credenciais de TI' })] }), _jsxs("form", { onSubmit: isRegistering ? handleRegister : handleLogin, children: [isRegistering && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "name", children: "Nome Completo" }), _jsx("input", { id: "name", name: "name", type: "text", autoComplete: "name", className: "form-input", value: authForm.name, onChange: e => setAuthForm({ ...authForm, name: e.target.value }), required: true })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "email", children: "E-mail Corporativo" }), _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", className: "form-input", value: authForm.email, onChange: e => setAuthForm({ ...authForm, email: e.target.value }), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "password", children: "Senha" }), _jsx("input", { id: "password", name: "password", type: "password", autoComplete: isRegistering ? "new-password" : "current-password", className: "form-input", value: authForm.password, onChange: e => setAuthForm({ ...authForm, password: e.target.value }), required: true })] }), isRegistering && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "role", children: "Perfil de Acesso" }), _jsxs("select", { id: "role", name: "role", className: "form-input", value: authForm.role, onChange: e => setAuthForm({ ...authForm, role: e.target.value }), children: [_jsx("option", { value: "ANALYST", children: "Analista (Visao Pessoal / Micro)" }), _jsx("option", { value: "MANAGER", children: "Coordenador / Gestor (Visao Geral / Macro)" }), _jsx("option", { value: "SUPER_ADMIN", children: "Super Admin (Acesso Total)" })] })] })), _jsx("button", { type: "submit", className: "btn btn-primary", style: { marginTop: '10px' }, children: isRegistering ? 'Registrar Perfil' : 'Entrar no Sistema' }), _jsx("button", { type: "button", className: "btn btn-secondary", style: { marginTop: '12px' }, onClick: () => setIsRegistering(!isRegistering), children: isRegistering ? 'Voltar para o Login' : 'Criar uma Nova Conta' })] })] })] }));
    }
    return (_jsxs("div", { className: "app-container", children: [toastMessage && _jsx("div", { className: "toast", children: toastMessage }), _jsxs("div", { className: "sidebar", children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx(ShieldCheck, { size: 24, className: "primary" }), _jsx("span", { children: "Gestao TI" })] }), _jsxs("div", { className: "nav-menu", children: [_jsxs("div", { className: `nav-item ${activeTab === 'dashboard' ? 'active' : ''}`, onClick: () => setActiveTab('dashboard'), children: [_jsx(LayoutDashboard, { size: 20 }), "Dashboard"] }), _jsxs("div", { className: `nav-item ${activeTab === 'kanban' ? 'active' : ''}`, onClick: () => setActiveTab('kanban'), children: [_jsx(Kanban, { size: 20 }), "Kanban"] }), _jsxs("div", { className: `nav-item ${activeTab === 'documents' ? 'active' : ''}`, onClick: () => setActiveTab('documents'), children: [_jsx(FileLock, { size: 20 }), "Arquivos LGPD"] })] }), _jsxs("div", { className: "sidebar-footer", children: [_jsxs("div", { className: "user-profile", children: [_jsx("div", { className: "avatar", children: (currentUser?.name || 'US').substring(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, fontSize: '0.9rem' }, children: currentUser?.name }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: currentUser?.role })] })] }), _jsxs("button", { className: "btn btn-secondary", onClick: handleLogout, style: { padding: '8px 12px', fontSize: '0.9rem' }, children: [_jsx(LogOut, { size: 16 }), "Sair"] })] })] }), _jsxs("div", { className: "main-content", children: [_jsxs("div", { className: "premium-header", children: [_jsxs("div", { className: "header-info", children: [_jsxs("div", { className: "breadcrumbs", children: ["Painel / ", activeTab.toUpperCase()] }), _jsx("h2", { children: "Sistema Integrado de TI & Demandas Clinicas" })] }), _jsx("div", { className: "header-actions", children: _jsxs("div", { style: { position: 'relative' }, children: [_jsxs("button", { className: "icon-btn", onClick: () => setShowNotifications(!showNotifications), children: [_jsx(Bell, { size: 20 }), notifications.filter(n => !n.read).length > 0 && (_jsx("span", { className: "bell-badge", children: notifications.filter(n => !n.read).length }))] }), showNotifications && (_jsxs("div", { className: "notifications-dropdown card", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px', alignItems: 'center' }, children: [_jsx("h4", { style: { fontWeight: 600 }, children: "Central de Avisos" }), _jsx("button", { style: { background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }, onClick: () => {
                                                                setNotifications(notifications.map(n => ({ ...n, read: true })));
                                                            }, children: "Lidas" })] }), _jsx("div", { style: { maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }, children: notifications.length > 0 ? (notifications.map(n => (_jsxs("div", { className: `notification-item ${n.read ? 'read' : ''}`, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { className: `dot ${n.type}` }), _jsx("p", { style: { fontSize: '0.85rem', flexGrow: 1, color: 'var(--text-main)' }, children: n.text })] }), _jsx("span", { style: { fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '4px' }, children: n.time })] }, n.id)))) : (_jsx("p", { style: { color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }, children: "Nenhum aviso pendente." })) })] }))] }) })] }), activeTab === 'dashboard' && (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsxs("h1", { style: { fontSize: '2rem', fontWeight: 700 }, children: ["Painel Geral ", dashboardData?.type === 'MACRO' ? '(Visao Macro - Gestao)' : '(Visao Micro - Analista)'] }), _jsx("p", { style: { color: 'var(--text-muted)', marginTop: '4px' }, children: "Monitore o andamento de projetos e a carga de trabalho operacional." })] }), dashboardData?.type === 'MACRO' ? (_jsxs("div", { children: [_jsxs("div", { className: "dashboard-grid", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "kpi-title", children: "Projetos Ativos" }), _jsx("div", { className: "kpi-value", children: dashboardData.totalProjects })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "kpi-title", children: "Tarefas Totais" }), _jsx("div", { className: "kpi-value", children: dashboardData.totalTasks })] })] }), projects.length > 0 && (_jsxs("div", { className: "card", style: { marginBottom: '32px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }, children: [_jsxs("h3", { style: { fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Calendar, { className: "primary", size: 20 }), " Cronograma de Projetos Estruturais (Gantt)"] }), _jsx("span", { style: { fontSize: '0.85rem', color: 'var(--text-muted)' }, children: "Mes Vigente - Planejamento a Longo Prazo" })] }), _jsxs("div", { className: "gantt-container", children: [_jsxs("div", { className: "gantt-header", children: [_jsx("div", { className: "gantt-col-name", children: "Projeto" }), _jsx("div", { className: "gantt-col-prog", children: "Progresso das Demandas" }), _jsx("div", { className: "gantt-week", children: "Semana 1" }), _jsx("div", { className: "gantt-week", children: "Semana 2" }), _jsx("div", { className: "gantt-week", children: "Semana 3" }), _jsx("div", { className: "gantt-week", children: "Semana 4" })] }), _jsx("div", { className: "gantt-body", children: projects.map((proj, idx) => {
                                                            const projTasks = tasks.filter(t => t.projectId === proj.id);
                                                            const total = projTasks.length;
                                                            const done = projTasks.filter(t => t.status === 'DONE').length;
                                                            const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                                                            const startWeek = (idx % 2) + 1;
                                                            const durationWeeks = idx % 2 === 0 ? 3 : 2;
                                                            const endWeek = startWeek + durationWeeks - 1;
                                                            return (_jsxs("div", { className: "gantt-row", children: [_jsxs("div", { className: "gantt-col-name", children: [_jsx("div", { className: "gantt-proj-title", children: proj.title }), _jsx("div", { className: "gantt-proj-desc", children: proj.description || 'Sem descricao vinculada.' })] }), _jsxs("div", { className: "gantt-col-prog", children: [_jsx("div", { className: "gantt-progress-bg", children: _jsx("div", { className: "gantt-progress-bar", style: { width: `${percent}%` } }) }), _jsxs("span", { className: "gantt-progress-text", children: [percent, "% ($", done, "/$", total, " tarefas)"] })] }), _jsxs("div", { className: "gantt-weeks-span", children: [_jsxs("div", { className: "gantt-timeline-grid", children: [_jsx("div", { className: "gantt-grid-cell" }), _jsx("div", { className: "gantt-grid-cell" }), _jsx("div", { className: "gantt-grid-cell" }), _jsx("div", { className: "gantt-grid-cell" })] }), _jsx("div", { className: `gantt-project-bar color-${idx % 3}`, style: {
                                                                                    gridColumnStart: startWeek,
                                                                                    gridColumnEnd: endWeek + 1
                                                                                }, children: _jsx("span", { className: "gantt-bar-label", children: percent === 100 ? 'Concluido' : 'Em Andamento' }) })] })] }, proj.id));
                                                        }) })] })] })), _jsxs("div", { className: "card", style: { marginBottom: '32px' }, children: [_jsx("h3", { style: { marginBottom: '16px', fontWeight: 600 }, children: "Carga de Trabalho (Por Analista)" }), _jsx("div", { className: "document-list", children: dashboardData.analystWorkload && dashboardData.analystWorkload.length > 0 ? (dashboardData.analystWorkload.map(a => (_jsxs("div", { className: "document-item animate-hover", children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: a.name }), _jsx("div", { style: { fontSize: '0.8rem', color: 'var(--text-muted)' }, children: "Analista de TI / Hospitalar" })] }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: _jsxs("span", { className: "column-badge", style: { background: a.taskCount > 3 ? 'var(--danger)' : 'rgba(255,255,255,0.08)' }, children: [a.taskCount, " tarefas designadas"] }) })] }, a.id)))) : (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "Nenhum analista cadastrado no sistema ainda." })) })] }), (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (_jsxs("div", { className: "card", children: [_jsxs("h3", { style: { marginBottom: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(FolderPlus, { className: "primary" }), " Novo Projeto Estrutural"] }), _jsxs("form", { onSubmit: handleCreateProject, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "projectTitle", children: "Titulo do Projeto" }), _jsx("input", { id: "projectTitle", name: "projectTitle", type: "text", className: "form-input", placeholder: "Ex: Implantacao de Servidores Ala Hospitalar B", value: newProject.title, onChange: e => setNewProject({ ...newProject, title: e.target.value }), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "projectDesc", children: "Descricao / Escopo" }), _jsx("textarea", { id: "projectDesc", name: "projectDesc", className: "form-input", rows: 3, placeholder: "Descreva detalhadamente o escopo e objetivos deste projeto hospitalar...", value: newProject.description, onChange: e => setNewProject({ ...newProject, description: e.target.value }) })] }), _jsx("button", { type: "submit", className: "btn btn-primary", style: { width: 'auto' }, children: "Criar Projeto" })] })] }))] })) : (_jsxs("div", { children: [_jsxs("div", { className: "dashboard-grid", children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "kpi-title", children: "Minhas Tarefas" }), _jsx("div", { className: "kpi-value", children: dashboardData?.kpis?.total || 0 })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "kpi-title", children: "Em Execucao" }), _jsx("div", { className: "kpi-value", children: dashboardData?.kpis?.doing || 0 })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "kpi-title", children: "Concluidas" }), _jsx("div", { className: "kpi-value", children: dashboardData?.kpis?.done || 0 })] })] }), _jsxs("div", { className: "micro-dashboard-layout", style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }, children: [_jsxs("div", { className: "card", children: [_jsx("h3", { style: { marginBottom: '16px', fontWeight: 600 }, children: "Projetos que Participo" }), _jsx("div", { className: "document-list", children: dashboardData?.assignedProjects && dashboardData.assignedProjects.length > 0 ? (dashboardData.assignedProjects.map(p => (_jsxs("div", { className: "document-item animate-hover", children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: p.title }), _jsx("div", { style: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }, children: p.description })] }), _jsx("span", { className: "confidential-badge", style: { background: 'rgba(14,165,233,0.15)', color: 'var(--primary)', borderColor: 'rgba(14,165,233,0.3)' }, children: "Ativo" })] }, p.id)))) : (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "Nenhum projeto ativo com tarefas atribuidas a voce." })) })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }, children: [_jsx("h3", { style: { fontWeight: 600 }, children: "Pendencias e Prazos" }), _jsx("span", { className: "column-badge", style: { background: 'var(--danger)', color: '#fff' }, children: "Urgente" })] }), _jsx("div", { className: "document-list", children: tasks.filter(t => t.status !== 'DONE').length > 0 ? (tasks.filter(t => t.status !== 'DONE').map(t => (_jsxs("div", { className: "document-item animate-hover", style: { borderLeft: t.status === 'DOING' ? '3px solid var(--warning)' : '3px solid var(--primary)' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: t.title }), _jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }, children: ["Projeto: ", projects.find(p => p.id === t.projectId)?.title || 'Carregando...'] })] }), _jsx("span", { className: "column-badge", style: { background: t.status === 'DOING' ? 'rgba(245,158,11,0.15)' : 'rgba(14,165,233,0.15)', color: t.status === 'DOING' ? 'var(--warning)' : 'var(--primary)' }, children: t.status === 'DOING' ? 'Em Progresso' : 'A Fazer' })] }, t.id)))) : (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "Todas as suas tarefas foram concluidas!" })) })] })] })] }))] })), activeTab === 'kanban' && (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: _jsxs("div", { children: [_jsx("h1", { style: { fontSize: '2rem', fontWeight: 700 }, children: "Quadro Kanban" }), _jsx("p", { style: { color: 'var(--text-muted)', marginTop: '4px' }, children: "Gerencie o status de suas tarefas diarias com facilidade." })] }) }), (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (_jsxs("div", { className: "card", style: { marginBottom: '32px' }, children: [_jsxs("h3", { style: { marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Plus, { className: "primary" }), " Delegar Nova Tarefa"] }), _jsxs("form", { onSubmit: handleCreateTask, style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '16px', alignItems: 'end' }, children: [_jsxs("div", { className: "form-group", style: { margin: 0 }, children: [_jsx("label", { className: "form-label", children: "Titulo da Tarefa" }), _jsx("input", { type: "text", className: "form-input", placeholder: "Ex: Ajustar prontuario ala cardiaca", value: newTask.title, onChange: e => setNewTask({ ...newTask, title: e.target.value }), required: true })] }), _jsxs("div", { className: "form-group", style: { margin: 0 }, children: [_jsx("label", { className: "form-label", children: "Projeto Relacionado" }), _jsxs("select", { className: "form-input", value: newTask.projectId, onChange: e => setNewTask({ ...newTask, projectId: e.target.value }), required: true, children: [_jsx("option", { value: "", children: "Selecione um projeto..." }), projects.map(p => (_jsx("option", { value: p.id, children: p.title }, p.id)))] })] }), _jsxs("div", { className: "form-group", style: { margin: 0 }, children: [_jsx("label", { className: "form-label", children: "Atribuir a (Analista)" }), _jsxs("select", { className: "form-input", value: newTask.assigneeId, onChange: e => setNewTask({ ...newTask, assigneeId: e.target.value }), children: [_jsx("option", { value: "", children: "Nao atribuido" }), _jsxs("option", { value: currentUser.id, children: [currentUser.name, " (Voce)"] }), analysts.map(analyst => (_jsx("option", { value: analyst.id, children: analyst.name }, analyst.id)))] })] }), _jsx("button", { type: "submit", className: "btn btn-primary", style: { height: '45px' }, children: "Adicionar" })] })] })), _jsxs("div", { className: "kanban-board", children: [_jsxs("div", { className: "kanban-column", children: [_jsxs("div", { className: "column-header", children: [_jsxs("div", { className: "column-title", children: [_jsx(Clock, { size: 18, className: "warning" }), " A Fazer"] }), _jsx("span", { className: "column-badge", children: tasks.filter(t => t.status === 'TODO').length })] }), tasks.filter(t => t.status === 'TODO').map(t => (_jsxs("div", { className: "task-card", children: [_jsx("h4", { children: t.title }), _jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }, children: ["Resp: ", t.assignee?.name || 'Sem designacao'] }), _jsx("div", { className: "task-actions", children: _jsx("button", { className: "action-icon", onClick: () => handleUpdateTaskStatus(t.id, t.status), children: "Avancar status" }) })] }, t.id)))] }), _jsxs("div", { className: "kanban-column", children: [_jsxs("div", { className: "column-header", children: [_jsxs("div", { className: "column-title", children: [_jsx(Clock, { size: 18, className: "primary" }), " Em Progresso"] }), _jsx("span", { className: "column-badge", children: tasks.filter(t => t.status === 'DOING').length })] }), tasks.filter(t => t.status === 'DOING').map(t => (_jsxs("div", { className: "task-card", children: [_jsx("h4", { children: t.title }), _jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }, children: ["Resp: ", t.assignee?.name || 'Sem designacao'] }), _jsx("div", { className: "task-actions", children: _jsx("button", { className: "action-icon", onClick: () => handleUpdateTaskStatus(t.id, t.status), children: "Concluir" }) })] }, t.id)))] }), _jsxs("div", { className: "kanban-column", children: [_jsxs("div", { className: "column-header", children: [_jsxs("div", { className: "column-title", children: [_jsx(CheckCircle, { size: 18, className: "accent" }), " Concluido"] }), _jsx("span", { className: "column-badge", children: tasks.filter(t => t.status === 'DONE').length })] }), tasks.filter(t => t.status === 'DONE').map(t => (_jsxs("div", { className: "task-card", children: [_jsx("h4", { style: { textDecoration: 'line-through', color: 'var(--text-muted)' }, children: t.title }), _jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }, children: ["Resp: ", t.assignee?.name || 'Sem designacao'] }), _jsx("div", { className: "task-actions", children: _jsx("button", { className: "action-icon", onClick: () => handleUpdateTaskStatus(t.id, t.status), children: "Reiniciar" }) })] }, t.id)))] })] })] })), activeTab === 'documents' && (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h1", { style: { fontSize: '2rem', fontWeight: 700 }, children: "Gestao Documental Segura (LGPD)" }), _jsx("p", { style: { color: 'var(--text-muted)', marginTop: '4px' }, children: "Regulamento de seguranca de dados clinicos e prontuarios." })] }), _jsxs("div", { className: "alert-banner", children: [_jsx(AlertTriangle, { size: 24 }), _jsxs("div", { children: [_jsx("strong", { style: { display: 'block', marginBottom: '4px' }, children: "Politica LGPD Hospitalar" }), "Arquivos medicos marcados como ", _jsx("strong", { children: "Confidencial" }), " sao restritos. Apenas o gestor do projeto e o analista encarregado da tarefa especifica possuem autorizacao legal de download de arquivos sob auditoria."] })] }), (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MANAGER') && (_jsxs("div", { className: "card", style: { marginBottom: '32px' }, children: [_jsxs("h3", { style: { marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Upload, { className: "primary" }), " Upload de Arquivo Criptografado"] }), _jsxs("form", { onSubmit: handleUploadDocument, style: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }, children: [_jsxs("div", { className: "form-group", style: { margin: 0 }, children: [_jsx("label", { className: "form-label", children: "Selecionar Arquivo (PDF, Imagens)" }), _jsx("input", { type: "file", className: "form-input", onChange: e => setUploadFile(e.target.files ? e.target.files[0] : null), required: true })] }), _jsxs("div", { className: "form-group", style: { margin: 0 }, children: [_jsx("label", { className: "form-label", children: "Vincular a Tarefa" }), _jsxs("select", { className: "form-input", value: uploadTaskId, onChange: e => setUploadTaskId(e.target.value), required: true, children: [_jsx("option", { value: "", children: "Selecione uma tarefa..." }), tasks.map(t => (_jsx("option", { value: t.id, children: t.title }, t.id)))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', height: '45px' }, children: [_jsx("input", { type: "checkbox", id: "confidential", checked: uploadConfidential, onChange: e => setUploadConfidential(e.target.checked), style: { cursor: 'pointer', width: '18px', height: '18px' } }), _jsx("label", { htmlFor: "confidential", style: { fontWeight: 500, cursor: 'pointer' }, children: "Marcar como Confidencial" })] }), _jsx("button", { type: "submit", className: "btn btn-primary", style: { gridColumn: 'span 3', width: 'auto', marginTop: '8px' }, children: "Fazer Upload Seguro" })] })] })), _jsxs("div", { className: "card", children: [_jsx("h3", { style: { marginBottom: '20px', fontWeight: 600 }, children: "Repositorio de Anexos Hospitalares" }), _jsx("div", { className: "document-list", children: documents.length > 0 ? (documents.map(doc => (_jsxs("div", { className: "document-item", children: [_jsxs("div", { className: "document-info", children: [_jsx(FileText, { size: 24, className: "primary" }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: doc.originalName }), _jsxs("div", { style: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }, children: ["Tarefa Vinculada: ", tasks.find(t => t.id === doc.taskId)?.title || 'Carregando...'] })] }), doc.isConfidential && (_jsx("span", { className: "confidential-badge", children: "CONFIDENCIAL (LGPD)" }))] }), _jsxs("button", { className: "btn btn-secondary animate-hover", style: { width: 'auto', padding: '8px 16px', fontSize: '0.875rem' }, onClick: () => handleDownloadDocument(doc), children: [_jsx(Download, { size: 16 }), "Baixar"] })] }, doc.id)))) : (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "Nenhum documento anexado ainda." })) })] })] }))] }), showLgpdModal && blockedDoc && (_jsx("div", { className: "modal-backdrop", children: _jsxs("div", { className: "card modal-card security-modal animate-scale", children: [_jsxs("div", { className: "security-header", children: [_jsx(ShieldAlert, { size: 48, className: "danger-glow" }), _jsx("h2", { children: "Acesso Bloqueado (LGPD)" }), _jsx("p", { children: "Seguranca de Dados e Auditoria Hospitalar" })] }), _jsxs("div", { className: "security-body", children: [_jsxs("p", { children: ["O arquivo ", _jsx("strong", { children: blockedDoc.originalName }), " esta catalogado como ", _jsx("strong", { children: "Altamente Confidencial" }), "."] }), _jsxs("div", { className: "security-info-box", children: [_jsxs("div", { children: [_jsx("strong", { children: "Identificador:" }), " ", blockedDoc.id] }), _jsxs("div", { children: [_jsx("strong", { children: "Demanda de TI:" }), " ", tasks.find(t => t.id === blockedDoc.taskId)?.title || 'Indisponivel'] }), _jsx("div", { style: { marginTop: '8px', color: 'var(--danger)', fontWeight: 600 }, children: "Regra Aplicada:" }), _jsx("div", { style: { fontSize: '0.85rem' }, children: "Apenas analistas diretamente alocados na execucao desta demanda ou o criador do projeto possuem a chave de criptografia de prontuario." })] }), _jsx("p", { style: { color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px', textAlign: 'center' }, children: "Esta tentativa de acesso foi registrada em logs auditaveis do Super Admin de TI." })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginTop: '24px', width: '100%' }, children: [_jsx("button", { className: "btn btn-secondary", style: { flex: 1 }, onClick: () => { setShowLgpdModal(false); setBlockedDoc(null); }, children: "Entendido" }), _jsx("button", { className: "btn btn-primary", style: { flex: 1 }, onClick: () => {
                                        showToast("Solicitacao de permissao enviada para a coordenacao do time.");
                                        setShowLgpdModal(false);
                                        setBlockedDoc(null);
                                    }, children: "Solicitar Credencial" })] })] }) }))] }));
}
export default App;
//# sourceMappingURL=App.js.map