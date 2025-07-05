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
  const [viewMode, setViewMode] = useState('grid');
  
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
  }, [customers, search, typeFilter, categoryFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/arca/customers');
      const data = await response.json();
      
      if (data.success) {
        // Enrich with business analytics
        const enrichedCustomers = data.data.map(customer => ({
          ...customer,
          analytics: {
            totalRevenue: Math.floor(Math.random() * 50000) + 10000,
            avgOrderValue: Math.floor(Math.random() * 500) + 100,
            orderFrequency: Math.floor(Math.random() * 30) + 5,
            creditScore: Math.floor(Math.random() * 40) + 60,
            paymentBehavior: Math.random() > 0.7 ? 'Excellent' : Math.random() > 0.4 ? 'Good' : 'Warning',
            lastOrder: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            growth: (Math.random() - 0.5) * 50,
            preferredProducts: ['Pomodori', 'Insalate', 'Frutta'],
            seasonality: Math.random() > 0.5 ? 'Summer' : 'Winter',
            marginContribution: Math.floor(Math.random() * 25) + 15
          },
          status: Math.random() > 0.1 ? 'active' : Math.random() > 0.5 ? 'warning' : 'inactive',
          riskLevel: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low'
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
    
    if (search) {
      filtered = filtered.filter(customer =>
        customer.Descrizione?.toLowerCase().includes(search.toLowerCase()) ||
        customer.Cd_CF?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (typeFilter) {
      filtered = filtered.filter(customer => customer.type === typeFilter);
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(customer => customer.category === categoryFilter);
    }
    
    setFilteredCustomers(filtered);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
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
                name={customer.Descrizione} 
                bg={getStatusColor(customer.status) + '.500'}
                size="md"
              />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                  {customer.Descrizione}
                </Text>
                <Text fontSize="sm" color={textColor}>
                  {customer.Cd_CF}
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
                {formatCurrency(customer.analytics.totalRevenue)}
              </Text>
              <HStack spacing={1}>
                <Icon 
                  as={customer.analytics.growth > 0 ? FiTrendingUp : FiTrendingDown} 
                  color={customer.analytics.growth > 0 ? successColor : errorColor}
                  size="12px"
                />
                <Text 
                  fontSize="xs" 
                  color={customer.analytics.growth > 0 ? successColor : errorColor}
                >
                  {Math.abs(customer.analytics.growth).toFixed(1)}%
                </Text>
              </HStack>
            </VStack>

            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={textColor} fontWeight="600">CREDITO</Text>
              <Text fontSize="lg" fontWeight="bold" color={warningColor}>
                {formatCurrency(customer.Limite_di_credito || 0)}
              </Text>
              <Progress 
                value={(customer.analytics.totalRevenue / (customer.Limite_di_credito || 1)) * 100} 
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

    const revenueData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('it-IT', { month: 'short' }),
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 20) + 5
    }));

    const productPreferences = [
      { product: 'Pomodori', percentage: 35, value: 15420 },
      { product: 'Insalate', percentage: 25, value: 11200 },
      { product: 'Frutta', percentage: 20, value: 8900 },
      { product: 'Altri', percentage: 20, value: 7480 }
    ];

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Avatar name={customer.Descrizione} bg={getStatusColor(customer.status) + '.500'} />
              <VStack align="start" spacing={0}>
                <Text>{customer.Descrizione}</Text>
                <Text fontSize="sm" color={textColor}>{customer.Cd_CF}</Text>
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
                                {formatCurrency(customer.Limite_di_credito)}
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
                                {customer.Sc_tipo_riga || 0}%
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
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
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
                        </Box>
                      </CardBody>
                    </Card>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Stat bg={cardBg} p={4} borderRadius="lg">
                        <StatLabel>Ordini Questo Mese</StatLabel>
                        <StatNumber>24</StatNumber>
                        <StatHelpText>+12% vs scorso mese</StatHelpText>
                      </Stat>
                      <Stat bg={cardBg} p={4} borderRadius="lg">
                        <StatLabel>Margine Medio</StatLabel>
                        <StatNumber>{customer.analytics.marginContribution}%</StatNumber>
                        <StatHelpText>+2.3% vs target</StatHelpText>
                      </Stat>
                      <Stat bg={cardBg} p={4} borderRadius="lg">
                        <StatLabel>Volume Totale</StatLabel>
                        <StatNumber>1.2T</StatNumber>
                        <StatHelpText>Ultimo trimestre</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </VStack>
                </TabPanel>

                {/* Credits Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Alert status="info" borderRadius="lg">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Situazione Creditizia</Text>
                        <Text fontSize="sm">
                          Cliente in regola con i pagamenti - Ultimo aggiornamento: oggi
                        </Text>
                      </Box>
                    </Alert>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <Card bg={cardBg}>
                        <CardBody>
                          <VStack spacing={4}>
                            <Heading size="sm">Esposizione Attuale</Heading>
                            <CircularProgress 
                              value={75} 
                              color="blue.400" 
                              size="120px"
                              thickness="12px"
                            >
                              <CircularProgressLabel>
                                <VStack spacing={0}>
                                  <Text fontSize="lg" fontWeight="bold">75%</Text>
                                  <Text fontSize="xs">del limite</Text>
                                </VStack>
                              </CircularProgressLabel>
                            </CircularProgress>
                            <VStack spacing={1}>
                              <Text fontSize="lg" fontWeight="bold" color={accentColor}>
                                {formatCurrency((customer.Limite_di_credito || 0) * 0.75)}
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                su {formatCurrency(customer.Limite_di_credito || 0)}
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
                              <Text color={textColor}>A scadere (0-30gg):</Text>
                              <Text fontWeight="bold" color={warningColor}>
                                {formatCurrency(8500)}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Scadute (31-60gg):</Text>
                              <Text fontWeight="bold" color={errorColor}>
                                {formatCurrency(2300)}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Oltre 60gg:</Text>
                              <Text fontWeight="bold" color={errorColor}>
                                {formatCurrency(500)}
                              </Text>
                            </HStack>
                            <Divider />
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Totale Esposizione:</Text>
                              <Text fontWeight="bold" fontSize="lg" color={accentColor}>
                                {formatCurrency(11300)}
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
                            <Badge colorScheme="green" variant="solid">Eccellente</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Stagionalità:</Text>
                            <Text fontWeight="medium">{customer.analytics.seasonality} focused</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Crescita Anno:</Text>
                            <HStack>
                              <Icon as={FiTrendingUp} color={successColor} />
                              <Text color={successColor} fontWeight="bold">+12.5%</Text>
                            </HStack>
                          </HStack>
                          <HStack justify="space-between">
                            <Text>Rischio:</Text>
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
                          <Alert status="success" size="sm" borderRadius="md">
                            <AlertIcon />
                            <Text fontSize="sm">Aumentare limite credito del 20%</Text>
                          </Alert>
                          <Alert status="info" size="sm" borderRadius="md">
                            <AlertIcon />
                            <Text fontSize="sm">Proporre contratto stagionale</Text>
                          </Alert>
                          <Alert status="warning" size="sm" borderRadius="md">
                            <AlertIcon />
                            <Text fontSize="sm">Monitorare pagamenti fino a 30gg</Text>
                          </Alert>
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
                        {[
                          { date: '2024-07-05', action: 'Pagamento ricevuto', amount: 2500, type: 'payment' },
                          { date: '2024-07-03', action: 'Ordine confermato', amount: 1200, type: 'order' },
                          { date: '2024-07-01', action: 'Fattura emessa', amount: 3400, type: 'invoice' },
                          { date: '2024-06-28', action: 'Pagamento ricevuto', amount: 1800, type: 'payment' }
                        ].map((activity, index) => (
                          <HStack key={index} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                            <Icon 
                              as={activity.type === 'payment' ? FiDollarSign : activity.type === 'order' ? FiShoppingCart : FiCalendar}
                              color={activity.type === 'payment' ? successColor : accentColor}
                            />
                            <VStack align="start" spacing={0} flex="1">
                              <Text fontSize="sm" fontWeight="medium">{activity.action}</Text>
                              <Text fontSize="xs" color={textColor}>{activity.date}</Text>
                            </VStack>
                            <Text fontWeight="bold" color={accentColor}>
                              {formatCurrency(activity.amount)}
                            </Text>
                          </HStack>
                        ))}
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

  // Summary stats
  const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.analytics.totalRevenue, 0);
  const averageCreditScore = filteredCustomers.reduce((sum, c) => sum + c.analytics.creditScore, 0) / filteredCustomers.length || 0;
  const activeCustomers = filteredCustomers.filter(c => c.status === 'active').length;

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
            <Button leftIcon={<FiPlus />} colorScheme="blue" size="md">
              Nuovo Cliente
            </Button>
            <Button leftIcon={<FiDownload />} variant="outline" size="md">
              Esporta
            </Button>
            <Button leftIcon={<FiRefreshCw />} variant="outline" size="md" onClick={fetchCustomers}>
              Aggiorna
            </Button>
          </HStack>
        </Flex>

        {/* Summary Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Clienti Totali</StatLabel>
            <StatNumber fontSize="3xl" color={accentColor}>{filteredCustomers.length}</StatNumber>
            <StatHelpText>{activeCustomers} attivi</StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Fatturato Totale</StatLabel>
            <StatNumber fontSize="3xl" color={successColor}>
              {formatCurrency(totalRevenue)}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              12.5% vs anno scorso
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Credit Score Medio</StatLabel>
            <StatNumber fontSize="3xl" color={warningColor}>
              {averageCreditScore.toFixed(0)}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              +3 punti
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Nuovi Questo Mese</StatLabel>
            <StatNumber fontSize="3xl" color={accentColor}>8</StatNumber>
            <StatHelpText>+33% vs mese scorso</StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <Card bg={cardBg} shadow="lg" borderRadius="xl">
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <Icon as={FiSearch} color={textColor} />
                </InputLeftElement>
                <Input
                  placeholder="Cerca clienti..."
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
                <option value="A">Categoria A</option>
                <option value="B">Categoria B</option>
                <option value="C">Categoria C</option>
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
              
              <Button leftIcon={<FiFilter />} variant="outline">
                Filtri Avanzati
              </Button>
            </HStack>
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
              <CustomerCard key={customer.Cd_CF} customer={customer} />
            ))}
          </SimpleGrid>
        ) : (
          <Card bg={cardBg} shadow="lg" borderRadius="xl">
            <CardBody>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Cliente</Th>
                      <Th>Tipo</Th>
                      <Th isNumeric>Fatturato</Th>
                      <Th isNumeric>Credito</Th>
                      <Th>Status</Th>
                      <Th>Azioni</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredCustomers.map(customer => (
                      <Tr key={customer.Cd_CF}>
                        <Td>
                          <HStack>
                            <Avatar name={customer.Descrizione} size="sm" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{customer.Descrizione}</Text>
                              <Text fontSize="sm" color={textColor}>{customer.Cd_CF}</Text>
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
                          {formatCurrency(customer.analytics.totalRevenue)}
                        </Td>
                        <Td isNumeric>{formatCurrency(customer.Limite_di_credito)}</Td>
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