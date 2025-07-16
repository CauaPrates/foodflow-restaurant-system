import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Fab,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Warning,
  TrendingUp,
  TrendingDown,
  Inventory,
  History,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  price: number;
}

interface StockMovement {
  id: string;
  ingredient: {
    id: string;
    name: string;
    unit: string;
  };
  type: string;
  quantity: number;
  reason?: string;
  createdAt: string;
  user: {
    name: string;
  };
}

interface IngredientFormData {
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  price: number;
}

interface StockFormData {
  quantity: number;
  reason: string;
}

export default function Ingredients() {
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuIngredientId, setMenuIngredientId] = useState<string | null>(null);
  const [stockOperation, setStockOperation] = useState<'add' | 'remove'>('add');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    unit: '',
    currentStock: 0,
    minStock: 0,
    price: 0
  });
  const [stockFormData, setStockFormData] = useState<StockFormData>({
    quantity: 0,
    reason: ''
  });
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ingredients, isLoading } = useQuery<Ingredient[]>(
    'ingredients',
    async () => {
      const response = await api.get('/ingredients');
      return response.data;
    }
  );

  const { data: lowStockIngredients } = useQuery<Ingredient[]>(
    'ingredients-low-stock',
    async () => {
      const response = await api.get('/ingredients/low-stock');
      return response.data;
    }
  );

  const { data: stockMovements } = useQuery<StockMovement[]>(
    'stock-movements',
    async () => {
      const response = await api.get('/ingredients/movements');
      return response.data;
    },
    { enabled: tabValue === 1 }
  );

  const createIngredientMutation = useMutation(
    async (ingredientData: IngredientFormData) => {
      await api.post('/ingredients', ingredientData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ingredients');
        queryClient.invalidateQueries('ingredients-low-stock');
        toast.success('Ingrediente criado com sucesso!');
        handleFormClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao criar ingrediente');
      },
    }
  );

  const updateIngredientMutation = useMutation(
    async ({ id, data }: { id: string; data: IngredientFormData }) => {
      await api.put(`/ingredients/${id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ingredients');
        queryClient.invalidateQueries('ingredients-low-stock');
        toast.success('Ingrediente atualizado com sucesso!');
        handleFormClose();
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar ingrediente');
      },
    }
  );

  const deleteIngredientMutation = useMutation(
    async (ingredientId: string) => {
      await api.delete(`/ingredients/${ingredientId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ingredients');
        queryClient.invalidateQueries('ingredients-low-stock');
        toast.success('Ingrediente excluído com sucesso!');
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao excluir ingrediente');
      },
    }
  );

  const updateStockMutation = useMutation(
    async ({ ingredientId, operation, data }: { 
      ingredientId: string; 
      operation: 'add' | 'remove'; 
      data: StockFormData 
    }) => {
      await api.post(`/ingredients/${ingredientId}/stock/${operation}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ingredients');
        queryClient.invalidateQueries('ingredients-low-stock');
        queryClient.invalidateQueries('stock-movements');
        toast.success('Estoque atualizado com sucesso!');
        handleStockFormClose();
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar estoque');
      },
    }
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, ingredientId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuIngredientId(ingredientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuIngredientId(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingIngredient(null);
    setFormData({
      name: '',
      unit: '',
      currentStock: 0,
      minStock: 0,
      price: 0
    });
  };

  const handleStockFormClose = () => {
    setStockFormOpen(false);
    setStockFormData({ quantity: 0, reason: '' });
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      minStock: ingredient.minStock,
      price: ingredient.price
    });
    setFormOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuIngredientId) {
      deleteIngredientMutation.mutate(menuIngredientId);
    }
  };

  const handleStockOperation = (operation: 'add' | 'remove') => {
    setStockOperation(operation);
    setStockFormOpen(true);
    handleMenuClose();
  };

  const handleSubmit = () => {
    if (editingIngredient) {
      updateIngredientMutation.mutate({
        id: editingIngredient.id,
        data: formData
      });
    } else {
      createIngredientMutation.mutate(formData);
    }
  };

  const handleStockSubmit = () => {
    if (menuIngredientId) {
      updateStockMutation.mutate({
        ingredientId: menuIngredientId,
        operation: stockOperation,
        data: stockFormData
      });
    }
  };

  const getStockStatus = (ingredient: Ingredient) => {
    if (ingredient.currentStock <= 0) return { color: 'error', text: 'Sem estoque' };
    if (ingredient.currentStock <= ingredient.minStock) return { color: 'warning', text: 'Estoque baixo' };
    return { color: 'success', text: 'Estoque OK' };
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'IN': return <TrendingUp color="success" />;
      case 'OUT': return <TrendingDown color="error" />;
      default: return <Inventory />;
    }
  };

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case 'IN': return 'Entrada';
      case 'OUT': return 'Saída';
      default: return type;
    }
  };

  const canManageIngredients = user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Ingredientes e Estoque
        </Typography>
        {canManageIngredients && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setFormOpen(true)}
          >
            Novo Ingrediente
          </Button>
        )}
      </Box>

      {/* Alerta de estoque baixo */}
      {lowStockIngredients && lowStockIngredients.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
          <Typography variant="subtitle2" gutterBottom>
            {lowStockIngredients.length} ingrediente(s) com estoque baixo:
          </Typography>
          {lowStockIngredients.map((ingredient) => (
            <Typography key={ingredient.id} variant="body2">
              • {ingredient.name}: {ingredient.currentStock} {ingredient.unit} (mín: {ingredient.minStock})
            </Typography>
          ))}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Ingredientes" />
          <Tab label="Histórico de Movimentações" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {ingredients?.map((ingredient) => {
            const status = getStockStatus(ingredient);
            return (
              <Grid item xs={12} sm={6} md={4} key={ingredient.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center">
                        <Inventory sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          {ingredient.name}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <Chip
                          label={status.text}
                          color={status.color as any}
                          size="small"
                        />
                        {canManageIngredients && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, ingredient.id)}
                          >
                            <MoreVert />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Unidade: {ingredient.unit}
                    </Typography>
                    
                    <Typography variant="h6" color="primary" gutterBottom>
                      Estoque: {ingredient.currentStock} {ingredient.unit}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Estoque mínimo: {ingredient.minStock} {ingredient.unit}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Custo: R$ {(ingredient.price || 0).toFixed(2)} / {ingredient.unit}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => setSelectedIngredient(ingredient)}
                    >
                      Ver Detalhes
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
          
          {ingredients?.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Nenhum ingrediente cadastrado
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Ingrediente</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Quantidade</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Usuário</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockMovements?.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {new Date(movement.createdAt).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{movement.ingredient.name}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {getMovementTypeIcon(movement.type)}
                      <Typography sx={{ ml: 1 }}>
                        {getMovementTypeText(movement.type)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {movement.quantity} {movement.ingredient.unit}
                  </TableCell>
                  <TableCell>{movement.reason || '-'}</TableCell>
                  <TableCell>{movement.user.name}</TableCell>
                </TableRow>
              ))}
              {stockMovements?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      Nenhuma movimentação encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const ingredient = ingredients?.find(i => i.id === menuIngredientId);
          if (ingredient) handleEdit(ingredient);
        }}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        
        <MenuItem onClick={() => handleStockOperation('add')}>
          <TrendingUp sx={{ mr: 1 }} />
          Adicionar Estoque
        </MenuItem>
        
        <MenuItem onClick={() => handleStockOperation('remove')}>
          <TrendingDown sx={{ mr: 1 }} />
          Remover Estoque
        </MenuItem>
        
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog de formulário de ingrediente */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Unidade"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            margin="normal"
            placeholder="kg, L, unidade, etc."
          />
          <TextField
              fullWidth
              label="Estoque Atual"
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
              margin="normal"
            />
          <TextField
            fullWidth
            label="Estoque Mínimo"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Custo por Unidade"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            margin="normal"
            InputProps={{
              startAdornment: 'R$'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createIngredientMutation.isLoading || updateIngredientMutation.isLoading}
          >
            {editingIngredient ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de movimentação de estoque */}
      <Dialog open={stockFormOpen} onClose={handleStockFormClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {stockOperation === 'add' ? 'Adicionar Estoque' : 'Remover Estoque'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Quantidade"
            type="number"
            value={stockFormData.quantity}
            onChange={(e) => setStockFormData({ ...stockFormData, quantity: parseFloat(e.target.value) || 0 })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Motivo"
            value={stockFormData.reason}
            onChange={(e) => setStockFormData({ ...stockFormData, reason: e.target.value })}
            margin="normal"
            placeholder="Compra, venda, perda, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStockFormClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleStockSubmit}
            variant="contained"
            disabled={updateStockMutation.isLoading}
            color={stockOperation === 'add' ? 'primary' : 'error'}
          >
            {stockOperation === 'add' ? 'Adicionar' : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalhes do ingrediente */}
      <Dialog
        open={!!selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedIngredient && (
          <>
            <DialogTitle>
              {selectedIngredient.name}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                <strong>Unidade:</strong> {selectedIngredient.unit}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Estoque Atual:</strong> {selectedIngredient.currentStock} {selectedIngredient.unit}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Estoque Mínimo:</strong> {selectedIngredient.minStock} {selectedIngredient.unit}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Custo:</strong> R$ {(selectedIngredient.price || 0).toFixed(2)} / {selectedIngredient.unit}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {getStockStatus(selectedIngredient).text}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedIngredient(null)}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}