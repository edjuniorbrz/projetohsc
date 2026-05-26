# Portal 5W2H - Sistema Integrado de Gestão de Projetos e Demandas (TI & Hospitalar)

O **Portal 5W2H** é uma solução corporativa de alta performance desenvolvida especificamente para sanar as dores de visibilidade operacional e gestão de carga de trabalho em equipes de Tecnologia da Informação e Operações Hospitalares. Unindo o poder do framework organizacional **5W2H** (What, Why, Who, Where, When, How, How Much) à flexibilidade do Kanban diário e do gráfico Gantt estrutural, o portal assegura governança rigorosa, distribuição balanceada de tarefas e segurança documental.

---

## 🎯 Propósito de Negócio e Benefícios
*   **Visibilidade Unificada:** Permite que diretores, gerentes e coordenadores visualizem em tempo real a saúde de projetos complexos e a alocação de tarefas individuais.
*   **Balanceamento de Carga de Trabalho:** Dashboards macro gerenciais que exibem a quantidade exata de tarefas distribuídas por analista, evitando sobrecarga ou ociosidade.
*   **Segurança e LGPD/HIPAA:** Sistema robusto com múltiplos níveis de acesso e controle documental rígido para anexos sensíveis de dados de pacientes e infraestrutura hospitalar restrita.
*   **Fidelidade Visual Premium:** Interface com design moderno e de altíssimo impacto (tema escuro elegante, efeitos neon de foco, glassmorphism e micro-animações fluidas).

---

## 👥 Matriz de Papéis de Usuário (Gestão Hierárquica)

O portal é estruturado com três níveis de acesso e privilégios bem definidos:

| Perfil de Acesso | Interface Principal | Principais Permissões e Responsabilidades |
| :--- | :--- | :--- |
| **Super Admin (TI)** | **Visão Macro + Setup** | Acesso irrestrito a todas as configurações globais do portal. Responsável pelo setup inicial e **delegação de poderes** (permitindo que coordenadores gerenciem de forma autônoma seus próprios times, projetos e usuários). |
| **Gerente / Coordenador** | **Visão Macro Gerencial** | Acompanhamento de cronogramas via Gantt, criação de novos projetos estruturais, cadastro de sub-capítulos (entregas/fases) e distribuição dinâmica de tarefas. Acesso a KPIs de equipe e controle de carga de trabalho de analistas. |
| **Analista / Técnico** | **Visão Micro Operacional** | Foco exclusivo na execução diária. Acesso a um Kanban dinâmico pessoal (onde vê apenas suas próprias atribuições livres de ruído), controle de progresso físico de ações (0% a 100%), uploads de evidências/documentos e comentários. |

---

## 🏗️ Arquitetura & Stack Tecnológica

O sistema foi desenhado sob um modelo desacoplado (Decoupled Architecture), garantindo flexibilidade e facilidade de manutenção:

*   **Backend (.NET 8 Web API):**
    *   Desenvolvido em C# com **Minimal APIs** para máxima performance e baixa latência.
    *   **Entity Framework Core (EF Core)** atuando como ORM com mapeamento relacional.
    *   **SQLite** como mecanismo de banco de dados relacional embutido de altíssima confiabilidade e zero-configuração inicial.
    *   **Segurança com JWT Bearer Token:** Autenticação e autorização robustas de rotas baseadas em tokens auto-contidos e criptografados (armazenando claims de perfil como ID, e-mail, nome e papel).
    *   **Multi-ambiente:** Suporte nativo a perfis de execução com arquivos de configuração segregados (`appsettings.Development.json`, `appsettings.Staging.json` e `appsettings.Production.json`).
*   **Frontend (HTML5 / CSS3 / JS Premium):**
    *   Rápido e leve, estruturado de forma independente de frameworks complexos para garantir carregamento instantâneo.
    *   **Vanilla CSS3:** Utilização de CSS puro, variáveis CSS (tokens de design) e animações personalizadas de hover. Estilo focado em Modo Escuro moderno, cantos arredondados, bordas translúcidas (Glassmorphism) e efeitos de brilho em tons de azul e verde hospitalar.
    *   **Vanilla JavaScript (ES6+):** Lógica reativa para renderização dinâmica de dados via chamadas assíncronas (`fetch`) com tokens JWT de cabeçalho, gerenciamento de estado local e manipulação de Drag and Drop interativo no Kanban.

