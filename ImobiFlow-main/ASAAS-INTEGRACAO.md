# Integração Asaas — publicar as funções (confirmação automática)

Este é o passo técnico do projeto. Vou ser honesto: aqui a gente usa um
**terminal** — mas dá pra fazer tudo pelo **navegador**, com o Google Cloud
Shell, sem instalar nada no seu computador. Faça com calma; se travar em
qualquer linha, me manda o que apareceu que eu te destravo.

O que estas funções fazem:
- **createAsaasCharge** — gera o boleto/PIX da cobrança.
- **asaasWebhook** — recebe o aviso do Asaas e dá baixa sozinho quando o
  inquilino paga.

> Pré-requisitos que você já tem: plano **Blaze** ativo e a **chave de API do
> Asaas (Sandbox)** guardada.

---

## Passo 1 — Colocar estes arquivos no seu GitHub

Adicione ao repositório (por cima, como sempre): a pasta **`functions/`**, o
**`firebase.json`** e o **`.firebaserc`**. (Isso não afeta o site no Hostinger —
esses arquivos são só pra publicar as funções.)

## Passo 2 — Abrir o Cloud Shell

Acesse **https://shell.cloud.google.com** e entre com a **mesma conta Google** do
seu Firebase. Vai abrir um terminal preto dentro do navegador. Se pedir para
escolher/confirmar o projeto, escolha **imobiflow-3784f**.

## Passo 3 — Trazer o código pra dentro do Cloud Shell

Clone seu repositório (troque pela URL do seu repo no GitHub):

```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git imobiflow
cd imobiflow
```

## Passo 4 — Instalar a ferramenta do Firebase (uma vez)

```bash
npm install -g firebase-tools
```

## Passo 5 — Entrar na sua conta Firebase

```bash
firebase login --no-localhost
```

Siga o link/código que aparecer para autorizar.

## Passo 6 — Guardar os segredos (a chave do Asaas e o token do webhook)

Rode um de cada vez. Ele vai pedir para você **colar o valor**:

```bash
firebase functions:secrets:set ASAAS_API_KEY
```
→ cole sua **chave de API do Asaas (Sandbox)** e aperte Enter.

```bash
firebase functions:secrets:set ASAAS_WEBHOOK_TOKEN
```
→ invente uma senha aleatória (ex.: `imobi-webhook-9x7k2`) e cole. **Guarde essa
senha**, você vai usá-la no painel do Asaas no Passo 8.

## Passo 7 — Publicar as funções

```bash
firebase deploy --only functions
```

Pode demorar alguns minutos na primeira vez (ele ativa uns serviços). No fim,
ele mostra os **endereços (URLs)** das funções. **Copie a URL da `asaasWebhook`**
— algo como `https://southamerica-east1-imobiflow-3784f.cloudfunctions.net/asaasWebhook`.
(Você também acha em Firebase → Functions.)

## Passo 8 — Cadastrar o webhook no Asaas

No painel do **Asaas (Sandbox)** → menu do usuário → **Integrações → Webhooks**
→ criar novo:
- **URL:** a URL da `asaasWebhook` do passo anterior.
- **Token de autenticação:** o mesmo `ASAAS_WEBHOOK_TOKEN` que você inventou.
- **Eventos:** marque `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED` e `PAYMENT_OVERDUE`.

## Pronto! Como vai funcionar

Depois disso, quando o app gerar uma cobrança, o Asaas cria o boleto; quando o
pagamento cai, o Asaas chama sua `asaasWebhook` e o pagamento vira **Recebido**
sozinho no ImobiFlow.

> Estamos no **Sandbox** (teste). Quando tudo estiver validado, a gente troca
> para produção: muda o `ASAAS_BASE` no `functions/index.js` para
> `https://api.asaas.com/v3`, refaz os segredos com a chave de **produção** e
> publica de novo.

Assim que as funções estiverem publicadas, me avisa que eu ligo o botão
**"Gerar boleto"** no app pra você testar de ponta a ponta.
