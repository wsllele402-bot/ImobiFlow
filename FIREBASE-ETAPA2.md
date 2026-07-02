# Migração para o Firebase — Etapa 2 (o que você faz agora)

Já deixei o app ligado ao seu Firebase. Os arquivos trocados vão neste pacote.
Agora faltam **3 passinhos seus**, todos pelo site (sem terminal, exceto se você
rodar o app no seu computador — aí tem 1 comando só, explicado no fim).

## 1. Ativar o Storage (guardar fotos e documentos)

No console do Firebase (console.firebase.google.com), com seu projeto aberto:

1. Menu da esquerda → **Storage** → **Começar**.
2. Escolha **iniciar no modo de produção** → **Avançar**.
3. Em localização, deixe a sugerida (ou São Paulo, se aparecer) → **Concluir**.

## 2. Publicar as regras de segurança

**Regras do banco:**
1. Menu → **Firestore Database** → aba **Regras**.
2. Apague o que estiver lá e cole o conteúdo do arquivo `firestore.rules`.
3. Clique em **Publicar**.

**Regras dos arquivos:**
1. Menu → **Storage** → aba **Regras**.
2. Apague o que estiver lá e cole o conteúdo do arquivo `storage.rules`.
3. Clique em **Publicar**.

Isso garante que cada pessoa só enxerga os próprios dados.

## 3. Colocar os arquivos novos no projeto

Substitua/adicione no seu projeto (do jeito que você já mexe nele — AI Studio
ou seu computador):

- `src/firebase.ts` **(novo)** — a conexão com o seu Firebase.
- `src/services/dbService.ts` — agora funciona no Firebase.
- `services/asaasService.ts` — versão temporária (o Asaas fica pra depois).
- `package.json` — passou a incluir o `firebase`.
- `firestore.rules` e `storage.rules` — as regras acima.

> Se você usa o **Google AI Studio**, ao adicionar o `firebase` no `package.json`
> ele normalmente instala sozinho. Se você roda o app **no seu computador**,
> abra a pasta do projeto e rode uma vez: `npm install`

## Pronto! Como testar

1. Rode/abra o app.
2. Na tela de login, clique para **criar uma conta** e cadastre um e-mail e senha.
3. Cadastre um imóvel de teste. Volte ao console do Firebase → **Firestore
   Database** → você deve ver o imóvel aparecer lá como um documento. 🎉

Se algo não funcionar, me diga o que aparece na tela (ou um print) e em qual
passo você está — a gente ajusta. Depois que isso estiver de pé, voltamos ao
Asaas, com calma.
