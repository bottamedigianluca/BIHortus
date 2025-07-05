import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Link,
  Tooltip,
  Badge,
  Divider,
  Image
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdAccountBalance,
  MdAnalytics,
  MdSettings,
  MdCloudSync,
  MdNotifications,
  MdHelp,
  MdInventory,
  MdReceipt,
  MdPeople,
  MdDescription,
  MdAttachMoney
} from 'react-icons/md';
import { FiZap } from 'react-icons/fi';

const SidebarItem = ({ icon, label, href, badge, isActive, ...props }) => (
  <Tooltip label={label} placement="right" hasArrow>
    <Link
      as={RouterLink}
      to={href}
      w="full"
      textDecoration="none"
      _hover={{ textDecoration: 'none' }}
      {...props}
    >
      <HStack
        w="full"
        px={4}
        py={3}
        borderRadius="md"
        bg={isActive ? 'brand.500' : 'transparent'}
        color={isActive ? 'white' : 'gray.600'}
        _hover={{
          bg: isActive ? 'brand.600' : 'gray.100',
          color: isActive ? 'white' : 'gray.800'
        }}
        transition="all 0.2s"
      >
        <Icon as={icon} boxSize={5} />
        <Text fontSize="sm" fontWeight="500" flex="1">
          {label}
        </Text>
        {badge && (
          <Badge
            colorScheme={badge.color}
            borderRadius="full"
            px={2}
            py={1}
            fontSize="xs"
          >
            {badge.text}
          </Badge>
        )}
      </HStack>
    </Link>
  </Tooltip>
);

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      icon: MdDashboard,
      label: '🥬 Dashboard',
      href: '/dashboard'
    },
    {
      icon: MdPeople,
      label: '👥 Clienti',
      href: '/customers'
    },
    {
      icon: MdInventory,
      label: '📦 Prodotti',
      href: '/products'
    },
    {
      icon: MdDescription,
      label: '📄 Fatture Attive',
      href: '/invoices/active',
      badge: { text: '12', color: 'orange' }
    },
    {
      icon: MdReceipt,
      label: '📋 Fatture Passive',
      href: '/invoices/passive'
    },
    {
      icon: MdAccountBalance,
      label: '💰 Riconciliazione',
      href: '/reconciliation',
      badge: { text: '5', color: 'red' }
    },
    {
      icon: FiZap,
      label: '⚡ N8N Automazioni',
      href: '/automation'
    },
    {
      icon: MdAnalytics,
      label: '📊 Analytics',
      href: '/analytics'
    }
  ];

  const bottomItems = [
    {
      icon: MdCloudSync,
      label: '☁️ Sincronizzazione',
      href: '/sync',
      badge: { text: '●', color: 'green' }
    },
    {
      icon: MdSettings,
      label: '⚙️ Impostazioni',
      href: '/settings'
    }
  ];

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      w={60}
      h="100vh"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      boxShadow="sm"
      zIndex={1000}
    >
      <VStack spacing={0} align="stretch" h="full">
        {/* Logo */}
        <Box p={6} borderBottom="1px solid" borderColor="gray.200">
          <HStack spacing={3}>
            <Box
              w={10}
              h={10}
              bg="brand.500"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontWeight="bold" fontSize="xl">
                B
              </Text>
            </Box>
            <Box>
              <Text fontWeight="bold" fontSize="lg" color="gray.800">
                BiHortus
              </Text>
              <Text fontSize="xs" color="gray.500">
                Wholesale Intelligence
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Main Navigation */}
        <VStack spacing={1} p={4} flex="1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              badge={item.badge}
              isActive={location.pathname === item.href}
            />
          ))}
        </VStack>

        {/* Divider */}
        <Divider />

        {/* Bottom Navigation */}
        <VStack spacing={1} p={4}>
          {bottomItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={location.pathname === item.href}
            />
          ))}
        </VStack>

        {/* Status Indicator */}
        <Box p={4} borderTop="1px solid" borderColor="gray.200">
          <HStack spacing={2} fontSize="xs" color="gray.500">
            <Box w={2} h={2} bg="green.400" borderRadius="full" />
            <Text>Sistema Attivo</Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Sidebar;