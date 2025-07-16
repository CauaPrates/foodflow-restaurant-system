import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    return res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo produto (apenas admin)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { name, description, price, categoryId, image, ingredients } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        image
      },
      include: {
        category: true
      }
    });

    // Adicionar ingredientes se fornecidos
    if (ingredients && ingredients.length > 0) {
      await prisma.productIngredient.createMany({
        data: ingredients.map((ing: any) => ({
          productId: product.id,
          ingredientId: ing.ingredientId,
          quantity: parseFloat(ing.quantity)
        }))
      });
    }

    const productWithIngredients = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    return res.status(201).json(productWithIngredients);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar produto (apenas admin)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, image, available } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        categoryId,
        image,
        available
      },
      include: {
        category: true,
        productIngredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    return res.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar produto (apenas admin)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Deletar ingredientes do produto primeiro
    await prisma.productIngredient.deleteMany({
      where: { productId: id }
    });

    // Deletar produto
    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar disponibilidade do produto baseado no estoque
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productIngredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verificar se há ingredientes suficientes
    let available = product.available;
    const missingIngredients = [];

    for (const productIngredient of product.productIngredients) {
      const needed = productIngredient.quantity;
      const current = productIngredient.ingredient.currentStock;
      
      if (current < needed) {
        available = false;
        missingIngredients.push({
          name: productIngredient.ingredient.name,
          needed,
          current,
          missing: needed - current
        });
      }
    }

    return res.json({
      available,
      missingIngredients
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;