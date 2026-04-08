# Casa dos Sonhos - Documentação do Projeto

Este documento serve como a "fonte da verdade" para a arquitetura, padrões de design e funcionalidades do sistema de planejamento residencial.

## 1. Visão Geral
A **Casa dos Sonhos** é uma aplicação web progressiva (PWA-style) para casais planejarem a mobília e decoração de seu lar. O sistema permite gerenciar orçamentos, listas de compras categorizadas por cômodos e definir a identidade visual (paleta de cores) de cada ambiente.

## 2. Arquitetura Técnica
O projeto utiliza uma arquitetura **Serverless** com foco em performance e simplicidade:
- **Frontend:** HTML5, Tailwind CSS (via CDN) e Vanilla CSS.
- **Lógica:** JavaScript Moderno (ES6+) utilizando **Módulos (ESM)**.
- **Backend/Storage:** Firebase (via classe `CloudService.js`) para Autenticação e Firestore para persistência em tempo real.
- **Configuração de Conexão:** O arquivo `assets/js/modules/firebase-config.js` centraliza as credenciais do projeto Firebase.
- **Offline First:** Uso de `localStorage` para cache rápido e persistência temporária através de `storage.js`.

## 3. Dependências Externas
A aplicação consome os seguintes recursos via CDN:
- **Tailwind CSS:** Framework utilitário de estilos.
- **Font Awesome 6.4.0:** Biblioteca de ícones (Solid, Regular).
- **Google Fonts:** Família 'Montserrat' (pesos 300 a 900).

## 4. Estrutura de Diretórios
```text
/
├── index.html              # Landing page informativa
├── PROJETO.md              # Esta documentação
├── auth/                   # Fluxos de Autenticação
│   ├── login/index.html    # Página de Login
│   ├── signup/index.html   # Página de Cadastro
│   └── logout/index.html   # Script de encerramento de sessão
├── dashboard/              # Core da aplicação
│   ├── index.html          # Visão Geral (Stats e Orçamento)
│   ├── items/index.html    # Gestão de Itens/Compras
│   └── rooms/index.html    # Gestão de Cômodos e Cores
├── assets/
│   ├── css/
│   │   └── style.css       # Estilos globais e animações customizadas
│   └── js/
│       ├── app.js          # Inicializador e Event Listeners globais
│       ├── auth-login.js   # Lógica específica de login
│       ├── auth-signup.js  # Lógica específica de cadastro
│       ├── landing.js      # Lógica da landing page
│       ├── classes/        # Lógica de negócio (CloudService)
│       └── modules/        # Funcionalidades modularizadas
│           ├── state.js    # Estado global centralizado (Proxy)
│           ├── ui.js       # Renderização e manipulação de DOM
│           ├── storage.js  # Sincronização com LocalStorage
│           ├── events.js   # Handlers de eventos de negócio
│           ├── utils.js    # Formatadores e calculadoras
│           └── firebase-config.js # Configurações do Firebase
```

## 5. Padrões de Design e UI/UX
- **Paleta de Cores:** Foco em tons de roxo (`#b399d4`), branco e cinzas claros para uma interface moderna e "limpa".
- **Tipografia:** Montserrat (300 a 900).
- **Componentes de UI:**
  - **Cards:** Bordas arredondadas de `2xl` ou `3xl`, sombras suaves (`card-shadow`).
  - **Modais:** Padronizados com `backdrop-blur-sm`, fundo `bg-purple-900/20`, cantos `rounded-[2rem]`.
  - **Animações:** Transições de escala e opacidade via CSS (`cubic-bezier`) para modais e menus.
- **Responsividade:** Sidebar retrátil no mobile (`transform: translateX`) e grid adaptativo (`auto-grid`).
- **Empty States:** Containers com ID `emptyState` (itens) e `emptyRoomsState` (cômodos) que aparecem automaticamente quando não há dados.

## 6. Funcionalidades Detalhadas
### 6.1. Gestão de Orçamento
- Campo "Orçamento Total" editável com formatação automática.
- `onfocus`: Exibe o número puro para edição.
- `onblur`: Formata para o padrão brasileiro (`R$ 0,00`) usando `Intl.NumberFormat`.
- Sincronização automática com Firebase após edição.

### 6.2. Lista de Itens (CRUD)
- Atributos: Nome, Cômodo, Prioridade, Preço e Link opcional.
- Sistema de "Check" para compras que atualiza instantaneamente o progresso do orçamento e os "Stats".

### 6.3. Cômodos e Cores
- Definição de paletas por ambiente.
- **Sincronização de Cores:** Implementado em `syncColorInputs()` para espelhar valores entre o seletor visual e o campo Hexadecimal.
- **Exclusão Segura:** Impede a remoção de cômodos que ainda possuam itens vinculados.

### 6.4. Sistema de Modais Customizados
- Substituição total de `alert()` e `confirm()` por modais HTML/CSS.
- Modais específicos: `logoutModal`, `deleteItemModal` e `deleteRoomModal`.
- Classe CSS `modal-hidden` controla a visibilidade e dispara as animações de entrada/saída.

## 7. Fluxo de Sincronização de Dados
1. **Init:** `loadLocal()` carrega dados do cache para exibição imediata.
2. **Auth Change:** Firebase detecta o usuário logado.
3. **Cloud Load:** `loadFullProject()` sincroniza os dados mais recentes do Firestore para o `state.js`.
4. **Local Sync:** `saveLocal()` atualiza o `localStorage` com os dados da nuvem.
5. **UI Update:** O DOM é reconstruído com os dados novos.
6. **Real-time:** `listenToChanges()` garante que mudanças em outros dispositivos apareçam instantaneamente.

## 8. Segurança e Proteção de Rotas
- **Atributo `data-auth-required`:** Oculta o conteúdo da página (`opacity: 0`) até que a autenticação seja confirmada, evitando o "flicker" de dados protegidos.
- **Auth Guard:** O `app.js` redireciona usuários não autenticados para a raiz do projeto. A lógica de redirecionamento é inteligente e ajusta o caminho (`../` ou `../../`) baseada na profundidade da URL atual.

## 9. Manutenibilidade e Padrões de Código
- **Estado Global (Proxy):** O `state.js` centraliza todos os dados e o objeto `elements` usa um Proxy para evitar erros de elemento nulo entre páginas.
- **Event Delegation:** Cliques em listas e containers dinâmicos são gerenciados no nível do pai para eficiência.
- **Separação de Responsabilidades:** Divisão clara entre lógica de Nuvem (`classes/`), UI (`ui.js`) e Negócio (`events.js`).
