// Netlify Function — busca anúncios/produtos da Shopee (paginado, um status por vez)

const crypto = require('crypto');
const https  = require('https');

// ── Credenciais do app (SANDBOX/TEST) ──────────────────────
const PARTNER_ID  = 2038223;
const PARTNER_KEY = 'shpk6d66626a686b586749656357526e5a584963786a666752464f6c7147485a';
const HOST         = 'partner.shopeemobile.com'; // produção (Live)

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
        catch(e) { resolve({ status: res.statusCode, body: { error: 'parse_error', raw: data.substring(0,200) } }); }
      });
    });
    req.on('timeout', function() { req.destroy(); resolve({ status: 0, body: { error: 'timeout' } }); });
    req.on('error', function(e) { resolve({ status: 0, body: { error: e.message } }); });
    req.end();
  });
}

// Estimativa de comissão da Shopee por faixa de preço (mesma regra usada na calculadora)
function getFee(price) {
  if (price < 80)  return 20;
  if (price < 100) return 14;
  if (price < 200) return 14;
  return 14;
}
function getFixo(price) {
  if (price < 80)  return 4;
  if (price < 100) return 16;
  if (price < 200) return 20;
  return 26;
}

// Monta o nome da variação a partir do tier_variation do item + tier_index do modelo
// Ex: tier_variation=[{name:'Cor',option_list:[{option:'Azul'},{option:'Vermelho'}]}, {name:'Tamanho',option_list:[{option:'P'},{option:'M'}]}]
//     tier_index=[1,0] -> "Cor: Vermelho, Tamanho: P"
function nomeDaVariacao(tierVariation, tierIndex) {
  if (!Array.isArray(tierVariation) || !Array.isArray(tierIndex)) return '';
  var partes = [];
  tierIndex.forEach(function(idx, i) {
    var grupo = tierVariation[i];
    if (!grupo || !grupo.option_list || !grupo.option_list[idx]) return;
    partes.push(grupo.option_list[idx].option);
  });
  return partes.join(', ');
}

