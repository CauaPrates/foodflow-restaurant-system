import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Listar todas as categorias
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            available: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar categoria por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            productIngredients: {
              include: {
                ingredient: true
              }
            }
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    return res.json(category);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova categoria (apenas admin)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;

    // Verificar se já existe categoria com esse nome
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name
      }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Já existe uma categoria com esse nome' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description
      }
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar categoria (apenas admin)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Se está mudando o nome, verificar se não existe outra categoria com esse nome
    if (name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: name,
          id: { not: id }
        }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Já existe uma categoria com esse nome' });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            available: true
          }
        }
      }
    });

    return res.json(category);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar categoria (apenas admin)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar se a categoria tem produtos
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      return res.status(400).json({ 
        error: `Não é possível deletar categoria que possui ${productsCount} produto(s)` 
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    return res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter produtos de uma categoria
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.query;
    
    let where: any = { categoryId: id };
    if (available !== undefined) {
      where.available = available === 'true';
    }

    const products = await prisma.product.findMany({
      where,
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

    return res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos da categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;