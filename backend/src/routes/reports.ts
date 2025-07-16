import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Obter estatísticas gerais
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Vendas do mês (apenas pedidos entregues)
    const monthlyOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    // Calcular vendas totais do mês
    const monthlyRevenue = monthlyOrders.reduce((total, order) => {
      const orderTotal = order.orderItems.reduce((orderSum, item) => {
        return orderSum + (item.quantity * item.price);
      }, 0);
      return total + orderTotal;
    }, 0);

    // Número de pedidos do mês
    const monthlyOrdersCount = monthlyOrders.length;

    // Ticket médio
    const averageTicket = monthlyOrdersCount > 0 ? monthlyRevenue / monthlyOrdersCount : 0;

    // Pedidos ativos (em andamento)
    const activeOrders = await prisma.order.count({
      where: {
        status: {
          in: ['PENDING', 'PREPARING', 'READY']
        }
      }
    });

    res.json({
      monthlyRevenue,
      monthlyOrdersCount,
      averageTicket,
      activeOrders
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter dados de vendas por mês (últimos 6 meses)
router.get('/monthly-sales', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const monthsData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const orders = await prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      const revenue = orders.reduce((total, order) => {
        const orderTotal = order.orderItems.reduce((orderSum, item) => {
          return orderSum + (item.quantity * item.price);
        }, 0);
        return total + orderTotal;
      }, 0);

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      monthsData.push({
        name: monthNames[monthDate.getMonth()],
        vendas: revenue,
        pedidos: orders.length
      });
    }

    res.json(monthsData);
  } catch (error) {
    console.error('Erro ao buscar vendas mensais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter produtos mais vendidos
router.get('/top-products', authenticateToken, async (req, res) => {
  try {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'DELIVERED'
        }
      },
      include: {
        product: true
      }
    });

    // Agrupar por produto e somar quantidades
    const productSales = orderItems.reduce((acc, item) => {
      const productId = item.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          name: item.product.name,
          quantity: 0
        };
      }
      acc[productId].quantity += item.quantity;
      return acc;
    }, {} as Record<string, { name: string; quantity: number }>);

    // Converter para array e ordenar
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        value: product.quantity
      }));

    // Se não houver dados, retornar placeholder
    if (topProducts.length === 0) {
      res.json([{ name: 'Aguardando dados', value: 1 }]);
    } else {
      res.json(topProducts);
    }
  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;