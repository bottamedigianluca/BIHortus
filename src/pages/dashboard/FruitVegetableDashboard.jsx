import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Button,
  ButtonGroup,
  Select,
  Input,
  HStack,
  VStack,
  Progress,
  SimpleGrid,
  Avatar,
  AvatarGroup,
  useColorModeValue,
  Icon,
  Flex,
  Spacer,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Divider
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiUsers,
  FiPackage,
  FiBarChart,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiFilter,
  FiSun,
  FiHeart,
  FiTarget,
  FiAward,
  FiZap
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const FruitVegetableDashboard = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [viewMode, setViewMode] = useState('day');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [seasonalTrends, setSeasonalTrends] = useState({});
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  const gradientBg = useColorModeValue(
    'linear(to-r, blue.400, purple.500)',
    'linear(to-r, blue.200, purple.300)'
  );

  const colors = {
    primary: '#4299E1',
    secondary: '#48BB78', 
    accent: '#ED8936',
    warning: '#F56565',
    fruit: '#38A169',
    vegetable: '#3182CE'
  };

  const pieColors = ['#4299E1', '#48BB78', '#ED8936', '#F56565', '#9F7AEA'];

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, viewMode]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const dateParams = getDateRangeParams(dateRange);
      
      // Fetch KPIs
      const kpiResponse = await fetch(`/api/dashboard/kpi?${new URLSearchParams(dateParams)}`);
      const kpiData = await kpiResponse.json();
      if (kpiData.success) setKpis(kpiData.data);

      // Fetch revenue trends
      const trendsResponse = await fetch(`/api/dashboard/revenue-trends?${new URLSearchParams({
        ...dateParams,
        group_by: viewMode
      })}`);
      const trendsData = await trendsResponse.json();
      if (trendsData.success) setRevenueData(trendsData.data);

      // Fetch category performance
      const categoryResponse = await fetch(`/api/dashboard/category-performance?${new URLSearchParams(dateParams)}`);
      const categoryResult = await categoryResponse.json();
      if (categoryResult.success) setCategoryData(categoryResult.data);

      // Fetch seasonal trends
      const seasonalResponse = await fetch('/api/dashboard/seasonal-trends');
      const seasonalResult = await seasonalResponse.json();
      if (seasonalResult.success) setSeasonalTrends(seasonalResult.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeParams = (range) => {
    const today = new Date();
    let dateFrom;
    
    switch (range) {
      case '7days':
        dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        dateFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        dateFrom = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        dateFrom = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0]
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const StatCard = ({ title, value, change, icon, color, isLoading }) => (
    <Card bg={cardBg} borderColor={borderColor} shadow="lg" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.3s">
      <CardBody>
        <Flex align="center">
          <Box>
            <Text fontSize="sm" color={textColor} fontWeight="medium">
              {title}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={color}>
              {isLoading ? <CircularProgress size="20px" isIndeterminate /> : value}
            </Text>
            {change && (
              <HStack spacing={1} mt={1}>
                <StatArrow type={change > 0 ? 'increase' : 'decrease'} />
                <Text fontSize="sm" color={change > 0 ? 'green.500' : 'red.500'}>
                  {Math.abs(change)}%
                </Text>
              </HStack>
            )}
          </Box>
          <Spacer />
          <Icon as={icon} size="24px" color={color} />
        </Flex>
      </CardBody>
    </Card>
  );

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  const currentSeason = getCurrentSeason();
  const currentSeasonData = seasonalTrends[currentSeason] || {};

  return (
    <Box p={6} bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <Box>
            <Heading size="xl" bgGradient={gradientBg} bgClip="text">
              🥬 BiHortus Dashboard
            </Heading>
            <Text color={textColor} mt={1}>
              Gestione Avanzata Frutta e Verdura
            </Text>
          </Box>
          
          <HStack spacing={3}>
            <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} bg={cardBg} maxW="150px">
              <option value="7days">7 giorni</option>
              <option value="30days">30 giorni</option>
              <option value="90days">90 giorni</option>
              <option value="1year">1 anno</option>
            </Select>
            
            <ButtonGroup isAttached variant="outline">
              <Button 
                size="sm" 
                isActive={viewMode === 'day'} 
                onClick={() => setViewMode('day')}
              >
                Giorno
              </Button>
              <Button 
                size="sm" 
                isActive={viewMode === 'week'} 
                onClick={() => setViewMode('week')}
              >
                Settimana
              </Button>
              <Button 
                size="sm" 
                isActive={viewMode === 'month'} 
                onClick={() => setViewMode('month')}
              >
                Mese
              </Button>
            </ButtonGroup>
            
            <Button leftIcon={<FiRefreshCw />} onClick={fetchDashboardData} isLoading={loading}>
              Aggiorna
            </Button>
          </HStack>
        </Flex>

        {/* KPI Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Fatturato Oggi"
            value={formatCurrency(kpis.fatturato_oggi)}
            change={12.5}
            icon={FiDollarSign}
            color={colors.primary}
            isLoading={loading}
          />
          <StatCard
            title="Fatturato Mese"
            value={formatCurrency(kpis.fatturato_mese)}
            change={8.2}
            icon={FiTrendingUp}
            color={colors.secondary}
            isLoading={loading}
          />
          <StatCard
            title="Clienti Attivi"
            value={kpis.clienti_attivi || 0}
            change={5.7}
            icon={FiUsers}
            color={colors.accent}
            isLoading={loading}
          />
          <StatCard
            title="Ordini Aperti"
            value={kpis.ordini_aperti || 0}
            change={-2.1}
            icon={FiPackage}
            color={colors.warning}
            isLoading={loading}
          />
        </SimpleGrid>

        {/* Seasonal Insights */}
        <Card bg={cardBg} shadow="lg">
          <CardHeader>
            <HStack>
              <Icon as={FiSun} color={colors.accent} />
              <Heading size="md">Tendenze Stagionali</Heading>
              <Badge colorScheme="orange" variant="subtle">
                {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              <VStack align="start" spacing={3}>
                <Text fontWeight="semibold" color={textColor}>Trend di Stagione</Text>
                {currentSeasonData.trends?.map((trend, index) => (
                  <HStack key={index}>
                    <Icon as={FiZap} color={colors.secondary} size="14px" />
                    <Text fontSize="sm">{trend}</Text>
                  </HStack>
                ))}
              </VStack>
              
              <VStack align="start" spacing={3}>
                <Text fontWeight="semibold" color={textColor}>Prodotti in Evidenza</Text>
                {currentSeasonData.products?.map((product, index) => (
                  <HStack key={index}>
                    <Icon as={FiHeart} color={colors.fruit} size="14px" />
                    <Text fontSize="sm">{product}</Text>
                  </HStack>
                ))}
              </VStack>
              
              <VStack align="center" spacing={3}>
                <Text fontWeight="semibold" color={textColor}>Crescita Stagionale</Text>
                <CircularProgress 
                  value={Math.abs(currentSeasonData.growth || 0)} 
                  color={currentSeasonData.growth > 0 ? colors.secondary : colors.warning}
                  size="80px"
                  thickness="8px"
                >
                  <CircularProgressLabel fontSize="lg" fontWeight="bold">
                    {currentSeasonData.growth > 0 ? '+' : ''}{currentSeasonData.growth || 0}%
                  </CircularProgressLabel>
                </CircularProgress>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Charts Grid */}
        <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={6}>
          {/* Revenue Trend Chart */}
          <Card bg={cardBg} shadow="lg">
            <CardHeader>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FiBarChart} color={colors.primary} />
                  <Heading size="md">Andamento Fatturato</Heading>
                </HStack>
                <Button size="sm" leftIcon={<FiDownload />} variant="ghost">
                  Esporta
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              <Box h="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colors.secondary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                    <XAxis dataKey="date" stroke={textColor} fontSize={12} />
                    <YAxis stroke={textColor} fontSize={12} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: cardBg, 
                        border: `1px solid ${borderColor}`,
                        borderRadius: '8px'
                      }}
                      formatter={(value, name) => [formatCurrency(value), name === 'revenue' ? 'Fatturato' : 'Margine']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={colors.primary} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)"
                      strokeWidth={3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="margin" 
                      stroke={colors.secondary} 
                      fillOpacity={1} 
                      fill="url(#colorMargin)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>

          {/* Category Performance */}
          <Card bg={cardBg} shadow="lg">
            <CardHeader>
              <HStack>
                <Icon as={FiTarget} color={colors.accent} />
                <Heading size="md">Performance Categorie</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box h="200px">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="revenue"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                
                <Divider />
                
                <VStack spacing={3} align="stretch">
                  {categoryData.slice(0, 3).map((category, index) => (
                    <HStack key={category.category} justify="space-between">
                      <HStack>
                        <Box w="12px" h="12px" borderRadius="full" bg={pieColors[index]} />
                        <Text fontSize="sm" fontWeight="medium">{category.category}</Text>
                      </HStack>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">{formatCurrency(category.revenue)}</Text>
                        <Text fontSize="xs" color={textColor}>{category.marginPercent}% margine</Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          {/* Top Performers */}
          <Card bg={cardBg} shadow="lg">
            <CardHeader>
              <HStack>
                <Icon as={FiAward} color={colors.secondary} />
                <Heading size="md">Top Prodotti</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {['Pomodori Ciliegino', 'Mele Golden', 'Insalata Iceberg'].map((product, index) => (
                  <HStack key={product} justify="space-between">
                    <HStack>
                      <Avatar size="sm" name={product} bg={index === 0 ? 'green.500' : index === 1 ? 'red.500' : 'blue.500'} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">{product}</Text>
                        <Text fontSize="xs" color={textColor}>{120 - index * 20} vendite</Text>
                      </VStack>
                    </HStack>
                    <Badge colorScheme={index === 0 ? 'green' : index === 1 ? 'orange' : 'blue'}>
                      #{index + 1}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Quality Score */}
          <Card bg={cardBg} shadow="lg">
            <CardHeader>
              <HStack>
                <Icon as={FiHeart} color={colors.fruit} />
                <Heading size="md">Qualità Prodotti</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <CircularProgress value={92} color={colors.secondary} size="100px" thickness="8px">
                  <CircularProgressLabel fontSize="xl" fontWeight="bold">92%</CircularProgressLabel>
                </CircularProgress>
                <VStack spacing={2}>
                  <Text fontSize="sm" color={textColor} textAlign="center">
                    Score medio qualità
                  </Text>
                  <HStack>
                    <Badge colorScheme="green">Biologico 35%</Badge>
                    <Badge colorScheme="blue">Locale 68%</Badge>
                  </HStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Customer Satisfaction */}
          <Card bg={cardBg} shadow="lg">
            <CardHeader>
              <HStack>
                <Icon as={FiUsers} color={colors.accent} />
                <Heading size="md">Soddisfazione Cliente</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Text fontSize="3xl" fontWeight="bold" color={colors.primary}>4.8/5</Text>
                <Progress value={96} colorScheme="blue" size="lg" w="100%" borderRadius="full" />
                <VStack spacing={1}>
                  <Text fontSize="sm" color={textColor}>Basato su 247 recensioni</Text>
                  <HStack>
                    <Text fontSize="xs" color={colors.secondary}>↑ +12% questo mese</Text>
                  </HStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default FruitVegetableDashboard;