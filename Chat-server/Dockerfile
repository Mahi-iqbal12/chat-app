#building
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

#production
FROM node:18-slim
WORKDIR /app
COPY --from=build /app /app

RUN apt-get update && apt-get install -y curl

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
