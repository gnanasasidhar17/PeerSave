// Test script to check API connectivity
const testRegistration = async () => {
  const userData = {
    firstName: "Test",
    lastName: "User",
    username: "testuser123",
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123"
  };

  try {
    console.log('Testing registration API...');
    
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful:', data);
    } else {
      console.log('❌ Registration failed:', data);
    }
  } catch (error) {
    console.error('🔥 Network error:', error);
  }
};

// Run the test
testRegistration();