# Bixuco

## Dispositivo vestível + app para acompanhar rotina, sinais sensoriais e localização entre responsáveis e terapeutas

[![Node.js](https://img.shields.io/badge/Node.js-Express%205-444444)](package.json)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pg%20%2B%20connect--pg--simple-336791)](package.json)
[![Auth](https://img.shields.io/badge/Auth-bcrypt%20%7C%20Passport%20%7C%20Google%20OAuth%20%7C%202FA-149ECA)](package.json)
[![Segurança](https://img.shields.io/badge/Segurança-Helmet%20%2F%20CSP%20%2F%20reCAPTCHA%20v3-3ECF8E)](package.json)
[![IA](https://img.shields.io/badge/IA-Gemini%20(dicas%20personalizadas)-8E44AD)](package.json)
[![Mobile](https://img.shields.io/badge/Mobile-Capacitor%20%2F%20Android-3DDC84)](android)

O **Bixuco** é a combinação de um app web/mobile com um dispositivo vestível para crianças em acompanhamento terapêutico. O app conecta **responsáveis** e **terapeutas**: cadastro da criança, perfil sensorial, relatórios diários, dicas geradas por IA e o vínculo com o dispositivo Bixuco, que reporta localização, bateria e eventos sensoriais (força e duração de uma crise, por exemplo) em tempo real. Terapeutas acompanham os pacientes vinculados, veem relatórios consolidados e registram notas clínicas; a administração cuida de pedidos e novidades.

O acesso a funcionalidades como relatórios, dispositivo e acompanhamento de pedido depende do plano contratado (`precisaPlano("medio")`/`exigePremium`), com assinatura recorrente via Mercado Pago.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Sobre a equipe](#sobre-a-equipe)
- [Papéis de usuário](#papéis-de-usuário)
- [Funcionalidades](#funcionalidades)
- [Tecnologias e arquitetura](#tecnologias-e-arquitetura)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Execução local](#execução-local)
- [Rotinas automáticas (cron)](#rotinas-automáticas-cron)
- [Segurança](#segurança)
- [Capturas de tela](#capturas-de-tela)
- [Solução de problemas](#solução-de-problemas)
- [Roadmap](#roadmap)
- [Contribuição e licença](#contribuição-e-licença)

## Sobre o projeto

### O problema: TPS e TEA

Quando pensamos nas grandes evoluções da saúde moderna, o aumento da conscientização sobre a neurodiversidade e o suporte a condições antes negligenciadas ganham um papel de destaque. Um grande exemplo disso é o TPS (Transtorno de Processamento Sensorial), que faz com que seu público-alvo — principalmente crianças com TEA (Transtorno do Espectro Autista) — apresente hipersensibilidade ou hiposensibilidade a estímulos externos.

Na prática, isso afeta o cotidiano dos pequenos de diversas formas. Quando uma criança se sente incomodada com a textura de um tecido, um gosto ou um cheiro, ela pode sentir uma necessidade avassaladora de externalizar e descarregar esse desconforto físico e emocional.

### A solução: a pelúcia inteligente Bixuco

A Bixuco nasceu exatamente para mudar essa realidade, pois entendemos o quanto essa sensação é difícil para a criança e o quanto ela pode impactar a dinâmica familiar ao seu redor. Por esse motivo, desenvolvemos uma pelúcia inteligente projetada para acompanhar seu filho e servir como uma ferramenta de regulação sensorial segura nos momentos em que ele mais precisar canalizar esse sentimento.

### Um ecossistema completo

Quando isso acontecer, você receberá os dados desses episódios diretamente em sua conta Bixuco. A partir do nosso ecossistema, você terá acesso a dicas personalizadas e poderá compartilhar esses relatórios com o próprio psicólogo ou terapeuta do seu pequeno, unindo tecnologia e afeto para tornar o acompanhamento clínico muito mais preciso e humanizado.

### Nosso compromisso

Nosso foco é te ajudar e fazer com que você se sinta acolhido, pois a Bixuco quer estar lá por você e por qualquer um que precise.

## Sobre a equipe

O Bixuco é o TCC (também chamado de **PTI**) do curso técnico em Informática de **Yasmin Bertoni**, **Sophia Silva Freitas** e **Arthur Regiani Delgado Rosa De Oliveira**:

| Integrante | Papel |
| --- | --- |
| Arthur Regiani Delgado Rosa De Oliveira | Programador Front-end |
| Sophia Silva Freitas | Diretora de Marketing e Financeiro |
| Yasmin Bertoni | Programadora Back-end |

## Papéis de usuário

| Papel | O que pode fazer |
| --- | --- |
| Responsável (pai/mãe) | Cadastra a criança, preenche perfil sensorial e relatórios diários, acompanha localização/eventos do dispositivo, vincula-se a um terapeuta, assina um plano, recebe dicas por IA |
| Terapeuta | Aceita vínculos de responsáveis, acompanha relatórios e perfil sensorial dos pacientes, registra notas clínicas |
| Administração | Gerencia pedidos do dispositivo físico e publica novidades |

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Contas | Cadastro de responsável (pai/mãe) e de terapeuta, login com rate limit por IP e por conta, verificação em duas etapas (2FA) por código, login com Google, recuperação de senha, exclusão de conta |
| Criança / paciente | Cadastro da criança com foto, perfil sensorial (questionário), vínculo responsável ↔ terapeuta (solicitar, aceitar, cancelar, remover) |
| Relatórios | Relatório diário, relatório por paciente (para o terapeuta), gráfico de evolução, notas clínicas do terapeuta |
| Dicas por IA | Geração de dicas personalizadas (Gemini) a partir do histórico, evitando repetir uma dica já dada |
| Dispositivo Bixuco | Vínculo do dispositivo físico à criança, envio de localização + nível de bateria, registro de eventos sensoriais (tipo, força, duração), autenticado com uma chave própria de dispositivo (independente do login do usuário) |
| Planos e pagamento | Plano Básico (R$ 100/mês: pelúcia, IA e rastreamento) e Plano Premium (R$ 120/mês: tudo do Básico + conexão com psicólogo/terapeuta) — mapeados no código como planos "médio" e "completo", como assinatura recorrente no Mercado Pago (checkout, webhook, sucesso/falha/pendente) |
| Pedido do dispositivo | Endereço de entrega, confirmação, acompanhamento e status de entrega do Bixuco físico |
| Notificações | Central de notificações do usuário, lembrete diário de preenchimento do relatório, avisos de vínculo |
| Administração | Gestão de pedidos e publicação de novidades, protegidas por sessão autenticada + verificação de admin |
| Mobile | App Android empacotado com Capacitor, App Links via `assetlinks.json`, fluxo próprio de token para o app (`/auth/app-token`) |

## Tecnologias e arquitetura

| Camada | Tecnologias | Responsabilidade |
| --- | --- | --- |
| Frontend | HTML, CSS e JavaScript estáticos (`static/`, `templates/`) | Telas do responsável, do terapeuta e da administração |
| Backend | Node.js, Express 5 (arquivo único `server.js`) | Rotas, autenticação, regras de negócio |
| Autenticação | Passport (local + Google OAuth20), bcrypt, 2FA por código | Login e verificação de identidade |
| Sessão | `express-session` + `connect-pg-simple` | Sessão armazenada no próprio PostgreSQL |
| Banco de dados | PostgreSQL (`pg`) | Contas, crianças, relatórios, localizações, eventos, pedidos |
| Segurança | Helmet (CSP), reCAPTCHA v3, rate limiting dedicado por rota sensível | Cabeçalhos HTTP, proteção contra bots e força bruta |
| Upload | Multer + `file-type` | Upload de foto de perfil/criança com validação do conteúdo real do arquivo |
| Pagamentos | Mercado Pago SDK (`PreApprovalPlan`, `PreApproval`, `Preference`) | Assinatura recorrente dos planos e checkout |
| IA | Google Gemini (`gemini-3-flash-preview`) | Geração de dicas personalizadas para o responsável |
| E-mail | Brevo (`@getbrevo/brevo`) | E-mails transacionais |
| Agendamento | `node-cron` | Lembretes e limpezas automáticas (veja a seção de rotinas) |
| Mobile | Capacitor + Android | Empacotamento do frontend como app Android |
| Configuração | `dotenv` | Carregamento de variáveis de ambiente |
| Mapa | Leaflet + OpenFreeMap/OpenStreetMap | Exibição da localização do dispositivo no mapa |
| Deploy | Render (aplicação) + Neon (PostgreSQL serverless) | Hospedagem do backend e do banco em produção |

> No `package.json` também constam `mysql2`, `nodemailer`, `resend`, `cors` e `dotenv`, mas nenhum deles aparece `require`-ado em `server.js` — parecem dependências não usadas hoje. O caso do `dotenv` merece atenção: como `require('dotenv').config()` nunca é chamado, o `.env` local só é lido se as variáveis já estiverem exportadas no ambiente por outro meio (ex.: variáveis configuradas direto no painel do Render).

```mermaid
flowchart LR
    R[Responsável] --> F[Frontend estático HTML/CSS/JS]
    T[Terapeuta] --> F
    ADM[Administração] --> F
    F -->|HTTP + sessão| B[Backend Express]
    B -->|bcrypt + Passport + 2FA| AUTH[Autenticação]
    B -->|sessão| DB[(PostgreSQL)]
    B -->|consultas parametrizadas| DB
    B -->|assinatura/checkout| MP[Mercado Pago]
    MP -->|webhook| B
    B -->|dicas personalizadas| GEM[Google Gemini]
    B -->|e-mails| BR[Brevo]
    B -->|cron: lembrete, limpeza, retenção| CRON[node-cron]
    DISP[Dispositivo Bixuco] -->|chave própria de dispositivo| B
    AND[App Android / Capacitor] --> F
```

## Estrutura do repositório

```text
Bixuco/
├── .well-known/
│   └── assetlinks.json        # Vínculo do domínio com o app Android (App Links)
├── www/
│   └── index.html             # Ponto de entrada do WebView do Capacitor
├── android/                    # Projeto nativo Android (Capacitor)
├── static/
│   ├── css/                    # Estilos por tela
│   ├── img/                    # Imagens e mascote do Bixuco
│   └── js/                     # Scripts por tela
├── templates/                  # Páginas HTML (login, cadastro, relatórios, planos, admin...)
├── server.js                   # Backend Express: rotas, autenticação, regras de negócio
├── capacitor.config.json       # Configuração do empacotamento mobile
├── package.json
└── package-lock.json
```

*Todo o backend está em um único arquivo `server.js` (por volta de 6 mil linhas).*

## Instalação

### Pré-requisitos

- Node.js e npm instalados
- Um banco PostgreSQL de desenvolvimento
- Conta no Mercado Pago, Brevo e Google Cloud (OAuth + reCAPTCHA + Gemini) para os fluxos que dependem delas
- Para o app mobile: Android Studio / SDK do Android (via Capacitor)

```powershell
node --version
npm --version
npm install
```

### Arquivo de configuração

```powershell
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
```

Preencha o `.env` com os valores reais conforme a seção abaixo.

> ⚠️ O `server.js` não chama `require('dotenv').config()`, então o `.env` sozinho não é carregado automaticamente. Rode com `node -r dotenv/config server.js` (ou adicione essa chamada no início do `server.js`) para que as variáveis do `.env` sejam lidas localmente; em produção (Render), configure as variáveis direto no painel do serviço.

## Variáveis de ambiente

Levantadas diretamente do `server.js`:

```dotenv
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
DATABASE_URL=postgres://usuario:senha@localhost:5432/bixuco
SESSION_SECRET=defina-um-valor-aleatorio-e-secreto
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RECAPTCHA_SECRET_KEY=
MP_ACCESS_TOKEN=
MP_PLAN_ID_MEDIO=
MP_PLAN_ID_COMPLETO=
GEMINI_API_KEY=
BREVO_API_KEY=
BREVO_FROM_EMAIL=
DEVICE_API_KEY=
```

| Variável | Uso |
| --- | --- |
| `PORT` | Porta do servidor Express (padrão 3000) |
| `NODE_ENV` | Ambiente de execução |
| `BASE_URL` | URL base usada em links gerados pelo backend |
| `DATABASE_URL` | Conexão com o PostgreSQL (também usada pela sessão via `connect-pg-simple`) |
| `SESSION_SECRET` | Assinatura do cookie de sessão |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login com Google (Passport) |
| `RECAPTCHA_SECRET_KEY` | Validação do reCAPTCHA v3 em formulários sensíveis |
| `MP_ACCESS_TOKEN` | Token da conta Mercado Pago (checkout e assinaturas) |
| `MP_PLAN_ID_MEDIO` / `MP_PLAN_ID_COMPLETO` | IDs dos planos de assinatura recorrente no Mercado Pago |
| `GEMINI_API_KEY` | Geração das dicas personalizadas por IA |
| `BREVO_API_KEY` / `BREVO_FROM_EMAIL` | Envio de e-mails transacionais |
| `DEVICE_API_KEY` | Autentica as requisições vindas do dispositivo físico Bixuco (endpoints de localização/evento) |

Confirme que o `.env` real está no `.gitignore` (já está).

## Execução local

```powershell
npm start
```

| Serviço | Endereço padrão |
| --- | --- |
| Aplicação | http://localhost:3000 |
| Login | http://localhost:3000/logar |
| Cadastro (responsável) | http://localhost:3000/CriarContaP |
| Cadastro (terapeuta) | http://localhost:3000/CriarContaS |

### App Android

```powershell
npx cap sync android
npx cap open android
```

## Rotinas automáticas (cron)

Todas rodam no fuso `America/Sao_Paulo`:

| Horário | Rotina |
| --- | --- |
| 19h | Lembrete para responsáveis que ainda não preencheram o relatório do dia |
| 4h | Limpeza de notificações lidas com mais de 30 dias e tokens de app expirados/usados |
| 4h | Exclusão de notas clínicas com mais de 7 dias — retenção simplificada para fins de MVP/TCC; um prontuário real segue a Resolução CFP nº 1/2009 (guarda mínima de 5 anos, ou 20 por analogia ao prontuário médico) |

## Segurança

Pontos já implementados no projeto: senhas com bcrypt, sessão assinada e armazenada no próprio PostgreSQL, Helmet/CSP, reCAPTCHA v3 em cadastro/recuperação, 2FA por código no login, rate limiting dedicado por rota sensível (login por IP, tentativas de login, 2FA, reenvio de 2FA, recuperação de senha, criação de conta e ações administrativas), rotas administrativas protegidas por sessão autenticada + verificação de admin, upload de imagem validado pelo conteúdo real do arquivo (não só pelo MIME informado pelo cliente) e consultas SQL parametrizadas.

## Capturas de tela

> Salve os 6 prints abaixo em `docs/screenshots/` no repositório, com esses mesmos nomes de arquivo, que as imagens aparecem certinho no README.

| Login | Home do responsável (com localização) | Relatório diário |
| --- | --- | --- |
| ![Tela de login do Bixuco](docs/screenshots/login-1.png) ![Login com Google](docs/screenshots/login-2.png) | ![Home do responsável, com calendário e localização do ursinho](docs/screenshots/home-responsavel-1.png) ![Home do responsável, com dicas personalizadas](docs/screenshots/home-responsavel-2.png) | ![Relatório diário, gráfico de força e status ativo](docs/screenshots/relatorio-diario-1.png) ![Relatório diário, pergunta sobre desconforto com texturas](docs/screenshots/relatorio-diario-2.png) |

## Solução de problemas

| Sintoma | Verificação e ação |
| --- | --- |
| Porta em uso | Encerre a instância anterior ou troque a `PORT` no `.env` |
| Erro de conexão com o banco | Confirme `DATABASE_URL` e se o PostgreSQL está rodando |
| Login com Google não funciona | Confira `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` e as URLs autorizadas no console do Google |
| reCAPTCHA falhando | Confirme `RECAPTCHA_SECRET_KEY` e se o domínio está autorizado no console do Google |
| Checkout/assinatura indisponível | Confirme `MP_ACCESS_TOKEN`, `MP_PLAN_ID_MEDIO` e `MP_PLAN_ID_COMPLETO` |
| Dicas por IA não geram | Confirme `GEMINI_API_KEY` e a disponibilidade do modelo `gemini-3-flash-preview` |
| E-mails não chegam | Confirme `BREVO_API_KEY`/`BREVO_FROM_EMAIL` |
| Dispositivo não envia localização/evento | Confirme `DEVICE_API_KEY` e se o dispositivo já está vinculado a uma criança (`/api/dispositivos/vincular`) |

## Roadmap

Ainda não definido — quando o grupo fechar os próximos passos, esse é um bom lugar pra deixar claro pra quem for avaliar o TCC.

## Contribuição e licença

Não há `CONTRIBUTING.md` no repositório. O projeto está sob **todos os direitos reservados** (veja [`LICENSE`](LICENSE)) — disponibilizado publicamente para fins de avaliação acadêmica (TCC/PTI), mas não licenciado para uso, cópia, modificação ou redistribuição por terceiros sem autorização dos autores.
