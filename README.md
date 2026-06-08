# Sistema de Login Seguro

Este projeto é um **Sistema de Login Seguro** desenvolvido como módulo prático de segurança da informação. O objetivo principal é construir uma aplicação web robusta que implementa mecanismos modernos de autenticação, confidencialidade e integridade de dados, mitigando vetores comuns de ataque como XSS, CSRF, força bruta e ataques de dicionário.

---

## 🚀 Funcionalidades e Recursos de Segurança

O sistema implementa rigorosos padrões de segurança em toda a stack:

### 1. Cadastro e Armazenamento Seguro de Senhas
- **Algoritmo Bcrypt:** As senhas dos usuários nunca são armazenadas em texto plano. É utilizado o algoritmo de hashing **Bcrypt (v3.2.2)**, que gera automaticamente um *salt* único e seguro para cada usuário. Isso previne ataques de dicionário e uso de tabelas rainbow.
- **Validação Estrita:** Validação de complexidade e formatação de senha no frontend e no backend.

### 2. Autenticação Baseada em JWT (JSON Web Tokens)
- **Cookies Seguros:** Após o login bem-sucedido, o servidor gera um token JWT com tempo de expiração curto (30 minutos).
- **Mitigação de XSS:** O token é armazenado no navegador em um cookie com as flags `HttpOnly`, `Secure` e `SameSite=Lax`. Isso impede que scripts maliciosos injetados no frontend (Cross-Site Scripting - XSS) acessem o token de autenticação.
- **Token Temporário Pré-2FA:** Usuários com a autenticação em duas etapas ativa recebem inicialmente um token temporário restrito que permite apenas a rota de verificação de 2FA.

### 3. Autenticação em Duas Etapas (2FA / MFA)
- **Protocolo TOTP:** Implementação de senhas temporárias baseadas em tempo (Time-Based One-Time Password) utilizando a biblioteca `pyotp`.
- **Ativação Amigável:** Ao solicitar a ativação do 2FA, o sistema gera uma chave secreta e exibe um **QR Code** dinâmico na tela para que o usuário escaneie com aplicativos autenticadores (ex: Google Authenticator, Authy, Microsoft Authenticator).
- **Validação de Token Único:** O login subsequente exige o preenchimento do código de 6 dígitos gerado pelo aplicativo.

### 4. Proteção contra CSRF (Cross-Site Request Forgery)
- **Double Submit Cookie:** O backend gera um token CSRF criptograficamente seguro e o define em um cookie visível ao frontend (`csrf_token`).
- **Validação por Header:** Em todas as requisições que alteram estado (POST), o frontend extrai este token do cookie e o envia no cabeçalho HTTP `X-CSRF-Token`. O backend valida a correspondência do token, garantindo que a requisição partiu legitimamente da própria aplicação.

### 5. Controle de Sessão e Logout (Blacklist com Redis)
- **Revogação Instantânea:** No fluxo tradicional de JWT, o token permanece válido até expirar. Para mitigar isso, este projeto utiliza o **Redis** como cache de alta velocidade para armazenar em uma *blacklist* o identificador de tokens que efetuaram logout, impedindo que sejam reutilizados antes do tempo natural de expiração.

### 6. Logs de Auditoria de Segurança
- Registro no console do backend de eventos críticos de segurança:
  - Tentativas de login bem-sucedidas e falhas (essencial para detecção de força bruta).
  - Tentativas de acesso com tokens revogados ou inválidos.
  - Ativação e confirmação de chaves TOTP/2FA.

---

## 🛠️ Stack Tecnológica

### Frontend
- **React.js** (com Vite)
- **Tailwind CSS** (estilização moderna e responsiva)
- **Axios** (cliente HTTP configurado com credenciais e interceptador CSRF)
- **Lucide React** (ícones de interface)

### Backend
- **Python 3.11** (FastAPI)
- **SQLAlchemy** (ORM assíncrono para persistência de dados)
- **PyJWT** (gerenciamento e assinatura digital de tokens)
- **PyOTP** (geração e validação de chaves TOTP)
- **Bcrypt & Passlib** (hashing seguro de credenciais)

### Infraestrutura & Banco de Dados
- **PostgreSQL** (banco relacional seguro)
- **Redis** (banco chave-valor em memória para a blacklist de JWT)
- **Docker & Docker Compose** (orquestração e isolamento de containers)

---

## 📁 Estrutura de Pastas

