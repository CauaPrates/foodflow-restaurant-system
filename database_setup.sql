-- Script SQL para criar o banco de dados do FoodFlow
-- Execute este script no MySQL para configurar o banco

-- 1. Criar o banco de dados
CREATE DATABASE IF NOT EXISTS restaurante_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Criar usuário e conceder privilégios
CREATE USER IF NOT EXISTS 'usuario'@'localhost' IDENTIFIED BY 'senha';
GRANT ALL PRIVILEGES ON restaurante_db.* TO 'usuario'@'localhost';
FLUSH PRIVILEGES;

-- 3. Usar o banco criado
USE restaurante_db;

-- 4. Criar as tabelas (baseado no schema Prisma)

-- Tabela de usuários
CREATE TABLE User (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    name VARCHAR(191) NOT NULL,
    password VARCHAR(191) NOT NULL,
    role VARCHAR(191) NOT NULL DEFAULT 'GARCOM',
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Tabela de categorias
CREATE TABLE Category (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    description TEXT,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Tabela de produtos
CREATE TABLE Product (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    description TEXT,
    price DOUBLE NOT NULL,
    image VARCHAR(191),
    available BOOLEAN NOT NULL DEFAULT true,
    categoryId VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabela de ingredientes
CREATE TABLE Ingredient (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    unit VARCHAR(191) NOT NULL,
    currentStock DOUBLE NOT NULL DEFAULT 0,
    minStock DOUBLE NOT NULL DEFAULT 0,
    price DOUBLE NOT NULL DEFAULT 0,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Tabela de relacionamento produto-ingrediente
CREATE TABLE ProductIngredient (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    productId VARCHAR(191) NOT NULL,
    ingredientId VARCHAR(191) NOT NULL,
    quantity DOUBLE NOT NULL,
    FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (ingredientId) REFERENCES Ingredient(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY ProductIngredient_productId_ingredientId_key (productId, ingredientId)
);

-- Tabela de movimentações de estoque
CREATE TABLE StockMovement (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    ingredientId VARCHAR(191) NOT NULL,
    type VARCHAR(191) NOT NULL,
    quantity DOUBLE NOT NULL,
    reason TEXT,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (ingredientId) REFERENCES Ingredient(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabela de mesas
CREATE TABLE `Table` (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    number INT NOT NULL UNIQUE,
    capacity INT NOT NULL,
    status VARCHAR(191) NOT NULL DEFAULT 'AVAILABLE',
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Tabela de pedidos
CREATE TABLE `Order` (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    tableId VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    status VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    total DOUBLE NOT NULL DEFAULT 0,
    observations TEXT,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (tableId) REFERENCES `Table`(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabela de itens do pedido
CREATE TABLE OrderItem (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    orderId VARCHAR(191) NOT NULL,
    productId VARCHAR(191) NOT NULL,
    quantity INT NOT NULL,
    price DOUBLE NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (orderId) REFERENCES `Order`(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 5. Inserir dados iniciais (opcional)

-- Usuário administrador padrão (senha: admin123)
INSERT INTO User (id, email, name, password, role) VALUES 
('admin-001', 'admin@restaurante.com', 'Administrador', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN');

-- Categorias padrão
INSERT INTO Category (id, name, description) VALUES 
('cat-001', 'Pratos Principais', 'Pratos principais do cardápio'),
('cat-002', 'Bebidas', 'Bebidas diversas'),
('cat-003', 'Sobremesas', 'Doces e sobremesas'),
('cat-004', 'Entradas', 'Aperitivos e entradas');

-- Mesas padrão
INSERT INTO `Table` (id, number, capacity, status) VALUES 
('table-001', 1, 4, 'AVAILABLE'),
('table-002', 2, 2, 'AVAILABLE'),
('table-003', 3, 6, 'AVAILABLE'),
('table-004', 4, 4, 'AVAILABLE'),
('table-005', 5, 8, 'AVAILABLE');

-- Ingredientes básicos
INSERT INTO Ingredient (id, name, unit, currentStock, minStock, price) VALUES 
('ing-001', 'Arroz', 'kg', 50.0, 10.0, 5.50),
('ing-002', 'Feijão', 'kg', 30.0, 5.0, 8.00),
('ing-003', 'Carne Bovina', 'kg', 20.0, 3.0, 35.00),
('ing-004', 'Frango', 'kg', 25.0, 5.0, 18.00),
('ing-005', 'Batata', 'kg', 40.0, 8.0, 4.50);

SELECT 'Banco de dados criado com sucesso!' as status;