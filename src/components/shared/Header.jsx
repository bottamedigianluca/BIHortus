import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  useColorModeValue,
  Tooltip
} from '@chakra-ui/react';
import {
  MdNotifications,
  MdSync,
  MdRefresh,
  MdCloudDone,
  MdCloudOff
} from 'react-icons/md';
import { useQuery } from '@tanstack/react-query';

const Header = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Query per stato sincronizzazione
  const { data: syncStatus } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: () => fetch('/api/sync/status').then(res => res.json()),
    refetchInterval: 30000 // Aggiorna ogni 30 secondi
  });

  // Query per notifiche
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then(res => res.json()),
    refetchInterval: 60000 // Aggiorna ogni minuto
  });

  const handleManualSync = async () => {
    try {
      await fetch('/api/sync/trigger', { method: 'POST' });
      // Refresh sync status
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const pendingNotifications = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;
  const isSyncing = syncStatus?.syncInProgress;
  const isConnected = syncStatus?.connected;

  return (
    <Box
      w="full"
      bg={bg}
      borderBottom="1px solid"
      borderColor={borderColor}
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex justify="space-between" align="center">
        {/* Page Title */}
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            Dashboard Finanziario
          </Text>
          <Text fontSize="sm" color="gray.600">
            Sistema di Riconciliazione Bancaria - Bottamedi
          </Text>
        </Box>

        {/* Right Section */}
        <HStack spacing={4}>
          {/* Sync Status */}
          <Tooltip 
            label={
              isSyncing ? 'Sincronizzazione in corso...' :
              isConnected ? 'Connesso al cloud' : 'Disconnesso dal cloud'
            }
          >
            <HStack spacing={2}>
              <IconButton
                aria-label="Sync status"
                icon={
                  isSyncing ? <MdSync className="animate-spin" /> :
                  isConnected ? <MdCloudDone /> : <MdCloudOff />
                }
                size="sm"
                variant="ghost"
                color={
                  isSyncing ? 'blue.500' :
                  isConnected ? 'green.500' : 'red.500'
                }
                onClick={!isSyncing ? handleManualSync : undefined}
                isDisabled={isSyncing}
              />
              <Text fontSize="xs" color="gray.600">
                {syncStatus?.lastSync ? 
                  `Ultimo: ${new Date(syncStatus.lastSync).toLocaleTimeString()}` :
                  'Mai sincronizzato'
                }
              </Text>
            </HStack>
          </Tooltip>

          {/* Manual Refresh */}
          <Tooltip label="Aggiorna dati">
            <IconButton
              aria-label="Refresh"
              icon={<MdRefresh />}
              size="sm"
              variant="ghost"
              onClick={() => window.location.reload()}
            />
          </Tooltip>

          {/* Notifications */}
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Notifications"
              icon={<MdNotifications />}
              size="sm"
              variant="ghost"
              position="relative"
            >
              {pendingNotifications > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  colorScheme="red"
                  borderRadius="full"
                  boxSize="18px"
                  fontSize="10px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {pendingNotifications}
                </Badge>
              )}
            </MenuButton>
            <MenuList>
              <Text px={3} py={2} fontSize="sm" fontWeight="bold" color="gray.600">
                Notifiche ({pendingNotifications})
              </Text>
              <MenuDivider />
              {(Array.isArray(notifications) ? notifications : []).slice(0, 5).map((notification, index) => (
                <MenuItem key={index} fontSize="sm">
                  <Box>
                    <Text fontWeight={notification.read ? 'normal' : 'bold'}>
                      {notification.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {notification.message}
                    </Text>
                  </Box>
                </MenuItem>
              ))}
              {notifications?.length === 0 && (
                <MenuItem fontSize="sm" color="gray.500">
                  Nessuna notifica
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem fontSize="sm" fontWeight="bold">
                Visualizza tutte
              </MenuItem>
            </MenuList>
          </Menu>

          {/* User Menu */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              leftIcon={<Avatar size="sm" name="Admin User" />}
            >
              <Text fontSize="sm">Admin</Text>
            </MenuButton>
            <MenuList>
              <MenuItem>Profilo</MenuItem>
              <MenuItem>Impostazioni Account</MenuItem>
              <MenuDivider />
              <MenuItem>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;