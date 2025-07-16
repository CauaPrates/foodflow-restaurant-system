# Configuração do MySQL para o FoodFlow

## Pré-requisitos

1. **Instalar MySQL Server**
   - Baixe e instale o MySQL Server do site oficial: https://dev.mysql.com/downloads/mysql/
   - Durante a instalação, defina uma senha para o usuário root

2. **Criar o banco de dados**
   ```sql
   CREATE DATABASE restaurante_db;
   CREATE USER 'usuario'@'localhost' IDENTIFIED BY 'senha';
   GRANT ALL PRIVILEGES ON restaurante_db.* TO 'usuario'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Configuração

1. **Atualizar o arquivo .env**
   - Edite o arquivo `backend/.env`
   - Substitua os valores na DATABASE_URL:
   ```
   DATABASE_URL="mysql://seu_usuario:sua_senha@localhost:3306/restaurante_db"
   ```

2. **Executar as migrações**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

3. **Gerar o cliente Prisma**
   ```bash
   npx prisma generate
   ```

4. **Executar o seed (opcional)**
   ```bash
   npx prisma db seed
   ```

## Comandos úteis

- **Ver o banco no Prisma Studio**: `npx prisma studio`
- **Reset do banco**: `npx prisma migrate reset`
- **Deploy das migrações**: `npx prisma migrate deploy`

## Troubleshooting

- Certifique-se de que o MySQL está rodando na porta 3306
- Verifique se o usuário e senha estão corretos
- Confirme se o banco de dados foi criado
- Teste a conexão com: `npx prisma db pull`