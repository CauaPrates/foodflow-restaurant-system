import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Listar todas as mesas
router.get('/', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING', 'PREPARING', 'READY']
            }
          },
          include: {
            orderItems: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: {
        number: 'asc'
      }
    });

    res.json(tables);
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar mesa por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            orderItems: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!table) {
      return res.status(404).json({ error: 'Mesa não encontrada' });
    }

    return res.json(table);
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova mesa (apenas admin)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { number, capacity } = req.body;

    // Verificar se já existe mesa com esse número
    const existingTable = await prisma.table.findUnique({
      where: { number: parseInt(number) }
    });

    if (existingTable) {
      return res.status(400).json({ error: 'Já existe uma mesa com esse número' });
    }

    const table = await prisma.table.create({
      data: {
        number: parseInt(number),
        capacity: parseInt(capacity)
      }
    });

    return res.status(201).json(table);
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar mesa (apenas admin)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { number, capacity, status } = req.body;

    // Se está mudando o número, verificar se não existe outra mesa com esse número
    if (number) {
      const existingTable = await prisma.table.findFirst({
        where: {
          number: parseInt(number),
          id: { not: id }
        }
      });

      if (existingTable) {
        return res.status(400).json({ error: 'Já existe uma mesa com esse número' });
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        number: number ? parseInt(number) : undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        status
      }
    });

    return res.json(table);
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar mesa (apenas admin)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar se a mesa tem pedidos ativos
    const activeOrders = await prisma.order.findFirst({
      where: {
        tableId: id,
        status: {
          in: ['PENDING', 'PREPARING', 'READY']
        }
      }
    });

    if (activeOrders) {
      return res.status(400).json({ error: 'Não é possível deletar mesa com pedidos ativos' });
    }

    await prisma.table.delete({
      where: { id }
    });

    return res.json({ message: 'Mesa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar mesa:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alterar status da mesa
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const table = await prisma.table.update({
      where: { id },
      data: { status },
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING', 'PREPARING', 'READY']
            }
          }
        }
      }
    });

    return res.json(table);
  } catch (error) {
    console.error('Erro ao atualizar status da mesa:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter conta da mesa
router.get('/:id/bill', async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = await prisma.order.findMany({
      where: {
        tableId: id,
        status: {
          in: ['DELIVERED']
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

    const bill = {
      tableId: id,
      orders: orders,
      total: orders.reduce((sum, order) => sum + order.total, 0),
      itemCount: orders.reduce((sum, order) => sum + order.orderItems.length, 0)
    };

    res.json(bill);
  } catch (error) {
    console.error('Erro ao gerar conta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;