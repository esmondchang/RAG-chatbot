# Code Chatbot

Created November 2024<br>
An application designed to assist developers by providing an interactive chat interface to discuss and analyze their code files.

## Table of contents
* [Prerequisites](#prerequisites)
* [Executing Program](#executing-program)
* [Inspiration](#inspiration)
* [Future Development](#future-development)
* [Contact](#contact)


## Prerequisites

Ensure you have the following installed on your local machine:

1. **Docker and Docker Compose**  
   Docker enables containerization of applications, while Docker Compose allows orchestration of multi-container setups.

   - **Docker:** [Download Docker](https://docs.docker.com/get-docker/)
   - **Docker Compose:** [Install Docker Compose](https://docs.docker.com/compose/install/)


2. **Node.js (Optional)**  
   If you plan to run the frontend and backend without Docker for development purposes.
   
   - **Node.js:** [Download Node.js](https://nodejs.org/en/download/)


## Executing Program

Create a .env file containing:
```
# backend/.env

PORT=your_port
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
```

then run:
```docker-compose up -d --build```


