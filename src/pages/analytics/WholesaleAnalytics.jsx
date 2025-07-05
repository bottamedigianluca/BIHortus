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
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
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
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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
  FiSun,
  FiHeart,
  FiAward,
  FiZap,
  FiFilter,
  FiDownload
} from 'react-icons/fi';

const WholesaleAnalytics = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const accentColor = useColorModeValue('blue.600', 'blue.400');
  const successColor = useColorModeValue('green.500', 'green.400');
  const warningColor = useColorModeValue('orange.500', 'orange.400');
  const errorColor = useColorModeValue('red.500', 'red.400');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch real analytics data from API
      const [kpisResponse, categoriesResponse, productsResponse, customersResponse] = await Promise.all([
        fetch(`/api/analytics/kpis?days=${dateRange.replace('days', '')}`),
        fetch(`/api/analytics/categories?days=${dateRange.replace('days', '')}`),
        fetch(`/api/analytics/products?days=${dateRange.replace('days', '')}`),
        fetch(`/api/analytics/customers?days=${dateRange.replace('days', '')}`)
      ]);

      const kpis = await kpisResponse.json();
      const categories = await categoriesResponse.json();
      const products = await productsResponse.json();
      const customers = await customersResponse.json();

      const data = {
        kpis: kpis.data || {
          totalRevenue: 0,
          revenueGrowth: 0,
          averageOrderValue: 0,
          aovGrowth: 0,
          customerCount: 0,
          customerGrowth: 0,
          marginPercent: 0,
          marginGrowth: 0
        },
        revenueByPeriod: await fetchRevenueData(),
        salesByCategory: categories.data || [],
        topProducts: products.data || [],
        customerAnalytics: customers.data || [],
        seasonalTrends: await fetchSeasonalTrends(),
        performanceMetrics: await fetchPerformanceMetrics()
      };
      
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await fetch(`/api/analytics/revenue-trends?days=${dateRange.replace('days', '')}`);
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  };

  const fetchSeasonalTrends = async () => {
    try {
      const response = await fetch('/api/analytics/seasonal-trends');
      const result = await response.json();
      return result.data || {
        currentSeason: 'Estate',
        forecast: []
      };
    } catch (error) {
      console.error('Error fetching seasonal trends:', error);
      return {
        currentSeason: 'Estate',
        forecast: []
      };
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/performance-metrics');
      const result = await response.json();
      return result.data || {
        efficiency: 0,
        qualityScore: 0,
        deliveryOnTime: 0,
        customerSatisfaction: 0,
        inventoryTurnover: 0,
        wastagePercent: 0
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return {
        efficiency: 0,
        qualityScore: 0,
        deliveryOnTime: 0,
        customerSatisfaction: 0,
        inventoryTurnover: 0,
        wastagePercent: 0
      };
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const COLORS = ['#48BB78', '#4299E1', '#ED8936', '#9F7AEA', '#F56565'];

  if (loading) {
    return (
      <Box p={8} bg={bgColor} minH="100vh">
        <Flex justify="center" align="center" h="50vh">
          <VStack spacing={4}>
            <CircularProgress isIndeterminate color="blue.500" size="60px" />
            <Text color={textColor}>Caricamento analytics...</Text>
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
              📊 Analytics Avanzata
            </Heading>
            <Text color={textColor} fontSize="lg">
              Business Intelligence per Commercio All'Ingrosso
            </Text>
          </VStack>
          
          <HStack spacing={4}>
            <Select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              bg={cardBg}
              maxW="200px"
            >
              <option value="7days">Ultimi 7 giorni</option>
              <option value="30days">Ultimi 30 giorni</option>
              <option value="90days">Ultimi 90 giorni</option>
              <option value="1year">Ultimo anno</option>
            </Select>
            <Button leftIcon={<FiRefreshCw />} colorScheme="blue" variant="outline">
              Aggiorna
            </Button>
            <Button leftIcon={<FiDownload />} colorScheme="green">
              Esporta Report
            </Button>
          </HStack>
        </Flex>

        {/* Main KPIs */}
        <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={6}>
          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px" borderColor="gray.200">
            <CardBody>
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="600">FATTURATO TOTALE</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="800" color={successColor}>
                  {formatCurrency(analyticsData?.kpis.totalRevenue)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {analyticsData?.kpis.revenueGrowth}% vs periodo precedente
                </StatHelpText>
              </Stat>
              <Progress value={85} colorScheme="green" size="sm" borderRadius="full" mt={3} />
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px" borderColor="gray.200">
            <CardBody>
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="600">VALORE MEDIO ORDINE</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="800" color={accentColor}>
                  {formatCurrency(analyticsData?.kpis.averageOrderValue)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {analyticsData?.kpis.aovGrowth}% crescita AOV
                </StatHelpText>
              </Stat>
              <Progress value={75} colorScheme="blue" size="sm" borderRadius="full" mt={3} />
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px" borderColor="gray.200">
            <CardBody>
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="600">CLIENTI ATTIVI</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="800" color={warningColor}>
                  {analyticsData?.kpis.customerCount}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {analyticsData?.kpis.customerGrowth}% nuovi clienti
                </StatHelpText>
              </Stat>
              <AvatarGroup size="sm" max={4} mt={3}>
                <Avatar name="Ristorante A" bg="green.500" />
                <Avatar name="Hotel B" bg="blue.500" />
                <Avatar name="Super C" bg="orange.500" />
                <Avatar name="Catering D" bg="purple.500" />
              </AvatarGroup>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="xl" borderRadius="xl" border="1px" borderColor="gray.200">
            <CardBody>
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="600">MARGINE MEDIO</StatLabel>
                <StatNumber fontSize="3xl" fontWeight="800" color={errorColor}>
                  {analyticsData?.kpis.marginPercent}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  +{analyticsData?.kpis.marginGrowth}% miglioramento
                </StatHelpText>
              </Stat>
              <Progress value={analyticsData?.kpis.marginPercent} colorScheme="red" size="sm" borderRadius="full" mt={3} />
            </CardBody>
          </Card>
        </Grid>

        {/* Charts Section */}
        <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6}>
          {/* Revenue Trends */}
          <Card bg={cardBg} shadow="xl" borderRadius="xl">
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md" color={textColor}>Andamento Business</Heading>
                <HStack>
                  <Button size="sm" variant={selectedMetric === 'revenue' ? 'solid' : 'ghost'} 
                          onClick={() => setSelectedMetric('revenue')}>
                    Fatturato
                  </Button>
                  <Button size="sm" variant={selectedMetric === 'orders' ? 'solid' : 'ghost'} 
                          onClick={() => setSelectedMetric('orders')}>
                    Ordini
                  </Button>
                  <Button size="sm" variant={selectedMetric === 'margin' ? 'solid' : 'ghost'} 
                          onClick={() => setSelectedMetric('margin')}>
                    Margini
                  </Button>
                </HStack>
              </HStack>
            </CardHeader>
            <CardBody>
              <Box h="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analyticsData?.revenueByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        name === 'revenue' || name === 'margin' ? formatCurrency(value) : value, 
                        name === 'revenue' ? 'Fatturato' : name === 'orders' ? 'Ordini' : name === 'customers' ? 'Clienti' : 'Margine'
                      ]}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke={COLORS[0]} 
                      fill={COLORS[0]} 
                      fillOpacity={0.3}
                    />
                    <Bar dataKey="orders" fill={COLORS[1]} opacity={0.7} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          {/* Category Performance */}
          <Card bg={cardBg} shadow="xl" borderRadius="xl">
            <CardHeader>
              <Heading size="md" color={textColor}>Vendite per Categoria</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box h="250px">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData?.salesByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData?.salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                
                <VStack spacing={2} align="stretch">
                  {analyticsData?.salesByCategory.map((category, index) => (
                    <HStack key={category.name} justify="space-between">
                      <HStack>
                        <Box w="12px" h="12px" borderRadius="full" bg={category.color} />
                        <Text fontSize="sm" fontWeight="medium">{category.name}</Text>
                      </HStack>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">{formatCurrency(category.value)}</Text>
                        <Text fontSize="xs" color={textColor}>{category.margin}% margine</Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Detailed Analytics Tabs */}
        <Card bg={cardBg} shadow="xl" borderRadius="xl">
          <CardBody>
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Prodotti Top</Tab>
                <Tab>Segmentazione Clienti</Tab>
                <Tab>Tendenze Stagionali</Tab>
                <Tab>Metriche Performance</Tab>
              </TabList>

              <TabPanels>
                {/* Top Products */}
                <TabPanel>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Prodotto</Th>
                          <Th isNumeric>Fatturato</Th>
                          <Th isNumeric>Unità</Th>
                          <Th isNumeric>Margine %</Th>
                          <Th>Trend</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {analyticsData?.topProducts.map((product, index) => (
                          <Tr key={product.name}>
                            <Td>
                              <HStack>
                                <Badge colorScheme={index < 3 ? 'green' : 'gray'}>#{index + 1}</Badge>
                                <Text fontWeight="medium">{product.name}</Text>
                              </HStack>
                            </Td>
                            <Td isNumeric fontWeight="bold">{formatCurrency(product.revenue)}</Td>
                            <Td isNumeric>{product.units.toLocaleString()}</Td>
                            <Td isNumeric>
                              <Text color={product.margin > 30 ? 'green.500' : 'orange.500'}>
                                {product.margin}%
                              </Text>
                            </Td>
                            <Td>
                              <Icon 
                                as={product.trend === 'up' ? FiTrendingUp : FiTrendingDown} 
                                color={product.trend === 'up' ? 'green.500' : 'red.500'} 
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                {/* Customer Segments */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {analyticsData?.customerAnalytics.map((segment) => (
                      <Card key={segment.segment} bg="gray.50" borderRadius="lg">
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="bold" fontSize="lg">{segment.segment}</Text>
                            <HStack justify="space-between">
                              <Text color={textColor}>Clienti:</Text>
                              <Text fontWeight="medium">{segment.count}</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Fatturato:</Text>
                              <Text fontWeight="bold" color={accentColor}>
                                {formatCurrency(segment.revenue)}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Crescita:</Text>
                              <HStack>
                                <Icon as={FiTrendingUp} color="green.500" />
                                <Text color="green.500" fontWeight="medium">+{segment.growth}%</Text>
                              </HStack>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>AOV:</Text>
                              <Text fontWeight="medium">{formatCurrency(segment.avgOrder)}</Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </TabPanel>

                {/* Seasonal Trends */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Alert status="info" borderRadius="lg">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Stagione Corrente: {analyticsData?.seasonalTrends.currentSeason}</AlertTitle>
                        <AlertDescription>
                          Analisi delle tendenze e previsioni per i prodotti stagionali
                        </AlertDescription>
                      </Box>
                    </Alert>
                    
                    <TableContainer>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Prodotto</Th>
                            <Th>Domanda</Th>
                            <Th>Trend Prezzo</Th>
                            <Th>Impatto Margine</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {analyticsData?.seasonalTrends.forecast.map((item) => (
                            <Tr key={item.product}>
                              <Td fontWeight="medium">{item.product}</Td>
                              <Td>
                                <Badge colorScheme={
                                  item.demand === 'Alto' ? 'green' : 
                                  item.demand === 'Medio-Alto' ? 'orange' : 'gray'
                                }>
                                  {item.demand}
                                </Badge>
                              </Td>
                              <Td>{item.price}</Td>
                              <Td>
                                <Text color={item.margin.startsWith('+') ? 'green.500' : 'red.500'}>
                                  {item.margin}
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </VStack>
                </TabPanel>

                {/* Performance Metrics */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    <Card bg="gray.50" borderRadius="lg">
                      <CardBody textAlign="center">
                        <VStack spacing={3}>
                          <Icon as={FiZap} size="32px" color="blue.500" />
                          <CircularProgress value={analyticsData?.performanceMetrics.efficiency} color="blue.500">
                            <CircularProgressLabel>{analyticsData?.performanceMetrics.efficiency}%</CircularProgressLabel>
                          </CircularProgress>
                          <Text fontWeight="bold">Efficienza Operativa</Text>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg="gray.50" borderRadius="lg">
                      <CardBody textAlign="center">
                        <VStack spacing={3}>
                          <Icon as={FiAward} size="32px" color="green.500" />
                          <CircularProgress value={analyticsData?.performanceMetrics.qualityScore} color="green.500">
                            <CircularProgressLabel>{analyticsData?.performanceMetrics.qualityScore}%</CircularProgressLabel>
                          </CircularProgress>
                          <Text fontWeight="bold">Score Qualità</Text>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg="gray.50" borderRadius="lg">
                      <CardBody textAlign="center">
                        <VStack spacing={3}>
                          <Icon as={FiTruck} size="32px" color="orange.500" />
                          <CircularProgress value={analyticsData?.performanceMetrics.deliveryOnTime} color="orange.500">
                            <CircularProgressLabel>{analyticsData?.performanceMetrics.deliveryOnTime}%</CircularProgressLabel>
                          </CircularProgress>
                          <Text fontWeight="bold">Consegne Puntuali</Text>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg="gray.50" borderRadius="lg">
                      <CardBody textAlign="center">
                        <VStack spacing={3}>
                          <Icon as={FiStar} size="32px" color="purple.500" />
                          <Text fontSize="3xl" fontWeight="bold" color="purple.500">
                            {analyticsData?.performanceMetrics.customerSatisfaction}/5
                          </Text>
                          <Text fontWeight="bold">Soddisfazione Cliente</Text>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg="gray.50" borderRadius="lg">
                      <CardBody textAlign="center">
                        <VStack spacing={3}>
                          <Icon as={FiRefreshCw} size="32px" color="teal.500" />
                          <Text fontSize="3xl" fontWeight="bold" color="teal.500">
                            {analyticsData?.performanceMetrics.inventoryTurnover}x
                          </Text>
                          <Text fontWeight="bold">Rotazione Magazzino</Text>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg="gray.50" borderRadius="lg">
                      <CardBody textAlign="center">
                        <VStack spacing={3}>
                          <Icon as={FiAlertTriangle} size="32px" color="red.500" />
                          <Text fontSize="3xl" fontWeight="bold" color="red.500">
                            {analyticsData?.performanceMetrics.wastagePercent}%
                          </Text>
                          <Text fontWeight="bold">Spreco Prodotti</Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default WholesaleAnalytics;