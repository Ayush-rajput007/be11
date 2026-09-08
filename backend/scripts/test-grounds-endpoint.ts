import axios from 'axios';

async function main() {
  const base = 'http://localhost:5000/api/v1/grounds';

  console.log('Testing GET /grounds (no query)...');
  const r1 = await axios.get(base);
  console.log(`All grounds count: ${r1.data.data.grounds.length}`);

  console.log('\nTesting GET /grounds?city=Faridabad...');
  const r2 = await axios.get(`${base}?city=Faridabad`);
  console.log(`Faridabad grounds count: ${r2.data.data.grounds.length}`);

  console.log('\nTesting GET /grounds?city=Haryana...');
  const r3 = await axios.get(`${base}?city=Haryana`);
  console.log(`Haryana grounds count: ${r3.data.data.grounds.length}`);

  console.log('\nTesting GET /grounds?city=Gurugram...');
  const r4 = await axios.get(`${base}?city=Gurugram`);
  console.log(`Gurugram grounds count (expect 0): ${r4.data.data.grounds.length}`);

  console.log('\nTesting GET /grounds?search=Playnow...');
  const r5 = await axios.get(`${base}?search=Playnow`);
  console.log(`Search Playnow count: ${r5.data.data.grounds.length}`);
}

main().catch(console.error);
