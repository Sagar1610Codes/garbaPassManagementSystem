import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert, Snackbar } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const InviteUserPage = () => {
  const { sendInvitation, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { success, error } = await sendInvitation(email);
      
      if (success) {
        setSuccess(`Invitation sent to ${email}`);
        setEmail('');
      } else {
        setError(error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('An error occurred while sending the invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          You don't have permission to access this page
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Invite New User
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            placeholder="Enter user's email address"
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Instructions
          </Typography>
          <Typography variant="body1" paragraph>
            1. Enter the email address of the user you want to invite
          </Typography>
          <Typography variant="body1" paragraph>
            2. Click "Send Invitation"
          </Typography>
          <Typography variant="body1">
            3. The user will receive an email with a registration link
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default InviteUserPage;
