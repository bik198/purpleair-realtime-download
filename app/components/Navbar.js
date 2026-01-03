'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
          <Button
            color="inherit"
            onClick={() => handleNavigation('/download')}
            variant={pathname === '/download' ? 'outlined' : 'text'}
            sx={{
              color: 'white',
              borderColor: pathname === '/download' ? 'white' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Downloader
          </Button>
          <Button
            color="inherit"
            onClick={() => handleNavigation('/contour-map')}
            variant={pathname === '/contour-map' ? 'outlined' : 'text'}
            sx={{
              color: 'white',
              borderColor: pathname === '/contour-map' ? 'white' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Contour Map
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

