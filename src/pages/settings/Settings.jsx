import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Switch,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Spinner,
  useToast,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Code,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { 
  FiDatabase, 
  FiCloud, 
  FiSettings, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertCircle,
  FiRefreshCw,
  FiSave,
  FiDownload,
  FiServer,
  FiKey,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [arcaTables, setArcaTables] = useState([]);
  const [sqliteTables, setSqliteTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  const [arcaConfig, setArcaConfig] = useState({
    server: 'localhost',
    database: 'ADB_BOTTAMEDI',
    user: 'bihortus_reader',
    password: 'BiHortus2025!'
  });

  const [cloudConfig, setCloudConfig] = useState({
    enabled: false,
    provider: 'supabase',
    url: '',
    key: ''
  });

  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  const fetchDatabaseStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/database-status');
      const data = await response.json();
      
      if (data.success) {
        setDbStatus(data.data);
        
        // Update form with current config
        if (data.data.arca) {
          setArcaConfig(prev => ({
            ...prev,
            server: data.data.arca.server,
            database: data.data.arca.database,
            user: data.data.arca.user
          }));
        }
        
        if (data.data.cloudSync) {
          setCloudConfig(prev => ({
            ...prev,
            enabled: data.data.cloudSync.enabled,
            provider: data.data.cloudSync.provider
          }));
        }
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare lo stato del database',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const testArcaConnection = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/settings/test-arca-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(arcaConfig),
      });
      
      const data = await response.json();
      
      toast({
        title: data.success ? 'Connessione riuscita!' : 'Connessione fallita',
        description: data.message || data.error,
        status: data.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      
      if (data.success) {
        fetchDatabaseStatus();
      }
      
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore durante il test di connessione',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTesting(false);
    }
  };

  const saveDatabaseConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/save-database-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arca: arcaConfig,
          cloudSync: cloudConfig
        }),
      });
      
      const data = await response.json();
      
      toast({
        title: data.success ? 'Configurazione salvata' : 'Errore',
        description: data.message || data.error,
        status: data.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore durante il salvataggio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const loadDatabaseTables = async (dbType) => {
    try {
      setTablesLoading(true);
      const response = await fetch(`/api/settings/database-tables?database_type=${dbType}`);
      const data = await response.json();
      
      if (data.success) {
        if (dbType === 'arca') {
          setArcaTables(data.data);
        } else {
          setSqliteTables(data.data);
        }
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le tabelle',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTablesLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      const response = await fetch('/api/settings/backup-database', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      toast({
        title: data.success ? 'Backup creato' : 'Errore',
        description: data.message || data.error,
        status: data.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore durante la creazione del backup',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusIcon = (connected) => {
    return connected ? FiCheckCircle : FiXCircle;
  };

  const getStatusColor = (connected) => {
    return connected ? 'green' : 'red';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Caricamento impostazioni...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            <Icon as={FiSettings} mr={3} />
            Impostazioni Sistema
          </Heading>
          <Text color="gray.600">
            Configurazione database, connessioni e sincronizzazione cloud
          </Text>
        </Box>

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <Icon as={FiDatabase} mr={2} />
              Database ARCA
            </Tab>
            <Tab>
              <Icon as={FiCloud} mr={2} />
              Cloud Sync
            </Tab>
            <Tab>
              <Icon as={FiServer} mr={2} />
              Sistema
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab Database ARCA */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* Status Overview */}
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Stato Connessioni Database</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      <Stat>
                        <StatLabel display="flex" alignItems="center">
                          <Icon 
                            as={getStatusIcon(dbStatus?.sqlite?.connected)} 
                            color={getStatusColor(dbStatus?.sqlite?.connected)}
                            mr={2}
                          />
                          SQLite (Locale)
                        </StatLabel>
                        <StatNumber>
                          {dbStatus?.sqlite?.connected ? 'Connesso' : 'Disconnesso'}
                        </StatNumber>
                        <StatHelpText>
                          {dbStatus?.sqlite?.size ? `${dbStatus.sqlite.size} MB` : 'N/A'}
                        </StatHelpText>
                      </Stat>

                      <Stat>
                        <StatLabel display="flex" alignItems="center">
                          <Icon 
                            as={getStatusIcon(dbStatus?.arca?.connected)} 
                            color={getStatusColor(dbStatus?.arca?.connected)}
                            mr={2}
                          />
                          ARCA Evolution
                        </StatLabel>
                        <StatNumber>
                          {dbStatus?.arca?.connected ? 'Connesso' : 'Disconnesso'}
                        </StatNumber>
                        <StatHelpText>
                          {dbStatus?.arca?.server}
                        </StatHelpText>
                      </Stat>

                      <Stat>
                        <StatLabel display="flex" alignItems="center">
                          <Icon 
                            as={getStatusIcon(dbStatus?.cloudSync?.connected)} 
                            color={getStatusColor(dbStatus?.cloudSync?.connected)}
                            mr={2}
                          />
                          Cloud Sync
                        </StatLabel>
                        <StatNumber>
                          {dbStatus?.cloudSync?.enabled ? 'Abilitato' : 'Disabilitato'}
                        </StatNumber>
                        <StatHelpText>
                          {dbStatus?.cloudSync?.provider || 'N/A'}
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* ARCA Configuration */}
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">Configurazione Database ARCA</Heading>
                      <HStack>
                        <Button
                          leftIcon={<Icon as={FiRefreshCw} />}
                          onClick={fetchDatabaseStatus}
                          size="sm"
                          variant="outline"
                        >
                          Aggiorna
                        </Button>
                        <Button
                          leftIcon={<Icon as={showPasswords ? FiEyeOff : FiEye} />}
                          onClick={() => setShowPasswords(!showPasswords)}
                          size="sm"
                          variant="ghost"
                        >
                          {showPasswords ? 'Nascondi' : 'Mostra'} Password
                        </Button>
                      </HStack>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Configurazione Database ARCA Evolution</AlertTitle>
                          <AlertDescription>
                            Configura la connessione al database SQL Server di ARCA Evolution.
                            Assicurati che il server sia raggiungibile e che l'utente abbia i permessi di lettura.
                          </AlertDescription>
                        </Box>
                      </Alert>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>Server</FormLabel>
                          <Input
                            value={arcaConfig.server}
                            onChange={(e) => setArcaConfig({...arcaConfig, server: e.target.value})}
                            placeholder="es. localhost oppure 192.168.1.100"
                          />
                          <FormHelperText>
                            Nome del server o indirizzo IP dove è installato SQL Server
                          </FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Database</FormLabel>
                          <Input
                            value={arcaConfig.database}
                            onChange={(e) => setArcaConfig({...arcaConfig, database: e.target.value})}
                            placeholder="es. ADB_BOTTAMEDI"
                          />
                          <FormHelperText>
                            Nome del database ARCA Evolution
                          </FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Utente</FormLabel>
                          <Input
                            value={arcaConfig.user}
                            onChange={(e) => setArcaConfig({...arcaConfig, user: e.target.value})}
                            placeholder="es. bihortus_reader"
                          />
                          <FormHelperText>
                            Utente SQL Server con permessi di lettura
                          </FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Password</FormLabel>
                          <Input
                            type={showPasswords ? "text" : "password"}
                            value={arcaConfig.password}
                            onChange={(e) => setArcaConfig({...arcaConfig, password: e.target.value})}
                            placeholder="Password utente"
                          />
                          <FormHelperText>
                            Password dell'utente SQL Server
                          </FormHelperText>
                        </FormControl>
                      </SimpleGrid>

                      <Divider />

                      <HStack spacing={4}>
                        <Button
                          leftIcon={<Icon as={FiKey} />}
                          onClick={testArcaConnection}
                          isLoading={testing}
                          loadingText="Testando..."
                          colorScheme="blue"
                          variant="outline"
                        >
                          Testa Connessione
                        </Button>

                        <Button
                          leftIcon={<Icon as={FiSave} />}
                          onClick={saveDatabaseConfig}
                          isLoading={saving}
                          loadingText="Salvando..."
                          colorScheme="green"
                        >
                          Salva Configurazione
                        </Button>
                      </HStack>

                      {/* Connection Guide */}
                      <Accordion allowToggle>
                        <AccordionItem>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <Icon as={FiAlertCircle} mr={2} />
                              Guida alla Configurazione
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <VStack spacing={4} align="stretch">
                              <Text fontWeight="bold">Passaggi per configurare la connessione:</Text>
                              
                              <List spacing={2}>
                                <ListItem>
                                  <ListIcon as={FiCheckCircle} color="green.500" />
                                  <strong>1. Verifica SQL Server:</strong> Assicurati che SQL Server sia avviato localmente
                                </ListItem>
                                <ListItem>
                                  <ListIcon as={FiCheckCircle} color="green.500" />
                                  <strong>2. Abilita TCP/IP:</strong> Nelle configurazioni SQL Server, abilita il protocollo TCP/IP
                                </ListItem>
                                <ListItem>
                                  <ListIcon as={FiCheckCircle} color="green.500" />
                                  <strong>3. Abilita autenticazione mista:</strong> SQL Server Authentication deve essere abilitata
                                </ListItem>
                                <ListItem>
                                  <ListIcon as={FiCheckCircle} color="green.500" />
                                  <strong>4. Crea Utente:</strong> Crea un utente SQL Server con permessi di lettura:
                                </ListItem>
                              </List>

                              <Box bg="gray.100" p={4} borderRadius="md">
                                <Text fontWeight="bold" mb={2}>Script SQL per creare l'utente:</Text>
                                <Code p={3} display="block" whiteSpace="pre">
{`CREATE LOGIN bihortus_reader WITH PASSWORD = 'BiHortus2025!';
USE ADB_BOTTAMEDI;
CREATE USER bihortus_reader FOR LOGIN bihortus_reader;
GRANT SELECT ON SCHEMA::dbo TO bihortus_reader;`}
                                </Code>
                              </Box>

                              <Alert status="info">
                                <AlertIcon />
                                <Box>
                                  <AlertTitle>Informazioni Database ARCA</AlertTitle>
                                  <AlertDescription>
                                    <Text mb={2}>
                                      <strong>Percorso rilevato:</strong> <Code>C:\GESTIONALI\SQL_DATA\MSSQL13.MSSQLSERVER\MSSQL</Code>
                                    </Text>
                                    <Text mb={2}>
                                      Questo indica SQL Server 2016 installato localmente con istanza predefinita.
                                    </Text>
                                    <Text>
                                      Usa <strong>localhost</strong> come server per connetterti all'istanza locale.
                                    </Text>
                                  </AlertDescription>
                                </Box>
                              </Alert>

                              <Alert status="warning">
                                <AlertIcon />
                                <AlertDescription>
                                  <strong>Importante:</strong> L'utente configurato avrà accesso in sola lettura al database ARCA.
                                  Non verranno mai eseguite operazioni di scrittura che potrebbero danneggiare i dati.
                                </AlertDescription>
                              </Alert>
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>

                      {/* Database Tables */}
                      {dbStatus?.arca?.connected && (
                        <Card variant="outline">
                          <CardHeader>
                            <HStack justify="space-between">
                              <Heading size="sm">Tabelle Database ARCA</Heading>
                              <Button
                                size="sm"
                                onClick={() => loadDatabaseTables('arca')}
                                isLoading={tablesLoading}
                              >
                                Carica Tabelle
                              </Button>
                            </HStack>
                          </CardHeader>
                          {arcaTables.length > 0 && (
                            <CardBody>
                              <Table size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Nome Tabella</Th>
                                    <Th>Tipo</Th>
                                    <Th>Utilizzo</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {arcaTables.map((table, index) => (
                                    <Tr key={index}>
                                      <Td><Code>{table.nome}</Code></Td>
                                      <Td>{table.tipo}</Td>
                                      <Td>
                                        {table.nome === 'CF' && 'Anagrafica Clienti/Fornitori'}
                                        {table.nome === 'SC' && 'Scadenzario'}
                                        {table.nome === 'DOTes' && 'Testata Documenti'}
                                        {table.nome === 'DORig' && 'Righe Documenti'}
                                        {table.nome === 'DOTotali' && 'Totali Documenti'}
                                        {table.nome === 'AR' && 'Anagrafica Articoli'}
                                        {table.nome === 'ARCategoria' && 'Categorie Articoli'}
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </CardBody>
                          )}
                        </Card>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Tab Cloud Sync */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Configurazione Cloud Sync</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                          Abilita sincronizzazione cloud
                        </FormLabel>
                        <Switch
                          isChecked={cloudConfig.enabled}
                          onChange={(e) => setCloudConfig({...cloudConfig, enabled: e.target.checked})}
                        />
                      </FormControl>

                      {cloudConfig.enabled && (
                        <>
                          <FormControl>
                            <FormLabel>URL Supabase</FormLabel>
                            <Input
                              value={cloudConfig.url}
                              onChange={(e) => setCloudConfig({...cloudConfig, url: e.target.value})}
                              placeholder="https://your-project.supabase.co"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel>Chiave API Supabase</FormLabel>
                            <Input
                              type={showPasswords ? "text" : "password"}
                              value={cloudConfig.key}
                              onChange={(e) => setCloudConfig({...cloudConfig, key: e.target.value})}
                              placeholder="Chiave API anon"
                            />
                          </FormControl>
                        </>
                      )}

                      <Button
                        leftIcon={<Icon as={FiSave} />}
                        onClick={saveDatabaseConfig}
                        isLoading={saving}
                        colorScheme="green"
                      >
                        Salva Configurazione Cloud
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Tab Sistema */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">Gestione Database Locale</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">Database SQLite</Text>
                          <Text fontSize="sm" color="gray.600">
                            Percorso: <Code fontSize="xs">{dbStatus?.sqlite?.path}</Code>
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Dimensione: {dbStatus?.sqlite?.size} MB
                          </Text>
                        </VStack>
                        <Button
                          leftIcon={<Icon as={FiDownload} />}
                          onClick={createBackup}
                          colorScheme="blue"
                          variant="outline"
                        >
                          Crea Backup
                        </Button>
                      </HStack>

                      <Divider />

                      {dbStatus?.sqlite?.connected && (
                        <Card variant="outline">
                          <CardHeader>
                            <HStack justify="space-between">
                              <Heading size="sm">Tabelle Database Locale</Heading>
                              <Button
                                size="sm"
                                onClick={() => loadDatabaseTables('sqlite')}
                                isLoading={tablesLoading}
                              >
                                Carica Tabelle
                              </Button>
                            </HStack>
                          </CardHeader>
                          {sqliteTables.length > 0 && (
                            <CardBody>
                              <Table size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Nome Tabella</Th>
                                    <Th>Tipo</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {sqliteTables.map((table, index) => (
                                    <Tr key={index}>
                                      <Td><Code>{table.nome}</Code></Td>
                                      <Td>{table.tipo}</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </CardBody>
                          )}
                        </Card>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default Settings;