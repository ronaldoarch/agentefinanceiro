const axios = require('axios');

// Configuração da API AbcatePay
const ABCATEPAY_API_URL = process.env.ABCATEPAY_API_URL || 'https://api.abcatepay.com';
const ABCATEPAY_API_KEY = process.env.ABCATEPAY_API_KEY;
const ABCATEPAY_WEBHOOK_SECRET = process.env.ABCATEPAY_WEBHOOK_SECRET;

/**
 * Criar cobrança PIX no AbcatePay
 * @param {Object} params - Parâmetros da cobrança
 * @param {number} params.amount - Valor em reais (ex: 39.90)
 * @param {string} params.description - Descrição do pagamento
 * @param {string} params.paymentId - ID interno do pagamento
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerEmail - Email do cliente
 * @returns {Object} Dados da cobrança (QR Code, PIX Copia e Cola, etc)
 */
async function createPixCharge(params) {
  try {
    console.log('💳 Criando cobrança PIX no AbcatePay...');
    console.log('   Valor: R$', params.amount);
    console.log('   Descrição:', params.description);

    if (!ABCATEPAY_API_KEY) {
      throw new Error('ABCATEPAY_API_KEY não configurada');
    }

    // AJUSTE ESTE ENDPOINT DE ACORDO COM A DOCUMENTAÇÃO DO ABCATEPAY
    const response = await axios.post(
      `${ABCATEPAY_API_URL}/v1/pix/charge`,
      {
        amount: params.amount,
        description: params.description,
        external_id: params.paymentId,
        customer: {
          name: params.customerName,
          email: params.customerEmail
        },
        // Adicione outros campos conforme documentação
      },
      {
        headers: {
          'Authorization': `Bearer ${ABCATEPAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Cobrança PIX criada com sucesso!');
    console.log('   Charge ID:', response.data.id);

    return {
      success: true,
      chargeId: response.data.id,
      qrCode: response.data.qr_code, // Base64 ou URL da imagem
      pixCopiaECola: response.data.pix_copy_paste || response.data.qr_code_text,
      expiresAt: response.data.expires_at,
      status: response.data.status
    };

  } catch (error) {
    console.error('❌ Erro ao criar cobrança PIX:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }

    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

/**
 * Verificar status de uma cobrança PIX
 * @param {string} chargeId - ID da cobrança no AbcatePay
 * @returns {Object} Status da cobrança
 */
async function getChargeStatus(chargeId) {
  try {
    console.log('🔍 Verificando status da cobrança:', chargeId);

    const response = await axios.get(
      `${ABCATEPAY_API_URL}/v1/pix/charge/${chargeId}`,
      {
        headers: {
          'Authorization': `Bearer ${ABCATEPAY_API_KEY}`
        }
      }
    );

    return {
      success: true,
      status: response.data.status, // pending, paid, expired, cancelled
      paidAt: response.data.paid_at,
      amount: response.data.amount
    };

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validar webhook do AbcatePay
 * @param {Object} payload - Dados do webhook
 * @param {string} signature - Assinatura do webhook
 * @returns {boolean} Se o webhook é válido
 */
function validateWebhook(payload, signature) {
  try {
    // IMPLEMENTAR VALIDAÇÃO DE ACORDO COM DOCUMENTAÇÃO DO ABCATEPAY
    // Geralmente usa HMAC SHA256
    
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', ABCATEPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expectedSignature;

  } catch (error) {
    console.error('❌ Erro ao validar webhook:', error.message);
    return false;
  }
}

/**
 * Processar webhook de pagamento
 * @param {Object} webhookData - Dados do webhook
 * @returns {Object} Informações do pagamento processado
 */
async function processWebhook(webhookData) {
  try {
    console.log('📥 Processando webhook do AbcatePay...');
    
    // AJUSTAR DE ACORDO COM FORMATO DO WEBHOOK
    const {
      id,
      status,
      external_id: paymentId,
      amount,
      paid_at
    } = webhookData;

    if (status === 'paid' || status === 'completed') {
      console.log('✅ Pagamento confirmado!');
      console.log('   Payment ID:', paymentId);
      console.log('   Valor:', amount);

      return {
        success: true,
        paymentId: paymentId,
        status: 'paid',
        amount: amount,
        paidAt: paid_at
      };
    }

    return {
      success: false,
      status: status,
      message: `Status: ${status}`
    };

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createPixCharge,
  getChargeStatus,
  validateWebhook,
  processWebhook
};

