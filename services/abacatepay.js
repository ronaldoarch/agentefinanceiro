const axios = require('axios');

// Configuração da API AbacatePay
const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v1';
const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;

/**
 * Criar QR Code PIX no AbacatePay
 * Documentação: https://docs.abacatepay.com
 * 
 * @param {Object} params - Parâmetros da cobrança
 * @param {number} params.amount - Valor em centavos (ex: 3990 = R$ 39,90)
 * @param {string} params.description - Descrição do pagamento
 * @param {string} params.paymentId - ID interno do pagamento
 * @param {string} params.customerName - Nome do cliente
 * @param {string} params.customerEmail - Email do cliente
 * @param {string} params.customerCellphone - Celular do cliente
 * @param {string} params.customerTaxId - CPF/CNPJ do cliente
 * @returns {Object} Dados da cobrança (QR Code, PIX Copia e Cola, etc)
 */
async function createPixCharge(params) {
  try {
    console.log('💳 Criando QR Code PIX no AbacatePay...');
    console.log('   Valor: R$', (params.amount / 100).toFixed(2));
    console.log('   Descrição:', params.description);

    if (!ABACATEPAY_API_KEY) {
      throw new Error('ABACATEPAY_API_KEY não configurada nas variáveis de ambiente');
    }

    // Baseado na documentação do AbacatePay
    const response = await axios.post(
      `${ABACATEPAY_API_URL}/billing/create`,
      {
        frequency: 'ONE_TIME', // Pagamento único
        methods: ['PIX'], // Apenas PIX
        products: [
          {
            externalId: params.paymentId,
            name: params.description,
            description: params.description,
            quantity: 1,
            price: params.amount // Valor em centavos
          }
        ],
        customer: {
          name: params.customerName,
          email: params.customerEmail,
          cellphone: params.customerCellphone || '',
          taxId: params.customerTaxId || ''
        },
        returnUrl: params.returnUrl || process.env.APP_URL,
        completionUrl: params.completionUrl || `${process.env.APP_URL}/payment/success`
      },
      {
        headers: {
          'Authorization': `Bearer ${ABACATEPAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ QR Code PIX criado com sucesso!');
    console.log('   Billing ID:', response.data.id);

    return {
      success: true,
      billingId: response.data.id,
      url: response.data.url, // URL da página de pagamento
      qrCode: response.data.metadata?.qrCode, // QR Code se disponível
      pixCopiaECola: response.data.metadata?.pixCopyPaste,
      status: response.data.status,
      amount: params.amount,
      expiresAt: response.data.expiresAt
    };

  } catch (error) {
    console.error('❌ Erro ao criar QR Code PIX:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Erro:', error.response.data?.error);
    }

    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

/**
 * Verificar status de uma cobrança
 * @param {string} billingId - ID da cobrança no AbacatePay
 * @returns {Object} Status da cobrança
 */
async function getChargeStatus(billingId) {
  try {
    console.log('🔍 Verificando status da cobrança:', billingId);

    const response = await axios.get(
      `${ABACATEPAY_API_URL}/billing/${billingId}`,
      {
        headers: {
          'Authorization': `Bearer ${ABACATEPAY_API_KEY}`
        }
      }
    );

    const billing = response.data;

    return {
      success: true,
      status: billing.status, // PENDING, PAID, EXPIRED, CANCELLED
      paidAt: billing.paidAt,
      amount: billing.amount,
      expiresAt: billing.expiresAt
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
 * Validar webhook do AbacatePay
 * Documentação: https://docs.abacatepay.com/pages/webhooks
 * 
 * @param {Object} payload - Dados do webhook
 * @param {string} signature - Assinatura do webhook no header
 * @returns {boolean} Se o webhook é válido
 */
function validateWebhook(payload, signature) {
  try {
    const crypto = require('crypto');
    
    // AbacatePay usa HMAC SHA256 para assinar webhooks
    const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    
    if (!secret) {
      console.warn('⚠️ ABACATEPAY_WEBHOOK_SECRET não configurado');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const isValid = signature === expectedSignature;
    
    if (!isValid) {
      console.error('❌ Assinatura do webhook inválida');
    }

    return isValid;

  } catch (error) {
    console.error('❌ Erro ao validar webhook:', error.message);
    return false;
  }
}

/**
 * Processar webhook de pagamento do AbacatePay
 * @param {Object} webhookData - Dados do webhook
 * @returns {Object} Informações do pagamento processado
 */
async function processWebhook(webhookData) {
  try {
    console.log('📥 Processando webhook do AbacatePay...');
    console.log('   Event:', webhookData.event);
    console.log('   Billing ID:', webhookData.id);
    
    // Eventos possíveis: billing.paid, billing.expired, billing.cancelled
    if (webhookData.event === 'billing.paid') {
      console.log('✅ Pagamento confirmado!');
      
      // Extrair external_id do produto
      const externalId = webhookData.products?.[0]?.externalId;

      return {
        success: true,
        event: 'paid',
        paymentId: externalId, // ID interno do nosso sistema
        billingId: webhookData.id,
        amount: webhookData.amount,
        paidAt: webhookData.paidAt,
        status: 'paid'
      };
    }

    if (webhookData.event === 'billing.expired') {
      console.log('⏰ Cobrança expirada');
      
      return {
        success: true,
        event: 'expired',
        billingId: webhookData.id,
        status: 'expired'
      };
    }

    console.log('ℹ️ Evento não tratado:', webhookData.event);
    
    return {
      success: false,
      event: webhookData.event,
      message: `Evento ${webhookData.event} não requer ação`
    };

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Criar cliente no AbacatePay
 * @param {Object} customerData - Dados do cliente
 * @returns {Object} ID do cliente criado
 */
async function createCustomer(customerData) {
  try {
    console.log('👤 Criando cliente no AbacatePay...');

    const response = await axios.post(
      `${ABACATEPAY_API_URL}/customer/create`,
      {
        name: customerData.name,
        cellphone: customerData.cellphone,
        email: customerData.email,
        taxId: customerData.taxId
      },
      {
        headers: {
          'Authorization': `Bearer ${ABACATEPAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Cliente criado:', response.data.data.id);

    return {
      success: true,
      customerId: response.data.data.id,
      metadata: response.data.data.metadata
    };

  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error.message);
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
  processWebhook,
  createCustomer
};

