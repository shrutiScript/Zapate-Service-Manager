const http = require('http');

function postJSON(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({ status: res.statusCode, body: parsed });
          }
        } catch (e) {
          resolve(responseBody);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

function getJSON(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1' + path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve(parsed);
        } catch (e) {
          resolve(responseBody);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function testInvoiceGeneration() {
  try {
    const loginRes = await postJSON('/auth/login', {
      email: 'abhi@gmail.com',
      password: '123456',
    });

    const token = loginRes.token;
    console.log('Login successful for abhi@gmail.com');

    const repairs = await getJSON('/repairs', token);

    if (!Array.isArray(repairs) || repairs.length === 0) {
      console.log('No repair jobs found to test');
      return;
    }

    const job = repairs[0];
    console.log(`Testing invoice generation for repair job ${job.number || job.jobNo} (ID: ${job._id})`);

    const invoiceRes = await postJSON(
      `/repairs/${job._id}/generate-invoice`,
      {
        serviceCharge: 2400,
        additionalCharges: 100,
        discountAmount: 10,
        taxPercent: 0,
        paidAmount: 1500,
        paymentMode: 'Cash',
        newStatus: 'Delivered',
      },
      token
    );

    console.log('--------------------------------------------------');
    console.log('INVOICE GENERATED SUCCESSFULLY! DETAILS:');
    console.log('Invoice Number:', invoiceRes.invoice.number);
    console.log('Customer Name:', invoiceRes.invoice.customerName);
    console.log('Device Brand/Model:', invoiceRes.invoice.deviceBrand, invoiceRes.invoice.deviceModel);
    console.log('Total Amount: ₹' + invoiceRes.invoice.total);
    console.log('Paid Amount: ₹' + invoiceRes.invoice.paidAmount);
    console.log('Due Amount: ₹' + invoiceRes.invoice.dueAmount);
    console.log('Invoice Status:', invoiceRes.invoice.status);
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('Invoice generation failed:', error);
  }
}

testInvoiceGeneration();