```text
secure-login/
├── backend/
│   ├── Dockerfile
│   ├── database.py       # Configuração da conexão assíncrona com PostgreSQL
│   ├── main.py           # Inicialização do FastAPI, CORS e Logs
│   ├── models.py         # Modelos SQLAlchemy para Usuário
│   ├── routes.py         # Endpoints de cadastro, login, 2FA, logout e CSRF
│   ├── schemas.py        # Esquemas de validação de dados Pydantic
│   ├── security.py       # Funções utilitárias de criptografia, JWT e CSRF
│   └── requirements.txt  # Dependências do Python
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx       # Roteamento e layout base
│       ├── index.css     # Estilos globais e Tailwind
│       ├── main.jsx
│       ├── lib/
│       │   └── api.js    # Instância centralizada do Axios com interceptor CSRF
│       └── pages/
│           ├── Dashboard.jsx # Área logada e controle do 2FA
│           ├── Enable2FA.jsx # Página de ativação do 2FA e exibição do QR Code
│           ├── Login.jsx     # Formulário de login
│           ├── Register.jsx  # Formulário de cadastro de usuário
│           └── Verify2FA.jsx # Tela de validação de código 2FA pós-login
├── docker-compose.yml    # Orquestração dos containers
├── .gitignore            # Arquivos ignorados no controle de versão
└── README.md             # Instruções do projeto
```

---

## 🐳 Como Executar o Projeto com Docker Compose

O projeto está totalmente containerizado e pode ser iniciado com um único comando. Certifique-se de ter o [Docker](https://docs.docker.com/get-docker/) e o [Docker Compose](https://docs.docker.com/compose/install/) instalados na sua máquina.

### Passo 1: Iniciar os containers
Na raiz do projeto (onde está o arquivo `docker-compose.yml`), execute:

```bash
docker-compose up --build
```

Este comando irá baixar as imagens necessárias, compilar o frontend e backend, e subir quatro containers:
1. **db** (PostgreSQL na porta `5432`)
2. **redis** (Redis na porta `6379`)
3. **backend** (API FastAPI na porta `8000`)
4. **frontend** (Servidor Vite/React na porta `5173`)

### Passo 2: Acessar a aplicação
- Abra seu navegador e acesse: **`http://localhost:5173`**
- Para inspecionar, testar e visualizar a documentação interativa da API do backend, acesse a Swagger UI em: **`http://localhost:8000/docs`**

---

## 💻 Fluxo de Teste Sugerido

1. **Cadastro:** Vá na tela de Registro e crie uma conta (ex: `teste@email.com` com uma senha forte).
2. **Primeiro Login:** Entre com as credenciais cadastradas. Você será direcionado para o Dashboard.
3. **Ativar 2FA:** No Dashboard, clique em "Habilitar Autenticação de Dois Fatores (2FA)".
   - Um QR Code será exibido na tela, junto com a chave secreta legível em formato texto.
   - Escaneie o QR Code usando seu app de 2FA favorito (Google Authenticator, Authy, etc.).
   - Insira o código de 6 dígitos gerado pelo aplicativo no campo indicado para confirmar e ativar.
4. **Testar Logout:** Saia da conta clicando em "Sair". O token JWT será removido dos cookies e enviado para a blacklist no Redis.
5. **Segundo Login (com 2FA):** Tente logar novamente.
   - O sistema identificará que a conta tem o 2FA ativo e solicitará o código de verificação temporário.
   - Abra o aplicativo autenticador, insira o código de 6 dígitos gerado atualmente e confirme para ter acesso novamente ao Dashboard.

---

## 📤 Como Fazer o Primeiro Envio (Push) para o GitHub

Se você acabou de criar o repositório no GitHub e está se deparando com o erro de branch vazia ao tentar efetuar o push direto (`error: src refspec main does not match any`), siga os passos abaixo no terminal local:

1. **Adicionar os arquivos ao Git:**
   ```bash
   git add .
   ```

2. **Criar o primeiro commit:**
   ```bash
   git commit -m "feat: inicialização do projeto de login seguro"
   ```

3. **Garantir que a branch local chama-se `main`:**
   ```bash
   git branch -M main
   ```

4. **Adicionar o endereço do repositório remoto (caso ainda não tenha feito):**
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
   ```
   *(Substitua a URL acima pela URL real do seu repositório no GitHub)*

5. **Enviar os arquivos:**
   ```bash
   git push -u origin main
   ```
