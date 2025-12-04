<div align="center">

# 🏢 Ferrer Studio CRM

### Sistema de Gestão de Relacionamento com Clientes

![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=for-the-badge&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=for-the-badge&logo=vite)

**Um CRM moderno e completo com integração WhatsApp, IA generativa e automação de vendas.**

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Por que foi criado?](#-por-que-foi-criado)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🎯 Sobre o Projeto

O **Ferrer Studio CRM** é uma solução completa de gestão de relacionamento com clientes, desenvolvida para automatizar e otimizar o processo de vendas. O sistema combina:

- **Gestão de Leads** com pipeline visual (Kanban)
- **Integração nativa com WhatsApp** via WAHA API
- **Agentes de IA** para atendimento automatizado com Google Gemini
- **Prospecção automática** via Apify (Google Maps Scraper)
- **Disparo em massa** de mensagens personalizadas
- **Dashboard financeiro** com métricas e gráficos

---

## 💡 Por que foi criado?

O sistema foi desenvolvido para resolver problemas reais enfrentados por pequenas e médias empresas:

1. **Centralização de Atendimento**: Unificar todas as conversas do WhatsApp em um só lugar
2. **Automação de Respostas**: Reduzir tempo de resposta com IA
3. **Prospecção Eficiente**: Automatizar a captação de leads do Google Maps
4. **Gestão Visual**: Acompanhar o funil de vendas em tempo real
5. **Escalabilidade**: Permitir envio de mensagens em massa sem bloqueio

---

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral de métricas de vendas
- Gráficos de desempenho por período
- Leads por cidade/estado (mapa interativo)
- Funil de conversão

### 👥 Gestão de Leads
- CRUD completo de leads
- Filtros avançados (cidade, estado, categoria, temperatura)
- Importação de contatos via CSV
- Fotos de perfil do WhatsApp
- Histórico de interações

### 💬 Chat WhatsApp
- Interface completa de chat
- Envio de texto, imagens, vídeos, documentos
- Gravação e envio de áudios
- Indicador de digitação
- Status de mensagem (enviado, entregue, lido)
- Emojis e reações

### 🤖 Agentes de IA
- Criação de múltiplos agentes
- Personalização de personalidade e instruções
- Categorização automática de conversas
- Respostas contextuais com Google Gemini
- Transferência para humano quando necessário

### 📥 Importações Apify
- Scraping de leads do Google Maps
- Importação de CSV
- Gestão de status (enviado, não enviado, erro, perdido)
- Chat rápido com leads importados

### 🚀 Disparo em Massa (Blast)
- Estratégias: Novos, Follow-up, Mix Inteligente
- Mensagens personalizadas com variáveis
- Delay configurável entre envios
- Logs em tempo real
- Deduplicação automática

### ⚙️ Configurações
- Perfil de usuário
- Gestão de usuários (admin)
- Configurações do sistema
- Integrações (WAHA, Gemini, Apify, PayPal)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                  React + TypeScript + Vite                   │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Dashboard │ │  Leads   │ │   Chat   │ │   Agents     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Apify    │ │  Blast   │ │ Settings │ │  Automation  │   │
│  │ Imports  │ │  Page    │ │          │ │              │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js)                          │
│                       Port 3001                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │
│  │   Webhook    │ │  AI Handler  │ │  Blast Service   │     │
│  │   Handler    │ │   (Gemini)   │ │                  │     │
│  └──────────────┘ └──────────────┘ └──────────────────┘     │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│   WAHA API      │ │  Supabase   │ │  Google Gemini  │
│  (WhatsApp)     │ │  (Database) │ │      (AI)       │
│   Port 3000     │ │             │ │                 │
└─────────────────┘ └─────────────┘ └─────────────────┘
```

---

## 🛠️ Tecnologias

### Frontend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.8 | Tipagem estática |
| Vite | 6.2 | Build tool |
| TailwindCSS | 4.1 | Estilização |
| Framer Motion | 11.0 | Animações |
| Recharts | 3.5 | Gráficos |
| Lucide React | 0.555 | Ícones |
| i18next | 25.6 | Internacionalização |

### Backend
| Tecnologia | Função |
|------------|--------|
| Node.js | Runtime |
| Express | Server HTTP |
| Supabase | Database + Auth |
| Google Generative AI | Agentes de IA |

### Integrações
| Serviço | Função |
|---------|--------|
| WAHA | API WhatsApp (Docker) |
| Apify | Web Scraping |
| PayPal | Pagamentos |

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- Docker (para WAHA)
- Conta no Supabase
- API Key do Google Gemini

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/CRM---Ferrer-Studio.git
cd CRM---Ferrer-Studio
```

### 2. Instale as dependências

```bash
# Frontend
npm install

# Backend
cd server && npm install && cd ..
```

### 3. Configure o WAHA (WhatsApp)

```bash
docker run -d \
  --name waha \
  -p 3000:3000 \
  -e WHATSAPP_HOOK_URL=http://host.docker.internal:3001/webhook \
  -e WHATSAPP_HOOK_EVENTS=message,message.ack,session.status \
  devlikeapro/waha
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

---

## ⚙️ Configuração

### Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations na pasta `supabase/`
3. Configure as tabelas necessárias:
   - `leads` - Gestão de leads
   - `apify` - Leads importados
   - `whatsapp_waha_chats` - Conversas
   - `whatsapp_waha_messages` - Mensagens
   - `agents` - Agentes de IA
   - `settings` - Configurações do sistema
   - `users` - Usuários

### APIs

Configure as seguintes APIs em **Configurações > Sistema**:

| API | Descrição |
|-----|-----------|
| WAHA API URL | `http://localhost:3000/api` |
| Server URL | `http://localhost:3001` |
| Gemini API Key | Sua chave do Google AI Studio |
| Apify Token | Token da sua conta Apify |

---

## 🖥️ Uso

### Iniciar o sistema

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

O sistema estará disponível em:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **WAHA**: http://localhost:3000

### Primeiro Acesso

1. Acesse o sistema e faça login
2. Vá em **Conversas** e escaneie o QR Code do WhatsApp
3. Configure as APIs em **Configurações > Sistema**
4. Crie agentes de IA em **Agentes**
5. Importe leads via **Importações**

---

## 📁 Estrutura do Projeto

```
CRM---Ferrer-Studio/
├── components/           # Componentes React
│   ├── chat/            # Componentes do chat
│   ├── Agents.tsx       # Gestão de agentes IA
│   ├── ApifyBlastPage.tsx   # Disparo em massa
│   ├── ApifyImports.tsx # Importações Apify
│   ├── Chat.tsx         # Interface de chat
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Leads.tsx        # Gestão de leads
│   ├── Settings.tsx     # Configurações
│   └── ...
├── services/            # Serviços e APIs
│   ├── supabaseService.ts   # Operações Supabase
│   ├── wahaService.ts   # API WAHA
│   ├── aiService.ts     # Serviço de IA
│   └── settingsService.ts   # Configurações
├── server/              # Backend Node.js
│   ├── index.js         # Servidor Express
│   ├── aiHandler.js     # Handler de IA
│   └── blastService.js  # Serviço de blast
├── types/               # Tipos TypeScript
├── public/              # Assets públicos
└── supabase/            # Migrations e configs
```

---

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco
- Tokens de API armazenados no servidor
- Variáveis de ambiente para credenciais

---

## 📄 Licença

Este projeto é proprietário da **Ferrer Studio**.

---

<div align="center">

### Desenvolvido com ❤️ por Ferrer Studio

</div>
