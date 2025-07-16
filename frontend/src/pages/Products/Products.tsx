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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  Fab,
  CircularProgress,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Restaurant,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category: {
    id: string;
    name: string;
  };
  ingredients: Array<{
    id: string;
    ingredient: {
      id: string;
      name: string;
      unit: string;
    };
    quantity: number;
  }>;
}

interface Category {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  available: boolean;
  categoryId: string;
  ingredients: Array<{
    ingredientId: string;
    quantity: number;
  }>;
}

export default function Products() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuProductId, setMenuProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    available: true,
    categoryId: '',
    ingredients: []
  });
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>(
    'products',
    async () => {
      const response = await api.get('/products');
      return response.data;
    }
  );

  const { data: categories } = useQuery<Category[]>(
    'categories',
    async () => {
      const response = await api.get('/categories');
      return response.data;
    }
  );

  const { data: ingredients } = useQuery<Ingredient[]>(
    'ingredients',
    async () => {
      const response = await api.get('/ingredients');
      return response.data;
    },
    { enabled: formOpen }
  );

  const createProductMutation = useMutation(
    async (productData: ProductFormData) => {
      await api.post('/products', productData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Produto criado com sucesso!');
        handleFormClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao criar produto');
      },
    }
  );

  const updateProductMutation = useMutation(
    async ({ id, data }: { id: string; data: ProductFormData }) => {
      await api.put(`/products/${id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Produto atualizado com sucesso!');
        handleFormClose();
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar produto');
      },
    }
  );

  const deleteProductMutation = useMutation(
    async (productId: string) => {
      await api.delete(`/products/${productId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Produto excluído com sucesso!');
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao excluir produto');
      },
    }
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, productId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuProductId(productId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuProductId(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      available: true,
      categoryId: '',
      ingredients: []
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      available: product.available,
      categoryId: product.category.id,
      ingredients: product.ingredients?.map(ing => ({
        ingredientId: ing.ingredient.id,
        quantity: ing.quantity
      })) || []
    });
    setFormOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuProductId) {
      deleteProductMutation.mutate(menuProductId);
    }
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        data: formData
      });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredientId: '', quantity: 0 }]
    });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const canManageProducts = user?.role === 'ADMIN';

  const filteredProducts = products?.filter(product => {
    if (!selectedCategory) return true;
    return product.category.id === selectedCategory;
  }) || [];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" mb={3}>
          <Typography variant="h4">
            Produtos
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="category-filter-label">Filtrar por Categoria</InputLabel>
              <Select
                labelId="category-filter-label"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Filtrar por Categoria"
              >
                <MenuItem value="">Todas as categorias</MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {canManageProducts && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setFormOpen(true)}
              >
                Novo Produto
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" sx={{ flexGrow: 1, mr: 1 }}>
                    <Restaurant sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      {product.name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Chip
                      icon={product.available ? <Visibility /> : <VisibilityOff />}
                      label={product.available ? 'Disponível' : 'Indisponível'}
                      color={product.available ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                    {canManageProducts && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, product.id)}
                        sx={{ ml: 0.5 }}
                      >
                        <MoreVert />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                
                <Box mb={2}>
                  <Chip
                    label={product.category.name}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                {product.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    {product.description}
                  </Typography>
                )}
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    R$ {product.price.toFixed(2)}
                  </Typography>
                  {product.ingredients?.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {product.ingredients.length} ingrediente(s)
                    </Typography>
                  )}
                </Box>
              </CardContent>
              
              <CardActions sx={{ pt: 0 }}>
                <Button
                  size="small"
                  onClick={() => setSelectedProduct(product)}
                  fullWidth
                  variant="outlined"
                >
                  Ver Detalhes
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {filteredProducts.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {selectedCategory ? 'Nenhum produto encontrado nesta categoria' : 'Nenhum produto cadastrado'}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const product = products?.find(p => p.id === menuProductId);
          if (product) handleEdit(product);
        }}>
          <Edit sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog de formulário */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Editar Produto' : 'Novo Produto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preço"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                margin="normal"
                InputProps={{
                  startAdornment: 'R$'
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  label="Categoria"
                >
                  {categories?.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  />
                }
                label="Disponível"
                sx={{ mt: 2 }}
              />
            </Grid>
            
            {/* Ingredientes */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Ingredientes
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={addIngredient}
                  size="small"
                >
                  Adicionar
                </Button>
              </Box>
              
              {formData.ingredients.map((ingredient, index) => (
                <Box key={index} display="flex" gap={2} mb={2} alignItems="center">
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Ingrediente</InputLabel>
                    <Select
                      value={ingredient.ingredientId}
                      onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                      label="Ingrediente"
                      size="small"
                    >
                      {ingredients?.map((ing) => (
                        <MenuItem key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Quantidade"
                    type="number"
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  
                  <IconButton
                    color="error"
                    onClick={() => removeIngredient(index)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
          >
            {editingProduct ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalhes do produto */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle>
              {selectedProduct.name}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                <strong>Categoria:</strong> {selectedProduct.category.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Preço:</strong> R$ {selectedProduct.price.toFixed(2)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {selectedProduct.available ? 'Disponível' : 'Indisponível'}
              </Typography>
              
              {selectedProduct.description && (
                <Typography variant="body1" gutterBottom>
                  <strong>Descrição:</strong> {selectedProduct.description}
                </Typography>
              )}
              
              {selectedProduct.ingredients?.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Ingredientes:
                  </Typography>
                  <List dense>
                    {selectedProduct.ingredients.map((ingredient) => (
                      <ListItem key={ingredient.id}>
                        <ListItemText
                          primary={ingredient.ingredient.name}
                          secondary={`${ingredient.quantity} ${ingredient.ingredient.unit}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedProduct(null)}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}