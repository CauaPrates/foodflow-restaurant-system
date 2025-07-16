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
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Fab,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Kitchen,
  CheckCircle,
  Cancel,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import NewOrderDialog from './NewOrderDialog';

interface Order {
  id: string;
  orderNumber?: number;
  customerName?: string;
  tableNumber?: string;
  user: { name: string };
  status: string;
  total: number;
  observations?: string;
  createdAt: string;
  dayFinalized?: boolean;
  items: Array<{
    id: string;
    product: { name: string; price: number };
    quantity: number;
    price: number;
  }>;
}

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOrderId, setMenuOrderId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders, isLoading, refetch } = useQuery<Order[]>(
    'orders',
    async () => {
      const response = await api.get('/orders');
      return response.data;
    },
    {
      refetchInterval: 5000, // Atualizar a cada 5 segundos
      cacheTime: 0, // Não fazer cache dos dados
      staleTime: 0, // Considerar dados sempre desatualizados
    }
  );

  const updateStatusMutation = useMutation(
    async ({ orderId, status }: { orderId: string; status: string }) => {
      await api.patch(`/orders/${orderId}/status`, { status });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Status do pedido atualizado!');
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar pedido');
      },
    }
  );

  const cancelOrderMutation = useMutation(
    async (orderId: string) => {
      await api.delete(`/orders/${orderId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Pedido cancelado!');
        handleMenuClose();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao cancelar pedido');
      },
    }
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuOrderId(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrderId(null);
  };

  const handleStatusUpdate = (status: string) => {
    if (menuOrderId) {
      updateStatusMutation.mutate({ orderId: menuOrderId, status });
    }
  };

  const handleCancelOrder = () => {
    if (menuOrderId) {
      cancelOrderMutation.mutate(menuOrderId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'PREPARING': return 'info';
      case 'READY': return 'success';
      case 'DELIVERED': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'PREPARING': return 'Preparando';
      case 'READY': return 'Pronto';
      case 'DELIVERED': return 'Entregue';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const canUpdateStatus = (order: Order) => {
    if (user?.role === 'ADMIN') return true;
    if (user?.role === 'GARCOM') return true;
    return false;
  };

  const getAvailableStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return user?.role === 'GARCOM' || user?.role === 'ADMIN' ? ['PREPARING'] : [];
      case 'PREPARING':
        return user?.role === 'GARCOM' || user?.role === 'ADMIN' ? ['READY'] : [];
      case 'READY':
        return user?.role === 'GARCOM' || user?.role === 'ADMIN' ? ['DELIVERED'] : [];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const activeOrders = orders?.filter(order => 
    ['PENDING', 'PREPARING', 'READY'].includes(order.status)
  ) || [];

  const completedOrders = orders?.filter(order => 
    ['DELIVERED', 'CANCELLED'].includes(order.status)
  ) || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Pedidos
        </Typography>
        <Box>
          <Button
            startIcon={<Refresh />}
            onClick={() => refetch()}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Pedidos Ativos */}
      <Typography variant="h6" gutterBottom>
        Pedidos Ativos ({activeOrders.length})
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {activeOrders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6">
                      Pedido #{order.orderNumber ? order.orderNumber.toString().padStart(3, '0') : order.id.slice(-4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.customerName || 'Cliente não informado'}
                    </Typography>
                    {order.tableNumber && (
                      <Typography variant="body2" color="text.secondary">
                        Mesa: {order.tableNumber}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Chip
                      label={getStatusText(order.status)}
                      color={getStatusColor(order.status) as any}
                      size="small"
                    />
                    {canUpdateStatus(order) && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, order.id)}
                      >
                        <MoreVert />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Funcionário: {order.user.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </Typography>
                
                <Box mt={2}>
                  {order.items?.map((item) => (
                    <Typography key={item.id} variant="body2">
                      {item.quantity}x {item.product.name}
                    </Typography>
                  ))}
                </Box>
                
                {order.observations && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Obs: {order.observations}
                  </Typography>
                )}
                
                <Typography variant="h6" color="primary" mt={2}>
                  Total: R$ {order.total.toFixed(2)}
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  onClick={() => setSelectedOrder(order)}
                >
                  Ver Detalhes
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {activeOrders.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhum pedido ativo no momento
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Pedidos Concluídos */}
      <Typography variant="h6" gutterBottom>
        Pedidos Concluídos ({completedOrders.slice(0, 10).length})
      </Typography>
      <Grid container spacing={2}>
        {completedOrders.slice(0, 10).map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card sx={{ opacity: 0.8 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6">
                      Pedido #{order.orderNumber ? order.orderNumber.toString().padStart(3, '0') : order.id.slice(-4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.customerName || 'Cliente não informado'}
                    </Typography>
                    {order.tableNumber && (
                      <Typography variant="body2" color="text.secondary">
                        Mesa: {order.tableNumber}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={getStatusText(order.status)}
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </Typography>
                
                <Typography variant="h6" color="primary">
                  Total: R$ {order.total.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FAB para novo pedido */}
      {(user?.role === 'GARCOM' || user?.role === 'ADMIN') && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setNewOrderOpen(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuOrderId && (
          <>
            {getAvailableStatuses(
              orders?.find(o => o.id === menuOrderId)?.status || ''
            ).map((status) => (
              <MenuItem key={status} onClick={() => handleStatusUpdate(status)}>
                {status === 'PREPARING' && <Kitchen sx={{ mr: 1 }} />}
                {status === 'READY' && <CheckCircle sx={{ mr: 1 }} />}
                {status === 'DELIVERED' && <CheckCircle sx={{ mr: 1 }} />}
                {getStatusText(status)}
              </MenuItem>
            ))}
            {orders?.find(o => o.id === menuOrderId)?.status === 'PENDING' && (
              <MenuItem onClick={handleCancelOrder} sx={{ color: 'error.main' }}>
                <Cancel sx={{ mr: 1 }} />
                Cancelar
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Dialog de detalhes do pedido */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              Pedido #{selectedOrder.orderNumber ? selectedOrder.orderNumber.toString().padStart(3, '0') : selectedOrder.id.slice(-4)}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" gutterBottom>
                <strong>Cliente:</strong> {selectedOrder.customerName || 'Não informado'}
              </Typography>
              {selectedOrder.tableNumber && (
                <Typography variant="body2" gutterBottom>
                  <strong>Mesa:</strong> {selectedOrder.tableNumber}
                </Typography>
              )}
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> {getStatusText(selectedOrder.status)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Funcionário:</strong> {selectedOrder.user.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Data:</strong> {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Itens:
              </Typography>
              {selectedOrder.items?.map((item) => (
                <Box key={item.id} display="flex" justifyContent="space-between" mb={1}>
                  <Typography>
                    {item.quantity}x {item.product.name}
                  </Typography>
                  <Typography>
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
              
              {selectedOrder.observations && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Observações:
                  </Typography>
                  <Typography variant="body2">
                    {selectedOrder.observations}
                  </Typography>
                </>
              )}
              
              <Typography variant="h6" sx={{ mt: 2 }}>
                Total: R$ {selectedOrder.total.toFixed(2)}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedOrder(null)}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de novo pedido */}
      <NewOrderDialog
        open={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        onSuccess={() => {
          setNewOrderOpen(false);
          refetch();
        }}
      />
    </Box>
  );
}