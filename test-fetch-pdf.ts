import { FetchClient, Config } from 'coze-coding-dev-sdk';

async function fetchPDF() {
  const config = new Config();
  const client = new FetchClient(config);
  
  const url = 'https://coze-coding-project.tos.coze.site/create_attachment/2026-03-30/256649963508523_8d490fb3c35c0d17cf382b182bd93b0b_%E8%AE%BE%E8%AE%A1%E6%83%B3%E6%B3%95.pdf?sign=4896899482-e39defaab5-0-8bfcbc30b7ca8d6a7da08ed77b75cc126d748e2462906235d23d1ece38debefc';
  
  console.log('Fetching PDF content...');
  const response = await client.fetch(url);
  
  console.log('Title:', response.title);
  console.log('Status:', response.status_code);
  console.log('File type:', response.filetype);
  
  // Extract text content
  const textContent = response.content
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n');
  
  console.log('\n=== PDF Content ===\n');
  console.log(textContent);
}

fetchPDF().catch(console.error);
