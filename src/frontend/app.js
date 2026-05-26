// Lógica de Autenticação e Proteção de Rota
const token = localStorage.getItem('portal_token');
const userStr = localStorage.getItem('portal_user');

if (!token || !userStr) {
    // Expulsa o usuário se não estiver logado
    window.location.href = 'login.html';
}

const currentUser = JSON.parse(userStr);

// Initialize Lucide Icons
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
    
    // Atualizar UI com dados do Usuário Logado
    const userNameElement = document.querySelector('.user-info h4');
    const userRoleElement = document.querySelector('.user-info p');
    if(userNameElement) userNameElement.textContent = currentUser.name;
    if(userRoleElement) {
        if(currentUser.role === 'Manager') userRoleElement.textContent = 'Gestor de Projetos';
        else if(currentUser.role === 'Analyst') userRoleElement.textContent = 'Analista Pleno';
        else if(currentUser.role === 'SuperAdmin') userRoleElement.textContent = 'Super Admin';
    }

    // Configurar o Logout
    const logoutBtn = document.querySelector('[data-lucide="log-out"]').parentElement;
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('portal_token');
            localStorage.removeItem('portal_user');
            window.location.href = 'login.html';
        });
    }
    
    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;
    
    themeBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeBtn.innerHTML = '<i data-lucide="sun"></i>';
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeBtn.innerHTML = '<i data-lucide="moon"></i>';
        }
        lucide.createIcons();
    });

    // Notification Panel Toggle
    const notifBtn = document.querySelector('.notification-btn');
    const notifPanel = document.getElementById('notif-panel');
    const pulseRing = document.querySelector('.pulse-ring');
    const badge = document.querySelector('.badge');

    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPanel.classList.toggle('show');
        
        // Remove alertas visuais ao abrir a primeira vez
        if(pulseRing) pulseRing.style.display = 'none';
        if(badge) badge.style.display = 'none';
    });

    // Close notification panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!notifPanel.contains(e.target) && e.target !== notifBtn) {
            notifPanel.classList.remove('show');
        }
    });

    // Role Switcher (Mock alternating between Manager and Analyst Views)
    const roleToggleBtn = document.getElementById('role-toggle');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewDashboardAnalyst = document.getElementById('view-dashboard-analyst');
    const viewKanban = document.getElementById('view-kanban');
    
    // Sidebar items update
    const navDashboard = document.querySelector('[data-target="dashboard"]');
    const navDashboardSpan = navDashboard.querySelector('span');
    const navKanban = document.querySelector('[data-target="kanban"]');
    
    // Profile Update
    const userName = document.querySelector('.user-info .name');
    const userRole = document.querySelector('.user-info .role');

    let isManager = true;

    roleToggleBtn.addEventListener('click', () => {
        isManager = !isManager;

        if (isManager) {
            // Switch to Manager View
            if (navDashboard.classList.contains('active')) {
                viewDashboard.classList.add('active');
                viewDashboardAnalyst.classList.remove('active');
                viewKanban.classList.remove('active');
            } else {
                viewDashboard.classList.remove('active');
                viewDashboardAnalyst.classList.remove('active');
                viewKanban.classList.add('active');
            }
            
            navDashboardSpan.textContent = 'Dashboard Gestor';
            userName.textContent = 'João Silva';
            userRole.textContent = 'Gestor de TI';
            
            roleToggleBtn.innerHTML = '<i data-lucide="user-switch"></i> Alternar para Analista';
        } else {
            // Switch to Analyst View
            if (navDashboard.classList.contains('active')) {
                viewDashboard.classList.remove('active');
                viewDashboardAnalyst.classList.add('active');
                viewKanban.classList.remove('active');
            } else {
                viewDashboard.classList.remove('active');
                viewDashboardAnalyst.classList.remove('active');
                viewKanban.classList.add('active');
            }
            
            navDashboardSpan.textContent = 'Meu Dashboard';
            userName.textContent = 'Ana Maria';
            userRole.textContent = 'Analista Pleno';
            
            roleToggleBtn.innerHTML = '<i data-lucide="user-switch"></i> Alternar para Gestor';
        }
        lucide.createIcons();
    });

    // Navigation links handling
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            if (target === 'dashboard' || target === 'kanban' || target === 'projects') {
                // Update active class on nav
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                
                // Show respective view
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                
                if (target === 'dashboard') {
                    if (isManager) {
                        viewDashboard.classList.add('active');
                    } else {
                        viewDashboardAnalyst.classList.add('active');
                    }
                } else if (target === 'kanban') {
                    viewKanban.classList.add('active');
                } else if (target === 'projects') {
                    document.getElementById('view-projects').classList.add('active');
                }
            }
        });
    });
});
