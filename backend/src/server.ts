import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from './lib/prisma';

// Importar rotas
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import ingredientRoutes from './routes/ingredients';
import categoryRoutes from './routes/categories';
import reportRoutes from './routes/reports';
import modifierRoutes from './routes/modifiers';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});



// Middlewares
app.use(cors());
app.use(express.json());

// Socket.IO para atualizações em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('join-kitchen', () => {
    socket.join('kitchen');
  });
  
  socket.on('join-waiters', () => {
    socket.join('waiters');
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Disponibilizar io globalmente
app.set('io', io);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/modifiers', modifierRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sistema de Restaurante API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      ingredients: '/api/ingredients',
      categories: '/api/categories',
      reports: '/api/reports',
      modifiers: '/api/modifiers',
      health: '/api/health'
    }
  });
});

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ message: 'Sistema de Restaurante API funcionando!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});