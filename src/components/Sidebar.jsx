import React from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard as DashboardIcon, CalendarToday as CalendarIcon, People as PeopleIcon, SupervisorAccount as OperatorIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Citas', icon: <CalendarIcon />, path: '/admin/appointments' },
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Operadores', icon: <OperatorIcon />, path: '/admin/operators' },
  ];

  return (
    <List>
      {items.map((it) => (
        <ListItemButton key={it.path} selected={location.pathname.startsWith(it.path)} onClick={() => navigate(it.path)}>
          <ListItemIcon>{it.icon}</ListItemIcon>
          <ListItemText primary={it.text} />
        </ListItemButton>
      ))}
    </List>
  );
}
