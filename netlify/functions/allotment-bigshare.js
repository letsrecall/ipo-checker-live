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

    var url = "https://ipo1.bigshareonline.com/Data.aspx/FetchIpodetails";

    var payload = {
      Applicationno: "",
      Company: String(companyId).trim(),
      SelectionType: "PN",
      PanNo: String(pan).toUpperCase().trim(),
      txtcsdl: "",
      txtDPID: "",
      txtClId: "",
      ddlType: "0",
      lang: "en"
    };

    var response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    var result = await response.text();

    // Bigshare returns JSON string, so just forward it directly
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: result
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};