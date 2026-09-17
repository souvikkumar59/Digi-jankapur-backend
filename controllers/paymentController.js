const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Document = require('../models/Document');
const User = require('../models/User'); // 💡 1. ADDED THIS IMPORT TO ACCESS USER SCHEMAS

// Initialize the Razorpay instance with our secure cloud credentials
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Initialize a premium transaction order session
// @route   POST /api/payments/checkout
// @access  Private
const checkout = async (req, res) => {
  try {
    const { purchaseType, documentItemId } = req.body;
    let amount = 0;

    // 1. Determine pricing logic based on purchase types
    if (purchaseType === 'document') {
      const doc = await Document.findById(documentItemId);
      if (!doc) return res.status(404).json({ success: false, message: 'Document resource not found' });
      amount = doc.price;
    } else if (purchaseType === 'profile_spotlight') {
      amount = 1; // Flat price: ₹20 for spotlighting
    } else if (purchaseType === 'profile_viewer_unlock') {
      amount = 1; // Flat price: ₹29 to see who viewed their profile
    }

    // 2. Razorpay processes amounts strictly in PAISE (1 INR = 100 Paise)
    const options = {
      amount: amount * 100, 
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    // 3. Generate the digital transaction token from Razorpay's server cloud
    const razorpayOrder = await razorpayInstance.orders.create(options);

    // 4. Record the transaction trace as 'pending' inside our MongoDB cloud database
    await Order.create({
      buyer: req.user.id,
      purchaseType,
      documentItem: purchaseType === 'document' ? documentItemId : null,
      amount: amount,
      razorpayOrderId: razorpayOrder.id,
      status: 'pending'
    });

    // 5. Send order configurations back to frontend to activate payment popup
    res.status(201).json({
      success: true,
      order: razorpayOrder
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Checkout Session Failure: ' + error.message });
  }
};

// @desc    Verify the cryptographic signature returned by the gateway after UPI checkout
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1. Generate an internal matching signature using the crypto hashing library to prevent payment fraud
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // 2. Check if the generated hash matches the signature returned by the gateway
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // 3. Find our database order matching this session ID and flip its status flag to completed
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'completed', razorpayPaymentId: razorpay_payment_id },
        { new: true }
      );

      // If a document was purchased, increment its counter metrics automatically
      if (order && order.purchaseType === 'document') {
        await Document.findByIdAndUpdate(order.documentItem, { $inc: { downloadCount: 1 } });
      }

      // 💡 2. INTEGRATED UNLOCK LOGIC LAYER:
      // If the signature matches and the item purchased is a profile unlock,
      // we locate the buyer user record and set 'isAnalyticsUnlocked' to true inside MongoDB Cloud!
      if (order && order.purchaseType === 'profile_viewer_unlock') {
        await User.findByIdAndUpdate(req.user.id, { isAnalyticsUnlocked: true });
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified and transaction completed successfully!'
      });
    } else {
      res.status(400).json({ success: false, message: 'Payment validation failed. Transaction hash compromise detected.' });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification Server Error: ' + error.message });
  }
};

module.exports = { checkout, verifyPayment };
