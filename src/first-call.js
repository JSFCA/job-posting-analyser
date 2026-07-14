import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const client = new Anthropic();

const message = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 200,
  messages: [
    { role: 'user', content: 'In one sentence, what does an Anthropic API "message" object contain?' },
  ],
});

console.log(message.content[0].text);
