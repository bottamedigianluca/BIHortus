import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Progress,
  Icon
} from '@chakra-ui/react';
import { MdSync, MdCloud, MdStorage } from 'react-icons/md';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SyncStatus = () => {
  const queryClient = useQueryClient();

  const { data: syncStatus, isLoading } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => fetch('/api/sync/status').then(res => res.json()),
    refetchInterval: 5000
  });

  const syncMutation = useMutation({
    mutationFn: () => fetch('/api/sync/trigger', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['sync-status']);
    }
  });

  const status = syncStatus?.data || {};

  return (
    <Box>
      <Heading mb={6}>Stato Sincronizzazione</Heading>
      
      <VStack spacing={6} align="stretch">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <Heading size="md">Panoramica Sync</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <HStack w="full" justify="space-between">
                <HStack spacing={3}>
                  <Icon 
                    as={MdCloud} 
                    boxSize={6} 
                    color={status.connected ? 'green.500' : 'red.500'}
                  />
                  <Box>
                    <Text fontWeight="bold">Connessione Cloud</Text>
                    <Text fontSize="sm" color="gray.600">
                      {status.connected ? 'Connesso' : 'Disconnesso'}
                    </Text>
                  </Box>
                </HStack>
                <Badge colorScheme={status.connected ? 'green' : 'red'}>
                  {status.connected ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </HStack>

              <HStack w="full" justify="space-between">
                <HStack spacing={3}>
                  <Icon as={MdSync} boxSize={6} color="blue.500" />
                  <Box>
                    <Text fontWeight="bold">Ultimo Sync</Text>
                    <Text fontSize="sm" color="gray.600">
                      {status.lastSync ? 
                        new Date(status.lastSync).toLocaleString('it-IT') : 
                        'Mai sincronizzato'
                      }
                    </Text>
                  </Box>
                </HStack>
                <Badge colorScheme={status.syncInProgress ? 'yellow' : 'gray'}>
                  {status.syncInProgress ? 'IN CORSO' : 'INATTIVO'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Sync Actions */}
        <Card>
          <CardHeader>
            <Heading size="md">Azioni Sync</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={4}>
              <Button
                leftIcon={<MdSync />}
                colorScheme="brand"
                onClick={() => syncMutation.mutate()}
                isLoading={syncMutation.isLoading || status.syncInProgress}
                loadingText="Sincronizzando..."
                isDisabled={!status.connected}
              >
                Sincronizza Ora
              </Button>
              
              <Button variant="outline">
                Visualizza Log
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Tables Status */}
        <Card>
          <CardHeader>
            <Heading size="md">Stato Tabelle</Heading>
          </CardHeader>
          <CardBody>
            {status.tables?.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {status.tables.map((table, index) => (
                  <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <HStack spacing={3}>
                      <Icon as={MdStorage} color="blue.500" />
                      <Box>
                        <Text fontWeight="medium">{table.table_name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {table.records_count || 0} record
                        </Text>
                      </Box>
                    </HStack>
                    <VStack spacing={1} align="end">
                      <Badge colorScheme={
                        table.status === 'completed' ? 'green' :
                        table.status === 'error' ? 'red' : 'yellow'
                      }>
                        {table.status?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                      {table.last_sync && (
                        <Text fontSize="xs" color="gray.500">
                          {new Date(table.last_sync).toLocaleString('it-IT')}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500">Nessuna informazione di sync disponibile</Text>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default SyncStatus;