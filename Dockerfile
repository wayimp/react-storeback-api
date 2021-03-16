FROM node

COPY package*.json ./

RUN npm install
RUN npm ci --only=production

COPY . .

EXPOSE 3030

CMD [ "npm", "start" ]