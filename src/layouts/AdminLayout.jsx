import React, { useState, useContext } from 'react';
import { styled } from '@mui/material/styles';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, 
  CssBaseline,
  Drawer as MuiDrawer,
  AppBar as MuiAppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Avatar
  ,Backdrop,CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Logout as LogoutIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as HealthIcon,
  SupervisorAccount as OperatorIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import logoImg from '../assets/logo.jpg';

const drawerWidth = 260;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: '#ffffff',
  color: '#333',
  boxShadow: '0px 1px 10px rgba(0, 0, 0, 0.05)',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // Mejoras de espaciado y alineación del Header
  '& .MuiToolbar-root': {
    display: 'flex',
    alignItems: 'center',
    px: { xs: 1, sm: 2, md: 3 },
  },
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    backgroundColor: '#1a2035',
    color: '#ffffff',
    transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
    }),
  },
  }),
);

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, selected, open }) => ({
  margin: open ? '8px 16px' : '8px 8px',
  borderRadius: '12px',
  justifyContent: open ? 'initial' : 'center',
  paddingLeft: open ? theme.spacing(2) : 'auto',
  paddingRight: open ? theme.spacing(2) : 'auto',
  minHeight: 48,
  '&.Mui-selected': {
    backgroundColor: '#1976d2',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#1565c0',
    },
    '& .MuiListItemIcon-root': {
      color: '#ffffff',
    },
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  '& .MuiListItemIcon-root': {
    color: selected ? '#ffffff' : '#a0aec0',
    minWidth: 0,
    marginRight: open ? theme.spacing(2) : '0',
    justifyContent: 'center',
    width: open ? 'auto' : '100%',
    display: 'flex',
    alignItems: 'center'
  },
  '& .MuiListItemText-primary': {
    fontWeight: selected ? 'bold' : 'normal',
    fontSize: '0.95rem',
    display: open ? 'block' : 'none',
  },
}));

export default function AdminLayout() {
  const { user, logout, hasRole } = useContext(AuthContext);
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const [signingOut, setSigningOut] = React.useState(false);

  const handleLogout = () => {
    setSigningOut(true);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setSigningOut(false);
      navigate('/login', { replace: true });
    };

    const timeout = setTimeout(() => {
      finish();
    }, 5000);

    Promise.resolve()
      .then(() => logout())
      .then(() => {
        clearTimeout(timeout);
        finish();
      })
      .catch(() => {
        clearTimeout(timeout);
        finish();
      });
  };

  if (!user) {
    return <Container sx={{ mt: 15, textAlign: 'center' }}>
      <Typography variant="h4" color="error">Acceso Denegado</Typography>
      <Typography variant="body1">No tienes permisos para ver esta página.</Typography>
    </Container>;
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin', allowedRoles: ['operador', 'supervisor'] },
    { text: 'Citas', icon: <CalendarIcon />, path: '/admin/citas', allowedRoles: ['operador', 'supervisor'] },
    { text: 'Personal de Salud', icon: <HealthIcon />, path: '/admin/personal', allowedRoles: ['operador', 'supervisor'] },
    { text: 'Pacientes', icon: <PeopleIcon />, path: '/admin/pacientes', allowedRoles: ['operador', 'supervisor'] },
    { text: 'Reportes', icon: <InventoryIcon />, path: '/admin/reportes', allowedRoles: ['operador', 'supervisor'] },
    { text: 'Especialidades', icon: <CategoryIcon />, path: '/admin/especialidades', allowedRoles: ['supervisor'] },
    { text: 'Operadores', icon: <OperatorIcon />, path: '/admin/operadores', allowedRoles: ['supervisor'] },
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/users', allowedRoles: ['supervisor'] },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="absolute" open={open}>
        <Toolbar sx={{ pr: '24px' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={open ? toggleDrawer : toggleDrawer}
            sx={{ 
              mr: 2, 
              display: { xs: 'none', md: 'flex' } 
            }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography component="h1" variant="h6" color="#000 !important" sx={{ 
            flexGrow: 1, 
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.25rem' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mr: 1
          }}>
            Panel de Administración
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography component="span" variant="body2" sx={{ mr: 2, fontWeight: 'bold' }}>
              {user?.name}
            </Typography>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 2 }} title="Cerrar Sesión">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open} sx={{ display: { xs: 'none', md: 'block' } }}>
        <Toolbar
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: [1],
            py: 2,
            minHeight: open ? 120 : 80,
            position: 'relative',
            transition: 'all 0.3s ease'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Box 
              component="img"
              src={logoImg}
              alt="Logo"
              sx={{ 
                height: open ? 80 : 40,
                width: 'auto',
                maxWidth: open ? '80%' : '40px',
                objectFit: 'contain',
                transition: 'all 0.3s ease',
                borderRadius: 1
              }}
            />
          </Box>
          <IconButton 
            onClick={toggleDrawer} 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              color: 'white',
              position: 'absolute',
              right: 8,
              bottom: 8,
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              zIndex: 2,
              // Solo mostrar cuando el sidebar está expandido
              visibility: open ? 'visible' : 'hidden',
              opacity: open ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List component="nav" sx={{ mt: 2 }}>
          {menuItems.filter((item) => {
            if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
            return item.allowedRoles.some((r) => hasRole(r));
          }).map((item) => (
            <StyledListItemButton 
              key={item.text}
              open={open}
              onClick={() => navigate(item.path)}
              selected={(() => {
                if (item.path === '/admin') return location.pathname === '/admin';
                return location.pathname.startsWith(item.path);
              })()}
            >
              <ListItemIcon sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ opacity: open ? 1 : 0 }}
              />
            </StyledListItemButton>
          ))}
        </List>
      </Drawer>

      <Backdrop
        open={signingOut}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(0,0,0,0.25)',
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: 'background.paper',
          color: 'text.primary',
          p: 3,
          borderRadius: 2,
          boxShadow: 6,
          minWidth: 220,
        }}>
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2 }}>Cerrando sesión...</Typography>
        </Box>
      </Backdrop>

      <MuiDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            backgroundColor: '#1a2035',
            color: '#ffffff'
          },
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
          <Box 
            component="img"
            src={logoImg}
            alt="Centro Médico de Salud de San Vicente"
            sx={{ 
              height: 100,
              maxWidth: '160px',
              objectFit: 'contain',
              borderRadius: 1
            }}
          />
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List component="nav" sx={{ mt: 2 }}>
          {menuItems.filter((item) => {
            if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
            return item.allowedRoles.some((r) => hasRole(r));
          }).map((item) => (
            <StyledListItemButton 
              key={item.text}
              open={true}
              onClick={() => {
                navigate(item.path);
                handleDrawerToggle();
              }}
              selected={(() => {
                if (item.path === '/admin') return location.pathname === '/admin';
                return location.pathname.startsWith(item.path);
              })()}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 2, display: 'flex', justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </StyledListItemButton>
          ))}
        </List>
      </MuiDrawer>

      <Box
        component="main"
        sx={{
          backgroundColor: '#f5f7fa',
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
