import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { loginApi, registerApi } from '../api/authApi';
import { saveAuth } from '../utils/authStorage';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: 'success' | 'error';
    message: string;
  }>({
    open: false,
    severity: 'success',
    message: '',
  });

  const showMessage = (severity: 'success' | 'error', message: string) => {
    setSnackbar({ open: true, severity, message });
  };

  const handleSubmit = async () => {
    const safeUsername = username.trim();
    const safePassword = password.trim();

    if (!safeUsername || !safePassword) {
      showMessage('error', 'Username and password are required');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await registerApi({ username: safeUsername, password: safePassword });
        showMessage('success', 'Register success, now login');
        setMode('login');
        setPassword('');
      } else {
        const data = await loginApi({ username: safeUsername, password: safePassword });
        saveAuth(data.token, data.user.username);
        navigate('/home');
      }
    } catch {
      showMessage('error', 'Request failed, check credentials or backend status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Weather Checker
          </Typography>

          <Tabs
            value={mode}
            onChange={(_, value: 'login' | 'register') => setMode(value)}
          >
            <Tab label="Login" value="login" />
            <Tab label="Register" value="register" />
          </Tabs>

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />

          <Box>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} fullWidth>
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
