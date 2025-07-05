import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  HStack,
  Input,
  Select,
  Button,
  Badge,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/arca/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        throw new Error('Errore nel caricamento prodotti');
      }
    } catch (error) {
      console.error('Errore:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i prodotti dal database ARCA',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.Descrizione?.toLowerCase().includes(search.toLowerCase()) ||
    product.Cd_AR?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Caricamento prodotti...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Gestione Prodotti</Heading>
          <Text color="gray.600">
            Visualizza e gestisci i prodotti dal database ARCA Evolution
          </Text>
        </Box>

        <HStack spacing={4}>
          <Input
            placeholder="Cerca prodotti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxWidth="400px"
          />
          <Button colorScheme="blue" onClick={fetchProducts}>
            Aggiorna
          </Button>
        </HStack>

        {products.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            Nessun prodotto trovato. Verificare la connessione al database ARCA.
          </Alert>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Codice</Th>
                  <Th>Descrizione</Th>
                  <Th>Quantità</Th>
                  <Th>Prezzo</Th>
                  <Th>Data</Th>
                  <Th>Stato</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredProducts.map((product, index) => (
                  <Tr key={`${product.Cd_AR}-${index}`}>
                    <Td fontWeight="semibold">{product.Cd_AR}</Td>
                    <Td>{product.Descrizione}</Td>
                    <Td>{product.Qta?.toFixed(2)}</Td>
                    <Td>€ {product.PrezzoUnitarioV?.toFixed(2)}</Td>
                    <Td>{new Date(product.DataDoc).toLocaleDateString('it-IT')}</Td>
                    <Td>
                      <Badge colorScheme="green">Attivo</Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Text fontSize="sm" color="gray.500">
          Mostrando {filteredProducts.length} di {products.length} prodotti
        </Text>
      </VStack>
    </Box>
  );
}