import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Input,
  Button,
  Select,
  Badge,
  HStack,
  VStack,
  Avatar,
  Progress,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Flex,
  Spacer,
  InputGroup,
  InputLeftElement,
  ButtonGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Alert,
  AlertIcon,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  Tag,
  TagLabel,
  TagLeftIcon,
  Switch,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit,
  FiPhone,
  FiMail,
  FiMapPin,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiStar,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiMoreVertical,
  FiPlus,
  FiDownload,
  FiRefreshCw,
  FiUsers,
  FiShoppingCart,
  FiCreditCard,
  FiActivity,
  FiTarget,
  FiAward,
  FiBarChart
} from 'react-icons/fi';

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [creditFilter, setCreditFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [timePeriod, setTimePeriod] = useState('total');
  const [summaryStats, setSummaryStats] = useState(null);
  const [tableSortColumn, setTableSortColumn] = useState(null);
  const [tableSortDirection, setTableSortDirection] = useState('asc');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const accentColor = useColorModeValue('blue.600', 'blue.400');
  const successColor = useColorModeValue('green.500', 'green.400');
  const warningColor = useColorModeValue('orange.500', 'orange.400');
  const errorColor = useColorModeValue('red.500', 'red.400');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, search, typeFilter, categoryFilter, statusFilter, creditFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (customers.length > 0) {
      calculateSummaryStats();
    }
  }, [customers, timePeriod]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers?limit=1000');
      const data = await response.json();
      
      if (data.success) {
        // Use real ARCA data with business analytics already included
        const enrichedCustomers = data.data.map(customer => ({
          ...customer,
          analytics: {
            totalRevenue: customer.totalRevenue || 0,
            avgOrderValue: Math.round((customer.totalRevenue || 0) / Math.max(1, customer.totalOrders || 1)),
            orderFrequency: customer.totalOrders || 0,
            creditScore: customer.creditScore || 0,
            paymentBehavior: customer.creditScore > 80 ? 'Excellent' : customer.creditScore > 60 ? 'Good' : 'Warning',
            lastOrder: customer.lastOrderDate || 'N/A',
            growth: 0, // TODO: Calculate from historical data
            preferredProducts: ['Prodotti vari'], // TODO: Get from order history
            seasonality: 'All year',
            marginContribution: 25 // Default margin
          },
          status: customer.status === 'Paid' ? 'active' : customer.status === 'Overdue' ? 'warning' : 'active',
          riskLevel: customer.creditScore > 80 ? 'low' : customer.creditScore > 60 ? 'medium' : 'high'
        }));
        
        setCustomers(enrichedCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;
    
    // Search filter (name, code, VAT, address)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.code?.toLowerCase().includes(searchLower) ||
        customer.vatNumber?.toLowerCase().includes(searchLower) ||
        customer.address?.toLowerCase().includes(searchLower)
      );
    }
    
    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(customer => customer.type === typeFilter);
    }
    
    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(customer => customer.category === categoryFilter);
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }
    
    // Credit score filter
    if (creditFilter) {
      switch (creditFilter) {
        case 'excellent':
          filtered = filtered.filter(customer => customer.creditScore >= 80);
          break;
        case 'good':
          filtered = filtered.filter(customer => customer.creditScore >= 60 && customer.creditScore < 80);
          break;
        case 'poor':
          filtered = filtered.filter(customer => customer.creditScore < 60);
          break;
        case 'overdue':
          filtered = filtered.filter(customer => customer.overdueInvoices > 0);
          break;
        case 'high_revenue':
          filtered = filtered.filter(customer => customer.totalRevenue > 10000);
          break;
      }
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'revenue':
          aVal = a.totalRevenue || 0;
          bVal = b.totalRevenue || 0;
          break;
        case 'creditScore':
          aVal = a.creditScore || 0;
          bVal = b.creditScore || 0;
          break;
        case 'lastOrder':
          aVal = a.lastOrderDate ? new Date(a.lastOrderDate) : new Date(0);
          bVal = b.lastOrderDate ? new Date(b.lastOrderDate) : new Date(0);
          break;
        case 'openAmount':
          aVal = a.openAmount || 0;
          bVal = b.openAmount || 0;
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredCustomers(filtered);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const calculateSummaryStats = async () => {
    try {
      let dateFilter = '';
      let previousDateFilter = '';
      const currentDate = new Date();
      
      switch (timePeriod) {
        case '1year':
          dateFilter = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
          previousDateFilter = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
          break;
        case 'currentYear':
          dateFilter = new Date(currentDate.getFullYear(), 0, 1);
          previousDateFilter = new Date(currentDate.getFullYear() - 1, 0, 1);
          break;
        case '2years':
          dateFilter = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
          previousDateFilter = new Date(currentDate.getFullYear() - 4, currentDate.getMonth(), currentDate.getDate());
          break;
        case 'total':
        default:
          dateFilter = null;
          previousDateFilter = null;
      }
      
      // Calcola statistiche dal periodo corrente
      const periodRevenue = customers.reduce((sum, customer) => {
        if (!dateFilter) return sum + (customer.totalRevenue || 0);
        
        // Se abbiamo una data filtro, dovremmo fare una chiamata API specifica
        // Per ora usiamo il fatturato totale come approssimazione
        return sum + (customer.totalRevenue || 0);
      }, 0);
      
      const activeCustomersCount = customers.filter(c => c.status === 'active').length;
      const averageCreditScore = customers.reduce((sum, c) => sum + (c.creditScore || 0), 0) / Math.max(1, customers.length);
      const newCustomersThisMonth = customers.filter(c => {
        if (!c.since) return false;
        const customerSince = new Date(c.since);
        const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        return customerSince >= thisMonth;
      }).length;
      
      setSummaryStats({
        totalRevenue: periodRevenue,
        revenueGrowth: 0, // Calcolo reale necessita chiamata API separata
        totalCustomers: customers.length,
        activeCustomers: activeCustomersCount,
        averageCreditScore: Math.round(averageCreditScore),
        creditScoreChange: 0, // Calcolo reale necessita dati storici
        newCustomers: newCustomersThisMonth,
        newCustomersGrowth: 0 // Calcolo reale necessita dati mese precedente
      });
      
    } catch (error) {
      console.error('Error calculating summary stats:', error);
    }
  };

  const handleColumnSort = (column) => {
    if (tableSortColumn === column) {
      setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortColumn(column);
      setTableSortDirection('asc');
    }
    
    // Aggiorna anche il sorting principale
    setSortBy(column);
    setSortOrder(tableSortDirection === 'asc' ? 'desc' : 'asc');
  };

  const getSortIcon = (column) => {
    if (tableSortColumn !== column) return null;
    return tableSortDirection === 'asc' ? '↑' : '↓';
  };

  const exportToCSV = () => {
    const headers = [
      'Codice', 'Nome', 'Tipo', 'Categoria', 'P.IVA', 'Indirizzo', 
      'Telefono', 'Email', 'Limite Credito', 'Fatturato Totale', 
      'Ordini Totali', 'Credit Score', 'Fatture Scadute', 'Importo Scaduto', 
      'Ultimo Ordine', 'Cliente dal', 'Stato'
    ];
    
    const rows = filteredCustomers.map(customer => [
      customer.code,
      customer.name,
      customer.type,
      customer.category,
      customer.vatNumber || '',
      customer.address || '',
      customer.phone || '',
      customer.email || '',
      customer.creditLimit || 0,
      customer.totalRevenue || 0,
      customer.totalOrders || 0,
      customer.creditScore || 0,
      customer.overdueInvoices || 0,
      customer.openAmount || 0,
      customer.lastOrderDate || '',
      customer.since || '',
      customer.status
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clienti_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'warning': return 'orange';
      case 'inactive': return 'red';
      default: return 'gray';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const getCustomerTypeIcon = (type) => {
    const icons = {
      'Ristorante': '🍽️',
      'Hotel': '🏨',
      'Supermercato': '🏪',
      'Pizzeria': '🍕',
      'Bar': '☕',
      'Catering': '🎉',
      'Mensa': '🍱'
    };
    return icons[type] || '🏢';
  };

  const CustomerCard = ({ customer }) => (
    <Card 
      bg={cardBg} 
      shadow="xl" 
      borderRadius="xl" 
      _hover={{ transform: 'translateY(-4px)', shadow: '2xl' }} 
      transition="all 0.3s"
      cursor="pointer"
      onClick={() => {
        setSelectedCustomer(customer);
        onOpen();
      }}
      border="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <HStack>
              <Avatar 
                name={customer.name} 
                bg={getStatusColor(customer.status) + '.500'}
                size="md"
              />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                  {customer.name}
                </Text>
                <Text fontSize="sm" color={textColor}>
                  {customer.code}
                </Text>
              </VStack>
            </HStack>
            <VStack spacing={1}>
              <Badge colorScheme={getStatusColor(customer.status)} variant="solid">
                {customer.status}
              </Badge>
              <Badge colorScheme={getRiskColor(customer.riskLevel)} size="sm">
                {customer.riskLevel} risk
              </Badge>
            </VStack>
          </HStack>

          {/* Business Metrics */}
          <SimpleGrid columns={2} spacing={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={textColor} fontWeight="600">FATTURATO TOTALE</Text>
              <Text fontSize="lg" fontWeight="bold" color={accentColor}>
                {formatCurrency(customer.totalRevenue)}
              </Text>
              <Text fontSize="xs" color={textColor}>
                {timePeriod === 'total' ? 'Storico' : 
                 timePeriod === '1year' ? 'Ultimi 12 mesi' :
                 timePeriod === 'currentYear' ? 'Anno corrente' : 'Ultimi 2 anni'}
              </Text>
            </VStack>

            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={textColor} fontWeight="600">CREDITO</Text>
              <Text fontSize="lg" fontWeight="bold" color={warningColor}>
                {formatCurrency(customer.creditLimit || 0)}
              </Text>
              <Progress 
                value={(customer.analytics.totalRevenue / (customer.creditLimit || 1)) * 100} 
                colorScheme="orange" 
                size="sm" 
                borderRadius="full"
                w="full"
              />
            </VStack>
          </SimpleGrid>

          {/* Customer Details */}
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color={textColor}>Tipo:</Text>
              <HStack>
                <Text fontSize="lg">{getCustomerTypeIcon(customer.type)}</Text>
                <Text fontSize="sm" fontWeight="medium">{customer.type}</Text>
              </HStack>
            </HStack>
            
            <HStack justify="space-between">
              <Text fontSize="sm" color={textColor}>Categoria:</Text>
              <Badge colorScheme={customer.category === 'A' ? 'green' : customer.category === 'B' ? 'blue' : 'gray'}>
                Categoria {customer.category}
              </Badge>
            </HStack>

            <HStack justify="space-between">
              <Text fontSize="sm" color={textColor}>Ultimo ordine:</Text>
              <Text fontSize="sm" fontWeight="medium">
                {customer.analytics.lastOrder}
              </Text>
            </HStack>
          </VStack>

          {/* Performance Indicators */}
          <HStack spacing={4}>
            <Tooltip label={`Credit Score: ${customer.analytics.creditScore}/100`}>
              <VStack spacing={1}>
                <CircularProgress 
                  value={customer.analytics.creditScore} 
                  color={customer.analytics.creditScore > 80 ? 'green.400' : customer.analytics.creditScore > 60 ? 'yellow.400' : 'red.400'}
                  size="40px"
                  thickness="8px"
                >
                  <CircularProgressLabel fontSize="xs" fontWeight="bold">
                    {customer.analytics.creditScore}
                  </CircularProgressLabel>
                </CircularProgress>
                <Text fontSize="xs" color={textColor}>Credit</Text>
              </VStack>
            </Tooltip>

            <Tooltip label={`Margine Contribuzione: ${customer.analytics.marginContribution}%`}>
              <VStack spacing={1}>
                <CircularProgress 
                  value={customer.analytics.marginContribution * 2.5} 
                  color="blue.400"
                  size="40px"
                  thickness="8px"
                >
                  <CircularProgressLabel fontSize="xs" fontWeight="bold">
                    {customer.analytics.marginContribution}%
                  </CircularProgressLabel>
                </CircularProgress>
                <Text fontSize="xs" color={textColor}>Margine</Text>
              </VStack>
            </Tooltip>

            <VStack spacing={1} flex="1">
              <Text fontSize="xs" color={textColor}>Comportamento</Text>
              <Badge 
                colorScheme={
                  customer.analytics.paymentBehavior === 'Excellent' ? 'green' :
                  customer.analytics.paymentBehavior === 'Good' ? 'blue' : 'red'
                }
                variant="solid"
                borderRadius="full"
              >
                {customer.analytics.paymentBehavior}
              </Badge>
            </VStack>
          </HStack>

          {/* Quick Actions */}
          <HStack spacing={2}>
            <Button size="sm" leftIcon={<FiEye />} colorScheme="blue" variant="outline" flex="1">
              Dettagli
            </Button>
            <Button size="sm" leftIcon={<FiShoppingCart />} colorScheme="green" variant="outline" flex="1">
              Ordini
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  const CustomerModal = ({ customer, isOpen, onClose }) => {
    if (!customer) return null;
    
    const [customerDetails, setCustomerDetails] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [productPreferences, setProductPreferences] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (isOpen && customer) {
        fetchCustomerDetails();
      }
    }, [isOpen, customer]);

    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        const [analyticsResponse, detailsResponse] = await Promise.all([
          fetch(`/api/customers/${customer.code}/analytics?months=12`),
          fetch(`/api/customers/${customer.code}`)
        ]);
        
        if (analyticsResponse.ok && detailsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          const detailsData = await detailsResponse.json();
          
          if (analyticsData.success && detailsData.success) {
            setCustomerDetails(detailsData.data);
            setRevenueData(analyticsData.data.revenue_trend || []);
            setProductPreferences(analyticsData.data.product_preferences || []);
          }
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Avatar name={customer.name} bg={getStatusColor(customer.status) + '.500'} />
              <VStack align="start" spacing={0}>
                <Text>{customer.name}</Text>
                <Text fontSize="sm" color={textColor}>{customer.code}</Text>
              </VStack>
              <Spacer />
              <Badge colorScheme={getStatusColor(customer.status)} size="lg">
                {customer.status}
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Panoramica</Tab>
                <Tab>Vendite</Tab>
                <Tab>Crediti</Tab>
                <Tab>Analytics</Tab>
                <Tab>Storico</Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel>
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                    <VStack spacing={4} align="stretch">
                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Informazioni Cliente</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <Text color={textColor}>Email:</Text>
                              <Text fontWeight="medium">{customer.email || 'Non disponibile'}</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Telefono:</Text>
                              <Text fontWeight="medium">{customer.phone || 'Non disponibile'}</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Indirizzo:</Text>
                              <Text fontWeight="medium" textAlign="right" maxW="200px">
                                {customer.address || 'Non disponibile'}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>P.IVA:</Text>
                              <Text fontWeight="medium">{customer.vatNumber || 'Non disponibile'}</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Cliente dal:</Text>
                              <Text fontWeight="medium">{customer.since || 'Non disponibile'}</Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Termini Commerciali</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <Text color={textColor}>Limite Credito:</Text>
                              <Text fontWeight="bold" color={accentColor}>
                                {formatCurrency(customer.creditLimit)}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Termini Pagamento:</Text>
                              <Text fontWeight="medium">{customer.paymentTerms || 30} giorni</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Categoria:</Text>
                              <Badge colorScheme={customer.category === 'A' ? 'green' : 'blue'}>
                                {customer.category}
                              </Badge>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Sconto:</Text>
                              <Text fontWeight="medium">
                                0%
                              </Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    </VStack>

                    <VStack spacing={4} align="stretch">
                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Metriche Business</Heading>
                        </CardHeader>
                        <CardBody>
                          <SimpleGrid columns={2} spacing={4}>
                            <Stat>
                              <StatLabel>Fatturato Totale</StatLabel>
                              <StatNumber color={accentColor}>
                                {formatCurrency(customer.analytics.totalRevenue)}
                              </StatNumber>
                              <StatHelpText>
                                <StatArrow type={customer.analytics.growth > 0 ? 'increase' : 'decrease'} />
                                {Math.abs(customer.analytics.growth).toFixed(1)}%
                              </StatHelpText>
                            </Stat>

                            <Stat>
                              <StatLabel>Valore Medio Ordine</StatLabel>
                              <StatNumber color={successColor}>
                                {formatCurrency(customer.analytics.avgOrderValue)}
                              </StatNumber>
                              <StatHelpText>Ultimo mese</StatHelpText>
                            </Stat>

                            <Stat>
                              <StatLabel>Frequenza Ordini</StatLabel>
                              <StatNumber>{customer.analytics.orderFrequency}</StatNumber>
                              <StatHelpText>ordini/mese</StatHelpText>
                            </Stat>

                            <Stat>
                              <StatLabel>Credit Score</StatLabel>
                              <StatNumber color={customer.analytics.creditScore > 80 ? successColor : warningColor}>
                                {customer.analytics.creditScore}/100
                              </StatNumber>
                              <StatHelpText>Affidabilità</StatHelpText>
                            </Stat>
                          </SimpleGrid>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Preferenze Prodotti</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            {productPreferences.map((pref, index) => (
                              <Box key={index}>
                                <HStack justify="space-between" mb={1}>
                                  <Text fontSize="sm" fontWeight="medium">{pref.product}</Text>
                                  <Text fontSize="sm" color={textColor}>{pref.percentage}%</Text>
                                </HStack>
                                <Progress 
                                  value={pref.percentage} 
                                  colorScheme="blue" 
                                  size="sm" 
                                  borderRadius="full"
                                />
                              </Box>
                            ))}
                          </VStack>
                        </CardBody>
                      </Card>
                    </VStack>
                  </Grid>
                </TabPanel>

                {/* Sales Tab */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Card bg={cardBg}>
                      <CardHeader>
                        <Heading size="sm">Andamento Vendite</Heading>
                      </CardHeader>
                      <CardBody>
                        <Box h="300px">
                          {loading ? (
                            <Flex justify="center" align="center" h="100%">
                              <CircularProgress isIndeterminate />
                            </Flex>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <RechartsTooltip 
                                  formatter={(value, name) => [
                                    name === 'revenue' ? formatCurrency(value) : value,
                                    name === 'revenue' ? 'Fatturato' : 'Ordini'
                                  ]}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="revenue" 
                                  stroke="#0088FE" 
                                  fill="#0088FE" 
                                  fillOpacity={0.3}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </Box>
                      </CardBody>
                    </Card>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Stat bg={cardBg} p={4} borderRadius="lg">
                        <StatLabel>Ordini Totali</StatLabel>
                        <StatNumber>{customer.totalOrders || 0}</StatNumber>
                        <StatHelpText>Dal {customer.since}</StatHelpText>
                      </Stat>
                      <Stat bg={cardBg} p={4} borderRadius="lg">
                        <StatLabel>Credit Score</StatLabel>
                        <StatNumber>{customer.creditScore}/100</StatNumber>
                        <StatHelpText>Affidabilità pagamenti</StatHelpText>
                      </Stat>
                      <Stat bg={cardBg} p={4} borderRadius="lg">
                        <StatLabel>Fatturato Medio/Ordine</StatLabel>
                        <StatNumber>{formatCurrency(customer.analytics.avgOrderValue)}</StatNumber>
                        <StatHelpText>Valore medio ordini</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </VStack>
                </TabPanel>

                {/* Credits Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Alert 
                      status={customer.status === 'Overdue' ? 'error' : customer.overdueInvoices > 0 ? 'warning' : 'success'} 
                      borderRadius="lg"
                    >
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Situazione Creditizia</Text>
                        <Text fontSize="sm">
                          {customer.status === 'Overdue' 
                            ? `Cliente con ${customer.overdueInvoices} fatture scadute`
                            : customer.overdueInvoices > 0 
                              ? `${customer.overdueInvoices} fatture in scadenza`
                              : 'Cliente in regola con i pagamenti'
                          } - Aggiornato: {new Date().toLocaleDateString('it-IT')}
                        </Text>
                      </Box>
                    </Alert>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <Card bg={cardBg}>
                        <CardBody>
                          <VStack spacing={4}>
                            <Heading size="sm">Esposizione Attuale</Heading>
                            <CircularProgress 
                              value={customer.creditLimit > 0 ? (customer.openAmount / customer.creditLimit * 100) : 0} 
                              color={customer.openAmount > customer.creditLimit * 0.8 ? "red.400" : "blue.400"}
                              size="120px"
                              thickness="12px"
                            >
                              <CircularProgressLabel>
                                <VStack spacing={0}>
                                  <Text fontSize="lg" fontWeight="bold">
                                    {customer.creditLimit > 0 ? Math.round(customer.openAmount / customer.creditLimit * 100) : 0}%
                                  </Text>
                                  <Text fontSize="xs">del limite</Text>
                                </VStack>
                              </CircularProgressLabel>
                            </CircularProgress>
                            <VStack spacing={1}>
                              <Text fontSize="lg" fontWeight="bold" color={accentColor}>
                                {formatCurrency(customer.openAmount || 0)}
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                su {formatCurrency(customer.creditLimit || 0)}
                              </Text>
                            </VStack>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Scadenzario</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <Text color={textColor}>Fatture Scadute:</Text>
                              <Text fontWeight="bold" color={errorColor}>
                                {formatCurrency(customer.openAmount || 0)}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Numero Fatture Scadute:</Text>
                              <Text fontWeight="bold" color={errorColor}>
                                {customer.overdueInvoices || 0}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Ritardo Medio Pagamenti:</Text>
                              <Text fontWeight="bold" color={customer.paymentDelay > 0 ? errorColor : successColor}>
                                {Math.round(customer.paymentDelay || 0)} giorni
                              </Text>
                            </HStack>
                            <Divider />
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Totale Esposizione:</Text>
                              <Text fontWeight="bold" fontSize="lg" color={accentColor}>
                                {formatCurrency(customer.openAmount || 0)}
                              </Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                  </VStack>
                </TabPanel>

                {/* Analytics Tab */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    <Card bg={cardBg}>
                      <CardHeader>
                        <Heading size="sm">Analisi Comportamentale</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Text>Puntualità Pagamenti:</Text>
                            <Badge 
                              colorScheme={customer.analytics.paymentBehavior === 'Excellent' ? 'green' : 
                                         customer.analytics.paymentBehavior === 'Good' ? 'blue' : 'red'} 
                              variant="solid"
                            >
                              {customer.analytics.paymentBehavior}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Cliente dal:</Text>
                            <Text fontWeight="medium">{customer.since}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Ultimo Ordine:</Text>
                            <Text fontWeight="medium">{customer.lastOrderDate || 'Mai'}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Livello Rischio:</Text>
                            <Badge colorScheme={getRiskColor(customer.riskLevel)}>
                              {customer.riskLevel}
                            </Badge>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg}>
                      <CardHeader>
                        <Heading size="sm">Raccomandazioni</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          {customer.creditScore > 80 && customer.openAmount === 0 && (
                            <Alert status="success" size="sm" borderRadius="md">
                              <AlertIcon />
                              <Text fontSize="sm">Cliente affidabile - Considerare aumento limite credito</Text>
                            </Alert>
                          )}
                          {customer.overdueInvoices > 0 && (
                            <Alert status="warning" size="sm" borderRadius="md">
                              <AlertIcon />
                              <Text fontSize="sm">Attenzione: {customer.overdueInvoices} fatture scadute da verificare</Text>
                            </Alert>
                          )}
                          {customer.paymentDelay > 30 && (
                            <Alert status="error" size="sm" borderRadius="md">
                              <AlertIcon />
                              <Text fontSize="sm">Ritardi pagamenti elevati - Valutare riduzione credito</Text>
                            </Alert>
                          )}
                          {customer.totalOrders === 0 && (
                            <Alert status="info" size="sm" borderRadius="md">
                              <AlertIcon />
                              <Text fontSize="sm">Cliente senza ordini - Contattare per riattivazione</Text>
                            </Alert>
                          )}
                          {!customer.overdueInvoices && customer.creditScore > 70 && customer.totalOrders > 10 && (
                            <Alert status="success" size="sm" borderRadius="md">
                              <AlertIcon />
                              <Text fontSize="sm">Cliente in regola - Valutare offerte commerciali dedicate</Text>
                            </Alert>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </TabPanel>

                {/* History Tab */}
                <TabPanel>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Storico Attività</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        {loading ? (
                          <Flex justify="center" p={8}>
                            <CircularProgress isIndeterminate />
                          </Flex>
                        ) : (
                          <>
                            <HStack p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                              <Icon as={FiCalendar} color={accentColor} />
                              <VStack align="start" spacing={0} flex="1">
                                <Text fontSize="sm" fontWeight="medium">Cliente attivo dal</Text>
                                <Text fontSize="xs" color={textColor}>{customer.since}</Text>
                              </VStack>
                              <Text fontWeight="bold" color={accentColor}>
                                {customer.totalOrders} ordini
                              </Text>
                            </HStack>
                            
                            {customer.lastOrderDate && (
                              <HStack p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                <Icon as={FiShoppingCart} color={successColor} />
                                <VStack align="start" spacing={0} flex="1">
                                  <Text fontSize="sm" fontWeight="medium">Ultimo ordine</Text>
                                  <Text fontSize="xs" color={textColor}>{customer.lastOrderDate}</Text>
                                </VStack>
                                <Text fontWeight="bold" color={accentColor}>
                                  {formatCurrency(customer.analytics.avgOrderValue)}
                                </Text>
                              </HStack>
                            )}
                            
                            {customer.openAmount > 0 && (
                              <HStack p={3} bg={useColorModeValue('red.50', 'red.900')} borderRadius="md">
                                <Icon as={FiAlertTriangle} color={errorColor} />
                                <VStack align="start" spacing={0} flex="1">
                                  <Text fontSize="sm" fontWeight="medium">Fatture scadute</Text>
                                  <Text fontSize="xs" color={textColor}>{customer.overdueInvoices} fatture</Text>
                                </VStack>
                                <Text fontWeight="bold" color={errorColor}>
                                  {formatCurrency(customer.openAmount)}
                                </Text>
                              </HStack>
                            )}
                            
                            <HStack p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                              <Icon as={FiDollarSign} color={accentColor} />
                              <VStack align="start" spacing={0} flex="1">
                                <Text fontSize="sm" fontWeight="medium">Fatturato totale</Text>
                                <Text fontSize="xs" color={textColor}>Storico completo</Text>
                              </VStack>
                              <Text fontWeight="bold" color={accentColor}>
                                {formatCurrency(customer.totalRevenue)}
                              </Text>
                            </HStack>
                          </>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  // Summary stats are now calculated in calculateSummaryStats function

  const customerTypes = [...new Set(customers.map(c => c.type))].filter(Boolean);

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="xl" color={accentColor} fontWeight="800">
              👥 Gestione Clienti
            </Heading>
            <Text color={textColor} mt={1}>
              Analisi completa e gestione clienti all'ingrosso
            </Text>
          </Box>
          
          <HStack spacing={3}>
            <Menu>
              <MenuButton as={Button} leftIcon={<FiPlus />} colorScheme="blue" size="md">
                Nuovo Cliente
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiEdit />}>Inserimento Manuale</MenuItem>
                <MenuItem icon={<FiDownload />}>Importa da CSV</MenuItem>
              </MenuList>
            </Menu>
            
            <Menu>
              <MenuButton as={Button} leftIcon={<FiDownload />} variant="outline" size="md">
                Esporta
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiDownload />} onClick={exportToCSV}>
                  Esporta CSV ({filteredCustomers.length} clienti)
                </MenuItem>
                <MenuItem icon={<FiDownload />}>Esporta Excel</MenuItem>
                <MenuItem icon={<FiDownload />}>Esporta PDF</MenuItem>
              </MenuList>
            </Menu>
            
            <Button 
              leftIcon={<FiRefreshCw />} 
              variant="outline" 
              size="md" 
              onClick={fetchCustomers}
              isLoading={loading}
            >
              Aggiorna
            </Button>
          </HStack>
        </Flex>

        {/* Time Period Filter */}
        <Card bg={cardBg} shadow="lg" borderRadius="xl">
          <CardBody>
            <HStack spacing={4} justify="space-between">
              <Text fontWeight="bold" color={accentColor}>Periodo di Analisi:</Text>
              <HStack spacing={2}>
                <ButtonGroup isAttached variant="outline" size="sm">
                  <Button 
                    isActive={timePeriod === '1year'}
                    onClick={() => setTimePeriod('1year')}
                  >
                    Ultimi 12 Mesi
                  </Button>
                  <Button 
                    isActive={timePeriod === 'currentYear'}
                    onClick={() => setTimePeriod('currentYear')}
                  >
                    Anno Corrente
                  </Button>
                  <Button 
                    isActive={timePeriod === '2years'}
                    onClick={() => setTimePeriod('2years')}
                  >
                    Ultimi 2 Anni
                  </Button>
                  <Button 
                    isActive={timePeriod === 'total'}
                    onClick={() => setTimePeriod('total')}
                  >
                    Totale Storico
                  </Button>
                </ButtonGroup>
              </HStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Summary Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Clienti Totali</StatLabel>
            <StatNumber fontSize="3xl" color={accentColor}>
              {summaryStats ? summaryStats.totalCustomers : customers.length}
            </StatNumber>
            <StatHelpText>
              {summaryStats ? summaryStats.activeCustomers : filteredCustomers.filter(c => c.status === 'active').length} attivi
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>
              Fatturato {timePeriod === 'total' ? 'Totale' : 
                       timePeriod === '1year' ? '(12 Mesi)' :
                       timePeriod === 'currentYear' ? '(Anno Corrente)' : '(2 Anni)'}
            </StatLabel>
            <StatNumber fontSize="3xl" color={successColor}>
              {formatCurrency(summaryStats ? summaryStats.totalRevenue : 0)}
            </StatNumber>
            <StatHelpText>
              {summaryStats && summaryStats.revenueGrowth !== 0 && (
                <>
                  <StatArrow type={summaryStats.revenueGrowth > 0 ? "increase" : "decrease"} />
                  {Math.abs(summaryStats.revenueGrowth).toFixed(1)}% vs periodo precedente
                </>
              )}
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Credit Score Medio</StatLabel>
            <StatNumber fontSize="3xl" color={warningColor}>
              {summaryStats ? summaryStats.averageCreditScore : Math.round(customers.reduce((sum, c) => sum + (c.creditScore || 0), 0) / Math.max(1, customers.length))}
            </StatNumber>
            <StatHelpText>
              Su base {customers.length} clienti
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Nuovi Questo Mese</StatLabel>
            <StatNumber fontSize="3xl" color={accentColor}>
              {summaryStats ? summaryStats.newCustomers : 0}
            </StatNumber>
            <StatHelpText>
              Clienti acquisiti nel mese
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <Card bg={cardBg} shadow="lg" borderRadius="xl">
          <CardBody>
            <VStack spacing={4} align="stretch">
              {/* Primary filters */}
              <HStack spacing={4} flexWrap="wrap">
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <Icon as={FiSearch} color={textColor} />
                  </InputLeftElement>
                  <Input
                    placeholder="Cerca per nome, codice, P.IVA..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
                
                <Select 
                  placeholder="Tutti i tipi" 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                  maxW="200px"
                >
                  {customerTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
                
                <Select 
                  placeholder="Tutte le categorie" 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  maxW="200px"
                >
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="VIP">VIP</option>
                </Select>
                
                <ButtonGroup isAttached variant="outline">
                  <Button 
                    leftIcon={<FiUsers />}
                    isActive={viewMode === 'grid'} 
                    onClick={() => setViewMode('grid')}
                  >
                    Griglia
                  </Button>
                  <Button 
                    leftIcon={<FiBarChart />}
                    isActive={viewMode === 'list'} 
                    onClick={() => setViewMode('list')}
                  >
                    Lista
                  </Button>
                </ButtonGroup>
                
                <Button 
                  leftIcon={<FiFilter />} 
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  colorScheme={showAdvancedFilters ? 'blue' : 'gray'}
                >
                  Filtri Avanzati
                </Button>
                
                {(search || typeFilter || categoryFilter || statusFilter || creditFilter) && (
                  <Button 
                    leftIcon={<FiRefreshCw />} 
                    variant="ghost" 
                    onClick={() => {
                      setSearch('');
                      setTypeFilter('');
                      setCategoryFilter('');
                      setStatusFilter('');
                      setCreditFilter('');
                    }}
                  >
                    Reset
                  </Button>
                )}
              </HStack>
              
              {/* Advanced filters */}
              {showAdvancedFilters && (
                <HStack spacing={4} flexWrap="wrap" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                  <Select 
                    placeholder="Tutti gli stati" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    maxW="200px"
                  >
                    <option value="active">Attivi</option>
                    <option value="warning">In allerta</option>
                    <option value="inactive">Inattivi</option>
                  </Select>
                  
                  <Select 
                    placeholder="Filtra per credito" 
                    value={creditFilter} 
                    onChange={(e) => setCreditFilter(e.target.value)}
                    maxW="200px"
                  >
                    <option value="excellent">Credit Score Eccellente (80+)</option>
                    <option value="good">Credit Score Buono (60-79)</option>
                    <option value="poor">Credit Score Basso (&lt;60)</option>
                    <option value="overdue">Con fatture scadute</option>
                    <option value="high_revenue">Alto fatturato (&gt;10k)</option>
                  </Select>
                  
                  <Select 
                    placeholder="Ordina per" 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    maxW="200px"
                  >
                    <option value="name">Nome</option>
                    <option value="revenue">Fatturato</option>
                    <option value="creditScore">Credit Score</option>
                    <option value="lastOrder">Ultimo Ordine</option>
                    <option value="openAmount">Importo Scaduto</option>
                  </Select>
                  
                  <ButtonGroup isAttached size="sm">
                    <Button 
                      variant={sortOrder === 'asc' ? 'solid' : 'outline'}
                      onClick={() => setSortOrder('asc')}
                    >
                      ↑ ASC
                    </Button>
                    <Button 
                      variant={sortOrder === 'desc' ? 'solid' : 'outline'}
                      onClick={() => setSortOrder('desc')}
                    >
                      ↓ DESC
                    </Button>
                  </ButtonGroup>
                  
                  <Text fontSize="sm" color={textColor}>
                    Trovati: <strong>{filteredCustomers.length}</strong> su {customers.length} clienti
                  </Text>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Customers Grid */}
        {loading ? (
          <Flex justify="center" align="center" h="400px">
            <VStack spacing={4}>
              <CircularProgress isIndeterminate color="blue.500" size="60px" />
              <Text color={textColor}>Caricamento clienti...</Text>
            </VStack>
          </Flex>
        ) : viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {filteredCustomers.map(customer => (
              <CustomerCard key={customer.code} customer={customer} />
            ))}
          </SimpleGrid>
        ) : (
          <Card bg={cardBg} shadow="lg" borderRadius="xl">
            <CardBody>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th 
                        cursor="pointer" 
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        onClick={() => handleColumnSort('name')}
                      >
                        Cliente {getSortIcon('name')}
                      </Th>
                      <Th 
                        cursor="pointer" 
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        onClick={() => handleColumnSort('type')}
                      >
                        Tipo {getSortIcon('type')}
                      </Th>
                      <Th 
                        isNumeric 
                        cursor="pointer" 
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        onClick={() => handleColumnSort('revenue')}
                      >
                        Fatturato {getSortIcon('revenue')}
                      </Th>
                      <Th 
                        isNumeric 
                        cursor="pointer" 
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        onClick={() => handleColumnSort('creditScore')}
                      >
                        Credit Score {getSortIcon('creditScore')}
                      </Th>
                      <Th 
                        cursor="pointer" 
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        onClick={() => handleColumnSort('status')}
                      >
                        Status {getSortIcon('status')}
                      </Th>
                      <Th>Azioni</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredCustomers.map(customer => (
                      <Tr key={customer.code}>
                        <Td>
                          <HStack>
                            <Avatar name={customer.name} size="sm" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{customer.name}</Text>
                              <Text fontSize="sm" color={textColor}>{customer.code}</Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack>
                            <Text>{getCustomerTypeIcon(customer.type)}</Text>
                            <Text>{customer.type}</Text>
                          </HStack>
                        </Td>
                        <Td isNumeric fontWeight="bold" color={accentColor}>
                          {formatCurrency(customer.totalRevenue)}
                        </Td>
                        <Td isNumeric fontWeight="bold" color={customer.creditScore > 80 ? successColor : customer.creditScore > 60 ? warningColor : errorColor}>
                          {customer.creditScore}/100
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack>
                            <Button 
                              size="sm" 
                              leftIcon={<FiEye />} 
                              variant="ghost"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                onOpen();
                              }}
                            >
                              Dettagli
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}

        {/* Customer Modal */}
        {selectedCustomer && (
          <CustomerModal 
            customer={selectedCustomer} 
            isOpen={isOpen} 
            onClose={onClose} 
          />
        )}
      </VStack>
    </Box>
  );
};

export default CustomersManagement;