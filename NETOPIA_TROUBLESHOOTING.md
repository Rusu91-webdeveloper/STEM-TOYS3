# Netopia Payment Integration Troubleshooting

## Common Errors and Solutions

### 1. "POS is not approved" (Code 99)

**Error:** `{"code": "99", "message": "POS is not approved"}` **Cause:** The
Point of Sale (POS) associated with your `NETOPIA_SIGNATURE` is not active or
approved for live transactions in the Netopia system. **Solution:**

- Log in to the [Netopia Admin Panel](https://admin.netopia-payments.com/).
- Go to **Admin** > **POS Management**.
- Check the status of your POS. It must be "Active" or "Approved".
- If it is "Pending" or "Test", and you are trying to make a LIVE transaction,
  you need to request activation from Netopia support.
- If you are testing, ensure `NETOPIA_SANDBOX=true` is set in your environment
  variables and you are using Sandbox credentials.

### 2. "Invalid request format" / JSON Unmarshal Error

**Error:**
`json: cannot unmarshal number into Go struct field Installments.order.installments.available of type []int`
**Cause:** The API expects an array of integers for `installments.available`,
but a single number was sent. **Solution:** Ensure your payload sends
`available: [1]` instead of `available: 1`. This is fixed in
`lib/payments/NetopiaProvider.ts`.

### 3. HTTP 404 Not Found

**Error:** `Netopia API error (HTTP 404) at ...` **Cause:** The API endpoint URL
is incorrect. **Solution:**

- For LIVE transactions: Use `https://secure.mobilpay.ro/pay/payment/card/start`
- For SANDBOX: Use `https://secure.mobilpay.ro/payment/card/start` or
  `https://secure-sandbox.netopia-payments.com/payment/card/start`
- The system automatically tries multiple endpoints. Check the logs for the
  _specific_ error that caused the failure, not just the last 404.

### 4. "Invalid Signature"

**Error:** `Invalid signature` **Cause:** The `NETOPIA_SIGNATURE` or
`NETOPIA_API_KEY` is incorrect. **Solution:** Double-check your `.env` file.
Ensure there are no extra spaces. The API Key looks like
`XXXX-XXXX-XXXX-XXXX-XXXX` and the Signature is a long alphanumeric string.

## Debugging Steps

1. **Check Logs:** Look at the Vercel/Server logs. The integration logs full
   request/response data in development mode.
2. **Verify Environment:** Ensure `NETOPIA_SANDBOX` is set correctly (`true` for
   testing, `false` for production).
3. **Test with Curl:** You can try manually sending a request to the endpoint
   using `curl` or Postman with the same JSON payload to isolate if it's a code
   issue or API issue.

## Support

If issues persist, contact Netopia Support at support@netopia-payments.com with
the `orderID` and the error message.
