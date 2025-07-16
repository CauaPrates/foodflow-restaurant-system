import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
  category: {
    id: string;
    name: string;
  };
}



interface OrderItem {
  productId: string;
  quantity: number;
  product?: Product;
}

interface NewOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewOrderDialog({ open, onClose, onSuccess }: NewOrderDialogProps) {
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [observations, setObservations] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');



  const { data: products, isLoading: productsLoading } = useQuery<Product[]>(
    'products',
    async () => {
      const response = await api.get('/products');
      return response.data;
    },
    { enabled: open }
  );

  const { data: categories } = useQuery(
    'categories',
    async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    { enabled: open }
  );

  const createOrderMutation = useMutation(
    async (orderData: any) => {
      await api.post('/orders', orderData);
    },
    {
      onSuccess: () => {
        toast.success('Pedido criado com sucesso!');
        handleClose();
        onSuccess();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao criar pedido');
      },
    }
  );

  const handleClose = () => {
    setCustomerName('');
    setTableNumber('');
    setObservations('');
    setOrderItems([]);
    setSelectedCategory('');
    onClose();
  };

  const addProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      setOrderItems(items =>
        items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems(items => [
        ...items,
        { productId: product.id, quantity: 1, product }
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    
    setOrderItems(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeProduct = (productId: string) => {
    setOrderItems(items => items.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleSubmit = () => {
    if (!customerName.trim()) {
      toast.error('Digite o nome do cliente');
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido');
      return;
    }

    const orderData = {
      customerName: customerName.trim(),
      tableNumber: tableNumber.trim() || undefined,
      observations,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    createOrderMutation.mutate(orderData);
  };

  const filteredProducts = products?.filter(product => {
    if (!selectedCategory) return product.available;
    return product.available && product.category.id === selectedCategory;
  }) || [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Novo Pedido</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Nome do Cliente */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome do Cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              margin="normal"
              required
              placeholder="Digite o nome do cliente"
            />
          </Grid>

          {/* Número da Mesa (Opcional) */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Número da Mesa (Opcional)"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              margin="normal"
              placeholder="Ex: 1, 2, 3..."
            />
          </Grid>

          {/* Filtro por Categoria */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Categoria"
              >
                <MenuItem value="">Todas as categorias</MenuItem>
                {categories?.map((category: any) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Lista de Produtos */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Produtos Disponíveis
            </Typography>
            {productsLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Grid container spacing={1}>
                  {filteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} key={product.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => addProduct(product)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            R$ {product.price.toFixed(2)}
                          </Typography>
                          <Chip
                            label={product.category.name}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>

          {/* Carrinho */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Itens do Pedido
            </Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {orderItems.length === 0 ? (
                <Typography color="text.secondary" align="center">
                  Nenhum item adicionado
                </Typography>
              ) : (
                orderItems.map((item) => (
                  <Card key={item.productId} sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box flex={1}>
                          <Typography variant="subtitle2">
                            {item.product?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            R$ {item.product?.price.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Remove />
                          </IconButton>
                          <Typography sx={{ mx: 1 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Add />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeProduct(item.productId)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="primary" align="right">
                        Subtotal: R$ {((item.product?.price || 0) * item.quantity).toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
            
            {orderItems.length > 0 && (
              <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
                <Typography variant="h6" color="primary.contrastText">
                  Total: R$ {calculateTotal().toFixed(2)}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Observações */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observações"
              multiline
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações especiais para o pedido..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createOrderMutation.isLoading || !customerName.trim() || orderItems.length === 0}
        >
          {createOrderMutation.isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Criar Pedido'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}