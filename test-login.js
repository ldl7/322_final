const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Attempting to log in with test@example.com...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'testpassword123'
    }, {
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });
    
    console.log('Login successful!');
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    console.log('Access Token:', response.data.accessToken || 'No access token found');
    console.log('User:', response.data.user ? JSON.stringify(response.data.user, null, 2) : 'No user data found');
    return response.data.accessToken;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Status code:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    console.error('Error config:', error.config);
    throw error;
  }
};

// Run the test
if (require.main === module) {
  testLogin().catch(console.error);
}

module.exports = testLogin;
