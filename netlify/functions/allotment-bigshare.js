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
      Company: String(companyId).trim(),
      SelectionType: 'PN',
      PanNo: pan.toUpperCase().trim(),
      Applicationno: '',
      txtcsdl: '',
      txtDPID: '',
      txtClId: '',
      ddlType: '0',
      lang: 'en'
    };

    // Standard browser headers to bypass Cloudflare bot filtering
    const reqHeaders = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Origin': 'https://ipo1.bigshareonline.com',
      'Referer': 'https://ipo1.bigshareonline.com/ipo_status.html',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // Server fallback list (Server 1 -> Server 2 -> Main Server)
    const servers = [
      'https://ipo1.bigshareonline.com/Data.aspx/FetchIpodetails',
      'https://ipo2.bigshareonline.com/Data.aspx/FetchIpodetails',
      'https://ipo.bigshareonline.com/Data.aspx/FetchIpodetails'
    ];

    let resultJson = null;
    let lastError = null;

    for (const url of servers) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify(payload),
          timeout: 7000
        });

        if (response.ok) {
          const raw = await response.json();
          let parsedData = raw.d;
          if (typeof parsedData === 'string') {
            parsedData = JSON.parse(parsedData);
          }
          resultJson = parsedData;
          break; // Stop loop if successful
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!resultJson) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: 'No response from Bigshare servers', details: lastError?.message })
      };
    }

    // Standardize Table output for the frontend
    const table = resultJson.Table || [];
    if (Array.isArray(table) && table.length > 0) {
      const rec = table[0];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          Name: rec.NAME1 || rec.Name1 || '',
          Company: rec.companyname || rec.Companyname || '',
          SharesApplied: rec.SHARES || rec.Shares || '0',
          Allotted: rec.ALLOT || rec.Allot || '0',
          AppNo: rec.APPNO || rec.Appno || ''
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: 'No records found' })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};