# Prompt do Product Owner (PO): Sistema de Login Seguro

## Contexto do Projeto

Estamos desenvolvendo o **Sistema de Login Seguro**, um dos módulos práticos de segurança da informação para a Unidade 3 do curso. O objetivo principal é construir uma aplicação web robusta, que implemente mecanismos modernos de autenticação, confidencialidade e integridade de dados para mitigar vetores comuns de ataque.

---

## Stack Tecnológica Obrigatória

* **Backend:** Python (sugestão: **FastAPI** ou **Flask**, devido à facilidade de integração e performance).
* **Frontend:** React com **Tailwind CSS** e **shadcn/ui** para componentes de interface.
* **Ambiente:** **Docker** e **Docker Compose** para containerização de toda a aplicação (App, Backend e Banco de Dados).
* **Criptografia e Segurança (Sugestões de Complementos):**
* *Backend:* `PyJWT` (gerenciamento de tokens), `cryptography` ou `passlib[bcrypt]` (hashing de senhas com salt) , `pyotp` (para a autenticação em duas etapas - 2FA).


* 
*Frontend:* `lucide-react` (ícones) e `qrcode.react` (se necessário exibir o QR Code para o 2FA).





---

## Requisitos de Negócio e Funcionalidades (User Stories)

### 1. Cadastro de Usuário com Armazenamento Seguro

* **Como** usuário do sistema, **quero** criar uma conta fornecendo e-mail e senha, **para que** eu possa acessar a plataforma futuramente.
* **Critérios de Aceite (Critérios Técnicos):**
* O backend **nunca** deve armazenar senhas em texto plano.


* Deve ser utilizado um algoritmo de hash robusto (como **Bcrypt** ou **Argon2**), aplicando **Salt de forma automática e única** para cada usuário para evitar ataques de dicionário e tabelas rainbow.


* Validação estrita de complexidade de senha no frontend e backend.



### 2. Autenticação e Geração de Tokens de Acesso

* 
**Como** usuário cadastrado, **quero** realizar o login informando minhas credenciais corretas, **para que** o sistema valide minha identidade e me conceda acesso.


* **Critérios de Aceite:**
* Após a validação bem-sucedida da senha, o sistema deve gerar um **Token de Acesso seguro (JWT - JSON Web Token)**.
* O token deve possuir tempo de expiração curto (ex: 15 a 30 minutos) e ser assinado digitalmente pelo backend.


* No frontend, o token deve ser armazenado de forma segura (preferencialmente em cookies `HttpOnly` e `Secure` para mitigar ataques de XSS).



### 3. Autenticação em Duas Etapas (2FA / MFA)

* 
**Como** usuário preocupado com a segurança, **quero** ativar a autenticação em duas etapas na minha conta, **para que** invasores não consigam acessar meus dados mesmo que descubram minha senha.


* **Critérios de Aceite:**
* Implementar o protocolo **TOTP (Time-Based One-Time Password)**.


* Ao ativar o 2FA, o sistema deve gerar uma chave secreta e exibi-la na tela através de um **QR Code** para que o usuário possa escanear em aplicativos como Google Authenticator ou Authy.


* Nas tentativas de login subsequentes à ativação, o sistema só deve emitir o Token JWT após a validação correta do código de 6 dígitos gerado pelo app do usuário.





---

## Requisitos Não-Funcionais e Engenharia (Docker & UI)

* **Interface (React + shadcn/ui):** Telas de login, cadastro e verificação de 2FA limpas, responsivas e que sigam as melhores práticas de UX, utilizando os componentes acessíveis do shadcn/ui.
* **Ambiente (Docker):** O projeto deve rodar perfeitamente com um único comando `docker-compose up --build`. O ambiente deve isolar o banco de dados (ex: PostgreSQL ou Redis para controle de tokens invalidos) e expor apenas as portas estritamente necessárias do frontend e backend.
* 
**Logs de Segurança:** O backend deve registrar tentativas de login falhas para possibilitar mecanismos de rate limiting (mitigação contra ataques de força bruta).



---

## O que você (IA / Desenvolvedor) deve gerar agora:

1. A **arquitetura de pastas** sugerida unindo o ecossistema Python (Backend) e React (Frontend) dentro do ambiente Docker.
2. O código do arquivo `docker-compose.yml` estruturando os serviços.
3. O endpoint em Python que realiza o **hash da senha com salt** e a rota de login que valida e gera o **Token JWT**.


4. O fluxo lógico (passo a passo do código) para implementar a validação do **2FA (TOTP)**.