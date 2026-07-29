// Netlify Function — busca pedidos da Shopee em um período customizável (data início/fim) e
// devolve pedido a pedido, com o detalhamento COMPLETO do Escrow (taxa real) para pedidos já
// COMPLETADOS. Usada pela página Financeiro > Reconciliação pedido a pedido.

const crypto = require('crypto');
const https  = require('https');

const PARTNER_ID  = 2038223;
const PARTNER_KEY = 'shpk6d66626a686b586749656357526e5a584963786a666752464f6c7147485a';
const HOST         = 'partner.shopeemobile.com';

const PAID_STATUSES = ['READY_TO_SHIP', 'PROCESSED', 'SHIPPED', 'TO_CONFIRM_RECEIVE', 'COMPLETED', 'IN_CANCEL'];
const DAY = 24 * 60 * 60 * 1000;
const MAX_WINDOW = 14 * DAY; // limite de 15 dias por chamada da API da Shopee
const MAX_SNS = 500; // segurança para não estourar tempo/memória em lojas de alto volume

function sign(path, timestamp, accessToken, shopId) {
  const baseString = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`;
  return crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex');
}

function shopeeGet(path, query, accessToken, shopId) {
  return new Promise(function(resolve, reject) {
    const timestamp = Math.floor(Date.now() / 1000);
    const s = sign(path, timestamp, accessToken, shopId);
    const qs = Object.keys(query || {}).map(function(k) { return k + '=' + encodeURIComponent(query[k]); }).join('&');
    const fullPath = path + '?partner_id=' + PARTNER_ID + '&timestamp=' + timestamp + '&access_token=' + accessToken +
                      '&shop_id=' + shopId + '&sign=' + s + (qs ? '&' + qs : '');

    const req = https.request({
      hostname: HOST,
      path:     fullPath,
      method:   'GET',
      timeout:  10000,
      headers: { 'Accept': 'application/json', 'User-Agent': 'Orbita/1.0' }
    }, function(res) {
      let data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: { error: 'parse_error', raw: data.substring(0,300) } }); }
      });
    });
    req.on('timeout', function() { req.destroy(); resolve({ status: 0, body: { error: 'timeout', path: path } }); });
    req.on('error', function(e) { resolve({ status: 0, body: { error: e.message, path: path } }); });
    req.end();
  });
}

async function fetchOrderSns(accessToken, shopId, fromMs, toMs, acc, deadlineMs) {
  let winFrom = fromMs;
  while (winFrom < toMs) {
    if (Date.now() > deadlineMs) return;
    if (acc.length >= MAX_SNS) return;
    const winTo = Math.min(winFrom + MAX_WINDOW, toMs);
    let cursor = '';
    let more = true;
    while (more) {
      if (Date.now() > deadlineMs) return;
      if (acc.length >= MAX_SNS) return;
      const res = await shopeeGet('/api/v2/order/get_order_list', {
        time_range_field: 'create_time',
        time_from:  Math.floor(winFrom / 1000),
        time_to:    Math.floor(winTo / 1000),
        page_size:  100,
        cursor:     cursor,
        response_optional_fields: 'order_status'
      }, accessToken, shopId);

      if (res.status !== 200 || !res.body.response) { more = false; break; }
      const list = res.body.response.order_list || [];
      list.forEach(function(o) {
        if (PAID_STATUSES.indexOf(o.order_status) !== -1) acc.push(o.order_sn);
      });
      more   = !!res.body.response.more;
      cursor = res.body.response.next_cursor || '';
      if (!cursor) more = false;
    }
    winFrom = winTo + 1;
  }
}

async function fetchOrderDetails(accessToken, shopId, orderSns, deadlineMs) {
  const BATCH = 50;
  const all = [];
  for (let i = 0; i < orderSns.length; i += BATCH) {
    if (Date.now() > deadlineMs) break;
    const batch = orderSns.slice(i, i + BATCH);
    const res = await shopeeGet('/api/v2/order/get_order_detail', {
      order_sn_list: batch.join(','),
      response_optional_fields: 'item_list,total_amount,create_time,update_time,order_status'
    }, accessToken, shopId);
    if (res.status === 200 && res.body.response && res.body.response.order_list) {
      all.push.apply(all, res.body.response.order_list);
    }
  }
  return all;
}

// Busca o detalhamento COMPLETO do Escrow (todas as linhas de taxa/dedução), não só o total somado.
async function fetchEscrowCompleto(accessToken, shopId, orderSns, deadlineMs) {
  const CONC = 25; // confirmado via diagnóstico: não tem rate-limit, o problema era volume real (até 190 pedidos/dia)
  const detalhes = {}; // order_sn -> objeto completo com todas as linhas
  function esperar(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
  for (let i = 0; i < orderSns.length; i += CONC) {
    if (Date.now() > deadlineMs) break;
    const lote = orderSns.slice(i, i + CONC);
    const resps = await Promise.all(lote.map(function(sn) {
      return shopeeGet('/api/v2/payment/get_escrow_detail', { order_sn: sn }, accessToken, shopId);
    }));
    resps.forEach(function(res, idx) {
      var sn = lote[idx];
      if (res.status !== 200 || !res.body.response) {
        detalhes.__falhas = detalhes.__falhas || [];
        if (detalhes.__falhas.length < 20) { // guarda só uma amostra, não precisa de tudo
          detalhes.__falhas.push({ status: res.status, erro: (res.body && (res.body.error || res.body.message)) || null });
        }
        return;
      }
      var inc = res.body.response.order_income || res.body.response;
      if (!inc) return;
      // seller_return_refund != 0 = dinheiro realmente revertido. Só ter return_order_sn_list
      // preenchido NÃO basta — isso só indica que existe um caso de devolução (pode ter sido
      // recusado, sem reembolso nenhum de verdade).
      var temReembolso = typeof inc.seller_return_refund === 'number' && inc.seller_return_refund !== 0;
      // Guarda todas as linhas numéricas relevantes de taxa/dedução que a Shopee devolver.
      // Usa net_commission_fee / net_service_fee (já descontando eventual rebate/desconto de
      // promoção de pagamento) em vez de commission_fee/service_fee brutos — o "net" é o que
      // realmente sai da conta do vendedor. Quando não tem rebate, os dois valores são iguais.
      var comissao   = (typeof inc.net_commission_fee === 'number') ? inc.net_commission_fee : (inc.commission_fee || 0);
      var servico     = (typeof inc.net_service_fee === 'number') ? inc.net_service_fee : (inc.service_fee || 0);
      var transacao   = inc.seller_transaction_fee || inc.transaction_fee || 0;
      detalhes[sn] = {
        comissao: comissao,
        servico: servico,
        transacao: transacao,
        total: comissao + servico + transacao,
        freteReal: (typeof inc.actual_shipping_fee === 'number') ? inc.actual_shipping_fee : null,
        freteRepassadoShopee: (typeof inc.shopee_shipping_rebate === 'number') ? inc.shopee_shipping_rebate : null,
        reembolsoDevolucao: (typeof inc.seller_return_refund === 'number') ? inc.seller_return_refund : null,
        valorLiquido: (typeof inc.escrow_amount === 'number') ? inc.escrow_amount : null,
        // Base de preço pra calcular a taxa esperada (20% + R$4, validado com pedidos reais) —
        // precisa ser DEPOIS do cupom/voucher do vendedor, não o preço com desconto de flash sale só.
        precoBaseTaxa: (typeof inc.order_discounted_price === 'number') ? inc.order_discounted_price : null,
        voucherVendedor: (typeof inc.voucher_from_seller === 'number') ? inc.voucher_from_seller : 0,
        temReembolso: temReembolso,
        valorReembolsado: (typeof inc.seller_return_refund === 'number') ? Math.abs(inc.seller_return_refund) : 0,
        // Detalhe por item — precisa pra aplicar o teto de R$100 (pré-março/2026) por ITEM,
        // não pelo pedido inteiro somado (confirmado: pedido com vários itens baratos não
        // aplica teto nenhum, mesmo somando mais de R$500 no total).
        itensDetalhe: Array.isArray(inc.items) ? inc.items.map(function(it) {
          // Base da comissão = original_price - seller_discount (é sobre esse valor que a Shopee
          // cobra a comissão). NÃO usar discounted_price direto: em alguns pedidos ele traz um
          // desconto extra embutido (ex: promoção em camadas) que NÃO reduz a base de comissão,
          // o que gerava divergência de ~14% do desconto extra. Confirmado com pedidos reais.
          var precoComissao = (typeof it.original_price === 'number' ? it.original_price : 0)
                            - (typeof it.seller_discount === 'number' ? it.seller_discount : 0);
          // Fallback de segurança: se por algum motivo não vier original_price/seller_discount,
          // cai no discounted_price (comportamento antigo) pra não zerar a base.
          if (!(precoComissao > 0) && typeof it.discounted_price === 'number') precoComissao = it.discounted_price;
          return {
            itemId: it.item_id ? String(it.item_id) : null,
            precoComDesconto: precoComissao,
            qty: it.quantity_purchased || 1,
            voucherItem: (typeof it.discount_from_voucher_seller === 'number') ? it.discount_from_voucher_seller : 0
          };
        }) : [],
        // Rebate que a Shopee devolve em cima da comissão/serviço quando o comprador usa certas
        // promoções de pagamento (Pix, parcelamento, etc.) — reduz o que realmente é cobrado,
        // então precisa ser descontado do cálculo de "esperado" também (senão gera divergência falsa).
        rebateTotal: (inc.seller_product_rebate && typeof inc.seller_product_rebate.amount === 'number') ? inc.seller_product_rebate.amount : 0,
        // Taxas "nomeadas" (ex: "Taxa de Serviço Afiliados do Vendedor", quando a venda vem de
        // um afiliado/criador de conteúdo) — são cobranças reais e condicionais, não previstas
        // pela fórmula por faixa de preço. Detecta pelo nome preenchido (as regras normais de
        // faixa de preço não têm rule_display_name).
        taxasNomeadas: (function() {
          var total = 0;
          var detalhe = [];
          (inc.net_commission_fee_info_list || []).concat(inc.net_service_fee_info_list || []).forEach(function(r) {
            if (r.rule_display_name) { total += (r.fee_amount || 0); detalhe.push({ nome: r.rule_display_name, valor: r.fee_amount || 0 }); }
          });
          return { total: total, detalhe: detalhe };
        })()
      };
    });
  }
  return detalhes;
}

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body inválido' }) };
  }
  const { access_token, shop_id, date_from, date_to, ids_conhecidos } = body;
  if (!access_token || !shop_id || !date_from || !date_to) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Campos obrigatórios ausentes (access_token, shop_id, date_from, date_to)' }) };
  }

  try {
    const fromMs = new Date(date_from + 'T00:00:00-03:00').getTime();
    const toMs   = new Date(date_to   + 'T23:59:59-03:00').getTime();
    if (isNaN(fromMs) || isNaN(toMs) || toMs < fromMs) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Período inválido' }) };
    }
    if ((toMs - fromMs) > 92 * DAY) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Período máximo de 90 dias por consulta' }) };
    }

    const _inicioFn = Date.now();
    const _deadlinePrincipal = _inicioFn + 35000;
    const _deadlineTotal     = _inicioFn + 52000;

    const sns = [];
    await fetchOrderSns(access_token, shop_id, fromMs, toMs, sns, _deadlinePrincipal);
    const orders = await fetchOrderDetails(access_token, shop_id, sns, _deadlinePrincipal);

    // Separa os que o Órbita já tem guardados e resolvidos (não busca escrow de novo pra eles)
    // dos que realmente precisam ser verificados — acelera muito buscas repetidas.
    const conhecidosSet = {};
    (ids_conhecidos || []).forEach(function(id) { conhecidosSet[String(id)] = true; });
    const ordersConhecidos = orders.filter(function(o) { return conhecidosSet[String(o.order_sn)]; });
    const ordersNovos = orders.filter(function(o) { return !conhecidosSet[String(o.order_sn)]; });

    const completedSns = ordersNovos.filter(function(o) { return o.order_status === 'COMPLETED'; }).map(function(o) { return o.order_sn; });
    const escrowPorPedido = (completedSns.length > 0 && Date.now() < _deadlineTotal)
      ? await fetchEscrowCompleto(access_token, shop_id, completedSns, _deadlineTotal)
      : {};
    const diagnosticoFalhas = escrowPorPedido.__falhas || [];
    delete escrowPorPedido.__falhas; // não deixa isso ser tratado como um pedido de verdade

    const pedidos = ordersNovos.map(function(order) {
      var itens = (order.item_list || []).map(function(item) {
        return {
          itemId: item.item_id ? String(item.item_id) : null,
          titulo: item.item_name || '',
          qty: item.model_quantity_purchased || 1,
          precoUnit: item.model_discounted_price || item.model_original_price || 0
        };
      });
      var escrow = escrowPorPedido[order.order_sn] || null;
      // Diferencia "ainda não concluído na Shopee" (aguardando de verdade) de "já está
      // concluído mas não deu tempo/falhou verificar o escrow" (não é o mesmo problema).
      var naoVerificado = (order.order_status === 'COMPLETED') && !escrow;
      return {
        orderId: order.order_sn,
        data: order.create_time ? new Date(order.create_time * 1000).toISOString() : null,
        status: order.order_status,
        valorTotal: order.total_amount || 0,
        temReal: !!escrow,
        naoVerificado: naoVerificado,
        escrow: escrow, // null se pedido ainda não completou (aguardando liquidação)
        // A Shopee não expõe uma "data de liberação" separada — usamos update_time do pedido
        // quando o status já é COMPLETED, que é quando o dinheiro é liberado (confirmado antes).
        // Ajusta pro fuso de Brasília (UTC-3) antes de extrair a data — senão um pedido concluído
        // às 22h-23h59 no Brasil aparece como o dia seguinte (já é a madrugada em UTC).
        dataLiberacao: (order.order_status === 'COMPLETED' && order.update_time)
          ? new Date((order.update_time - 3 * 3600) * 1000).toISOString() : null,
        itens: itens
      };
    });

    // Pedidos já conhecidos (guardados e resolvidos antes) — só um marcador, o navegador já tem
    // o resto do dado guardado e usa ele direto.
    const pedidosConhecidos = ordersConhecidos.map(function(o) { return { orderId: o.order_sn, jaConhecido: true }; });

    const pedidosNaoVerificados = pedidos.filter(function(p) { return p.naoVerificado; }).length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mp: 'SH',
        periodo: { from: date_from, to: date_to },
        totalPedidos: pedidos.length + pedidosConhecidos.length,
        pedidosCompletados: completedSns.length,
        pedidosNaoVerificados: pedidosNaoVerificados,
        diagnosticoFalhas: diagnosticoFalhas,
        parcial: pedidosNaoVerificados > 0,
        pedidos: pedidos.concat(pedidosConhecidos)
      })
    };
  } catch(err) {
    console.error('Erro:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
