import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { db } from '../firebaseConfig'; // Adjust path to your Firebase config
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Header from '../Components/Header';

const POS = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Orders from Firestore
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(''); // Reset error state

    try {
      const ccode = await AsyncStorage.getItem('userCcode');
      
      // Create a query to get orders where 'ccode' equals the stored value
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, where('ccode', '==', ccode));

      // Fetch documents based on the query
      const snapshot = await getDocs(ordersQuery);

      if (!snapshot.empty) {
        const filteredOrders = snapshot.docs
          .map(doc => doc.data())
          .filter(order => order.Confirmed && order.Confirmed.includes('no'));
        
        setData(filteredOrders);
      } else {
        setError('No orders found.');
      }
    } catch (error) {
      setError('Unable to fetch orders from Firestore. Please try again later.');
      console.error('Error fetching orders from Firestore:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.detail}>BA: {item.BA}</Text>
      {/* Add more details here if needed */}
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <Header />
      <View style={styles.scrollContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : data.length === 0 ? (
          <Text style={styles.noDataText}>No unconfirmed orders available.</Text>
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.ID} // Ensure ID is a string
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e0',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  item: {
    padding: 15,
    marginVertical: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  detail: {
    fontSize: 14,
    color: '#1E2A5E',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#1E2A5E',
    marginTop: 20,
  },
});

export default POS;
