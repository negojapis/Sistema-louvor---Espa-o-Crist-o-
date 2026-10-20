# Sistema de Escalas para Ministério de Louvor 🎵

Sistema moderno, clean e acolhedor para gestão de escalas, disponibilidades e repertório do ministério de louvor de uma igreja. Desenvolvido com foco total na experiência pelo celular (Mobile-First), alta legibilidade e facilidade de uso.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS (tema suave, acolhedor e limpo)
- **Ícones:** Lucide React
- **Banco de Dados & Autenticação:** Supabase (PostgreSQL + Row Level Security - RLS)

---

## ✨ Funcionalidades Principais

### 1. Acesso & Perfis
- Dois perfis com permissões distintas: **Administrador** e **Integrante**.
- Cada integrante está associado ao seu cadastro e usuário.
- **Seletor de Perfis no Modo Demonstração:** Permite alternar instantaneamente entre o *Pr. Lucas (Admin)*, *Mariana Costa (Voz/Violão)*, *Gabriel Silva (Bateria)* e outros integrantes para testar o sistema sob o ponto de vista de cada perfil.

### 2. Gestão de Integrantes
- O administrador cadastra os nomes e as funções que cada pessoa pode exercer.
- Uma pessoa pode ter várias funções cadastradas (ex: Voz Principal, Violão, Teclado).
- A função específica é escolhida em cada escala, sem instrumento fixo.

### 3. Cultos & Calendário
- Cadastro de cultos com título, data, horário e observações.
- Calendário mensal interativo com indicadores de cultos por dia.
- Suporte a múltiplos cultos na mesma data (ex: Domingo Manhã e Domingo Noite).
- Lista dos próximos cultos com filtros por status e data.

### 4. Disponibilidade em 1 Toque
- Cada integrante responde por culto: **Disponível** (verde) ou **Indisponível** (coral).
- Quando ainda não responder, é exibido **Pendente** (amarelo).
- Permite alterar a resposta a qualquer momento.
- O administrador consulta o resumo e a lista completa de respostas da equipe.

### 5. Montagem de Escala Inteligente
- O administrador monta a escala manualmente, escolhendo integrantes e suas funções no culto.
- Exibe o status de disponibilidade do integrante em tempo real durante a seleção.
- **Bloqueio de Indisponíveis:** Impede a seleção de quem marcou que está indisponível.
- **Alerta de Pendentes:** Avisa quando o integrante selecionado ainda não respondeu.
- **Prevenção de Duplicidades:** Impede que a mesma pessoa seja escalada mais de uma vez no mesmo culto.
- Opção de salvar como **Rascunho** ou **Publicar Escala**.
- **Privacidade dos Integrantes:** Integrantes visualizam apenas escalas que já foram publicadas.

### 6. Repertório de Músicas
- Ordem de execução das músicas do culto (1, 2, 3...).
- Campos: Nome da música, Tom (opcional) e Link de referência (opcional - YouTube, Spotify, Cifra Club).
- O repertório aparece integrado à escala para os músicos ensaiarem.

---

## 🔒 Permissões e Segurança no Banco (Supabase RLS)

Todas as permissões são aplicadas a nível de banco de dados através do PostgreSQL Row Level Security (RLS), e **não apenas ocultando botões na interface**:

1. **Disponibilidade:** Cada integrante só pode inserir ou atualizar a sua própria resposta no banco.
2. **Escala e Cultos:** Somente administradores (`is_admin()`) têm permissão de escrita em cultos, integrantes, escalas e músicas.
3. **Escalas em Rascunho:** A política de `SELECT` na tabela de escalas impede que integrantes comuns leiam dados de cultos que ainda estão em rascunho (`status = 'draft'`).
4. **Segurança de Chaves:** Apenas a chave pública anônima (`VITE_SUPABASE_ANON_KEY`) é utilizada no frontend. Nenhuma chave administrativa (`service_role`) é exposta no navegador.

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
O sistema abrirá em `http://localhost:5173/`. Por padrão, ele inicia em **Modo Demonstração** com dados realistas já carregados.

### 3. Build de Produção
```bash
npm run build
```

---

## ☁️ Passos para Conectar ao Supabase (Persistência Real)

1. Crie um projeto no [Supabase](https://supabase.com).
2. No painel do Supabase, acesse **SQL Editor**.
3. Copie o conteúdo do arquivo [`src/sql/schema.sql`](./src/sql/schema.sql) e clique em **Run**. Ele criará todas as tabelas, índices e políticas de segurança RLS.
4. Em **Project Settings > API**, copie a **Project URL** e a **Anon Public Key**.
5. Crie um arquivo `.env` na raiz do projeto (ou use o modal "Conectar Supabase" diretamente no topo do app):
   ```env
   VITE_SUPABASE_URL=https://seuid.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
6. Pronto! O app se conectará ao seu banco Supabase com persistência real.
