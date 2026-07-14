// Test the entire create-order flow
require('dotenv').config({ path: './.env' });
const Razorpay = require('razorpay');

async function testRazorpay() {
  console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 10) + '...' : 'MISSING');
  console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '***set***' : 'MISSING');

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('ERROR: Razorpay keys are missing from environment!');
    return;
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount: 79900, // 1 student
      currency: 'INR',
      receipt: `sub_test_${Date.now()}`,
      notes: {
        startup_id: 'test-startup-id',
        student_count: '1',
        domain_info: 'Engineering',
      },
    });
    console.log('SUCCESS: Razorpay order created:', order.id);
  } catch (err) {
    console.error('ERROR creating Razorpay order:', err.message);
    console.error('Error details:', JSON.stringify(err.error || err, null, 2));
  }
}

testRazorpay();
