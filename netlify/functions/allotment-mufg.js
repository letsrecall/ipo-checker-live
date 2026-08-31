const fetch = require('node-fetch');
const xml2js = require('xml2js');

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
    const { pan, clientid } = JSON.parse(event.body || '{}');
    if (!pan || !clientid) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'PAN and clientid are required' }) };
    }

    const payload = {
      clientid: clientid,
      PAN: pan.toUpperCase().trim(),
      IFSC: '',
      CHKVAL: '1',
      token: 'efZcvQ=='
    };

    const response = await fetch('https://in.mpms.mufg.com/Initial_Offer/IPO.aspx/SearchOnPan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const raw = await response.json();
    const xmlStr = raw.d;

    if (!xmlStr) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'No data found' }) };
    }

    const parser = new xml2js.Parser({ explicitArray: false });
    return new Promise((resolve) => {
      parser.parseString(xmlStr, (err, result) => {
        if (err || !result?.NewDataSet?.Table) {
          resolve({
            statusCode: 200,
            headers,
            body: JSON.stringify({ error: 'No records found' })
          });
          return;
        }

        const table = result.NewDataSet.Table;
        resolve({
          statusCode: 200,
          headers,
          body: JSON.stringify({
            Name: table.NAME1,
            Company: table.companyname,
            SharesApplied: table.SHARES,
            Allotted: table.ALLOT,
            RefundAmount: table.RFNDAMT,
            DpIdClientId: table.DPCLITID
          })
        });
      });
    });
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
