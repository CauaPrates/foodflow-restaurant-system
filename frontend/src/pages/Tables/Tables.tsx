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
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  TableRestaurant,
  Receipt,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: string;
  activeOrders?: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
}

interface TableFormData {
  number: number;
  capacity: number;
  status: string;
}

export default function Tables() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTableId, setMenuTableId] = useState<string | null>(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [formData, setFormData] = useState<TableFormData>({
    number: 0,
    capacity: 4,
    status: 'AVAILABLE'
  });
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tables, isLoading, refetch } = useQuery<Table[]>(
    'tables',
    async () => {
      const response = await api.get('/tables');
      return response.data;
    }
  );

  const createTableMutation = useMutation(
    async (tableData: Omit<TableFormData, 'status'>) => {
      await api.post('/tables', tableData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tables');
        toast.success('Mesa criada com sucesso!');
        handleFormClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao criar mesa');
      },
    }
  );

  const updateTableMutation = useMutation(
    async ({ id, data }: { id: string; data: Partial<TableFormData> }) => {
      await api.put(`/tables/${id}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tables');
        toast.success('Mesa atualizada com sucesso!');
        handleFormClose();
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar mesa');
      },
    }
  );

  const deleteTableMutation = useMutation(
    async (tableId: string) => {
      await api.delete(`/tables/${tableId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tables');
        toast.success('Mesa excluída com sucesso!');
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao excluir mesa');
      },
    }
  );

  const updateStatusMutation = useMutation(
    async ({ tableId, status }: { tableId: string; status: string }) => {
      await api.patch(`/tables/${tableId}/status`, { status });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tables');
        toast.success('Status da mesa atualizado!');
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar status');
      },
    }
  );

  const getBillMutation = useMutation(
    async (tableId: string) => {
      const response = await api.get(`/tables/${tableId}/bill`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setBillData(data);
        setBillDialogOpen(true);
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao gerar conta');
      },
    }
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, tableId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuTableId(tableId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTableId(null);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTable(null);
    setFormData({ number: 0, capacity: 4, status: 'AVAILABLE' });
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      capacity: table.capacity,
      status: table.status
    });
    setFormOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuTableId) {
      deleteTableMutation.mutate(menuTableId);
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (menuTableId) {
      updateStatusMutation.mutate({ tableId: menuTableId, status });
    }
  };

  const handleGetBill = () => {
    if (menuTableId) {
      getBillMutation.mutate(menuTableId);
    }
  };

  const handleSubmit = () => {
    if (editingTable) {
      updateTableMutation.mutate({
        id: editingTable.id,
        data: formData
      });
    } else {
      createTableMutation.mutate({
        number: formData.number,
        capacity: formData.capacity
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'OCCUPIED': return 'warning';
      case 'RESERVED': return 'info';
      case 'MAINTENANCE': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Disponível';
      case 'OCCUPIED': return 'Ocupada';
      case 'RESERVED': return 'Reservada';
      case 'MAINTENANCE': return 'Manutenção';
      default: return status;
    }
  };

  const canManageTables = user?.role === 'ADMIN';
  const canUpdateStatus = user?.role === 'ADMIN' || user?.role === 'GARCOM';

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
          Mesas
        </Typography>
        {canManageTables && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setFormOpen(true)}
          >
            Nova Mesa
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {tables?.map((table) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center">
                    <TableRestaurant sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Mesa {table.number}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Chip
                      label={getStatusText(table.status)}
                      color={getStatusColor(table.status) as any}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, table.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Capacidade: {table.capacity} pessoas
                </Typography>
                
                {table.activeOrders && table.activeOrders.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pedidos Ativos:
                    </Typography>
                    {table.activeOrders.map((order) => (
                      <Box key={order.id} display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          #{order.id.slice(-6)}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          R$ {order.total.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  onClick={() => setSelectedTable(table)}
                >
                  Ver Detalhes
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {tables?.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhuma mesa cadastrada
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
        {canManageTables && (
          <MenuItem onClick={() => {
            const table = tables?.find(t => t.id === menuTableId);
            if (table) handleEdit(table);
          }}>
            <Edit sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        
        {canUpdateStatus && (
          <>
            <MenuItem onClick={() => handleStatusUpdate('AVAILABLE')}>
              <CheckCircle sx={{ mr: 1 }} />
              Marcar como Disponível
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate('OCCUPIED')}>
              <TableRestaurant sx={{ mr: 1 }} />
              Marcar como Ocupada
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate('RESERVED')}>
              Reservar
            </MenuItem>
            <MenuItem onClick={() => handleStatusUpdate('MAINTENANCE')}>
              Manutenção
            </MenuItem>
          </>
        )}
        
        <MenuItem onClick={handleGetBill}>
          <Receipt sx={{ mr: 1 }} />
          Gerar Conta
        </MenuItem>
        
        {canManageTables && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1 }} />
            Excluir
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de formulário */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTable ? 'Editar Mesa' : 'Nova Mesa'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Número da Mesa"
            type="number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Capacidade"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
            margin="normal"
          />
          {editingTable && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="AVAILABLE">Disponível</MenuItem>
                <MenuItem value="OCCUPIED">Ocupada</MenuItem>
                <MenuItem value="RESERVED">Reservada</MenuItem>
                <MenuItem value="MAINTENANCE">Manutenção</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createTableMutation.isLoading || updateTableMutation.isLoading}
          >
            {editingTable ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalhes da mesa */}
      <Dialog
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTable && (
          <>
            <DialogTitle>
              Mesa {selectedTable.number}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {getStatusText(selectedTable.status)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Capacidade:</strong> {selectedTable.capacity} pessoas
              </Typography>
              
              {selectedTable.activeOrders && selectedTable.activeOrders.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Pedidos Ativos:
                  </Typography>
                  {selectedTable.activeOrders.map((order) => (
                    <Box key={order.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="subtitle2">
                        Pedido #{order.id.slice(-6)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {order.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Data: {new Date(order.createdAt).toLocaleString('pt-BR')}
                      </Typography>
                      <Typography variant="body1" color="primary">
                        Total: R$ {order.total.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTable(null)}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog da conta */}
      <Dialog
        open={billDialogOpen}
        onClose={() => setBillDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Conta da Mesa
        </DialogTitle>
        <DialogContent>
          {billData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Mesa {billData.table.number}
              </Typography>
              
              {billData.orders.map((order: any) => (
                <Box key={order.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Pedido #{order.id.slice(-6)} - {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </Typography>
                  {order.items.map((item: any) => (
                    <Box key={item.id} display="flex" justifyContent="space-between">
                      <Typography variant="body2">
                        {item.quantity}x {item.product.name}
                      </Typography>
                      <Typography variant="body2">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))}
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h6" color="primary.contrastText">
                  Total Geral: R$ {billData.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBillDialogOpen(false)}>
            Fechar
          </Button>
          <Button variant="contained" onClick={() => window.print()}>
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}