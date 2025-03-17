// backend/fileProcessor.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Pinecone } = require('@pinecone-database/pinecone');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth"); // For DOCX
dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;


const pc = new Pinecone({
    apiKey: PINECONE_API_KEY
  });

const index = pc.Index('rag-embedding'); 

// Function to extract text from PDF
const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// Function to extract text from DOCX
const extractTextFromDOCX = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const { value } = await mammoth.extractRawText({ buffer: dataBuffer });
  return value;
};

const generateEmbedding = async (text) => {
  try {
      const response = await axios.post(
          "https://api.openai.com/v1/embeddings", // Ensure this is the correct endpoint
          {
              model: "text-embedding-3-large", // Ensure this model is correct
              input: text
          },
          {
              headers: {
                  "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure API key is loaded
                  "Content-Type": "application/json"
              }
          }
      );

      return response.data.data[0].embedding; // Ensure this is accessing the correct response format
  } catch (error) {
      console.error("Error generating embedding:", error.response ? error.response.data : error.message);
      throw error;
  }
};

const processFiles = async (files) => {
    const pc = new Pinecone({
        apiKey: PINECONE_API_KEY
        });
//you need to create index with Openai embedding-3-large with 3072 dimension
     const index = pc.Index('rag-embedding'); 


     for (const file of files) {
      try {
          let text = "";

          if (file.mimetype === "application/pdf") {
              text = await extractTextFromPDF(file.path);
          } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
              text = await extractTextFromDOCX(file.path);
          } else {
              console.error(`Unsupported file format: ${file.mimetype}`);
              continue; // Skip this file instead of returning a response
          }

          const embedding = await generateEmbedding(text);
          console.log("Embedding generated");

          const tempId = uuidv4();

          const vector = {
              id: tempId,
              values: embedding,
              metadata: {
                  fileName: file.originalname,
                  content: text
              }
          };

          await index.upsert([vector]);
          console.log("Index upsert successful");

          // Save file metadata
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

          // Delete the file after processing
          fs.unlinkSync(file.path);
      } catch (error) {
          console.error("Error processing file:", error);
      }
  }
};

module.exports = { processFiles };