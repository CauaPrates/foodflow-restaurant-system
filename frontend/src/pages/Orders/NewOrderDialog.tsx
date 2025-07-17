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
  Checkbox,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
} from '@mui/material';
import { Add, Remove, Delete, Tune } from '@mui/icons-material';
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

interface Modifier {
  id: string;
  name: string;
  description?: string;
  type: 'ADD' | 'REMOVE' | 'REPLACE';
  price: number;
  available: boolean;
}

interface ProductModifier {
  id: string;
  productId: string;
  modifierId: string;
  required: boolean;
  maxQuantity?: number;
  modifier: Modifier;
}

interface OrderItemModifier {
  modifierId: string;
  quantity: number;
  price: number;
  modifier?: Modifier;
}

interface OrderItem {
  productId: string;
  quantity: number;
  observations?: string;
  modifiers: OrderItemModifier[];
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
  const [modifierDialogOpen, setModifierDialogOpen] = useState(false);
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<Product | null>(null);
  const [productModifiers, setProductModifiers] = useState<ProductModifier[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<OrderItemModifier[]>([]);
  const [itemObservations, setItemObservations] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [availableModifiers, setAvailableModifiers] = useState<ProductModifier[]>([]);
  const [currentModifiers, setCurrentModifiers] = useState<OrderItemModifier[]>([]);



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

  const fetchProductModifiers = async (productId: string) => {
    try {
      const response = await api.get(`/modifiers/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar modificadores:', error);
      return [];
    }
  };

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
    setModifierDialogOpen(false);
    setSelectedProductForModifiers(null);
    setProductModifiers([]);
    setSelectedModifiers([]);
    setItemObservations('');
    setSelectedProduct(null);
    setAvailableModifiers([]);
    setCurrentModifiers([]);
    onClose();
  };

  const selectProduct = async (product: Product) => {
    // Buscar modificadores do produto
    const modifiers = await fetchProductModifiers(product.id);
    
    setSelectedProduct(product);
    setAvailableModifiers(modifiers);
    setCurrentModifiers([]);
    setItemObservations('');
  };

  const addProduct = async (product: Product) => {
    // Buscar modificadores do produto
    const modifiers = await fetchProductModifiers(product.id);
    
    if (modifiers.length > 0) {
      // Se há modificadores, abrir dialog de seleção
      setSelectedProductForModifiers(product);
      setProductModifiers(modifiers);
      setSelectedModifiers([]);
      setItemObservations('');
      setEditingItemIndex(null);
      setModifierDialogOpen(true);
    } else {
      // Se não há modificadores, adicionar diretamente
      addProductToOrder(product, [], '');
    }
  };

  const addSelectedProductToOrder = () => {
    if (selectedProduct) {
      addProductToOrder(selectedProduct, currentModifiers, itemObservations);
      setSelectedProduct(null);
      setAvailableModifiers([]);
      setCurrentModifiers([]);
      setItemObservations('');
    }
  };

  const handleCurrentModifierChange = (modifier: Modifier, checked: boolean, quantity: number = 1) => {
    if (checked) {
      setCurrentModifiers(prev => [
        ...prev.filter(m => m.modifierId !== modifier.id),
        {
          modifierId: modifier.id,
          quantity,
          price: modifier.price,
          modifier
        }
      ]);
    } else {
      setCurrentModifiers(prev => prev.filter(m => m.modifierId !== modifier.id));
    }
  };

  const handleCurrentModifierQuantityChange = (modifierId: string, quantity: number) => {
    if (quantity <= 0) {
      setCurrentModifiers(prev => prev.filter(m => m.modifierId !== modifierId));
      return;
    }
    
    setCurrentModifiers(prev =>
      prev.map(m =>
        m.modifierId === modifierId
          ? { ...m, quantity }
          : m
      )
    );
  };

  const editItemModifiers = async (item: OrderItem) => {
    // Buscar modificadores do produto
    const modifiers = await fetchProductModifiers(item.productId);
    
    if (modifiers.length > 0) {
      // Encontrar o índice do item no array
      const itemIndex = orderItems.findIndex(orderItem => orderItem.productId === item.productId);
      
      // Buscar o produto para ter as informações completas
      const product = products?.find(p => p.id === item.productId);
      
      if (product && itemIndex !== -1) {
        setSelectedProductForModifiers(product);
        setProductModifiers(modifiers);
        setSelectedModifiers(item.modifiers || []);
        setItemObservations(item.observations || '');
        setEditingItemIndex(itemIndex);
        setModifierDialogOpen(true);
      }
    }
  };

  const addProductToOrder = (product: Product, modifiers: OrderItemModifier[], itemObs: string) => {
    const existingItemIndex = orderItems.findIndex(item => 
      item.productId === product.id && 
      JSON.stringify(item.modifiers) === JSON.stringify(modifiers) &&
      item.observations === itemObs
    );
    
    if (existingItemIndex >= 0) {
      setOrderItems(items =>
        items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems(items => [
        ...items,
        { 
          productId: product.id, 
          quantity: 1, 
          observations: itemObs,
          modifiers,
          product 
        }
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
      const productPrice = item.product?.price || 0;
      const modifiersPrice = item.modifiers.reduce((modTotal, mod) => {
        return modTotal + (mod.price * mod.quantity);
      }, 0);
      return total + (productPrice + modifiersPrice) * item.quantity;
    }, 0);
  };

  const handleModifierChange = (modifier: Modifier, checked: boolean, quantity: number = 1) => {
    if (checked) {
      setSelectedModifiers(prev => [
        ...prev.filter(m => m.modifierId !== modifier.id),
        {
          modifierId: modifier.id,
          quantity,
          price: modifier.price,
          modifier
        }
      ]);
    } else {
      setSelectedModifiers(prev => prev.filter(m => m.modifierId !== modifier.id));
    }
  };

  const handleModifierQuantityChange = (modifierId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedModifiers(prev => prev.filter(m => m.modifierId !== modifierId));
      return;
    }
    
    setSelectedModifiers(prev =>
      prev.map(m =>
        m.modifierId === modifierId
          ? { ...m, quantity }
          : m
      )
    );
  };

  const handleConfirmModifiers = () => {
    if (selectedProductForModifiers) {
      if (editingItemIndex !== null) {
        // Editando item existente
        const updatedItems = [...orderItems];
        updatedItems[editingItemIndex] = {
          ...updatedItems[editingItemIndex],
          modifiers: selectedModifiers,
          observations: itemObservations
        };
        setOrderItems(updatedItems);
      } else {
        // Adicionando novo item
        addProductToOrder(selectedProductForModifiers, selectedModifiers, itemObservations);
      }
      
      setModifierDialogOpen(false);
      setSelectedProductForModifiers(null);
      setProductModifiers([]);
      setSelectedModifiers([]);
      setItemObservations('');
      setEditingItemIndex(null);
    }
  };

  const getItemDisplayName = (item: OrderItem) => {
    let name = item.product?.name || '';
    if (item.modifiers.length > 0) {
      const modifierNames = item.modifiers
        .filter(m => m.modifier?.name) // Filtrar apenas modificadores com nome
        .map(m => `${m.modifier?.name} (${m.quantity}x)`)
        .join(', ');
      if (modifierNames) {
        name += ` + ${modifierNames}`;
      }
    }
    if (item.observations) {
      name += ` - ${item.observations}`;
    }
    return name;
  };

  const getItemPrice = (item: OrderItem) => {
    const productPrice = item.product?.price || 0;
    const modifiersPrice = item.modifiers.reduce((total, mod) => {
      return total + (mod.price * mod.quantity);
    }, 0);
    return productPrice + modifiersPrice;
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
        quantity: item.quantity,
        observations: item.observations,
        modifiers: item.modifiers.map(mod => ({
          modifierId: mod.modifierId,
          quantity: mod.quantity,
          price: mod.price
        }))
      }))
    };

    createOrderMutation.mutate(orderData);
  };

  const filteredProducts = products?.filter(product => {
    if (!selectedCategory) return product.available;
    return product.available && product.category.id === selectedCategory;
  }) || [];

  return (
    <>
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
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
                        onClick={() => selectProduct(product)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1}>
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
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectProduct(product);
                              }}
                            >
                              <Tune fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>

          {/* Produto Selecionado e Modificadores */}
          {selectedProduct && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Produto Selecionado: {selectedProduct.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  R$ {selectedProduct.price.toFixed(2)}
                </Typography>
                
                {availableModifiers.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Modificadores Disponíveis:
                    </Typography>
                    <List dense>
                      {availableModifiers.map((productModifier) => {
                        const modifier = productModifier.modifier;
                        const selectedModifier = currentModifiers.find(m => m.modifierId === modifier?.id);
                        const isSelected = !!selectedModifier;
                        
                        // Verificar se o modifier existe e tem nome
                        if (!modifier || !modifier.name) {
                          return null;
                        }
                        
                        return (
                          <ListItem key={productModifier.id} divider>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body2">
                                    {modifier.name}
                                  </Typography>
                                  {productModifier.required && (
                                    <Chip label="Obrigatório" size="small" color="warning" />
                                  )}
                                  <Chip 
                                    label={modifier.type === 'ADD' ? 'Adicionar' : modifier.type === 'REMOVE' ? 'Remover' : 'Substituir'}
                                    size="small"
                                    color={modifier.type === 'ADD' ? 'success' : modifier.type === 'REMOVE' ? 'error' : 'warning'}
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="primary">
                                  {modifier.price > 0 ? `+R$ ${modifier.price.toFixed(2)}` : 
                                   modifier.price < 0 ? `-R$ ${Math.abs(modifier.price).toFixed(2)}` : 'Gratuito'}
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box display="flex" alignItems="center" gap={1}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={(e) => handleCurrentModifierChange(modifier, e.target.checked)}
                                    />
                                  }
                                  label=""
                                />
                                {isSelected && (
                                  <Box display="flex" alignItems="center">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCurrentModifierQuantityChange(modifier.id, (selectedModifier?.quantity || 1) - 1)}
                                      disabled={(selectedModifier?.quantity || 1) <= 1}
                                    >
                                      <Remove />
                                    </IconButton>
                                    <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>
                                      {selectedModifier?.quantity || 1}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCurrentModifierQuantityChange(modifier.id, (selectedModifier?.quantity || 1) + 1)}
                                      disabled={productModifier.maxQuantity ? (selectedModifier?.quantity || 1) >= productModifier.maxQuantity : false}
                                    >
                                      <Add />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                )}
                
                <TextField
                  fullWidth
                  label="Observações para este item (opcional)"
                  multiline
                  rows={2}
                  value={itemObservations}
                  onChange={(e) => setItemObservations(e.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne, etc..."
                  sx={{ mt: 2 }}
                />
                
                {currentModifiers.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Modificadores selecionados:
                    </Typography>
                    {currentModifiers.map((mod) => (
                      <Typography key={mod.modifierId} variant="body2">
                        • {mod.modifier?.name} ({mod.quantity}x) - 
                        {mod.price > 0 ? `+R$ ${(mod.price * mod.quantity).toFixed(2)}` : 
                         mod.price < 0 ? `-R$ ${Math.abs(mod.price * mod.quantity).toFixed(2)}` : 'Gratuito'}
                      </Typography>
                    ))}
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>
                      Total: R$ {(selectedProduct.price + currentModifiers.reduce((total, mod) => total + (mod.price * mod.quantity), 0)).toFixed(2)}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedProduct(null);
                      setAvailableModifiers([]);
                      setCurrentModifiers([]);
                      setItemObservations('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={addSelectedProductToOrder}
                  >
                    Adicionar ao Pedido
                  </Button>
                </Box>
              </Paper>
            </Grid>
          )}

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
                            {getItemDisplayName(item)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            R$ {getItemPrice(item).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <IconButton
                            size="small"
                            onClick={() => editItemModifiers(item)}
                            title="Editar modificadores"
                          >
                            <Tune />
                          </IconButton>
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
                        Subtotal: R$ {(getItemPrice(item) * item.quantity).toFixed(2)}
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

    {/* Dialog para seleção de modificadores */}
    <Dialog 
      open={modifierDialogOpen} 
      onClose={() => setModifierDialogOpen(false)} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        {editingItemIndex !== null ? 'Editar modificadores' : 'Modificadores'} para {selectedProductForModifiers?.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Selecione os modificadores desejados para este produto:
          </Typography>
        </Box>
        
        <List>
          {productModifiers.map((productModifier) => {
            const modifier = productModifier.modifier;
            const selectedModifier = selectedModifiers.find(m => m.modifierId === modifier?.id);
            const isSelected = !!selectedModifier;
            
            // Verificar se o modifier existe e tem nome
            if (!modifier || !modifier.name) {
              return null;
            }
            
            return (
              <ListItem key={productModifier.id} divider>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2">
                        {modifier.name}
                      </Typography>
                      {productModifier.required && (
                        <Chip label="Obrigatório" size="small" color="warning" />
                      )}
                      <Chip 
                        label={modifier.type === 'ADD' ? 'Adicionar' : modifier.type === 'REMOVE' ? 'Remover' : 'Substituir'}
                        size="small"
                        color={modifier.type === 'ADD' ? 'success' : modifier.type === 'REMOVE' ? 'error' : 'warning'}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      {modifier.description && (
                        <Typography variant="body2" color="text.secondary">
                          {modifier.description}
                        </Typography>
                      )}
                      <Typography variant="body2" color="primary">
                        {modifier.price > 0 ? `+R$ ${modifier.price.toFixed(2)}` : 
                         modifier.price < 0 ? `-R$ ${Math.abs(modifier.price).toFixed(2)}` : 'Gratuito'}
                      </Typography>
                      {productModifier.maxQuantity && (
                        <Typography variant="caption" color="text.secondary">
                          Máximo: {productModifier.maxQuantity}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleModifierChange(modifier, e.target.checked)}
                        />
                      }
                      label=""
                    />
                    {isSelected && (
                      <Box display="flex" alignItems="center">
                        <IconButton
                          size="small"
                          onClick={() => handleModifierQuantityChange(modifier.id, (selectedModifier?.quantity || 1) - 1)}
                          disabled={(selectedModifier?.quantity || 1) <= 1}
                        >
                          <Remove />
                        </IconButton>
                        <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>
                          {selectedModifier?.quantity || 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleModifierQuantityChange(modifier.id, (selectedModifier?.quantity || 1) + 1)}
                          disabled={productModifier.maxQuantity ? (selectedModifier?.quantity || 1) >= productModifier.maxQuantity : false}
                        >
                          <Add />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <TextField
          fullWidth
          label="Observações para este item (opcional)"
          multiline
          rows={2}
          value={itemObservations}
          onChange={(e) => setItemObservations(e.target.value)}
          placeholder="Ex: sem cebola, ponto da carne, etc..."
        />
        
        {selectedModifiers.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Modificadores selecionados:
            </Typography>
            {selectedModifiers.map((mod) => (
              <Typography key={mod.modifierId} variant="body2">
                • {mod.modifier?.name} ({mod.quantity}x) - 
                {mod.price > 0 ? `+R$ ${(mod.price * mod.quantity).toFixed(2)}` : 
                 mod.price < 0 ? `-R$ ${Math.abs(mod.price * mod.quantity).toFixed(2)}` : 'Gratuito'}
              </Typography>
            ))}
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Total dos modificadores: R$ {selectedModifiers.reduce((total, mod) => total + (mod.price * mod.quantity), 0).toFixed(2)}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setModifierDialogOpen(false)}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmModifiers}
          variant="contained"
        >
          {editingItemIndex !== null ? 'Salvar Alterações' : 'Adicionar ao Pedido'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}