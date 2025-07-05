import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardBody,
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
  Image,
  Stack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Tooltip,
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
  Td
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiEye,
  FiEdit,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiStar,
  FiCalendar,
  FiMapPin,
  FiHeart,
  FiAward,
  FiBarChart,
  FiDollarSign,
  FiAlertCircle
} from 'react-icons/fi';

const ModernProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  const productEmojis = {
    'Mele': '🍎',
    'Arance': '🍊', 
    'Banane': '🍌',
    'Fichi': '🫐',
    'Uva': '🍇',
    'Pesche': '🍑',
    'Kiwi': '🥝',
    'Pomodori': '🍅',
    'Carote': '🥕',
    'Zucchine': '🥒',
    'Insalata': '🥬',
    'Rucola': '🌿',
    'Melanzane': '🍆',
    'Peperoni': '🌶️',
    'Zucca': '🎃'
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, search, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/arca/products');
      const data = await response.json();
      
      if (data.success) {
        // Add mock performance data
        const enrichedProducts = data.data.map(product => ({
          ...product,
          performance: {
            score: Math.floor(Math.random() * 40) + 60, // 60-100
            trend: Math.random() > 0.5 ? 'up' : 'down',
            sales: Math.floor(Math.random() * 500) + 100,
            revenue: Math.floor(Math.random() * 10000) + 1000,
            margin: Math.floor(Math.random() * 30) + 20,
            velocity: (Math.random() * 10 + 1).toFixed(1)
          },
          quality: {
            freshness: Math.floor(Math.random() * 20) + 80,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1)
          },
          inventory: {
            stock: Math.floor(Math.random() * 200) + 50,
            reserved: Math.floor(Math.random() * 50),
            incoming: Math.floor(Math.random() * 100)
          }
        }));
        
        setProducts(enrichedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    if (search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.code.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    setFilteredProducts(filtered);
  };

  const getProductEmoji = (productName) => {
    const key = Object.keys(productEmojis).find(k => productName.includes(k));
    return key ? productEmojis[key] : '🥬';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const ProductCard = ({ product }) => (
    <Card 
      bg={cardBg} 
      borderColor={borderColor} 
      shadow="md" 
      _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} 
      transition="all 0.3s"
      cursor="pointer"
      onClick={() => {
        setSelectedProduct(product);
        onOpen();
      }}
    >
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <HStack>
              <Text fontSize="2xl">{getProductEmoji(product.name)}</Text>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="md">{product.name}</Text>
                <Text fontSize="sm" color={textColor}>{product.code}</Text>
              </VStack>
            </HStack>
            <Badge colorScheme={getScoreColor(product.performance.score)} variant="solid">
              {product.performance.score}
            </Badge>
          </HStack>

          {/* Price & Category */}
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={accentColor}>
                {formatCurrency(product.price)}
              </Text>
              <Text fontSize="xs" color={textColor}>per {product.unit}</Text>
            </VStack>
            <Badge variant="outline" colorScheme={product.category === 'Frutta' ? 'green' : 'blue'}>
              {product.category}
            </Badge>
          </HStack>

          {/* Performance Indicators */}
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color={textColor}>Performance</Text>
              <HStack>
                <Icon 
                  as={product.performance.trend === 'up' ? FiTrendingUp : FiTrendingDown} 
                  color={product.performance.trend === 'up' ? 'green.500' : 'red.500'} 
                  size="14px" 
                />
                <Text fontSize="sm" color={product.performance.trend === 'up' ? 'green.500' : 'red.500'}>
                  {product.performance.sales} vendite
                </Text>
              </HStack>
            </HStack>
            
            <Progress 
              value={product.performance.score} 
              colorScheme={getScoreColor(product.performance.score)} 
              size="sm" 
              borderRadius="full"
            />
          </VStack>

          {/* Tags */}
          <HStack flexWrap="wrap" spacing={1}>
            {product.organic && (
              <Tag size="sm" colorScheme="green" variant="subtle">
                <TagLeftIcon as={FiHeart} />
                <TagLabel>Bio</TagLabel>
              </Tag>
            )}
            {product.seasonal && (
              <Tag size="sm" colorScheme="orange" variant="subtle">
                <TagLeftIcon as={FiCalendar} />
                <TagLabel>Stagionale</TagLabel>
              </Tag>
            )}
            <Tag size="sm" colorScheme="blue" variant="subtle">
              <TagLeftIcon as={FiMapPin} />
              <TagLabel>{product.origin}</TagLabel>
            </Tag>
          </HStack>

          {/* Stock Status */}
          <HStack justify="space-between">
            <Text fontSize="sm" color={textColor}>Giacenza</Text>
            <Text fontSize="sm" fontWeight="medium">
              {product.inventory.stock} {product.unit}
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  const ProductModal = ({ product, isOpen, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Text fontSize="2xl">{getProductEmoji(product?.name)}</Text>
            <Text>{product?.name}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Panoramica</Tab>
              <Tab>Performance</Tab>
              <Tab>Inventario</Tab>
              <Tab>Fornitori</Tab>
            </TabList>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <VStack align="stretch" spacing={4}>
                    <Card bg={cardBg}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <Heading size="md">Informazioni Prodotto</Heading>
                          <HStack justify="space-between">
                            <Text color={textColor}>Codice:</Text>
                            <Text fontWeight="medium">{product?.code}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color={textColor}>Categoria:</Text>
                            <Badge colorScheme={product?.category === 'Frutta' ? 'green' : 'blue'}>
                              {product?.category}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color={textColor}>Sottocategoria:</Text>
                            <Text fontWeight="medium">{product?.subcategory}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color={textColor}>Unità:</Text>
                            <Text fontWeight="medium">{product?.unit}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color={textColor}>Origine:</Text>
                            <Text fontWeight="medium">{product?.origin}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color={textColor}>Durata:</Text>
                            <Text fontWeight="medium">{product?.shelfLife} giorni</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>

                  <VStack align="stretch" spacing={4}>
                    <Card bg={cardBg}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <Heading size="md">Prezzi e Margini</Heading>
                          <HStack justify="space-between">
                            <Text color={textColor}>Prezzo Vendita:</Text>
                            <Text fontWeight="bold" color={accentColor} fontSize="lg">
                              {formatCurrency(product?.price)}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color={textColor}>Costo:</Text>
                            <Text fontWeight="medium">{formatCurrency(product?.cost)}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color={textColor}>Margine:</Text>
                            <Text fontWeight="bold" color="green.500">
                              {product?.price && product?.cost ? 
                                `${(((product.price - product.cost) / product.price) * 100).toFixed(1)}%` : 
                                'N/A'
                              }
                            </Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg={cardBg}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <Heading size="md">Qualità</Heading>
                          <HStack justify="space-between">
                            <Text color={textColor}>Freschezza:</Text>
                            <HStack>
                              <Progress value={product?.quality?.freshness} colorScheme="green" size="sm" w="60px" />
                              <Text fontSize="sm">{product?.quality?.freshness}%</Text>
                            </HStack>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color={textColor}>Valutazione:</Text>
                            <HStack>
                              <Icon as={FiStar} color="yellow.500" />
                              <Text fontWeight="medium">{product?.quality?.rating}/5</Text>
                            </HStack>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </SimpleGrid>
              </TabPanel>

              {/* Performance Tab */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md">Score Performance</Heading>
                        <Flex align="center" justify="center">
                          <Box textAlign="center">
                            <Text fontSize="4xl" fontWeight="bold" color={accentColor}>
                              {product?.performance?.score}
                            </Text>
                            <Text color={textColor}>Punteggio Globale</Text>
                          </Box>
                        </Flex>
                        <Progress 
                          value={product?.performance?.score} 
                          colorScheme={getScoreColor(product?.performance?.score)} 
                          size="lg" 
                          borderRadius="full"
                        />
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <Heading size="md">Metriche Vendite</Heading>
                        <Stat>
                          <StatLabel>Vendite Totali</StatLabel>
                          <StatNumber>{product?.performance?.sales}</StatNumber>
                          <StatHelpText>
                            <HStack>
                              <Icon as={product?.performance?.trend === 'up' ? FiTrendingUp : FiTrendingDown} />
                              <Text>Trend {product?.performance?.trend === 'up' ? 'positivo' : 'negativo'}</Text>
                            </HStack>
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Fatturato</StatLabel>
                          <StatNumber>{formatCurrency(product?.performance?.revenue)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Velocità di Vendita</StatLabel>
                          <StatNumber>{product?.performance?.velocity} kg/giorno</StatNumber>
                        </Stat>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              {/* Inventory Tab */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Card bg={cardBg}>
                    <CardBody textAlign="center">
                      <VStack spacing={3}>
                        <Icon as={FiPackage} size="32px" color={accentColor} />
                        <Text fontSize="2xl" fontWeight="bold">{product?.inventory?.stock}</Text>
                        <Text color={textColor}>Giacenza Attuale</Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardBody textAlign="center">
                      <VStack spacing={3}>
                        <Icon as={FiAlertCircle} size="32px" color="orange.500" />
                        <Text fontSize="2xl" fontWeight="bold">{product?.inventory?.reserved}</Text>
                        <Text color={textColor}>Riservato</Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardBody textAlign="center">
                      <VStack spacing={3}>
                        <Icon as={FiTrendingUp} size="32px" color="green.500" />
                        <Text fontSize="2xl" fontWeight="bold">{product?.inventory?.incoming}</Text>
                        <Text color={textColor}>In Arrivo</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              {/* Suppliers Tab */}
              <TabPanel>
                <Card bg={cardBg}>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Heading size="md">Fornitore Principale</Heading>
                      <HStack>
                        <Avatar name={product?.supplier} bg="blue.500" />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">{product?.supplier}</Text>
                          <Text fontSize="sm" color={textColor}>Fornitore Principale</Text>
                        </VStack>
                        <Spacer />
                        <Badge colorScheme="green">Attivo</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={textColor}>Valutazione:</Text>
                        <HStack>
                          {[...Array(5)].map((_, i) => (
                            <Icon key={i} as={FiStar} color={i < 4 ? "yellow.500" : "gray.300"} />
                          ))}
                        </HStack>
                      </HStack>
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

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <Box p={6} bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <Box>
            <Heading size="xl" color={accentColor}>
              🥬 Gestione Prodotti
            </Heading>
            <Text color={textColor} mt={1}>
              Catalogo completo frutta e verdura
            </Text>
          </Box>
          
          <HStack spacing={3}>
            <ButtonGroup isAttached variant="outline">
              <Button 
                leftIcon={<FiGrid />}
                isActive={viewMode === 'grid'} 
                onClick={() => setViewMode('grid')}
              >
                Griglia
              </Button>
              <Button 
                leftIcon={<FiList />}
                isActive={viewMode === 'list'} 
                onClick={() => setViewMode('list')}
              >
                Lista
              </Button>
            </ButtonGroup>
          </HStack>
        </Flex>

        {/* Filters */}
        <Card bg={cardBg}>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <Icon as={FiSearch} color={textColor} />
                </InputLeftElement>
                <Input
                  placeholder="Cerca prodotti..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
              
              <Select 
                placeholder="Tutte le categorie" 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                maxW="200px"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
              
              <Button leftIcon={<FiFilter />} variant="outline">
                Filtri Avanzati
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Stat bg={cardBg} p={4} borderRadius="lg" shadow="sm">
            <StatLabel>Prodotti Totali</StatLabel>
            <StatNumber>{filteredProducts.length}</StatNumber>
            <StatHelpText>di {products.length} totali</StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={4} borderRadius="lg" shadow="sm">
            <StatLabel>Biologici</StatLabel>
            <StatNumber>{filteredProducts.filter(p => p.organic).length}</StatNumber>
            <StatHelpText>
              <HStack>
                <Icon as={FiHeart} color="green.500" />
                <Text>{((filteredProducts.filter(p => p.organic).length / filteredProducts.length) * 100).toFixed(0)}%</Text>
              </HStack>
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={4} borderRadius="lg" shadow="sm">
            <StatLabel>Stagionali</StatLabel>
            <StatNumber>{filteredProducts.filter(p => p.seasonal).length}</StatNumber>
            <StatHelpText>
              <HStack>
                <Icon as={FiCalendar} color="orange.500" />
                <Text>In stagione</Text>
              </HStack>
            </StatHelpText>
          </Stat>
          
          <Stat bg={cardBg} p={4} borderRadius="lg" shadow="sm">
            <StatLabel>Score Medio</StatLabel>
            <StatNumber>
              {filteredProducts.length > 0 ? 
                Math.round(filteredProducts.reduce((sum, p) => sum + p.performance.score, 0) / filteredProducts.length) : 
                0
              }
            </StatNumber>
            <StatHelpText>
              <HStack>
                <Icon as={FiAward} color="blue.500" />
                <Text>Performance</Text>
              </HStack>
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Products Grid */}
        {viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
        ) : (
          <Card bg={cardBg}>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Prodotto</Th>
                    <Th>Categoria</Th>
                    <Th isNumeric>Prezzo</Th>
                    <Th isNumeric>Score</Th>
                    <Th isNumeric>Giacenza</Th>
                    <Th>Azioni</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredProducts.map(product => (
                    <Tr key={product.id}>
                      <Td>
                        <HStack>
                          <Text fontSize="lg">{getProductEmoji(product.name)}</Text>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">{product.name}</Text>
                            <Text fontSize="sm" color={textColor}>{product.code}</Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={product.category === 'Frutta' ? 'green' : 'blue'}>
                          {product.category}
                        </Badge>
                      </Td>
                      <Td isNumeric fontWeight="bold">{formatCurrency(product.price)}</Td>
                      <Td isNumeric>
                        <Badge colorScheme={getScoreColor(product.performance.score)}>
                          {product.performance.score}
                        </Badge>
                      </Td>
                      <Td isNumeric>{product.inventory.stock} {product.unit}</Td>
                      <Td>
                        <HStack>
                          <Tooltip label="Visualizza dettagli">
                            <Button 
                              size="sm" 
                              leftIcon={<FiEye />} 
                              variant="ghost"
                              onClick={() => {
                                setSelectedProduct(product);
                                onOpen();
                              }}
                            >
                              Dettagli
                            </Button>
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Product Modal */}
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            isOpen={isOpen} 
            onClose={onClose} 
          />
        )}
      </VStack>
    </Box>
  );
};

export default ModernProductsPage;