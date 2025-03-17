// backend/fileProcessor.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Pinecone } = require('@pinecone-database/pinecone');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
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
    console.log(response.data.data[0].embedding);
    return response.data.data[0].embedding;
}

const processFiles = async (files) => {
    const pc = new Pinecone({
        apiKey: PINECONE_API_KEY
        });
//you need to create index with Openai embedding-3-large with 3072 dimension
     const index = pc.Index('code-embeddings'); 


  for (const file of files) {
    const content = fs.readFileSync(path.join(file.path), 'utf-8');
    const embedding = await generateEmbedding(content);
    const tempId = uuidv4()
    vector = []
    vector.push({ id: tempId, values: embedding, metadata: {
        fileName: file.originalname,
        content: content
      }})

    await index.upsert(vector);
    
    const filesMetaPath = path.join(__dirname, 'files.json');
    let filesMeta = [];
    if (fs.existsSync(filesMetaPath)) {
      const data = fs.readFileSync(filesMetaPath, 'utf-8');
      filesMeta = JSON.parse(data);
    }
    filesMeta.push({
      id: tempId,
      fileName: file.originalname,
      uploadDate: new Date().toISOString()
    });
    fs.writeFileSync(filesMetaPath, JSON.stringify(filesMeta, null, 2));

    fs.unlinkSync(path.join(file.path));
  }
};

module.exports = { processFiles };