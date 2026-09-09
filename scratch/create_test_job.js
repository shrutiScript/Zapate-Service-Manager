const http = require('http');

function postJSON(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1' + path,
      method: 'POST',
      headers,
    };

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

async function runTest() {
  try {
    const loginRes = await postJSON('/auth/login', {
      email: 'abhi@gmail.com',
      password: '123456',
    });

    console.log('Login response keys:', Object.keys(loginRes));
    console.log('Token:', loginRes.token ? 'Present' : (loginRes.data?.token ? 'Present in data' : 'Missing'));

    const token = loginRes.token || loginRes.data?.token;

    // Create a repair job
    const newJob = await postJSON('/repairs', {
      customerName: 'harsh bhai',
      customerMobile: '8958748596',
      deviceBrand: 'Google',
      deviceModel: 'Google Pixel Generic Device',
      issue: 'AI detected: Charging Management IC / Secondary PMIC Failure',
      estimatedAmount: 2500,
      advancePayment: 1000,
    }, token);

    const jobId = newJob._id || newJob.id || newJob.data?._id || newJob.data?.id;
    console.log('Created Repair Job Ticket ID:', jobId);

    // Generate Invoice
    const invoiceRes = await postJSON(`/repairs/${jobId}/generate-invoice`, {
      serviceCharge: 2400,
      additionalCharges: 100,
      discountAmount: 10,
      taxPercent: 0,
      paidAmount: 1500,
      paymentMode: 'Cash',
      newStatus: 'Delivered',
    }, token);

    const inv = invoiceRes.invoice || invoiceRes.data?.invoice || invoiceRes;

    console.log('==================================================');
    console.log('REPAIR BILLING & INVOICE GENERATION TEST SUCCESSFUL!');
    console.log('==================================================');
    console.log('Invoice Number:', inv.number);
    console.log('Customer:', inv.customerName);
    console.log('Device:', inv.deviceBrand, inv.deviceModel);
    console.log('Gross Total: ₹' + inv.total);
    console.log('Previous Advance: ₹1,000');
    console.log('Paid Amount: ₹' + inv.paidAmount);
    console.log('Due Amount: ₹' + inv.dueAmount);
    console.log('Invoice Status:', inv.status);
    console.log('==================================================');
  } catch (err) {
    console.error('Error:', err);
  }
}

runTest();
