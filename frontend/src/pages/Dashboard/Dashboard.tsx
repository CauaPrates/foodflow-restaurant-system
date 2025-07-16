import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Link,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
} from '@mui/material';
import {
  Restaurant,
  TrendingUp,
  Warning,
  Assessment,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  availableTables: number;
  totalTables: number;
  lowStockItems: number;
  todayRevenue: number;
}

interface Order {
  id: string;
  orderNumber?: number;
  customerName?: string;
  table?: { number: number };
  status: string;
  total: number;
  createdAt: string;
  dayFinalized?: boolean;
  items: Array<{
    product: { name: string };
    quantity: number;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finalizeDayDialog, setFinalizeDayDialog] = useState(false);
  const [isFinalizingDay, setIsFinalizingDay] = useState(false);
  const [finalizeDayMessage, setFinalizeDayMessage] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>(
    'dashboard-stats',
    async () => {
      const [ordersRes, ingredientsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/ingredients'),
      ]);

      const orders = ordersRes.data;
      const ingredients = ingredientsRes.data;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime() && order.status === 'DELIVERED';
      });

      const lowStockItems = ingredients.filter((ingredient: any) => 
        ingredient.currentStock <= ingredient.minStock
      );

      return {
        totalOrders: orders.length,
        pendingOrders: orders.filter((order: Order) => 
          ['PENDING', 'PREPARING', 'READY'].includes(order.status)
        ).length,
        availableTables: 0,
        totalTables: 0,
        lowStockItems: lowStockItems.length,
        todayRevenue: todayOrders.reduce((sum: number, order: Order) => sum + order.total, 0),
      };
    },
    {
      refetchInterval: 30000, // Atualizar a cada 30 segundos
    }
  );

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<Order[]>(
    'recent-orders',
    async () => {
      const response = await api.get('/orders');
      // Mostrar todos os pedidos do dia que não foram finalizados, exceto cancelados
      const todayOrders = response.data.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        const isToday = orderDate.toDateString() === today.toDateString();
        const isNotCancelled = order.status !== 'CANCELLED';
        const isNotFinalized = !order.dayFinalized;
        return isToday && isNotCancelled && isNotFinalized;
      });
      // Retornar os 5 mais recentes
      return todayOrders.slice(0, 5);
    },
    {
      refetchInterval: 10000, // Atualizar a cada 10 segundos
      cacheTime: 0, // Não fazer cache dos dados
      staleTime: 0, // Considerar dados sempre desatualizados
    }
  );

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

  const handleFinalizeDay = async () => {
    setIsFinalizingDay(true);
    setFinalizeDayMessage('');
    
    try {
      // Buscar todos os pedidos do dia que não foram finalizados
      const response = await api.get('/orders');
      const todayOrders = response.data.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        const isToday = orderDate.toDateString() === today.toDateString();
        const isNotFinalized = !order.dayFinalized;
        const isNotCancelled = order.status !== 'CANCELLED';
        return isToday && isNotFinalized && isNotCancelled;
      });

      // Marcar pedidos pendentes como entregues e todos como finalizados
      const updatePromises = todayOrders.map(async (order: Order) => {
        // Se o pedido ainda não foi entregue, marcar como entregue
        if (['PENDING', 'PREPARING', 'READY'].includes(order.status)) {
          await api.patch(`/orders/${order.id}/status`, { status: 'DELIVERED' });
        }
        // Marcar como finalizado
        return api.patch(`/orders/${order.id}/finalize`);
      });

      await Promise.all(updatePromises);

      setFinalizeDayMessage(`Dia finalizado com sucesso! ${todayOrders.length} pedidos foram finalizados.`);
      
      // Atualizar os dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao finalizar dia:', error);
      setFinalizeDayMessage('Erro ao finalizar o dia. Tente novamente.');
    } finally {
      setIsFinalizingDay(false);
      setTimeout(() => {
        setFinalizeDayDialog(false);
        setFinalizeDayMessage('');
      }, 2000);
    }
  };

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Bem-vindo(a), {user?.name}! Aqui está um resumo do seu restaurante.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Cards de Estatísticas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Restaurant color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pedidos Ativos
                  </Typography>
                  <Typography variant="h4">
                    {stats?.pendingOrders || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Pedidos
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalOrders || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Receita Hoje
                  </Typography>
                  <Typography variant="h4">
                    R$ {stats?.todayRevenue?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color={stats?.lowStockItems ? 'error' : 'primary'} sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Estoque Baixo
                  </Typography>
                  <Typography variant="h4" color={stats?.lowStockItems ? 'error' : 'inherit'}>
                    {stats?.lowStockItems || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pedidos Recentes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pedidos Recentes
            </Typography>
            {ordersLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {recentOrders?.map((order) => (
                  <ListItem key={order.id} divider>
                    <ListItemText
                      primary={`Pedido #${order.orderNumber ? order.orderNumber.toString().padStart(3, '0') : order.id.slice(-4)} - ${order.customerName || 'Cliente'} - R$ ${order.total.toFixed(2)}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {order.items?.map((item: any) => 
                              `${item.quantity}x ${item.product.name}`
                            ).join(', ') || 'Sem itens'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(order.createdAt).toLocaleString('pt-BR')}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={getStatusText(order.status)}
                      color={getStatusColor(order.status) as any}
                      size="small"
                    />
                  </ListItem>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <ListItem>
                    <ListItemText
                      primary="Nenhum pedido encontrado"
                      secondary="Os pedidos aparecerão aqui quando forem criados"
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Ações Rápidas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ações Rápidas
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/orders')}
                sx={{ textAlign: 'left', textDecoration: 'none' }}
              >
                • Novo Pedido
              </Link>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/products')}
                sx={{ textAlign: 'left', textDecoration: 'none' }}
              >
                • Gerenciar Produtos
              </Link>
              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/products')}
                    sx={{ textAlign: 'left', textDecoration: 'none' }}
                  >
                    • Adicionar Produto
                  </Link>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/ingredients')}
                    sx={{ textAlign: 'left', textDecoration: 'none' }}
                  >
                    • Controle de Estoque
                  </Link>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/reports')}
                    sx={{ textAlign: 'left', textDecoration: 'none' }}
                  >
                    • Relatórios
                  </Link>
                </>
              )}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/orders')}
                sx={{ textAlign: 'left', textDecoration: 'none' }}
              >
                • Ver Todos os Pedidos
              </Link>
              {user?.role === 'ADMIN' && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => setFinalizeDayDialog(true)}
                  sx={{ mt: 2, width: '100%' }}
                >
                  Finalizar Dia
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Diálogo de Confirmação para Finalizar Dia */}
      <Dialog
        open={finalizeDayDialog}
        onClose={() => !isFinalizingDay && setFinalizeDayDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Finalizar Dia</DialogTitle>
        <DialogContent>
          {finalizeDayMessage ? (
            <Alert severity={finalizeDayMessage.includes('sucesso') ? 'success' : 'error'}>
              {finalizeDayMessage}
            </Alert>
          ) : (
            <Typography>
              Tem certeza que deseja finalizar o dia? Esta ação irá:
              <br />• Marcar todos os pedidos pendentes como entregues
              <br />• Limpar a lista de pedidos recentes
              <br />• Esta ação não pode ser desfeita
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setFinalizeDayDialog(false)} 
            disabled={isFinalizingDay}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalizeDay} 
            variant="contained" 
            color="warning"
            disabled={isFinalizingDay || !!finalizeDayMessage}
          >
            {isFinalizingDay ? 'Finalizando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}