---

## 📂 Estrutura do Repositório Git

A árvore de diretórios unificada do repositório está organizada da seguinte maneira:

```text
/portal-5w2h
  ├── .gitignore               # Regras de exclusão do Git (filtros .NET 8 e Web)
  ├── README.md                # Esta documentação principal
  ├── /docs                    # Requisitos, briefs de design e especificações 5W2H
  │     └── ux_ui_briefing_5w2h.md
  └── /src                     # Código-fonte do sistema
        ├── /backend           # Web API em .NET 8 (Código C#, Controllers, Contextos, csproj)
        ├── /frontend          # SPA Integrada em HTML5/CSS3/JavaScript (index, login)
        └── /prototype         # Protótipo funcional de alta fidelidade puro do MVP inicial
```

---

## ⚡ Como Executar a Aplicação Localmente

Siga o passo a passo abaixo para subir os serviços em sua máquina local.

### 📋 Pré-requisitos
*   **SDK do .NET 8.0** ou superior instalado ([Baixar .NET 8](https://dotnet.microsoft.com/pt-br/download/dotnet/8.0))
*   Qualquer navegador Web atualizado (Edge, Chrome, Firefox, etc.)
*   *Opcional:* Servidor HTTP estático para o frontend (como a extensão *Live Server* do VS Code, *Python HTTP server* ou a biblioteca *serve* do npm).

---

### 💻 1. Inicializando o Backend (.NET 8 Web API)

A API do backend está programada com um semeador automático. No primeiro boot, ela criará automaticamente o banco de dados SQLite local `banco_teste.db` e aplicará as tabelas e usuários padrão necessários para testes imediatos.

1.  Abra o terminal do seu sistema e navegue até a pasta do backend:
    ```bash
    cd src/backend
    ```
2.  Execute o comando para compilar e iniciar o servidor da API:
    ```bash
    dotnet run
    ```
3.  A API iniciará no modo de desenvolvimento e estará escutando no endereço padrão.
    *   **URL da API:** `http://localhost:5088` ou `https://localhost:7088` (ou outra porta indicada no console).
    *   **Documentação Swagger (Interativa):** Acesse `http://localhost:5088/swagger` no navegador para interagir e visualizar todos os endpoints documentados e testáveis da API.

---

### 🌐 2. Inicializando o Frontend

Como o frontend é baseado em arquivos estáticos (HTML5/CSS3/JS puros), você pode simplesmente abrir o arquivo de login no seu navegador ou servi-lo através de um servidor local.

#### Opção A (Recomendada - Servidor Estático Simples)
Usar um servidor web estático evita problemas de CORS ou bloqueios de requisições de arquivos locais nos navegadores modernos.

*   **Usando Python:**
    ```bash
    cd src/frontend
    python -m http.server 5500
    ```
    Acesse em seu navegador: `http://localhost:5500/login.html`

*   **Usando Node.js (npm):**
    ```bash
    cd src/frontend
    npx serve -l 5500
    ```
    Acesse em seu navegador: `http://localhost:5500/login.html`

#### Opção B (Acesso Direto)
*   Basta abrir o seu gerenciador de arquivos, navegar até a pasta `/src/frontend/` e dar dois cliques no arquivo `login.html` para abri-lo direto no navegador.

---

## 🔑 Credenciais Padrão para Testes (Seed Data)

A API do backend pré-carrega automaticamente três perfis de usuários iniciais. Use as credenciais abaixo para testar as diferentes visões do portal:

1.  **Super Administrador (TI):**
    *   **E-mail:** `admin@portal.com`
    *   **Senha:** `123456`
    *   *O que testar:* Acesso completo, criação e gerenciamento irrestrito de usuários e projetos.

2.  **Gerente / Coordenador (João Gestor):**
    *   **E-mail:** `gestor@portal.com`
    *   **Senha:** `123456`
    *   *O que testar:* Gestão de projetos estruturais via Gantt, sub-capítulos e alocação de tarefas.

3.  **Analista / Técnico (Maria Analista):**
    *   **E-mail:** `analista@portal.com`
    *   **Senha:** `123456`
    *   *O que testar:* Kanban diário pessoal (apenas suas tarefas aparecem), ajuste de progresso físico de ações.
