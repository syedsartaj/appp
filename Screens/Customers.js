import React, { useEffect, useState } from 'react';
import Header from '../Components/Header';
import axios from 'axios';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get('https://sartaj.azurewebsites.net/api/unique-users'); // Replace with your API endpoint
        setCustomers(response.data);
      } catch (err) {
        Alert.alert('Error', 'Unable to fetch Customers from the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header />
      {customers.map((customer, index) => (
        <View key={index} style={styles.customerItem}>
          <Text style={styles.customerName}>NAME : {customer.NOC}</Text>
          <Text style={styles.customerPhone}>Phone No. : {customer.PNO}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e0',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
  customerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 5,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color:'#1E2A5E',
  },
  customerPhone: {
    fontSize: 16,
    color: '#1E2A5E',
  },
});

export default Customers;
