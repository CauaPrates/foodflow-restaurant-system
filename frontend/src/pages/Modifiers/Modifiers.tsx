import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
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
  FormControlLabel,
  Switch,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Modifier {
  id: string;
  name: string;
  description?: string;
  type: 'ADD' | 'REMOVE' | 'REPLACE';
  price: number;
  available: boolean;
  parentId?: string;
  parent?: Modifier;
  children?: Modifier[];
  createdAt: string;
  updatedAt: string;
}

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

interface ModifierFormData {
  name: string;
  description: string;
  type: 'ADD' | 'REMOVE' | 'REPLACE';
  price: number;
  available: boolean;
  parentId?: string;
}

interface ChildModifierData {
  id?: string;
  name: string;
  description: string;
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

export default function Modifiers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedModifier, setSelectedModifier] = useState<Modifier | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
  const [linkProductOpen, setLinkProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [linkRequired, setLinkRequired] = useState(false);
  const [linkMaxQuantity, setLinkMaxQuantity] = useState<number | ''>('');
  const [selectedParentModifier, setSelectedParentModifier] = useState<string>('');
  const [childModifiers, setChildModifiers] = useState<ChildModifierData[]>([]);
  const [showChildForm, setShowChildForm] = useState(false);
  const [childFormData, setChildFormData] = useState<ChildModifierData>({
    name: '',
    description: '',
    type: 'ADD',
    price: 0,
    available: true
  });

  const [formData, setFormData] = useState<ModifierFormData>({
    name: '',
    description: '',
    type: 'ADD',
    price: 0,
    available: true,
    parentId: undefined
  });

  const { data: modifiers, isLoading: modifiersLoading } = useQuery<Modifier[]>(
    'modifiers',
    async () => {
      const response = await api.get('/modifiers?hierarchical=true');
      return response.data;
    }
  );

  // Query para obter todos os modificadores (incluindo filhos) para o dropdown de seleção de pai
  const { data: allModifiers } = useQuery<Modifier[]>(
    'all-modifiers',
    async () => {
      const response = await api.get('/modifiers');
      return response.data;
    }
  );

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>(
    'products',
    async () => {
      const response = await api.get('/products');
      return response.data;
    }
  );

  const { data: productModifiers } = useQuery<ProductModifier[]>(
    ['product-modifiers', selectedModifier?.id],
    async () => {
      if (!selectedModifier) return [];
      const response = await api.get(`/modifiers/${selectedModifier.id}`);
      return response.data.productModifiers || [];
    },
    { enabled: !!selectedModifier }
  );

  const createModifierMutation = useMutation(
    async (data: ModifierFormData) => {
      const response = await api.post('/modifiers', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Modificador criado com sucesso!');
        queryClient.invalidateQueries('modifiers');
        handleCloseForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao criar modificador');
      }
    }
  );

  const updateModifierMutation = useMutation(
    async ({ id, data }: { id: string; data: Partial<ModifierFormData> }) => {
      const response = await api.put(`/modifiers/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Modificador atualizado com sucesso!');
        queryClient.invalidateQueries('modifiers');
        handleCloseForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar modificador');
      }
    }
  );

  const deleteModifierMutation = useMutation(
    async (id: string) => {
      await api.delete(`/modifiers/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Modificador deletado com sucesso!');
        queryClient.invalidateQueries('modifiers');
        setSelectedModifier(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao deletar modificador');
      }
    }
  );

  const linkProductMutation = useMutation(
    async ({ productId, modifierId, required, maxQuantity }: {
      productId: string;
      modifierId: string;
      required: boolean;
      maxQuantity?: number;
    }) => {
      const response = await api.post(`/modifiers/product/${productId}/modifier/${modifierId}`, {
        required,
        maxQuantity: maxQuantity || null
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Modificador vinculado ao produto com sucesso!');
        queryClient.invalidateQueries(['product-modifiers', selectedModifier?.id]);
        setLinkProductOpen(false);
        setSelectedProduct('');
        setLinkRequired(false);
        setLinkMaxQuantity('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao vincular modificador');
      }
    }
  );

  const unlinkProductMutation = useMutation(
    async ({ productId, modifierId }: { productId: string; modifierId: string }) => {
      await api.delete(`/modifiers/product/${productId}/modifier/${modifierId}`);
    },
    {
      onSuccess: () => {
        toast.success('Modificador desvinculado do produto com sucesso!');
        queryClient.invalidateQueries(['product-modifiers', selectedModifier?.id]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao desvincular modificador');
      }
    }
  );

  const handleOpenForm = (modifier?: Modifier) => {
    if (modifier) {
      setEditingModifier(modifier);
      setSelectedParentModifier(modifier.parentId || '');
      setFormData({
        name: modifier.name,
        description: modifier.description || '',
        type: modifier.type,
        price: modifier.price,
        available: modifier.available,
        parentId: modifier.parentId
      });
      setChildModifiers([]);
    } else {
      setEditingModifier(null);
      setSelectedParentModifier('');
      setFormData({
        name: '',
        description: '',
        type: 'ADD',
        price: 0,
        available: true,
        parentId: undefined
      });
      setChildModifiers([]);
    }
    setShowChildForm(false);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingModifier(null);
    setSelectedParentModifier('');
    setFormData({
      name: '',
      description: '',
      type: 'ADD',
      price: 0,
      available: true,
      parentId: undefined
    });
    setChildModifiers([]);
    setShowChildForm(false);
    setChildFormData({
      name: '',
      description: '',
      type: 'ADD',
      price: 0,
      available: true
    });
  };

  const handleAddChild = () => {
    if (childFormData.name.trim()) {
      setChildModifiers([...childModifiers, { ...childFormData }]);
      setChildFormData({
        name: '',
        description: '',
        type: 'ADD',
        price: 0,
        available: true
      });
      setShowChildForm(false);
    }
  };

  const handleEditChild = (index: number) => {
    const child = childModifiers[index];
    setChildFormData(child);
    setShowChildForm(true);
    // Remove o item temporariamente para edição
    setChildModifiers(childModifiers.filter((_, i) => i !== index));
  };

  const handleRemoveChild = (index: number) => {
    setChildModifiers(childModifiers.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do modificador é obrigatório');
      return;
    }

    try {
      const modifierData = {
        ...formData,
        parentId: selectedParentModifier || undefined
      };

      let parentModifierId: string;

      if (editingModifier) {
        await updateModifierMutation.mutateAsync({
          id: editingModifier.id,
          data: modifierData
        });
        parentModifierId = editingModifier.id;
      } else {
        const createdModifier = await createModifierMutation.mutateAsync(modifierData);
        parentModifierId = createdModifier.id;
      }

      // Criar modificadores filhos se não estiver editando e houver filhos
      if (!editingModifier && childModifiers.length > 0) {
        for (const child of childModifiers) {
          await createModifierMutation.mutateAsync({
            ...child,
            parentId: parentModifierId
          });
        }
      }

      handleCloseForm();
    } catch (error) {
      console.error('Erro ao salvar modificador:', error);
    }
  };

  const handleDelete = (modifier: Modifier) => {
    if (window.confirm(`Tem certeza que deseja deletar o modificador "${modifier.name}"?`)) {
      deleteModifierMutation.mutate(modifier.id);
    }
  };

  const handleLinkProduct = () => {
    if (!selectedProduct || !selectedModifier) {
      toast.error('Selecione um produto');
      return;
    }

    linkProductMutation.mutate({
      productId: selectedProduct,
      modifierId: selectedModifier.id,
      required: linkRequired,
      maxQuantity: linkMaxQuantity ? Number(linkMaxQuantity) : undefined
    });
  };

  const handleUnlinkProduct = (productModifier: ProductModifier) => {
    if (window.confirm('Tem certeza que deseja desvincular este modificador do produto?')) {
      unlinkProductMutation.mutate({
        productId: productModifier.productId,
        modifierId: productModifier.modifierId
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ADD': return 'Adicionar';
      case 'REMOVE': return 'Remover';
      case 'REPLACE': return 'Substituir';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ADD': return 'success';
      case 'REMOVE': return 'error';
      case 'REPLACE': return 'warning';
      default: return 'default';
    }
  };

  // Função para renderizar modificadores de forma hierárquica
  const renderModifierRows = (modifiers: Modifier[], level = 0): JSX.Element[] => {
    const rows: JSX.Element[] = [];
    
    modifiers.forEach((modifier) => {
      rows.push(
        <TableRow 
          key={modifier.id}
          hover
          onClick={() => setSelectedModifier(modifier)}
          sx={{ cursor: 'pointer', backgroundColor: selectedModifier?.id === modifier.id ? 'action.selected' : 'inherit' }}
        >
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: level * 3 }}>
              {level > 0 && (
                <Box sx={{ mr: 1, color: 'text.secondary' }}>└─</Box>
              )}
              <Box>
                <Typography variant="subtitle2">{modifier.name}</Typography>
                {modifier.description && (
                  <Typography variant="body2" color="text.secondary">
                    {modifier.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </TableCell>
          <TableCell>
            <Chip
              label={getTypeLabel(modifier.type)}
              color={getTypeColor(modifier.type) as any}
              size="small"
            />
          </TableCell>
          <TableCell>
            R$ {modifier.price.toFixed(2)}
          </TableCell>
          <TableCell>
            <Chip
              label={modifier.available ? 'Disponível' : 'Indisponível'}
              color={modifier.available ? 'success' : 'error'}
              size="small"
            />
          </TableCell>
          <TableCell>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenForm(modifier);
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(modifier);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      );
      
      // Renderizar filhos recursivamente
      if (modifier.children && modifier.children.length > 0) {
        rows.push(...renderModifierRows(modifier.children, level + 1));
      }
    });
    
    return rows;
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Acesso negado. Apenas administradores e gerentes podem gerenciar modificadores.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Modificadores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Novo Modificador
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedModifier ? 8 : 12}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Preço</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modifiersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : modifiers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Nenhum modificador encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    renderModifierRows(modifiers || [])
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {selectedModifier && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedModifier.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedModifier.description || 'Sem descrição'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Tipo:</strong> {getTypeLabel(selectedModifier.type)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Preço:</strong> R$ {selectedModifier.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedModifier.available ? 'Disponível' : 'Indisponível'}
                  </Typography>
                  {selectedModifier.parent && (
                    <Typography variant="body2">
                      <strong>Modificador Pai:</strong> {selectedModifier.parent.name}
                    </Typography>
                  )}
                  {selectedModifier.children && selectedModifier.children.length > 0 && (
                    <Typography variant="body2">
                      <strong>Variações:</strong> {selectedModifier.children.length} item(s)
                    </Typography>
                  )}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<LinkIcon />}
                  onClick={() => setLinkProductOpen(true)}
                >
                  Vincular Produto
                </Button>
              </CardActions>
              <Divider />
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Produtos Vinculados
                </Typography>
                {productModifiers?.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum produto vinculado
                  </Typography>
                ) : (
                  productModifiers?.map((pm) => {
                    const product = products?.find(p => p.id === pm.productId);
                    return (
                      <Box key={pm.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box>
                          <Typography variant="body2">
                            {product?.name || 'Produto não encontrado'}
                          </Typography>
                          {pm.required && (
                            <Chip label="Obrigatório" size="small" color="warning" sx={{ mr: 1 }} />
                          )}
                          {pm.maxQuantity && (
                            <Chip label={`Máx: ${pm.maxQuantity}`} size="small" color="info" />
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleUnlinkProduct(pm)}
                        >
                          <LinkOffIcon />
                        </IconButton>
                      </Box>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog para criar/editar modificador */}
      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingModifier ? 'Editar Modificador' : 'Novo Modificador'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Modificador Pai (Opcional)</InputLabel>
              <Select
                value={selectedParentModifier}
                onChange={(e) => setSelectedParentModifier(e.target.value)}
                label="Modificador Pai (Opcional)"
              >
                <MenuItem value="">
                  <em>Nenhum (Modificador Principal)</em>
                </MenuItem>
                {allModifiers?.filter(m => m.id !== editingModifier?.id && !m.parentId).map((modifier) => (
                  <MenuItem key={modifier.id} value={modifier.id}>
                    {modifier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ADD' | 'REMOVE' | 'REPLACE' })}
                label="Tipo"
              >
                <MenuItem value="ADD">Adicionar</MenuItem>
                <MenuItem value="REMOVE">Remover</MenuItem>
                <MenuItem value="REPLACE">Substituir</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Preço"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
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
            
            {/* Seção de Modificadores Filhos - apenas para novos modificadores sem pai */}
            {!editingModifier && !selectedParentModifier && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Modificadores Filhos</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowChildForm(true)}
                    startIcon={<AddIcon />}
                  >
                    Adicionar Filho
                  </Button>
                </Box>
                
                {/* Lista de filhos adicionados */}
                {childModifiers.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {childModifiers.map((child, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: 1, p: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{child.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {child.type} - R$ {child.price.toFixed(2)} - {child.available ? 'Disponível' : 'Indisponível'}
                            </Typography>
                            {child.description && (
                              <Typography variant="caption" display="block">{child.description}</Typography>
                            )}
                          </Box>
                          <Box>
                            <IconButton size="small" onClick={() => handleEditChild(index)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleRemoveChild(index)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
                
                {/* Formulário para adicionar/editar filho */}
                {showChildForm && (
                  <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {childFormData.name ? 'Editar' : 'Adicionar'} Modificador Filho
                    </Typography>
                    <TextField
                      fullWidth
                      label="Nome"
                      value={childFormData.name}
                      onChange={(e) => setChildFormData({ ...childFormData, name: e.target.value })}
                      margin="dense"
                      size="small"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Descrição"
                      value={childFormData.description}
                      onChange={(e) => setChildFormData({ ...childFormData, description: e.target.value })}
                      margin="dense"
                      size="small"
                      multiline
                      rows={2}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          value={childFormData.type}
                          onChange={(e) => setChildFormData({ ...childFormData, type: e.target.value as 'ADD' | 'REMOVE' | 'REPLACE' })}
                          label="Tipo"
                        >
                          <MenuItem value="ADD">Adicionar</MenuItem>
                          <MenuItem value="REMOVE">Remover</MenuItem>
                          <MenuItem value="REPLACE">Substituir</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Preço"
                        type="number"
                        value={childFormData.price}
                        onChange={(e) => setChildFormData({ ...childFormData, price: Number(e.target.value) })}
                        size="small"
                        sx={{ width: 100 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={childFormData.available}
                            onChange={(e) => setChildFormData({ ...childFormData, available: e.target.checked })}
                            size="small"
                          />
                        }
                        label="Disponível"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAddChild}
                        disabled={!childFormData.name.trim()}
                      >
                        {childFormData.name ? 'Atualizar' : 'Adicionar'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setShowChildForm(false);
                          setChildFormData({
                            name: '',
                            description: '',
                            type: 'ADD',
                            price: 0,
                            available: true
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </Card>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createModifierMutation.isLoading || updateModifierMutation.isLoading}
          >
            {editingModifier ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para vincular produto */}
      <Dialog open={linkProductOpen} onClose={() => setLinkProductOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Vincular Produto</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Produto</InputLabel>
              <Select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                label="Produto"
              >
                {products?.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} - R$ {product.price.toFixed(2)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={linkRequired}
                  onChange={(e) => setLinkRequired(e.target.checked)}
                />
              }
              label="Modificador obrigatório"
              sx={{ mt: 2, display: 'block' }}
            />
            <TextField
              fullWidth
              label="Quantidade máxima (opcional)"
              type="number"
              value={linkMaxQuantity}
              onChange={(e) => setLinkMaxQuantity(e.target.value ? Number(e.target.value) : '')}
              margin="normal"
              inputProps={{ min: 1 }}
              helperText="Deixe em branco para quantidade ilimitada"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkProductOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleLinkProduct}
            variant="contained"
            disabled={linkProductMutation.isLoading}
          >
            Vincular
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}