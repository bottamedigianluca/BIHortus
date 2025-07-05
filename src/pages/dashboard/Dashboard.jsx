import React from 'react';
import {
  Box,
  Grid,
  GridItem,
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
  HStack,
  VStack,
  Badge,
  Button,
  Icon,
  Progress,
  Flex,
  SimpleGrid
} from '@chakra-ui/react';
import {
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalance,
  MdSync,
  MdWarning,
  MdCheckCircle
} from 'react-icons/md';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

// Componenti dashboard
const KPICard = ({ title, value, change, trend, icon, color = 'brand' }) => (
  <Card>
    <CardBody>
      <HStack spacing={4}>
        <Box
          p={3}
          borderRadius="lg"
          bg={`${color}.100`}
          color={`${color}.600`}
        >
          <Icon as={icon} boxSize={6} />
        </Box>
        <Box flex="1">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">
              {title}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold">
              {value}
            </StatNumber>
            <StatHelpText mb={0}>
              {change && (
                <>
                  <StatArrow type={trend === 'up' ? 'increase' : 'decrease'} />
                  {change}
                </>
              )}
            </StatHelpText>
          </Stat>
        </Box>
      </HStack>
    </CardBody>
  </Card>
);

const ReconciliationStatusCard = ({ data }) => {
  const total = data?.pending + data?.matched + data?.approved || 1;
  const matchRate = ((data?.matched / total) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Stato Riconciliazione</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4}>
          <Box w="full">
            <Flex justify="space-between" mb={2}>
              <Text fontSize="sm">Tasso di Match Automatico</Text>
              <Text fontSize="sm" fontWeight="bold">{matchRate}%</Text>
            </Flex>
            <Progress value={matchRate} colorScheme="green" borderRadius="md" />
          </Box>
          
          <SimpleGrid columns={3} spacing={4} w="full">
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                {data?.pending || 0}
              </Text>
              <Text fontSize="xs" color="gray.600">PENDING</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {data?.matched || 0}
              </Text>
              <Text fontSize="xs" color="gray.600">MATCHED</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {data?.approved || 0}
              </Text>
              <Text fontSize="xs" color="gray.600">APPROVED</Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </CardBody>
    </Card>
  );
};

const CashFlowChart = ({ data }) => (
  <Card>
    <CardHeader>
      <Heading size="md">Flusso di Cassa (30 giorni)</Heading>
    </CardHeader>
    <CardBody>
      <Box h="300px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`€${value.toLocaleString()}`, 'Importo']}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="inflow" 
              stroke="#48bb78" 
              strokeWidth={2}
              name="Entrate"
            />
            <Line 
              type="monotone" 
              dataKey="outflow" 
              stroke="#f56565" 
              strokeWidth={2}
              name="Uscite"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </CardBody>
  </Card>
);

const ClientsDistributionChart = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <Card>
      <CardHeader>
        <Heading size="md">Distribuzione Clienti</Heading>
      </CardHeader>
      <CardBody>
        <Box h="300px">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(Array.isArray(data) ? data : []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardBody>
    </Card>
  );
};

const RecentActivity = ({ activities }) => (
  <Card>
    <CardHeader>
      <Heading size="md">Attività Recenti</Heading>
    </CardHeader>
    <CardBody>
      <VStack spacing={3} align="stretch">
        {(Array.isArray(activities) ? activities : []).map((activity, index) => (
          <HStack key={index} spacing={3}>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={
                activity.type === 'success' ? 'green.500' :
                activity.type === 'warning' ? 'yellow.500' : 'red.500'
              }
            />
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium">
                {activity.title}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {activity.time}
              </Text>
            </Box>
            <Badge
              colorScheme={
                activity.type === 'success' ? 'green' :
                activity.type === 'warning' ? 'yellow' : 'red'
              }
              size="sm"
            >
              {activity.status}
            </Badge>
          </HStack>
        ))}
      </VStack>
    </CardBody>
  </Card>
);

const Dashboard = () => {
  // Query per KPI dashboard
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpi'],
    queryFn: () => fetch('/api/dashboard/kpi').then(res => res.json()),
    refetchInterval: 30000
  });

  // Query per dati riconciliazione
  const { data: reconciliationData } = useQuery({
    queryKey: ['reconciliation-status'],
    queryFn: () => fetch('/api/reconciliation/status').then(res => res.json()),
    refetchInterval: 60000
  });

  // Query per cash flow
  const { data: cashFlowData } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: () => fetch('/api/analytics/cash-flow').then(res => res.json()),
    refetchInterval: 300000 // 5 minuti
  });

  // Query per distribuzione clienti
  const { data: clientsData } = useQuery({
    queryKey: ['clients-distribution'],
    queryFn: () => fetch('/api/analytics/clients-distribution').then(res => res.json()),
    refetchInterval: 600000 // 10 minuti
  });

  // Query per attività recenti
  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => fetch('/api/activities/recent').then(res => res.json()),
    refetchInterval: 30000
  });

  // Usa solo dati reali dalle API - nessun fallback mock
  if (!kpiData) {
    return (
      <Box>
        <Text>Caricamento dati dashboard...</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* KPI Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={6} mb={8}>
        <KPICard
          title="Fatturato Oggi"
          value={`€${kpiData.data?.fatturato_oggi?.toLocaleString() || '0'}`}
          icon={MdTrendingUp}
          color="green"
        />
        <KPICard
          title="Fatturato Mese"
          value={`€${kpiData.data?.fatturato_mese?.toLocaleString() || '0'}`}
          icon={MdAccountBalance}
          color="blue"
        />
        <KPICard
          title="Scaduto"
          value={`€${kpiData.data?.scaduto_totale?.toLocaleString() || '0'}`}
          icon={MdWarning}
          color="red"
        />
        <KPICard
          title="Scade 7gg"
          value={`€${kpiData.data?.scadenze_7gg?.toLocaleString() || '0'}`}
          icon={MdWarning}
          color="yellow"
        />
        <KPICard
          title="Ordini Aperti"
          value={kpiData.data?.ordini_aperti || 0}
          icon={MdSync}
          color="purple"
        />
        <KPICard
          title="Clienti Attivi"
          value={kpiData.data?.clienti_attivi || 0}
          icon={MdCheckCircle}
          color="teal"
        />
      </SimpleGrid>

      {/* Main Dashboard Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} mb={8}>
        <GridItem>
          <CashFlowChart data={cashFlowData?.data || []} />
        </GridItem>
        <GridItem>
          <ReconciliationStatusCard data={reconciliationData?.data || {}} />
        </GridItem>
      </Grid>

      {/* Secondary Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
        <GridItem>
          <ClientsDistributionChart data={clientsData?.data || []} />
        </GridItem>
        <GridItem>
          <RecentActivity activities={recentActivities || []} />
        </GridItem>
      </Grid>
    </Box>
  );
};

export default Dashboard;