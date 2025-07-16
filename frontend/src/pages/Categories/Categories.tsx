import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
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
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Category,
  Restaurant,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description?: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    available: boolean;
  }>;
}

interface CategoryFormData {
  name: string;
  description: string;
}

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCategoryId, setMenuCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: ''
  });
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery<Category[]>(
    'categories',
    async () => {
      const response = await api.get('/categories');
      return response.data;
    }
  );

  const createCategoryMutation = useMutation(
    async (categoryData: CategoryFormData) => {
      await api.post('/categories', categoryData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Categoria criada com sucesso!');
        handleFormClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao criar categoria');
      },
    }
  );

  const updateCategoryMutation = useMutation(
    async ({ id, data }: { id: string; data: CategoryFormData }) => {
      await api.put(`/categories/${id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Categoria atualizada com sucesso!');
        handleFormClose();
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar categoria');
      },
    }
  );

  const deleteCategoryMutation = useMutation(
    async (categoryId: string) => {
      await api.delete(`/categories/${categoryId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Categoria excluída com sucesso!');
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao excluir categoria');
      },
    }
  );

  const { data: categoryDetails } = useQuery(
    ['category-details', selectedCategory?.id],
    async () => {
      if (!selectedCategory?.id) return null;
      const response = await api.get(`/categories/${selectedCategory.id}`);
      return response.data;
    },
    {
      enabled: !!selectedCategory?.id
    }
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, categoryId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuCategoryId(categoryId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCategoryId(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setFormOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuCategoryId) {
      deleteCategoryMutation.mutate(menuCategoryId);
    }
  };

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: formData
      });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  const canManageCategories = user?.role === 'ADMIN';

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
          Categorias
        </Typography>
        {canManageCategories && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setFormOpen(true)}
          >
            Nova Categoria
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {categories?.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Category sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {category.name}
                    </Typography>
                  </Box>
                  {canManageCategories && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, category.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>
                
                {category.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {category.description}
                  </Typography>
                )}
                
                {category.products && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      {category.products.length} produto(s)
                    </Typography>
                    <Box mt={1}>
                      {category.products.slice(0, 3).map((product) => (
                        <Chip
                          key={product.id}
                          label={product.name}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                          color={product.available ? 'default' : 'error'}
                        />
                      ))}
                      {category.products.length > 3 && (
                        <Chip
                          label={`+${category.products.length - 3} mais`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  onClick={() => setSelectedCategory(category)}
                >
                  Ver Detalhes
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {categories?.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhuma categoria cadastrada
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
          const category = categories?.find(c => c.id === menuCategoryId);
          if (category) handleEdit(category);
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
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
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
            label="Descrição"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            placeholder="Descrição da categoria (opcional)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
          >
            {editingCategory ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalhes da categoria */}
      <Dialog
        open={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedCategory && (
          <>
            <DialogTitle>
              {selectedCategory.name}
            </DialogTitle>
            <DialogContent>
              {selectedCategory.description && (
                <Typography variant="body1" gutterBottom>
                  <strong>Descrição:</strong> {selectedCategory.description}
                </Typography>
              )}
              
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Produtos desta categoria:
              </Typography>
              
              {categoryDetails?.products && categoryDetails.products.length > 0 ? (
                <List>
                  {categoryDetails.products.map((product: any) => (
                    <ListItem key={product.id} divider>
                      <Restaurant sx={{ mr: 2 }} />
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {product.name}
                            </Typography>
                            <Chip
                              label={product.available ? 'Disponível' : 'Indisponível'}
                              color={product.available ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {product.description}
                            </Typography>
                            <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                              R$ {product.price.toFixed(2)}
                            </Typography>
                            {product.ingredients && product.ingredients.length > 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Ingredientes: {product.ingredients.map((ing: any) => ing.ingredient.name).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Nenhum produto cadastrado nesta categoria
                  </Typography>
                </Paper>
              )}
              
              <Box mt={3}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total de produtos:</strong> {categoryDetails?.products?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Produtos disponíveis:</strong> {categoryDetails?.products?.filter((p: any) => p.available).length || 0}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedCategory(null)}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}