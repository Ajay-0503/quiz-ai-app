FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p server/data && echo '[]' > server/data/history.json
EXPOSE 3000
CMD ["node", "server/index.js"]
