import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Listar todos os pedidos
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, customerName } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (customerName) where.customerName = { contains: customerName };

    const orders = await prisma.order.findMany({
      where,
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
            },
            modifiers: {
              include: {
                modifier: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar pedido por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
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
            },
            modifiers: {
              include: {
                modifier: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo pedido
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { customerName, items, observations, tableNumber } = req.body;
    const userId = req.user!.id;

    if (!customerName || customerName.trim() === '') {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }

    // Gerar número sequencial do pedido
    const lastOrder = await prisma.order.findFirst({
      where: { orderNumber: { not: null } },
      orderBy: { orderNumber: 'desc' }
    });
    const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

    // Calcular total e verificar disponibilidade dos produtos
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          productIngredients: {
            include: {
              ingredient: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({ error: `Produto ${item.productId} não encontrado` });
      }

      if (!product.available) {
        return res.status(400).json({ error: `Produto ${product.name} não está disponível` });
      }

      // Verificar estoque de ingredientes
      for (const productIngredient of product.productIngredients) {
        const needed = productIngredient.quantity * item.quantity;
        const current = productIngredient.ingredient.currentStock;
        
        if (current < needed) {
          return res.status(400).json({ 
            error: `Estoque insuficiente de ${productIngredient.ingredient.name} para ${product.name}` 
          });
        }
      }

      let itemTotal = product.price * item.quantity;
      
      // Calcular preço dos modificadores
      const modifiersData = [];
      if (item.modifiers && item.modifiers.length > 0) {
        for (const modifierItem of item.modifiers) {
          const modifier = await prisma.modifier.findUnique({
            where: { id: modifierItem.modifierId }
          });

          if (!modifier) {
            return res.status(404).json({ error: `Modificador ${modifierItem.modifierId} não encontrado` });
          }

          if (!modifier.available) {
            return res.status(400).json({ error: `Modificador ${modifier.name} não está disponível` });
          }

          const modifierTotal = modifier.price * (modifierItem.quantity || 1) * item.quantity;
          itemTotal += modifierTotal;

          modifiersData.push({
            modifierId: modifier.id,
            quantity: modifierItem.quantity || 1,
            price: modifier.price
          });
        }
      }

      total += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        observations: item.observations || null,
        modifiers: modifiersData
      });
    }

    // Criar pedido
    const order = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber,
        customerName: customerName.trim(),
        userId,
        total,
        observations,
        tableNumber,
        orderItems: {
          create: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            observations: item.observations,
            modifiers: {
              create: item.modifiers
            }
          }))
        }
      },
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
            },
            modifiers: {
              include: {
                modifier: true
              }
            }
          }
        }
      }
    });

    // Reduzir estoque dos ingredientes
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          productIngredients: {
            include: {
              ingredient: true
            }
          }
        }
      });

      if (product) {
        for (const productIngredient of product.productIngredients) {
          const quantityToReduce = productIngredient.quantity * item.quantity;
          
          await prisma.ingredient.update({
            where: { id: productIngredient.ingredientId },
            data: {
              currentStock: {
                decrement: quantityToReduce
              }
            }
          });

          // Registrar movimento de estoque
          await prisma.stockMovement.create({
            data: {
              ingredientId: productIngredient.ingredientId,
              type: 'OUT',
              quantity: quantityToReduce,
              reason: `Pedido #${order.id} - ${product.name}`
            }
          });
        }
      }
    }

    // Notificar cozinha via Socket.IO
    const io = req.app.get('io');
    io.to('kitchen').emit('new-order', order);

    return res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status do pedido
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    // Notificar via Socket.IO
    const io = req.app.get('io');
    if (status === 'READY') {
      io.to('waiters').emit('order-ready', order);
    } else if (status === 'DELIVERED') {
      io.to('kitchen').emit('order-delivered', order);
    }

    return res.json(order);
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Finalizar pedido (marcar como finalizado no dia)
router.patch('/:id/finalize', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.update({
      where: { id },
      data: { dayFinalized: true },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    return res.json(order);
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar pedido
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                productIngredients: {
                  include: {
                    ingredient: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Apenas pedidos pendentes podem ser cancelados' });
    }

    // Restaurar estoque dos ingredientes
    for (const item of order.orderItems) {
      for (const productIngredient of item.product.productIngredients) {
        const quantityToRestore = productIngredient.quantity * item.quantity;
        
        await prisma.ingredient.update({
          where: { id: productIngredient.ingredientId },
          data: {
            currentStock: {
              increment: quantityToRestore
            }
          }
        });

        // Registrar movimento de estoque
        await prisma.stockMovement.create({
          data: {
            ingredientId: productIngredient.ingredientId,
            type: 'IN',
            quantity: quantityToRestore,
            reason: `Cancelamento do pedido #${order.id}`
          }
        });
      }
    }

    // Atualizar status para cancelado
    await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Mesa liberada automaticamente (não há mais controle de mesas)

    return res.json({ message: 'Pedido cancelado com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;