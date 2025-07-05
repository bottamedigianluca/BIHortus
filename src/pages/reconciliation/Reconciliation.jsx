import React, { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Input,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { MdUpload, MdRefresh, MdCheck, MdClose } from 'react-icons/md';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Reconciliation = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Query per caricamento dati riconciliazione
  const { data: reconciliationData, isLoading } = useQuery({
    queryKey: ['reconciliation-records', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return fetch(`/api/reconciliation/records?${params}`).then(res => res.json());
    },
    refetchInterval: 30000
  });

  // Query per stato riconciliazione
  const { data: statusData } = useQuery({
    queryKey: ['reconciliation-status'],
    queryFn: () => fetch('/api/reconciliation/status').then(res => res.json()),
    refetchInterval: 10000
  });

  // Mutation per upload file
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetch('/api/reconciliation/import-bank-movements', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload completato',
        description: `Processati ${data.data?.stats?.total || 0} movimenti`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      queryClient.invalidateQueries(['reconciliation-records']);
      queryClient.invalidateQueries(['reconciliation-status']);
      onClose();
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: 'Errore upload',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  });

  // Mutation per approvazione
  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/reconciliation/approve/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 })
      });
      if (!response.ok) throw new Error('Approval failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Riconciliazione approvata',
        status: 'success',
        duration: 3000
      });
      queryClient.invalidateQueries(['reconciliation-records']);
      queryClient.invalidateQueries(['reconciliation-status']);
    }
  });

  // Mutation per rifiuto
  const rejectMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/reconciliation/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1, reason: 'Rejected by user' })
      });
      if (!response.ok) throw new Error('Rejection failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Riconciliazione rifiutata',
        status: 'warning',
        duration: 3000
      });
      queryClient.invalidateQueries(['reconciliation-records']);
      queryClient.invalidateQueries(['reconciliation-status']);
    }
  });

  const handleFileUpload = () => {
    if (!selectedFile) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file da caricare',
        status: 'error',
        duration: 3000
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('algorithms', 'combined');
    formData.append('minScore', '0.7');
    formData.append('userId', '1');

    uploadMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'matched': return 'blue';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'In Attesa';
      case 'matched': return 'Abbinato';
      case 'approved': return 'Approvato';
      case 'rejected': return 'Rifiutato';
      default: return status;
    }
  };

  const records = reconciliationData?.data || [];
  const status = statusData?.data || {};

  return (
    <Box>
      {/* Header */}
      <Flex mb={6}>
        <Box>
          <Heading size="lg" mb={2}>Riconciliazione Bancaria</Heading>
          <Text color="gray.600">
            Gestione automatica e manuale delle riconciliazioni
          </Text>
        </Box>
        <Spacer />
        <HStack spacing={4}>
          <Button
            leftIcon={<MdRefresh />}
            onClick={() => queryClient.invalidateQueries(['reconciliation-records'])}
          >
            Aggiorna
          </Button>
          <Button
            leftIcon={<MdUpload />}
            colorScheme="brand"
            onClick={onOpen}
          >
            Importa Movimenti
          </Button>
        </HStack>
      </Flex>

      {/* Status Cards */}
      <HStack spacing={6} mb={8}>
        <Card flex="1">
          <CardBody>
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                {status.pending || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">IN ATTESA</Text>
            </VStack>
          </CardBody>
        </Card>
        
        <Card flex="1">
          <CardBody>
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {status.matched || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">ABBINATI</Text>
            </VStack>
          </CardBody>
        </Card>
        
        <Card flex="1">
          <CardBody>
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {status.approved || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">APPROVATI</Text>
            </VStack>
          </CardBody>
        </Card>
        
        <Card flex="1">
          <CardBody>
            <VStack spacing={4}>
              <Text fontSize="sm" fontWeight="bold">TASSO MATCHING</Text>
              <Box w="full">
                <Progress 
                  value={status.match_rate || 0} 
                  colorScheme="green" 
                  borderRadius="md"
                />
                <Text fontSize="sm" textAlign="center" mt={1}>
                  {status.match_rate || 0}%
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </HStack>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <HStack spacing={4}>
            <Select 
              placeholder="Tutti gli stati"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              w="200px"
            >
              <option value="pending">In Attesa</option>
              <option value="matched">Abbinati</option>
              <option value="approved">Approvati</option>
              <option value="rejected">Rifiutati</option>
            </Select>
            
            <Input
              type="date"
              placeholder="Data da"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              w="150px"
            />
            
            <Input
              type="date"
              placeholder="Data a"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              w="150px"
            />
            
            <Button 
              onClick={() => setFilters({ status: '', dateFrom: '', dateTo: '' })}
              variant="outline"
            >
              Reset
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <Heading size="md">Record di Riconciliazione</Heading>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Text>Caricamento...</Text>
          ) : records.length === 0 ? (
            <Text color="gray.500">Nessun record trovato</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Data</Th>
                  <Th>Importo</Th>
                  <Th>Descrizione</Th>
                  <Th>Cliente</Th>
                  <Th>Score</Th>
                  <Th>Stato</Th>
                  <Th>Azioni</Th>
                </Tr>
              </Thead>
              <Tbody>
                {records.map((record) => (
                  <Tr key={record.id}>
                    <Td>{new Date(record.bank_date).toLocaleDateString('it-IT')}</Td>
                    <Td>€{record.bank_amount?.toLocaleString()}</Td>
                    <Td maxW="200px" isTruncated>
                      {record.bank_description}
                    </Td>
                    <Td>{record.arca_cliente_code || '-'}</Td>
                    <Td>
                      <Badge colorScheme={record.match_score >= 0.8 ? 'green' : 'yellow'}>
                        {(record.match_score * 100).toFixed(0)}%
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(record.status)}>
                        {getStatusText(record.status)}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {record.status === 'pending' || record.status === 'matched' ? (
                          <>
                            <Button
                              size="sm"
                              colorScheme="green"
                              leftIcon={<MdCheck />}
                              onClick={() => approveMutation.mutate(record.id)}
                              isLoading={approveMutation.isLoading}
                            >
                              Approva
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              leftIcon={<MdClose />}
                              onClick={() => rejectMutation.mutate(record.id)}
                              isLoading={rejectMutation.isLoading}
                            >
                              Rifiuta
                            </Button>
                          </>
                        ) : (
                          <Text fontSize="sm" color="gray.500">
                            Completato
                          </Text>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Importa Movimenti Bancari</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box w="full">
                <Text mb={2}>Seleziona file estratto conto:</Text>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Formati supportati: CSV, Excel
                </Text>
              </Box>
              
              {selectedFile && (
                <Box w="full" p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm">
                    <strong>File selezionato:</strong> {selectedFile.name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Dimensione: {(selectedFile.size / 1024).toFixed(1)} KB
                  </Text>
                </Box>
              )}
              
              <HStack w="full" pt={4}>
                <Button onClick={onClose}>Annulla</Button>
                <Spacer />
                <Button
                  colorScheme="brand"
                  onClick={handleFileUpload}
                  isLoading={uploadMutation.isLoading}
                  loadingText="Caricamento..."
                >
                  Carica e Processa
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Reconciliation;