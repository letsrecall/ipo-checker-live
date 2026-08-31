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
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'PAN and companyId are required' }) 
      };
    }

    const payload = {
      Company: String(companyId).trim(),
      SelectionType: 'PN',
      PanNo: String(pan).toUpperCase().trim(),
      Applicationno: '',
      txtcsdl: '',
      txtDPID: '',
      txtClId: '',
      ddlType: '0',
      lang: 'en'
    };

    const reqHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Origin': 'https://ipo1.bigshareonline.com',
      'Referer': 'https://ipo1.bigshareonline.com/ipo_status.html'
    };

    const endpoints = [
      'https://ipo1.bigshareonline.com/Data.aspx/FetchIpodetails',
      'https://ipo2.bigshareonline.com/Data.aspx/FetchIpodetails',
      'https://ipo.bigshareonline.com/Data.aspx/FetchIpodetails'
    ];

    let rawData = null;

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify(payload),
          timeout: 6000
        });

        if (response.ok) {
          const json = await response.json();
          if (json && json.d) {
            rawData = json.d;
            break;
          }
        }
      } catch (e) {
        // Try next endpoint on error
      }
    }

    if (!rawData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: 'No data returned from Bigshare servers' })
      };
    }

    // Parse JSON string inside .d if stringified
    let parsed = rawData;
    if (typeof rawData === 'string') {
      try {
        parsed = JSON.parse(rawData);
      } catch (e) {
        parsed = null;
      }
    }

    // Extract table records across all known Bigshare formats
    let records = [];
    if (Array.isArray(parsed)) {
      records = parsed;
    } else if (parsed && Array.isArray(parsed.Table)) {
      records = parsed.Table;
    } else if (parsed && Array.isArray(parsed.Table1)) {
      records = parsed.Table1;
    }

    if (records.length > 0) {
      const rec = records[0];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          Name: rec.NAME1 || rec.Name1 || rec.name1 || '',
          Company: rec.companyname || rec.Companyname || '',
          SharesApplied: rec.SHARES || rec.Shares || rec.shares || '0',
          Allotted: rec.ALLOT || rec.Allot || rec.allot || '0',
          AppNo: rec.APPNO || rec.Appno || ''
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: 'No application record found' })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};