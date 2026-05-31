const url = "https://jbltrwsuekmixqnlocwx.supabase.co/rest/v1/orders?select=id&limit=1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibHRyd3N1ZWttaXhxbmxvY3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTEwNDEsImV4cCI6MjA5NTEyNzA0MX0.wO0K17JYq-97H9R-u3BEO3a5wARdzJODYw3IEcHtPzg";

async function run() {
  const res = await fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } });
  const data = await res.json();
  console.log("Order:", data);
  if (data && data.length > 0) {
    const orderId = data[0].id;
    console.log("Testing with order:", orderId);
    const fnRes = await fetch("https://jbltrwsuekmixqnlocwx.supabase.co/functions/v1/send-order-notification", {
      method: "POST",
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, new_status: "new" })
    });
    console.log("Fn Status:", fnRes.status);
    console.log("Fn Response:", await fnRes.text());
  }
}
run();
