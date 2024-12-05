import React, { useEffect, useState, useCallback } from 'react';
import Header from '../Components/Header';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import debounce from 'lodash.debounce';

const BillPayments = () => {
  const screenWidth = Dimensions.get('window').width;
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const app = getApp(); // Firebase app instance
  const db = getFirestore(app); // Firestore instance

  // Fetch Orders from Firestore
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const ccode = await AsyncStorage.getItem('userCcode');
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, where('ccode', '==', ccode), where('Confirmed', '==', 'yes'));

      const querySnapshot = await getDocs(ordersQuery);
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        ID: doc.id,
      }));

      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Debounced Search Handling
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    debouncedFilterProducts(text);
  };

  // Debounced Product Filtering
  const debouncedFilterProducts = useCallback(
    debounce((query) => {
      const filtered = orders.filter((product) =>
        product.TableNo.toString().includes(query)
      );
      setFilteredOrders(filtered);
    }, 300),
    [orders]
  );

  // Handle Billing Update
  const bill = async () => {
    if (!selectedOrder) {
      alert('No order selected.');
      return;
    }
    try {
      setLoading(true);
      const ccode = await AsyncStorage.getItem('userCcode');

      const orderDocRef = doc(db, 'orders', selectedOrder.ID);
      await updateDoc(orderDocRef, {
        Confirmed: 'no',
        ccode: ccode,
      });

      alert('Order submitted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error submitting order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  return (
    <GestureHandlerRootView style={styles.container}>
      <Header />
      <View style={styles.rows}>
        {/* Left Column: Search and Order List */}
        <View style={[styles.col, { width: screenWidth / 2 + screenWidth / 6 }]}>
          <View style={styles.row}>
            <TextInput
              placeholder="Search Products"
              placeholderTextColor="#1E2A5E"
              style={[styles.input, { flex: 1, marginRight: 5 }]}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#1E2A5E" />
          ) : (
            <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.ID.toString()}
            renderItem={({ item }) => {
                return (
                    <TouchableOpacity
                        onPress={() => setSelectedOrder(item)}
                        style={styles.productItem}
                    >
                        <Text style={styles.productName}>Table {item.TableNo}</Text>
                        <Text style={styles.productPrice}>${item.BA}</Text>
                    </TouchableOpacity>
                );
            }}
            contentContainerStyle={{ paddingBottom: 20 }} // Adjust as needed
        />
          )}
        </View>

        {/* Right Column: Selected Order Details */}
        <View style={[styles.cola, { width: screenWidth / 2 - screenWidth / 6 }]}>
          <Text style={styles.header}>Ordered Food</Text>
          <View style={styles.orderedFoodContainer}>
            {selectedOrder ? (
              <View>
                <Text style={styles.orderedItemName}>Table No: {selectedOrder.TableNo}</Text>
                <Text style={styles.orderedItemPrice}>
                  Total Price: ${selectedOrder.BA || 'N/A'}
                </Text>
                <FlatList
                  data={JSON.parse(selectedOrder.Items || '[]')}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.orderedItem}>
                      <Text style={styles.orderedItemName}>{item.name}</Text>
                      <Text style={styles.orderedItemPrice}>
                        ${item.price?.toFixed(2) || 'N/A'}
                      </Text>
                    </View>
                  )}
                />
              </View>
            ) : (
              <Text>No order selected</Text>
            )}
            <TouchableOpacity onPress={bill} style={styles.productItem}>
              <Text style={styles.productName}>Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e0',
  },
  rows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    flex: 1,  // Ensures the rows container takes available space
  },
  col: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
  },
  cola: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
  },
  orderedFoodContainer: {
    flex: 1,  // Allow this container to take available vertical space
    paddingBottom: 20, // For extra padding
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1E2A5E',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff7e0',
  },
  productItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 5,
    elevation: 2,
  },
  productName: {
    color: '#1E2A5E',
    fontSize: 16,
  },
  productPrice: {
    fontSize: 14,
    color: '#1E2A5E',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E2A5E',
  },
  orderedItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 5,
    elevation: 2,
  },
  orderedItemName: {
    fontSize: 16,
    color: '#1E2A5E',
  },
  orderedItemPrice: {
    color: '#1E2A5E',
    fontSize: 16,
  },
});

export default BillPayments;
