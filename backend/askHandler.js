const axios = require('axios');
const dotenv = require('dotenv');
const { Pinecone } = require('@pinecone-database/pinecone');
dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const pc = new Pinecone({
    apiKey: PINECONE_API_KEY
  });

const index = pc.Index('code-embeddings'); 

async function generateEmbedding(text) {
    const response = await axios.post('https://api.openai.com/v1/embeddings', {
        input: text,
        model: "text-embedding-3-large"
    }, {
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
    });
    return response.data.data[0].embedding;
}

const askQuestion = async (question) => {
    const pc = new Pinecone({
        apiKey: PINECONE_API_KEY
      });
    
    const index = pc.Index('code-embeddings'); 

  const questionEmbedding = await generateEmbedding(question);

  const queryResponse = await index.query({
    vector: questionEmbedding,
    topK: 5,
    includeMetadata: true
  });

  const relevantSnippets = queryResponse.matches.map(match => match.metadata.content).join('\n\n');

  const prompt = `
You are an assistant that helps understand and explain code.

Relevant Code Snippets:
${relevantSnippets}

User Question:
${question}

Answer:
`;

  const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 5000
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return gptResponse.data.choices[0].message.content.trim();
};

module.exports = { askQuestion };