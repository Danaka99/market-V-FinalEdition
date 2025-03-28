// Function to send email
function orderConfirmationTemplate(order) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
          }
          .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 1px solid #eee;
          }
          .order-info {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 5px;
          }
          .shipping-info, .payment-info {
              margin: 20px 0;
          }
          .product-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
          }
          .product-table th, .product-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
          }
          .product-table th {
              background-color: #f2f2f2;
          }
          .product-img {
              max-width: 80px;
              height: auto;
          }
          .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              font-size: 14px;
              color: #777;
          }
          .next-steps {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
          }
          .total {
              font-weight: bold;
              text-align: right;
              margin: 15px 0;
          }
      </style>
  </head>
  <body>
      <div class="header">
          <h1>Order Confirmation</h1>
          <p>Thank You for Your Purchase!</p>
      </div>
      
      <p>Dear ${order.name},</p>
      
      <p>Thank you for shopping with us! We're delighted to confirm that we've received your order and it's being processed.</p>
      
      <div class="order-info">
          <p><strong>Order Date:</strong> ${order.date}</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
      </div>
      
      <div class="shipping-info">
          <h2>Shipping Address:</h2>
          <p>
              ${order.name}<br>
              ${order.address}<br>
              Pincode: ${order.pincode}<br>
              Phone: ${order.phoneNumber}
          </p>
      </div>
      
      <div class="payment-info">
          <h2>Payment Information:</h2>
          <p><strong>Amount:</strong> Rs. ${order.amount}</p>
          <p><strong>Payment ID:</strong> ${order.paymentId}</p>
      </div>
      
      <h2>Ordered Items:</h2>
      <table class="product-table">
          <thead>
              <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Subtotal</th>
              </tr>
          </thead>
          <tbody>
              ${order.products
                .map(
                  (product) => `
              <tr>
                  <td><img src="${product.image}" alt="${product.productTitle}" class="product-img"></td>
                  <td>${product.productTitle}</td>
                  <td>${product.quantity}</td>
                  <td>Rs. ${product.price}</td>
                  <td>Rs. ${product.subTotal}</td>
              </tr>
              `
                )
                .join("")}
          </tbody>
      </table>
      
      <p class="total">Order Total: Rs. ${order.amount}</p>
      
      <div class="next-steps">
          <h2>What's Next?</h2>
          <ol>
              <li>You'll receive tracking details once your order is on its way.</li>
              <li>Expected delivery time is 3-5 business days depending on your location.</li>
              <li>You can track your order status by logging into your account.</li>
          </ol>
      </div>
      
      <p>If you have any questions about your order, please don't hesitate to contact our customer service team at <a href="mailto:marketv43@gmail.com">marketv43@gmail.com</a> or call us at (+94) 712012525.</p>
      
      <p>Thank you for choosing us!</p>
      
      <p>Warm regards,<br>
      The Market V4 Team</p>
      
      <div class="footer">
          <p>This is an automated message. Please do not reply directly to this email.</p>
          <p>&copy; 2025 Market-V. All rights reserved.</p>
      </div>
  </body>
  </html>`;
}

module.exports = { orderConfirmationTemplate };
