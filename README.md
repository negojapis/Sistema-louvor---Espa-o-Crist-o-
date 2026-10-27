# Aplicativo Móvel - Espaço Cristão (Ministério de Louvor) 📱🎵

Aplicativo móvel nativo (Android e iOS) moderno, clean e acolhedor para gestão de escalas, disponibilidades e repertório do ministério de louvor da igreja.

Desenvolvido para **Android** e **iOS** com **Capacitor + React 19 + TypeScript**, com suporte completo a Safe Areas (notch/dynamic island), feedback tátil (haptics), botões nativos e persistência em nuvem com Supabase.

---

## 🛠️ Tecnologias Utilizadas

- **Mobile Runtime:** Capacitor 8 (Android & iOS)
- **Frontend Core:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS (ergonomia mobile e temas acolhedores)
- **Recursos Nativos:**
  - Status Bar nativa com contraste automático
  - Splash screen nativa
  - Vibração tátil (Haptic feedback) ao selecionar disponibilidades e abas
  - Botão voltar nativo (Android back button) integrado a modais
- **Ícones:** Lucide React & Phosphor Icons
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

## 📱 Como Rodar e Desenvolver o Aplicativo Móvel

### 1. Instalar Dependências
```bash
npm install
```

### 2. Desenvolvimento no Navegador (Mobile Preview)
Para iterar rapidamente em layout e lógica no navegador com dimensões de celular:
```bash
npm run dev
```

### 3. Compilar e Sincronizar com os Apps Nativos
Sempre que fizer alterações no código e quiser enviar para o Android ou iOS:
```bash
npm run cap:build
```
*(ou se já tiver rodado o build: `npm run cap:sync`)*

---

### 🤖 Abrir no Android Studio (Gerar APK / Emulador / Play Store)
```bash
npm run cap:android
```
- Abrirá o projeto nativo localizado na pasta `/android` diretamente no **Android Studio**.
- No Android Studio você pode:
  - Clicar em **Run** para testar em um celular conectado via USB ou no emulador.
  - Ir em **Build > Generate Signed Bundle / APK** para gerar o arquivo `.aab` ou `.apk` para publicação na Google Play Store.

---

### 🍏 Abrir no Xcode (iOS / iPhone / App Store)
*(Requer ambiente macOS para compilação final)*
```bash
npm run cap:ios
```
- Abrirá o workspace do Xcode localizado na pasta `/ios`.
- No Xcode você pode rodar nos simuladores de iPhone ou gerar o build para envio ao TestFlight e Apple App Store.

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