// Busca os modelos (variações) de um item que tem tier_variation não vazio
async function getModelList(itemId, accessToken, shopId) {
  const res = await shopeeGet('/api/v2/product/get_model_list', { item_id: itemId }, accessToken, shopId);
  if (res.status !== 200 || !res.body.response) return null;
  return res.body.response;
}

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  const { access_token, shop_id, offset = 0, status = 'NORMAL' } = body;
  if (!access_token || !shop_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Campos obrigatórios ausentes' }) };
  }

  try {
    const PAGE_SIZE = 50;

    const listRes = await shopeeGet('/api/v2/product/get_item_list', {
      offset:      offset,
      page_size:   PAGE_SIZE,
      item_status: status
    }, access_token, shop_id);

    if (listRes.status !== 200 || listRes.body.error) {
      console.log('Erro get_item_list:', JSON.stringify(listRes.body).substring(0,300));
      return { statusCode: 200, headers, body: JSON.stringify({ items: [], hasMore: false, error: listRes.body.message || listRes.body.error }) };
    }

    const list = listRes.body.response && listRes.body.response.item || [];
    const hasNextPage = listRes.body.response ? !!listRes.body.response.has_next_page : false;
    const nextOffset   = listRes.body.response ? listRes.body.response.next_offset : 0;

    if (list.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ items: [], hasMore: false }) };
    }

    const itemIds = list.map(function(i) { return i.item_id; });

    const detailRes = await shopeeGet('/api/v2/product/get_item_base_info', {
      item_id_list: itemIds.join(','),
      need_tax_info: 'false',
      need_complaint_policy: 'false'
    }, access_token, shop_id);

    if (detailRes.status !== 200 || detailRes.body.error) {
      console.log('Erro get_item_base_info:', JSON.stringify(detailRes.body).substring(0,300));
      return { statusCode: 200, headers, body: JSON.stringify({ items: [], hasMore: hasNextPage, nextOffset: nextOffset }) };
    }

    const details = (detailRes.body.response && detailRes.body.response.item_list) || [];

    var statusMap = { NORMAL: 'Ativo', UNLIST: 'Pausado', BANNED: 'Encerrado', REVIEWING: 'Em revisão' };

    // Processa os itens em lotes pequenos (concorrência limitada) pra não sobrecarregar
    // a API quando muitos itens têm variação (cada um precisa de uma chamada extra).
    const CONC = 5;
    var items = [];
    for (let i = 0; i < details.length; i += CONC) {
      const lote = details.slice(i, i + CONC);
      const resultadosLote = await Promise.all(lote.map(async function(d) {
        // Busca sempre os modelos — mais confiável do que tentar adivinhar se tem variação
        // só pelo que vem no get_item_base_info (esse campo nem sempre vem preenchido).
        var modelData = await getModelList(d.item_id, access_token, shop_id);
        var modelos = (modelData && modelData.model) || [];

        if (modelos.length === 0) {
          // Sem modelos — item simples, usa os dados do próprio item
          var price = 0;
          if (Array.isArray(d.price_info) && d.price_info.length > 0) {
            price = d.price_info[0].original_price || d.price_info[0].current_price || 0;
          }
          var stock = 0;
          if (d.stock_info_v2 && d.stock_info_v2.summary_info) {
            stock = d.stock_info_v2.summary_info.total_available_stock || 0;
          }
          return [{
            name:     d.item_name || '',
            sku:      d.item_sku || '',
            adId:     String(d.item_id),
            mp:       'SH',
            price:    price,
            fee:      getFee(price),
            freight:  0,
            cost:     null,
            tax:      null,
            extra:    getFixo(price),
            stock:    stock,
            status:   statusMap[status] || status,
            link:     'https://shopee.com.br/product/' + shop_id + '/' + d.item_id,
            category: d.category_id ? String(d.category_id) : '',
            listing:  ''
          }];
        }

        if (modelos.length === 1 && !modelos[0].tier_index) {
          // Só 1 "modelo" e sem variação de verdade (item comum registrado como modelo único)
          var m0 = modelos[0];
          var price0 = 0;
          if (Array.isArray(m0.price_info) && m0.price_info.length > 0) {
            price0 = m0.price_info[0].original_price || m0.price_info[0].current_price || 0;
          }
          var stock0 = 0;
          if (m0.stock_info_v2 && m0.stock_info_v2.summary_info) {
            stock0 = m0.stock_info_v2.summary_info.total_available_stock || 0;
          }
          return [{
            name:     d.item_name || '',
            sku:      m0.model_sku || d.item_sku || '',
            adId:     String(d.item_id),
            mp:       'SH',
            price:    price0,
            fee:      getFee(price0),
            freight:  0,
            cost:     null,
            tax:      null,
            extra:    getFixo(price0),
            stock:    stock0,
            status:   statusMap[status] || status,
            link:     'https://shopee.com.br/product/' + shop_id + '/' + d.item_id,
            category: d.category_id ? String(d.category_id) : '',
            listing:  ''
          }];
        }

        // Item com variação de verdade — um anúncio por variação
        var tierVariation = (modelData && modelData.tier_variation) || d.tier_variation || [];
        return modelos.map(function(m) {
          var price = 0;
          if (Array.isArray(m.price_info) && m.price_info.length > 0) {
            price = m.price_info[0].original_price || m.price_info[0].current_price || 0;
          }
          var stock = 0;
          if (m.stock_info_v2 && m.stock_info_v2.summary_info) {
            stock = m.stock_info_v2.summary_info.total_available_stock || 0;
          }
          var nomeVariacao = nomeDaVariacao(tierVariation, m.tier_index);
          return {
            name:     d.item_name + (nomeVariacao ? ' — ' + nomeVariacao : ''),
            sku:      m.model_sku || d.item_sku || '',
            adId:     String(d.item_id) + '_' + String(m.model_id),
            mp:       'SH',
            price:    price,
            fee:      getFee(price),
            freight:  0,
            cost:     null,
            tax:      null,
            extra:    getFixo(price),
            stock:    stock,
            status:   statusMap[status] || status,
            link:     'https://shopee.com.br/product/' + shop_id + '/' + d.item_id,
            category: d.category_id ? String(d.category_id) : '',
            listing:  ''
          };
        });
      }));
      resultadosLote.forEach(function(arr) { items = items.concat(arr); });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ items: items, hasMore: hasNextPage, nextOffset: nextOffset })
    };

  } catch(err) {
    console.error('Erro shopee-items:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
