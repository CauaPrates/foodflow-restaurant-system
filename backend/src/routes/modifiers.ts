import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Listar todos os modificadores
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { hierarchical } = req.query;
    
    if (hierarchical === 'true') {
      // Retornar apenas modificadores principais com seus filhos
      const modifiers = await prisma.modifier.findMany({
        where: {
          parentId: null
        },
        include: {
          children: {
            orderBy: {
              name: 'asc'
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      res.json(modifiers);
    } else {
      // Retornar todos os modificadores com informações de hierarquia
      const modifiers = await prisma.modifier.findMany({
        include: {
          children: {
            orderBy: {
              name: 'asc'
            }
          },
          parent: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      res.json(modifiers);
    }
  } catch (error) {
    console.error('Erro ao buscar modificadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar modificador por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const modifier = await prisma.modifier.findUnique({
      where: { id },
      include: {
        productModifiers: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!modifier) {
      return res.status(404).json({ error: 'Modificador não encontrado' });
    }

    return res.json(modifier);
  } catch (error) {
    console.error('Erro ao buscar modificador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo modificador
router.post('/', authenticateToken, requireRole(['ADMIN', 'GERENTE']), async (req: AuthRequest, res) => {
  try {
    const { name, description, type, price, available, parentId } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome do modificador é obrigatório' });
    }

    if (!type || !['ADD', 'REMOVE', 'REPLACE'].includes(type)) {
      return res.status(400).json({ error: 'Tipo do modificador deve ser ADD, REMOVE ou REPLACE' });
    }

    // Se parentId foi fornecido, verificar se o modificador pai existe
    if (parentId) {
      const parentModifier = await prisma.modifier.findUnique({
        where: { id: parentId }
      });

      if (!parentModifier) {
        return res.status(400).json({ error: 'Modificador pai não encontrado' });
      }
    }

    // Verificar se já existe um modificador com o mesmo nome no mesmo nível
    const existingModifier = await prisma.modifier.findFirst({
      where: { 
        name: name.trim(),
        parentId: parentId || null
      }
    });

    if (existingModifier) {
      return res.status(400).json({ error: 'Já existe um modificador com este nome neste nível' });
    }

    const modifier = await prisma.modifier.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type,
        price: price || 0,
        available: available !== undefined ? available : true,
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true
      }
    });

    return res.status(201).json(modifier);
  } catch (error) {
    console.error('Erro ao criar modificador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar modificador
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'GERENTE']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, price, available } = req.body;

    const existingModifier = await prisma.modifier.findUnique({
      where: { id }
    });

    if (!existingModifier) {
      return res.status(404).json({ error: 'Modificador não encontrado' });
    }

    if (name && name.trim() !== existingModifier.name) {
      const duplicateModifier = await prisma.modifier.findFirst({
        where: { 
          name: name.trim(),
          id: { not: id }
        }
      });

      if (duplicateModifier) {
        return res.status(400).json({ error: 'Já existe um modificador com este nome' });
      }
    }

    if (type && !['ADD', 'REMOVE', 'REPLACE'].includes(type)) {
      return res.status(400).json({ error: 'Tipo do modificador deve ser ADD, REMOVE ou REPLACE' });
    }

    const modifier = await prisma.modifier.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(type && { type }),
        ...(price !== undefined && { price }),
        ...(available !== undefined && { available })
      }
    });

    return res.json(modifier);
  } catch (error) {
    console.error('Erro ao atualizar modificador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar modificador
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'GERENTE']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const modifier = await prisma.modifier.findUnique({
      where: { id },
      include: {
        productModifiers: true,
        orderItemModifiers: true
      }
    });

    if (!modifier) {
      return res.status(404).json({ error: 'Modificador não encontrado' });
    }

    if (modifier.orderItemModifiers.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar um modificador que já foi usado em pedidos' 
      });
    }

    // Deletar relações com produtos primeiro
    await prisma.productModifier.deleteMany({
      where: { modifierId: id }
    });

    // Deletar o modificador
    await prisma.modifier.delete({
      where: { id }
    });

    return res.json({ message: 'Modificador deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar modificador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar modificadores de um produto específico
router.get('/product/:productId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.params;

    const productModifiers = await prisma.productModifier.findMany({
      where: { productId },
      include: {
        modifier: true
      },
      orderBy: {
        modifier: {
          name: 'asc'
        }
      }
    });

    res.json(productModifiers);
  } catch (error) {
    console.error('Erro ao buscar modificadores do produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Associar modificador a um produto
router.post('/product/:productId/modifier/:modifierId', authenticateToken, requireRole(['ADMIN', 'GERENTE']), async (req: AuthRequest, res) => {
  try {
    const { productId, modifierId } = req.params;
    const { required, maxQuantity } = req.body;

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verificar se o modificador existe
    const modifier = await prisma.modifier.findUnique({
      where: { id: modifierId }
    });

    if (!modifier) {
      return res.status(404).json({ error: 'Modificador não encontrado' });
    }

    // Verificar se a associação já existe
    const existingAssociation = await prisma.productModifier.findUnique({
      where: {
        productId_modifierId: {
          productId,
          modifierId
        }
      }
    });

    if (existingAssociation) {
      return res.status(400).json({ error: 'Modificador já está associado a este produto' });
    }

    const productModifier = await prisma.productModifier.create({
      data: {
        productId,
        modifierId,
        required: required || false,
        maxQuantity: maxQuantity || null
      },
      include: {
        modifier: true
      }
    });

    return res.status(201).json(productModifier);
  } catch (error) {
    console.error('Erro ao associar modificador ao produto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover associação de modificador com produto
router.delete('/product/:productId/modifier/:modifierId', authenticateToken, requireRole(['ADMIN', 'GERENTE']), async (req: AuthRequest, res) => {
  try {
    const { productId, modifierId } = req.params;

    const productModifier = await prisma.productModifier.findUnique({
      where: {
        productId_modifierId: {
          productId,
          modifierId
        }
      }
    });

    if (!productModifier) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    await prisma.productModifier.delete({
      where: {
        productId_modifierId: {
          productId,
          modifierId
        }
      }
    });

    return res.json({ message: 'Associação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover associação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;