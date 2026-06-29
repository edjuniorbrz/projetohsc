# Documento de Requisitos UI/UX: Portal de Gestão de Projetos (TI e Hospitalar)

Este documento foi gerado através da metodologia 5W2H para guiar a equipe de Design (UI/UX) na criação do protótipo de viabilidade técnica de um novo Portal de Projetos.

> [!IMPORTANT]  
> **Fase do Projeto:** Viabilização (MVP). O foco absoluto do time de UI/UX deve ser a criação de um **protótipo navegável (ex: Figma)** de alto impacto visual para aprovação da diretoria, sem necessidade de desenvolvimento Frontend/Backend estrutural neste momento.

---

## 1. WHAT (O que será feito?)
Um portal de gestão de projetos e demandas com foco nas equipes de TI e área Hospitalar. 
O sistema terá gestão documental interna com rigoroso controle de acesso, devido à natureza sensível dos arquivos (dados hospitalares/pacientes).

## 2. WHY (Por que será feito?)
Para organizar tarefas e demandas das equipes. Atualmente, há uma dor na visibilidade operacional. O sistema resolverá isso através de **Dashboards Dinâmicos**, permitindo que gestores/coordenadores visualizem rapidamente a carga de trabalho (quantidade de projetos e tarefas) distribuída por cada analista do time.

## 3. WHO (Quem usará? Perfis de Acesso)
O portal contará com gestão de times e os seguintes perfis hierárquicos:
*   **Gerente / Coordenador:** Visão macro (Dashboard de equipe, delegação de tarefas, controle de carga de trabalho).
*   **Analista / Técnico:** Visão micro (Dashboard pessoal com foco em execução).
*   **Super Admin (TI):** Acesso total para setup da ferramenta. Terá a capacidade de **delegar poderes** (ex: permitir que um Coordenador crie novos usuários, projetos e tarefas de forma autônoma para seu próprio time).

## 4. WHERE (Onde será acessado?)
*   **Foco Inicial:** Aplicação Web desenhada especificamente para uso em computadores (**Desktop**). 
*   A versão Mobile foi *postergada* para o fim do projeto (após a validação operacional). Portanto, o UI/UX **não precisa** focar em desenhar telas responsivas ou versão mobile para a aprovação deste MVP.

## 5. WHEN (Quando será feito?)
Não há um prazo estrito definido de desenvolvimento (cronograma em aberto). A prioridade atual é apenas finalizar os desenhos (protótipo) para ajudar a viabilizar e aprovar o projeto internamente.

## 6. HOW (Como deve funcionar?)

### Fluxo de Visão e Tarefas
*   **Visão Macro (Gestão):** Utilização de gráficos tipo **Gantt** (linha do tempo/cronograma) para os gestores acompanharem o andamento dos projetos estruturais.
*   **Visão Micro (Operação):** Utilização de quadros **Kanban** práticos para a movimentação de tarefas diárias e rápidas.
*   **Tela Inicial Dinâmica:** O comportamento do dashboard muda conforme o login. 
    *   *Técnico logado:* Vê KPIs pessoais, projetos em que foi marcado/citado desde o último login e pendências perto do prazo.
    *   *Gestor logado:* Vê um panorama unificado dos analistas abaixo dele.

### Integrações e Notificações
> [!NOTE]
> O sistema nascerá como **Stand-alone** (independente). Não haverá integração com Active Directory para login, nem integrações que gerem custos (como APIs pagas de WhatsApp ou Teams).
*   **Notificações:** O UX deve prever um sistema nativo (In-app), com um ícone de "Sininho" de alertas (incluindo aviso sonoro se logado) e disparos simples via E-mail.

### Segurança e Privacidade (Arquivos Sensíveis)
> [!CAUTION]
> **Risco de LGPD/HIPAA:** Como o sistema lidará com demandas hospitalares e anexos, a arquitetura de informação deve possuir **Níveis de Acesso**. O UX precisa desenhar como o sistema omitirá, bloqueará ou solicitará senha para acesso a arquivos sensíveis (evitando que técnicos acessem arquivos restritos de outros times).

## 7. HOW MUCH (Quanto custará / Esforço de UX)
*   **Esforço Reduzido de Escopo Inicial:** Sem custos de APIs na fase 1 e foco exclusivo em telas Desktop (economizando o orçamento e as horas de desenho responsivo nesta etapa de validação).
