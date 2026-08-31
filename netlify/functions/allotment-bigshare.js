const fetch = require('node-fetch');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { pan, companyId } = JSON.parse(event.body || '{}');
    if (!pan || !companyId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'PAN and companyId are required' }) };
    }

    const payload = {
      Applicationno: '',
      Company: companyId,
      SelectionType: 'PN',
      PanNo: pan.toUpperCase().trim(),
      txtcsdl: '',
      txtDPID: '',
      txtClId: '',
      ddlType: '0',
      lang: 'en'
    };

    const response = await fetch('https://ipo1.bigshareonline.com/Data.aspx/FetchIpodetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

function a(){

}

