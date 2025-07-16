import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Stats {
  monthlyRevenue: number;
  monthlyOrdersCount: number;
  averageTicket: number;
  activeTables: number;
}

interface SalesData {
  name: string;
  vendas: number;
  pedidos: number;
}

interface ProductData {
  name: string;
  value: number;
  color?: string;
}

const Reports: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<Stats>({
    monthlyRevenue: 0,
    monthlyOrdersCount: 0,
    averageTicket: 0,
    activeTables: 0
  });
  const [salesData, setSalesData] = useState<SalesData[]>([
    { name: 'Jan', vendas: 0, pedidos: 0 },
    { name: 'Fev', vendas: 0, pedidos: 0 },
    { name: 'Mar', vendas: 0, pedidos: 0 },
    { name: 'Abr', vendas: 0, pedidos: 0 },
    { name: 'Mai', vendas: 0, pedidos: 0 },
    { name: 'Jun', vendas: 0, pedidos: 0 },
  ]);
  const [productData, setProductData] = useState<ProductData[]>([
    { name: 'Aguardando dados', value: 1, color: '#E0E0E0' },
  ]);

  // Cores para o gráfico de pizza
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('@restaurante:token');
      
      if (!token || !isAuthenticated) {
        console.error('Token não encontrado ou usuário não autenticado');
        return;
      }

      // Buscar estatísticas gerais
      const statsResponse = await api.get('/reports/stats');
      setStats(statsResponse.data);

      // Buscar dados de vendas mensais
      const salesResponse = await api.get('/reports/monthly-sales');
      setSalesData(salesResponse.data);

      // Buscar produtos mais vendidos
      const productsResponse = await api.get('/reports/top-products');
      const productsWithColors = productsResponse.data.map((product: any, index: number) => ({
        ...product,
        color: chartColors[index % chartColors.length]
      }));
      setProductData(productsWithColors);
    } catch (error) {
      console.error('Erro ao buscar dados dos relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Relatórios
      </Typography>

      <Grid container spacing={3}>
        {/* Resumo de Vendas */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Vendas do Mês
              </Typography>
              <Typography variant="h5" component="h2">
                R$ {stats.monthlyRevenue.toFixed(2).replace('.', ',')}
              </Typography>
              <Typography color="textSecondary">
                {stats.monthlyRevenue > 0 ? 'Vendas realizadas' : 'Nenhuma venda registrada'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pedidos do Mês
              </Typography>
              <Typography variant="h5" component="h2">
                {stats.monthlyOrdersCount}
              </Typography>
              <Typography color="textSecondary">
                {stats.monthlyOrdersCount > 0 ? 'Pedidos entregues' : 'Nenhum pedido registrado'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ticket Médio
              </Typography>
              <Typography variant="h5" component="h2">
                R$ {stats.averageTicket.toFixed(2).replace('.', ',')}
              </Typography>
              <Typography color="textSecondary">
                {stats.averageTicket > 0 ? 'Valor médio por pedido' : 'Aguardando dados'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Mesas Ativas
              </Typography>
              <Typography variant="h5" component="h2">
                {stats.activeTables}
              </Typography>
              <Typography color="textSecondary">
                {stats.activeTables > 0 ? 'Mesas com pedidos' : 'Nenhuma mesa ativa'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Vendas */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vendas por Mês
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="vendas" fill="#8884d8" name="Vendas (R$)" />
                <Bar dataKey="pedidos" fill="#82ca9d" name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Produtos */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Produtos Mais Vendidos
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props;
                    return percent ? `${name} ${(percent * 100).toFixed(0)}%` : name;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;