FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm
RUN pnpm config set node-linker hoisted

COPY package.json .
RUN pnpm install

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]
