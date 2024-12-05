import React, { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../Components/Header';
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';

const Stocks = () => {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [products, setProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productQuantity, setProductQuantity] = useState('');
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchProductsFromFirestore();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const filterProducts = () => {
    let filtered = products;
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };

  const fetchProductsFromFirestore = async () => {
    try {
      const code = await AsyncStorage.getItem('userCcode');
      if (!code) {
        Alert.alert('Code not found');
        return;
      }

      // Query the 'stock' collection using 'ccode'
      const q = query(collection(db, 'stock'), where('ccode', '==', code));
      const querySnapshot = await getDocs(q);
      const productsList = [];
      querySnapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsList);
      setFilteredProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };

  const addOrUpdateProduct = async () => {
    if (!productName || !productPrice || !productQuantity) {
      Alert.alert('Please fill in all fields');
      return;
    }

    const price = parseFloat(productPrice);
    const quantity = parseInt(productQuantity);

    const productData = {
      name: productName,
      price: price,
      quantity: quantity,
    };

    try {
      const code = await AsyncStorage.getItem('userCcode');
      if (!code) {
        Alert.alert('Code not found');
        return;
      }
      productData.ccode = code;

      if (editingProductId) {
        // Update existing product in the 'stock' collection
        const productRef = doc(db, 'stock', editingProductId);
        await updateDoc(productRef, productData);
      } else {
        // Add new product to the 'stock' collection
        await addDoc(collection(db, 'stock'), productData);
      }

      clearInputs();
      fetchProductsFromFirestore();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditProduct = (product) => {
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductQuantity(product.quantity.toString());
    setEditingProductId(product.id);
    setEditModalVisible(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      // Delete product from the 'stock' collection
      const productRef = doc(db, 'stock', id);
      await deleteDoc(productRef);
      fetchProductsFromFirestore();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const clearInputs = () => {
    setProductName('');
    setProductPrice('');
    setProductQuantity('');
    setEditingProductId(null);
    setAddModalVisible(false);
    setEditModalVisible(false);
  };


  return (
    <GestureHandlerRootView style={styles.container}>
    <Header />
    <View style={styles.headerRow}>
      <Text style={styles.headerText}>Stock</Text>
      <TextInput
        placeholderTextColor="#1E2A5E"
        style={styles.input}
        placeholder="Search Stock"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.button}>
        <Icon name="plus" size={20} color="#fff" />
        <Text style={styles.buttonText}> Add Stock</Text>
      </TouchableOpacity>
    </View>

    <FlatList
      data={filteredProducts}
      keyExtractor={(item) => item.id.toString()} // Ensure keyExtractor returns a string
      renderItem={({ item }) => (
        <View style={styles.productItem}>
          <Text style={styles.productText}>{item.name}</Text>
          <Text style={styles.productText}>${item.price.toFixed(2)}</Text>
          <Text style={styles.productText}>Quantity: {item.quantity}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => handleEditProduct(item)} style={styles.action}>
              <Icon name="edit" size={20} color="#1E2A5E" />
            </Pressable>
            <Pressable onPress={() => handleDeleteProduct(item.id)} style={styles.action}>
              <Icon name="trash" size={20} color="red" />
            </Pressable>
          </View>
        </View>
      )}
      contentContainerStyle={styles.listContent}
    />
      {/* Add Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Stock</Text>
              <TextInput
                placeholderTextColor="gray"
                placeholder="Product Name"
                value={productName}
                onChangeText={setProductName}
                style={styles.input}
              />
              <TextInput
                placeholderTextColor="gray"
                placeholder="Product Price"
                value={productPrice}
                onChangeText={setProductPrice}
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                placeholderTextColor="gray"
                placeholder="Product Quantity"
                value={productQuantity}
                onChangeText={setProductQuantity}
                keyboardType="numeric"
                style={styles.input}
              />
              <Pressable style={styles.button} onPress={addOrUpdateProduct}>
                <Text style={styles.buttonText}>Add Stock</Text>
              </Pressable>
              <Pressable onPress={() => setAddModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* Edit Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Stock</Text>
              <TextInput
                placeholderTextColor="gray"
                placeholder="Product Name"
                value={productName}
                onChangeText={setProductName}
                style={styles.input}
              />
              <TextInput
                placeholder="Product Price"
                value={productPrice}
                onChangeText={setProductPrice}
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                placeholder="Product Quantity"
                value={productQuantity}
                onChangeText={setProductQuantity}
                keyboardType="numeric"
                style={styles.input}
              />
              <Pressable style={styles.button} onPress={addOrUpdateProduct}>
                <Text style={styles.buttonText}>Update Stock</Text>
              </Pressable>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e0',
  },
  scrollContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRowa: {
    backgroundColor: '#fff7e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginLeft: 14,
    marginRight: 14,
    marginBottom: 4,
    color:'#333',
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2A5E',
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  action: {
    margin: 10,
  },
  button: {
    backgroundColor: '#1E2A5E',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
  },
  closeText: {
    color: 'red',
    marginTop: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: Dimensions.get('window').width - 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    color: '#1E2A5E',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
  productText: {
    flex: 1,
    color: '#1E2A5E',
  },
});

export default Stocks;