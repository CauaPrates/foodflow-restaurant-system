import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Listar todos os ingredientes
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { lowStock } = req.query;
    
    let ingredients;
    
    if (lowStock === 'true') {
      // Buscar todos os ingredientes e filtrar no código
      const allIngredients = await prisma.ingredient.findMany({
        include: {
          stockMovements: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            }
          },
          productIngredients: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      ingredients = allIngredients.filter(ingredient => 
        ingredient.currentStock <= ingredient.minStock || ingredient.currentStock <= 0
      );
    } else {
      ingredients = await prisma.ingredient.findMany({
        include: {
          stockMovements: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            }
          },
          productIngredients: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    }

    res.json(ingredients);
  } catch (error) {
    console.error('Erro ao buscar ingredientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar ingrediente por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        productIngredients: {
          include: {
            product: true
          }
        }
      }
    });

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingrediente não encontrado' });
    }

    return res.json(ingredient);
  } catch (error) {
    console.error('Erro ao buscar ingrediente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo ingrediente (apenas admin)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { name, unit, currentStock, minStock, price } = req.body;

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        currentStock: parseFloat(currentStock) || 0,
        minStock: parseFloat(minStock) || 0,
        price: parseFloat(price) || 0
      }
    });

    // Registrar movimento inicial de estoque se houver
    if (currentStock && parseFloat(currentStock) > 0) {
      await prisma.stockMovement.create({
        data: {
          ingredientId: ingredient.id,
          type: 'IN',
          quantity: parseFloat(currentStock),
          reason: 'Estoque inicial'
        }
      });
    }

    return res.status(201).json(ingredient);
  } catch (error) {
    console.error('Erro ao criar ingrediente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar ingrediente (apenas admin)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, unit, minStock, price } = req.body;

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        unit,
        minStock: minStock ? parseFloat(minStock) : undefined,
        price: price ? parseFloat(price) : undefined
      }
    });

    return res.json(ingredient);
  } catch (error) {
    console.error('Erro ao atualizar ingrediente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar ingrediente (apenas admin)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar se o ingrediente está sendo usado em algum produto
    const productIngredients = await prisma.productIngredient.findFirst({
      where: { ingredientId: id }
    });

    if (productIngredients) {
      return res.status(400).json({ error: 'Não é possível deletar ingrediente que está sendo usado em produtos' });
    }

    // Deletar movimentos de estoque primeiro
    await prisma.stockMovement.deleteMany({
      where: { ingredientId: id }
    });

    // Deletar ingrediente
    await prisma.ingredient.delete({
      where: { id }
    });

    return res.json({ message: 'Ingrediente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ingrediente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar estoque
router.post('/:id/stock/add', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    if (!quantity || parseFloat(quantity) <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
    }

    // Atualizar estoque
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        currentStock: {
          increment: parseFloat(quantity)
        }
      }
    });

    // Registrar movimento
    await prisma.stockMovement.create({
      data: {
        ingredientId: id,
        type: 'IN',
        quantity: parseFloat(quantity),
        reason: reason || 'Entrada de estoque'
      }
    });

    return res.json(ingredient);
  } catch (error) {
    console.error('Erro ao adicionar estoque:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover estoque
router.post('/:id/stock/remove', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    if (!quantity || parseFloat(quantity) <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id }
    });

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingrediente não encontrado' });
    }

    if (ingredient.currentStock < parseFloat(quantity)) {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }

    // Atualizar estoque
    const updatedIngredient = await prisma.ingredient.update({
      where: { id },
      data: {
        currentStock: {
          decrement: parseFloat(quantity)
        }
      }
    });

    // Registrar movimento
    await prisma.stockMovement.create({
      data: {
        ingredientId: id,
        type: 'OUT',
        quantity: parseFloat(quantity),
        reason: reason || 'Saída de estoque'
      }
    });

    return res.json(updatedIngredient);
  } catch (error) {
    console.error('Erro ao remover estoque:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter todas as movimentações de estoque
router.get('/movements', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const movements = await prisma.stockMovement.findMany({
      skip,
      take: limit,
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.stockMovement.count();

    return res.json({
      movements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter histórico de movimentações de um ingrediente específico
router.get('/:id/movements', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const movements = await prisma.stockMovement.findMany({
      where: { ingredientId: id },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    const total = await prisma.stockMovement.count({
      where: { ingredientId: id }
    });

    return res.json({
      movements,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Ingredientes com estoque baixo
router.get('/low-stock', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Buscar todos os ingredientes e filtrar no código
    const allIngredients = await prisma.ingredient.findMany({
      include: {
        productIngredients: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                available: true
              }
            }
          }
        }
      },
      orderBy: {
        currentStock: 'asc'
      }
    });
    
    const lowStockIngredients = allIngredients.filter(ingredient => 
      ingredient.currentStock <= ingredient.minStock || ingredient.currentStock <= 0
    );

    return res.json(lowStockIngredients);
  } catch (error) {
    console.error('Erro ao buscar ingredientes com estoque baixo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de estoque baixo (rota alternativa)
router.get('/reports/low-stock', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Buscar todos os ingredientes e filtrar no código
    const allIngredients = await prisma.ingredient.findMany({
      include: {
        productIngredients: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                available: true
              }
            }
          }
        }
      },
      orderBy: {
        currentStock: 'asc'
      }
    });
    
    const lowStockIngredients = allIngredients.filter(ingredient => 
      ingredient.currentStock <= ingredient.minStock || ingredient.currentStock <= 0
    );

    return res.json(lowStockIngredients);
  } catch (error) {
    console.error('Erro ao gerar relatório de estoque baixo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;