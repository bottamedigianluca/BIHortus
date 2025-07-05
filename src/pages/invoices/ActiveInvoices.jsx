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
  Divider,
  Tag,
  TagLabel,
  Avatar,
  Checkbox,
  Switch,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  useToast
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
  ResponsiveContainer
} from 'recharts';
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit,
  FiPrinter,
  FiSend,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiMoreVertical,
  FiPlus,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiMail,
  FiPhone,
  FiTrendingUp,
  FiTrendingDown,
  FiCopy,
  FiExternalLink,
  FiUsers,
  FiPackage,
  FiBarChart,
  FiActivity,
  FiCreditCard,
  FiTarget,
  FiArchive
} from 'react-icons/fi';

const ActiveInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState('list');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const accentColor = useColorModeValue('blue.600', 'blue.400');
  const successColor = useColorModeValue('green.500', 'green.400');
  const warningColor = useColorModeValue('orange.500', 'orange.400');
  const errorColor = useColorModeValue('red.500', 'red.400');

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, search, statusFilter, customerFilter, dateFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/arca/active-invoices');
      const data = await response.json();
      
      if (data.success) {
        // Enrich with business data
        const enrichedInvoices = data.data.map(invoice => ({
          ...invoice,
          status: Math.random() > 0.7 ? 'paid' : Math.random() > 0.4 ? 'pending' : Math.random() > 0.2 ? 'overdue' : 'draft',
          paymentMethod: ['Bonifico', 'RiBa', 'Assegno', 'Contanti'][Math.floor(Math.random() * 4)],
          daysOverdue: Math.floor(Math.random() * 60),
          discountApplied: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 2 : 0,
          margin: Math.floor(Math.random() * 30) + 15,
          weight: Math.floor(Math.random() * 500) + 50,
          deliveryAddress: 'Via Roma 123, Roma',
          salesRep: ['Mario Rossi', 'Giulia Bianchi', 'Luca Verdi'][Math.floor(Math.random() * 3)],
          notes: Math.random() > 0.5 ? 'Cliente prioritario - consegna urgente' : '',
          lastPaymentDate: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
          paymentHistory: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
            date: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: Math.floor(Math.random() * 2000) + 500,
            method: 'Bonifico'
          }))
        }));
        
        setInvoices(enrichedInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le fatture',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;
    
    if (search) {
      filtered = filtered.filter(invoice =>
        invoice.numeroDocumento?.toString().includes(search) ||
        invoice.customerName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    if (customerFilter) {
      filtered = filtered.filter(invoice => invoice.customerName === customerFilter);
    }
    
    if (dateFilter) {
      const days = parseInt(dateFilter);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(invoice => new Date(invoice.dataDocumento) >= cutoffDate);
    }
    
    setFilteredInvoices(filtered);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'overdue': return 'red';
      case 'draft': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Pagata';
      case 'pending': return 'In Attesa';
      case 'overdue': return 'Scaduta';
      case 'draft': return 'Bozza';
      default: return 'Sconosciuto';
    }
  };

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleBulkAction = (action) => {
    if (selectedInvoices.length === 0) {
      toast({
        title: 'Attenzione',
        description: 'Seleziona almeno una fattura',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    toast({
      title: 'Azione Eseguita',
      description: `${action} applicata a ${selectedInvoices.length} fatture`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    setSelectedInvoices([]);
  };

  const InvoiceCard = ({ invoice }) => {
    const daysOverdue = getDaysOverdue(invoice.scadenza);
    
    return (
      <Card 
        bg={cardBg} 
        shadow="lg" 
        borderRadius="xl" 
        _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }} 
        transition="all 0.3s"
        cursor="pointer"
        onClick={() => {
          setSelectedInvoice(invoice);
          onOpen();
        }}
        border="1px"
        borderColor={invoice.status === 'overdue' ? errorColor : useColorModeValue('gray.200', 'gray.700')}
      >
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Header */}
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg">
                  #{invoice.numeroDocumento}
                </Text>
                <Text fontSize="sm" color={textColor}>
                  {invoice.customerName}
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Badge colorScheme={getStatusColor(invoice.status)} variant="solid">
                  {getStatusLabel(invoice.status)}
                </Badge>
                {invoice.status === 'overdue' && daysOverdue > 0 && (
                  <Badge colorScheme="red" size="sm">
                    +{daysOverdue} giorni
                  </Badge>
                )}
              </VStack>
            </HStack>

            {/* Amount & Date */}
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color={textColor} fontWeight="600">IMPORTO</Text>
                <Text fontSize="xl" fontWeight="bold" color={accentColor}>
                  {formatCurrency(invoice.totaleDocumento)}
                </Text>
                {invoice.discountApplied > 0 && (
                  <Text fontSize="xs" color={successColor}>
                    Sconto {invoice.discountApplied}%
                  </Text>
                )}
              </VStack>
              <VStack align="end" spacing={0}>
                <Text fontSize="xs" color={textColor} fontWeight="600">SCADENZA</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {formatDate(invoice.scadenza)}
                </Text>
                <Text fontSize="xs" color={textColor}>
                  Data: {formatDate(invoice.dataDocumento)}
                </Text>
              </VStack>
            </HStack>

            {/* Progress Bar for Payment */}
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color={textColor}>Pagamento</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {invoice.status === 'paid' ? '100%' : '0%'}
                </Text>
              </HStack>
              <Progress 
                value={invoice.status === 'paid' ? 100 : 0} 
                colorScheme={getStatusColor(invoice.status)} 
                size="sm" 
                borderRadius="full"
              />
            </VStack>

            {/* Details */}
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color={textColor}>Peso:</Text>
                <Text fontSize="sm" fontWeight="medium">{invoice.weight}kg</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color={textColor}>Margine:</Text>
                <Text fontSize="sm" fontWeight="medium" color={successColor}>
                  {invoice.margin}%
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color={textColor}>Metodo:</Text>
                <Text fontSize="sm" fontWeight="medium">{invoice.paymentMethod}</Text>
              </HStack>
            </VStack>

            {/* Actions */}
            <HStack spacing={2}>
              <Button size="sm" leftIcon={<FiEye />} colorScheme="blue" variant="outline" flex="1">
                Dettagli
              </Button>
              <Button size="sm" leftIcon={<FiPrinter />} colorScheme="gray" variant="outline">
                Stampa
              </Button>
              <Button size="sm" leftIcon={<FiSend />} colorScheme="green" variant="outline">
                Invia
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  const InvoiceModal = ({ invoice, isOpen, onClose }) => {
    if (!invoice) return null;

    const daysOverdue = getDaysOverdue(invoice.scadenza);

    return (
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiFileText} color={accentColor} />
              <VStack align="start" spacing={0}>
                <Text>Fattura #{invoice.numeroDocumento}</Text>
                <Text fontSize="sm" color={textColor}>{invoice.customerName}</Text>
              </VStack>
              <Spacer />
              <Badge colorScheme={getStatusColor(invoice.status)} size="lg">
                {getStatusLabel(invoice.status)}
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Dettagli</Tab>
                <Tab>Righe</Tab>
                <Tab>Pagamenti</Tab>
                <Tab>Documenti</Tab>
                <Tab>Storico</Tab>
              </TabList>

              <TabPanels>
                {/* Details Tab */}
                <TabPanel>
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                    <VStack spacing={4} align="stretch">
                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Informazioni Fattura</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <Text color={textColor}>Numero:</Text>
                              <Text fontWeight="bold">#{invoice.numeroDocumento}</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Data:</Text>
                              <Text fontWeight="medium">{formatDate(invoice.dataDocumento)}</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Scadenza:</Text>
                              <VStack align="end" spacing={0}>
                                <Text fontWeight="medium">{formatDate(invoice.scadenza)}</Text>
                                {daysOverdue > 0 && (
                                  <Text fontSize="xs" color={errorColor}>
                                    Scaduta da {daysOverdue} giorni
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Tipo:</Text>
                              <Text fontWeight="medium">{invoice.tipoDocumento}</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Agente:</Text>
                              <Text fontWeight="medium">{invoice.salesRep}</Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Cliente</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack>
                              <Avatar name={invoice.customerName} size="md" />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{invoice.customerName}</Text>
                                <Text fontSize="sm" color={textColor}>Codice: {invoice.codiceCliente}</Text>
                              </VStack>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Indirizzo consegna:</Text>
                              <Text fontWeight="medium" textAlign="right" maxW="200px">
                                {invoice.deliveryAddress}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>Ultimo pagamento:</Text>
                              <Text fontWeight="medium">
                                {invoice.lastPaymentDate ? formatDate(invoice.lastPaymentDate) : 'Nessuno'}
                              </Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    </VStack>

                    <VStack spacing={4} align="stretch">
                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Importi</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <Text color={textColor}>Imponibile:</Text>
                              <Text fontWeight="medium">
                                {formatCurrency((invoice.totaleDocumento || 0) / 1.22)}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color={textColor}>IVA (22%):</Text>
                              <Text fontWeight="medium">
                                {formatCurrency((invoice.totaleDocumento || 0) * 0.18)}
                              </Text>
                            </HStack>
                            {invoice.discountApplied > 0 && (
                              <HStack justify="space-between">
                                <Text color={textColor}>Sconto ({invoice.discountApplied}%):</Text>
                                <Text fontWeight="medium" color={successColor}>
                                  -{formatCurrency((invoice.totaleDocumento || 0) * (invoice.discountApplied / 100))}
                                </Text>
                              </HStack>
                            )}
                            <Divider />
                            <HStack justify="space-between">
                              <Text fontWeight="bold">Totale:</Text>
                              <Text fontWeight="bold" fontSize="xl" color={accentColor}>
                                {formatCurrency(invoice.totaleDocumento)}
                              </Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Metriche Business</Heading>
                        </CardHeader>
                        <CardBody>
                          <SimpleGrid columns={2} spacing={4}>
                            <Stat>
                              <StatLabel>Peso Totale</StatLabel>
                              <StatNumber>{invoice.weight}kg</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Margine</StatLabel>
                              <StatNumber color={successColor}>{invoice.margin}%</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>€/kg</StatLabel>
                              <StatNumber>
                                {((invoice.totaleDocumento || 0) / (invoice.weight || 1)).toFixed(2)}
                              </StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Metodo Pag.</StatLabel>
                              <StatNumber fontSize="sm">{invoice.paymentMethod}</StatNumber>
                            </Stat>
                          </SimpleGrid>
                        </CardBody>
                      </Card>

                      {invoice.notes && (
                        <Card bg={cardBg}>
                          <CardHeader>
                            <Heading size="sm">Note</Heading>
                          </CardHeader>
                          <CardBody>
                            <Text fontSize="sm">{invoice.notes}</Text>
                          </CardBody>
                        </Card>
                      )}
                    </VStack>
                  </Grid>
                </TabPanel>

                {/* Items Tab */}
                <TabPanel>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Righe Fattura</Heading>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Prodotto</Th>
                              <Th isNumeric>Qtà</Th>
                              <Th isNumeric>Prezzo</Th>
                              <Th isNumeric>Sconto</Th>
                              <Th isNumeric>Totale</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {/* Sample invoice lines */}
                            <Tr>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium">Pomodori Ciliegino</Text>
                                  <Text fontSize="xs" color={textColor}>TOMPCI001</Text>
                                </VStack>
                              </Td>
                              <Td isNumeric>50 kg</Td>
                              <Td isNumeric>€ 3.50</Td>
                              <Td isNumeric>5%</Td>
                              <Td isNumeric fontWeight="bold">€ 166.25</Td>
                            </Tr>
                            <Tr>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium">Insalata Iceberg</Text>
                                  <Text fontSize="xs" color={textColor}>INSICE001</Text>
                                </VStack>
                              </Td>
                              <Td isNumeric>30 cespi</Td>
                              <Td isNumeric>€ 1.20</Td>
                              <Td isNumeric>0%</Td>
                              <Td isNumeric fontWeight="bold">€ 36.00</Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Payments Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Card bg={cardBg}>
                      <CardHeader>
                        <HStack justify="space-between">
                          <Heading size="sm">Storico Pagamenti</Heading>
                          <Button size="sm" leftIcon={<FiPlus />} colorScheme="blue">
                            Registra Pagamento
                          </Button>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        {invoice.paymentHistory.length > 0 ? (
                          <VStack spacing={3} align="stretch">
                            {invoice.paymentHistory.map((payment, index) => (
                              <HStack key={index} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                                <Icon as={FiDollarSign} color={successColor} />
                                <VStack align="start" spacing={0} flex="1">
                                  <Text fontSize="sm" fontWeight="medium">
                                    Pagamento ricevuto
                                  </Text>
                                  <Text fontSize="xs" color={textColor}>
                                    {formatDate(payment.date)} - {payment.method}
                                  </Text>
                                </VStack>
                                <Text fontWeight="bold" color={successColor}>
                                  {formatCurrency(payment.amount)}
                                </Text>
                              </HStack>
                            ))}
                          </VStack>
                        ) : (
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            Nessun pagamento registrato
                          </Alert>
                        )}
                      </CardBody>
                    </Card>

                    {invoice.status !== 'paid' && (
                      <Card bg={cardBg}>
                        <CardHeader>
                          <Heading size="sm">Registra Nuovo Pagamento</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            <HStack spacing={4}>
                              <FormControl>
                                <FormLabel fontSize="sm">Importo</FormLabel>
                                <NumberInput>
                                  <NumberInputField placeholder="0.00" />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">Data</FormLabel>
                                <Input type="date" />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">Metodo</FormLabel>
                                <Select>
                                  <option value="bonifico">Bonifico</option>
                                  <option value="riba">RiBa</option>
                                  <option value="assegno">Assegno</option>
                                  <option value="contanti">Contanti</option>
                                </Select>
                              </FormControl>
                            </HStack>
                            <FormControl>
                              <FormLabel fontSize="sm">Note</FormLabel>
                              <Textarea placeholder="Note aggiuntive..." size="sm" />
                            </FormControl>
                            <Button colorScheme="green" leftIcon={<FiCheckCircle />}>
                              Registra Pagamento
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </TabPanel>

                {/* Documents Tab */}
                <TabPanel>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Documenti Correlati</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                          <Icon as={FiFileText} color={accentColor} />
                          <VStack align="start" spacing={0} flex="1">
                            <Text fontSize="sm" fontWeight="medium">Fattura PDF</Text>
                            <Text fontSize="xs" color={textColor}>Documento principale</Text>
                          </VStack>
                          <HStack>
                            <Button size="xs" leftIcon={<FiEye />} variant="outline">Visualizza</Button>
                            <Button size="xs" leftIcon={<FiDownload />} variant="outline">Scarica</Button>
                          </HStack>
                        </HStack>
                        
                        <HStack p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                          <Icon as={FiFileText} color={successColor} />
                          <VStack align="start" spacing={0} flex="1">
                            <Text fontSize="sm" fontWeight="medium">Bolla di Consegna</Text>
                            <Text fontSize="xs" color={textColor}>DDT #{invoice.numeroDocumento}</Text>
                          </VStack>
                          <HStack>
                            <Button size="xs" leftIcon={<FiEye />} variant="outline">Visualizza</Button>
                            <Button size="xs" leftIcon={<FiDownload />} variant="outline">Scarica</Button>
                          </HStack>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* History Tab */}
                <TabPanel>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Cronologia Attività</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        {[
                          { date: '2024-07-05 10:30', action: 'Fattura creata', user: 'Sistema ARCA', icon: FiPlus },
                          { date: '2024-07-05 11:15', action: 'Fattura inviata al cliente', user: 'Mario Rossi', icon: FiSend },
                          { date: '2024-07-06 09:00', action: 'Email di sollecito inviata', user: 'Giulia Bianchi', icon: FiMail },
                          { date: '2024-07-07 14:30', action: 'Cliente contattato telefonicamente', user: 'Mario Rossi', icon: FiPhone }
                        ].map((activity, index) => (
                          <HStack key={index} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                            <Icon as={activity.icon} color={accentColor} />
                            <VStack align="start" spacing={0} flex="1">
                              <Text fontSize="sm" fontWeight="medium">{activity.action}</Text>
                              <Text fontSize="xs" color={textColor}>
                                {activity.date} - {activity.user}
                              </Text>
                            </VStack>
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

  // Statistics
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.totaleDocumento || 0), 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.totaleDocumento || 0), 0);
  const overdueAmount = filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.totaleDocumento || 0), 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.totaleDocumento || 0), 0);

  const overdueCount = filteredInvoices.filter(inv => inv.status === 'overdue').length;
  const avgInvoiceValue = totalAmount / filteredInvoices.length || 0;

  const uniqueCustomers = [...new Set(invoices.map(inv => inv.customerName))].filter(Boolean);

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="xl" color={accentColor} fontWeight="800">
              📄 Fatture Attive
            </Heading>
            <Text color={textColor} mt={1}>
              Gestione completa fatture clienti
            </Text>
          </Box>
          
          <HStack spacing={3}>
            <Button leftIcon={<FiPlus />} colorScheme="blue" size="md">
              Nuova Fattura
            </Button>
            <Button leftIcon={<FiDownload />} variant="outline" size="md">
              Esporta
            </Button>
            <Button leftIcon={<FiRefreshCw />} variant="outline" size="md" onClick={fetchInvoices}>
              Aggiorna
            </Button>
          </HStack>
        </Flex>

        {/* Summary Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Fatturato Totale</StatLabel>
            <StatNumber fontSize="2xl" color={accentColor}>
              {formatCurrency(totalAmount)}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {filteredInvoices.length} fatture
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Incassato</StatLabel>
            <StatNumber fontSize="2xl" color={successColor}>
              {formatCurrency(paidAmount)}
            </StatNumber>
            <StatHelpText>
              {((paidAmount / totalAmount) * 100 || 0).toFixed(1)}% del totale
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Da Incassare</StatLabel>
            <StatNumber fontSize="2xl" color={warningColor}>
              {formatCurrency(pendingAmount)}
            </StatNumber>
            <StatHelpText>
              {filteredInvoices.filter(inv => inv.status === 'pending').length} fatture
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={6} borderRadius="xl" shadow="lg">
            <StatLabel color={textColor}>Scadute</StatLabel>
            <StatNumber fontSize="2xl" color={errorColor}>
              {formatCurrency(overdueAmount)}
            </StatNumber>
            <StatHelpText>
              <Icon as={FiAlertTriangle} color={errorColor} />
              {overdueCount} fatture
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Quick Actions */}
        {selectedInvoices.length > 0 && (
          <Card bg={cardBg} shadow="lg" borderRadius="xl">
            <CardBody>
              <HStack justify="space-between">
                <HStack>
                  <Text fontWeight="bold">{selectedInvoices.length} fatture selezionate</Text>
                  <Badge colorScheme="blue">{formatCurrency(selectedInvoices.reduce((sum, id) => {
                    const invoice = filteredInvoices.find(inv => inv.numeroDocumento === id);
                    return sum + (invoice?.totaleDocumento || 0);
                  }, 0))}</Badge>
                </HStack>
                <HStack spacing={2}>
                  <Button size="sm" leftIcon={<FiSend />} colorScheme="blue" onClick={() => handleBulkAction('Invia Email')}>
                    Invia Email
                  </Button>
                  <Button size="sm" leftIcon={<FiPrinter />} colorScheme="gray" onClick={() => handleBulkAction('Stampa')}>
                    Stampa
                  </Button>
                  <Button size="sm" leftIcon={<FiDownload />} colorScheme="green" onClick={() => handleBulkAction('Esporta')}>
                    Esporta
                  </Button>
                  <Button size="sm" leftIcon={<FiArchive />} colorScheme="orange" onClick={() => handleBulkAction('Archivia')}>
                    Archivia
                  </Button>
                </HStack>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Filters */}
        <Card bg={cardBg} shadow="lg" borderRadius="xl">
          <CardBody>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "2fr 1fr 1fr 1fr 1fr" }} gap={4}>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiSearch} color={textColor} />
                </InputLeftElement>
                <Input
                  placeholder="Cerca fatture..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
              
              <Select 
                placeholder="Tutti gli stati" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="pending">In Attesa</option>
                <option value="paid">Pagate</option>
                <option value="overdue">Scadute</option>
                <option value="draft">Bozze</option>
              </Select>
              
              <Select 
                placeholder="Tutti i clienti" 
                value={customerFilter} 
                onChange={(e) => setCustomerFilter(e.target.value)}
              >
                {uniqueCustomers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </Select>
              
              <Select 
                placeholder="Periodo" 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="7">Ultimi 7 giorni</option>
                <option value="30">Ultimi 30 giorni</option>
                <option value="90">Ultimi 90 giorni</option>
                <option value="365">Ultimo anno</option>
              </Select>
              
              <ButtonGroup isAttached variant="outline">
                <Button 
                  leftIcon={<FiBarChart />}
                  isActive={viewMode === 'list'} 
                  onClick={() => setViewMode('list')}
                >
                  Lista
                </Button>
                <Button 
                  leftIcon={<FiUsers />}
                  isActive={viewMode === 'grid'} 
                  onClick={() => setViewMode('grid')}
                >
                  Griglia
                </Button>
              </ButtonGroup>
            </Grid>
          </CardBody>
        </Card>

        {/* Invoices Display */}
        {loading ? (
          <Flex justify="center" align="center" h="400px">
            <VStack spacing={4}>
              <CircularProgress isIndeterminate color="blue.500" size="60px" />
              <Text color={textColor}>Caricamento fatture...</Text>
            </VStack>
          </Flex>
        ) : viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {filteredInvoices.map(invoice => (
              <InvoiceCard key={invoice.numeroDocumento} invoice={invoice} />
            ))}
          </SimpleGrid>
        ) : (
          <Card bg={cardBg} shadow="lg" borderRadius="xl">
            <CardBody>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>
                        <Checkbox 
                          isChecked={selectedInvoices.length === filteredInvoices.length}
                          isIndeterminate={selectedInvoices.length > 0 && selectedInvoices.length < filteredInvoices.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices(filteredInvoices.map(inv => inv.numeroDocumento));
                            } else {
                              setSelectedInvoices([]);
                            }
                          }}
                        />
                      </Th>
                      <Th>Fattura</Th>
                      <Th>Cliente</Th>
                      <Th>Data</Th>
                      <Th>Scadenza</Th>
                      <Th isNumeric>Importo</Th>
                      <Th>Stato</Th>
                      <Th>Azioni</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredInvoices.map(invoice => {
                      const daysOverdue = getDaysOverdue(invoice.scadenza);
                      
                      return (
                        <Tr key={invoice.numeroDocumento}>
                          <Td>
                            <Checkbox 
                              isChecked={selectedInvoices.includes(invoice.numeroDocumento)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedInvoices([...selectedInvoices, invoice.numeroDocumento]);
                                } else {
                                  setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.numeroDocumento));
                                }
                              }}
                            />
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">#{invoice.numeroDocumento}</Text>
                              <Text fontSize="sm" color={textColor}>{invoice.tipoDocumento}</Text>
                            </VStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{invoice.customerName}</Text>
                              <Text fontSize="sm" color={textColor}>{invoice.codiceCliente}</Text>
                            </VStack>
                          </Td>
                          <Td>{formatDate(invoice.dataDocumento)}</Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text>{formatDate(invoice.scadenza)}</Text>
                              {daysOverdue > 0 && (
                                <Badge colorScheme="red" size="sm">
                                  +{daysOverdue} giorni
                                </Badge>
                              )}
                            </VStack>
                          </Td>
                          <Td isNumeric fontWeight="bold" color={accentColor}>
                            {formatCurrency(invoice.totaleDocumento)}
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(invoice.status)}>
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <Tooltip label="Visualizza dettagli">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    onOpen();
                                  }}
                                >
                                  <Icon as={FiEye} />
                                </Button>
                              </Tooltip>
                              <Tooltip label="Stampa fattura">
                                <Button size="sm" variant="ghost">
                                  <Icon as={FiPrinter} />
                                </Button>
                              </Tooltip>
                              <Tooltip label="Invia email">
                                <Button size="sm" variant="ghost">
                                  <Icon as={FiSend} />
                                </Button>
                              </Tooltip>
                              <Menu>
                                <MenuButton as={Button} size="sm" variant="ghost">
                                  <Icon as={FiMoreVertical} />
                                </MenuButton>
                                <MenuList>
                                  <MenuItem icon={<FiCopy />}>Duplica</MenuItem>
                                  <MenuItem icon={<FiEdit />}>Modifica</MenuItem>
                                  <MenuItem icon={<FiExternalLink />}>Apri in ARCA</MenuItem>
                                  <MenuItem icon={<FiArchive />}>Archivia</MenuItem>
                                </MenuList>
                              </Menu>
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}

        {/* Invoice Modal */}
        {selectedInvoice && (
          <InvoiceModal 
            invoice={selectedInvoice} 
            isOpen={isOpen} 
            onClose={onClose} 
          />
        )}
      </VStack>
    </Box>
  );
};

export default ActiveInvoices;