const fs = require('fs');
const path = '.env.local';
const env = {};
for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}
fetch(`${url}/functions/v1/sms`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({ to: '+260977123456', body: 'Test SMS from clinic queue', from: 'MediQueue' }),
  signal: AbortSignal.timeout(20000),
})
  .then(async (res) => {
    const text = await res.text();
    console.log('status', res.status);
    console.log(text);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
