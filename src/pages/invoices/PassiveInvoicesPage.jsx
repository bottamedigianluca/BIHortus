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
  Button,
  Badge,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FiEye, FiDownload } from 'react-icons/fi';

export default function PassiveInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices/passive');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        throw new Error('Errore nel caricamento fatture passive');
      }
    } catch (error) {
      console.error('Errore:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le fatture passive',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const openInvoicePDF = (filePath) => {
    if (filePath) {
      // Converti il percorso Windows in URL
      const pdfUrl = `file:///${filePath.replace(/\\/g, '/')}`;
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: 'File non trovato',
        description: 'Il file PDF della fattura non è disponibile',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.Fornitore?.toLowerCase().includes(search.toLowerCase()) ||
    invoice.NumeroDoc?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Caricamento fatture passive...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Fatture Passive</Heading>
          <Text color="gray.600">
            Gestione fatture ricevute dai fornitori con accesso ai file PDF
          </Text>
        </Box>

        <HStack spacing={4}>
          <Input
            placeholder="Cerca fatture o fornitori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxWidth="400px"
          />
          <Button colorScheme="blue" onClick={fetchInvoices}>
            Aggiorna
          </Button>
        </HStack>

        {invoices.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            Nessuna fattura passiva trovata. Le fatture PDF si trovano in C:\Users\Bottamedi\Documents\
          </Alert>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Numero</Th>
                  <Th>Data</Th>
                  <Th>Fornitore</Th>
                  <Th>Totale</Th>
                  <Th>Stato</Th>
                  <Th>Azioni</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredInvoices.map((invoice, index) => (
                  <Tr key={`${invoice.NumeroDoc}-${index}`}>
                    <Td fontWeight="semibold">{invoice.NumeroDoc}</Td>
                    <Td>{new Date(invoice.DataDoc).toLocaleDateString('it-IT')}</Td>
                    <Td>{invoice.Fornitore}</Td>
                    <Td>€ {invoice.TotaleE?.toFixed(2)}</Td>
                    <Td>
                      <Badge 
                        colorScheme={invoice.Stato === 'Pagata' ? 'green' : 'orange'}
                      >
                        {invoice.Stato}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="Visualizza PDF">
                          <IconButton
                            icon={<FiEye />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => openInvoicePDF(invoice.FilePath)}
                          />
                        </Tooltip>
                        <Tooltip label="Scarica PDF">
                          <IconButton
                            icon={<FiDownload />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => openInvoicePDF(invoice.FilePath)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Box>
          <Text fontSize="sm" color="gray.500">
            Mostrando {filteredInvoices.length} di {invoices.length} fatture passive
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            💡 Le fatture PDF sono archiviate in C:\Users\Bottamedi\Documents\ organizzate per mese
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}