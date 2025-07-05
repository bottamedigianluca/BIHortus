import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Flex,
  Badge,
  Button,
  Select,
  HStack,
  VStack,
  useColorModeValue,
  Icon,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Avatar,
  AvatarGroup,
  Divider,
  List,
  ListItem,
  ListIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiAlertTriangle,
  FiCalendar,
  FiTarget,
  FiClock,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiBarChart,
  FiActivity,
  FiMapPin,
  FiTruck,
  FiSun
} from 'react-icons/fi';

const WholesaleDashboard = () => {
  const [dateRange, setDateRange] = useState('30');
  const [dashboardData, setDashboardData] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const accentColor = useColorModeValue('blue.600', 'blue.400');
  const successColor = useColorModeValue('green.500', 'green.400');
  const warningColor = useColorModeValue('orange.500', 'orange.400');
  const errorColor = useColorModeValue('red.500', 'red.400');

  useEffect(() => {
    fetchDashboardData();
    fetchSalesTrends();
    fetchCategoryPerformance();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/kpis?days=${dateRange}`);
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTrends = async () => {
    try {
      const response = await fetch(`/api/dashboard/revenue-trends?days=${dateRange}&groupBy=day`);
      const data = await response.json();
      if (data.success) {
        setSalesTrends(data.data);
      }
    } catch (error) {
      console.error('Error fetching sales trends:', error);
    }
  };

  const fetchCategoryPerformance = async () => {
    try {
      const response = await fetch(`/api/dashboard/category-performance?days=${dateRange}`);
      const data = await response.json();
      if (data.success) {
        setCategoryPerformance(data.data);
      }
    } catch (error) {
      console.error('Error fetching category performance:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatWeight = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}T`;
    }
    return `${value}kg`;
  };

  // Sample data for modern widgets
  const topCustomers = [
    { name: 'Supermarket Fresh', revenue: 15420, growth: 12.5, type: 'Supermercato' },
    { name: 'Hotel Roma Palace', revenue: 12350, growth: 8.2, type: 'Hotel' },
    { name: 'Ristorante Da Mario', revenue: 9875, growth: -2.1, type: 'Ristorante' },
    { name: 'Catering Elite', revenue: 8920, growth: 15.3, type: 'Catering' }
  ];

  const urgentActions = [
    { type: 'stock', message: 'Scorte limitate: Pomodori Ciliegino', priority: 'high', action: 'Riordina' },
    { type: 'payment', message: '3 pagamenti in scadenza oggi', priority: 'medium', action: 'Controlla' },
    { type: 'quality', message: 'Controllo qualità: Lotto #2023-445', priority: 'high', action: 'Verifica' },
    { type: 'delivery', message: '5 consegne programmate domani', priority: 'low', action: 'Pianifica' }
  ];

  const seasonalInsights = {
    current: 'Estate',
    trend: 'Picco pomodori e frutta estiva',
    recommendations: ['Aumenta stock melanzane', 'Promuovi pesche', 'Riduci agrumi'],
    temperature: 28,
    humidity: 65
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Box p={8} bg={bgColor} minH="100vh">
        <Flex justify="center" align="center" h="50vh">
          <VStack spacing={4}>
            <CircularProgress isIndeterminate color="blue.500" size="60px" />
            <Text color={textColor}>Caricamento dashboard...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="xl" color={accentColor} fontWeight="800">
              🥬 Dashboard Ingrosso
            </Heading>
            <Text color={textColor} fontSize="lg">
              Gestione completa frutta e verdura all'ingrosso
            </Text>
          </VStack>
          
          <HStack spacing={4}>
            <Select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              bg={cardBg}
              borderColor="gray.300"
              maxW="200px"
            >
              <option value="7">Ultimi 7 giorni</option>
              <option value="30">Ultimi 30 giorni</option>
              <option value="90">Ultimi 90 giorni</option>
              <option value="365">Ultimo anno</option>
            </Select>
            <Button leftIcon={<FiRefreshCw />} colorScheme="blue" variant="outline">
              Aggiorna
            </Button>
          </HStack>
        </Flex>

        {/* Main KPI Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px" borderColor="gray.200">
            <CardBody>
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="600">FATTURATO OGGI</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="800" color={successColor}>
                  {formatCurrency(dashboardData?.fatturato_oggi || 0)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  12.5% vs ieri
                </StatHelpText>
              </Stat>
              <Progress value={75} colorScheme="green" size="sm" borderRadius="full" mt={3} />
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px" borderColor="gray.200">
            <CardBody>
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="600">FATTURATO MESE</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="800" color={accentColor}>
                  {formatCurrency(dashboardData?.fatturato_mese || 0)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  8.2% vs mese scorso
                </StatHelpText>
              </Stat>
              <Progress value={85} colorScheme="blue" size="sm" borderRadius="full" mt={3} />
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px" borderColor="gray.200">
            <CardBody>
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="600">CREDITI SCADUTI</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="800" color={errorColor}>
                  {formatCurrency(dashboardData?.scaduto_totale || 0)}
                </StatNumber>
                <StatHelpText color={errorColor}>
                  {dashboardData?.scadenze_7gg || 0} scadono in 7gg
                </StatHelpText>
              </Stat>
              <Progress value={30} colorScheme="red" size="sm" borderRadius="full" mt={3} />
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px" borderColor="gray.200">
            <CardBody>
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="600">CLIENTI ATTIVI</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="800" color={accentColor}>
                  {dashboardData?.clienti_attivi || 0}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  3 nuovi questa settimana
                </StatHelpText>
              </Stat>
              <AvatarGroup size="sm" max={4} mt={3}>
                <Avatar name="Super Fresh" bg="blue.500" />
                <Avatar name="Hotel Palace" bg="green.500" />
                <Avatar name="Da Mario" bg="orange.500" />
                <Avatar name="Elite Catering" bg="purple.500" />
              </AvatarGroup>
            </CardBody>
          </Card>
        </Grid>

        {/* Secondary Metrics */}
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
          <Card bg={cardBg} shadow="lg" borderRadius="lg">
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={textColor} fontWeight="600">VOLUME VENDITE</Text>
                  <Text fontSize="2xl" fontWeight="bold">2.8T</Text>
                  <Text fontSize="xs" color="green.500">+15% questa settimana</Text>
                </VStack>
                <Icon as={FiPackage} size="32px" color={accentColor} />
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="lg" borderRadius="lg">
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={textColor} fontWeight="600">ORDINI APERTI</Text>
                  <Text fontSize="2xl" fontWeight="bold">{dashboardData?.ordini_aperti || 0}</Text>
                  <Text fontSize="xs" color="orange.500">12 in scadenza</Text>
                </VStack>
                <Icon as={FiShoppingCart} size="32px" color={warningColor} />
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="lg" borderRadius="lg">
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={textColor} fontWeight="600">MARGINE MEDIO</Text>
                  <Text fontSize="2xl" fontWeight="bold">28.5%</Text>
                  <Text fontSize="xs" color="green.500">+2.1% vs target</Text>
                </VStack>
                <Icon as={FiTarget} size="32px" color={successColor} />
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="lg" borderRadius="lg">
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color={textColor} fontWeight="600">CONSEGNE OGGI</Text>
                  <Text fontSize="2xl" fontWeight="bold">24</Text>
                  <Text fontSize="xs" color="blue.500">18 completate</Text>
                </VStack>
                <Icon as={FiTruck} size="32px" color={accentColor} />
              </HStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Charts Section */}
        <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6}>
          {/* Revenue Trends */}
          <Card bg={cardBg} shadow="xl" borderRadius="xl">
            <CardHeader>
              <Heading size="md" color={textColor}>Andamento Fatturato</Heading>
            </CardHeader>
            <CardBody>
              <Box h="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={salesTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      formatter={(value, name) => [formatCurrency(value), name]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="1" 
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      fillOpacity={0.3}
                      name="Fatturato"
                    />
                    <Bar dataKey="margin" fill="#00C49F" name="Margine" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          {/* Category Performance */}
          <Card bg={cardBg} shadow="xl" borderRadius="xl">
            <CardHeader>
              <Heading size="md" color={textColor}>Performance Categorie</Heading>
            </CardHeader>
            <CardBody>
              <Box h="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPerformance}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="revenue"
                      label={(entry) => entry.category}
                    >
                      {categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </Grid>

        {/* Bottom Section */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr 1fr" }} gap={6}>
          {/* Top Customers */}
          <Card bg={cardBg} shadow="xl" borderRadius="xl">
            <CardHeader>
              <Heading size="md" color={textColor}>Top Clienti</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {topCustomers.map((customer, index) => (
                  <Box key={index}>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm">{customer.name}</Text>
                        <Text fontSize="xs" color={textColor}>{customer.type}</Text>
                      </VStack>
                      <VStack align="end" spacing={0}>
                        <Text fontWeight="bold" color={accentColor}>
                          {formatCurrency(customer.revenue)}
                        </Text>
                        <HStack spacing={1}>
                          <Icon 
                            as={customer.growth > 0 ? FiArrowUp : FiArrowDown} 
                            color={customer.growth > 0 ? successColor : errorColor}
                            size="12px"
                          />
                          <Text 
                            fontSize="xs" 
                            color={customer.growth > 0 ? successColor : errorColor}
                          >
                            {Math.abs(customer.growth)}%
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    {index < topCustomers.length - 1 && <Divider mt={3} />}
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Urgent Actions */}
          <Card bg={cardBg} shadow="xl" borderRadius="xl">
            <CardHeader>
              <Heading size="md" color={textColor}>Azioni Urgenti</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {urgentActions.map((action, index) => (
                  <Alert 
                    key={index}
                    status={action.priority === 'high' ? 'error' : action.priority === 'medium' ? 'warning' : 'info'}
                    borderRadius="lg"
                    variant="left-accent"
                  >
                    <AlertIcon />
                    <Box flex="1">
                      <AlertDescription fontSize="sm">
                        {action.message}
                      </AlertDescription>
                    </Box>
                    <Button size="xs" colorScheme={action.priority === 'high' ? 'red' : 'blue'}>
                      {action.action}
                    </Button>
                  </Alert>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Seasonal Insights */}
          <Card bg={cardBg} shadow="xl" borderRadius="xl">
            <CardHeader>
              <Heading size="md" color={textColor}>Insights Stagionali</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold">☀️ {seasonalInsights.current}</Text>
                    <Text fontSize="sm" color={textColor}>{seasonalInsights.trend}</Text>
                  </VStack>
                  <VStack align="end" spacing={0}>
                    <HStack>
                      <Icon as={FiSun} color={errorColor} />
                      <Text fontSize="sm">{seasonalInsights.temperature}°C</Text>
                    </HStack>
                    <Text fontSize="xs" color={textColor}>Umidità {seasonalInsights.humidity}%</Text>
                  </VStack>
                </HStack>
                
                <Divider />
                
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="bold" color={textColor}>Raccomandazioni:</Text>
                  <List spacing={1}>
                    {seasonalInsights.recommendations.map((rec, index) => (
                      <ListItem key={index} fontSize="xs">
                        <ListIcon as={FiCheckCircle} color={successColor} />
                        {rec}
                      </ListItem>
                    ))}
                  </List>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Quick Stats Bar */}
        <Card bg={cardBg} shadow="lg" borderRadius="lg">
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
              <Stat textAlign="center">
                <StatLabel fontSize="xs">Prodotti Attivi</StatLabel>
                <StatNumber fontSize="lg">156</StatNumber>
              </Stat>
              <Stat textAlign="center">
                <StatLabel fontSize="xs">Fornitori</StatLabel>
                <StatNumber fontSize="lg">23</StatNumber>
              </Stat>
              <Stat textAlign="center">
                <StatLabel fontSize="xs">Magazzini</StatLabel>
                <StatNumber fontSize="lg">4</StatNumber>
              </Stat>
              <Stat textAlign="center">
                <StatLabel fontSize="xs">Automazioni</StatLabel>
                <StatNumber fontSize="lg">12</StatNumber>
              </Stat>
              <Stat textAlign="center">
                <StatLabel fontSize="xs">Qualità Media</StatLabel>
                <StatNumber fontSize="lg">94%</StatNumber>
              </Stat>
              <Stat textAlign="center">
                <StatLabel fontSize="xs">Efficienza</StatLabel>
                <StatNumber fontSize="lg">87%</StatNumber>
              </Stat>
            </Grid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default WholesaleDashboard;