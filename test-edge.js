const url = "https://jbltrwsuekmixqnlocwx.supabase.co/functions/v1/send-order-notification";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibHRyd3N1ZWttaXhxbmxvY3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTEwNDEsImV4cCI6MjA5NTEyNzA0MX0.wO0K17JYq-97H9R-u3BEO3a5wARdzJODYw3IEcHtPzg";

async function test() {
  console.log("Invoking edge function...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        order_id: "00000000-0000-0000-0000-000000000000",
        new_status: "new"
      })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
