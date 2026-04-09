# Casa dos Sonhos - Documentação do Projeto

Este documento serve como a "fonte da verdade" para a arquitetura, padrões de design e funcionalidades do sistema de planejamento residencial.

## 1. Visão Geral

A **Casa dos Sonhos** é uma aplicação web progressiva (PWA-style) para casais planejarem a mobília e decoração de seu lar. O sistema permite gerenciar orçamentos, listas de compras categorizadas por cômodos e definir a identidade visual (paleta de cores) de cada ambiente.

## 2. Arquitetura Técnica

O projeto utiliza uma arquitetura **Serverless** com foco em performance e simplicidade:

- **Frontend:** HTML5, Tailwind CSS (via CDN) e Vanilla CSS.
- **Lógica:** JavaScript Moderno (ES6+) utilizando **Módulos (ESM)**.
- **Backend/Storage:** Firebase (via classe `CloudService.js`) para Autenticação e Firestore para persistência em tempo real.
- **Estado Global Reativo (Proxy):** O arquivo `state.js` utiliza um **Proxy JavaScript** para acessar elementos do DOM pelo ID (`elements.ID_DO_ELEMENTO`). Isso evita erros de referência nula em diferentes páginas e centraliza o estado da aplicação.
- **Configuração de Conexão:** O arquivo `assets/js/modules/firebase-config.js` centraliza as credenciais do projeto Firebase.
- **Offline First:** Uso de `localStorage` para cache rápido e persistência temporária através de `storage.js`.

## 3. Dependências Externas

A aplicação consome os seguintes recursos via CDN:

- **Tailwind CSS:** Framework utilitário de estilos.
- **Font Awesome 6.4.0:** Biblioteca de ícones (Solid, Regular).
- **Google Fonts:** Família 'Montserrat' (pesos 300 a 900).
- **Pickr (Nano theme):** Biblioteca para o seletor de cores personalizado com suporte a HVS e EyeDropper (conta-gotas).
- **Microlink API:** Utilizada para extração de metadados de links externos.

## 4. Estrutura de Diretórios Completa

```text
/
├── index.html              # Landing page informativa
├── PROJETO.md              # Esta documentação mestre
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
│       ├── classes/        # Lógica de negócio (CloudService.js)
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
- **Responsividade Crítica:**
  - **Sidebar Mobile:** Fixa com preenchimento extra no fundo (`safe-area-inset-bottom`) para evitar cortes por barras de ferramentas mobile.
  - **Dashboard Grid:** Layout adaptável usando `lg:grid-cols-4` para estatísticas.

## 6. Funcionalidades Detalhadas

### 6.1. Gestão de Orçamento

- Campo "Orçamento Total" editável com formatação automática BRL (`Intl.NumberFormat`).
- Sincronização automática e persistência na nuvem após cada alteração (`onblur`).

### 6.2. Lista de Itens (CRUD)

- Atributos: Nome, Cômodo, Prioridade, Preço e Link opcional.
- Sistema de "Check" que recalcula instantaneamente o progresso do orçamento e estatísticas.

### 6.3. Link Magic Fetch (Automação)

- Integração com a API **Microlink** para ler links de lojas (Amazon, Magalu, Shopee, etc).
- **Regex de Preço:** Mineração universal de valores monetários em títulos e metadados.
- **Limpeza de Nomes:** Filtro inteligente que remove termos de marketing (ex: "Oferta no Magalu") para manter a lista limpa.

### 6.4. Cômodos e Cores (Seletor Personalizado)

- **Pickr Integration:** Seletores de cores idênticos em todas as plataformas com suporte a conta-gotas.
- **Sincronização Bidirecional:** Mudanças no seletor atualizam o Hexadecimal e vice-versa.
- **Integridade de Dados:** O sistema **impede a exclusão de cômodos** que possuam itens vinculados, garantindo a consistência do banco de dados.

### 6.5. Colaboração e Compartilhamento

- **Project ID:** Cada lista possui um ID único que pode ser compartilhado com parceiros/cônjuges.
- **Join Project:** Funcionalidade para se unir a uma lista existente, permitindo que dois usuários visualizem e editem os mesmos dados em tempo real.

## 7. Fluxo de Sincronização e Nuvem

1. **Init:** `loadLocal()` carrega dados do cache (Offline First).
2. **Auth Change:** Firebase valida a sessão.
3. **Cloud Load:** Sincroniza dados do Firestore para o `state.js`.
4. **Real-time:** `listenToChanges()` usa `onSnapshot` para atualizar a UI instantaneamente se outro usuário fizer alterações na mesma lista.

## 8. Segurança e Compatibilidade (GitHub Pages)

- **Auth Guard:** Conteúdo oculto até a validação da sessão.
- **Redirecionamento Inteligente:** Lógica de cálculo de profundidade de caminho (`window.location.pathname`) para garantir que o sistema funcione corretamente em subdiretórios no GitHub Pages ou servidores locais.
- **Case Sensitivity:** Padrão rigoroso de nomes de arquivos para compatibilidade total com sistemas Linux/Unix.

## 9. Manutenibilidade e Padrões de Código

- **Separação de Concerns:** Lógica de Nuvem (`classes/`), UI (`ui.js`) e Eventos (`events.js`) totalmente desacopladas.
- **Event Delegation:** Gerenciamento eficiente de cliques em listas dinâmicas para melhor performance.
